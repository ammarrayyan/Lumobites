'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  product_name?: string;
  brand: string;
  pet_type: string;
  food_type: string;
  health_tags: string[];
  price_monthly_low: number;
  price_monthly_high: number;
  ingredients: string;
  description: string;
  pros?: string;
  cons?: string;
  protein_pct?: number;
  fat_pct?: number;
  fiber_pct?: number;
  image_url: string;
  amazon_link?: string;
  chewy_link?: string;
  petco_link?: string;
  petsmart_link?: string;
  buy_link?: string;
}

export default function ProductDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        // 1. Try sessionStorage first (populated by results page, works on Vercel serverless)
        try {
          const cached = JSON.parse(sessionStorage.getItem('lumobites_products') || '{}');
          if (cached[id]) {
            const p = cached[id];
            setProduct({
              ...p,
              name: p.product_name,
              description: p.pros,
              amazon_link: p.buy_links?.amazon,
              chewy_link: p.buy_links?.chewy,
              petco_link: p.buy_links?.petco,
              petsmart_link: p.buy_links?.petsmart,
            });
            setLoading(false);
            return;
          }
        } catch (_) {}

        // 2. Fallback to API (works for seed products)
        const res = await fetch(`/api/products/${id}`);
        if (res.ok) {
          const data = await res.json();
          setProduct(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFAF7]">
        <div className="w-12 h-12 border-4 border-[#E8DDD4] border-t-[#8B5E3C] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFAF7] p-6">
        <h2 className="text-2xl font-bold mb-4">Product not found</h2>
        <Link href="/" className="text-[#8B5E3C] font-medium hover:underline">← Back to home</Link>
      </div>
    );
  }

  const displayName = product.product_name || product.name;
  const searchTerm = encodeURIComponent((product.brand || '') + ' ' + displayName);
  
  let amazonLink = product.amazon_link || product.buy_link || '#';
  if (amazonLink === '#') amazonLink = `https://www.amazon.com/s?k=${searchTerm}&tag=lumobites-20`;

  let chewyLink = product.chewy_link || product.buy_link || '#';
  if (chewyLink === '#') chewyLink = `https://www.chewy.com/s?query=${searchTerm}`;

  let petcoLink = product.petco_link || product.buy_link || '#';
  if (petcoLink === '#') petcoLink = `https://www.petco.com/shop/SearchDisplay?searchTerm=${searchTerm}`;

  let petsmartLink = product.petsmart_link || product.buy_link || '#';
  if (petsmartLink === '#') petsmartLink = `https://www.petsmart.com/search/?q=${searchTerm}`;
  const tags = Array.isArray(product.health_tags) ? product.health_tags : [];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FDFAF7', paddingBottom: '220px' }}>
      {/* Header */}
      <header style={{ backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 30, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid #E8DDD4' }}>
        <button onClick={() => window.history.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8B5E3C', flexShrink: 0 }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style={{ width: '24px', height: '24px' }}>
            <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
          </svg>
        </button>
        <Link href="/">
          <img src="/Logo.png" alt="Lumo Bites" style={{ height: '70px', width: 'auto', display: 'block', objectFit: 'contain', transform: 'scale(1.4)', margin: '-15px 0', transformOrigin: 'left center' }} />
        </Link>
      </header>

      {/* Hero */}
      <div style={{ backgroundColor: '#FFFFFF', paddingTop: '32px', paddingBottom: '40px', paddingLeft: '24px', paddingRight: '24px', borderBottomLeftRadius: '40px', borderBottomRightRadius: '40px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', marginBottom: '24px' }}>
        <div style={{ width: '192px', height: '192px', margin: '0 auto 32px auto', backgroundColor: '#F5EDE4', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '80px' }}>
          {product.pet_type === 'dog' ? '🐶' : '🐱'}
        </div>
        <h1 style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 800, letterSpacing: '-0.02em', textAlign: 'center', color: '#191919', lineHeight: 1.2, margin: '0 0 8px 0' }}>{displayName}</h1>
        <p style={{ textAlign: 'center', color: '#888', marginBottom: '16px', fontSize: '14px' }}>{product.brand}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px' }}>
          {tags.map(tag => (
            <span key={tag} style={{ backgroundColor: '#F5EDE4', color: '#8B5E3C', fontSize: '12px', fontWeight: 'bold', padding: '4px 12px', borderRadius: '100px', border: '1px solid #E8DDD4' }}>
              {tag.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* Nutrition */}
        {(product.protein_pct || product.fat_pct || product.fiber_pct) && (
          <section style={{ backgroundColor: '#FFFFFF', borderRadius: '24px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontWeight: 800, color: '#191919', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px 0' }}>
              <span>📊</span> Nutrition Breakdown
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', textAlign: 'center' }}>
              <div style={{ backgroundColor: '#F9F9F9', borderRadius: '12px', padding: '12px' }}>
                <span style={{ display: 'block', fontSize: '24px', fontWeight: 'bold', color: '#191919' }}>{product.protein_pct || '—'}%</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#555', textTransform: 'uppercase' }}>Protein</span>
              </div>
              <div style={{ backgroundColor: '#F9F9F9', borderRadius: '12px', padding: '12px' }}>
                <span style={{ display: 'block', fontSize: '24px', fontWeight: 'bold', color: '#191919' }}>{product.fat_pct || '—'}%</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#555', textTransform: 'uppercase' }}>Fat</span>
              </div>
              <div style={{ backgroundColor: '#F9F9F9', borderRadius: '12px', padding: '12px' }}>
                <span style={{ display: 'block', fontSize: '24px', fontWeight: 'bold', color: '#191919' }}>{product.fiber_pct || '—'}%</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#555', textTransform: 'uppercase' }}>Fiber</span>
              </div>
            </div>
          </section>
        )}

        {/* Ingredients */}
        <section style={{ backgroundColor: '#FFFFFF', borderRadius: '24px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <h3 style={{ fontWeight: 800, color: '#191919', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 12px 0' }}>
            <span>🥩</span> Ingredients
          </h3>
          <p style={{ fontSize: '14px', color: '#555', lineHeight: 1.6, margin: 0 }}>{product.ingredients}</p>
        </section>

        {/* Pros / Cons */}
        {(product.pros || product.cons || product.description) && (
          <div style={{ display: 'grid', gap: '16px' }}>
            {(product.pros || product.description) && (
              <section style={{ backgroundColor: '#F5EDE4', borderRadius: '24px', padding: '20px' }}>
                <h3 style={{ fontWeight: 800, color: '#8B5E3C', margin: '0 0 8px 0' }}>✅ Why it's great</h3>
                <p style={{ fontSize: '14px', color: '#5C3D20', margin: 0 }}>{product.pros || product.description}</p>
              </section>
            )}
            {product.cons && (
              <section style={{ backgroundColor: '#FEF2F2', borderRadius: '24px', padding: '20px' }}>
                <h3 style={{ fontWeight: 800, color: '#7F1D1D', margin: '0 0 8px 0' }}>❌ Things to note</h3>
                <p style={{ fontSize: '14px', color: '#991B1B', margin: 0 }}>{product.cons}</p>
              </section>
            )}
          </div>
        )}

        {/* 7-Day Transition Plan */}
        <section style={{ backgroundColor: '#FFFFFF', borderRadius: '24px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <h3 style={{ fontWeight: 800, color: '#191919', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px 0' }}>
            <span>🗓️</span> 7-Day Transition Plan
          </h3>
          <p style={{ fontSize: '12px', color: '#555', marginBottom: '16px' }}>Slowly mix this food with their current diet to prevent an upset stomach.</p>
          {[{ days: '1-2', pct: 25 }, { days: '3-4', pct: 50 }, { days: '5-6', pct: 75 }, { days: '7+', pct: 100 }].map(({ days, pct }) => (
            <div key={days} style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
              <div style={{ width: '48px', height: '48px', backgroundColor: pct === 100 ? '#F5EDE4' : '#F9F9F9', color: pct === 100 ? '#8B5E3C' : '#191919', borderRadius: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold', flexShrink: 0 }}>{days}</div>
              <div style={{ flex: 1, height: '16px', backgroundColor: '#F9F9F9', borderRadius: '50px', overflow: 'hidden', display: 'flex' }}>
                <div style={{ backgroundColor: '#D1D5DB', height: '100%', width: `${100 - pct}%` }}></div>
                <div style={{ backgroundColor: '#8B5E3C', height: '100%', width: `${pct}%` }}></div>
              </div>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: pct === 100 ? '#8B5E3C' : '#191919', flexShrink: 0, width: '56px', textAlign: 'right' }}>{pct}% new</div>
            </div>
          ))}
        </section>
      </div>

      {/* Sticky Buy Footer */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '16px', backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', borderTop: '1px solid #E8DDD4', boxShadow: '0 -10px 40px rgba(0,0,0,0.05)', zIndex: 40 }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ marginBottom: '12px', padding: '0 8px' }}>
            <div style={{ fontWeight: 'bold', color: '#191919' }}>Where to buy</div>
            <div style={{ fontSize: '13px', color: '#888' }}>Est. ${product.price_monthly_low} - ${product.price_monthly_high}/mo</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            <a href={amazonLink} target="_blank" rel="noopener noreferrer" style={{ backgroundColor: '#8B5E3C', color: '#FFFFFF', fontWeight: 'bold', fontSize: '15px', height: '48px', borderRadius: '50px', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>🛒 Amazon</a>
            <a href={chewyLink} target="_blank" rel="noopener noreferrer" style={{ backgroundColor: '#2563EB', color: '#FFFFFF', fontWeight: 'bold', fontSize: '15px', height: '48px', borderRadius: '50px', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>🐾 Chewy</a>
            <a href={petcoLink} target="_blank" rel="noopener noreferrer" style={{ backgroundColor: '#DC2626', color: '#FFFFFF', fontWeight: 'bold', fontSize: '15px', height: '48px', borderRadius: '50px', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>🏪 Petco</a>
            <a href={petsmartLink} target="_blank" rel="noopener noreferrer" style={{ backgroundColor: '#EA580C', color: '#FFFFFF', fontWeight: 'bold', fontSize: '15px', height: '48px', borderRadius: '50px', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>🏬 PetSmart</a>
          </div>
          <a href="https://www.google.com/maps/search/pet+store+near+me" target="_blank" rel="noopener noreferrer" style={{ marginTop: '12px', width: '100%', color: '#8B5E3C', fontWeight: 'bold', fontSize: '15px', height: '48px', borderRadius: '50px', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: '1.5px solid #8B5E3C' }}>📍 Find a store near me</a>
        </div>
      </div>
    </div>
  );
}