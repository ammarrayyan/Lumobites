'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, Camera } from 'lucide-react';

interface PartnerGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  photos: string[];
  partnerName: string;
  initialIndex?: number;
}

export default function PartnerGalleryModal({
  isOpen,
  onClose,
  photos,
  partnerName,
  initialIndex = 0,
}: PartnerGalleryModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  if (!isOpen || !photos || photos.length === 0 || typeof window === 'undefined') return null;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
  };

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[999999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-4xl w-full bg-transparent flex flex-col items-center justify-center"
      >
        {/* Top Bar */}
        <div className="w-full flex items-center justify-between text-white mb-3 px-2">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-black">{partnerName}</span>
            <span className="text-xs text-gray-400">
              ({currentIndex + 1} / {photos.length})
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-300 hover:text-white rounded-full bg-white/10 hover:bg-white/20 transition-all cursor-pointer border-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Photo Viewport */}
        <div className="relative w-full aspect-16/10 sm:aspect-16/9 bg-black/50 rounded-2xl overflow-hidden flex items-center justify-center border border-white/10 shadow-2xl">
          <img
            src={photos[currentIndex]}
            alt={`${partnerName} photo ${currentIndex + 1}`}
            className="w-full h-full object-contain max-h-[75vh]"
          />

          {/* Navigation Arrows */}
          {photos.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-all cursor-pointer border-none backdrop-blur-xs"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-all cursor-pointer border-none backdrop-blur-xs"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>

        {/* Bottom Thumbnails Strip */}
        {photos.length > 1 && (
          <div className="flex items-center gap-2 mt-3 overflow-x-auto py-2 max-w-full px-2">
            {photos.map((url, idx) => (
              <button
                key={url + idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-14 h-10 sm:w-16 sm:h-12 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer p-0 bg-transparent ${
                  idx === currentIndex
                    ? 'border-amber-400 scale-105 shadow-md'
                    : 'border-white/20 opacity-50 hover:opacity-100'
                }`}
              >
                <img src={url} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
