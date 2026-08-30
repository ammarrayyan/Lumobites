'use client';

import React, { useState, useEffect } from 'react';
import NextLink from 'next/link';
import { Sparkles, Trash2 } from 'lucide-react';
import FacebookReactionPicker from './FacebookReactionPicker';

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
  personalityBreakdown?: string;
  famousPets?: string[];
  bothSection?: string[];
  compatibility?: string;
  celebrityMatch?: string;
}

export default function PetTwinPreview() {
  const [shares, setShares] = useState<SharedTwin[]>([]);
  const [loading, setLoading] = useState(true);
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

  // High quality mock shares as fallback
  const mockShares: SharedTwin[] = [
    {
      id: 'mock-t1',
      created_at: new Date().toISOString(),
      userPhoto: '', 
      petBreed: 'Golden Retriever',
      petType: 'dog',
      petPhoto: 'https://upload.wikimedia.org/wikipedia/commons/b/bd/Golden_Retriever_Dukedestiny01_drvd.jpg',
      matchScore: 96,
      traits: ['Warm', 'Approachable', 'Loyal'],
      quote: "Everyone's best friend — you light up every room you enter!"
    },
    {
      id: 'mock-t2',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      userPhoto: '', 
      petBreed: 'Siamese',
      petType: 'cat',
      petPhoto: 'https://upload.wikimedia.org/wikipedia/commons/2/25/Siam_lilacpoint.jpg',
      matchScore: 92,
      traits: ['Expressive', 'Mysterious', 'Observant'],
      quote: "Elegant, opinionated, and absolutely impossible to ignore!"
    },
    {
      id: 'mock-t3',
      created_at: new Date(Date.now() - 7200000).toISOString(),
      userPhoto: '', 
      petBreed: 'Corgi',
      petType: 'dog',
      petPhoto: 'https://upload.wikimedia.org/wikipedia/commons/9/9e/Welsh_Corgi_Pembroke_Portrait.jpg',
      matchScore: 95,
      traits: ['Perpetually Cheerful', 'Athletic', 'Charming'],
      quote: "Cheerful, charming, and fit for royalty — just like the Queen's favorites!"
    }
  ];

  useEffect(() => {
    const fetchShares = async () => {
      try {
        const res = await fetch('/api/twin/share');
        const data = await res.json();
        if (res.ok && data.shares && data.shares.length > 0) {
          setShares(data.shares.slice(0, 4));
        } else {
          setShares(mockShares);
        }
      } catch (err) {
        console.error('Failed to fetch shared twins:', err);
        setShares(mockShares);
      } finally {
        setLoading(false);
      }
    };
    fetchShares();
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

  const displayedShares = shares.slice(0, 3);
  const hasMore = shares.length > 3;

  return (
    <section className="w-full bg-[#FAF6F4] border-t border-[#E8DDD4] px-6 py-16">
      <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center gap-10">
        
        {/* Left Side: Call to Action */}
        <div className="flex-1 text-center md:text-left order-1 md:order-1">
          <div className="inline-block bg-[#8B5E3C]/10 text-[#8B5E3C] text-xs font-bold tracking-[0.1em] uppercase px-3 py-1 rounded-full mb-4">
            AI Pet Twin Matcher
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#191919] tracking-[-0.02em] leading-tight mb-4 flex items-center justify-center md:justify-start gap-2 flex-wrap">
            <Sparkles className="w-7 h-7 text-amber-500 shrink-0" /> Discover Your Perfect Pet Twin Match
          </h2>
          <p className="text-[#666666] text-sm md:text-base leading-[1.6] mb-8 max-w-[500px] mx-auto md:mx-0">
            Upload a selfie to find which dog or cat breed matches your personality and facial features. Check out real matches shared by our community!
          </p>
          <div className="flex justify-center md:justify-start">
            <NextLink 
              href="/twin" 
              className="bg-[#8B5E3C] hover:bg-[#7A5234] text-white font-bold py-3.5 px-8 rounded-xl transition-all shadow-md text-center text-decoration-none"
              style={{ textDecoration: 'none' }}
            >
              Find Your Twin &rarr;
            </NextLink>
          </div>
        </div>

        {/* Right Side: Real Examples */}
        <div className="flex-1 w-full md:w-auto mt-8 md:mt-0 flex flex-col gap-4 order-2 md:order-2">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#E8DDD4]">
            <h3 className="text-sm font-bold text-[#8B7E7D] uppercase tracking-wider mb-4 border-b border-[#F0E8E0] pb-2">
              Recent Matches Shared
            </h3>
            
            {loading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-4 items-center">
                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : displayedShares.length > 0 ? (
              <>
                <div className="space-y-5">
                  {displayedShares.map(share => (
                    <div key={share.id} className="flex gap-4 items-start border-b border-[#FAF6F4] last:border-0 pb-4 last:pb-0 animate-fade-in">
                      
                      {/* Double Face Avatar */}
                      <div className="flex items-center -space-x-4 shrink-0 mt-1">
                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm bg-[#F5EDE4] relative z-10 flex items-center justify-center text-xs text-[#8B5E3C] font-black">
                          {share.userPhoto ? (
                            <img src={share.userPhoto} alt="User" className="w-full h-full object-cover" />
                          ) : (
                            <span>🧑</span>
                          )}
                        </div>
                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm bg-[#FAF6F4] relative z-0 flex items-center justify-center">
                          {share.petPhoto ? (
                            <img src={share.petPhoto} alt={share.petBreed} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-lg">🐕</span>
                          )}
                        </div>
                      </div>

                      {/* Meta Details */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between min-h-[70px]">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                            <h4 className="font-bold text-[#191919] text-sm truncate">{share.petBreed}</h4>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[#8B5E3C]/5 text-[#8B5E3C] border border-[#8B5E3C]/10">
                              {share.matchScore}% Match
                            </span>
                          </div>
                          {share.traits && share.traits.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {share.traits.slice(0, 3).map(trait => (
                                <span key={trait} className="text-[10px] bg-[#FAF6F4] text-[#8B7E7D] px-1.5 py-0.5 rounded border border-[#E8DDD4]">
                                  {trait}
                                </span>
                              ))}
                            </div>
                          )}
                          <p className="text-[11px] text-[#8B7E7D] italic mt-1.5 leading-relaxed">
                            &ldquo;{share.quote}&rdquo;
                          </p>
                        </div>

                        {/* Action Row: Heart Reaction & Direct Delete (for owner only) */}
                        <div className="flex items-center justify-between border-t border-[#F0E8E0] pt-2 mt-2" onClick={e => e.stopPropagation()}>
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
                              className="text-[#8B7E7D] hover:text-red-600 transition-colors p-1 rounded-lg hover:bg-red-50 text-xs font-semibold flex items-center gap-1 cursor-pointer border-none bg-transparent"
                              title="Delete my result"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="text-[11px]">{deletingId === share.id ? 'Deleting...' : 'Delete'}</span>
                            </button>
                          )}
                        </div>
                      </div>

                    </div>
                  ))}
                </div>

                {hasMore && (
                  <NextLink
                    href="/twin/gallery"
                    className="w-full mt-6 bg-white border border-[#E8DDD4] hover:bg-[#FAF6F4] text-[#8B5E3C] font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-decoration-none"
                    style={{ textDecoration: 'none' }}
                  >
                    See All Matches →
                  </NextLink>
                )}
              </>
            ) : (
              <p className="text-sm text-[#8B7E7D] italic text-center py-4">No shared matches yet. Be the first!</p>
            )}
          </div>
        </div>

      </div>
    </section>
  );
}
