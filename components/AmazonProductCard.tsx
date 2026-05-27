'use client';

import { useState } from 'react';

export interface AmazonProduct {
  asin: string;
  title: string;
  url: string;
  image: string;
  price: string;
  priceRaw: number;
  rating: number;
  reviewCount: number;
  isPrime: boolean;
}

interface Props {
  product: AmazonProduct;
  compact?: boolean;
}

function StarRating({ rating, count }: { rating: number; count: number }) {
  if (!rating) return null;
  const full = Math.floor(rating);
  const half = rating - full >= 0.4;
  const empty = 5 - full - (half ? 1 : 0);

  return (
    <div className="flex items-center gap-1.5">
      <span className="flex">
        {Array.from({ length: full }).map((_, i) => (
          <svg key={`f${i}`} className="w-3.5 h-3.5 text-[#FF9900]" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        {half && (
          <svg className="w-3.5 h-3.5 text-[#FF9900]" viewBox="0 0 20 20" fill="currentColor">
            <defs>
              <linearGradient id="half-star">
                <stop offset="50%" stopColor="#FF9900" />
                <stop offset="50%" stopColor="#D1D5DB" />
              </linearGradient>
            </defs>
            <path fill="url(#half-star)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        )}
        {Array.from({ length: empty }).map((_, i) => (
          <svg key={`e${i}`} className="w-3.5 h-3.5 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </span>
      {count > 0 && (
        <span className="text-[11px] text-[#007185] font-medium">
          {count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count}
        </span>
      )}
    </div>
  );
}

export function AmazonProductCardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`bg-white border border-[#E8DDD4] rounded-2xl overflow-hidden shadow-sm animate-pulse ${compact ? 'flex gap-3 p-3' : 'flex flex-col'}`}>
      <div className={`bg-gray-100 flex-shrink-0 ${compact ? 'w-16 h-16 rounded-xl' : 'h-48 w-full'}`} />
      <div className={`${compact ? 'flex-1 py-0.5' : 'p-4'} flex flex-col gap-2`}>
        <div className="h-3 bg-gray-100 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-3 bg-gray-100 rounded w-1/3" />
        <div className={`h-8 bg-gray-100 rounded-lg mt-auto ${compact ? 'hidden' : ''}`} />
      </div>
    </div>
  );
}

export default function AmazonProductCard({ product, compact = false }: Props) {
  const [imgError, setImgError] = useState(false);

  if (compact) {
    return (
      <a
        href={product.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex gap-3 bg-white border border-[#E8DDD4] rounded-2xl p-3 hover:shadow-md transition-all group"
      >
        {/* Image */}
        <div className="w-16 h-16 flex-shrink-0 bg-[#FDFAF7] rounded-xl flex items-center justify-center overflow-hidden border border-[#F0E8E0]">
          {product.image && !imgError ? (
            <img
              src={product.image}
              alt={product.title}
              className="w-full h-full object-contain p-1"
              onError={() => setImgError(true)}
            />
          ) : (
            <span className="text-2xl">📦</span>
          )}
        </div>
        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
          <p className="text-xs font-semibold text-[#191919] line-clamp-2 leading-snug">{product.title}</p>
          <div className="flex items-center gap-2 flex-wrap">
            {product.price && (
              <span className="text-sm font-black text-[#B12704]">{product.price}</span>
            )}
            {product.isPrime && (
              <span className="text-[10px] font-black text-[#007185] bg-[#E8F4F8] px-1.5 py-0.5 rounded">Prime</span>
            )}
          </div>
          <StarRating rating={product.rating} count={product.reviewCount} />
        </div>
        <div className="flex-shrink-0 flex items-center">
          <svg className="w-4 h-4 text-gray-300 group-hover:text-[#8B5E3C] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </a>
    );
  }

  return (
    <div className="bg-white border border-[#E8DDD4] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col">
      {/* Product image */}
      <div className="relative h-48 bg-[#FDFAF7] flex items-center justify-center border-b border-[#F0E8E0]">
        {product.image && !imgError ? (
          <img
            src={product.image}
            alt={product.title}
            className="h-full w-full object-contain p-4"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="text-5xl">📦</span>
        )}
        {product.isPrime && (
          <span className="absolute top-2 right-2 text-[11px] font-black text-[#007185] bg-white border border-[#007185]/20 px-2 py-0.5 rounded-full shadow-sm">
            ✓ Prime
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <p className="text-sm font-semibold text-[#191919] line-clamp-2 leading-snug">{product.title}</p>

        <div className="flex items-center gap-2 flex-wrap">
          {product.price && (
            <span className="text-lg font-black text-[#B12704]">{product.price}</span>
          )}
        </div>

        <StarRating rating={product.rating} count={product.reviewCount} />

        <a
          href={product.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto w-full bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] font-bold text-xs py-2.5 rounded-lg text-center transition-colors border border-[#FCD200] flex items-center justify-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Buy on Amazon →
        </a>
      </div>

      {/* Attribution */}
      <div className="px-4 pb-3 flex items-center gap-1 justify-center">
        <span className="text-[9px] text-gray-400">Powered by</span>
        <svg className="h-3 w-auto" viewBox="0 0 100 30" fill="none" xmlns="http://www.w3.org/2000/svg">
          <text x="0" y="22" fontFamily="Arial, sans-serif" fontSize="22" fontWeight="bold" fill="#FF9900">amazon</text>
        </svg>
      </div>
    </div>
  );
}
