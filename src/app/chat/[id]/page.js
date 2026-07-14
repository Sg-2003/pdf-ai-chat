'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, ArrowLeft, Send, Sparkles, AlertCircle, Loader2, FileText, ChevronRight, MessageSquare, ExternalLink } from 'lucide-react';
import Navbar from '@/components/Navbar';

export default function ChatScreen() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id;
  
  const [session, setSession] = useState(null);
  const [document, setDocument] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Question input state
  const [question, setQuestion] = useState('');
  const [sending, setSending] = useState(false);
  
  // Page indicator for PDF hash iframe navigation
  const [pdfPage, setPdfPage] = useState(1);
  const [sidebarDocs, setSidebarDocs] = useState([]);
  const [sidebarChats, setSidebarChats] = useState([]);
  const [chatMode, setChatMode] = useState('hybrid');

  const messagesEndRef = useRef(null);

  const getIframeSrc = (filePath) => {
    if (!filePath) return '';
    return filePath.replace(/^\/uploads\//, '/api/uploads/');
  };

  const fetchSessionDetails = async () => {
    try {
      const res = await fetch(`/api/chat/session/${sessionId}`);
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to load conversation details.');
      }
      const data = await res.json();
      setSession(data.session);
      setDocument(data.document);
      setMessages(data.messages || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSidebarData = async () => {
    try {
      const [docsRes, chatsRes] = await Promise.all([
        fetch('/api/documents'),
        fetch('/api/chat/session')
      ]);
      if (docsRes.ok && chatsRes.ok) {
        const docsData = await docsRes.json();
        const chatsData = await chatsRes.json();
        setSidebarDocs(docsData.documents || []);
        setSidebarChats((chatsData.sessions || []).filter(s => s._id !== sessionId));
      }
    } catch (err) {
      console.error('Failed to load sidebar data:', err);
    }
  };

  useEffect(() => {
    if (sessionId) {
      setLoading(true);
      fetchSessionDetails();
      fetchSidebarData();
    }
  }, [sessionId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!question.trim() || sending) return;

    const userQuery = question.trim();
    setQuestion('');
    setSending(true);
    setError('');

    // Optimistically add user query to messages
    const tempUserMsg = {
      _id: Date.now().toString(),
      role: 'user',
      content: userQuery,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userQuery, sessionId, mode: chatMode }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to get AI response');
      }

      setMessages((prev) => [...prev, data.assistantMessage]);
    } catch (err) {
      setError(err.message || 'Connection lost. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const startNewChat = async (docId) => {
    try {
      const res = await fetch('/api/chat/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: docId }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/chat/${data.session._id}`);
      }
    } catch (error) {
      console.error('Failed to start chat session:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-[#030014] text-zinc-150 items-center justify-center flex-col gap-4">
        <Loader2 className="h-10 w-10 text-purple-500 animate-spin" />
        <p className="text-zinc-400 text-sm">Preparing PDF workspace & loading history...</p>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="flex h-screen bg-[#030014] text-zinc-150 items-center justify-center flex-col p-4 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4 animate-pulse" />
        <h3 className="text-lg font-bold text-white mb-2">Workspace Error</h3>
        <p className="text-zinc-450 max-w-md mb-6">{error}</p>
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-1.5 rounded-lg bg-zinc-900 border border-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white focus:outline-none"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#030014] text-zinc-150 overflow-hidden">
      <Navbar />

      <div className="flex flex-grow overflow-hidden relative">
        
        {/* Left Sidebar (ChatGPT-like navigation drawer) */}
        <aside className="hidden lg:flex flex-col w-64 border-r border-zinc-900/80 bg-zinc-950/20 shrink-0 overflow-y-auto p-4 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-900/50">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-purple-400 transition-colors focus:outline-none"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Exit Workspace
            </button>
          </div>

          {/* Active PDF Information Card */}
          {document && (
            <div className="p-3.5 bg-purple-950/10 border border-purple-900/40 rounded-xl">
              <span className="text-[10px] uppercase font-bold tracking-wider text-purple-400">Active PDF</span>
              <h4 className="font-semibold text-white text-xs truncate mt-1" title={document.filename}>
                {document.filename}
              </h4>
              <p className="text-[10px] text-zinc-550 mt-0.5">{document.chunkCount} vector indexes</p>
            </div>
          )}

          {/* Document switcher list */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 block mb-1">Your Documents</span>
            <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
              {sidebarDocs.map((doc) => (
                <button
                  key={doc._id}
                  onClick={() => startNewChat(doc._id)}
                  className={`w-full text-left text-xs p-2 rounded-lg truncate block transition-all focus:outline-none ${
                    doc._id === document?._id
                      ? 'bg-purple-950/20 border border-purple-900/40 text-purple-300 font-medium'
                      : 'hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {doc.filename}
                </button>
              ))}
            </div>
          </div>

          {/* Recent sessions log */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 block mb-1">Recent Chats</span>
            <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
              {sidebarChats.map((ch) => (
                <button
                  key={ch._id}
                  onClick={() => router.push(`/chat/${ch._id}`)}
                  className="w-full text-left text-xs p-2 rounded-lg text-zinc-450 hover:bg-zinc-900 hover:text-zinc-200 truncate transition-all flex items-center gap-1.5 focus:outline-none"
                >
                  <MessageSquare className="h-3 w-3 text-zinc-600 shrink-0" />
                  <span className="truncate">{ch.title.replace('Session: ', '')}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Workspace Split Panels */}
        <main className="flex-grow flex overflow-hidden">
          
          {/* Left panel: PDF document iframe container */}
          <section className="hidden md:flex flex-col w-1/2 p-4 border-r border-zinc-900/50 bg-zinc-950/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-purple-400" />
                Document Viewer
              </span>
              <span className="text-[10px] bg-zinc-900 text-zinc-500 border border-zinc-800 px-2 py-0.5 rounded-full">
                Interactive Viewer
              </span>
            </div>
            <div className="flex-grow rounded-2xl overflow-hidden border border-zinc-900/50 bg-zinc-950/60 relative">
              {document ? (
                <iframe
                  src={`${getIframeSrc(document.filePath)}#page=${pdfPage}`}
                  key={`${getIframeSrc(document.filePath)}-${pdfPage}`}
                  className="w-full h-full border-0 rounded-2xl"
                  title="PDF Viewer"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-zinc-550">
                  No PDF loaded.
                </div>
              )}
            </div>
          </section>

          {/* Right panel: Chat UI */}
          <section className="w-full md:w-1/2 flex flex-col h-full bg-[#030014]">
            
            {/* Session details Header */}
            <header className="px-4 py-3.5 border-b border-zinc-900/80 bg-zinc-950/40 flex items-center justify-between shrink-0">
              <div className="min-w-0 pr-4 flex items-center gap-2">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="p-1.5 hover:bg-zinc-900 rounded-lg text-zinc-450 hover:text-zinc-200 transition-colors md:hidden focus:outline-none"
                >
                  <ArrowLeft className="h-4.5 w-4.5" />
                </button>
                <div className="min-w-0">
                  <h3 className="font-bold text-white text-sm sm:text-base truncate" title={document?.filename}>
                    {document?.filename}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-purple-400 font-semibold flex items-center gap-1 shrink-0">
                      <Sparkles className="h-3 w-3 text-purple-400" />
                      Mode:
                    </span>
                    <select
                      value={chatMode}
                      onChange={(e) => setChatMode(e.target.value)}
                      className="bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300 rounded px-1.5 py-0.5 focus:outline-none focus:border-purple-500 font-medium cursor-pointer"
                    >
                      <option value="hybrid">Hybrid (PDF + General AI)</option>
                      <option value="strict">Strict (PDF Only)</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {/* PDF Preview Link for Mobile screen widths */}
              {document && (
                <a
                  href={getIframeSrc(document.filePath)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-purple-400 md:hidden border border-zinc-800 rounded-lg px-2.5 py-1 focus:outline-none shrink-0"
                >
                  View PDF
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </header>

            {/* Error notifications block */}
            {error && (
              <div className="m-3 p-3 bg-red-950/20 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-start gap-2 animate-fade-in shrink-0">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Messaging flow box */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                  <div className="h-12 w-12 rounded-2xl bg-purple-900/10 border border-purple-500/10 flex items-center justify-center text-purple-400 mb-2">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <h4 className="font-bold text-white text-sm sm:text-base">Document Indexed and Ready!</h4>
                  <p className="text-zinc-500 text-xs sm:text-sm max-w-sm font-light">
                    Ask a question about <span className="text-purple-400 font-semibold">"{document?.filename}"</span>. 
                    The AI responds only using information sourced from this PDF.
                  </p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg._id}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} space-y-1.5`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-purple-600 text-white rounded-br-none shadow-md shadow-purple-500/5'
                          : 'bg-zinc-950/60 border border-zinc-900 text-zinc-200 rounded-bl-none'
                      }`}
                    >
                      {msg.role === 'user' ? (
                        <p className="whitespace-pre-wrap font-light">{msg.content}</p>
                      ) : (
                        <MarkdownRenderer text={msg.content} />
                      )}
                    </div>

                    {/* Citations references (Only Assistant messages have sources) */}
                    {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                      <div className="pl-2 flex flex-wrap gap-1.5 items-center">
                        <span className="text-[10px] text-zinc-550 font-medium">Sources:</span>
                        {Array.from(new Set(msg.sources.map((s) => s.pageNumber)))
                          .sort((a, b) => a - b)
                          .map((pageNum) => (
                            <button
                              key={pageNum}
                              onClick={() => setPdfPage(pageNum)}
                              className="text-[10px] bg-purple-950/20 hover:bg-purple-900/40 text-purple-400 hover:text-purple-300 font-semibold border border-purple-900/30 rounded px-1.5 py-0.5 transition-colors focus:outline-none flex items-center gap-0.5 cursor-pointer"
                              title={`Jump PDF Viewer to Page ${pageNum}`}
                            >
                              Page {pageNum}
                              <ChevronRight className="h-2.5 w-2.5" />
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                ))
              )}

              {/* Waiting for response loader */}
              {sending && (
                <div className="flex flex-col items-start space-y-1.5 animate-pulse">
                  <div className="bg-zinc-950/60 border border-zinc-900 text-zinc-400 rounded-2xl rounded-bl-none px-4 py-3 text-sm flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
                    <span>AI is reading PDF pages...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Input Box */}
            <form onSubmit={handleSend} className="p-4 border-t border-zinc-900 bg-zinc-950/20 shrink-0">
              <div className="relative flex items-center">
                <input
                  type="text"
                  required
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask a question about the document..."
                  disabled={sending}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3.5 pl-4 pr-12 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                />
                <button
                  type="submit"
                  disabled={!question.trim() || sending}
                  className="absolute right-2 p-2 bg-purple-600 hover:bg-purple-550 disabled:opacity-50 text-white rounded-lg transition-all focus:outline-none shrink-0 cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <p className="text-[10px] text-zinc-600 text-center mt-2.5">
                AI responses are generated based *only* on context found in the PDF.
              </p>
            </form>

          </section>

        </main>
      </div>
    </div>
  );
}

function MarkdownRenderer({ text }) {
  if (!text) return null;

  // Clean source page tags (e.g. [Source Page 2]) from raw AI output to avoid double citation rendering
  const cleanText = text.replace(/\[Source Page \d+\]/gi, '').trim();

  // Split text by code blocks
  const parts = cleanText.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-2 font-light leading-relaxed text-sm">
      {parts.map((part, index) => {
        // Code Block
        if (part.startsWith('```') && part.endsWith('```')) {
          const content = part.substring(3, part.length - 3);
          const lines = content.split('\n');
          const language = lines[0].trim();
          const code = lines.slice(1).join('\n').trim();
          return (
            <pre key={index} className="bg-zinc-950 border border-zinc-900 rounded-xl p-3.5 overflow-x-auto text-xs font-mono text-purple-300 my-2 select-text">
              <code>{code || content.trim()}</code>
            </pre>
          );
        }

        // Standard text block
        const lines = part.split('\n');
        let inList = false;
        const renderedElements = [];
        let listItems = [];

        const renderInlineStyles = (lineText) => {
          // Replace bold markdown **text** with JSX <strong>text</strong>
          const boldParts = lineText.split(/(\*\*.*?\*\*)/g);
          return boldParts.map((boldPart, idx) => {
            if (boldPart.startsWith('**') && boldPart.endsWith('**')) {
              return <strong key={idx} className="font-semibold text-white">{boldPart.slice(2, -2)}</strong>;
            }
            return boldPart;
          });
        };

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const trimmedLine = line.trim();

          // Bullet points starting with * or - or •
          if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ') || trimmedLine.startsWith('• ')) {
            inList = true;
            listItems.push(
              <li key={i} className="list-disc ml-5 pl-1 mb-1 text-zinc-300">
                {renderInlineStyles(trimmedLine.substring(2))}
              </li>
            );
          } else {
            // If we were in a list, render the list and reset
            if (inList && listItems.length > 0) {
              renderedElements.push(<ul key={`list-${i}`} className="space-y-1 my-2">{listItems}</ul>);
              listItems = [];
              inList = false;
            }

            if (trimmedLine) {
              renderedElements.push(
                <p key={i} className="my-1.5 text-zinc-300">
                  {renderInlineStyles(line)}
                </p>
              );
            }
          }
        }

        // Render any remaining list items at the end
        if (listItems.length > 0) {
          renderedElements.push(<ul key={`list-end`} className="space-y-1 my-2">{listItems}</ul>);
        }

        return <div key={index}>{renderedElements}</div>;
      })}
    </div>
  );
}
