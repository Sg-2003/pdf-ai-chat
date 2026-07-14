import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db';
import ChatSession from '@/models/ChatSession';
import Document from '@/models/Document';
import Message from '@/models/Message';
import { verifyJWT } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
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

    // 1. Fetch chat session
    const session = await ChatSession.findOne({ _id: id, userId });
    if (!session) {
      return NextResponse.json({ error: 'Chat session not found' }, { status: 404 });
    }

    // 2. Fetch associated PDF document
    const document = await Document.findById(session.documentId);
    if (!document) {
      return NextResponse.json({ error: 'Associated document not found' }, { status: 404 });
    }

    // 3. Fetch message history
    const messages = await Message.find({ sessionId: id }).sort({ createdAt: 1 });

    return NextResponse.json(
      {
        session,
        document,
        messages,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET session details error:', error);
    return NextResponse.json(
      { error: 'Server error retrieving session details' },
      { status: 500 }
    );
  }
}
