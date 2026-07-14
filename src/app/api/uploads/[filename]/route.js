import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import path from 'path';
import { promises as fs } from 'fs';
import { verifyJWT } from '@/lib/auth';

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

    const filePath = path.join(process.cwd(), 'public', 'uploads', filename);

    try {
      await fs.access(filePath);
    } catch {
      return new Response('PDF File Not Found', { status: 404 });
    }

    // Read file from disk
    const fileBuffer = await fs.readFile(filePath);

    // Return PDF stream directly
    return new Response(fileBuffer, {
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
