'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import DocumentUpload from '@/components/DocumentUpload';
import { FileText, MessageSquare, Trash2, Edit2, Play, Database, FileUp, Check, X, Loader2 } from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const [documents, setDocuments] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Renaming document state variables
  const [renamingId, setRenamingId] = useState(null);
  const [renamingVal, setRenamingVal] = useState('');
  const [renamingLoading, setRenamingLoading] = useState(false);

  const fetchData = async () => {
    try {
      const [docsRes, sessRes] = await Promise.all([
        fetch('/api/documents'),
        fetch('/api/chat/session')
      ]);

      if (docsRes.ok && sessRes.ok) {
        const docsData = await docsRes.json();
        const sessData = await sessRes.json();
        setDocuments(docsData.documents || []);
        setSessions(sessData.sessions || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUploadSuccess = () => {
    fetchData();
  };

  const handleStartChat = async (docId) => {
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

  const handleDeleteDoc = async (docId) => {
    if (!confirm('Are you sure you want to delete this document? This will remove all associated chunks and chat histories.')) return;
    try {
      const res = await fetch(`/api/documents/${docId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Failed to delete document:', error);
    }
  };

  const handleRenameDoc = async (docId) => {
    if (!renamingVal.trim()) return;
    setRenamingLoading(true);
    try {
      const res = await fetch(`/api/documents/${docId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: renamingVal }),
      });
      if (res.ok) {
        setRenamingId(null);
        setRenamingVal('');
        fetchData();
      }
    } catch (error) {
      console.error('Failed to rename document:', error);
    } finally {
      setRenamingLoading(false);
    }
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Calculate statistics overview counts
  const totalDocs = documents.length;
  const totalChunks = documents.reduce((sum, doc) => sum + (doc.chunkCount || 0), 0);
  const totalChats = sessions.length;

  return (
    <div className="flex flex-col min-h-screen bg-[#030014] text-zinc-150 relative">
      {/* Background celestial glowing gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-950/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-950/5 blur-[120px] pointer-events-none" />

      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 py-8 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Your Workspace</h1>
          <p className="text-zinc-400 text-sm mt-1">Upload and manage PDFs, and chat with AI about them.</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-10">
          <div className="rounded-xl border border-purple-950/20 bg-zinc-950/40 p-5 backdrop-blur-md flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-purple-900/20 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Documents</p>
              <h3 className="text-2xl font-bold text-white">{totalDocs}</h3>
            </div>
          </div>
          <div className="rounded-xl border border-purple-950/20 bg-zinc-950/40 p-5 backdrop-blur-md flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-indigo-900/20 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Vector Chunks</p>
              <h3 className="text-2xl font-bold text-white">{totalChunks}</h3>
            </div>
          </div>
          <div className="rounded-xl border border-purple-950/20 bg-zinc-950/40 p-5 backdrop-blur-md flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-pink-900/20 border border-pink-500/20 flex items-center justify-center text-pink-400">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">AI Chats</p>
              <h3 className="text-2xl font-bold text-white">{totalChats}</h3>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Grid Area (Uploader & Document Management) */}
          <div className="lg:col-span-2 space-y-8">
            <div className="rounded-2xl border border-purple-950/20 bg-zinc-950/40 p-6 backdrop-blur-md">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <FileUp className="h-5 w-5 text-purple-400" />
                Upload New Document
              </h2>
              <DocumentUpload onUploadSuccess={handleUploadSuccess} />
            </div>

            <div className="rounded-2xl border border-purple-950/20 bg-zinc-950/40 p-6 backdrop-blur-md">
              <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-400" />
                Indexed PDFs
              </h2>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 text-purple-500 animate-spin mb-2" />
                  <p className="text-zinc-500 text-sm">Retrieving indexed records...</p>
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-zinc-900 rounded-xl">
                  <p className="text-zinc-400 text-sm">No documents uploaded yet.</p>
                  <p className="text-zinc-600 text-xs mt-1">Use the drag-and-drop zone above to upload and index your first PDF.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {documents.map((doc) => (
                    <div
                      key={doc._id}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between border border-zinc-900 hover:border-purple-950/40 bg-zinc-950/20 hover:bg-zinc-950/40 p-4 rounded-xl transition-all duration-300"
                    >
                      <div className="flex items-start gap-3 flex-grow pr-4 min-w-0">
                        <div className="h-10 w-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-grow">
                          {renamingId === doc._id ? (
                            <div className="flex items-center gap-2 mt-1">
                              <input
                                type="text"
                                value={renamingVal}
                                onChange={(e) => setRenamingVal(e.target.value)}
                                className="bg-zinc-900 text-white border border-purple-500 rounded px-2.5 py-1 text-sm focus:outline-none w-full max-w-sm"
                                autoFocus
                              />
                              <button
                                onClick={() => handleRenameDoc(doc._id)}
                                disabled={renamingLoading}
                                className="text-green-500 hover:text-green-400 focus:outline-none"
                              >
                                {renamingLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                              </button>
                              <button
                                onClick={() => {
                                  setRenamingId(null);
                                  setRenamingVal('');
                                }}
                                className="text-red-500 hover:text-red-400 focus:outline-none"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <h4 className="font-semibold text-white truncate text-sm sm:text-base" title={doc.filename}>{doc.filename}</h4>
                              <p className="text-xs text-zinc-500 mt-0.5 flex gap-2">
                                <span>{formatBytes(doc.fileSize)}</span>
                                <span>&bull;</span>
                                <span>{doc.chunkCount} vector chunks</span>
                              </p>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-4 sm:mt-0 shrink-0">
                        {renamingId !== doc._id && (
                          <>
                            <button
                              onClick={() => {
                                setRenamingId(doc._id);
                                setRenamingVal(doc.filename);
                              }}
                              className="p-2 text-zinc-455 hover:text-zinc-200 hover:bg-zinc-900 rounded-lg transition-colors focus:outline-none"
                              title="Rename document"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteDoc(doc._id)}
                              className="p-2 text-zinc-455 hover:text-red-400 hover:bg-zinc-900 rounded-lg transition-colors focus:outline-none"
                              title="Delete document"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleStartChat(doc._id)}
                              className="flex items-center gap-1 bg-purple-950/30 text-purple-400 border border-purple-900/50 hover:bg-purple-650 hover:text-white hover:border-purple-500 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all focus:outline-none"
                            >
                              <Play className="h-3 w-3 fill-current" />
                              Chat
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Grid Area (Recent Conversations Sidebar) */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-purple-950/20 bg-zinc-950/40 p-6 backdrop-blur-md">
              <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-purple-400" />
                Recent Chats
              </h2>

              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-6 w-6 text-purple-500 animate-spin" />
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-zinc-900 rounded-xl">
                  <p className="text-zinc-550 text-xs">No conversations found.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {sessions.map((sess) => (
                    <button
                      key={sess._id}
                      onClick={() => router.push(`/chat/${sess._id}`)}
                      className="w-full text-left p-3.5 rounded-xl border border-zinc-900 hover:border-purple-950/30 bg-zinc-950/10 hover:bg-zinc-950/40 transition-all flex items-center justify-between group focus:outline-none"
                    >
                      <div className="min-w-0 pr-3">
                        <h4 className="font-semibold text-zinc-200 group-hover:text-purple-300 truncate text-xs sm:text-sm">
                          {sess.title.replace('Session: ', '')}
                        </h4>
                        <p className="text-[10px] text-zinc-500 mt-1">
                          {new Date(sess.updatedAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <Play className="h-3.5 w-3.5 text-zinc-600 group-hover:text-purple-400 shrink-0 fill-current opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
