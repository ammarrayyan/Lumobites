'use client';

import React, { useState, useEffect } from 'react';
import NextLink from 'next/link';
import { Footprints, User, PawPrint, Trash2 } from 'lucide-react';
import FacebookReactionPicker from '@/components/FacebookReactionPicker';

interface SharedTwin {
  id: string;
  created_at: string;
  userPhoto: string;
  petBreed: string;
  petType: string;
  petPhoto: string;
  matchScore: number;
  traits: string[];
  quote: string;
  helpful_count?: number;
}

export default function GalleryClient() {
  const [shares, setShares] = useState<SharedTwin[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [myPostTokens, setMyPostTokens] = useState<Record<string, string>>({});

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('lumo_my_twin_posts');
        if (stored) {
          const parsed = JSON.parse(stored);
          const tokenMap: Record<string, string> = {};
          if (Array.isArray(parsed)) {
            parsed.forEach((item: any) => {
              if (typeof item === 'string') {
                tokenMap[item] = 'owner';
              } else if (item?.postId) {
                tokenMap[item.postId] = item.removalToken || 'owner';
              }
            });
          }
          setMyPostTokens(tokenMap);
        }
      } catch (e) {
        console.error('Failed to load owned twin posts', e);
      }
    }
  }, []);

  const handleDeleteTwinPost = async (postId: string, removalToken?: string) => {
    if (!confirm('Are you sure you want to remove your Pet Twin post?')) return;
    setDeletingId(postId);
    try {
      const res = await fetch('/api/twin/share', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, removalToken })
      });
      if (res.ok) {
        setShares(prev => prev.filter(s => s.id !== postId));
        try {
          const updated = { ...myPostTokens };
          delete updated[postId];
          setMyPostTokens(updated);
          const arr = Object.entries(updated).map(([pId, tok]) => ({ postId: pId, removalToken: tok }));
          localStorage.setItem('lumo_my_twin_posts', JSON.stringify(arr));
        } catch (e) {}
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete post.');
      }
    } catch (err) {
      console.error('Delete error', err);
      alert('Error deleting post.');
    } finally {
      setDeletingId(null);
    }
  };

  const RESULTS_PER_PAGE = 12;

  useEffect(() => {
    fetchShares(1);
  }, []);

  const fetchShares = async (pageNumber: number) => {
    if (pageNumber === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await fetch(`/api/twin/share`);
      const data = await res.json();
      
      if (res.ok && data.shares) {
        // The API returns all shares by default. 
        // We handle pagination slicing client-side for immediate responsive feel.
        const start = (pageNumber - 1) * RESULTS_PER_PAGE;
        const end = start + RESULTS_PER_PAGE;
        const newShares = data.shares.slice(start, end);

        if (pageNumber === 1) {
          setShares(newShares);
        } else {
          setShares(prev => [...prev, ...newShares]);
        }

        setHasMore(data.shares.length > end);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Failed to fetch gallery', err);
      setHasMore(false);
    } finally {
      if (pageNumber === 1) {
        // Small delay for shimmer effect visibility
        setTimeout(() => setLoading(false), 500);
      } else {
        setTimeout(() => setLoadingMore(false), 500);
      }
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchShares(nextPage);
  };

  const renderSkeletons = (count: number) => {
    return Array.from({ length: count }).map((_, i) => (
      <div key={`skel-${i}`} className="bg-white rounded-3xl border border-[#E8DDD4] p-5 shadow-sm animate-pulse flex flex-col items-center">
        <div className="flex items-center -space-x-6 mb-4">
          <div className="w-20 h-20 rounded-full border-4 border-white shadow-md bg-gray-200 relative z-10"></div>
          <div className="w-20 h-20 rounded-full border-4 border-white shadow-md bg-gray-200 relative z-0"></div>
        </div>
        <div className="h-5 bg-gray-200 rounded w-1/2 mb-3"></div>
        <div className="h-4 bg-gray-200 rounded-full w-20 mb-4"></div>
        <div className="flex flex-wrap gap-2 justify-center w-full mb-3">
          <div className="h-5 bg-gray-200 rounded w-16"></div>
          <div className="h-5 bg-gray-200 rounded w-20"></div>
          <div className="h-5 bg-gray-200 rounded w-14"></div>
        </div>
      </div>
    ));
  };

  return (
    <div className="min-h-screen bg-[#FAF6F4]">
      {/* Header */}
      <div className="bg-white border-b border-[#E8DDD4] sticky top-[calc(env(safe-area-inset-top,0px)+72px)] z-30">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <NextLink
            href="/"
            className="text-sm font-bold text-[#8B7E7D] hover:text-[#8B5E3C] transition-colors flex items-center gap-1.5 text-decoration-none"
            style={{ textDecoration: 'none' }}
          >
            &larr; Back to Home
          </NextLink>
          <NextLink
            href="/twin"
            className="bg-[#8B5E3C] hover:bg-[#7A5234] text-white text-sm font-bold py-2.5 px-6 rounded-xl transition-all shadow-sm text-decoration-none whitespace-nowrap"
            style={{ textDecoration: 'none' }}
          >
            Try Pet Twin &rarr;
          </NextLink>
        </div>
      </div>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-12">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-3xl md:text-5xl font-[800] text-[#191919] tracking-[-0.02em] leading-tight mb-4 flex items-center justify-center gap-2">
            Pet Twin Gallery <Footprints className="w-8 h-8 text-[#8B5E3C] inline-block" />
          </h1>
          <p className="text-[#666666] text-lg leading-relaxed">
            Discover the amazing community matches. See what dog or cat breed matches people's personality and facial features!
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {shares.map(share => (
            <div key={share.id} className="bg-white rounded-3xl border border-[#E8DDD4] p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center animate-fade-in group">
              
              {/* Double Avatar */}
              <div className="flex items-center -space-x-6 mb-4">
                <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-md bg-[#F5EDE4] relative z-10 flex items-center justify-center text-xl">
                  {share.userPhoto ? (
                    <img src={share.userPhoto} alt="User" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-6 h-6 text-[#8B7E7D]" />
                  )}
                </div>
                <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-md bg-[#FAF6F4] relative z-0 flex items-center justify-center">
                  {share.petPhoto ? (
                    <img src={share.petPhoto} alt={share.petBreed} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <PawPrint className="w-6 h-6 text-[#8B7E7D]" />
                  )}
                </div>
              </div>

              {/* Info */}
              <h3 className="font-black text-[#191919] text-lg mb-1">{share.petBreed}</h3>
              <div className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#8B5E3C]/10 text-[#8B5E3C] mb-4">
                {share.matchScore}% Match
              </div>

              {/* Action Row: Heart Reaction & Direct Delete (for owner only) */}
              <div className="w-full flex items-center justify-between border-t border-[#E8DDD4] pt-2.5 mt-3 gap-2" onClick={e => e.stopPropagation()}>
                <FacebookReactionPicker
                  itemId={share.id}
                  initialHelpfulCount={share.helpful_count || 0}
                  size="sm"
                  minimalHeartStyle={true}
                />

                {!!myPostTokens[share.id] && (
                  <button
                    type="button"
                    onClick={() => handleDeleteTwinPost(share.id, myPostTokens[share.id])}
                    disabled={deletingId === share.id}
                    className="text-[#8B7E7D] hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-red-50 text-xs font-semibold flex items-center gap-1 cursor-pointer border-none bg-transparent"
                    title="Delete my post"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="text-[11px]">{deletingId === share.id ? 'Deleting...' : 'Delete'}</span>
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Skeletons */}
          {loading && renderSkeletons(12)}
          {loadingMore && renderSkeletons(4)}
        </div>

        {/* Load More Button */}
        {!loading && hasMore && (
          <div className="mt-12 flex justify-center">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="bg-white border-2 border-[#E8DDD4] hover:bg-[#FAF6F4] text-[#8B5E3C] font-bold py-3.5 px-8 rounded-xl transition-all disabled:opacity-70 flex items-center gap-2 cursor-pointer shadow-sm hover:shadow-md"
            >
              {loadingMore ? (
                <>
                  <span className="w-5 h-5 border-2 border-[#8B5E3C] border-t-transparent rounded-full animate-spin"></span>
                  Loading...
                </>
              ) : (
                'Load More Results ↓'
              )}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
