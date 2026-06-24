'use client';

import React, { useState } from 'react';
import { Feedback } from '@/lib/db';
import { ImageLightbox } from './ImageLightbox';

interface FeedbackCardProps {
  feedback: Feedback;
  onLike: () => void;
  index: number;
}

export function FeedbackCard({ feedback, onLike, index }: FeedbackCardProps) {
  const [showLightbox, setShowLightbox] = useState(false);
  const formattedDate = new Date(feedback.created_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <>
      <div 
        className="glass glass-glow rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all duration-300 animate-fade-in group hover:-translate-y-0.5"
        style={{ animationDelay: `${index * 50}ms` }}
      >
        <div className="flex flex-col gap-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 bg-gray-900/50 px-2.5 py-1 rounded-full border border-gray-800/80">
              {feedback.name || 'Anonymous'}
            </span>
            <span className="text-[10px] text-gray-500">{formattedDate}</span>
          </div>

          {/* Feedback Image (if any) */}
          {feedback.image_path && (
            <div 
              onClick={() => setShowLightbox(true)}
              className="relative w-full h-32 rounded-xl overflow-hidden border border-gray-800/80 cursor-pointer group-hover:border-violet-500/20 transition-all duration-300"
            >
              <img
                src={feedback.image_path}
                alt="Attached feedback"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </div>
            </div>
          )}

          {/* Message */}
          <p className="text-sm leading-relaxed text-gray-200 break-words whitespace-pre-wrap">
            {feedback.message}
          </p>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between border-t border-gray-900/60 pt-3 mt-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onLike();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 ${
              feedback.hasLiked
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-sm shadow-rose-500/5'
                : 'bg-gray-900/30 text-gray-400 hover:text-rose-400 border-gray-800 hover:border-rose-500/20'
            }`}
          >
            <svg 
              className={`w-4 h-4 transition-transform duration-200 ${
                feedback.hasLiked ? 'scale-110 fill-current text-rose-400' : 'group-hover:scale-110'
              }`}
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span>{feedback.likes}</span>
          </button>
        </div>
      </div>

      {showLightbox && feedback.image_path && (
        <ImageLightbox src={feedback.image_path} onClose={() => setShowLightbox(false)} />
      )}
    </>
  );
}
