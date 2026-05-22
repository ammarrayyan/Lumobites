'use client';

import React from 'react';
import Link from 'next/link';

// Brand warm brown — matches site palette
const C = '#8B5A2B';

export default function AnimatedPets() {
  return (
    <div className="flex flex-col items-center w-full mb-8 mt-2 select-none">
      <style>{`
        /* ── Breathing ───────────────────────────────────── */
        @keyframes breathe {
          0%, 100% { transform: scaleY(1)     scaleX(1);    }
          45%       { transform: scaleY(1.025) scaleX(0.987); }
        }

        /* ── Dog tail wag ────────────────────────────────── */
        @keyframes dog-wag {
          0%, 100% { transform: rotate(-12deg); }
          50%       { transform: rotate(14deg);  }
        }

        /* ── Cat tail sway ───────────────────────────────── */
        @keyframes cat-sway {
          0%, 100% { transform: rotate(-6deg);  }
          50%       { transform: rotate(22deg); }
        }

        /* ── Gentle idle float ───────────────────────────── */
        @keyframes float-dog {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-5px); }
        }
        @keyframes float-cat {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-5px); }
        }

        /* ── Hover lean toward each other ────────────────── */
        .pet-dog-svg {
          animation: float-dog 3.8s ease-in-out infinite;
          cursor: pointer;
          display: block;
          transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1);
        }
        .pet-dog-svg:hover {
          animation: none;
          transform: rotate(6deg) translateX(10px);
          transform-origin: bottom right;
          filter: drop-shadow(4px 6px 12px rgba(139,90,43,0.28));
        }

        .pet-cat-svg {
          animation: float-cat 4.2s ease-in-out infinite 1.0s;
          cursor: pointer;
          display: block;
          transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1);
        }
        .pet-cat-svg:hover {
          animation: none;
          transform: rotate(-6deg) translateX(-10px);
          transform-origin: bottom left;
          filter: drop-shadow(-4px 6px 12px rgba(139,90,43,0.28));
        }

        /* ── Tail & breathe applied to sub-groups ─────────── */
        .dog-breathe { animation: breathe 3.8s ease-in-out infinite; transform-origin: 50% 95%; }
        .cat-breathe { animation: breathe 3.4s ease-in-out infinite 0.6s; transform-origin: 50% 95%; }
        .dog-tail    { animation: dog-wag 1.1s ease-in-out infinite; transform-origin: 80% 12%; }
        .cat-tail    { animation: cat-sway 2.6s ease-in-out infinite; transform-origin: 18% 5%; }
      `}</style>

      <div className="flex items-end justify-center gap-2 mb-5" style={{ height: '210px' }}>

        {/* ──────────────────── DOG ──────────────────────────
            Sitting Labrador facing RIGHT (toward cat).
            Silhouette built from overlapping same-colour shapes.
            ViewBox 0 0 190 210.
        ─────────────────────────────────────────────────── */}
        <Link href="/twin" style={{ textDecoration: 'none' }}>
          <svg
            className="pet-dog-svg"
            width="185"
            height="205"
            viewBox="0 0 190 210"
            fill={C}
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Tail — low behind haunches, curving backward-left */}
            <g className="dog-tail">
              <path d="M 36,138
                       C 22,136 10,128  8,116
                       C  6,104 14, 94 24, 97
                       C 34,100 38,115 36,138 Z" />
            </g>

            {/* Body group that breathes */}
            <g className="dog-breathe">

              {/* Haunches — large rounded mass, lower-left */}
              <ellipse cx="54"  cy="158" rx="38" ry="44" />

              {/* Torso — angled oval connecting haunches to chest */}
              <ellipse cx="96"  cy="122" rx="40" ry="56"
                       transform="rotate(-14 96 122)" />

              {/* Chest / shoulder connector toward head (upper-right) */}
              <path d="M 112,80
                       C 124,65 142,58 155,66
                       C 164,72 162,88 150,94
                       C 136,100 118,96 112,80 Z" />

              {/* Head — oval, elongated slightly right (muzzle direction) */}
              <ellipse cx="160" cy="84"  rx="28" ry="25" />

              {/* Ear — floppy, drooping forward off right side of skull */}
              <ellipse cx="162" cy="100" rx="12" ry="19"
                       transform="rotate(12 162 100)" />

              {/* Front-leg left */}
              <rect x="93"  y="158" width="17" height="42" rx="8.5" />
              {/* Front-leg right */}
              <rect x="114" y="158" width="17" height="42" rx="8.5" />
              {/* Paw base — smooths the two legs into the ground */}
              <ellipse cx="115" cy="198" rx="26" ry="9" />

            </g>
          </svg>
        </Link>

        {/* ──────────────────── CAT ──────────────────────────
            Sitting domestic shorthair facing LEFT (toward dog).
            More upright posture, pointed ears, curling tail.
            ViewBox 0 0 155 200.
        ─────────────────────────────────────────────────── */}
        <Link href="/twin" style={{ textDecoration: 'none' }}>
          <svg
            className="pet-cat-svg"
            width="152"
            height="200"
            viewBox="0 0 155 200"
            fill={C}
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Tail — wraps around lower-right, curving outward */}
            <g className="cat-tail">
              <path d="M 88,152
                       C 108,146 122,132 120,118
                       C 118,106 108,100 99,106
                       C 90,113  88,132 88,152 Z" />
            </g>

            {/* Body group that breathes */}
            <g className="cat-breathe">

              {/* Body — upright oval, cats sit more vertically */}
              <ellipse cx="60"  cy="130" rx="30" ry="60" />

              {/* Haunches — wider base */}
              <ellipse cx="60"  cy="174" rx="34" ry="22" />

              {/* Neck connector patch */}
              <path d="M 40,82
                       C 36,70 42,55 54,53
                       C 66,51 74,63 70,76
                       C 66,88 50,90 40,82 Z" />

              {/* Head — slightly wider than tall (domestic cat proportions) */}
              <ellipse cx="48"  cy="64"  rx="29" ry="27" />

              {/* Left ear — angled outward-left */}
              <polygon points="28,48 18,21 45,38" />
              {/* Right ear — angled outward-right */}
              <polygon points="58,38 66,14 78,42" />

              {/* Front-leg left */}
              <rect x="36"  y="168" width="14" height="28" rx="7" />
              {/* Front-leg right */}
              <rect x="54"  y="168" width="14" height="28" rx="7" />
              {/* Paw base */}
              <ellipse cx="52"  cy="194" rx="22" ry="7" />

            </g>
          </svg>
        </Link>

      </div>

      {/* Original clean pill button — unchanged */}
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
