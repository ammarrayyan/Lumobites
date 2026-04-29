'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Product } from '@/lib/types';
import Link from 'next/link';

export default function ProductDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
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
        <Link href="/results" className="text-[#8B5E3C] font-medium hover:underline">← Back to results</Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FDFAF7', paddingBottom: '220px' }}>
      {/* Header Navigation */}
      <header style={{ backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 30, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid #E8DDD4' }}>
        <button onClick={() => window.history.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8B5E3C', flexShrink: 0 }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style={{ width: '24px', height: '24px' }}>
            <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
          </svg>
        </button>
        <Link href="/" style={{ display: 'flex', alignItems: 'center' }}>
          <img 
            src="/logo.png" 
            alt="Lumo Bites" 
            style={{ height: '70px', width: 'auto', display: 'block', objectFit: 'contain', transform: 'scale(1.4)', margin: '-15px 0', transformOrigin: 'left center' }}
          />
        </Link>
      </header>

      {/* Hero Image Area */}
      <div style={{ backgroundColor: '#FFFFFF', paddingTop: '32px', paddingBottom: '40px', paddingLeft: '24px', paddingRight: '24px', borderBottomLeftRadius: '40px', borderBottomRightRadius: '40px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', marginBottom: '24px', position: 'relative' }}>
        <div style={{ width: '192px', height: '192px', margin: '0 auto 32px auto', backgroundColor: '#F5EDE4', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', position: 'relative', overflow: 'hidden' }}>
          <span style={{ position: 'absolute', fontSize: '64px', opacity: 0.5 }}>🐾</span>
          <img 
            src={product.image_url} 
            alt={product.product_name} 
            style={{ width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: 'multiply', opacity: 0.8, position: 'relative', zIndex: 2 }} 
            onError={(e) => e.currentTarget.style.display = 'none'}
          />
        </div>
        
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, letterSpacing: '-0.02em', textAlign: 'center', color: '#191919', lineHeight: 1.2, margin: '0 0 16px 0' }}>{product.product_name}</h1>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
           {product.health_tags.map(tag => (
             <span key={tag} style={{ backgroundColor: '#F5EDE4', color: '#8B5E3C', fontSize: '12px', fontWeight: 'bold', padding: '4px 12px', borderRadius: '100px', border: '1px solid #E8DDD4' }}>
               {tag.replace('_', ' ')}
             </span>
           ))}
        </div>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Nutrition Info */}
        <section style={{ backgroundColor: '#FFFFFF', borderRadius: '24px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <h3 style={{ fontWeight: 800, letterSpacing: '-0.02em', color: '#191919', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px 0' }}>
            <span style={{ fontSize: '20px' }}>📊</span> Nutrition Breakdown
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', textAlign: 'center' }}>
            <div style={{ backgroundColor: '#F9F9F9', borderRadius: '12px', padding: '12px' }}>
              <span style={{ display: 'block', fontSize: '24px', fontWeight: 'bold', color: '#191919', marginBottom: '4px' }}>{product.protein_pct}%</span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#555555', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Protein</span>
            </div>
            <div style={{ backgroundColor: '#F9F9F9', borderRadius: '12px', padding: '12px' }}>
              <span style={{ display: 'block', fontSize: '24px', fontWeight: 'bold', color: '#191919', marginBottom: '4px' }}>{product.fat_pct}%</span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#555555', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fat</span>
            </div>
            <div style={{ backgroundColor: '#F9F9F9', borderRadius: '12px', padding: '12px' }}>
              <span style={{ display: 'block', fontSize: '24px', fontWeight: 'bold', color: '#191919', marginBottom: '4px' }}>{product.fiber_pct}%</span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#555555', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fiber</span>
            </div>
          </div>
        </section>

        {/* Ingredients */}
        <section style={{ backgroundColor: '#FFFFFF', borderRadius: '24px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <h3 style={{ fontWeight: 800, letterSpacing: '-0.02em', color: '#191919', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 12px 0' }}>
            <span style={{ fontSize: '20px' }}>🥩</span> Ingredients
          </h3>
          <p style={{ fontSize: '14px', color: '#555555', lineHeight: 1.6, margin: 0 }}>{product.ingredients}</p>
        </section>

        {/* Pros / Cons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
          <section style={{ backgroundColor: '#F5EDE4', borderRadius: '24px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontWeight: 800, letterSpacing: '-0.02em', color: '#8B5E3C', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 8px 0' }}>
              ✅ Why it's great
            </h3>
            <p style={{ fontSize: '14px', color: '#5C3D20', margin: 0 }}>{product.pros}</p>
          </section>
          
          <section style={{ backgroundColor: '#FEF2F2', borderRadius: '24px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontWeight: 800, letterSpacing: '-0.02em', color: '#7F1D1D', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 8px 0' }}>
              ❌ Things to note
            </h3>
            <p style={{ fontSize: '14px', color: '#991B1B', margin: 0 }}>{product.cons}</p>
          </section>
        </div>

        {/* Transition Plan */}
        <section style={{ backgroundColor: '#FFFFFF', borderRadius: '24px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <h3 style={{ fontWeight: 800, letterSpacing: '-0.02em', color: '#191919', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px 0' }}>
            <span style={{ fontSize: '20px' }}>🗓️</span> 7-Day Transition Plan
          </h3>
          <p style={{ fontSize: '12px', color: '#555555', marginBottom: '16px' }}>Slowly mix this food with their current diet to prevent an upset stomach.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
               <div style={{ width: '48px', height: '48px', backgroundColor: '#F9F9F9', borderRadius: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold', flexShrink: 0 }}>1-2</div>
               <div style={{ flex: 1, height: '16px', backgroundColor: '#F9F9F9', borderRadius: '50px', overflow: 'hidden', display: 'flex' }}>
                 <div style={{ backgroundColor: '#D1D5DB', height: '100%', width: '75%' }}></div>
                 <div style={{ backgroundColor: '#8B5E3C', height: '100%', width: '25%' }}></div>
               </div>
               <div style={{ fontSize: '12px', fontWeight: 600, flexShrink: 0, width: '48px', textAlign: 'right' }}>25% new</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
               <div style={{ width: '48px', height: '48px', backgroundColor: '#F9F9F9', borderRadius: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold', flexShrink: 0 }}>3-4</div>
               <div style={{ flex: 1, height: '16px', backgroundColor: '#F9F9F9', borderRadius: '50px', overflow: 'hidden', display: 'flex' }}>
                 <div style={{ backgroundColor: '#D1D5DB', height: '100%', width: '50%' }}></div>
                 <div style={{ backgroundColor: '#8B5E3C', height: '100%', width: '50%' }}></div>
               </div>
               <div style={{ fontSize: '12px', fontWeight: 600, flexShrink: 0, width: '48px', textAlign: 'right' }}>50% new</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
               <div style={{ width: '48px', height: '48px', backgroundColor: '#F9F9F9', borderRadius: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold', flexShrink: 0 }}>5-6</div>
               <div style={{ flex: 1, height: '16px', backgroundColor: '#F9F9F9', borderRadius: '50px', overflow: 'hidden', display: 'flex' }}>
                 <div style={{ backgroundColor: '#D1D5DB', height: '100%', width: '25%' }}></div>
                 <div style={{ backgroundColor: '#8B5E3C', height: '100%', width: '75%' }}></div>
               </div>
               <div style={{ fontSize: '12px', fontWeight: 600, flexShrink: 0, width: '48px', textAlign: 'right' }}>75% new</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
               <div style={{ width: '48px', height: '48px', backgroundColor: '#F5EDE4', color: '#8B5E3C', borderRadius: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold', flexShrink: 0 }}>7+</div>
               <div style={{ flex: 1, height: '16px', backgroundColor: '#F9F9F9', borderRadius: '50px', overflow: 'hidden' }}>
                 <div style={{ backgroundColor: '#8B5E3C', height: '100%', width: '100%' }}></div>
               </div>
               <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#8B5E3C', flexShrink: 0, width: '48px', textAlign: 'right' }}>100%</div>
            </div>
          </div>
        </section>

        {/* Where to buy sticky footer */}
        <div id="buy" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '16px', backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', borderTop: '1px solid #E8DDD4', boxShadow: '0 -10px 40px rgba(0,0,0,0.05)', zIndex: 40 }}>
           <div style={{ maxWidth: '600px', margin: '0 auto' }}>
             <div style={{ marginBottom: '12px', padding: '0 8px' }}>
               <div style={{ fontWeight: 'bold', color: '#191919', marginBottom: '2px' }}>Where to buy</div>
               <div style={{ fontSize: '13px', color: '#888888' }}>Est. ${product.price_monthly_low}/mo</div>
             </div>
             
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
               <a href={product.buy_links.amazon || '#'} target="_blank" rel="noopener noreferrer" style={{ backgroundColor: '#8B5E3C', color: '#FFFFFF', fontWeight: 'bold', fontSize: '15px', height: '48px', padding: '0 20px', borderRadius: '50px', textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxSizing: 'border-box' }}>
                  🛒 Amazon
               </a>
               <a href={product.buy_links.chewy || '#'} target="_blank" rel="noopener noreferrer" style={{ backgroundColor: '#2563EB', color: '#FFFFFF', fontWeight: 'bold', fontSize: '15px', height: '48px', padding: '0 20px', borderRadius: '50px', textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxSizing: 'border-box' }}>
                  🐾 Chewy
               </a>
               <a href={product.buy_links.petco || '#'} target="_blank" rel="noopener noreferrer" style={{ backgroundColor: '#DC2626', color: '#FFFFFF', fontWeight: 'bold', fontSize: '15px', height: '48px', padding: '0 20px', borderRadius: '50px', textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxSizing: 'border-box' }}>
                  🏪 Petco
               </a>
               <a href={product.buy_links.petsmart || '#'} target="_blank" rel="noopener noreferrer" style={{ backgroundColor: '#EA580C', color: '#FFFFFF', fontWeight: 'bold', fontSize: '15px', height: '48px', padding: '0 20px', borderRadius: '50px', textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxSizing: 'border-box' }}>
                  🏬 PetSmart
               </a>
             </div>
             
             <a href="https://www.google.com/maps/search/pet+store+near+me" target="_blank" rel="noopener noreferrer" style={{ marginTop: '12px', width: '100%', backgroundColor: 'transparent', color: '#8B5E3C', fontWeight: 'bold', fontSize: '15px', height: '48px', padding: '0 20px', borderRadius: '50px', textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: '1.5px solid #8B5E3C', boxSizing: 'border-box' }}>
                📍 Find a store near me
             </a>
           </div>
        </div>
        
      </div>
    </div>
  );
}
