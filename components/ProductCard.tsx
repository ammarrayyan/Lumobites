import Link from 'next/link';
import { ScoredProduct } from '@/lib/types';

export default function ProductCard({ product, profile }: { product: ScoredProduct, profile?: any }) {
  let whyText = product.why_recommended;
  if (profile) {
    const agePrefix = profile.age_years >= 7 ? 'senior ' : (profile.age_years < 1 ? (profile.pet_type === 'cat' ? 'kittens ' : 'puppies ') : '');
    const healthStr = profile.health_issues?.length ? ` with ${profile.health_issues.join(' and ').replace(/_/g, ' ')}` : '';
    const budgetStr = profile.budget_monthly_max ? ` under $${profile.budget_monthly_max}/mo` : '';
    const petNoun = agePrefix.includes('kittens') || agePrefix.includes('puppies') ? '' : `${profile.pet_type}s`;
    whyText = `Perfect for ${agePrefix}${petNoun}${healthStr}${budgetStr}`;
  }
  return (
    <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', overflow: 'hidden', border: '1px solid #E8DDD4' }}>
      {product.match_pct >= 90 && (
        <div style={{ position: 'absolute', top: 0, right: 0, backgroundColor: '#F59E0B', color: '#FFFFFF', fontSize: '12px', fontWeight: 'bold', padding: '4px 12px', borderBottomLeftRadius: '8px', zIndex: 10 }}>
          Top Match
        </div>
      )}
      
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
        <div style={{ width: '80px', height: '80px', backgroundColor: '#F5ECD7', borderRadius: '12px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', position: 'relative', overflow: 'hidden' }}>
           <span style={{ position: 'absolute', fontSize: '36px', opacity: 1 }}>{product.pet_type === 'cat' ? '🐱' : '🐶'}</span>
           <img 
             src={product.image_url} 
             alt={product.product_name} 
             style={{ width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: 'multiply', opacity: 0.8, position: 'relative', zIndex: 2 }} 
             onError={(e) => e.currentTarget.style.display = 'none'}
           />
        </div>
        
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '12px', fontWeight: 600, color: '#8B5E3C', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '4px', margin: 0 }}>{product.brand}</p>
          <h3 style={{ fontWeight: 800, letterSpacing: '-0.02em', fontSize: '18px', color: '#191919', lineHeight: 1.2, marginBottom: '8px', marginTop: '4px' }}>{product.product_name}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5EDE4', color: '#8B5E3C', fontSize: '12px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '100px' }}>
              {product.match_pct}% Match
            </span>
          </div>
        </div>
      </div>
      
      <div style={{ marginBottom: '16px' }}>
         <div style={{ backgroundColor: '#FEF3C7', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
             <p style={{ fontSize: '14px', color: '#78350F', fontWeight: 500, margin: 0, lineHeight: 1.4 }}>✨ {whyText}</p>
         </div>
        
        <div style={{ fontSize: '14px', color: '#555555' }}>
          <p style={{ margin: '0 0 4px 0' }}><span style={{ fontWeight: 600, color: '#191919' }}>Key Ingredients:</span> <span>{product.ingredients.split(',').slice(0,3).join(', ')}</span></p>
          <p style={{ margin: 0 }}><span style={{ fontWeight: 600, color: '#191919' }}>Est. Cost:</span> ${product.price_monthly_low} - ${product.price_monthly_high} / mo</p>
        </div>
      </div>
      
      <div style={{ marginTop: 'auto', paddingTop: '16px', display: 'flex', gap: '12px' }}>
        <Link 
          href={`/product/${product.id}`}
          style={{ flex: 1, backgroundColor: '#FFFFFF', color: '#8B5E3C', border: '1px solid #E8DDD4', fontWeight: 'bold', padding: '10px 16px', borderRadius: '50px', textAlign: 'center', textDecoration: 'none', display: 'inline-block' }}
        >
          Details
        </Link>
        <Link 
          href={`/product/${product.id}#buy`}
          style={{ flex: 1, backgroundColor: '#8B5E3C', color: '#FFFFFF', border: '1px solid #8B5E3C', fontWeight: 'bold', padding: '10px 16px', borderRadius: '50px', textAlign: 'center', textDecoration: 'none', display: 'inline-block' }}
        >
          Buy Now
        </Link>
      </div>
    </div>
  );
}
