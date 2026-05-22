'use client';

import React from 'react';
import Link from 'next/link';

export default function AnimatedPets() {
  return (
    <div className="flex flex-col items-center w-full mb-10 mt-4">
      <style>{`
        @keyframes tail-swish {
          0% { transform: rotate(0deg); }
          50% { transform: rotate(-25deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes tail-wag {
          0% { transform: rotate(-10deg); }
          50% { transform: rotate(15deg); }
          100% { transform: rotate(-10deg); }
        }
        @keyframes head-tilt {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-5deg); }
          75% { transform: rotate(5deg); }
        }
        @keyframes pant {
          0%, 100% { transform: translateY(0px) scaleY(1); }
          50% { transform: translateY(2px) scaleY(1.1); }
        }
        @keyframes blink {
          0%, 48%, 52%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(0.1); }
        }
        @keyframes dog-wiggle {
          0%, 100% { transform: rotate(0deg) translateY(0); }
          25% { transform: rotate(-4deg) translateY(-3px); }
          75% { transform: rotate(4deg) translateY(-3px); }
        }
        @keyframes cat-bounce {
          0%, 100% { transform: translateY(0px) scaleY(1); }
          40% { transform: translateY(-8px) scaleY(1.02); }
          60% { transform: translateY(-8px) scaleY(1.02); }
        }
        .pet-interactive {
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }
        .pet-dog.pet-interactive:hover, .pet-dog.pet-interactive:active {
          animation: dog-wiggle 0.4s ease-in-out infinite;
        }
        .pet-cat.pet-interactive:hover, .pet-cat.pet-interactive:active {
          animation: cat-bounce 0.5s ease-in-out infinite;
        }
        .pet-dog.pet-interactive:hover .dog-tail, .pet-dog.pet-interactive:active .dog-tail {
          animation-duration: 0.15s !important;
        }
        .pet-cat.pet-interactive:hover .cat-tail, .pet-cat.pet-interactive:active .cat-tail {
          animation: tail-swish 0.5s ease-in-out infinite !important;
        }

        /* ── CTA Button ── */
        @keyframes shimmer-slide {
          0%   { transform: translateX(-110%) skewX(-18deg); }
          100% { transform: translateX(220%)  skewX(-18deg); }
        }
        @keyframes sparkle-float {
          0%, 100% { transform: translateY(0px) scale(1); opacity: 0.9; }
          50%       { transform: translateY(-4px) scale(1.15); opacity: 1; }
        }
        @keyframes sparkle-float-2 {
          0%, 100% { transform: translateY(0px) scale(1) rotate(0deg); opacity: 0.7; }
          50%       { transform: translateY(-5px) scale(1.2) rotate(20deg); opacity: 1; }
        }
        @keyframes pulse-ring {
          0%   { transform: scale(1);    opacity: 0.6; }
          100% { transform: scale(1.18); opacity: 0;   }
        }
        @keyframes gradient-shift {
          0%   { background-position: 0%   50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0%   50%; }
        }
        .twin-cta-btn {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 14px 30px;
          border-radius: 100px;
          border: none;
          cursor: pointer;
          overflow: hidden;
          text-decoration: none;
          background: linear-gradient(135deg, #8B5E3C 0%, #C4874A 40%, #8B5E3C 80%, #A0693F 100%);
          background-size: 250% 250%;
          animation: gradient-shift 5s ease infinite;
          box-shadow:
            0 4px 20px rgba(139, 94, 60, 0.35),
            0 1px 4px rgba(0,0,0,0.10),
            inset 0 1px 0 rgba(255,255,255,0.18);
          transition: transform 0.18s ease, box-shadow 0.18s ease;
          user-select: none;
        }
        .twin-cta-btn:hover {
          transform: translateY(-2px) scale(1.03);
          box-shadow:
            0 8px 32px rgba(139, 94, 60, 0.45),
            0 2px 8px rgba(0,0,0,0.12),
            inset 0 1px 0 rgba(255,255,255,0.22);
        }
        .twin-cta-btn:active {
          transform: translateY(0px) scale(0.99);
          box-shadow:
            0 3px 12px rgba(139, 94, 60, 0.30),
            inset 0 1px 0 rgba(255,255,255,0.15);
        }
        /* shimmer sweep */
        .twin-cta-btn::before {
          content: '';
          position: absolute;
          top: 0; left: 0;
          width: 45%;
          height: 100%;
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.28) 50%, transparent 100%);
          animation: shimmer-slide 2.8s ease-in-out infinite;
          pointer-events: none;
        }
        /* top-edge highlight */
        .twin-cta-btn::after {
          content: '';
          position: absolute;
          top: 0; left: 10%; right: 10%;
          height: 1px;
          background: rgba(255,255,255,0.40);
          border-radius: 100px;
          pointer-events: none;
        }
        .twin-cta-label {
          position: relative;
          font-size: 15px;
          font-weight: 800;
          letter-spacing: 0.02em;
          color: #fff;
          text-shadow: 0 1px 2px rgba(0,0,0,0.18);
        }
        .twin-cta-spark {
          font-size: 16px;
          line-height: 1;
          animation: sparkle-float 2.2s ease-in-out infinite;
          filter: drop-shadow(0 1px 3px rgba(255,220,100,0.6));
        }
        .twin-cta-spark-2 {
          font-size: 12px;
          line-height: 1;
          animation: sparkle-float-2 2.6s ease-in-out infinite 0.4s;
          filter: drop-shadow(0 1px 3px rgba(255,220,100,0.5));
        }
        /* pulse ring */
        .twin-cta-wrap {
          position: relative;
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }
        .twin-cta-ring {
          position: absolute;
          inset: -1px;
          border-radius: 100px;
          border: 2px solid rgba(139, 94, 60, 0.55);
          animation: pulse-ring 2s ease-out infinite;
          pointer-events: none;
        }
        .twin-cta-ring-2 {
          position: absolute;
          inset: -1px;
          border-radius: 100px;
          border: 2px solid rgba(139, 94, 60, 0.30);
          animation: pulse-ring 2s ease-out infinite 0.7s;
          pointer-events: none;
        }
        /* subtle sub-label */
        .twin-cta-sub {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #A89080;
        }
      `}</style>

      {/* Animals Display Wrapper */}
      <div className="relative flex justify-center items-end gap-16 h-[160px] w-full mb-8 select-none">
        
        {/* Dog Animation */}
        <Link href="/twin" className="pet-dog pet-interactive relative w-32 h-36 flex flex-col items-center justify-end drop-shadow-md decoration-none" style={{ textDecoration: 'none' }}>
          {/* Dog Tail */}
          <div className="dog-tail absolute right-[-10px] bottom-[30px] w-6 h-16 bg-[#D4A373] rounded-full origin-bottom z-0" style={{ animation: 'tail-wag 0.4s ease-in-out infinite' }}></div>
          
          {/* Dog Body */}
          <div className="relative w-24 h-28 bg-[#FAEDCD] rounded-t-[40px] rounded-b-[20px] z-10 overflow-hidden flex justify-center">
            <div className="absolute top-[20px] w-14 h-16 bg-white rounded-full opacity-60"></div>
          </div>
          
          {/* Dog Head */}
          <div className="absolute top-[-20px] z-20 flex flex-col items-center" style={{ animation: 'head-tilt 4s ease-in-out infinite' }}>
            {/* Ears */}
            <div className="absolute left-[-15px] top-[10px] w-10 h-16 bg-[#D4A373] rounded-full rotate-[-20deg]"></div>
            <div className="absolute right-[-15px] top-[10px] w-10 h-16 bg-[#D4A373] rounded-full rotate-[20deg]"></div>
            
            {/* Face */}
            <div className="relative w-28 h-24 bg-[#FAEDCD] rounded-[40px] flex flex-col items-center pt-8">
              <div className="flex gap-8 mb-2">
                <div className="w-3 h-3 bg-gray-800 rounded-full" style={{ animation: 'blink 5s infinite 1s', transformOrigin: 'center' }}></div>
                <div className="w-3 h-3 bg-gray-800 rounded-full" style={{ animation: 'blink 5s infinite 1s', transformOrigin: 'center' }}></div>
              </div>
              <div className="w-6 h-4 bg-gray-800 rounded-full mb-1"></div>
              {/* Tongue */}
              <div className="w-5 h-7 bg-[#FFB5A7] rounded-b-full origin-top" style={{ animation: 'pant 0.3s infinite alternate' }}></div>
            </div>
          </div>
          
          {/* Paws */}
          <div className="absolute bottom-[-5px] left-[10px] w-8 h-6 bg-[#D4A373] rounded-full z-20"></div>
          <div className="absolute bottom-[-5px] right-[10px] w-8 h-6 bg-[#D4A373] rounded-full z-20"></div>
        </Link>

        {/* Cat Animation */}
        <Link href="/twin" className="pet-cat pet-interactive relative w-24 h-32 flex flex-col items-center justify-end drop-shadow-md decoration-none" style={{ textDecoration: 'none' }}>
          {/* Cat Tail */}
          <div className="cat-tail absolute right-[-30px] bottom-[10px] w-16 h-4 bg-[#2B2D42] rounded-full origin-left z-0" style={{ animation: 'tail-swish 3s ease-in-out infinite' }}>
            <div className="absolute right-0 top-[-10px] w-4 h-14 bg-[#2B2D42] rounded-full origin-bottom"></div>
          </div>
          
          {/* Cat Body */}
          <div className="relative w-20 h-24 bg-[#2B2D42] rounded-t-[30px] rounded-b-[10px] z-10 flex justify-center overflow-hidden">
            {/* White Chest */}
            <div className="absolute bottom-0 w-10 h-16 bg-[#EDF2F4] rounded-t-[20px]"></div>
          </div>
          
          {/* Cat Head */}
          <div className="absolute top-[-15px] z-20 flex flex-col items-center" style={{ animation: 'head-tilt 5s ease-in-out infinite 1s' }}>
            {/* Ears */}
            <div className="absolute left-[0px] top-[-8px] w-6 h-8 bg-[#2B2D42] rotate-[-20deg]" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}></div>
            <div className="absolute right-[0px] top-[-8px] w-6 h-8 bg-[#2B2D42] rotate-[20deg]" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}></div>
            
            {/* Face */}
            <div className="relative w-20 h-18 bg-[#2B2D42] rounded-full flex flex-col items-center justify-center pt-2">
              <div className="flex gap-6 mb-1">
                <div className="w-2 h-2 bg-gray-100 rounded-full" style={{ animation: 'blink 4s infinite 2s', transformOrigin: 'center' }}></div>
                <div className="w-2 h-2 bg-gray-100 rounded-full" style={{ animation: 'blink 4s infinite 2s', transformOrigin: 'center' }}></div>
              </div>
              <div className="w-2 h-1.5 bg-pink-300 rounded-full"></div>
            </div>
          </div>
          
          {/* Paws */}
          <div className="absolute bottom-[-2px] left-[15px] w-5 h-4 bg-[#2B2D42] rounded-full z-20"></div>
          <div className="absolute bottom-[-2px] right-[15px] w-5 h-4 bg-[#2B2D42] rounded-full z-20"></div>
        </Link>

      </div>

      {/* Premium CTA Button */}
      <div className="twin-cta-wrap">
        <div className="twin-cta-ring" />
        <div className="twin-cta-ring-2" />
        <Link href="/twin" className="twin-cta-btn">
          <span className="twin-cta-spark">✨</span>
          <span className="twin-cta-label">Find Your Pet Twin</span>
          <span className="twin-cta-spark-2">🐾</span>
        </Link>
        <span className="twin-cta-sub">Free · Instant Results</span>
      </div>
    </div>
  );
}
