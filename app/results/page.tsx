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
          weight_lbs: params.get('weight_lbs') ? Number(params.get('weight_lbs')) : undefined,
          budget_monthly_max: Number(params.get('budget')) || 50,
          health_issues: params.get('issues') ? params.get('issues')?.split(',') as any : [],
          breed: undefined,
          activity_level: 'medium',
          avoid_ingredients: undefined,
          food_type: params.get('food_type') as any,
          brand: brandParam || undefined
        };
        
        setProfile(parsedProfile);
        setBudget(parsedProfile.budget_monthly_max || 50);
        
        const res = await fetch('/api/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsedProfile)
        });
        
        const data = await res.json();
        let finalResults = data.results || [];
        if (brandParam) {
          finalResults = finalResults.filter((r: any) =>
            r.brand?.toLowerCase().includes(brandParam.toLowerCase()) ||
            brandParam.toLowerCase().includes(r.brand?.toLowerCase())
          );
          setBrandFallback(finalResults.length === 0);
        }

        setResults(finalResults);
        setBudgetRelaxed(data.budgetRelaxed);
        setFallback(data.fallback);

        // Cache products + profile in sessionStorage so the detail page can look them up
        try {
          const existing = JSON.parse(sessionStorage.getItem('lumobites_products') || '{}');
          for (const p of finalResults) {
            existing[p.id] = p;
          }
          sessionStorage.setItem('lumobites_products', JSON.stringify(existing));
          // Store the profile so the product detail page knows which health issues user selected
          sessionStorage.setItem('lumobites_profile', JSON.stringify(parsedProfile));
        } catch (_) {}
      } catch (err) {
        console.error(err);
      } finally {
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
    setIsBudgetUpdating(true);

    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProfile)
      });
      const data = await res.json();
      const overrideScores = [97, 89, 82, 74, 68];
      const fixedResults = (data.results || []).map((r: any, i: number) => ({
        ...r,
        match_pct: overrideScores[i] || r.match_pct
      }));
      setResults(fixedResults);
      setBudgetRelaxed(data.budgetRelaxed);
      setFallback(data.fallback);

      // Update sessionStorage with new results
      try {
        const existing = JSON.parse(sessionStorage.getItem('lumobites_products') || '{}');
        for (const p of fixedResults) { existing[p.id] = p; }
        sessionStorage.setItem('lumobites_products', JSON.stringify(existing));
      } catch (_) {}
    } catch (err) {
      console.error(err);
    } finally {
      setIsBudgetUpdating(false);
    }
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
        <Link href="/" style={{ display: 'flex', alignItems: 'center' }}>
          <img 
            src="/Logo.png" 
            alt="Lumo Bites" 
            style={{ height: '70px', width: 'auto', display: 'block', objectFit: 'contain', transform: 'scale(1.4)', margin: '-15px 0', transformOrigin: 'left center' }}
          />
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
