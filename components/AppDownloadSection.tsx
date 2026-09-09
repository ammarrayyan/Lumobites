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

        {/* Right Column: Modern Polished Flagship Phone Mockup */}
        <div className="lg:col-span-5 flex justify-center items-center">
          <div className="relative w-[280px] sm:w-[310px] select-none">
            
            {/* Ambient Multi-Layer Shadow */}
            <div className="absolute inset-x-8 -bottom-6 h-12 bg-black/25 blur-2xl rounded-full pointer-events-none"></div>

            {/* Outer Titanium Chassis / Slim Bezel Frame */}
            <div className="relative bg-[#161618] p-[8px] sm:p-[10px] rounded-[48px] sm:rounded-[52px] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.38),0_0_0_1px_rgba(255,255,255,0.12)_inset,0_0_0_2px_#2c2c2e] ring-1 ring-black/40">
              
              {/* Dynamic Island Sensor Pill */}
              <div className="absolute top-[16px] left-1/2 -translate-x-1/2 w-[84px] h-[20px] bg-black rounded-full z-30 flex items-center justify-between px-3 shadow-inner">
                {/* Microphone / Sensor Dot */}
                <div className="w-1.5 h-1.5 rounded-full bg-[#1c202a]"></div>
                {/* Camera Lens with Multi-Coating Reflection */}
                <div className="w-2.5 h-2.5 rounded-full bg-[#0a0d18] border border-blue-950/50 flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-blue-500/40"></div>
                </div>
              </div>

              {/* Hardware Side Buttons */}
              <div className="absolute -left-[11px] top-[90px] w-[3px] h-[24px] bg-[#333336] rounded-l-md shadow-xs"></div>
              <div className="absolute -left-[11px] top-[125px] w-[3px] h-[40px] bg-[#333336] rounded-l-md shadow-xs"></div>
              <div className="absolute -left-[11px] top-[175px] w-[3px] h-[40px] bg-[#333336] rounded-l-md shadow-xs"></div>
              <div className="absolute -right-[11px] top-[130px] w-[3px] h-[55px] bg-[#333336] rounded-r-md shadow-xs"></div>

              {/* Inner Screen Display */}
              <div className="relative bg-[#F7F3EE] rounded-[40px] sm:rounded-[44px] overflow-hidden border border-black/20 aspect-[9/19.5]">
                
                {/* Mobile App Screenshot */}
                <img
                  src="/screenshots/home.png"
                  alt="Lumo Bites Mobile App Home Screen"
                  className="w-full h-full object-cover object-top"
                  draggable={false}
                />

                {/* Subtle Glass Sheen Gradient */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-white/[0.14] pointer-events-none"></div>

                {/* Home Indicator Bar */}
                <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 w-28 h-1 bg-black/50 rounded-full z-20"></div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
