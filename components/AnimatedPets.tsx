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
        /* Fancy new: idle float */
        @keyframes float-idle {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-6px); }
        }
        /* Fancy new: sparkle pop */
        @keyframes sparkle-pop {
          0%   { transform: scale(0) rotate(0deg);   opacity: 0; }
          40%  { transform: scale(1.3) rotate(20deg); opacity: 1; }
          100% { transform: scale(0) rotate(40deg);  opacity: 0; }
        }
        /* Fancy new: glow pulse */
        @keyframes glow-pulse {
          0%, 100% { filter: drop-shadow(0 6px 18px rgba(139,94,60,0)); }
          50%       { filter: drop-shadow(0 8px 24px rgba(139,94,60,0.22)); }
        }
        @keyframes glow-pulse-cat {
          0%, 100% { filter: drop-shadow(0 6px 18px rgba(43,45,66,0)); }
          50%       { filter: drop-shadow(0 8px 24px rgba(43,45,66,0.25)); }
        }
        /* Heart float */
        @keyframes heart-rise {
          0%   { transform: translateY(0)   scale(0.5); opacity: 0; }
          20%  { opacity: 1; }
          100% { transform: translateY(-44px) scale(1);   opacity: 0; }
        }

        /* ── Base idle ── */
        .pet-dog {
          animation: float-idle 3.2s ease-in-out infinite, glow-pulse 3.2s ease-in-out infinite;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }
        .pet-cat {
          animation: float-idle 3.8s ease-in-out infinite 0.6s, glow-pulse-cat 3.8s ease-in-out infinite 0.6s;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }

        /* ── Hover ── */
        .pet-dog:hover, .pet-dog:active {
          animation: dog-wiggle 0.4s ease-in-out infinite, glow-pulse 0.8s ease-in-out infinite;
        }
        .pet-cat:hover, .pet-cat:active {
          animation: cat-bounce 0.5s ease-in-out infinite, glow-pulse-cat 0.8s ease-in-out infinite;
        }
        .pet-dog:hover .dog-tail, .pet-dog:active .dog-tail {
          animation-duration: 0.15s !important;
        }
        .pet-cat:hover .cat-tail, .pet-cat:active .cat-tail {
          animation: tail-swish 0.5s ease-in-out infinite !important;
        }

        /* ── Sparkle chips ── */
        .sparkle {
          position: absolute;
          pointer-events: none;
          font-size: 13px;
          animation: sparkle-pop 2.4s ease-in-out infinite;
          z-index: 30;
        }
        .sparkle-1 { top: -6px;  left: -8px;  animation-delay: 0s; }
        .sparkle-2 { top: -10px; right: -4px; animation-delay: 0.8s; }
        .sparkle-3 { bottom: 8px; right: -14px; animation-delay: 1.4s; }

        /* ── Heart ── */
        .heart {
          position: absolute;
          font-size: 14px;
          pointer-events: none;
          animation: heart-rise 2.4s ease-out infinite;
          z-index: 30;
        }
        .heart-1 { bottom: 100%; left: 30%;  animation-delay: 0s;    }
        .heart-2 { bottom: 100%; left: 55%;  animation-delay: 1.1s;  }
        .heart-3 { bottom: 100%; left: 15%;  animation-delay: 1.9s;  }
      `}</style>

      {/* Animals Display Wrapper */}
      <div className="relative flex justify-center items-end gap-16 h-[160px] w-full mb-6 select-none">
        
        {/* Dog Animation */}
        <Link href="/twin" className="pet-dog relative w-32 h-36 flex flex-col items-center justify-end decoration-none" style={{ textDecoration: 'none' }}>
          {/* Floating sparkles */}
          <span className="sparkle sparkle-1">✨</span>
          <span className="sparkle sparkle-2">⭐</span>
          <span className="sparkle sparkle-3">✦</span>
          {/* Rising hearts on hover – always rendered, shown via animation */}
          <span className="heart heart-1">🤎</span>
          <span className="heart heart-2">🧡</span>

          {/* Dog Tail */}
          <div className="dog-tail absolute right-[-10px] bottom-[30px] w-6 h-16 bg-[#D4A373] rounded-full origin-bottom z-0" style={{ animation: 'tail-wag 0.4s ease-in-out infinite' }}></div>
          
          {/* Dog Body */}
          <div className="relative w-24 h-28 bg-[#FAEDCD] rounded-t-[40px] rounded-b-[20px] z-10 overflow-hidden flex justify-center">
            <div className="absolute top-[20px] w-14 h-16 bg-white rounded-full opacity-60"></div>
          </div>
          
          {/* Dog Head */}
          <div className="absolute top-[-20px] z-20 flex flex-col items-center" style={{ animation: 'head-tilt 4s ease-in-out infinite' }}>
            <div className="absolute left-[-15px] top-[10px] w-10 h-16 bg-[#D4A373] rounded-full rotate-[-20deg]"></div>
            <div className="absolute right-[-15px] top-[10px] w-10 h-16 bg-[#D4A373] rounded-full rotate-[20deg]"></div>
            <div className="relative w-28 h-24 bg-[#FAEDCD] rounded-[40px] flex flex-col items-center pt-8">
              <div className="flex gap-8 mb-2">
                <div className="w-3 h-3 bg-gray-800 rounded-full" style={{ animation: 'blink 5s infinite 1s', transformOrigin: 'center' }}></div>
                <div className="w-3 h-3 bg-gray-800 rounded-full" style={{ animation: 'blink 5s infinite 1s', transformOrigin: 'center' }}></div>
              </div>
              <div className="w-6 h-4 bg-gray-800 rounded-full mb-1"></div>
              <div className="w-5 h-7 bg-[#FFB5A7] rounded-b-full origin-top" style={{ animation: 'pant 0.3s infinite alternate' }}></div>
            </div>
          </div>
          
          {/* Paws */}
          <div className="absolute bottom-[-5px] left-[10px] w-8 h-6 bg-[#D4A373] rounded-full z-20"></div>
          <div className="absolute bottom-[-5px] right-[10px] w-8 h-6 bg-[#D4A373] rounded-full z-20"></div>
        </Link>

        {/* Cat Animation */}
        <Link href="/twin" className="pet-cat relative w-24 h-32 flex flex-col items-center justify-end decoration-none" style={{ textDecoration: 'none' }}>
          {/* Floating sparkles */}
          <span className="sparkle sparkle-1" style={{ fontSize: '11px', animationDelay: '0.4s' }}>✦</span>
          <span className="sparkle sparkle-2" style={{ animationDelay: '1.2s' }}>✨</span>
          <span className="sparkle sparkle-3" style={{ fontSize: '10px', animationDelay: '2.0s' }}>⭐</span>
          {/* Rising hearts */}
          <span className="heart heart-1" style={{ animationDelay: '0.5s' }}>💜</span>
          <span className="heart heart-3" style={{ animationDelay: '1.6s' }}>🖤</span>

          {/* Cat Tail */}
          <div className="cat-tail absolute right-[-30px] bottom-[10px] w-16 h-4 bg-[#2B2D42] rounded-full origin-left z-0" style={{ animation: 'tail-swish 3s ease-in-out infinite' }}>
            <div className="absolute right-0 top-[-10px] w-4 h-14 bg-[#2B2D42] rounded-full origin-bottom"></div>
          </div>
          
          {/* Cat Body */}
          <div className="relative w-20 h-24 bg-[#2B2D42] rounded-t-[30px] rounded-b-[10px] z-10 flex justify-center overflow-hidden">
            <div className="absolute bottom-0 w-10 h-16 bg-[#EDF2F4] rounded-t-[20px]"></div>
          </div>
          
          {/* Cat Head */}
          <div className="absolute top-[-15px] z-20 flex flex-col items-center" style={{ animation: 'head-tilt 5s ease-in-out infinite 1s' }}>
            <div className="absolute left-[0px] top-[-8px] w-6 h-8 bg-[#2B2D42] rotate-[-20deg]" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}></div>
            <div className="absolute right-[0px] top-[-8px] w-6 h-8 bg-[#2B2D42] rotate-[20deg]" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}></div>
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
