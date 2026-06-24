'use client';

import { useState, useEffect, useCallback } from 'react';
import { Feedback } from '@/lib/db';

export function useFeedbacks(visitorId: string) {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeedbacks = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const url = visitorId 
        ? `/api/feedback?visitorId=${encodeURIComponent(visitorId)}`
        : '/api/feedback';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch feedbacks');
      const data = await res.json();
      setFeedbacks(data.feedbacks || []);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError('Could not load feedbacks. Please try again.');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [visitorId]);

  // Initial load
  useEffect(() => {
    if (visitorId) {
      fetchFeedbacks(true);
    }
  }, [visitorId, fetchFeedbacks]);

  // Auto-refresh/polling loop every 5 seconds for real-time update sync
  useEffect(() => {
    if (!visitorId) return;
    const interval = setInterval(() => {
      fetchFeedbacks(false);
    }, 5000);
    return () => clearInterval(interval);
  }, [visitorId, fetchFeedbacks]);

  const toggleLikeApi = async (feedbackId: string) => {
    if (!visitorId) return;

    // Optimistic UI Update: immediately toggle liked status and increment/decrement count locally
    setFeedbacks(prev => 
      prev.map(f => {
        if (f.id === feedbackId) {
          const wasLiked = !!f.hasLiked;
          return {
            ...f,
            hasLiked: !wasLiked,
            likes: Math.max(0, f.likes + (wasLiked ? -1 : 1))
          };
        }
        return f;
      }).sort((a, b) => b.likes - a.likes) // Sort dynamically on like change
    );

    try {
      const res = await fetch(`/api/feedback/${feedbackId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId }),
      });

      if (!res.ok) throw new Error('Failed to like feedback');
      const data = await res.json();

      // Sync exact state from database
      setFeedbacks(prev => 
        prev.map(f => {
          if (f.id === feedbackId) {
            return { ...f, likes: data.likes, hasLiked: data.hasLiked };
          }
          return f;
        }).sort((a, b) => b.likes - a.likes)
      );
    } catch (err) {
      console.error(err);
      // Revert optimistic update on failure by re-fetching
      fetchFeedbacks(false);
    }
  };

  return { feedbacks, loading, error, refresh: () => fetchFeedbacks(true), toggleLike: toggleLikeApi };
}
