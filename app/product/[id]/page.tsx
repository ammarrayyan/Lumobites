'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Dog, 
  Cat, 
  AlertTriangle, 
  CheckCircle, 
  BarChart3, 
  Beef, 
  Check, 
  X, 
  Calendar, 
  ShoppingCart, 
  Footprints, 
  MapPin 
} from 'lucide-react';
import { useSwipeBack } from '@/lib/useSwipeBack';

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

  // Edge-swipe-right-to-go-back gesture
  useSwipeBack({ fallbackUrl: '/chat' });

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [recallData, setRecallData] = useState<{ active: boolean; reason?: string } | null>(null);
  const [checkingRecall, setCheckingRecall] = useState(false);
  const [userHealthIssues, setUserHealthIssues] = useState<string[]>([]);

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
            // Load user's selected health issues so we only show relevant tags
            try {
              const prof = JSON.parse(sessionStorage.getItem('lumobites_profile') || 'null');
              setUserHealthIssues(prof?.health_issues || []);
            } catch (_) {}
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

  useEffect(() => {
    if (!product?.brand) return;

    const checkRecall = async () => {
      setCheckingRecall(true);
      try {
        const res = await fetch(`https://api.fda.gov/food/enforcement.json?search=product_description:"${encodeURIComponent(product.brand)}"&limit=10`);
        if (res.ok) {
          const data = await res.json();
          const match = data.results?.find((r: any) => {
            const desc = (r.product_description || '').toLowerCase();
            const reason = (r.reason_for_recall || '').toLowerCase();
            const brandMatch = desc.includes(product.brand.toLowerCase());
            const isPetRelated = desc.includes('pet food') || desc.includes('dog food') || desc.includes('cat food') || desc.includes('animal feed') ||
                               reason.includes('pet food') || reason.includes('dog food') || reason.includes('cat food') || reason.includes('animal feed');
            return brandMatch && isPetRelated;
          });
          
          if (match) {
            setRecallData({ active: true, reason: match.reason_for_recall });
          } else {
            setRecallData({ active: false });
          }
        } else {
          setRecallData({ active: false });
        }
      } catch (e) {
        console.error('FDA check error:', e);
        setRecallData({ active: false });
      } finally {
        setCheckingRecall(false);
      }
    };

    checkRecall();
  }, [product?.brand]);

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
  }  const displayName = product.product_name || product.name;
  const petFoodLabel = product.pet_type === 'dog' ? 'dog food' : product.pet_type === 'cat' ? 'cat food' : 'pet food';
  const searchTerm = encodeURIComponent(`${product.brand || ''} ${displayName} ${petFoodLabel}`.trim());
  const chewySearchTerm = encodeURIComponent(`${product.brand || ''} ${displayName}`.trim());
  
  let amazonLink = product.amazon_link || product.buy_link || '#';
  if (amazonLink === '#') amazonLink = `https://www.amazon.com/s?k=${searchTerm}&tag=lumobites-20`;
  else if (!amazonLink.includes('tag=')) {
    // Append or inject the affiliate tag safely
    amazonLink = amazonLink.includes('?') ? `${amazonLink}&tag=lumobites-20` : `${amazonLink}?tag=lumobites-20`;
  }

  let chewyLink = `https://www.chewy.com/s?query=${chewySearchTerm}`;

  // Only show health tags the user actually selected — not the product's full tag list.
  // If user said 'no health issues', userHealthIssues will be [] so no tags show.
  const productTags = Array.isArray(product.health_tags) ? product.health_tags : [];
  const tags = userHealthIssues.length > 0
    ? productTags.filter(t => userHealthIssues.includes(t))
    : [];

  return (
    <div className="min-h-screen bg-[#FDFAF7] font-sans pb-64">
      {/* Navigation Sub-header with Back Arrow */}
      <div className="bg-white/95 backdrop-blur-sm sticky top-0 z-30 px-6 py-3 flex items-center border-b border-[#E8DDD4]">
        <button 
          onClick={() => window.history.back()} 
          className="bg-transparent border-none cursor-pointer text-[#8B5E3C] hover:text-[#7A5234] flex items-center gap-1.5 font-bold text-xs transition-colors p-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
          </svg>
          Back
        </button>
      </div>
 
      {/* Hero */}
      <div className="bg-white px-6 pt-8 pb-10 rounded-b-3xl border-b border-[#E8DDD4] shadow-sm mb-6 text-center">
        <div className="w-36 h-36 mx-auto mb-5 bg-[#FAF6F4] border border-[#E8DDD4] rounded-2xl flex items-center justify-center shadow-2xs">
          {product.pet_type === 'dog' ? (
            <Dog className="w-20 h-20 text-[#8B5E3C]" />
          ) : (
            <Cat className="w-20 h-20 text-[#8B5E3C]" />
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#191919] leading-tight mb-1">{displayName}</h1>
        <p className="text-xs font-bold uppercase tracking-wider text-[#8B7E7D] mb-3">{product.brand}</p>
        
        {/* Recall Badge */}
        <div className="flex justify-center mb-4">
          {checkingRecall ? (
            <div className="text-xs text-[#8B7E7D] animate-pulse font-medium">Checking FDA recall status...</div>
          ) : recallData?.active ? (
            <div className="bg-red-50 border border-red-300 rounded-xl px-4 py-2 flex items-center gap-2 text-left">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <div>
                <p className="text-red-900 font-bold text-xs">ACTIVE RECALL FOUND</p>
                <p className="text-red-700 text-[11px] opacity-90">{recallData.reason?.substring(0, 60)}...</p>
              </div>
            </div>
          ) : recallData?.active === false ? (
            <div className="bg-emerald-50 border border-emerald-300 rounded-xl px-3.5 py-1.5 flex items-center gap-1.5 text-xs font-bold text-emerald-800">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>No Active Recalls Found</span>
            </div>
          ) : null}
        </div>
 
        <div className="flex flex-wrap justify-center gap-2">
          {tags.map(tag => (
            <span key={tag} className="bg-[#FAF6F4] text-[#8B5E3C] text-xs font-bold px-3 py-1 rounded-full border border-[#E8DDD4]">
              {tag.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      </div>
 
      <div className="max-w-xl mx-auto px-4 sm:px-6 flex flex-col gap-5">
 
        {/* Nutrition */}
        {(product.protein_pct || product.fat_pct || product.fiber_pct) && (
          <section className="bg-white rounded-2xl border border-[#E8DDD4] p-5 sm:p-6 shadow-sm">
            <h3 className="font-extrabold text-sm sm:text-base text-[#191919] mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#8B5E3C]" /> Nutrition Breakdown
            </h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-[#FAF6F4] border border-[#E8DDD4]/80 rounded-xl p-3">
                <span className="block text-xl font-extrabold text-[#191919]">{product.protein_pct || '—'}%</span>
                <span className="text-[10px] font-bold text-[#8B7E7D] uppercase tracking-wider">Protein</span>
              </div>
              <div className="bg-[#FAF6F4] border border-[#E8DDD4]/80 rounded-xl p-3">
                <span className="block text-xl font-extrabold text-[#191919]">{product.fat_pct || '—'}%</span>
                <span className="text-[10px] font-bold text-[#8B7E7D] uppercase tracking-wider">Fat</span>
              </div>
              <div className="bg-[#FAF6F4] border border-[#E8DDD4]/80 rounded-xl p-3">
                <span className="block text-xl font-extrabold text-[#191919]">{product.fiber_pct || '—'}%</span>
                <span className="text-[10px] font-bold text-[#8B7E7D] uppercase tracking-wider">Fiber</span>
              </div>
            </div>
          </section>
        )}
 
        {/* Ingredients */}
        <section className="bg-white rounded-2xl border border-[#E8DDD4] p-5 sm:p-6 shadow-sm">
          <h3 className="font-extrabold text-sm sm:text-base text-[#191919] mb-2.5 flex items-center gap-2">
            <Beef className="w-4 h-4 text-[#8B5E3C]" /> Ingredients
          </h3>
          <p className="text-xs sm:text-sm text-[#555555] leading-relaxed">{product.ingredients}</p>
        </section>
 
        {/* Pros / Cons */}
        {(product.pros || product.cons || product.description) && (
          <div className="grid gap-3.5">
            {(product.pros || product.description) && (
              <section className="bg-[#FAF6F4] border border-[#E8DDD4] rounded-2xl p-4 sm:p-5">
                <h3 className="font-extrabold text-xs sm:text-sm text-[#8B5E3C] mb-1.5 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-[#8B5E3C]" /> Why it's great
                </h3>
                <p className="text-xs sm:text-sm text-[#4A3E3D] leading-relaxed">{product.pros || product.description}</p>
              </section>
            )}
            {product.cons && (
              <section className="bg-red-50/80 border border-red-200 rounded-2xl p-4 sm:p-5">
                <h3 className="font-extrabold text-xs sm:text-sm text-red-900 mb-1.5 flex items-center gap-1.5">
                  <X className="w-4 h-4 text-red-700" /> Things to note
                </h3>
                <p className="text-xs sm:text-sm text-red-800 leading-relaxed">{product.cons}</p>
              </section>
            )}
          </div>
        )}
 
        {/* 7-Day Transition Plan */}
        <section className="bg-white rounded-2xl border border-[#E8DDD4] p-5 sm:p-6 shadow-sm">
          <h3 className="font-extrabold text-sm sm:text-base text-[#191919] mb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#8B5E3C]" /> 7-Day Transition Plan
          </h3>
          <p className="text-xs text-[#666666] mb-4">Slowly mix this food with their current diet to prevent an upset stomach.</p>
          {[{ days: '1-2', pct: 25 }, { days: '3-4', pct: 50 }, { days: '5-6', pct: 75 }, { days: '7+', pct: 100 }].map(({ days, pct }) => (
            <div key={days} className="flex items-center gap-3.5 mb-3 last:mb-0">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 border ${
                pct === 100 
                  ? 'bg-[#8B5E3C] text-white border-[#8B5E3C]' 
                  : 'bg-[#FAF6F4] text-[#191919] border-[#E8DDD4]'
              }`}>
                {days}
              </div>
              <div className="flex-1 h-3.5 bg-[#FAF6F4] border border-[#E8DDD4] rounded-full overflow-hidden flex">
                <div className="bg-gray-300 h-full transition-all" style={{ width: `${100 - pct}%` }}></div>
                <div className="bg-[#8B5E3C] h-full transition-all" style={{ width: `${pct}%` }}></div>
              </div>
              <div className={`text-xs font-bold shrink-0 w-14 text-right ${pct === 100 ? 'text-[#8B5E3C]' : 'text-[#191919]'}`}>
                {pct}% new
              </div>
            </div>
          ))}
        </section>
      </div>
 
      {/* Sticky Buy Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-[#E8DDD4] shadow-lg z-40">
        <div className="max-w-xl mx-auto">
          <div className="mb-2.5 px-1">
            <div className="font-bold text-xs text-[#191919]">Where to buy</div>
            <div className="text-xs text-[#8B7E7D]">Est. ${product.price_monthly_low} - ${product.price_monthly_high}/mo</div>
          </div>
          <div className="flex flex-col gap-2">
            <a 
              href={amazonLink} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="bg-[#8B5E3C] hover:bg-[#7A5234] text-white font-bold text-xs sm:text-sm h-10 rounded-xl no-underline flex items-center justify-center gap-2 transition-colors shadow-2xs"
            >
              <ShoppingCart className="w-4 h-4" /> Buy on Amazon
            </a>
            <a 
              href={chewyLink} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs sm:text-sm h-10 rounded-xl no-underline flex items-center justify-center gap-2 transition-colors shadow-2xs"
            >
              <Footprints className="w-4 h-4" /> Buy on Chewy
            </a>
            <a 
              href="https://www.google.com/maps/search/pet+food+store+near+me" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="bg-white hover:bg-[#FAF6F4] text-[#8B5E3C] border border-[#E8DDD4] font-bold text-xs sm:text-sm h-10 rounded-xl no-underline flex items-center justify-center gap-2 transition-colors"
            >
              <MapPin className="w-4 h-4" /> Find a store near me
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}