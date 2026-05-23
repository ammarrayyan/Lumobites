'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function AnimatedPets() {
  return (
    <div className="flex flex-col items-center w-full mb-10 mt-2 select-none">
      <style>{`
        @keyframes subtle-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .image-container {
          animation: subtle-float 6s ease-in-out infinite;
          position: relative;
          width: 100%;
          max-width: 900px;
          aspect-ratio: 900 / 380;
          height: auto;
          max-height: 380px;
          display: flex;
          justify-content: center;
          align-items: flex-end;
          margin-bottom: 30px;
        }
        @media (min-width: 1024px) {
          .image-container {
            max-width: 1100px;
            max-height: 464px;
            margin-bottom: 40px;
          }
        }
        .image-glow {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          width: 85%;
          height: 30px;
          background: radial-gradient(ellipse at center, rgba(139, 90, 43, 0.15) 0%, rgba(139, 90, 43, 0) 70%);
          border-radius: 50%;
          z-index: 0;
          pointer-events: none;
        }
        .pet-group-img {
          object-fit: contain;
          z-index: 10;
          transition: transform 0.4s ease;
          pointer-events: none;
        }
        .image-container:hover .pet-group-img {
          transform: scale(1.02);
        }
      `}</style>

      {/* Image Display Wrapper */}
      <Link href="/twin" className="image-container" style={{ textDecoration: 'none' }}>
        <div className="image-glow" />
        <div className="relative w-full h-full flex justify-center items-end">
          {/* Using the actual transparent PNG image */}
          <Image 
            src="/pets-group.png" 
            alt="Group of dogs and cats" 
            fill
            className="pet-group-img"
            priority
            draggable={false}
            unoptimized={true}
          />
        </div>
      </Link>

      {/* Original clean pill button — unchanged style */}
      <Link 
        href="/twin"
        className="inline-flex items-center gap-1.5 bg-white hover:bg-[#F9F7F5] active:bg-[#F2EFEA] text-[#666666] hover:text-[#444444] px-4 py-2 rounded-full border border-[#E5E0DA] text-[13px] tracking-wide transition-all shadow-sm select-none"
        style={{ textDecoration: 'none' }}
      >
        <span>✨</span> Find Your Pet Twin
      </Link>
    </div>
  );
}
