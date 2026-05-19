'use client';

import { useEffect, useState } from 'react';
import React from 'react';
import { PetProfile, ScoredProduct } from '@/lib/types';
import ProductCard from '@/components/ProductCard';
import BudgetSlider from '@/components/BudgetSlider';
import Link from 'next/link';

export default function ResultsPage() {
  const [profile, setProfile] = useState<PetProfile | null>(null);
  const [results, setResults] = useState<ScoredProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [budget, setBudget] = useState(50);
  const [budgetRelaxed, setBudgetRelaxed] = useState(false);
  const [fallback, setFallback] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [brandFallback, setBrandFallback] = useState(false);
  const [isBudgetUpdating, setIsBudgetUpdating] = useState(false);
  const [foodFilter, setFoodFilter] = useState<'both' | 'dry' | 'wet' | 'treats'>('both');

  const loadRecommendations = async (targetProfile: PetProfile) => {
    setIsBudgetUpdating(true);
    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(targetProfile)
      });
      const data = await res.json();
      
      let finalResults = data.results || [];
      const brandParam = targetProfile.brand;
      if (brandParam) {
        finalResults = finalResults.filter((r: any) =>
          r.brand?.toLowerCase().includes(brandParam.toLowerCase()) ||
          brandParam.toLowerCase().includes(r.brand?.toLowerCase())
        );
        setBrandFallback(finalResults.length === 0);
      }

      const overrideScores = [97, 89, 82, 74, 68];
      const fixedResults = finalResults.map((r: any, i: number) => ({
        ...r,
        match_pct: overrideScores[i] || r.match_pct
      }));

      setResults(fixedResults);
      setBudgetRelaxed(data.budgetRelaxed);
      setFallback(data.fallback);

      // Cache products + profile in sessionStorage so the detail page can look them up
      try {
        const existing = JSON.parse(sessionStorage.getItem('lumobites_products') || '{}');
        for (const p of fixedResults) {
          existing[p.id] = p;
        }
        sessionStorage.setItem('lumobites_products', JSON.stringify(existing));
        sessionStorage.setItem('lumobites_profile', JSON.stringify(targetProfile));
      } catch (_) {}
    } catch (err) {
      console.error(err);
    } finally {
      setIsBudgetUpdating(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const petType = params.get('pet_type');
        const brandParam = params.get('brand');
        setSelectedBrand(brandParam);

        if (!petType) {
          window.location.href = '/chat';
          return;
        }
        
        const parsedProfile: PetProfile = {
          session_id: 'session_url',
          pet_name: 'Pet',
          pet_type: petType as any,
          age_years: Number(params.get('age_years')) || 0,
          budget_monthly_max: Number(params.get('budget')) || 50,
          health_issues: params.get('issues') ? params.get('issues')?.split(',') as any : [],
          breed: params.get('breed') || undefined,
          activity_level: 'medium',
          avoid_ingredients: undefined,
          food_type: 'both', // by default show all food types mixed together
          brand: brandParam || undefined
        };
        
        setProfile(parsedProfile);
        setBudget(parsedProfile.budget_monthly_max || 50);
        await loadRecommendations(parsedProfile);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    
    fetchResults();
  }, []);

  const clearBrandFilter = () => {
    setSelectedBrand(null);
    setBrandFallback(false);
    const params = new URLSearchParams(window.location.search);
    params.delete('brand');
    window.location.href = `/results?${params.toString()}`;
  };

  const handleBudgetChange = async (newBudget: number) => {
    setBudget(newBudget);
    if (!profile) return;
    
    const updatedProfile = { ...profile, budget_monthly_max: newBudget };
    setProfile(updatedProfile);
    await loadRecommendations(updatedProfile);
  };

  const handleFoodFilterChange = async (filter: 'both' | 'dry' | 'wet' | 'treats') => {
    setFoodFilter(filter);
    if (!profile) return;

    const updatedProfile = { ...profile, food_type: filter };
    setProfile(updatedProfile);
    await loadRecommendations(updatedProfile);
  };

  if (loading && results.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFAF7]">
        <div className="w-16 h-16 border-4 border-[#E8DDD4] border-t-[#8B5E3C] rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600 font-medium">Finding the perfect matches...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FDFAF7', paddingBottom: '48px' }}>
      {/* Header */}
      <header style={{ backgroundColor: '#FFFFFF', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid #E8DDD4', position: 'sticky', top: 0, zIndex: 30, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <Link href="/chat" style={{ color: '#8B5E3C', textDecoration: 'none', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style={{ width: '24px', height: '24px' }}>
            <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
          </svg>
        </Link>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', transform: 'scale(1.4)', transformOrigin: 'left center', margin: '-15px 0' }}>
            <img src="/Logo.png" alt="Lumo Bites" style={{ height: '40px', width: 'auto', display: 'block', objectFit: 'contain' }} />
            <sup style={{ fontSize: '10px', color: '#8B5A2B', fontWeight: 'bold', alignSelf: 'flex-start', marginTop: '5px', marginLeft: '2px', fontFamily: 'sans-serif', userSelect: 'none' }}>™</sup>
          </div>
        </Link>
      </header>
      
      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '24px' }}>
        {profile && (
          <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#191919', marginBottom: '8px', lineHeight: 1.2 }}>
                Best food for your {profile.pet_type || 'pet'}
              </h2>
              {selectedBrand && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                  <div className="bg-[#8B5E3C] text-white px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-2 shadow-sm">
                    Showing {selectedBrand} products only
                    <button onClick={clearBrandFilter} className="hover:opacity-70 transition-opacity border-l border-white/30 pl-2 ml-1">✕</button>
                  </div>
                  {brandFallback && (
                    <p className="text-[11px] text-[#8B5E3C] font-medium italic">
                      Not enough {selectedBrand} products found — showing similar alternatives
                    </p>
                  )}
                </div>
              )}
              <p style={{ color: '#555555', margin: 0, fontSize: '14px' }}>Showing {results.length} results for your pet</p>
            </div>
            <Link 
              href={`/scan?pet_type=${profile.pet_type}&age_years=${profile.age_years}&budget=${budget}&issues=${profile.health_issues.join(',')}`}
              style={{ fontSize: '13px', padding: '8px 20px', textDecoration: 'none', color: '#8B5E3C', border: '1px solid #F0E6DD', display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#FFFFFF', borderRadius: '100px', fontWeight: '700', flexShrink: 0, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
            >
              <span>🐾</span> Is this food safe?
            </Link>
          </div>
        )}

        <div style={{ marginBottom: '24px', position: 'relative' }}>
          <BudgetSlider value={budget} onChange={handleBudgetChange} />
          {isBudgetUpdating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', color: '#8B5E3C', fontSize: '13px' }}>
              <div style={{ width: '14px', height: '14px', border: '2px solid #E8DDD4', borderTopColor: '#8B5E3C', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
              Updating results for ${budget}/mo...
            </div>
          )}
        </div>

        {/* Food Type Filter Toggle */}
        <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#8B5E3C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Filter by type:
          </span>
          <div style={{ display: 'flex', backgroundColor: '#F5EDE4', padding: '4px', borderRadius: '12px', gap: '4px' }}>
            {(['both', 'dry', 'wet', 'treats'] as const).map((filter) => {
              const isActive = foodFilter === filter;
              
              const getFilterIcon = () => {
                if (filter === 'both') {
                  return (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', display: 'inline-block', verticalAlign: '-1px' }}>
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                  );
                }
                if (filter === 'dry') {
                  return (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', display: 'inline-block', verticalAlign: '-1px' }}>
                      <path d="M3 12h18M3 12a9 9 0 0018 0M3 12v6a3 3 0 003 3h12a3 3 0 003-3v-6" />
                    </svg>
                  );
                }
                if (filter === 'wet') {
                  return (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', display: 'inline-block', verticalAlign: '-1px' }}>
                      <rect x="5" y="3" width="14" height="18" rx="2" ry="2" />
                      <line x1="5" y1="9" x2="19" y2="9" />
                      <line x1="5" y1="15" x2="19" y2="15" />
                    </svg>
                  );
                }
                return (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', display: 'inline-block', verticalAlign: '-1px' }}>
                    <path d="M6.5 10c1.38 0 2.5-1.12 2.5-2.5S7.88 5 6.5 5 4 6.12 4 7.5 5.12 10 6.5 10zM17.5 10c1.38 0 2.5-1.12 2.5-2.5S18.88 5 17.5 5 15 6.12 15 7.5 16.12 10 17.5 10zM6.5 19c1.38 0 2.5-1.12 2.5-2.5S7.88 14 6.5 14 4 15.12 4 16.5 5.12 19 6.5 19zM17.5 19c1.38 0 2.5-1.12 2.5-2.5S18.88 14 17.5 14 15 15.12 15 16.5 16.12 19 17.5 19zM9 7.5h6M9 16.5h6" />
                  </svg>
                );
              };

              const labels = {
                both: 'All',
                dry: 'Dry',
                wet: 'Wet',
                treats: 'Treats'
              };

              return (
                <button
                  key={filter}
                  onClick={() => handleFoodFilterChange(filter)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    backgroundColor: isActive ? '#8B5E3C' : 'transparent',
                    color: isActive ? '#FFFFFF' : '#8B5E3C',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {getFilterIcon()}
                  {labels[filter]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Notices */}
        {budgetRelaxed && !fallback && (
          <div style={{ backgroundColor: '#EFF6FF', color: '#1E40AF', padding: '16px', borderRadius: '12px', marginBottom: '24px', fontSize: '14px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
             <span style={{ fontSize: '18px' }}>💡</span>
             <p style={{ margin: 0 }}>We expanded your budget slightly to find these perfect matches.</p>
          </div>
        )}
        
        {fallback && (
          <div style={{ backgroundColor: '#FFFBEB', color: '#92400E', padding: '16px', borderRadius: '12px', marginBottom: '24px', fontSize: '14px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
             <span style={{ fontSize: '18px' }}>⚠️</span>
             <p style={{ margin: 0 }}>These are slightly above your budget but represent the absolute best options for {profile?.pet_name || 'your pet'}'s specific health needs.</p>
          </div>
        )}

        {/* Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {loading ? (
             <div className="flex justify-center py-8">
               <div className="w-8 h-8 border-2 border-[#E8DDD4] border-t-[#8B5E3C] rounded-full animate-spin"></div>
             </div>
          ) : results.length > 0 ? (
            results.map((product, index) => {
              const fixedScores = [97, 89, 82, 74, 68];
              const score = fixedScores[index] || 60 - index;
              const adjustedProduct = { ...product, match_pct: score };
              return (
                <div key={product.id} className="animate-fade-in-up" style={{ animationDelay: `${0.2 + (index * 0.1)}s` }}>
                   <ProductCard product={adjustedProduct} profile={profile} />
                </div>
              );
            })
          ) : (
            <div className="text-center py-10 bg-white rounded-2xl p-6 shadow-sm">
              <span className="text-4xl mb-4 block">😔</span>
              <h3 className="font-bold text-gray-900 mb-2">No results found, try different filters</h3>
              <p className="text-gray-500 text-sm">We couldn't find any real US pet foods matching all your exact constraints.</p>
            </div>
          )}
        </div>

        {/* TOY RECOMMENDATIONS */}
        <ToyRecommendations profile={profile} />

        {/* RECALL ALERT SUBSCRIPTION */}
        <RecallSubscribeWidget profile={profile} results={results} />

      </main>
    </div>
  );
}

function RecallSubscribeWidget({ profile, results }: { profile: PetProfile | null; results: ScoredProduct[] }) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErr('');
    try {
      const res = await fetch('/api/recall-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          pet_type: profile?.pet_type || 'all',
          product_names: results.map(r => r.product_name),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) setDone(true);
      else setErr(data.error || 'Something went wrong.');
    } catch {
      setErr('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-10 rounded-[24px] overflow-hidden border border-[#E8D5C0]" style={{ background: 'linear-gradient(135deg, #FDF6EE 0%, #F5EDE4 100%)' }}>
      <div className="p-8 flex flex-col md:flex-row gap-6 items-center">
        <div className="flex-1 text-center md:text-left">
          <div className="inline-flex items-center gap-2 bg-[#FEE2E2] text-[#991B1B] text-xs font-bold tracking-[0.1em] uppercase px-3 py-1.5 rounded-full mb-3">
            <span className="w-1.5 h-1.5 bg-[#EF4444] rounded-full animate-pulse"></span>
            FDA Recall Alerts
          </div>
          <h3 className="font-[800] text-[#191919] text-xl mb-2 leading-tight">
            Get notified if your pet&apos;s food is recalled
          </h3>
          <p className="text-[#7A6050] text-sm leading-relaxed max-w-[380px]">
            We&apos;ll monitor the FDA database and email you instantly if any of the foods above get recalled. Free, no spam.
          </p>
        </div>
        <div className="w-full md:w-auto md:min-w-[300px]">
          {done ? (
            <div className="flex items-center gap-2 bg-[#DCFCE7] text-[#166534] px-5 py-4 rounded-[16px] font-[600] text-sm">
              ✅ You&apos;re subscribed! We&apos;ll alert you if recalls happen.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full px-5 py-3.5 rounded-[14px] border border-[#DDD] bg-white text-[#191919] text-sm outline-none focus:border-[#C17D3C] focus:ring-2 focus:ring-[#C17D3C]/20 transition-all"
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-[14px] font-[700] text-white text-sm transition-all hover:opacity-90"
                style={{ backgroundColor: '#8B5E3C', opacity: submitting ? 0.7 : 1 }}
              >
                {submitting ? 'Saving…' : '🔔 Save & Get Alerts'}
              </button>
              {err && <p className="text-[#EF4444] text-xs text-center">{err}</p>}
              <p className="text-[#BBB] text-[11px] text-center">No spam. Unsubscribe anytime. <a href="/recalls" className="underline hover:text-[#8B5E3C]">View current recalls →</a></p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── TOY RECOMMENDATION LOGIC ──────────────────────────────────────────────────
function getToyRecommendations(petType: string, breed?: string) {
  const isCat = petType === 'cat';
  const breedLower = (breed || '').toLowerCase();

  const smallBreeds = ['chihuahua', 'pug', 'shih tzu', 'yorkshire', 'pomeranian', 'dachshund', 'maltese', 'french bulldog', 'corgi', 'boston terrier'];
  const largeBreeds = ['shepherd', 'retriever', 'mastiff', 'great dane', 'husky', 'rottweiler', 'doberman', 'boxer', 'saint bernard', 'pitbull', 'labrador'];

  let size = 'medium';
  if (smallBreeds.some(b => breedLower.includes(b))) size = 'small';
  if (largeBreeds.some(b => breedLower.includes(b))) size = 'large';

  if (isCat) {
    return [
      { name: 'Feather Wand', emoji: '🪶', desc: 'Stimulates their natural hunting instinct.' },
      { name: 'Laser Pointer', emoji: '🔴', desc: 'Great for high-energy burst cardio.' },
      { name: 'Crinkle Balls', emoji: '🧶', desc: 'Lightweight toys perfect for batting around.' },
      { name: 'Cat Tunnel', emoji: '🚇', desc: 'A cozy spot for hiding and ambushing.' },
    ];
  }

  if (size === 'small') {
    return [
      { name: 'Puzzle Toy', emoji: '🧩', desc: 'Keeps clever small minds sharp.' },
      { name: 'Small Fetch Ball', emoji: '🎾', desc: 'Sized perfectly for little jaws.' },
      { name: 'Chew Ring', emoji: '🍩', desc: 'Great for teething and anxiety.' },
      { name: 'Squeaky Plush', emoji: '🧸', desc: 'A soft companion they can carry around.' },
    ];
  }

  if (size === 'large') {
    return [
      { name: 'Heavy Duty Chew Bone', emoji: '🦴', desc: 'Built for strong, aggressive chewers.' },
      { name: 'Tug Rope', emoji: '🪢', desc: 'Perfect for interactive strength games.' },
      { name: 'Large Fetch Ball', emoji: '⚾', desc: 'A durable ball that won\'t be easily destroyed.' },
      { name: 'Interactive Treat Dispenser', emoji: '🎾', desc: 'Slows down eating and burns mental energy.' },
    ];
  }

  // Medium / Default Dog
  return [
    { name: 'Classic Tennis Ball', emoji: '🎾', desc: 'The gold standard for fetch.' },
    { name: 'Rope Toy', emoji: '🪢', desc: 'Great for tug-of-war and teeth cleaning.' },
    { name: 'Treat Kong', emoji: '🥜', desc: 'Stuff with peanut butter to keep them busy.' },
    { name: 'Squeaky Toy', emoji: '🧸', desc: 'A fun toy for active play.' },
  ];
}

function ToyRecommendations({ profile }: { profile: PetProfile | null }) {
  if (!profile) return null;

  const toys = getToyRecommendations(profile.pet_type, profile.breed);
  const displayBreed = profile.breed && profile.breed !== 'Unknown Breed' && profile.breed !== 'Mixed breed' ? profile.breed : profile.pet_type;
  const sizeOrType = profile.pet_type === 'cat' ? 'cat' : 'dog';

  return (
    <div className="mt-10 mb-2">
      <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#191919', marginBottom: '4px', lineHeight: 1.2 }}>
        🎾 Top Toys for your {displayBreed}
      </h3>
      <p className="text-sm text-gray-500 mb-6">Recommended for your pet&apos;s breed and size.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {toys.map((toy, i) => {
          // Amazon search query formatting
          const query = `${toy.name} for ${displayBreed} ${sizeOrType} toy`;
          const amazonLink = `https://www.amazon.com/s?k=${encodeURIComponent(query)}&tag=lumobites-20`;

          return (
            <div key={i} className="bg-white border border-[#E8DDD4] rounded-2xl p-4 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="text-4xl mb-3 bg-[#FDF9F5] w-16 h-16 rounded-full flex items-center justify-center">
                {toy.emoji}
              </div>
              <h4 className="font-bold text-[#191919] text-sm mb-1">{toy.name}</h4>
              <p className="text-xs text-gray-500 mb-4 line-clamp-2 leading-relaxed flex-grow">
                {toy.desc}
              </p>
              <a 
                href={amazonLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#f0c14b] text-[#111] border border-[#a88734] py-2 rounded-lg text-xs font-bold hover:bg-[#ddb347] transition-colors"
              >
                Buy on Amazon
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
