'use client';

import React from 'react';
import { Smartphone, CheckCircle2, Bell, ShieldCheck, Heart } from 'lucide-react';

export default function AppDownloadSection() {
  return (
    <section className="hidden md:block w-full bg-white border-y border-[#E8DDD4] py-10 sm:py-14 px-4 sm:px-8 lg:px-12 overflow-hidden">
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
            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#FDFAF7] border border-[#E8DDD4]">
              <Bell className="w-4 h-4 text-[#E05A47] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-[#191919]">Instant Push Alerts</h4>
                <p className="text-[11px] text-[#666666] leading-snug">Immediate notifications for lost & found pets nearby.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#FDFAF7] border border-[#E8DDD4]">
              <ShieldCheck className="w-4 h-4 text-[#4E9F76] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-[#191919]">Direct Sitter Booking</h4>
                <p className="text-[11px] text-[#666666] leading-snug">0% fee pet sitting with ID-verified local sitters.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#FDFAF7] border border-[#E8DDD4]">
              <CheckCircle2 className="w-4 h-4 text-[#8B5E3C] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-[#191919]">Camera Safety Scanner</h4>
                <p className="text-[11px] text-[#666666] leading-snug">Scan pet food barcodes & labels for toxic ingredients.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#FDFAF7] border border-[#E8DDD4]">
              <Heart className="w-4 h-4 text-[#D94668] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-[#191919]">Pet Twin AI & Adoption</h4>
                <p className="text-[11px] text-[#666666] leading-snug">Find your pet lookalike & discover rescue pets.</p>
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

        {/* Right Column: Ultra-Realistic iPhone Mockup */}
        <div className="lg:col-span-5 flex justify-center items-center">
          <div className="relative w-[280px] sm:w-[320px] filter drop-shadow-[0_25px_35px_rgba(0,0,0,0.18)] select-none">
            
            {/* Outer Titanium/Glass Frame */}
            <div className="relative bg-[#1C1C1E] p-[10px] sm:p-[12px] rounded-[48px] sm:rounded-[54px] shadow-[0_0_0_2px_#3A3A3C,0_0_0_4px_#1C1C1E,0_20px_50px_rgba(0,0,0,0.35)] border border-white/20">
              
              {/* Dynamic Island Pill */}
              <div className="absolute top-[18px] left-1/2 -translate-x-1/2 w-[90px] h-[22px] bg-black rounded-full z-30 flex items-center justify-end px-2 shadow-sm">
                {/* Camera Lens Flare */}
                <div className="w-2.5 h-2.5 rounded-full bg-[#111625] border border-blue-950/40 flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-blue-500/40"></div>
                </div>
              </div>

              {/* Speaker Ear Slit */}
              <div className="absolute top-[12px] left-1/2 -translate-x-1/2 w-10 h-1 bg-[#2C2C2E] rounded-full z-30"></div>

              {/* Side Action Buttons (Hardware Visuals) */}
              <div className="absolute -left-[14px] top-[95px] w-[3px] h-[26px] bg-[#3A3A3C] rounded-l-md"></div>
              <div className="absolute -left-[14px] top-[135px] w-[3px] h-[44px] bg-[#3A3A3C] rounded-l-md"></div>
              <div className="absolute -left-[14px] top-[188px] w-[3px] h-[44px] bg-[#3A3A3C] rounded-l-md"></div>
              <div className="absolute -right-[14px] top-[140px] w-[3px] h-[65px] bg-[#3A3A3C] rounded-r-md"></div>

              {/* Screen Area */}
              <div className="relative bg-[#F7F3EE] rounded-[38px] sm:rounded-[44px] overflow-hidden border border-black/10 aspect-[9/19.2]">
                
                {/* Live Home Page Screenshot */}
                <img
                  src="/screenshots/home.png"
                  alt="Lumo Bites Mobile App Home Screen"
                  className="w-full h-full object-cover object-top"
                  draggable={false}
                />

                {/* Specular Glare / Glass Sheen Overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 pointer-events-none"></div>

                {/* Bottom Home Indicator Bar */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-black/60 rounded-full z-20"></div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
