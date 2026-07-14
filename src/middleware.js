import { NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';

export async function middleware(request) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // Protect dashboard and chat UI routes
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/chat')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    const verified = await verifyJWT(token);
    if (!verified) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('token');
      return response;
    }
  }

  // Protect internal API routes
  if (
    pathname.startsWith('/api/') &&
    !pathname.startsWith('/api/auth/') &&
    pathname !== '/api/setup-check'
  ) {
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
    }
    const verified = await verifyJWT(token);
    if (!verified) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }
  }

  // Redirect logged-in users away from login/signup
  if (pathname === '/login' || pathname === '/signup') {
    if (token) {
      const verified = await verifyJWT(token);
      if (verified) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/chat/:path*',
    '/api/:path*',
    '/login',
    '/signup',
  ],
};
