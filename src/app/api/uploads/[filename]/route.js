import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/auth';
import connectDB from '@/lib/db';
import Document from '@/models/Document';

export async function GET(request, { params }) {
  try {
    const { filename } = await params;
    
    // Security check: verify user is authenticated before serving files
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) {
      return new Response('Unauthorized: Missing session token', { status: 401 });
    }
    
    const decoded = await verifyJWT(token);
    if (!decoded) {
      return new Response('Unauthorized: Invalid session token', { status: 401 });
    }

    await connectDB();
    const doc = await Document.findOne({ filePath: `/uploads/${filename}` });

    if (!doc || !doc.pdfData) {
      return new Response('PDF File Not Found', { status: 404 });
    }

    // Return PDF stream directly
    return new Response(doc.pdfData, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline',
      },
    });
  } catch (error) {
    console.error('File serving route error:', error);
    return new Response('Server Error serving file', { status: 500 });
  }
}
