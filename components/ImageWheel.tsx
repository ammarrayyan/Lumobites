'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, MoveHorizontal } from 'lucide-react';

interface WheelItem {
  id: string;
  title: string;
  category: string;
  badge: string;
  description: string;
  image: string;
  link: string;
  color: string;
}

const WHEEL_ITEMS: WheelItem[] = [
  {
    id: 'petsitting',
    title: 'Pet Sitting & Boarding',
    category: 'Trusted Local Care',
    badge: 'Verified Sitters',
    description: 'Find trusted ID-verified sitters & veterinary boarding facilities near you.',
    image: '/screenshots/petsitting.png',
    link: '/petsitting',
    color: '#C17D3C',
  },
  {
    id: 'lost-pets',
    title: 'Lost & Found Pets',
    category: 'Community Safety',
    badge: 'AI Photo Match',
    description: 'Instant neighborhood alerts and visual AI matching to reunite pets fast.',
    image: '/screenshots/lost-pets.png',
    link: '/lost-pets',
    color: '#E05A47',
  },
  {
    id: 'city-board',
    title: 'City Community Board',
    category: 'Neighborhood Hub',
    badge: 'Local Discussions',
    description: 'Ask advice, share tips, and connect with fellow pet parents in your city.',
    image: '/screenshots/city-board.png',
    link: '/city-board',
    color: '#5B7E96',
  },
  {
    id: 'twin',
    title: 'Pet Twin AI',
    category: 'AI Visual Matcher',
    badge: 'Fun & Shareable',
    description: 'Discover which dog or cat breed matches your personality and traits.',
    image: '/screenshots/twin.png',
    link: '/twin',
    color: '#8B5E3C',
  },
  {
    id: 'adoption',
    title: 'Pet Adoption',
    category: 'Shelter Network',
    badge: 'Find Your Match',
    description: 'Browse rescue animals waiting for homes and connect directly with shelters.',
    image: '/screenshots/adoption.png',
    link: '/adoption',
    color: '#D94668',
  },
  {
    id: 'chat',
    title: 'AI Pet Food Advisor',
    category: 'Nutrition & Health',
    badge: 'Personalized Plan',
    description: 'Compare formulas, check toxic ingredients, and find ideal pet foods.',
    image: '/screenshots/chat.png',
    link: '/chat',
    color: '#4E9F76',
  },
  {
    id: 'home',
    title: 'Lumo Bites Home',
    category: 'All-in-One Pet Care',
    badge: 'Every Feature',
    description: 'Everything your pet needs, powered by intelligent AI in one place.',
    image: '/screenshots/home.png',
    link: '/',
    color: '#8B5E3C',
  },
];

export default function ImageWheel() {
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [windowWidth, setWindowWidth] = useState(1200);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; rotation: number; time: number }>({ x: 0, rotation: 0, time: 0 });
  const velocityRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const dragDistanceRef = useRef(0);

  // Responsive radius calculation
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  const radiusX = isMobile ? 220 : 420;
  const radiusZ = isMobile ? 180 : 320;
  const cardWidth = isMobile ? 200 : 260;
  const cardHeight = isMobile ? 320 : 400;

  // Auto-spin and inertia decay loop
  useEffect(() => {
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      if (!isDragging) {
        if (Math.abs(velocityRef.current) > 0.05) {
          // Inertia decay
          setRotation((prev) => prev + velocityRef.current * delta);
          velocityRef.current *= 0.95; // friction
        } else if (!isHovered) {
          // Gentle auto-rotation
          setRotation((prev) => prev + 0.15 * delta);
        }
      }

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isDragging, isHovered]);

  // Pointer drag events (supports mouse & touch)
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setIsDragging(true);
    dragDistanceRef.current = 0;
    velocityRef.current = 0;
    dragStartRef.current = {
      x: e.clientX,
      rotation: rotation,
      time: performance.now(),
    };
    if (containerRef.current) {
      containerRef.current.setPointerCapture(e.pointerId);
    }
  }, [rotation]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    dragDistanceRef.current = Math.abs(deltaX);

    const sensitivity = isMobile ? 0.007 : 0.004;
    const newRotation = dragStartRef.current.rotation + deltaX * sensitivity;
    setRotation(newRotation);

    const now = performance.now();
    const dt = (now - dragStartRef.current.time) / 1000;
    if (dt > 0.02) {
      velocityRef.current = (deltaX * sensitivity) / dt;
      dragStartRef.current.time = now;
      dragStartRef.current.x = e.clientX;
      dragStartRef.current.rotation = newRotation;
    }
  }, [isDragging, isMobile]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    if (containerRef.current) {
      try {
        containerRef.current.releasePointerCapture(e.pointerId);
      } catch (err) {}
    }
  }, [isDragging]);

  const totalItems = WHEEL_ITEMS.length;
  const angleStep = (2 * Math.PI) / totalItems;

  return (
    <section className="w-full bg-gradient-to-b from-[#F7F3EE] via-[#FDFAF7] to-[#F7F3EE] py-14 sm:py-20 px-4 overflow-hidden select-none border-b border-[#E8DDD4]/60">
      <div className="max-w-6xl mx-auto flex flex-col items-center text-center mb-8 sm:mb-12">
        <div className="inline-flex items-center gap-2 bg-[#8B5E3C]/10 text-[#8B5E3C] text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full mb-3.5 border border-[#8B5E3C]/20 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#8B5E3C]" />
          Interactive Feature Showcase
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-[#191919] tracking-tight mb-2.5">
          Explore Every Corner of Lumo Bites
        </h2>
        <p className="text-xs sm:text-sm text-[#666666] max-w-lg mx-auto leading-relaxed">
          Drag horizontally to spin through our key tools — from instant lost pet alerts to local pet sitting, AI food analysis, and community discussions.
        </p>

        {/* Drag Hint Pill */}
        <div className="inline-flex items-center gap-1.5 mt-4 text-[11px] font-bold text-[#8B5E3C] bg-white border border-[#E8DDD4] px-3 py-1 rounded-full shadow-2xs">
          <MoveHorizontal className="w-3.5 h-3.5 animate-pulse" />
          <span>Drag or flick to rotate</span>
        </div>
      </div>

      {/* 3D Cylindrical Wheel Stage */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative w-full max-w-[1100px] mx-auto h-[380px] sm:h-[460px] cursor-grab active:cursor-grabbing flex items-center justify-center touch-pan-y"
        style={{
          perspective: '1200px',
          perspectiveOrigin: '50% 50%',
        }}
      >
        {WHEEL_ITEMS.map((item, index) => {
          const angle = rotation + index * angleStep;
          const sin = Math.sin(angle);
          const cos = Math.cos(angle);

          // Calculate 3D spatial positioning
          const x = sin * radiusX;
          const z = cos * radiusZ; // cos: 1 in front, -1 in back

          // Depth normalization: 0 in back, 1 in front
          const depthNorm = (cos + 1) / 2;

          const scale = isMobile 
            ? 0.7 + depthNorm * 0.35 
            : 0.65 + depthNorm * 0.42;

          const opacity = 0.35 + depthNorm * 0.65;
          const zIndex = Math.round(depthNorm * 100);
          const rotateY = -sin * 32; // 3D curvature angle

          return (
            <div
              key={item.id}
              className="absolute top-1/2 left-1/2 will-change-transform transition-opacity duration-150"
              style={{
                width: `${cardWidth}px`,
                height: `${cardHeight}px`,
                marginLeft: `-${cardWidth / 2}px`,
                marginTop: `-${cardHeight / 2}px`,
                transform: `translate3d(${x}px, 0px, ${z}px) rotateY(${rotateY}deg) scale(${scale})`,
                zIndex,
                opacity,
              }}
            >
              <Link
                href={item.link}
                onClick={(e) => {
                  if (dragDistanceRef.current > 6) {
                    e.preventDefault();
                  }
                }}
                className="group block w-full h-full bg-white rounded-2xl sm:rounded-3xl border border-[#E8DDD4] shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden text-left relative"
                style={{ textDecoration: 'none' }}
              >
                {/* Screenshot Media */}
                <div className="w-full h-[62%] bg-[#FAF6F4] relative overflow-hidden border-b border-[#E8DDD4]/80">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    draggable={false}
                  />
                  {/* Badge */}
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/80 shadow-xs">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#191919]">
                      {item.badge}
                    </span>
                  </div>
                </div>

                {/* Card Text & CTA */}
                <div className="p-3.5 sm:p-4 flex flex-col justify-between h-[38%] bg-white">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B5E3C] block mb-0.5">
                      {item.category}
                    </span>
                    <h3 className="font-extrabold text-xs sm:text-sm text-[#191919] leading-tight line-clamp-1">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-[#666666] line-clamp-2 mt-1 leading-snug">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] font-bold text-[#8B5E3C] mt-1 group-hover:translate-x-1 transition-transform">
                    <span>View feature</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>

      {/* Manual Quick Controls for Wheel */}
      <div className="flex justify-center items-center gap-3 mt-6">
        <button
          type="button"
          onClick={() => {
            velocityRef.current = 1.6;
          }}
          aria-label="Previous feature"
          className="w-9 h-9 rounded-full bg-white border border-[#E8DDD4] text-[#8B5E3C] hover:bg-[#FAF6F4] hover:border-[#8B5E3C] flex items-center justify-center shadow-xs font-bold transition-all cursor-pointer active:scale-95 text-sm"
        >
          &larr;
        </button>
        <div className="text-xs font-bold text-[#8B7E7D]">
          Click or drag cards to explore
        </div>
        <button
          type="button"
          onClick={() => {
            velocityRef.current = -1.6;
          }}
          aria-label="Next feature"
          className="w-9 h-9 rounded-full bg-white border border-[#E8DDD4] text-[#8B5E3C] hover:bg-[#FAF6F4] hover:border-[#8B5E3C] flex items-center justify-center shadow-xs font-bold transition-all cursor-pointer active:scale-95 text-sm"
        >
          &rarr;
        </button>
      </div>
    </section>
  );
}
