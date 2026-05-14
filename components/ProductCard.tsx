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
  return (
    <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', overflow: 'hidden', border: '1px solid #E8DDD4' }}>
      {product.match_pct >= 90 && (
        <div style={{ position: 'absolute', top: 0, right: 0, backgroundColor: '#F59E0B', color: '#FFFFFF', fontSize: '12px', fontWeight: 'bold', padding: '4px 12px', borderBottomLeftRadius: '8px', zIndex: 10 }}>
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
          <p style={{ fontSize: '12px', fontWeight: 600, color: '#8B5E3C', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '4px', margin: 0 }}>{product.brand}</p>
          <h3 style={{ fontWeight: 800, letterSpacing: '-0.02em', fontSize: '18px', color: '#191919', lineHeight: 1.2, marginBottom: '8px', marginTop: '4px' }}>{product.product_name}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: badgeColor, color: '#FFFFFF', fontSize: '12px', fontWeight: 'bold', padding: '4px 10px', borderRadius: '100px' }}>
              {product.match_pct}% Match
            </span>
          </div>
        </div>
      </div>
      
      <div style={{ marginBottom: '16px' }}>
         <div style={{ backgroundColor: '#FEF3C7', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
             <p style={{ fontSize: '14px', color: '#78350F', fontWeight: 500, margin: 0, lineHeight: 1.4 }}>✨ {whyText}</p>
             {product.budget_relaxed && (
               <p style={{ fontSize: '12px', color: '#92400E', fontWeight: 700, margin: '6px 0 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                 <span style={{ fontSize: '14px' }}>💰</span> Slightly above your budget
               </p>
             )}
         </div>
        
        <div style={{ fontSize: '14px', color: '#555555' }}>
          <p style={{ margin: '0 0 4px 0' }}><span style={{ fontWeight: 600, color: '#191919' }}>Key Ingredients:</span> <span>{product.ingredients.split(',').slice(0,3).join(', ')}</span></p>
          <p style={{ margin: 0 }}><span style={{ fontWeight: 600, color: '#191919' }}>Est. Cost:</span> ${product.price_monthly_low} - ${product.price_monthly_high} / mo</p>
          <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#999999' }}>Prices are estimates — check retailer for current price</p>
        </div>
      </div>
      
      <div style={{ marginTop: 'auto', paddingTop: '16px', display: 'flex', gap: '12px' }}>
        <Link 
          href={`/product/${product.id}`}
          style={{ flex: 1, backgroundColor: '#FFFFFF', color: '#8B5E3C', border: '1px solid #E8DDD4', fontWeight: 'bold', padding: '10px 16px', borderRadius: '50px', textAlign: 'center', textDecoration: 'none', display: 'inline-block' }}
        >
          Details
        </Link>
        <a 
          href={(product.buy_links?.amazon && product.buy_links.amazon !== '#') ? product.buy_links.amazon : `https://www.amazon.com/s?k=${encodeURIComponent(`${product.brand} ${product.product_name} ${product.pet_type} food`)}&tag=lumobites-20`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ flex: 1, backgroundColor: '#8B5E3C', color: '#FFFFFF', border: '1px solid #8B5E3C', fontWeight: 'bold', padding: '10px 16px', borderRadius: '50px', textAlign: 'center', textDecoration: 'none', display: 'inline-block' }}
        >
          Buy Now
        </a>
      </div>
    </div>
  );
}
