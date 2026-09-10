'use client';

import React from 'react';
import { Smartphone, CheckCircle2, Bell, ShieldCheck, Heart } from 'lucide-react';

export default function AppDownloadSection() {
  return (
    <section className="hidden md:block w-full bg-[#F7F3EE] border-t border-[#E8DDD4] py-12 sm:py-16 px-4 sm:px-8 lg:px-12 overflow-hidden">
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
        
        {/* Left Column: Copy & Store Badges */}
        <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left">
          <div className="inline-flex items-center gap-2 bg-[#8B5E3C]/10 text-[#8B5E3C] text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full mb-4 border border-[#8B5E3C]/20 shadow-xs">
            <Smartphone className="w-3.5 h-3.5 text-[#8B5E3C]" />
            Official Mobile App
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#191919] tracking-tight leading-[1.15] mb-4">
            Take Lumo Bites with you.
          </h2>

          <p className="text-sm sm:text-base text-[#666666] leading-relaxed max-w-xl mb-8">
            Access every pet care tool right from your phone. Get instant alerts for lost pets in your neighborhood, find verified local sitters, scan ingredient labels on the go, and connect with fellow pet parents.
          </p>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full max-w-lg mb-8 text-left">
            <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-white border border-[#E8DDD4] shadow-xs">
              <Bell className="w-4 h-4 text-[#E05A47] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-[#191919]">Instant Push Alerts</h4>
                <p className="text-[11px] text-[#666666] leading-snug">Immediate notifications for lost &amp; found pets nearby.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-white border border-[#E8DDD4] shadow-xs">
              <ShieldCheck className="w-4 h-4 text-[#4E9F76] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-[#191919]">Direct Sitter Booking</h4>
                <p className="text-[11px] text-[#666666] leading-snug">0% fee pet sitting with ID-verified local sitters.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-white border border-[#E8DDD4] shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-[#8B5E3C] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-[#191919]">Camera Safety Scanner</h4>
                <p className="text-[11px] text-[#666666] leading-snug">Scan pet food barcodes &amp; labels for toxic ingredients.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-white border border-[#E8DDD4] shadow-xs">
              <Heart className="w-4 h-4 text-[#D94668] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-[#191919]">Pet Twin AI &amp; Adoption</h4>
                <p className="text-[11px] text-[#666666] leading-snug">Find your pet lookalike &amp; discover rescue pets.</p>
              </div>
            </div>
          </div>

          {/* Download App Store Badges */}
          <div className="flex flex-wrap gap-4 items-center justify-center lg:justify-start">
            {/* Google Play Store */}
            <a
              href="https://play.google.com/store/apps/details?id=net.lumobites.app"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-transform duration-200 hover:scale-105 active:scale-95 shadow-sm rounded-xl overflow-hidden"
              aria-label="Download on Google Play"
            >
              <img
                src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png"
                alt="Get it on Google Play"
                className="h-[52px] w-auto object-contain"
              />
            </a>

            {/* Apple App Store */}
            <a
              href="https://apps.apple.com/app/lumo-bites/id6780612179"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-transform duration-200 hover:scale-105 active:scale-95 shadow-sm rounded-xl overflow-hidden"
              aria-label="Download on the App Store"
            >
              <img
                src="/app-store-badge.svg"
                alt="Download on the App Store"
                className="h-[40px] w-auto object-contain"
              />
            </a>
          </div>
        </div>

        {/* Right Column: Modern Flat Flagship Phone Mockup */}
        <div className="lg:col-span-5 flex justify-center items-center">
          <div className="relative w-[280px] sm:w-[315px] select-none group">
            {/* Outer Chassis & Razor-Thin Bezel */}
            <div className="relative bg-[#262629] p-[8px] sm:p-[9px] rounded-[50px] sm:rounded-[54px] border border-[#3A3A3E]">
              
              {/* Dynamic Island Sensor Pill */}
              <div className="absolute top-[16px] left-1/2 -translate-x-1/2 w-[86px] h-[22px] bg-black rounded-full z-30 flex items-center justify-between px-3 shadow-inner">
                {/* Proximity / Ambient Sensor Pinhole */}
                <div className="w-1.5 h-1.5 rounded-full bg-[#121622] opacity-80"></div>
                {/* TrueDepth Camera with Multi-Coating Optical Reflection */}
                <div className="w-2.5 h-2.5 rounded-full bg-[#060A14] border border-blue-900/60 ring-1 ring-white/10 flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-blue-500/50"></div>
                </div>
              </div>

              {/* Antenna Isolation Lines on Titanium Edge */}
              <div className="absolute -left-[1px] top-[70px] w-[2px] h-[3px] bg-[#1a1a1c] opacity-60"></div>
              <div className="absolute -right-[1px] top-[70px] w-[2px] h-[3px] bg-[#1a1a1c] opacity-60"></div>

              {/* Hardware Metallic Side Buttons */}
              <div className="absolute -left-[10px] top-[95px] w-[3px] h-[24px] bg-gradient-to-b from-[#555559] to-[#28282A] rounded-l-md shadow-xs"></div>
              <div className="absolute -left-[10px] top-[130px] w-[3px] h-[42px] bg-gradient-to-b from-[#555559] to-[#28282A] rounded-l-md shadow-xs"></div>
              <div className="absolute -left-[10px] top-[180px] w-[3px] h-[42px] bg-gradient-to-b from-[#555559] to-[#28282A] rounded-l-md shadow-xs"></div>
              <div className="absolute -right-[10px] top-[135px] w-[3px] h-[58px] bg-gradient-to-b from-[#555559] to-[#28282A] rounded-r-md shadow-xs"></div>

              {/* Inner High-Precision Display Screen */}
              <div className="relative bg-[#F7F3EE] rounded-[42px] sm:rounded-[46px] overflow-hidden border border-black/25 aspect-[9/19.5]">
                
                {/* Mobile App Screen Rendering */}
                <img
                  src="/screenshots/home.png"
                  alt="Lumo Bites Mobile App Home Screen"
                  className="w-full h-full object-cover object-top select-none"
                  draggable={false}
                />

                {/* Curved Specular Glare & Glass Reflection Sheen */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.05] to-white/[0.2] pointer-events-none"></div>

                {/* Top Subtle Display Ambient Vignette */}
                <div className="absolute top-0 inset-x-0 h-10 bg-gradient-to-b from-black/10 to-transparent pointer-events-none"></div>

                {/* Bottom Home Indicator Bar */}
                <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 w-28 h-[4px] bg-black/60 rounded-full z-20 shadow-xs"></div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
