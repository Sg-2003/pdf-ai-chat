import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import path from 'path';
import { promises as fs } from 'fs';
import connectDB from '@/lib/db';
import Document from '@/models/Document';
import Chunk from '@/models/Chunk';
import { verifyJWT } from '@/lib/auth';
import { extractPagesFromPDF, chunkTextPages } from '@/lib/pdf';
import { getEmbedding, getBatchEmbeddings } from '@/lib/gemini';

export async function POST(request) {
  let filePathToCleanup = null;
  try {
    console.log('[Upload API] Request received');
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) {
      console.log('[Upload API] Unauthorized: Missing token');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const decoded = await verifyJWT(token);
    if (!decoded) {
      console.log('[Upload API] Unauthorized: Invalid token');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = decoded.userId;

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      console.log('[Upload API] Missing file in request');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log(`[Upload API] File received: ${file.name} (${file.size} bytes)`);

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      console.log('[Upload API] Invalid file type (must be PDF)');
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Set up unique filename
    const uniqueFilename = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    
    // 1. Parse text from PDF page-by-page
    console.log('[Upload API] Extracting text page-by-page from PDF...');
    let pages;
    try {
      pages = await extractPagesFromPDF(buffer);
      console.log(`[Upload API] PDF parsed. Total pages: ${pages.length}`);
    } catch (parseError) {
      console.error('[Upload API] PDF extraction failed:', parseError);
      return NextResponse.json({ error: 'Failed to extract text from PDF file' }, { status: 400 });
    }

    // 2. Chunk text pages
    console.log('[Upload API] Chunking page texts...');
    const textChunks = chunkTextPages(pages);
    console.log(`[Upload API] Text chunked. Total chunks generated: ${textChunks.length}`);

    if (textChunks.length === 0) {
      console.log('[Upload API] PDF has no extractable text content');
      return NextResponse.json({ error: 'The PDF has no extractable text content' }, { status: 400 });
    }

    console.log('[Upload API] Connecting to MongoDB...');
    await connectDB();

    // Create document metadata entry in MongoDB
    console.log('[Upload API] Creating document entry in MongoDB...');
    const doc = await Document.create({
      userId,
      filename: file.name,
      filePath: `/uploads/${uniqueFilename}`,
      fileSize: file.size,
      chunkCount: textChunks.length,
      pdfData: buffer,
    });

    // 3. Generate embeddings in optimized batches
    console.log(`[Upload API] Requesting batch vector embeddings for ${textChunks.length} chunks from Gemini API...`);
    const texts = textChunks.map((c) => c.text);
    const embeddings = await getBatchEmbeddings(texts);
    console.log('[Upload API] Batch embeddings generated successfully!');

    const chunksToInsert = textChunks.map((chunk, index) => ({
      documentId: doc._id,
      userId: userId,
      text: chunk.text,
      pageNumber: chunk.pageNumber,
      embedding: embeddings[index],
    }));
    
    // Save chunks to MongoDB in a single batch
    console.log('[Upload API] Inserting chunks into MongoDB...');
    await Chunk.insertMany(chunksToInsert);
    console.log('[Upload API] Indexing complete! Document fully indexed.');

    return NextResponse.json(
      {
        message: 'Document processed and indexed successfully',
        document: doc,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Upload API] Crash error:', error);
    return NextResponse.json(
      { error: 'Server error processing file upload' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const decoded = await verifyJWT(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = decoded.userId;

    await connectDB();
    const documents = await Document.find({ userId }).sort({ createdAt: -1 });

    return NextResponse.json({ documents }, { status: 200 });
  } catch (error) {
    console.error('GET documents error:', error);
    return NextResponse.json({ error: 'Server error retrieving documents' }, { status: 500 });
  }
}
