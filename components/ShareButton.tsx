'use client';

import { useState, useRef, useEffect } from 'react';
import { Check } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

export default function ShareButton() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareText, setShareText] = useState("Check out Lumo Bites — free AI-powered pet care app! 🐾\n\n🌐 https://lumobites.net");
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Detect platform and set appropriate share message
  useEffect(() => {
    const platform = Capacitor.getPlatform(); // 'ios', 'android', or 'web'
    const text = platform === 'ios'
      ? `Check out Lumo Bites — free AI-powered pet care app! 🐾\n\n📱 Download on App Store:\nhttps://apps.apple.com/app/lumo-bites/id6780612179\n\n🌐 https://lumobites.net`
      : `Check out Lumo Bites — free AI-powered pet care app! 🐾\n\n📱 iPhone: https://apps.apple.com/app/lumo-bites/id6780612179\n📱 Android: https://play.google.com/store/apps/details?id=net.lumobites.app\n\n🌐 https://lumobites.net`;
    setShareText(text);
  }, []);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => { setCopied(false); setOpen(false); }, 1800);
    } catch {
      // Fallback for Safari/older browsers
      const el = document.createElement('textarea');
      el.value = shareText;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => { setCopied(false); setOpen(false); }, 1800);
    }
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
    setOpen(false);
  };

  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://lumobites.net')}&quote=${encodeURIComponent(shareText)}`, '_blank');
    setOpen(false);
  };

  const shareSMS = () => {
    window.open(`sms:?body=${encodeURIComponent(shareText)}`, '_self');
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Share icon button */}
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Share Lumo Bites"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '36px', height: '36px', borderRadius: '50%',
          border: '1px solid #E6DFD9', backgroundColor: '#FFFFFF',
          cursor: 'pointer', color: '#8B5E3C', transition: 'all 0.2s',
          boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.backgroundColor = '#FAF8F5';
          e.currentTarget.style.borderColor = '#D6CDC2';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.backgroundColor = '#FFFFFF';
          e.currentTarget.style.borderColor = '#E6DFD9';
        }}
      >
        {/* Share icon */}
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div 
          className="absolute top-[52px] -right-[80px] sm:-right-[20px] md:right-0 bg-white rounded-[20px] border border-[#E8DDD4] shadow-[0_8px_32px_rgba(0,0,0,0.12)] p-4 sm:p-5 w-[260px] z-[100]"
          style={{ animation: 'fadeDown 0.15s ease-out' }}
        >
          <p style={{ fontSize: '13px', fontWeight: 800, color: '#191919', marginBottom: '4px' }}>Share Lumo Bites</p>
          <p style={{ fontSize: '11px', color: '#999', marginBottom: '16px', lineHeight: 1.4 }}>
            Help other pet owners keep their pets safe 🐾
          </p>

          {/* Copy Link */}
          <button onClick={copyLink} style={{
            display: 'flex', alignItems: 'center', gap: '12px', width: '100%',
            padding: '10px 12px', borderRadius: '12px', border: '1.5px solid #E8DDD4',
            backgroundColor: copied ? '#F0FDF4' : '#FDFAF7',
            color: copied ? '#166534' : '#191919',
            fontWeight: 600, fontSize: '13px', cursor: 'pointer',
            marginBottom: '8px', transition: 'all 0.2s',
          }}>
            {copied
              ? <Check className="w-4 h-4 text-green-600 shrink-0" />
              : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            }
            {copied ? 'Link copied!' : 'Copy Link'}
          </button>

          {/* WhatsApp */}
          <button onClick={shareWhatsApp} style={{
            display: 'flex', alignItems: 'center', gap: '12px', width: '100%',
            padding: '10px 12px', borderRadius: '12px', border: '1.5px solid #DCF8C6',
            backgroundColor: '#F0FDF4', color: '#166534',
            fontWeight: 600, fontSize: '13px', cursor: 'pointer',
            marginBottom: '8px', transition: 'all 0.2s',
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#25D366">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.122.553 4.109 1.517 5.838L0 24l6.335-1.482A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.6a9.6 9.6 0 01-4.9-1.35l-.35-.21-3.659.858.875-3.56-.23-.368A9.6 9.6 0 1112 21.6z"/>
            </svg>
            Share on WhatsApp
          </button>

          {/* Facebook */}
          <button onClick={shareFacebook} style={{
            display: 'flex', alignItems: 'center', gap: '12px', width: '100%',
            padding: '10px 12px', borderRadius: '12px', border: '1.5px solid #DBEAFE',
            backgroundColor: '#EFF6FF', color: '#1D4ED8',
            fontWeight: 600, fontSize: '13px', cursor: 'pointer',
            marginBottom: '8px', transition: 'all 0.2s',
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#1877F2">
              <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.269h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
            </svg>
            Share on Facebook
          </button>

          {/* SMS / Text */}
          <button onClick={shareSMS} style={{
            display: 'flex', alignItems: 'center', gap: '12px', width: '100%',
            padding: '10px 12px', borderRadius: '12px', border: '1.5px solid #E5E7EB',
            backgroundColor: '#F9FAFB', color: '#4B5563',
            fontWeight: 600, fontSize: '13px', cursor: 'pointer',
            transition: 'all 0.2s',
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            Share via Text
          </button>
        </div>
      )}

      <style>{`
        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
