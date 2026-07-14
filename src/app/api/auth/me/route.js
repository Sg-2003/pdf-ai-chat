import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { verifyJWT } from '@/lib/auth';

export async function GET(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }
    
    const decoded = await verifyJWT(token);
    if (!decoded) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }
    
    await connectDB();
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }
    
    return NextResponse.json(
      {
        authenticated: true,
        user: { id: user._id, name: user.name, email: user.email },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
