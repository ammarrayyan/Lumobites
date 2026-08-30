'use client';

import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface LostPetCardCarouselProps {
  photos: string[];
  petName: string;
  status: string;
  petType: string;
}

export default function LostPetCardCarousel({
  photos,
  petName,
  status,
  petType
}: LostPetCardCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);

  const validPhotos = photos && photos.length > 0 ? photos : [];
  const total = validPhotos.length;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (total <= 1) return;
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    isDraggingRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null || total <= 1) return;
    const deltaX = Math.abs(e.touches[0].clientX - touchStartXRef.current);
    const deltaY = Math.abs(e.touches[0].clientY - touchStartYRef.current);
    if (deltaX > 8 && deltaX > deltaY) {
      isDraggingRef.current = true;
      e.stopPropagation();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || total <= 1) return;
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchEndX - touchStartXRef.current;

    if (Math.abs(deltaX) > 40) {
      e.stopPropagation();
      if (deltaX < 0) {
        // Swiped Left -> Next Photo
        setCurrentIndex(prev => (prev + 1) % total);
      } else {
        // Swiped Right -> Prev Photo
        setCurrentIndex(prev => (prev - 1 + total) % total);
      }
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
    setTimeout(() => { isDraggingRef.current = false; }, 50);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex(prev => (prev - 1 + total) % total);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex(prev => (prev + 1) % total);
  };

  const handleDotClick = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex(index);
  };

  return (
    <div 
      className="relative h-76 sm:h-88 md:h-96 bg-[#FAF5EE] flex items-center justify-center overflow-hidden border-b border-[#EADBCE] select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Current Photo */}
      {validPhotos.length > 0 ? (
        <img 
          src={validPhotos[currentIndex]} 
          alt={`${petName || 'Pet'} - photo ${currentIndex + 1}`} 
          className="w-full h-full object-contain p-0.5 group-hover:scale-105 transition-transform duration-300 pointer-events-none" 
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No Photo</div>
      )}

      {/* Top Status Badge */}
      <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none z-10">
        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wider uppercase shadow-md ${
          status === 'resolved' ? 'bg-green-500 text-white' :
          petType === 'lost' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
        }`}>
          {status === 'resolved' ? <span className="flex items-center gap-1"><Check className="w-3 h-3" />Resolved</span> : petType}
        </span>
      </div>

      {/* Chevron Navigation Controls (Visible when multiple photos exist) */}
      {total > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous photo"
            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-xs transition-all opacity-80 hover:opacity-100 cursor-pointer border-none z-10 active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next photo"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-xs transition-all opacity-80 hover:opacity-100 cursor-pointer border-none z-10 active:scale-95"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Dot Indicators */}
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/35 backdrop-blur-xs px-2.5 py-1 rounded-full z-10 pointer-events-auto">
            {validPhotos.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => handleDotClick(e, idx)}
                aria-label={`Go to photo ${idx + 1}`}
                className={`transition-all duration-200 cursor-pointer border-none p-0 ${
                  currentIndex === idx
                    ? 'w-3.5 h-1.5 bg-white rounded-full'
                    : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/80 rounded-full'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
