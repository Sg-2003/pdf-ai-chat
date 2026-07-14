import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { MessageSquare, Upload, Zap, Sparkles, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#030014] text-zinc-100 overflow-hidden relative">
      {/* Background radial glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/10 blur-[120px] pointer-events-none" />
      
      <Navbar />

      {/* Hero Section */}
      <main className="flex-grow flex flex-col items-center justify-center text-center px-4 py-20 sm:px-6 lg:px-8 relative z-10">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/20 bg-purple-950/30 px-4 py-1.5 text-sm text-purple-300 backdrop-blur-md mb-8 animate-fade-in">
          <Sparkles className="h-4 w-4 text-purple-400" />
          Powered by Gemini AI & MongoDB Vector Search
        </div>

        <h1 className="max-w-4xl text-4xl font-extrabold sm:text-6xl tracking-tight bg-gradient-to-b from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent leading-[1.1] mb-6 animate-fade-in">
          Transform Your PDFs into{' '}
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
            Interactive Conversations
          </span>
        </h1>

        <p className="max-w-2xl text-lg text-zinc-450 mb-10 leading-relaxed animate-fade-in" style={{ animationDelay: '0.1s' }}>
          Upload study guides, textbooks, contracts, or research papers. Ask questions, get instant summaries, and receive answers anchored directly to the source pages.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <Link
            href="/signup"
            className="group flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-4 text-base font-semibold text-white transition-all hover:from-purple-500 hover:to-indigo-500 hover:shadow-lg hover:shadow-purple-500/25 active:scale-98"
          >
            Get Started Free
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/login"
            className="flex items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950/40 px-8 py-4 text-base font-semibold text-zinc-300 hover:bg-zinc-900/60 hover:text-white transition-all"
          >
            Sign In
          </Link>
        </div>

        {/* Feature Grid */}
        <section className="mx-auto max-w-6xl mt-32 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 text-left">
          {/* Feature 1 */}
          <div className="rounded-2xl border border-purple-950/20 bg-zinc-950/40 p-8 backdrop-blur-md transition-all hover:border-purple-800/40 hover:bg-zinc-950/60 hover:-translate-y-1">
            <div className="h-12 w-12 rounded-xl bg-purple-900/20 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-6">
              <Upload className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">Drag & Drop Upload</h3>
            <p className="text-zinc-400 text-sm leading-relaxed font-light">
              Upload multiple PDFs seamlessly. Handles textbooks, contracts, and financial reports, parsing text instantly.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="rounded-2xl border border-purple-950/20 bg-zinc-950/40 p-8 backdrop-blur-md transition-all hover:border-purple-800/40 hover:bg-zinc-950/60 hover:-translate-y-1">
            <div className="h-12 w-12 rounded-xl bg-indigo-900/20 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">RAG-powered AI Chat</h3>
            <p className="text-zinc-400 text-sm leading-relaxed font-light">
              Ask questions naturally. The AI scans the document's vector index in MongoDB and synthesizes answers derived solely from your file.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="rounded-2xl border border-purple-950/20 bg-zinc-950/40 p-8 backdrop-blur-md transition-all hover:border-purple-800/40 hover:bg-zinc-950/60 hover:-translate-y-1">
            <div className="h-12 w-12 rounded-xl bg-pink-900/20 border border-pink-500/20 flex items-center justify-center text-pink-400 mb-6">
              <MessageSquare className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">Page Citations</h3>
            <p className="text-zinc-400 text-sm leading-relaxed font-light">
              Never worry about AI hallucinations. Get verified page numbers and snippet references for every answer.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-900/50 py-8 text-center text-sm text-zinc-500 relative z-10">
        &copy; {new Date().getFullYear()} PDFChat.AI. Built for portfolio presentation. All rights reserved.
      </footer>
    </div>
  );
}
