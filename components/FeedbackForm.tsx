'use client';

import React, { useState } from 'react';
import { ImageUpload } from './ImageUpload';

interface FeedbackFormProps {
  onSuccess: () => void;
  onError: (msg: string) => void;
  onClose: () => void;
}

export function FeedbackForm({ onSuccess, onError, onClose }: FeedbackFormProps) {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message || message.trim() === '') {
      onError('Message field is required.');
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append('name', name);
    formData.append('message', message);
    if (image) {
      formData.append('image', image);
    }

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to submit feedback');
      }

      onSuccess();
      setName('');
      setMessage('');
      setImage(null);
      onClose();
    } catch (err: any) {
      console.error(err);
      onError(err.message || 'Something went wrong while submitting.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div 
        className="w-full max-w-lg glass rounded-2xl border border-gray-800 shadow-2xl p-6 relative flex flex-col gap-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-900">
          <h2 className="text-xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            Post Feedback
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors duration-150 p-1 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-xs font-semibold text-gray-400">
              Your Name <span className="text-gray-600">(Optional)</span>
            </label>
            <input
              type="text"
              id="name"
              placeholder="Anonymous"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              className="px-3.5 py-2.5 bg-gray-950/60 border border-gray-800 rounded-xl focus:border-violet-500/50 outline-none text-sm text-gray-200 transition-colors duration-200"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="message" className="text-xs font-semibold text-gray-400">
              Your Feedback <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="message"
              required
              rows={4}
              placeholder="What are your thoughts?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={500}
              className="px-3.5 py-2.5 bg-gray-950/60 border border-gray-800 rounded-xl focus:border-violet-500/50 outline-none text-sm text-gray-200 transition-colors duration-200 resize-none"
            />
            <div className="text-right text-[10px] text-gray-500">
              {message.length}/500
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-400">
              Attach Photo <span className="text-gray-600">(Optional)</span>
            </label>
            <ImageUpload 
              onImageSelected={setImage} 
              selectedImage={image} 
              onError={onError} 
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:from-violet-800 disabled:to-indigo-800 disabled:text-gray-500 text-white font-semibold text-sm rounded-xl cursor-pointer hover:shadow-lg hover:shadow-violet-600/10 active:scale-[0.99] transition-all duration-150 mt-2 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 rounded-full border border-t-white border-transparent animate-spin" />
                Posting...
              </>
            ) : (
              'Submit'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
