'use client';

import React, { useState } from 'react';
import { Dog, Cat, PawPrint, ChevronLeft, ChevronRight } from 'lucide-react';

interface PetPhotoCarouselProps {
  photoUrls?: string[];
  petType?: string;
  className?: string;
}

export default function PetPhotoCarousel({ photoUrls, petType, className = "w-16 h-16" }: PetPhotoCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const urls = Array.isArray(photoUrls) ? photoUrls.filter(Boolean) : [];

  if (urls.length === 0) {
    return (
      <div className={`${className} bg-[#FAF6F4] border border-[#E8DDD4] flex items-center justify-center shrink-0`}>
        {petType === 'cat' ? (
          <Cat className="w-1/2 h-1/2 text-[#8B5E3C]" />
        ) : petType === 'dog' ? (
          <Dog className="w-1/2 h-1/2 text-[#8B5E3C]" />
        ) : (
          <PawPrint className="w-1/2 h-1/2 text-[#8B5E3C]" />
        )}
      </div>
    );
  }

  if (urls.length === 1) {
    return (
      <div className={`${className} bg-[#FAF6F4] border border-[#E8DDD4] shrink-0 relative overflow-hidden`}>
        <img src={urls[0]} alt="Pet Profile" className="w-full h-full object-cover pointer-events-none" />
      </div>
    );
  }

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveIndex(prev => (prev === 0 ? urls.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveIndex(prev => (prev === urls.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className={`${className} bg-[#FAF6F4] border border-[#E8DDD4] shrink-0 relative overflow-hidden group`}>
      {/* Current Photo */}
      <img src={urls[activeIndex]} alt={`Pet Profile ${activeIndex + 1}`} className="w-full h-full object-cover pointer-events-none" />

      {/* Navigation Chevrons (visible on hover) */}
      <button
        type="button"
        onClick={handlePrev}
        className="absolute left-1 top-1/2 -translate-y-1/2 w-5 h-5 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 cursor-pointer border-none z-10"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={handleNext}
        className="absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 cursor-pointer border-none z-10"
      >
        <ChevronRight className="w-3.5 h-3.5" />
      </button>

      {/* Indicator Dots */}
      <div className="absolute bottom-1 inset-x-0 flex justify-center gap-1 z-10">
        {urls.map((_, idx) => (
          <div
            key={idx}
            className={`w-1.5 h-1.5 rounded-full transition-all ${
              idx === activeIndex ? 'bg-white scale-110 shadow-sm' : 'bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
