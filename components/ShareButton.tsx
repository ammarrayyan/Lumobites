'use client';

import { useState, useRef, useEffect } from 'react';
import { Check, X, Share2, MessageCircle, Mail, Globe, Copy } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

export default function ShareButton() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareText, setShareText] = useState("Check out Lumo Bites — free AI-powered pet care app! 🐾\n\n🌐 https://lumobites.net");

  // Detect platform and set appropriate share message
  useEffect(() => {
    const platform = Capacitor.getPlatform(); // 'ios', 'android', or 'web'
    const text = platform === 'ios'
      ? `Check out Lumo Bites — free AI-powered pet care app! 🐾\n\n📱 Download on App Store:\nhttps://apps.apple.com/app/lumo-bites/id6780612179\n\n🌐 https://lumobites.net`
      : `Check out Lumo Bites — free AI-powered pet care app! 🐾\n\n📱 iPhone: https://apps.apple.com/app/lumo-bites/id6780612179\n📱 Android: https://play.google.com/store/apps/details?id=net.lumobites.app\n\n🌐 https://lumobites.net`;
    setShareText(text);
  }, []);

  const handleShareClick = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Lumo Bites 🐾',
          text: shareText,
          url: 'https://lumobites.net',
        });
        return;
      } catch (err) {
        // User aborted or unsupported; fallback to modal
        if ((err as Error).name !== 'AbortError') {
          setOpen(true);
        }
        return;
      }
    }
    setOpen(true);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => { setCopied(false); }, 2200);
    } catch {
      const el = document.createElement('textarea');
      el.value = shareText;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => { setCopied(false); }, 2200);
    }
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://lumobites.net')}&quote=${encodeURIComponent(shareText)}`, '_blank');
  };

  const shareTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const shareSMS = () => {
    window.open(`sms:?body=${encodeURIComponent(shareText)}`, '_self');
  };

  const shareEmail = () => {
    window.open(`mailto:?subject=${encodeURIComponent('Check out Lumo Bites 🐾')}&body=${encodeURIComponent(shareText)}`, '_self');
  };

  return (
    <>
      {/* Share icon button */}
      <button
        onClick={handleShareClick}
        aria-label="Share Lumo Bites"
        className="w-9 h-9 rounded-full border border-[#E6DFD9] bg-white flex items-center justify-center text-[#8B5E3C] hover:bg-[#FAF8F5] hover:border-[#D6CDC2] transition-transform active:scale-95 shadow-xs cursor-pointer"
      >
        <Share2 size={18} strokeWidth={2.2} />
      </button>

      {/* Full-Featured Centered Share Modal */}
      {open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#E8DDD4] p-6 text-left flex flex-col gap-4 animate-scale-up">
            {/* Header with Close Button */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  Share Lumo Bites <span className="text-base">🐾</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Help fellow pet parents keep their pets healthy & safe
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors cursor-pointer border-none"
              >
                <X size={18} />
              </button>
            </div>

            {/* 1-Click Copy Link Box */}
            <div className="flex items-center gap-2 p-2 bg-[#FAF6F4] border border-[#E8DDD4] rounded-2xl">
              <input
                type="text"
                readOnly
                value="https://lumobites.net"
                className="flex-1 bg-transparent px-3 py-1.5 text-xs text-gray-700 font-medium border-none outline-hidden select-all"
              />
              <button
                onClick={copyLink}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border-none shadow-xs ${
                  copied
                    ? 'bg-green-600 text-white'
                    : 'bg-[#8B5E3C] hover:bg-[#734A2E] text-white'
                }`}
              >
                {copied ? (
                  <>
                    <Check size={14} /> Copied!
                  </>
                ) : (
                  <>
                    <Copy size={14} /> Copy
                  </>
                )}
              </button>
            </div>

            {/* Direct Channel Grid */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={shareWhatsApp}
                className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 border border-emerald-200 font-semibold text-xs transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <MessageCircle size={18} />
                </div>
                <span>WhatsApp</span>
              </button>

              <button
                onClick={shareSMS}
                className="flex items-center gap-3 p-3 rounded-2xl bg-sky-50 hover:bg-sky-100/80 text-sky-800 border border-sky-200 font-semibold text-xs transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0">
                  <MessageCircle size={18} />
                </div>
                <span>Messages / SMS</span>
              </button>

              <button
                onClick={shareFacebook}
                className="flex items-center gap-3 p-3 rounded-2xl bg-blue-50 hover:bg-blue-100/80 text-blue-800 border border-blue-200 font-semibold text-xs transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <Globe size={18} />
                </div>
                <span>Facebook</span>
              </button>

              <button
                onClick={shareTwitter}
                className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 text-gray-800 border border-gray-200 font-semibold text-xs transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center shrink-0 font-bold text-xs">
                  𝕏
                </div>
                <span>Twitter / 𝕏</span>
              </button>
            </div>

            {/* Email Share Option */}
            <button
              onClick={shareEmail}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold text-xs border border-gray-200 transition-colors cursor-pointer"
            >
              <Mail size={15} /> Send via Email
            </button>
          </div>
        </div>
      )}
    </>
  );
}
