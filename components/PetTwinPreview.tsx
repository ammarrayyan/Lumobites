'use client';

import React, { useState, useEffect } from 'react';
import NextLink from 'next/link';
import { Sparkles, Lock, Mail, AlertTriangle } from 'lucide-react';

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
}

export default function PetTwinPreview() {
  const [shares, setShares] = useState<SharedTwin[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  // States for Self-Service Deletion Modal
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [removePostId, setRemovePostId] = useState<string | null>(null);
  const [removeEmail, setRemoveEmail] = useState('');
  const [removeStatus, setRemoveStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [removeMessage, setRemoveMessage] = useState('');

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
          setShares(data.shares.slice(0, 10));
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

  const handleRemoveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!removePostId || !removeEmail.trim()) return;

    setRemoveStatus('loading');
    setRemoveMessage('');
    try {
      const res = await fetch('/api/twin/remove-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: removePostId, email: removeEmail })
      });
      const data = await res.json();
      if (res.ok) {
        setRemoveStatus('success');
        setRemoveMessage(data.message || 'Verification email sent! Please check your inbox.');
      } else {
        setRemoveStatus('error');
        setRemoveMessage(data.error || 'Failed to send removal email.');
      }
    } catch (err) {
      console.error(err);
      setRemoveStatus('error');
      setRemoveMessage('An unexpected error occurred. Please try again.');
    }
  };

  const displayedShares = expanded ? shares : shares.slice(0, 3);

  return (
    <section className="w-full bg-[#FAF6F4] border-t border-[#E8DDD4] px-6 py-16">
      <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center gap-10">
        
        {/* Left Side: Call to Action */}
        <div className="flex-1 text-center md:text-left order-1 md:order-1">
          <div className="inline-block bg-[#8B5E3C]/10 text-[#8B5E3C] text-xs font-bold tracking-[0.1em] uppercase px-3 py-1 rounded-full mb-4">
            AI Pet Twin Matcher
          </div>
          <h2 className="text-3xl md:text-4xl font-[800] text-[#191919] tracking-[-0.02em] leading-tight mb-4 flex items-center justify-center md:justify-start gap-2 flex-wrap">
            <Sparkles className="w-8 h-8 text-amber-500 shrink-0" /> Discover Your Perfect Pet Twin Match
          </h2>
          <p className="text-[#666666] text-lg leading-[1.6] mb-8 max-w-[500px] mx-auto md:mx-0">
            Upload a selfie to find which dog or cat breed matches your personality and facial features. Check out real matches shared by our community!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <NextLink 
              href="/twin" 
              className="bg-[#8B5E3C] hover:bg-[#7A5234] text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md text-center text-decoration-none"
              style={{ textDecoration: 'none' }}
            >
              Find Your Twin &rarr;
            </NextLink>
            <button
              onClick={() => setExpanded(true)}
              className="bg-white hover:bg-[#F5EDE4] border-2 border-[#E8DDD4] text-[#4A3E3D] font-bold py-3 px-6 rounded-xl transition-all shadow-sm text-center cursor-pointer"
            >
              See All Matches &rarr;
            </button>
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

                      {/* Small Remove Link */}
                      <div className="mt-2">
                        <button
                          onClick={() => {
                            setRemovePostId(share.id);
                            setRemoveEmail('');
                            setRemoveStatus('idle');
                            setRemoveMessage('');
                            setRemoveModalOpen(true);
                          }}
                          className="text-[10px] text-gray-400 hover:text-red-500 font-bold transition-colors cursor-pointer border-0 bg-transparent p-0"
                        >
                          Remove my result
                        </button>
                      </div>
                    </div>

                  </div>
                ))}

                {/* Smooth See More Expander */}
                {shares.length > 3 && !expanded && (
                  <div className="text-center border-t border-[#F0E8E0] pt-4 mt-2">
                    <button
                      onClick={() => setExpanded(true)}
                      className="text-[#8B5E3C] hover:text-[#734A2E] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 mx-auto transition-colors cursor-pointer border-0 bg-transparent"
                    >
                      See more matches &rarr;
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-[#8B7E7D] italic text-center py-4">No shared matches yet. Be the first!</p>
            )}
          </div>
        </div>

      </div>

      {/* Self-Service Deletion Modal */}
      {removeModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-[#E8DDD4] p-6 max-w-md w-full shadow-2xl relative animate-scale-up text-left">
            <button
              onClick={() => setRemoveModalOpen(false)}
              className="absolute top-4 right-4 text-[#8B7E7D] hover:text-[#4A3E3D] text-2xl font-bold transition-colors cursor-pointer w-8 h-8 rounded-full bg-[#FAF6F4] flex items-center justify-center border-0"
            >
              &times;
            </button>

            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-8 h-8 text-[#8B5E3C] shrink-0" />
              <h3 className="text-xl font-black text-[#4A3E3D]">Remove My Result</h3>
            </div>

            {removeStatus === 'success' ? (
              <div className="text-center py-4">
                <Mail className="w-12 h-12 text-[#8B5E3C] mx-auto mb-3" />
                <p className="text-sm text-emerald-600 font-bold mb-4">{removeMessage}</p>
                <p className="text-xs text-[#8B7E7D] leading-relaxed mb-6">
                  We've sent a secure deletion link to your email. Click the link in that email to permanently remove your result from the gallery.
                </p>
                <button
                  onClick={() => setRemoveModalOpen(false)}
                  className="w-full bg-[#8B5E3C] hover:bg-[#734A2E] text-white text-sm font-bold py-3 rounded-xl transition-all cursor-pointer border-0"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleRemoveSubmit} className="space-y-4">
                <p className="text-xs text-[#8B7E7D] leading-relaxed">
                  Enter the email address you provided when sharing this result. We will send you a verification link to permanently delete it.
                </p>

                {removeStatus === 'error' && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-semibold p-3 rounded-xl flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" /> {removeMessage}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-[#4A3E3D] mb-1.5">Your Associated Email</label>
                  <input
                    required
                    type="email"
                    value={removeEmail}
                    onChange={(e) => setRemoveEmail(e.target.value)}
                    disabled={removeStatus === 'loading'}
                    placeholder="your@email.com"
                    className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-4 py-3 text-sm text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C] transition-all"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setRemoveModalOpen(false)}
                    disabled={removeStatus === 'loading'}
                    className="flex-1 bg-white border border-[#E8DDD4] text-[#8B5E3C] text-sm font-bold py-3 rounded-xl hover:bg-[#FDF9F5] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={removeStatus === 'loading' || !removeEmail.trim()}
                    className="flex-1 bg-[#8B5E3C] hover:bg-[#734A2E] text-white text-sm font-bold py-3 rounded-xl transition-all disabled:bg-gray-400 cursor-pointer flex items-center justify-center gap-1.5 border-0"
                  >
                    {removeStatus === 'loading' ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        Verifying...
                      </>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        Send Link <Mail className="w-4 h-4" />
                      </span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </section>
  );
}
