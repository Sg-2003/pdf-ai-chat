'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BookOpen, LogOut, LayoutDashboard, User } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const [session, setSession] = useState({ authenticated: false, loading: true, user: null });

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setSession({
            authenticated: data.authenticated,
            loading: false,
            user: data.user,
          });
        } else {
          setSession({ authenticated: false, loading: false, user: null });
        }
      } catch (err) {
        setSession({ authenticated: false, loading: false, user: null });
      }
    }
    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        setSession({ authenticated: false, loading: false, user: null });
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <nav className="border-b border-purple-950/40 bg-zinc-950/60 backdrop-blur-md sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <BookOpen className="h-6 w-6 text-purple-500 transition-transform group-hover:scale-110" />
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-xl font-bold text-transparent">
                PDFChat.AI
              </span>
            </Link>
          </div>

          {/* Right Navigation */}
          <div className="flex items-center gap-4">
            {session.loading ? (
              <div className="h-8 w-20 animate-pulse rounded bg-zinc-900" />
            ) : session.authenticated ? (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1.5 rounded-lg border border-purple-900/40 bg-purple-950/20 px-4 py-1.5 text-sm font-medium text-purple-300 transition-all hover:bg-purple-900/30 hover:border-purple-800/60"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
                <div className="hidden sm:flex items-center gap-1 text-sm text-zinc-400 border-l border-zinc-900/60 pl-4">
                  <User className="h-4 w-4 text-zinc-500" />
                  <span className="truncate max-w-[120px]">{session.user?.name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 rounded-lg border border-zinc-800 px-3.5 py-1.5 text-sm font-medium text-zinc-400 transition-all hover:bg-zinc-900 hover:text-zinc-200"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-200"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white transition-all hover:from-purple-500 hover:to-indigo-500 hover:shadow-lg hover:shadow-purple-500/20"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
