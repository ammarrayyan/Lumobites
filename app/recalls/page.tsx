'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Recall {
  id: string;
  product: string;
  reason: string;
  firm: string;
  date: string;
  status: string;
  classification: string;
  state: string;
  voluntary: string;
}

function classificationColor(cls: string) {
  if (cls.includes('I')) return { bg: '#FEE2E2', text: '#991B1B', label: 'Class I — High Risk' };
  if (cls.includes('II')) return { bg: '#FEF9C3', text: '#854D0E', label: 'Class II — Moderate Risk' };
  return { bg: '#DCFCE7', text: '#166534', label: 'Class III — Low Risk' };
}

function formatDate(raw: string) {
  if (!raw || raw.length < 8) return raw;
  const y = raw.slice(0, 4), m = raw.slice(4, 6), d = raw.slice(6, 8);
  return new Date(`${y}-${m}-${d}`).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

export default function RecallsPage() {
  const [recalls, setRecalls] = useState<Recall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [subError, setSubError] = useState('');

  useEffect(() => {
    fetch('/api/recalls')
      .then(r => r.json())
      .then(data => {
        setRecalls(data.results || []);
        setLoading(false);
      })
      .catch(() => {
        setError('Could not load recalls. Please try again later.');
        setLoading(false);
      });
  }, []);

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubError('');
    try {
      const res = await fetch('/api/recall-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, pet_type: 'all', product_names: [] }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSubscribed(true);
      } else {
        setSubError(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setSubError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FDFAF7]" style={{ fontFamily: 'Inter, -apple-system, sans-serif' }}>

      {/* NAV */}
      <nav className="bg-white border-b border-[#EEEEEE] px-6 md:px-12 flex items-center justify-between" style={{ height: '72px' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center' }}>
          <img src="/Logo.png" alt="Lumo Bites" style={{ height: '70px', width: 'auto', objectFit: 'contain', transform: 'scale(1.4)', transformOrigin: 'left center' }} />
        </Link>
        <Link href="/chat" style={{ fontSize: '14px', fontWeight: 600, color: '#8B5E3C', textDecoration: 'none', padding: '10px 22px', border: '1.5px solid #C17D3C', borderRadius: '100px' }}>
          Find My Pet&apos;s Food →
        </Link>
      </nav>

      {/* HERO */}
      <section className="w-full bg-gradient-to-br from-[#FDFAF7] to-[#F5EDE4] py-16 px-6 text-center border-b border-[#E8D5C0]">
        <div className="max-w-[680px] mx-auto">
          <div className="inline-flex items-center gap-2 bg-[#FEE2E2] text-[#991B1B] text-xs font-bold tracking-[0.1em] uppercase px-4 py-2 rounded-full mb-6">
            <span className="w-2 h-2 bg-[#EF4444] rounded-full" style={{ animation: 'pulse 2s infinite' }}></span>
            Live FDA Data
          </div>
          <h1 className="font-[800] text-[#191919] tracking-[-0.02em] leading-tight mb-4" style={{ fontSize: 'clamp(32px, 5vw, 52px)' }}>
            Pet Food Recall Alerts
          </h1>
          <p className="text-[18px] text-[#666] leading-[1.65] max-w-[500px] mx-auto mb-8">
            Live recalls sourced directly from the FDA. Updated hourly. Know what&apos;s in your pet&apos;s bowl.
          </p>
          {/* Inline subscribe */}
          {!subscribed ? (
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-[480px] mx-auto">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="flex-1 px-5 py-3 rounded-full border border-[#DDD] bg-white text-[#191919] text-base outline-none focus:border-[#C17D3C] focus:ring-2 focus:ring-[#C17D3C]/20 transition-all"
              />
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 rounded-full font-[700] text-white text-base transition-all"
                style={{ backgroundColor: '#8B5E3C', opacity: submitting ? 0.7 : 1, whiteSpace: 'nowrap' }}
              >
                {submitting ? 'Saving…' : '🔔 Get Alerts'}
              </button>
            </form>
          ) : (
            <div className="inline-flex items-center gap-2 bg-[#DCFCE7] text-[#166534] px-6 py-3 rounded-full font-[600] text-base">
              ✅ You&apos;re subscribed! We&apos;ll alert you of new recalls.
            </div>
          )}
          {subError && <p className="text-[#EF4444] text-sm mt-3">{subError}</p>}
        </div>
      </section>

      {/* RECALLS LIST */}
      <main className="max-w-[900px] mx-auto px-6 py-12">

        {loading && (
          <div className="flex flex-col items-center gap-4 py-20">
            <div className="w-10 h-10 border-2 border-[#E8DDD4] border-t-[#8B5E3C] rounded-full animate-spin"></div>
            <p className="text-[#999] text-sm">Fetching live FDA data…</p>
          </div>
        )}

        {error && !loading && (
          <div className="text-center py-16">
            <span className="text-4xl block mb-3">⚠️</span>
            <p className="text-[#666]">{error}</p>
          </div>
        )}

        {!loading && !error && recalls.length === 0 && (
          <div className="text-center py-16">
            <span className="text-4xl block mb-3">✅</span>
            <h3 className="font-bold text-[#191919] mb-2">No active recalls found</h3>
            <p className="text-[#666] text-sm">The FDA has no current pet food enforcement actions to display.</p>
          </div>
        )}

        {!loading && recalls.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-[800] text-[#191919] text-xl">
                {recalls.length} Active Recalls
              </h2>
              <span className="text-xs text-[#999] bg-white border border-[#EEE] px-3 py-1.5 rounded-full">
                Source: FDA Enforcement Database
              </span>
            </div>

            <div className="flex flex-col gap-5">
              {recalls.map((r) => {
                const cls = classificationColor(r.classification);
                return (
                  <div key={r.id} className="bg-white rounded-[20px] p-6 shadow-[0_2px_16px_rgba(0,0,0,0.06)] border border-[#F0E8E0] hover:shadow-[0_4px_24px_rgba(0,0,0,0.1)] transition-all">
                    {/* Header */}
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                      <div className="flex-1">
                        <h3 className="font-[700] text-[#191919] text-base leading-snug mb-1 line-clamp-2">{r.product}</h3>
                        <p className="text-[13px] text-[#9A7760] font-medium">{r.firm}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {r.classification && (
                          <span className="text-[11px] font-bold px-3 py-1 rounded-full" style={{ backgroundColor: cls.bg, color: cls.text }}>
                            {cls.label}
                          </span>
                        )}
                        <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${r.status === 'Ongoing' ? 'bg-[#FEE2E2] text-[#991B1B]' : 'bg-[#F3F4F6] text-[#6B7280]'}`}>
                          {r.status}
                        </span>
                      </div>
                    </div>

                    {/* Reason */}
                    <div className="bg-[#FDFAF7] rounded-[12px] p-4 mb-4">
                      <p className="text-[12px] font-bold text-[#9A7760] uppercase tracking-[0.08em] mb-1">Reason for Recall</p>
                      <p className="text-[#444] text-sm leading-relaxed">{r.reason}</p>
                    </div>

                    {/* Meta */}
                    <div className="flex flex-wrap gap-4 text-[12px] text-[#999]">
                      {r.date && (
                        <span className="flex items-center gap-1">
                          <span>📅</span> {formatDate(r.date)}
                        </span>
                      )}
                      {r.state && (
                        <span className="flex items-center gap-1">
                          <span>📍</span> {r.state}
                        </span>
                      )}
                      {r.voluntary && (
                        <span className="flex items-center gap-1">
                          <span>📋</span> {r.voluntary}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-center text-[12px] text-[#BBB] mt-10">
              Data sourced from the <a href="https://open.fda.gov/apis/food/enforcement/" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#8B5E3C]">FDA OpenData Enforcement API</a>. Refreshed hourly.
            </p>
          </>
        )}
      </main>

      {/* FOOTER CTA */}
      <section className="w-full bg-[#8B5E3C] py-16 px-6 text-center">
        <div className="max-w-[600px] mx-auto">
          <h2 className="font-[800] text-white mb-3" style={{ fontSize: 'clamp(22px, 3vw, 32px)' }}>
            Find the safest food for your pet
          </h2>
          <p className="text-white/80 text-base mb-8">Personalized picks from recalled-free brands, matched to your pet&apos;s exact needs.</p>
          <Link href="/chat" className="inline-flex items-center justify-center px-8 py-4 bg-white text-[#8B5E3C] font-[700] text-base rounded-full hover:shadow-lg transition-all">
            Find My Pet&apos;s Food →
          </Link>
        </div>
      </section>

    </div>
  );
}
