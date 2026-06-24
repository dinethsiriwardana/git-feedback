'use client';

import { useState } from 'react';
import { useVisitorId } from '@/hooks/useVisitorId';
import { useFeedbacks } from '@/hooks/useFeedbacks';
import { Header } from '@/components/Header';
import { FeedbackGrid } from '@/components/FeedbackGrid';
import { FeedbackForm } from '@/components/FeedbackForm';
import { Toast, ToastState } from '@/components/Toast';

export default function Home() {
  const visitorId = useVisitorId();
  const { feedbacks, loading, error, refresh, toggleLike } = useFeedbacks(visitorId);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
  };

  const handleFeedbackSuccess = () => {
    showToast('Feedback submitted successfully!', 'success');
    refresh();
  };

  const handleFeedbackError = (msg: string) => {
    showToast(msg, 'error');
  };

  return (
    <div className="flex-1 flex flex-col pb-20 relative">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 mt-6">
        {/* Banner Section */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-900/60">
          <div>
            <h2 className="text-lg font-bold text-gray-200">Feedback Wall</h2>
            <p className="text-xs text-gray-500 mt-0.5">Showing all submitted feedback sorted by highest likes</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl cursor-pointer hover:shadow-lg hover:shadow-violet-600/10 transition-all duration-200 active:scale-[0.98]"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Post Feedback
          </button>
        </div>

        {error && (
          <div className="w-full py-4 px-5 mt-6 border border-rose-500/20 bg-rose-950/20 text-rose-300 rounded-2xl text-sm flex items-center justify-between">
            <span>{error}</span>
            <button 
              onClick={refresh} 
              className="px-3 py-1 rounded-lg bg-rose-950/40 border border-rose-500/30 text-xs font-semibold hover:bg-rose-900/40 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        <FeedbackGrid 
          feedbacks={feedbacks} 
          onLike={toggleLike} 
          loading={loading} 
        />
      </main>

      {/* Floating Plus button on mobile */}
      <button
        onClick={() => setShowForm(true)}
        className="md:hidden fixed bottom-6 right-6 z-30 p-4 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-2xl hover:shadow-violet-500/20 border border-violet-400/20 transition-all duration-200 hover:scale-105 active:scale-95"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {showForm && (
        <FeedbackForm 
          onSuccess={handleFeedbackSuccess} 
          onError={handleFeedbackError} 
          onClose={() => setShowForm(false)} 
        />
      )}

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
}
