import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db';
import ChatSession from '@/models/ChatSession';
import Message from '@/models/Message';
import Chunk from '@/models/Chunk';
import { verifyJWT } from '@/lib/auth';
import { getEmbedding, cosineSimilarity, getChatCompletion } from '@/lib/gemini';

export async function POST(request) {
  try {
    const { message, sessionId, mode = 'strict' } = await request.json();
    if (!message || !sessionId) {
      return NextResponse.json(
        { error: 'Message and sessionId are required fields' },
        { status: 400 }
      );
    }

    console.log(`[RAG Chat] Request received. Session: ${sessionId}, Mode: ${mode}, Message: "${message}"`);

    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) {
      console.log('[RAG Chat] Unauthorized: Missing token');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const decoded = await verifyJWT(token);
    if (!decoded) {
      console.log('[RAG Chat] Unauthorized: Invalid token');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = decoded.userId;

    await connectDB();

    // 1. Verify session ownership
    const session = await ChatSession.findOne({ _id: sessionId, userId });
    if (!session) {
      console.log('[RAG Chat] Chat session not found in DB');
      return NextResponse.json({ error: 'Chat session not found' }, { status: 404 });
    }

    // 2. Embed user question
    console.log('[RAG Chat] Embedding user question...');
    let questionEmbedding;
    try {
      questionEmbedding = await getEmbedding(message);
    } catch (embError) {
      console.error('[RAG Chat] Failed to embed question:', embError);
      return NextResponse.json({ error: 'Failed to process question text' }, { status: 500 });
    }

    // 3. Fetch all chunks for this PDF document
    const chunks = await Chunk.find({ documentId: session.documentId });
    console.log(`[RAG Chat] Retrieved ${chunks.length} chunks from MongoDB for this document`);
    if (chunks.length === 0) {
      return NextResponse.json(
        { error: 'This document has no indexed text chunks. Please re-upload.' },
        { status: 400 }
      );
    }

    // 4. Similarity scoring using cosine similarity
    const scoredChunks = chunks.map((chunk) => {
      const similarity = cosineSimilarity(questionEmbedding, chunk.embedding);
      return { chunk, similarity };
    });

    // Sort by highest similarity
    scoredChunks.sort((a, b) => b.similarity - a.similarity);

    // Print out similarity scores for diagnostics
    console.log('[RAG Chat] Similarity scores calculated:');
    scoredChunks.slice(0, 10).forEach((sc, i) => {
      console.log(`  Rank ${i + 1}: Page ${sc.chunk.pageNumber} - Score: ${sc.similarity.toFixed(4)} - Snippet: "${sc.chunk.text.substring(0, 60)}..."`);
    });

    // Pick top 4 relevant chunks
    const topScored = scoredChunks.slice(0, 4);
    const relevantChunks = topScored.map((item) => item.chunk);

    // 5. Construct context text
    const contextText = relevantChunks
      .map((c) => `[Source Page ${c.pageNumber}]:\n${c.text}`)
      .join('\n\n---\n\n');

    // 6. System instructions specifying prompt rules based on mode
    let systemPrompt;
    if (mode === 'strict') {
      systemPrompt = `You are an AI assistant.

Answer ONLY using the provided PDF context.

If the answer is not found in the context, reply exactly:
"I couldn't find this information in the uploaded document."

Context:
${contextText}`;
    } else {
      systemPrompt = `You are an AI assistant.
You have access to the text context of the uploaded PDF:
---
${contextText}
---
Answer the user's question. 
If the answer is found in the PDF context, answer using the PDF context and reference the source pages.
If the answer is NOT found in the PDF context, clearly state that this information is not explicitly mentioned in the uploaded document, and then provide a comprehensive answer using your general knowledge.`;
    }

    // 7. Get conversation history for continuity
    const history = await Message.find({ sessionId }).sort({ createdAt: 1 }).limit(8);

    // Format logs
    const formattedHistory = history.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Add current user prompt
    formattedHistory.push({
      role: 'user',
      content: message,
    });

    // 8. Generate response from Gemini
    console.log('[RAG Chat] Sending context & question to Gemini...');
    let aiResponseText;
    try {
      aiResponseText = await getChatCompletion(formattedHistory, systemPrompt);
      console.log(`[RAG Chat] Gemini responded: "${aiResponseText.trim()}"`);
    } catch (genError) {
      console.error('[RAG Chat] Gemini content generation failed:', genError);
      return NextResponse.json({ error: 'AI synthesis failed' }, { status: 500 });
    }

    // 9. Save messages in DB
    const userMsg = await Message.create({
      sessionId,
      role: 'user',
      content: message,
    });

    // Match citations details to include page numbers and snippets
    const assistantMsg = await Message.create({
      sessionId,
      role: 'assistant',
      content: aiResponseText,
      sources: relevantChunks.map((c) => ({
        pageNumber: c.pageNumber,
        text: c.text,
      })),
    });

    // Update session timestamp for sorting
    session.updatedAt = new Date();
    await session.save();

    return NextResponse.json(
      {
        userMessage: userMsg,
        assistantMessage: assistantMsg,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Chat endpoint error:', error);
    return NextResponse.json(
      { error: 'Server error processing chat request' },
      { status: 500 }
    );
  }
}
