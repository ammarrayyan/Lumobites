'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import AmazonProductCard, { AmazonProductCardSkeleton, AmazonProduct } from '@/components/AmazonProductCard';

// ── helpers ───────────────────────────────────────────────────────────────────
async function fetchAmazon(q: string, limit = 4): Promise<AmazonProduct[]> {
  try {
    const res = await fetch(`/api/amazon/search?q=${encodeURIComponent(q)}&limit=${limit}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.products ?? [];
  } catch {
    return [];
  }
}

function useAmazonProducts(query: string, limit = 4) {
  const [products, setProducts] = useState<AmazonProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query) return;
    let cancelled = false;
    setLoading(true);
    fetchAmazon(query, limit).then(p => {
      if (!cancelled) { setProducts(p); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [query, limit]);

  return { products, loading };
}

// ── Product Grid section ──────────────────────────────────────────────────────
function AmazonSection({
  title,
  query,
  emoji,
  limit = 4,
}: {
  title: string;
  query: string;
  emoji: string;
  limit?: number;
}) {
  const { products, loading } = useAmazonProducts(query, limit);

  return (
    <div className="mb-4">
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: limit }).map((_, i) => <AmazonProductCardSkeleton key={i} />)}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {products.map(p => <AmazonProductCard key={p.asin} product={p} />)}
        </div>
      ) : (
        /* Fallback: Amazon search link if API returns empty */
        <div className="bg-[#FDFAF7] border border-[#E8DDD4] rounded-2xl p-6 text-center">
          <p className="text-sm text-gray-500 mb-3">Live product data unavailable right now.</p>
          <a
            href={`https://www.amazon.com/s?k=${encodeURIComponent(query)}&tag=lumobites-20`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#FFD814] border border-[#FCD200] text-[#0F1111] font-bold text-sm px-5 py-2.5 rounded-lg hover:bg-[#F7CA00] transition-colors"
          >
            Search Amazon for {title} →
          </a>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SuppliesPage() {
  // Toys
  const [toyPetType, setToyPetType] = useState<'cat' | 'dog'>('dog');
  const [toySize, setToySize] = useState<'small' | 'medium' | 'large'>('medium');

  // Litter
  const [litterType, setLitterType] = useState<'clumping' | 'non-clumping' | 'crystal' | 'natural'>('clumping');
  const [litterScent, setLitterScent] = useState<'scented' | 'unscented'>('unscented');

  // Supplements
  const [suppPetType, setSuppPetType] = useState<'cat' | 'dog'>('dog');
  const [suppConcern, setSuppConcern] = useState<'joint' | 'skin' | 'digestive' | 'immune' | 'weight'>('joint');

  // Beds & Carriers
  const [bedPetType, setBedPetType] = useState<'cat' | 'dog'>('dog');

  // Derived Amazon queries
  const toyQuery = toyPetType === 'cat'
    ? 'best interactive cat toys'
    : `best dog toys for ${toySize} dogs`;

  const litterQuery = `${litterScent} ${litterType} cat litter best`;

  const suppQuery = `best ${suppPetType} ${suppConcern} health supplement`;

  const bedQuery = `best ${bedPetType} bed`;

  return (
    <div className="min-h-screen bg-[#FDFAF7] text-[#191919] font-sans">
      <Navbar />

      <main className="max-w-[900px] mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-[800] text-[#191919] mb-4">🐾 Pet Supplies</h1>
          <p className="text-lg text-[#666666]">Real products, real prices — sourced live from Amazon</p>
        </div>

        {/* ── SECTION 1: TOYS ─────────────────────────────────────────────── */}
        <section className="bg-white border border-[#E8DDD4] rounded-3xl p-6 md:p-10 mb-10 shadow-sm">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">🎾 Toys</h2>

          <div className="flex flex-col md:flex-row gap-6 mb-8">
            <div className="flex-1">
              <label className="block text-sm font-bold text-gray-700 mb-2">Pet Type</label>
              <div className="flex bg-[#F5EDE4] p-1 rounded-xl">
                <button onClick={() => setToyPetType('dog')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${toyPetType === 'dog' ? 'bg-white text-[#8B5E3C] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Dog</button>
                <button onClick={() => setToyPetType('cat')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${toyPetType === 'cat' ? 'bg-white text-[#8B5E3C] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Cat</button>
              </div>
            </div>
            {toyPetType === 'dog' && (
              <div className="flex-1">
                <label className="block text-sm font-bold text-gray-700 mb-2">Dog Size</label>
                <div className="flex bg-[#F5EDE4] p-1 rounded-xl">
                  <button onClick={() => setToySize('small')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${toySize === 'small' ? 'bg-white text-[#8B5E3C] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Small</button>
                  <button onClick={() => setToySize('medium')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${toySize === 'medium' ? 'bg-white text-[#8B5E3C] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Medium</button>
                  <button onClick={() => setToySize('large')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${toySize === 'large' ? 'bg-white text-[#8B5E3C] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Large</button>
                </div>
              </div>
            )}
          </div>

          <AmazonSection title="Toys" query={toyQuery} emoji="🎾" />
        </section>

        {/* ── SECTION 2: CAT LITTER ───────────────────────────────────────── */}
        <section className="bg-white border border-[#E8DDD4] rounded-3xl p-6 md:p-10 mb-10 shadow-sm">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">🪣 Cat Litter</h2>

          <div className="flex flex-col md:flex-row gap-6 mb-8">
            <div className="flex-[2]">
              <label className="block text-sm font-bold text-gray-700 mb-2">Litter Type</label>
              <div className="flex flex-wrap bg-[#F5EDE4] p-1 rounded-xl gap-1">
                {(['clumping', 'non-clumping', 'crystal', 'natural'] as const).map(type => (
                  <button key={type} onClick={() => setLitterType(type)} className={`flex-1 min-w-[100px] py-2 rounded-lg text-sm font-bold transition-colors ${litterType === type ? 'bg-white text-[#8B5E3C] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    {type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-bold text-gray-700 mb-2">Scent</label>
              <div className="flex bg-[#F5EDE4] p-1 rounded-xl">
                <button onClick={() => setLitterScent('unscented')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${litterScent === 'unscented' ? 'bg-white text-[#8B5E3C] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Unscented</button>
                <button onClick={() => setLitterScent('scented')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${litterScent === 'scented' ? 'bg-white text-[#8B5E3C] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Scented</button>
              </div>
            </div>
          </div>

          <AmazonSection title="Cat Litter" query={litterQuery} emoji="🪣" />
        </section>

        {/* ── SECTION 3: SUPPLEMENTS ─────────────────────────────────────── */}
        <section className="bg-white border border-[#E8DDD4] rounded-3xl p-6 md:p-10 mb-10 shadow-sm">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">💊 Supplements</h2>

          <div className="flex flex-col gap-6 mb-8">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Pet Type</label>
              <div className="flex bg-[#F5EDE4] p-1 rounded-xl max-w-[300px]">
                <button onClick={() => setSuppPetType('dog')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${suppPetType === 'dog' ? 'bg-white text-[#8B5E3C] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Dog</button>
                <button onClick={() => setSuppPetType('cat')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${suppPetType === 'cat' ? 'bg-white text-[#8B5E3C] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Cat</button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Health Concern</label>
              <div className="flex flex-wrap bg-[#F5EDE4] p-1 rounded-xl gap-1">
                {(['joint', 'skin', 'digestive', 'immune', 'weight'] as const).map(concern => (
                  <button key={concern} onClick={() => setSuppConcern(concern)} className={`flex-1 min-w-[100px] py-2 rounded-lg text-sm font-bold transition-colors ${suppConcern === concern ? 'bg-white text-[#8B5E3C] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    {concern.charAt(0).toUpperCase() + concern.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <AmazonSection title="Supplements" query={suppQuery} emoji="💊" />
        </section>

        {/* ── SECTION 4: BEDS & CARRIERS ─────────────────────────────────── */}
        <section className="bg-white border border-[#E8DDD4] rounded-3xl p-6 md:p-10 mb-10 shadow-sm">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">🛏️ Beds &amp; Carriers</h2>

          <div className="mb-8">
            <label className="block text-sm font-bold text-gray-700 mb-2">Pet Type</label>
            <div className="flex bg-[#F5EDE4] p-1 rounded-xl max-w-[300px]">
              <button onClick={() => setBedPetType('dog')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${bedPetType === 'dog' ? 'bg-white text-[#8B5E3C] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Dog</button>
              <button onClick={() => setBedPetType('cat')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${bedPetType === 'cat' ? 'bg-white text-[#8B5E3C] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Cat</button>
            </div>
          </div>

          <AmazonSection title="Beds & Carriers" query={bedQuery} emoji="🛏️" />
        </section>

        {/* ── SECTION 5: PET FOOD ────────────────────────────────────────── */}
        <section className="bg-white border border-[#E8DDD4] rounded-3xl p-6 md:p-10 mb-10 shadow-sm">
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">🐾 Top-Rated Pet Food</h2>
          <p className="text-sm text-gray-500 mb-8">
            Or try our{' '}
            <a href="/chat" className="text-[#8B5E3C] font-semibold underline">AI Food Advisor</a>
            {' '}for personalized picks matched to your pet.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-bold text-[#8B5E3C] uppercase tracking-wider mb-3">🐕 Top Dog Food</p>
              <AmazonSection title="Dog Food" query="best rated premium dry dog food" emoji="🐕" limit={2} />
            </div>
            <div>
              <p className="text-xs font-bold text-[#8B5E3C] uppercase tracking-wider mb-3">🐈 Top Cat Food</p>
              <AmazonSection title="Cat Food" query="best rated premium wet cat food" emoji="🐈" limit={2} />
            </div>
          </div>
        </section>

        {/* Attribution footer */}
        <p className="text-center text-[11px] text-gray-400 mt-4">
          Products sourced from Amazon via the Amazon Associates Program. Lumo Bites is a participant in the Amazon Services LLC Associates Program, an affiliate advertising program designed to provide a means for sites to earn advertising fees by advertising and linking to Amazon.com.
        </p>
      </main>
    </div>
  );
}
