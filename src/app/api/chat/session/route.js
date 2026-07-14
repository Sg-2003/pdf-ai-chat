import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db';
import ChatSession from '@/models/ChatSession';
import Document from '@/models/Document';
import { verifyJWT } from '@/lib/auth';

export async function POST(request) {
  try {
    const { documentId } = await request.json();
    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

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

    // Verify document ownership
    const doc = await Document.findOne({ _id: documentId, userId });
    if (!doc) {
      return NextResponse.json({ error: 'Document not found or access denied' }, { status: 404 });
    }

    // Create a new chat session
    const session = await ChatSession.create({
      userId,
      documentId,
      title: `Session: ${doc.filename}`,
    });

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    console.error('Create chat session error:', error);
    return NextResponse.json({ error: 'Server error creating chat session' }, { status: 500 });
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

    // Fetch and populate sessions
    const sessions = await ChatSession.find({ userId })
      .populate('documentId', 'filename filePath')
      .sort({ updatedAt: -1 });

    return NextResponse.json({ sessions }, { status: 200 });
  } catch (error) {
    console.error('GET chat sessions error:', error);
    return NextResponse.json({ error: 'Server error retrieving sessions' }, { status: 500 });
  }
}
