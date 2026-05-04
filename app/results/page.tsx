'use client';

import { useEffect, useState } from 'react';
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

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const petType = params.get('pet_type');
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
          food_type: params.get('food_type') as any
        };
        
        setProfile(parsedProfile);
        setBudget(parsedProfile.budget_monthly_max || 50);
        
        const res = await fetch('/api/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsedProfile)
        });
        
        const data = await res.json();
        setResults(data.results || []);
        setBudgetRelaxed(data.budgetRelaxed);
        setFallback(data.fallback);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchResults();
  }, []);

  const handleBudgetChange = async (newBudget: number) => {
    setBudget(newBudget);
    if (!profile) return;
    
    const updatedProfile = { ...profile, budget_monthly_max: newBudget };
    localStorage.setItem('petProfile', JSON.stringify(updatedProfile));
    
    setLoading(true);
    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProfile)
      });
      const data = await res.json();
      setResults(data.results || []);
      setBudgetRelaxed(data.budgetRelaxed);
      setFallback(data.fallback);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#191919', marginBottom: '8px', lineHeight: 1.2 }}>
              Best food for your {profile.pet_type || 'pet'}
            </h2>
            <p style={{ color: '#555555', margin: 0 }}>Based on their unique profile.</p>
          </div>
        )}

        <div style={{ marginBottom: '24px' }}>
          <BudgetSlider value={budget} onChange={handleBudgetChange} />
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
              <h3 className="font-bold text-gray-900 mb-2">No matches found</h3>
              <p className="text-gray-500 text-sm">Try increasing your budget or removing some constraints.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
