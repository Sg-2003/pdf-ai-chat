import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { getEmbedding } from '@/lib/gemini';

export async function GET() {
  const checks = {
    mongodb: 'unknown',
    geminiApiKey: 'unknown',
    geminiEmbeddings: 'unknown',
  };

  // 1. Validate MongoDB connection state
  try {
    const conn = await connectDB();
    const readyState = conn.connection?.readyState ?? conn.readyState;
    if (readyState === 1) {
      checks.mongodb = 'connected';
    } else {
      checks.mongodb = `disconnected (state code: ${readyState})`;
    }
  } catch (err) {
    checks.mongodb = `failed: ${err.message}`;
  }

  // 2. Validate Gemini API credentials and embedding service
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    checks.geminiApiKey = 'missing';
    checks.geminiEmbeddings = 'skipped';
  } else {
    checks.geminiApiKey = 'present';
    try {
      const emb = await getEmbedding('Verification text test');
      if (emb && emb.length > 0) {
        checks.geminiEmbeddings = `success (${emb.length} dimensions)`;
      } else {
        checks.geminiEmbeddings = 'failed (returned empty vector values)';
      }
    } catch (err) {
      checks.geminiEmbeddings = `failed: ${err.message}`;
    }
  }

  const isAllGreen =
    checks.mongodb === 'connected' && checks.geminiEmbeddings.startsWith('success');

  return NextResponse.json(
    {
      success: isAllGreen,
      checks,
    },
    { status: isAllGreen ? 200 : 500 }
  );
}
