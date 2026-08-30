'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ThumbsUp, Heart } from 'lucide-react';

export type ReactionType = 'like' | 'love' | 'care' | 'sad';

export interface ReactionConfig {
  type: ReactionType;
  emoji: string;
  label: string;
  color: string;
  textColor: string;
}

export const REACTIONS: ReactionConfig[] = [
  { type: 'love', emoji: '❤️', label: 'Love', color: '#FA383E', textColor: 'text-rose-600' },
  { type: 'like', emoji: '👍', label: 'Like', color: '#1877F2', textColor: 'text-blue-600' },
  { type: 'care', emoji: '🥰', label: 'Care', color: '#F7B125', textColor: 'text-amber-500' },
  { type: 'sad', emoji: '😢', label: 'Sad', color: '#F7B125', textColor: 'text-amber-600' },
];

export interface ReactionState {
  userReaction: ReactionType | null;
  counts: Record<ReactionType, number>;
  total: number;
}

interface FacebookReactionPickerProps {
  itemId: string;
  initialCounts?: Partial<Record<ReactionType, number>>;
  initialUserReaction?: ReactionType | null;
  initialHelpfulCount?: number;
  size?: 'sm' | 'md' | 'lg';
  showSummary?: boolean;
  minimalHeartStyle?: boolean;
  onReactionChange?: (reaction: ReactionType | null, nextState: ReactionState) => void;
  className?: string;
}

export function getTopReactions(counts: Record<ReactionType, number>): ReactionConfig[] {
  return REACTIONS
    .filter(r => (counts[r.type] || 0) > 0)
    .sort((a, b) => (counts[b.type] || 0) - (counts[a.type] || 0))
    .slice(0, 3);
}

export default function FacebookReactionPicker({
  itemId,
  initialCounts,
  initialUserReaction = null,
  initialHelpfulCount = 0,
  size = 'sm',
  showSummary = true,
  minimalHeartStyle = false,
  onReactionChange,
  className = '',
}: FacebookReactionPickerProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [reactionState, setReactionState] = useState<ReactionState>(() => {
    // Consolidate all legacy counts (like, love, care, sad, initialHelpfulCount) into the single heart (love) count
    const legacyTotal = (initialCounts?.like ?? 0) + (initialCounts?.love ?? 0) + (initialCounts?.care ?? 0) + (initialCounts?.sad ?? 0) + (initialHelpfulCount ?? 0);
    const baseCounts: Record<ReactionType, number> = {
      like: 0,
      love: legacyTotal,
      care: 0,
      sad: 0,
    };
    return {
      userReaction: initialUserReaction ? 'love' : null,
      counts: baseCounts,
      total: legacyTotal,
    };
  });

  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Sync with localStorage for persistence
  useEffect(() => {
    if (typeof window === 'undefined' || !itemId) return;
    try {
      const stored = localStorage.getItem(`lumo_reaction_${itemId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        const totalParsed = (parsed.counts?.like || 0) + (parsed.counts?.love || 0) + (parsed.counts?.care || 0) + (parsed.counts?.sad || 0) + (parsed.total || 0);
        const userReacted = parsed.userReaction ? 'love' : null;
        
        setReactionState(prev => {
          const finalTotal = Math.max(prev.total, totalParsed);
          return {
            userReaction: userReacted ?? prev.userReaction,
            counts: { like: 0, love: finalTotal, care: 0, sad: 0 },
            total: finalTotal,
          };
        });
      }
    } catch (e) {}
  }, [itemId]);

  const saveState = (newState: ReactionState) => {
    setReactionState(newState);
    if (typeof window !== 'undefined' && itemId) {
      try {
        localStorage.setItem(`lumo_reaction_${itemId}`, JSON.stringify({
          userReaction: newState.userReaction,
          counts: newState.counts,
          total: newState.total,
        }));
      } catch (e) {}
    }
    onReactionChange?.(newState.userReaction, newState);
  };

  const handleSelectReaction = (type: ReactionType = 'love') => {
    setPickerOpen(false);
    const isCurrentlyReacted = !!reactionState.userReaction;

    if (isCurrentlyReacted) {
      // Toggle off
      const nextTotal = Math.max(0, reactionState.total - 1);
      const nextCounts: Record<ReactionType, number> = { like: 0, love: nextTotal, care: 0, sad: 0 };
      saveState({
        userReaction: null,
        counts: nextCounts,
        total: nextTotal,
      });

      if (typeof window !== 'undefined' && itemId) {
        const deviceId = localStorage.getItem('lumo_device_id') || `dev_${Math.random().toString(36).substring(2, 10)}`;
        localStorage.setItem('lumo_device_id', deviceId);
        const cityCookie = localStorage.getItem('lumo_city_board_cookie') || deviceId;

        // Sync with City Board helpful API
        fetch('/api/city-board/helpful', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ post_id: itemId, device_cookie: cityCookie })
        }).catch(() => {});

        // Sync with Lost Pets reactions API
        fetch('/api/lost-pets/reactions', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ post_id: itemId, device_id: deviceId })
        }).catch(() => {});
      }
    } else {
      // Toggle on (Heart ❤️)
      const nextTotal = reactionState.total + 1;
      const nextCounts: Record<ReactionType, number> = { like: 0, love: nextTotal, care: 0, sad: 0 };
      saveState({
        userReaction: 'love',
        counts: nextCounts,
        total: nextTotal,
      });

      if (typeof window !== 'undefined' && itemId) {
        const deviceId = localStorage.getItem('lumo_device_id') || `dev_${Math.random().toString(36).substring(2, 10)}`;
        localStorage.setItem('lumo_device_id', deviceId);
        const cityCookie = localStorage.getItem('lumo_city_board_cookie') || deviceId;

        // Sync with City Board helpful API
        fetch('/api/city-board/helpful', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ post_id: itemId, device_cookie: cityCookie })
        }).catch(() => {});

        // Sync with Lost Pets reactions API
        fetch('/api/lost-pets/reactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ post_id: itemId, reaction: 'love', device_id: deviceId })
        }).catch(() => {});
      }
    }
  };

  const handleQuickClick = () => {
    handleSelectReaction('love');
  };

  // Long-press handling for touch / mobile
  const handleTouchStart = () => {
    longPressTimerRef.current = setTimeout(() => {
      setPickerOpen(true);
    }, 280);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // Hover handling for desktop
  const handleMouseEnter = () => {
    hoverTimerRef.current = setTimeout(() => {
      setPickerOpen(true);
    }, 250);
  };

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  };

  // Click outside listener to close picker
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const activeReactionConfig = reactionState.userReaction
    ? REACTIONS.find(r => r.type === reactionState.userReaction)
    : null;

  const topReactions = getTopReactions(reactionState.counts);
  const isSmall = size === 'sm';
  const isMedium = size === 'md';

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center gap-2 ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Floating Reaction Bar (Facebook / Instagram Style Flyout) */}
      {pickerOpen && (
        <div
          className="absolute bottom-full left-0 mb-2 z-50 bg-white/95 backdrop-blur-md rounded-full shadow-xl border border-gray-200/90 py-1.5 px-2 flex items-center gap-1.5 sm:gap-2 animate-in fade-in zoom-in-95 duration-150"
          style={{ transformOrigin: 'bottom left' }}
          onClick={(e) => e.stopPropagation()}
        >
          {REACTIONS.map((reaction) => (
            <button
              key={reaction.type}
              type="button"
              onClick={() => handleSelectReaction(reaction.type)}
              className="group/btn relative flex flex-col items-center justify-center p-1 rounded-full hover:scale-135 transition-all duration-150 cursor-pointer border-none bg-transparent active:scale-110"
              title={reaction.label}
            >
              <span className="text-xl sm:text-2xl leading-none select-none drop-shadow-2xs">
                {reaction.emoji}
              </span>
              {/* Tooltip Label */}
              <span className="absolute -top-7 opacity-0 group-hover/btn:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] font-bold py-0.5 px-2 rounded-full pointer-events-none whitespace-nowrap shadow-md">
                {reaction.label}
              </span>
            </button>
          ))}
        </div>
      )}

      {minimalHeartStyle ? (
        <button
          type="button"
          onClick={handleQuickClick}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          className={`inline-flex items-center gap-1.5 transition-colors cursor-pointer select-none border-none bg-transparent p-1.5 -ml-1 rounded-lg hover:bg-black/[0.03] ${
            reactionState.userReaction
              ? 'text-rose-600 font-bold'
              : 'text-[#6B5E57] hover:text-[#191919] font-semibold'
          }`}
          title={reactionState.userReaction ? `Reacted ${reactionState.userReaction}` : 'Like'}
        >
          <Heart 
            className={`w-4 h-4 stroke-[1.8] transition-transform active:scale-125 ${
              reactionState.userReaction ? 'fill-rose-500 text-rose-500' : ''
            }`} 
          />
          <span className="text-xs">{reactionState.total > 0 ? reactionState.total : 0}</span>
        </button>
      ) : (
        <>
          {/* Main Action Button */}
          <button
            type="button"
            onClick={handleQuickClick}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            className={`flex items-center gap-1.5 rounded-xl transition-all cursor-pointer select-none border-none bg-transparent p-0 ${
              activeReactionConfig
                ? `${activeReactionConfig.textColor} font-bold`
                : 'text-gray-500 hover:text-gray-900 font-semibold'
            } ${isSmall ? 'text-xs' : isMedium ? 'text-sm' : 'text-base'}`}
          >
            {activeReactionConfig ? (
              <span className="text-base sm:text-lg leading-none select-none">
                {activeReactionConfig.emoji}
              </span>
            ) : (
              <ThumbsUp className={`${isSmall ? 'w-3.5 h-3.5' : isMedium ? 'w-4 h-4' : 'w-5 h-5'}`} />
            )}
            <span>{activeReactionConfig ? activeReactionConfig.label : 'Like'}</span>
          </button>

          {/* Overlapping Top-Reaction Emojis & Count Summary */}
          {showSummary && reactionState.total > 0 && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                setPickerOpen(prev => !prev);
              }}
              className="inline-flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity pl-0.5"
              title={`${reactionState.total} reactions`}
            >
              {/* Overlapping Emojis */}
              <div className="flex items-center -space-x-1 select-none">
                {topReactions.map((r, idx) => (
                  <span
                    key={r.type}
                    className="text-[13px] leading-none drop-shadow-2xs"
                    style={{ zIndex: 3 - idx }}
                  >
                    {r.emoji}
                  </span>
                ))}
              </div>

              {/* Total Count */}
              <span className="text-xs text-gray-500 font-semibold select-none">
                {reactionState.total}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
