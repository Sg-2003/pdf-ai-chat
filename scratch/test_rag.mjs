import fs from 'fs';
import path from 'path';

// 1. Manually load environment variables FIRST before importing other modules
try {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split(/\r?\n/).forEach((line) => {
      const cleanLine = line.trim();
      if (!cleanLine || cleanLine.startsWith('#')) return;
      const index = cleanLine.indexOf('=');
      if (index === -1) return;
      const key = cleanLine.substring(0, index).trim();
      const val = cleanLine.substring(index + 1).trim();
      process.env[key] = val;
    });
    console.log('Loaded environment variables from .env.local');
  }
} catch (err) {
  console.error('Error reading .env.local:', err.message);
}

// 2. Dynamically import modules now that environment variables are populated
const { default: connectDB } = await import('../src/lib/db.js');
const { getEmbedding } = await import('../src/lib/gemini.js');

async function runDiagnostics() {
  console.log('\n--- PDF CHAT WITH AI DIAGNOSTIC CHECK ---');
  
  // Verify configuration keys
  console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Defined' : 'UNDEFINED');
  console.log('JWT Secret:', process.env.JWT_SECRET ? 'Defined' : 'UNDEFINED');
  console.log('Gemini API Key:', process.env.GEMINI_API_KEY ? 'Defined' : 'UNDEFINED');

  if (!process.env.GEMINI_API_KEY) {
    console.error('Error: GEMINI_API_KEY environment variable is missing.');
    process.exit(1);
  }

  // Validate database connection
  console.log('\n[1/2] Connecting to MongoDB...');
  try {
    const conn = await connectDB();
    console.log(`SUCCESS: Connected to database. State: ${conn.readyState} (1 = Connected)`);
  } catch (dbErr) {
    console.error('FAILED: MongoDB Connection Failed:', dbErr.message);
  }

  // Validate Gemini API Key & Embeddings model
  console.log('\n[2/2] Call Gemini text-embedding-004 API...');
  try {
    const testText = 'Hello Gemini vector search pipeline diagnostic test';
    const vector = await getEmbedding(testText);
    if (vector && vector.length > 0) {
      console.log('SUCCESS: API Call completed successfully.');
      console.log(`Vector dimension size: ${vector.length}`);
      console.log(`Sample vector values: [${vector.slice(0, 5).join(', ')}, ...]`);
    } else {
      console.error('FAILED: API returned empty or invalid embedding vector.');
    }
  } catch (apiErr) {
    console.error('FAILED: Gemini API Authentication/Call Failed:', apiErr.message);
  }

  console.log('\n-----------------------------------------\n');
  process.exit(0);
}

runDiagnostics().catch((err) => {
  console.error('Diagnostics crashed with error:', err);
  process.exit(1);
});
