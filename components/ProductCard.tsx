'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ScoredProduct } from '@/lib/types';

export default function ProductCard({ product, profile }: { product: ScoredProduct, profile?: any }) {
  const [imgFailed, setImgFailed] = useState(false);

  let whyText = product.why_recommended;
  if (profile) {
    const age = profile.age_years >= 7 ? 'senior' : (profile.age_years < 1 ? (profile.pet_type === 'cat' ? 'kitten' : 'puppy') : 'adult');
    const petNoun = profile.pet_type === 'cat' ? 'cats' : 'dogs';
    const health = profile.health_issues?.length ? profile.health_issues[0].replace(/_/g, ' ') : '';
    
    // Determine the product's actual food type to avoid labeling a wet treat as "dry food"
    const actualText = (product.product_name + ' ' + (product.pros || '') + ' ' + (product.cons || '')).toLowerCase();
    let foodTypeStr = 'food';
    if (actualText.includes('treat') || actualText.includes('snack') || actualText.includes('chew') || actualText.includes('lickable')) foodTypeStr = 'treats';
    else if (actualText.includes('canned') || actualText.includes('wet') || actualText.includes('stew') || actualText.includes('pâté') || actualText.includes('pate') || actualText.includes('broth') || actualText.includes('pouch') || actualText.includes('gravy')) foodTypeStr = 'wet food';
    else if (actualText.includes('kibble') || actualText.includes('dry')) foodTypeStr = 'dry food';

    // Generate a more specific benefit statement
    const benefit = product.pros?.split('.')[0] || (product.protein_pct > 30 ? 'High protein formula' : 'Balanced nutrition');
    
    whyText = `${product.product_name} — ${benefit.toLowerCase()}, ideal for ${age} ${petNoun}${health ? ' with ' + health : ''}`;
  }

  // Determine badge color
  let badgeColor = '#9CA3AF'; // gray
  if (product.match_pct >= 90) badgeColor = '#10B981'; // green
  else if (product.match_pct >= 70) badgeColor = '#F59E0B'; // yellow
  const [showBuyModal, setShowBuyModal] = useState(false);

  // Compute buy links
  const displayName = product.product_name || product.brand;
  const petFoodLabel = product.pet_type === 'dog' ? 'dog food' : product.pet_type === 'cat' ? 'cat food' : 'pet food';
  const searchTerm = encodeURIComponent(`${product.brand || ''} ${displayName} ${petFoodLabel}`.trim());
  const chewySearchTerm = encodeURIComponent(`${product.brand || ''} ${displayName}`.trim());

  let amazonLink = (product.buy_links?.amazon && product.buy_links.amazon !== '#') ? product.buy_links.amazon : '#';
  if (amazonLink === '#') amazonLink = `https://www.amazon.com/s?k=${searchTerm}&tag=lumobites-20`;
  else if (!amazonLink.includes('tag=')) {
    amazonLink = amazonLink.includes('?') ? `${amazonLink}&tag=lumobites-20` : `${amazonLink}?tag=lumobites-20`;
  }

  const chewyLink = `https://www.chewy.com/s?query=${chewySearchTerm}`;

  return (
    <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', overflow: 'hidden', border: '1px solid #E8DDD4' }}>
      {product.match_pct >= 90 && (
        <div style={{ position: 'absolute', top: 0, right: 0, backgroundColor: '#F59E0B', color: '#FFFFFF', fontSize: 'var(--text-small)', fontWeight: 'bold', padding: '4px 12px', borderBottomLeftRadius: '8px', zIndex: 10 }}>
          Top Match
        </div>
      )}
      
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
        <div style={{ width: '80px', height: '80px', backgroundColor: '#F5ECD7', borderRadius: '12px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', position: 'relative', overflow: 'hidden' }}>
           {(imgFailed || !product.image_url || product.image_url.includes('placeholder.svg')) ? (
             <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#8B5E3C', zIndex: 1 }}>
               {product.brand ? product.brand.charAt(0).toUpperCase() : (product.pet_type === 'cat' ? 'C' : 'D')}
             </span>
           ) : (
             <img 
               src={product.image_url} 
               alt={product.product_name} 
               style={{ width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: 'multiply', opacity: 0.8, position: 'relative', zIndex: 2 }} 
               onError={() => setImgFailed(true)}
             />
           )}
        </div>
        
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 'var(--text-small)', fontWeight: 600, color: '#8B5E3C', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '4px', margin: 0 }}>{product.brand}</p>
          <h3 style={{ fontWeight: 800, letterSpacing: '-0.02em', fontSize: '18px', color: '#191919', lineHeight: 1.2, marginBottom: '8px', marginTop: '4px' }}>{product.product_name}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: badgeColor, color: '#FFFFFF', fontSize: 'var(--text-small)', fontWeight: 'bold', padding: '4px 10px', borderRadius: '100px' }}>
              {product.match_pct}% Match
            </span>
          </div>
        </div>
      </div>
      
      <div style={{ marginBottom: '16px' }}>
         <div style={{ backgroundColor: '#FEF3C7', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
             <p style={{ fontSize: 'var(--text-desc)', color: '#78350F', fontWeight: 500, margin: 0, lineHeight: 1.4 }}>✨ {whyText}</p>
             {product.budget_relaxed && (
               <p style={{ fontSize: 'var(--text-small)', color: '#92400E', fontWeight: 700, margin: '6px 0 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                 <span style={{ fontSize: 'var(--text-desc)' }}>💰</span> Slightly above your budget
               </p>
             )}
         </div>
        
        <div style={{ fontSize: 'var(--text-desc)', color: '#555555' }}>
          <p style={{ margin: '0 0 4px 0' }}><span style={{ fontWeight: 600, color: '#191919' }}>Key Ingredients:</span> <span>{product.ingredients.split(',').slice(0,3).join(', ')}</span></p>
          <p style={{ margin: 0 }}><span style={{ fontWeight: 600, color: '#191919' }}>Est. Cost:</span> ${product.price_monthly_low} - ${product.price_monthly_high} / mo</p>
          <p style={{ margin: '4px 0 0 0', fontSize: 'var(--text-small-caption)', color: '#999999' }}>Prices are estimates — check retailer for current price</p>
        </div>
      </div>
      
      <div style={{ marginTop: 'auto', paddingTop: '16px', display: 'flex', gap: '12px' }}>
        <Link 
          href={`/product/${product.id}`}
          style={{ flex: 1, backgroundColor: '#FFFFFF', color: '#8B5E3C', border: '1px solid #E8DDD4', fontWeight: 'bold', padding: '10px 16px', borderRadius: '50px', textAlign: 'center', textDecoration: 'none', display: 'inline-block', fontSize: 'var(--text-btn)' }}
        >
          Details
        </Link>
        <button 
          onClick={() => setShowBuyModal(true)}
          style={{ flex: 1, backgroundColor: '#8B5E3C', color: '#FFFFFF', border: '1px solid #8B5E3C', fontWeight: 'bold', padding: '10px 16px', borderRadius: '50px', textAlign: 'center', cursor: 'pointer', outline: 'none', fontSize: 'var(--text-btn)' }}
        >
          Buy Now
        </button>
      </div>

      {/* Buy Now Retailers Choice Modal Popup */}
      {showBuyModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(25,25,25,0.4)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '24px', width: '100%', maxWidth: '360px', padding: '24px', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.15)', border: '1px solid #E8DDD4', textAlign: 'left' }}>
            <button 
              onClick={() => setShowBuyModal(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#999999', padding: '4px', fontWeight: 'bold' }}
            >
              ✕
            </button>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#191919', marginBottom: '2px', paddingRight: '24px', margin: 0 }}>Where to buy</h3>
            <p style={{ fontSize: 'var(--text-small)', color: '#888888', marginBottom: '20px', marginTop: '2px', margin: 0 }}>{product.brand} - {product.product_name}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <a href={amazonLink} target="_blank" rel="noopener noreferrer" style={{ backgroundColor: '#8B5E3C', color: '#FFFFFF', fontWeight: 'bold', fontSize: 'var(--text-btn)', height: '44px', borderRadius: '50px', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>🛒 Amazon</a>
              <a href={chewyLink} target="_blank" rel="noopener noreferrer" style={{ backgroundColor: '#2563EB', color: '#FFFFFF', fontWeight: 'bold', fontSize: 'var(--text-btn)', height: '44px', borderRadius: '50px', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>🐾 Chewy</a>
              <a href="https://www.google.com/maps/search/pet+food+store+near+me" target="_blank" rel="noopener noreferrer" style={{ backgroundColor: '#FFFFFF', color: '#8B5E3C', fontWeight: 'bold', fontSize: 'var(--text-btn)', height: '44px', borderRadius: '50px', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: '1.5px solid #8B5E3C' }}>📍 Find a store near me</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
