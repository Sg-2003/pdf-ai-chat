'use client';

import { useState, useRef } from 'react';
import { Upload, CheckCircle2, AlertCircle, Loader2, RefreshCw } from 'lucide-react';

export default function DocumentUpload({ onUploadSuccess }) {
  const [dragActive, setDragActive] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, uploading, processing, success, error
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFile = async (file) => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setStatus('error');
      setErrorMessage('Please upload a PDF file only.');
      return;
    }

    // Limit to 15MB
    if (file.size > 15 * 1024 * 1024) {
      setStatus('error');
      setErrorMessage('File is too large. Max size is 15MB.');
      return;
    }

    setStatus('uploading');
    setProgress(10);
    setUploadedFile(file);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Simulate uploading phase progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 250);

      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setStatus('processing');
      setProgress(95);

      // Finish embedding transition
      setTimeout(() => {
        setProgress(100);
        setStatus('success');
        if (onUploadSuccess) onUploadSuccess(data.document);
      }, 800);

    } catch (error) {
      setStatus('error');
      setErrorMessage(error.message || 'Failed to process document');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const resetUploader = () => {
    setStatus('idle');
    setProgress(0);
    setErrorMessage('');
    setUploadedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center transition-all min-h-[220px] ${
          dragActive
            ? 'border-purple-500 bg-purple-950/15'
            : status === 'error'
            ? 'border-red-500/50 bg-red-950/5'
            : status === 'success'
            ? 'border-green-500/50 bg-green-950/5'
            : 'border-zinc-800 bg-zinc-950/30 hover:border-purple-500/40 hover:bg-zinc-950/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf"
          onChange={handleChange}
          disabled={status === 'uploading' || status === 'processing'}
        />

        {status === 'idle' && (
          <>
            <div className="h-12 w-12 rounded-xl bg-purple-900/20 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4 transition-transform hover:scale-105">
              <Upload className="h-6 w-6" />
            </div>
            <p className="text-zinc-200 font-medium mb-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-purple-400 hover:text-purple-300 underline font-semibold transition-colors focus:outline-none"
              >
                Click to upload
              </button>{' '}
              or drag & drop
            </p>
            <p className="text-zinc-500 text-xs mt-1">PDF documents only (up to 15MB)</p>
          </>
        )}

        {(status === 'uploading' || status === 'processing') && (
          <div className="w-full max-w-xs flex flex-col items-center">
            <Loader2 className="h-8 w-8 text-purple-500 animate-spin mb-4" />
            <p className="text-zinc-200 font-medium text-sm mb-2">
              {status === 'uploading'
                ? `Uploading ${uploadedFile?.name}...`
                : 'Processing & Indexing Embeddings...'}
            </p>
            <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-500 to-indigo-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-zinc-500 text-xs mt-2">
              {status === 'uploading' ? 'Sending to server' : 'Generating Gemini vector embeddings'}
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center">
            <CheckCircle2 className="h-10 w-10 text-green-500 mb-3" />
            <p className="text-zinc-200 font-medium text-sm mb-1">Upload complete!</p>
            <p className="text-zinc-500 text-xs mb-4 max-w-xs truncate">{uploadedFile?.name}</p>
            <button
              onClick={resetUploader}
              type="button"
              className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3.5 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all focus:outline-none"
            >
              <RefreshCw className="h-3 w-3" />
              Upload Another
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center">
            <AlertCircle className="h-10 w-10 text-red-500 mb-3" />
            <p className="text-zinc-200 font-medium text-sm mb-1">Upload failed</p>
            <p className="text-red-400 text-xs mb-4 max-w-xs text-center">{errorMessage}</p>
            <button
              onClick={resetUploader}
              type="button"
              className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3.5 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all focus:outline-none"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
