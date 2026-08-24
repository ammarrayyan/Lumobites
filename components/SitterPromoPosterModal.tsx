'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import { QrCode, Download, Share2, Copy, Check, X, ShieldCheck, Star, MapPin, Sparkles, Dog, Cat, Loader2, Smartphone, FileText, CreditCard } from 'lucide-react';
import { formatSitterName } from '@/app/petsitting/page';

interface SitterPromoPosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  sitter: {
    id: string;
    first_name?: string;
    last_name?: string;
    name?: string;
    photo?: string;
    avatar_url?: string;
    city?: string;
    state?: string;
    location?: string;
    rating?: number | string;
    review_count?: number;
    reviews_count?: number;
    service_types?: string[];
    services?: string[];
    rate?: string | number;
    rate_type?: string;
    is_pro?: boolean;
    approval_status?: string;
  };
}

const SERVICE_LABELS: Record<string, string> = {
  home_visits: 'Drop-In Visits',
  drop_in: 'Drop-In Visits',
  overnight: 'Overnight Sitting',
  dog_walking: 'Dog Walking',
  walking: 'Dog Walking',
  boarding: 'Home Boarding',
  daycare: 'Pet Daycare',
};

type PosterFormat = 'flyer' | 'story' | 'card';

export default function SitterPromoPosterModal({ isOpen, onClose, sitter }: SitterPromoPosterModalProps) {
  const [format, setFormat] = useState<PosterFormat>('flyer');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isGeneratingDownload, setIsGeneratingDownload] = useState(false);
  const posterRef = useRef<HTMLDivElement | null>(null);

  const fullName = sitter.name || `${sitter.first_name || ''} ${sitter.last_name || ''}`.trim() || 'Pet Sitter';
  const displayName = formatSitterName(fullName);
  const displayLocation = sitter.city || sitter.location || 'Local Community';
  const profileUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/petsitting?sitter=${sitter.id}` 
    : `https://lumobites.net/petsitting?sitter=${sitter.id}`;

  const rawServices = sitter.service_types || sitter.services || [];
  const displayServices = rawServices.map(s => SERVICE_LABELS[s] || s.replace(/_/g, ' ')).slice(0, 3).join(' • ') || 'Dog Walking • Drop-Ins • Sitting';

  useEffect(() => {
    if (isOpen && sitter.id) {
      QRCode.toDataURL(profileUrl, {
        margin: 1,
        width: 320,
        color: {
          dark: '#2B231D',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'H',
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Failed to generate QR code', err));
    }
  }, [isOpen, sitter.id, profileUrl]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch (err) {
      console.error('Failed to copy link', err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${displayName} - Pet Sitter on Lumo Bites`,
          text: `Need loving pet care in your neighborhood? View my pet sitting profile and book directly on Lumo Bites!`,
          url: profileUrl,
        });
      } catch (err) {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const handleDownloadImage = async () => {
    if (!posterRef.current || isGeneratingDownload) return;
    setIsGeneratingDownload(true);

    try {
      const canvas = await html2canvas(posterRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#FFFFFF',
        logging: false,
      });

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      const sanitizedName = displayName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      link.download = `lumo-sitter-${sanitizedName}-${format}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to download poster image', err);
    } finally {
      setIsGeneratingDownload(false);
    }
  };

  if (!isOpen || typeof window === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#FDFBF9] rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-[#E8DDD4] my-auto animate-in fade-in zoom-in-95 duration-150 relative">
        {/* Top Modal Bar */}
        <div className="flex items-center justify-between border-b border-[#E8DDD4] pb-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-[#8B5E3C] flex items-center justify-center font-bold">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#2B231D] text-base leading-tight">My Sitter Profile Poster & QR</h3>
              <p className="text-xs text-[#8B7E7D]">Download or share your branded card across 3 formats</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 text-gray-500 border border-[#E8DDD4] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── FORMAT SELECTOR TABS ── */}
        <div className="flex bg-[#F0EAE4] p-1 rounded-2xl mb-4 gap-1">
          <button
            type="button"
            onClick={() => setFormat('flyer')}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              format === 'flyer'
                ? 'bg-white text-[#2B231D] shadow-xs'
                : 'text-[#666666] hover:text-[#2B231D]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Flyer / Poster
          </button>
          <button
            type="button"
            onClick={() => setFormat('story')}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              format === 'story'
                ? 'bg-white text-[#2B231D] shadow-xs'
                : 'text-[#666666] hover:text-[#2B231D]'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" /> IG Story (9:16)
          </button>
          <button
            type="button"
            onClick={() => setFormat('card')}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              format === 'card'
                ? 'bg-white text-[#2B231D] shadow-xs'
                : 'text-[#666666] hover:text-[#2B231D]'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" /> Business Card
          </button>
        </div>

        {/* ── PRINTABLE / SHAREABLE CANVAS ── */}
        <div className="flex justify-center mb-4 max-h-[460px] overflow-y-auto p-1">
          {/* FORMAT 1: FLYER / POSTER */}
          {format === 'flyer' && (
            <div
              ref={posterRef}
              className="bg-white rounded-3xl p-6 border border-[#E8DDD4] shadow-sm w-full max-w-[360px] text-center space-y-3.5 relative overflow-hidden"
              style={{
                backgroundImage: 'radial-gradient(circle at 90% 10%, rgba(245, 158, 11, 0.05) 0%, transparent 60%), radial-gradient(circle at 10% 90%, rgba(139, 94, 60, 0.04) 0%, transparent 60%)',
              }}
            >
              {/* Lumo Bites Logo & Header */}
              <div className="flex flex-col items-center">
                <img
                  src="/lumo-bites-logo.png"
                  alt="Lumo Bites"
                  className="h-9 object-contain mb-2"
                  crossOrigin="anonymous"
                />
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-[#8B5E3C] border border-amber-200 mb-1.5">
                  <Sparkles className="w-3 h-3 text-[#8B5E3C]" /> Trusted Local Pet Care
                </span>
                <h2 className="text-xl font-black text-[#2B231D] tracking-tight leading-snug">
                  Need loving pet care in your neighborhood?
                </h2>
              </div>

              {/* Sitter Profile Snapshot Card */}
              <div className="bg-[#FAF6F4] rounded-2xl p-3.5 border border-[#E8DDD4] flex items-center gap-3 text-left shadow-2xs">
                <div className="w-13 h-13 rounded-full overflow-hidden border-2 border-[#8B5E3C]/30 shrink-0 bg-amber-100 flex items-center justify-center">
                  {sitter.photo || sitter.avatar_url ? (
                    <img
                      src={sitter.photo || sitter.avatar_url}
                      alt={displayName}
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <span className="text-lg font-black text-[#8B5E3C]">
                      {displayName.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-extrabold text-[#2B231D] text-base truncate leading-tight">
                    {displayName}
                  </h4>
                  <div className="flex items-center gap-1 text-xs text-[#555555] mt-0.5">
                    <MapPin className="w-3 h-3 text-[#8B5E3C] shrink-0" />
                    <span className="truncate">{displayLocation}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded-md">
                      <ShieldCheck className="w-2.5 h-2.5 text-emerald-700" /> Verified Sitter
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded-md">
                      <Star className="w-2.5 h-2.5 text-amber-600 fill-amber-600" /> {sitter.rating || '5.0'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Services Line */}
              <div className="text-[11px] font-semibold text-[#666666] bg-[#FAF6F4]/60 py-1.5 px-2.5 rounded-xl border border-[#E8DDD4]/60">
                🐾 {displayServices}
              </div>

              {/* Visual Mascot & QR Code Grid */}
              <div className="grid grid-cols-2 gap-2.5 items-center pt-0.5">
                <div className="bg-gradient-to-b from-amber-50 to-white rounded-2xl p-3 border border-amber-200/60 flex flex-col items-center justify-center text-center space-y-1.5 h-full">
                  <div className="flex items-center justify-center gap-1">
                    <div className="w-8 h-8 rounded-full bg-amber-100 text-[#8B5E3C] flex items-center justify-center shadow-xs">
                      <Dog className="w-4 h-4 text-[#8B5E3C]" />
                    </div>
                    <div className="w-8 h-8 rounded-full bg-amber-100 text-[#8B5E3C] flex items-center justify-center shadow-xs">
                      <Cat className="w-4 h-4 text-[#8B5E3C]" />
                    </div>
                  </div>
                  <p className="text-[10px] font-bold text-[#4A3E3D] leading-tight mt-1">
                    Direct Booking & Real-Time Updates
                  </p>
                </div>

                <div className="bg-white rounded-2xl p-2.5 border border-[#E8DDD4] shadow-xs flex flex-col items-center">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt={`QR Code for ${displayName}`}
                      className="w-22 h-22 rounded-lg object-contain"
                    />
                  ) : (
                    <div className="w-22 h-22 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                      <Loader2 className="w-4 h-4 animate-spin text-[#8B5E3C]" />
                    </div>
                  )}
                  <span className="text-[9px] font-extrabold text-[#8B5E3C] uppercase tracking-wider mt-1">
                    Scan to Book Me
                  </span>
                </div>
              </div>

              {/* Direct Link & Footer */}
              <div className="pt-1 space-y-1 border-t border-[#E8DDD4]/60">
                <p className="text-[10.5px] font-bold text-[#8B5E3C] tracking-wide">
                  lumobites.net/petsitting?sitter={sitter.id ? sitter.id.substring(0, 8) : 'id'}
                </p>
              </div>
            </div>
          )}

          {/* FORMAT 2: INSTAGRAM STORY (9:16) */}
          {format === 'story' && (
            <div
              ref={posterRef}
              className="bg-white rounded-3xl p-6 border border-[#E8DDD4] shadow-sm w-full max-w-[320px] text-center flex flex-col justify-between space-y-4 relative overflow-hidden"
              style={{
                aspectRatio: '9/16',
                backgroundImage: 'radial-gradient(circle at 50% 10%, rgba(245, 158, 11, 0.08) 0%, transparent 60%), radial-gradient(circle at 50% 90%, rgba(139, 94, 60, 0.06) 0%, transparent 60%)',
              }}
            >
              {/* Top Logo & Title */}
              <div className="flex flex-col items-center pt-2">
                <img
                  src="/lumo-bites-logo.png"
                  alt="Lumo Bites"
                  className="h-10 object-contain mb-2"
                  crossOrigin="anonymous"
                />
                <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-[#8B5E3C] border border-amber-200 mb-2">
                  <Sparkles className="w-3 h-3 text-[#8B5E3C]" /> Local Pet Sitter
                </span>
                <h2 className="text-xl font-black text-[#2B231D] tracking-tight leading-snug">
                  Need loving pet care in {displayLocation}?
                </h2>
              </div>

              {/* Sitter Avatar & Details */}
              <div className="bg-[#FAF6F4] rounded-2xl p-4 border border-[#E8DDD4] text-center space-y-2 shadow-2xs">
                <div className="w-18 h-18 rounded-full overflow-hidden border-2 border-[#8B5E3C] mx-auto bg-amber-100 flex items-center justify-center shadow-xs">
                  {sitter.photo || sitter.avatar_url ? (
                    <img
                      src={sitter.photo || sitter.avatar_url}
                      alt={displayName}
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <span className="text-2xl font-black text-[#8B5E3C]">
                      {displayName.charAt(0)}
                    </span>
                  )}
                </div>
                <h3 className="font-extrabold text-[#2B231D] text-lg leading-tight">
                  {displayName}
                </h3>
                <div className="flex items-center justify-center gap-1 text-xs text-[#555555]">
                  <MapPin className="w-3.5 h-3.5 text-[#8B5E3C]" />
                  <span>{displayLocation}</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                    <ShieldCheck className="w-3 h-3 text-emerald-700" /> Verified Sitter
                  </span>
                  <span className="inline-flex items-center gap-0.5 text-[10.5px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md">
                    <Star className="w-3 h-3 text-amber-600 fill-amber-600" /> {sitter.rating || '5.0'}
                  </span>
                </div>
                <p className="text-[11px] font-medium text-[#666666] pt-1">
                  🐾 {displayServices}
                </p>
              </div>

              {/* Big QR Code Section */}
              <div className="bg-white rounded-2xl p-4 border border-[#E8DDD4] shadow-xs flex flex-col items-center space-y-1.5">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`QR Code for ${displayName}`}
                    className="w-28 h-28 rounded-lg object-contain"
                  />
                ) : (
                  <div className="w-28 h-28 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin text-[#8B5E3C]" />
                  </div>
                )}
                <span className="text-[10px] font-black text-[#8B5E3C] uppercase tracking-wider">
                  Scan to View Profile & Book
                </span>
                <span className="text-[9px] text-[#888888]">
                  lumobites.net/petsitting
                </span>
              </div>

              {/* Bottom Tagline */}
              <div className="pb-2 text-[10px] font-bold text-[#8B7E7D] uppercase tracking-wider">
                🐾 Book direct with 0% hassle
              </div>
            </div>
          )}

          {/* FORMAT 3: BUSINESS CARD (HORIZONTAL 3:2) */}
          {format === 'card' && (
            <div
              ref={posterRef}
              className="bg-white rounded-2xl p-5 border border-[#E8DDD4] shadow-sm w-full max-w-[420px] text-left relative overflow-hidden flex gap-4 items-center"
              style={{
                aspectRatio: '1.6/1',
                backgroundImage: 'radial-gradient(circle at 10% 10%, rgba(245, 158, 11, 0.06) 0%, transparent 70%)',
              }}
            >
              {/* Left Column (Details) */}
              <div className="flex-1 space-y-2">
                <img
                  src="/lumo-bites-logo.png"
                  alt="Lumo Bites"
                  className="h-6 object-contain"
                  crossOrigin="anonymous"
                />
                <div className="flex items-center gap-2.5 pt-1">
                  <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-[#8B5E3C]/30 shrink-0 bg-amber-100 flex items-center justify-center">
                    {sitter.photo || sitter.avatar_url ? (
                      <img
                        src={sitter.photo || sitter.avatar_url}
                        alt={displayName}
                        className="w-full h-full object-cover"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <span className="text-base font-black text-[#8B5E3C]">
                        {displayName.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-[#2B231D] text-sm truncate leading-tight">
                      {displayName}
                    </h4>
                    <p className="text-[10px] text-[#555555] flex items-center gap-1 mt-0.5">
                      <MapPin className="w-2.5 h-2.5 text-[#8B5E3C]" /> {displayLocation}
                    </p>
                  </div>
                </div>

                <div className="text-[9.5px] font-semibold text-[#666666] leading-tight">
                  🐾 {displayServices}
                </div>

                <div className="flex items-center gap-1.5 pt-0.5">
                  <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                    🛡️ Verified Sitter
                  </span>
                  <span className="text-[9px] font-bold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded">
                    ⭐ {sitter.rating || '5.0'}
                  </span>
                </div>
              </div>

              {/* Right Column (QR Code) */}
              <div className="bg-[#FAF6F4] p-2.5 rounded-xl border border-[#E8DDD4] text-center flex flex-col items-center justify-center shrink-0">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`QR Code for ${displayName}`}
                    className="w-20 h-20 rounded-md object-contain bg-white p-1"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-100 rounded-md flex items-center justify-center text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin text-[#8B5E3C]" />
                  </div>
                )}
                <span className="text-[8px] font-black text-[#8B5E3C] uppercase tracking-wider mt-1">
                  Scan to Book
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── ACTION BUTTONS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-[#E8DDD4] mt-2">
          <button
            type="button"
            onClick={handleDownloadImage}
            disabled={isGeneratingDownload || !qrDataUrl}
            className="w-full bg-[#8B5E3C] hover:bg-[#734A2E] disabled:bg-gray-300 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            {isGeneratingDownload ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" /> Download ({format.toUpperCase()})
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleCopyLink}
            className="w-full bg-white hover:bg-[#FAF6F4] text-[#4A3E3D] border border-[#E8DDD4] font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" /> Link Copied!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-gray-500" /> Copy Profile Link
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="w-full bg-white hover:bg-[#FAF6F4] text-[#8B5E3C] border border-[#8B5E3C]/30 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" /> Share Poster
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
