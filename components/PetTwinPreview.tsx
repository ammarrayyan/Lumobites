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
  personalityBreakdown?: string;
  famousPets?: string[];
  bothSection?: string[];
  compatibility?: string;
  celebrityMatch?: string;
}

export default function PetTwinPreview() {
  const [shares, setShares] = useState<SharedTwin[]>([]);
  const [selectedShare, setSelectedShare] = useState<SharedTwin | null>(null);
  const [loading, setLoading] = useState(true);

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

  const displayedShares = shares.slice(0, 3);

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
              <div className="space-y-5">
                {displayedShares.map(share => (
                  <div 
                    key={share.id} 
                    onClick={() => setSelectedShare(share)}
                    className="flex gap-4 items-start border-b border-[#FAF6F4] last:border-0 pb-4 last:pb-0 animate-fade-in cursor-pointer hover:bg-[#FAF6F4]/50 transition-colors p-2 -m-2 rounded-2xl"
                  >
                    
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
                          onClick={(e) => {
                            e.stopPropagation();
                            setRemovePostId(share.id);
                            setRemoveEmail('');
                            setRemoveStatus('idle');
                            setRemoveMessage('');
                            setRemoveModalOpen(true);
                          }}
                          className="text-[10px] text-gray-400 hover:text-red-500 font-bold transition-colors cursor-pointer border-0 bg-transparent p-0 relative z-10"
                        >
                          Remove my result
                        </button>
                      </div>
                    </div>

                  </div>
                ))}
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

      {/* Full Result Details Modal */}
      {selectedShare && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedShare(null)}
        >
          <div 
            className="bg-white rounded-3xl border border-[#E8DDD4] p-6 md:p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative animate-scale-up text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedShare(null)}
              className="absolute top-4 right-4 text-[#8B7E7D] hover:text-[#4A3E3D] text-2xl font-bold transition-colors cursor-pointer w-8 h-8 rounded-full bg-[#FAF6F4] flex items-center justify-center border-0"
            >
              &times;
            </button>

            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-[#8B5E3C]/10 text-[#8B5E3C] text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                Pet Twin Match Result
              </span>
            </div>
            <h3 className="text-2xl font-black text-[#191919] tracking-tight">
              Matched with {selectedShare.petBreed}! 🐾
            </h3>

            {/* Photos & Match % */}
            <div className="flex items-center justify-center gap-4 my-6 relative">
              {/* User Photo */}
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-4 border-white shadow-md bg-[#F5EDE4]">
                  {selectedShare.userPhoto ? (
                    <img src={selectedShare.userPhoto} alt="You" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl bg-[#F5EDE4]">🧑</div>
                  )}
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-[#8B7E7D] tracking-wider uppercase">You</span>
              </div>

              {/* Match Badge */}
              <div className="flex flex-col items-center justify-center bg-[#8B5E3C] text-white w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-white shadow-md z-10 -mx-3 shrink-0">
                <span className="text-base sm:text-xl font-black">{selectedShare.matchScore}%</span>
                <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider">Match</span>
              </div>

              {/* Breed Photo */}
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-4 border-white shadow-md bg-[#F5EDE4]">
                  {selectedShare.petPhoto ? (
                    <img src={selectedShare.petPhoto} alt={selectedShare.petBreed} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl bg-[#F5EDE4]">🐕</div>
                  )}
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-[#8B7E7D] tracking-wider uppercase">Twin</span>
              </div>
            </div>

            {/* Traits */}
            <div className="flex flex-wrap gap-1.5 justify-center mb-6">
              {selectedShare.traits.map(trait => (
                <span key={trait} className="text-xs bg-[#FAF6F4] text-[#8B5E3C] font-semibold px-2.5 py-1 rounded-full border border-[#E8DDD4]">
                  {trait}
                </span>
              ))}
            </div>

            {/* Quote Block */}
            <div className="bg-[#FAF6F4] border-l-4 border-[#8B5E3C] p-4 rounded-r-xl mb-6">
              <p className="text-sm font-medium text-[#4A3E3D] italic">
                &ldquo;{selectedShare.quote}&rdquo;
              </p>
            </div>

            {/* Detailed Content Sections */}
            <div className="space-y-5 text-sm text-[#4A3E3D] border-t border-[#F0E8E0] pt-5">
              
              {/* 1. Personality Breakdown */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#8B5E3C] mb-1.5">
                  Personality Analysis
                </h4>
                <p className="text-xs leading-relaxed text-[#666666]">
                  {selectedShare.personalityBreakdown || `A fascinating combination of traits! As a ${selectedShare.petBreed} match, you share a unique connection marked by these distinct qualities.`}
                </p>
              </div>

              {/* 2. You and your Pet Twin both... */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#8B5E3C] mb-2">
                  You & Your Pet Twin both...
                </h4>
                <ul className="space-y-1.5 text-xs text-[#666666] list-none pl-0">
                  {(selectedShare.bothSection && selectedShare.bothSection.length > 0 ? selectedShare.bothSection : [
                    "Share a warm and friendly presence that makes others feel welcome.",
                    "Exhibit a natural loyalty and dedication to those you care about.",
                    "Adapt beautifully to different situations and environments."
                  ]).map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[#8B5E3C] font-bold">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 3. Famous Pets */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#8B5E3C] mb-1.5">
                  Famous {selectedShare.petBreed} Pets
                </h4>
                <p className="text-xs leading-relaxed text-[#666666]">
                  {(selectedShare.famousPets && selectedShare.famousPets.length > 0 ? selectedShare.famousPets : (
                    selectedShare.petBreed.toLowerCase().includes('golden') ? ["Shadow (from Homeward Bound)", "Buddy (from Air Bud)", "Comet (from Full House)"] :
                    selectedShare.petBreed.toLowerCase().includes('siamese') ? ["Si & Am (from Lady and the Tramp)", "DC (from That Darn Cat!)", "Tao (from The Incredible Journey)"] :
                    selectedShare.petBreed.toLowerCase().includes('corgi') ? ["Susan (Queen Elizabeth II's first Corgi)", "Ein (from Cowboy Bebop)", "Bud (from Corgi Racing)"] :
                    [`Famous representatives of the gorgeous ${selectedShare.petBreed} breed`]
                  )).join(', ')}
                </p>
              </div>

              {/* 4. Celebrity Match */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#8B5E3C] mb-1.5">
                  Celebrity Twin Match
                </h4>
                <p className="text-xs leading-relaxed text-[#666666]">
                  {selectedShare.celebrityMatch || (
                    selectedShare.petBreed.toLowerCase().includes('golden') ? "Tom Hanks (warm, universally beloved, and loyal)" :
                    selectedShare.petBreed.toLowerCase().includes('siamese') ? "Taylor Swift (elegant, expressive, and vocal)" :
                    selectedShare.petBreed.toLowerCase().includes('corgi') ? "Queen Elizabeth II (royal, charming, and highly energetic)" :
                    `A well-known public figure sharing your ${selectedShare.petBreed} charisma`
                  )}
                </p>
              </div>

              {/* 5. Compatibility */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#8B5E3C] mb-1.5">
                  Compatibility
                </h4>
                <p className="text-xs leading-relaxed text-slate-700 bg-emerald-50 text-emerald-800 font-medium px-3 py-2 rounded-lg border border-emerald-100">
                  🐾 You are most compatible with{' '}
                  <span className="font-bold">
                    {selectedShare.compatibility || (
                      selectedShare.petBreed.toLowerCase().includes('golden') ? "Husky and Labrador Retriever" :
                      selectedShare.petBreed.toLowerCase().includes('siamese') ? "Ragdoll and Birman" :
                      selectedShare.petBreed.toLowerCase().includes('corgi') ? "German Shepherd and Pembroke Corgi" :
                      "Other friendly and highly compatible breeds"
                    )}
                  </span>{' '}
                  owners!
                </p>
              </div>

            </div>

            {/* Action Footer */}
            <div className="mt-8 pt-5 border-t border-[#F0E8E0] flex justify-end">
              <button
                onClick={() => setSelectedShare(null)}
                className="bg-[#8B5E3C] hover:bg-[#7A5234] text-white font-bold py-2.5 px-6 rounded-xl transition-all cursor-pointer border-0"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}
