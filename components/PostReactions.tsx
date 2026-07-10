'use client';

import React, { useState, useEffect } from 'react';

const REACTIONS = ['❤️', '😢', '🙏', '👀', '🎉'];

export default function PostReactions({ postId }: { postId: string }) {
  const [counts, setCounts] = useState<Record<string, number>>({
    '❤️': 0, '😢': 0, '🙏': 0, '👀': 0, '🎉': 0
  });
  const [myReaction, setMyReaction] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const proEmail = typeof window !== 'undefined' 
    ? localStorage.getItem('lumo_pro_email') || '' 
    : '';

  useEffect(() => {
    const fetchReactions = async () => {
      try {
        const res = await fetch(`/api/lost-pets/reactions?post_id=${postId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.counts) {
            setCounts(data.counts);
          }
        }
      } catch (err) {
        console.error('Failed to fetch reactions', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReactions();

    // Check local storage for existing reaction (tied to email now if desired, but here we just clear on sign out, so local tracking is fine)
    const savedReaction = localStorage.getItem(`reacted_${postId}`);
    if (savedReaction && REACTIONS.includes(savedReaction)) {
      setMyReaction(savedReaction);
    }
  }, [postId]);

  if (!proEmail) return null;

  const toggleReaction = async (emoji: string) => {
    // Use device ID for tracking, not email
    const deviceId = localStorage.getItem('lumo_device_id') || 
      (() => {
        const id = Math.random().toString(36).substring(2)
        localStorage.setItem('lumo_device_id', id)
        return id
      })()

    const userIdentifier = deviceId;

    // If clicking the same reaction, remove it
    if (myReaction === emoji) {
      // Optimistic UI update
      setMyReaction(null);
      setCounts(prev => ({ ...prev, [emoji]: Math.max(0, prev[emoji] - 1) }));
      localStorage.removeItem(`reacted_${postId}`);

      try {
        await fetch('/api/lost-pets/reactions', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ post_id: postId, device_id: userIdentifier })
        });
      } catch (err) {
        console.error('Failed to remove reaction', err);
      }
      return;
    }

    // If already reacted with something else, don't allow (one reaction per person rule)
    if (myReaction) {
      return; // "One reaction per person per post"
    }

    // Add new reaction
    // Optimistic UI update
    setMyReaction(emoji);
    setCounts(prev => ({ ...prev, [emoji]: prev[emoji] + 1 }));
    localStorage.setItem(`reacted_${postId}`, emoji);

    try {
      await fetch('/api/lost-pets/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: postId,
          reaction: emoji,
          device_id: userIdentifier
        })
      });
    } catch (err) {
      console.error('Failed to add reaction', err);
    }
  };

  if (loading) {
    return <div className="flex gap-2 animate-pulse mt-3 opacity-50">
      {REACTIONS.map(emoji => (
        <div key={emoji} className="w-10 h-6 bg-gray-200 rounded-full" />
      ))}
    </div>;
  }

  return (
    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-[#E8DDD4]">
      {REACTIONS.map(emoji => {
        const isSelected = myReaction === emoji;
        const isDisabled = myReaction !== null && myReaction !== emoji;
        
        return (
          <button
            key={emoji}
            onClick={() => toggleReaction(emoji)}
            disabled={isDisabled}
            className={`
              flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all
              ${isSelected 
                ? 'bg-[#F3EAE3] text-[#8B5E3C] border border-[#8B5E3C] shadow-sm' 
                : isDisabled
                  ? 'bg-gray-50 text-gray-400 border border-gray-100 cursor-not-allowed opacity-60'
                  : 'bg-white text-gray-600 border border-[#E8DDD4] hover:bg-gray-50'
              }
            `}
          >
            <span className="text-sm">{emoji}</span>
            <span>{counts[emoji] || 0}</span>
          </button>
        );
      })}
    </div>
  );
}
