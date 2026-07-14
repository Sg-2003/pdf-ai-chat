import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Helper to obtain initialized Google Generative AI client.
 */
function getGenAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not defined in the environment variables.');
  }
  return new GoogleGenerativeAI(apiKey);
}

/**
 * Generate 3072-dimensional vector embedding for a given text using gemini-embedding-2.
 */
export async function getEmbedding(text) {
  try {
    const genAI = getGenAIClient();
    const model = genAI.getGenerativeModel({ model: 'gemini-embedding-2' });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Generate vector embeddings for multiple texts using gemini-embedding-2 in batches.
 * Limits batch size to 100 (Gemini API limit) and processes them sequentially.
 */
export async function getBatchEmbeddings(texts) {
  try {
    const genAI = getGenAIClient();
    const model = genAI.getGenerativeModel({ model: 'gemini-embedding-2' });
    
    const batchSize = 100;
    const results = [];
    
    for (let i = 0; i < texts.length; i += batchSize) {
      const textBatch = texts.slice(i, i + batchSize);
      const requests = textBatch.map((text) => ({
        model: 'models/gemini-embedding-2',
        content: { role: 'user', parts: [{ text }] },
      }));
      
      const response = await model.batchEmbedContents({ requests });
      const embeddings = response.embeddings.map((e) => e.values);
      results.push(...embeddings);
    }
    
    return results;
  } catch (error) {
    console.error('Error generating batch embeddings:', error);
    throw error;
  }
}

/**
 * Calculate Cosine Similarity between two numeric vectors.
 */
export function cosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length) {
    return 0;
  }
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) {
    return 0;
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Get generative AI response using gemini-2.5-flash with a system prompt and conversation context.
 * Automatically translates Standard Roles ('assistant') to Gemini SDK Roles ('model').
 */
export async function getChatCompletion(messages, systemInstruction) {
  try {
    const genAI = getGenAIClient();
    
    // Set up model with optional system instructions
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: systemInstruction,
    });

    // Format chat messages
    const contents = messages.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const result = await model.generateContent({
      contents: contents,
    });
    
    return result.response.text();
  } catch (error) {
    console.error('Error generating chat completion:', error);
    throw error;
  }
}
