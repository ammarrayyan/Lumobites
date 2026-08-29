'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ThumbsUp } from 'lucide-react';

export type ReactionType = 'like' | 'love' | 'care' | 'sad';

export interface ReactionConfig {
  type: ReactionType;
  emoji: string;
  label: string;
  color: string;
  textColor: string;
}

export const REACTIONS: ReactionConfig[] = [
  { type: 'like', emoji: '👍', label: 'Like', color: '#1877F2', textColor: 'text-blue-600' },
  { type: 'love', emoji: '❤️', label: 'Love', color: '#FA383E', textColor: 'text-rose-600' },
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
  onReactionChange,
  className = '',
}: FacebookReactionPickerProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [reactionState, setReactionState] = useState<ReactionState>(() => {
    const baseCounts: Record<ReactionType, number> = {
      like: initialCounts?.like ?? initialHelpfulCount ?? 0,
      love: initialCounts?.love ?? 0,
      care: initialCounts?.care ?? 0,
      sad: initialCounts?.sad ?? 0,
    };
    const total = Object.values(baseCounts).reduce((a, b) => a + b, 0);
    return {
      userReaction: initialUserReaction,
      counts: baseCounts,
      total,
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
        const validTypes: ReactionType[] = ['like', 'love', 'care', 'sad'];
        const userReaction: ReactionType | null = validTypes.includes(parsed.userReaction) ? parsed.userReaction : null;
        
        setReactionState(prev => {
          const validCounts: Record<ReactionType, number> = {
            like: parsed.counts?.like ?? prev.counts.like ?? 0,
            love: parsed.counts?.love ?? prev.counts.love ?? 0,
            care: parsed.counts?.care ?? prev.counts.care ?? 0,
            sad: parsed.counts?.sad ?? prev.counts.sad ?? 0,
          };
          const total = Object.values(validCounts).reduce((a, b) => a + b, 0);
          return {
            userReaction: userReaction ?? prev.userReaction,
            counts: validCounts,
            total,
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
        }));
      } catch (e) {}
    }
    onReactionChange?.(newState.userReaction, newState);
  };

  const handleSelectReaction = (type: ReactionType) => {
    setPickerOpen(false);
    const prevReaction = reactionState.userReaction;
    const nextCounts = { ...reactionState.counts };

    if (prevReaction === type) {
      // Toggle off
      nextCounts[type] = Math.max(0, (nextCounts[type] || 0) - 1);
      const total = Object.values(nextCounts).reduce((a, b) => a + b, 0);
      saveState({
        userReaction: null,
        counts: nextCounts,
        total,
      });
    } else {
      if (prevReaction) {
        nextCounts[prevReaction] = Math.max(0, (nextCounts[prevReaction] || 0) - 1);
      }
      nextCounts[type] = (nextCounts[type] || 0) + 1;
      const total = Object.values(nextCounts).reduce((a, b) => a + b, 0);
      saveState({
        userReaction: type,
        counts: nextCounts,
        total,
      });
    }
  };

  const handleQuickClick = () => {
    if (pickerOpen) {
      setPickerOpen(false);
      return;
    }
    // Quick click toggles 'like'
    handleSelectReaction(reactionState.userReaction === 'like' ? 'like' : 'like');
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
    // Small delay before closing to allow moving into picker
    setTimeout(() => {
      if (containerRef.current && !containerRef.current.matches(':hover')) {
        setPickerOpen(false);
      }
    }, 300);
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

  const activeReactionConfig = REACTIONS.find(r => r.type === reactionState.userReaction);
  const topReactions = getTopReactions(reactionState.counts);

  const isSmall = size === 'sm';
  const isMedium = size === 'md';

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center gap-1.5 ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Floating Reaction Picker Popup */}
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
    </div>
  );
}
