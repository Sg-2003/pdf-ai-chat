import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import path from 'path';
import { promises as fs } from 'fs';
import connectDB from '@/lib/db';
import Document from '@/models/Document';
import Chunk from '@/models/Chunk';
import ChatSession from '@/models/ChatSession';
import Message from '@/models/Message';
import { verifyJWT } from '@/lib/auth';

export async function DELETE(request, { params }) {
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

    // Verify document belongs to the active user
    const doc = await Document.findOne({ _id: id, userId });
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // 1. Delete physical file on disk
    if (doc.filePath) {
      const fullPath = path.join(process.cwd(), 'public', doc.filePath);
      await fs.unlink(fullPath).catch((err) => {
        console.warn(`Could not delete file at ${fullPath}:`, err.message);
      });
    }

    // 2. Delete document record
    await Document.deleteOne({ _id: id });

    // 3. Delete document chunks & embeddings
    await Chunk.deleteMany({ documentId: id });

    // 4. Delete associated chat sessions and their messages
    const sessions = await ChatSession.find({ documentId: id });
    const sessionIds = sessions.map((s) => s._id);

    await Message.deleteMany({ sessionId: { $in: sessionIds } });
    await ChatSession.deleteMany({ documentId: id });

    return NextResponse.json(
      { message: 'Document and all associated data deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete document route error:', error);
    return NextResponse.json(
      { error: 'Server error deleting document' },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const { filename } = await request.json();
    
    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
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

    // Update document filename
    const doc = await Document.findOneAndUpdate(
      { _id: id, userId },
      { filename },
      { new: true }
    );

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json(
      { message: 'Document renamed successfully', document: doc },
      { status: 200 }
    );
  } catch (error) {
    console.error('Rename document route error:', error);
    return NextResponse.json(
      { error: 'Server error renaming document' },
      { status: 500 }
    );
  }
}
