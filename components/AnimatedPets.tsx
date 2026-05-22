'use client';

import React from 'react';
import Link from 'next/link';

export default function AnimatedPets() {
  return (
    <div className="flex flex-col items-center w-full mb-10 mt-2 select-none">
      <style>{`
        /* ─── Pet body animations ─────────────────────────── */
        @keyframes tail-swish {
          0%,100% { transform: rotate(0deg); }
          50%      { transform: rotate(-28deg); }
        }
        @keyframes tail-wag {
          0%,100% { transform: rotate(-12deg); }
          50%      { transform: rotate(18deg); }
        }
        @keyframes head-tilt {
          0%,100% { transform: rotate(0deg); }
          25%     { transform: rotate(-5deg); }
          75%     { transform: rotate(5deg); }
        }
        @keyframes pant {
          0%,100% { transform: translateY(0) scaleY(1); }
          50%      { transform: translateY(2px) scaleY(1.12); }
        }
        @keyframes blink {
          0%,48%,52%,100% { transform: scaleY(1); }
          50%              { transform: scaleY(0.08); }
        }

        /* ─── Idle float (out of phase) ───────────────────── */
        @keyframes float-dog {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-7px); }
        }
        @keyframes float-cat {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-7px); }
        }

        /* ─── Hover overrides ─────────────────────────────── */
        @keyframes dog-wiggle {
          0%,100% { transform: rotate(0deg) translateY(0); }
          25%     { transform: rotate(-4deg) translateY(-3px); }
          75%     { transform: rotate(4deg) translateY(-3px); }
        }
        @keyframes cat-bounce {
          0%,100% { transform: translateY(0px); }
          40%,60% { transform: translateY(-9px); }
        }

        /* ─── Ambient glow behind pets ────────────────────── */
        @keyframes glow-dog {
          0%,100% { opacity: 0.28; transform: scale(0.88); }
          50%      { opacity: 0.55; transform: scale(1.05); }
        }
        @keyframes glow-cat {
          0%,100% { opacity: 0.22; transform: scale(0.88); }
          50%      { opacity: 0.48; transform: scale(1.05); }
        }

        /* ─── Orbiting ring around each pet ──────────────── */
        @keyframes orbit-cw {
          from { transform: rotate(0deg)   translateX(52px) rotate(0deg); }
          to   { transform: rotate(360deg) translateX(52px) rotate(-360deg); }
        }
        @keyframes orbit-ccw {
          from { transform: rotate(0deg)    translateX(46px) rotate(0deg); }
          to   { transform: rotate(-360deg) translateX(46px) rotate(360deg); }
        }

        /* ─── Connection stream (dog → cat) ──────────────── */
        @keyframes stream-flow {
          0%   { transform: translateX(0)     translateY(0);    opacity: 0;   }
          8%   { opacity: 1; }
          50%  { transform: translateX(92px)  translateY(-5px); opacity: 0.9; }
          92%  { opacity: 1; }
          100% { transform: translateX(184px) translateY(0);    opacity: 0;   }
        }
        /* reverse: cat → dog */
        @keyframes stream-flow-rev {
          0%   { transform: translateX(0)      translateY(0);    opacity: 0;   }
          8%   { opacity: 1; }
          50%  { transform: translateX(-92px)  translateY(-5px); opacity: 0.9; }
          92%  { opacity: 1; }
          100% { transform: translateX(-184px) translateY(0);    opacity: 0;   }
        }

        /* ─── DNA double-helix dots ───────────────────────── */
        @keyframes dna-top {
          0%,100% { transform: translateY(0);  }
          50%      { transform: translateY(-8px); }
        }
        @keyframes dna-bot {
          0%,100% { transform: translateY(0);  }
          50%      { transform: translateY(8px); }
        }

        /* ─── Pet classes ─────────────────────────────────── */
        .pet-dog-wrap {
          animation: float-dog 3.0s ease-in-out infinite;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }
        .pet-cat-wrap {
          animation: float-cat 3.6s ease-in-out infinite 0.7s;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }
        .pet-dog-wrap:hover, .pet-dog-wrap:active {
          animation: dog-wiggle 0.4s ease-in-out infinite;
        }
        .pet-cat-wrap:hover, .pet-cat-wrap:active {
          animation: cat-bounce 0.5s ease-in-out infinite;
        }
        .pet-dog-wrap:hover .dog-tail { animation-duration: 0.13s !important; }
        .pet-cat-wrap:hover .cat-tail {
          animation: tail-swish 0.45s ease-in-out infinite !important;
        }

        /* ─── Stream dot base ─────────────────────────────── */
        .sdot {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }
      `}</style>

      {/* ── Main composition ─────────────────────────────────── */}
      <div className="relative flex justify-center items-end w-full mb-6" style={{ height: '200px' }}>

        {/* ── Background ambient glow — dog ────────────────── */}
        <div
          className="absolute"
          style={{
            left: '50%', bottom: '10px',
            transform: 'translateX(calc(-50% - 80px))',
            width: '130px', height: '130px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(212,163,115,0.55) 0%, rgba(212,163,115,0) 70%)',
            animation: 'glow-dog 3.0s ease-in-out infinite',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        {/* ── Background ambient glow — cat ────────────────── */}
        <div
          className="absolute"
          style={{
            left: '50%', bottom: '10px',
            transform: 'translateX(calc(-50% + 80px))',
            width: '120px', height: '120px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(43,45,66,0.35) 0%, rgba(43,45,66,0) 70%)',
            animation: 'glow-cat 3.6s ease-in-out infinite 0.7s',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        {/* ── Orbiting sparkle — dog (clockwise) ───────────── */}
        <div className="absolute" style={{ left: '50%', bottom: '60px', transform: 'translateX(calc(-50% - 80px))', width: '1px', height: '1px', zIndex: 1, pointerEvents: 'none' }}>
          {[
            { delay: '0s',    char: '✦', size: '11px', color: '#C4874A' },
            { delay: '-1.4s', char: '•', size: '8px',  color: '#D4A373' },
            { delay: '-2.8s', char: '✦', size: '9px',  color: '#8B5E3C' },
          ].map((s, i) => (
            <div key={i} style={{ position: 'absolute', animation: `orbit-cw ${4.2}s linear infinite`, animationDelay: s.delay }}>
              <span style={{ fontSize: s.size, color: s.color, opacity: 0.85, fontWeight: 'bold' }}>{s.char}</span>
            </div>
          ))}
        </div>

        {/* ── Orbiting sparkle — cat (counter-clockwise) ───── */}
        <div className="absolute" style={{ left: '50%', bottom: '55px', transform: 'translateX(calc(-50% + 80px))', width: '1px', height: '1px', zIndex: 1, pointerEvents: 'none' }}>
          {[
            { delay: '0s',    char: '✦', size: '10px', color: '#4A4C68' },
            { delay: '-1.6s', char: '•', size: '7px',  color: '#2B2D42' },
            { delay: '-3.2s', char: '✦', size: '9px',  color: '#6B6D8A' },
          ].map((s, i) => (
            <div key={i} style={{ position: 'absolute', animation: `orbit-ccw ${5.0}s linear infinite`, animationDelay: s.delay }}>
              <span style={{ fontSize: s.size, color: s.color, opacity: 0.75, fontWeight: 'bold' }}>{s.char}</span>
            </div>
          ))}
        </div>

        {/* ── Connection stream: dog → cat ─────────────────── */}
        <div
          className="absolute"
          style={{
            left: '50%',
            bottom: '58px',
            transform: 'translateX(calc(-50% - 68px))',
            width: '0', height: '0',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        >
          {[
            { delay: '0s',    size: 5, color: 'rgba(196,135,74,0.80)',  top: 0   },
            { delay: '-0.5s', size: 4, color: 'rgba(139,94,60,0.60)',   top: 4   },
            { delay: '-1.0s', size: 6, color: 'rgba(212,163,115,0.90)', top: -3  },
            { delay: '-1.5s', size: 4, color: 'rgba(196,135,74,0.70)',  top: 2   },
            { delay: '-2.0s', size: 5, color: 'rgba(139,94,60,0.55)',   top: -1  },
            { delay: '-2.5s', size: 4, color: 'rgba(212,163,115,0.80)', top: 3   },
          ].map((d, i) => (
            <div
              key={i}
              className="sdot"
              style={{
                width: d.size, height: d.size,
                background: d.color,
                top: d.top,
                left: 0,
                animation: `stream-flow 3.0s ease-in-out infinite`,
                animationDelay: d.delay,
                boxShadow: `0 0 4px ${d.color}`,
              }}
            />
          ))}
        </div>

        {/* ── Connection stream: cat → dog ─────────────────── */}
        <div
          className="absolute"
          style={{
            left: '50%',
            bottom: '48px',
            transform: 'translateX(calc(-50% + 68px))',
            width: '0', height: '0',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        >
          {[
            { delay: '-0.3s', size: 4, color: 'rgba(43,45,66,0.60)',   top: 1  },
            { delay: '-1.1s', size: 5, color: 'rgba(75,78,105,0.75)',  top: -2 },
            { delay: '-1.9s', size: 4, color: 'rgba(43,45,66,0.50)',   top: 3  },
            { delay: '-2.7s', size: 5, color: 'rgba(107,109,138,0.80)',top: -1 },
          ].map((d, i) => (
            <div
              key={i}
              className="sdot"
              style={{
                width: d.size, height: d.size,
                background: d.color,
                top: d.top,
                left: 0,
                animation: `stream-flow-rev 3.4s ease-in-out infinite`,
                animationDelay: d.delay,
                boxShadow: `0 0 4px ${d.color}`,
              }}
            />
          ))}
        </div>

        {/* ── DNA double-helix bar in center ───────────────── */}
        <div
          className="absolute flex flex-col justify-between"
          style={{
            left: '50%', bottom: '38px',
            transform: 'translateX(-50%)',
            height: '40px', width: '20px',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        >
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="flex justify-between items-center w-full">
              <div
                style={{
                  width: '4px', height: '4px', borderRadius: '50%',
                  background: 'rgba(196,135,74,0.7)',
                  animation: `dna-top 1.6s ease-in-out infinite`,
                  animationDelay: `${i * 0.2}s`,
                  boxShadow: '0 0 3px rgba(196,135,74,0.5)',
                }}
              />
              <div
                style={{
                  width: '4px', height: '4px', borderRadius: '50%',
                  background: 'rgba(43,45,66,0.7)',
                  animation: `dna-bot 1.6s ease-in-out infinite`,
                  animationDelay: `${i * 0.2}s`,
                  boxShadow: '0 0 3px rgba(43,45,66,0.5)',
                }}
              />
            </div>
          ))}
        </div>

        {/* ── DOG ──────────────────────────────────────────── */}
        <Link
          href="/twin"
          className="pet-dog-wrap absolute flex flex-col items-center justify-end"
          style={{
            left: '50%', bottom: '0',
            transform: 'translateX(calc(-50% - 80px))',
            width: '128px', height: '160px',
            textDecoration: 'none', zIndex: 10,
          }}
        >
          {/* Tail */}
          <div
            className="dog-tail absolute z-0"
            style={{
              right: '-10px', bottom: '30px',
              width: '24px', height: '64px',
              background: '#D4A373', borderRadius: '9999px',
              transformOrigin: 'bottom',
              animation: 'tail-wag 0.4s ease-in-out infinite',
            }}
          />
          {/* Body */}
          <div className="relative z-10 flex justify-center overflow-hidden"
            style={{ width: '96px', height: '112px', background: '#FAEDCD', borderRadius: '40px 40px 20px 20px' }}>
            <div style={{ position: 'absolute', top: '20px', width: '56px', height: '64px', background: '#fff', borderRadius: '50%', opacity: 0.6 }} />
          </div>
          {/* Head */}
          <div
            className="absolute z-20 flex flex-col items-center"
            style={{ top: '-20px', animation: 'head-tilt 4s ease-in-out infinite' }}
          >
            <div style={{ position: 'absolute', left: '-15px', top: '10px', width: '40px', height: '64px', background: '#D4A373', borderRadius: '9999px', transform: 'rotate(-20deg)' }} />
            <div style={{ position: 'absolute', right: '-15px', top: '10px', width: '40px', height: '64px', background: '#D4A373', borderRadius: '9999px', transform: 'rotate(20deg)' }} />
            <div className="relative flex flex-col items-center pt-8"
              style={{ width: '112px', height: '96px', background: '#FAEDCD', borderRadius: '40px' }}>
              <div style={{ display: 'flex', gap: '32px', marginBottom: '8px' }}>
                <div style={{ width: '12px', height: '12px', background: '#1f2937', borderRadius: '50%', animation: 'blink 5s infinite 1s', transformOrigin: 'center' }} />
                <div style={{ width: '12px', height: '12px', background: '#1f2937', borderRadius: '50%', animation: 'blink 5s infinite 1s', transformOrigin: 'center' }} />
              </div>
              <div style={{ width: '24px', height: '16px', background: '#1f2937', borderRadius: '9999px', marginBottom: '4px' }} />
              <div style={{ width: '20px', height: '28px', background: '#FFB5A7', borderRadius: '0 0 9999px 9999px', transformOrigin: 'top', animation: 'pant 0.3s infinite alternate' }} />
            </div>
          </div>
          {/* Paws */}
          <div style={{ position: 'absolute', bottom: '-5px', left: '10px', width: '32px', height: '24px', background: '#D4A373', borderRadius: '9999px', zIndex: 20 }} />
          <div style={{ position: 'absolute', bottom: '-5px', right: '10px', width: '32px', height: '24px', background: '#D4A373', borderRadius: '9999px', zIndex: 20 }} />
        </Link>

        {/* ── CAT ──────────────────────────────────────────── */}
        <Link
          href="/twin"
          className="pet-cat-wrap absolute flex flex-col items-center justify-end"
          style={{
            left: '50%', bottom: '0',
            transform: 'translateX(calc(-50% + 80px))',
            width: '96px', height: '148px',
            textDecoration: 'none', zIndex: 10,
          }}
        >
          {/* Tail */}
          <div
            className="cat-tail absolute z-0"
            style={{
              right: '-30px', bottom: '10px',
              width: '64px', height: '16px',
              background: '#2B2D42', borderRadius: '9999px',
              transformOrigin: 'left',
              animation: 'tail-swish 3s ease-in-out infinite',
            }}
          >
            <div style={{ position: 'absolute', right: 0, top: '-10px', width: '16px', height: '56px', background: '#2B2D42', borderRadius: '9999px', transformOrigin: 'bottom' }} />
          </div>
          {/* Body */}
          <div className="relative z-10 flex justify-center overflow-hidden"
            style={{ width: '80px', height: '96px', background: '#2B2D42', borderRadius: '30px 30px 10px 10px' }}>
            <div style={{ position: 'absolute', bottom: 0, width: '40px', height: '64px', background: '#EDF2F4', borderRadius: '20px 20px 0 0' }} />
          </div>
          {/* Head */}
          <div
            className="absolute z-20 flex flex-col items-center"
            style={{ top: '-15px', animation: 'head-tilt 5s ease-in-out infinite 1s' }}
          >
            <div style={{ position: 'absolute', left: 0, top: '-8px', width: '24px', height: '32px', background: '#2B2D42', clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)', transform: 'rotate(-20deg)' }} />
            <div style={{ position: 'absolute', right: 0, top: '-8px', width: '24px', height: '32px', background: '#2B2D42', clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)', transform: 'rotate(20deg)' }} />
            <div className="relative flex flex-col items-center justify-center pt-2"
              style={{ width: '80px', height: '72px', background: '#2B2D42', borderRadius: '9999px' }}>
              <div style={{ display: 'flex', gap: '24px', marginBottom: '4px' }}>
                <div style={{ width: '8px', height: '8px', background: '#f3f4f6', borderRadius: '50%', animation: 'blink 4s infinite 2s', transformOrigin: 'center' }} />
                <div style={{ width: '8px', height: '8px', background: '#f3f4f6', borderRadius: '50%', animation: 'blink 4s infinite 2s', transformOrigin: 'center' }} />
              </div>
              <div style={{ width: '8px', height: '6px', background: '#f9a8d4', borderRadius: '9999px' }} />
            </div>
          </div>
          {/* Paws */}
          <div style={{ position: 'absolute', bottom: '-2px', left: '15px', width: '20px', height: '16px', background: '#2B2D42', borderRadius: '9999px', zIndex: 20 }} />
          <div style={{ position: 'absolute', bottom: '-2px', right: '15px', width: '20px', height: '16px', background: '#2B2D42', borderRadius: '9999px', zIndex: 20 }} />
        </Link>

      </div>

      {/* ── CTA button — original clean pill ─────────────── */}
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
