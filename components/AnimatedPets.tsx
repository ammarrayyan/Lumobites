'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Sparkles } from 'lucide-react';

export default function AnimatedPets() {
  return (
    <div className="flex flex-col items-center w-full mb-3 sm:mb-6 mt-1 sm:mt-2 select-none">
      <style>{`
        @keyframes subtle-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .image-container {
          animation: subtle-float 6s ease-in-out infinite;
          position: relative;
          width: 100%;
          max-width: 540px;
          aspect-ratio: 900 / 380;
          height: auto;
          max-height: clamp(160px, 24vh, 210px);
          display: flex;
          justify-content: center;
          align-items: flex-end;
          margin-bottom: 4px;
        }
        @media (min-width: 1024px) {
          .image-container {
            max-width: 900px;
            max-height: 380px;
            margin-bottom: 16px;
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
          transform: scale(1.15);
          transform-origin: bottom center;
        }
        .image-container:hover .pet-group-img {
          transform: scale(1.18);
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

    </div>
  );
}
