'use client';

import React from 'react';
import { Feedback } from '@/lib/db';
import { FeedbackCard } from './FeedbackCard';

interface FeedbackGridProps {
  feedbacks: Feedback[];
  onLike: (id: string) => void;
  loading: boolean;
}

export function FeedbackGrid({ feedbacks, onLike, loading }: FeedbackGridProps) {
  if (loading && feedbacks.length === 0) {
    return (
      <div className="w-full py-20 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-t-violet-500 border-gray-800 animate-spin" />
        <p className="text-sm text-gray-400 font-medium">Loading feedbacks...</p>
      </div>
    );
  }

  if (feedbacks.length === 0) {
    return (
      <div className="w-full py-24 border border-gray-900/60 rounded-3xl bg-gray-950/10 flex flex-col items-center justify-center text-center p-6 gap-3">
        <div className="p-4 rounded-full bg-gray-900 text-gray-500 border border-gray-800">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-300">No feedback yet</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-sm">
            Be the first one to leave your thoughts on our wall!
          </p>
        </div>
      </div>
    );
  }

  return (
    // 4x4 responsive grid mapping desktop, laptops, tablets, and mobile views.
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 py-8">
      {feedbacks.map((feedback, index) => (
        <FeedbackCard
          key={feedback.id}
          feedback={feedback}
          onLike={() => onLike(feedback.id)}
          index={index}
        />
      ))}
    </div>
  );
}
