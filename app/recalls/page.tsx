'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import AmazonProductCard, { AmazonProductCardSkeleton, AmazonProduct } from '@/components/AmazonProductCard';


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
  if (cls.includes('I') && !cls.includes('II') && !cls.includes('III'))
    return { bg: '#FEE2E2', text: '#991B1B', label: 'Class I — High Risk' };
  if (cls.includes('II') && !cls.includes('III'))
    return { bg: '#FEF9C3', text: '#854D0E', label: 'Class II — Moderate Risk' };
  return { bg: '#DCFCE7', text: '#166534', label: 'Class III — Low Risk' };
}

function formatDate(raw: string) {
  if (!raw || raw.length < 8) return raw;
  const y = raw.slice(0, 4), m = raw.slice(4, 6), d = raw.slice(6, 8);
  return new Date(`${y}-${m}-${d}`).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

function isActive(r: Recall) {
  const s = (r.status || '').toLowerCase();
  return s === 'ongoing' || s === 'in-progress' || s === 'open';
}

function petTypeMatch(r: Recall, filter: string) {
  if (filter === 'all') return true;
  const text = `${r.product} ${r.reason}`.toLowerCase();
  if (filter === 'dogs') return text.includes('dog') || text.includes('canine') || !text.includes('cat');
  if (filter === 'cats') return text.includes('cat') || text.includes('feline');
  return true;
}

function ShareRecallButton({ recall }: { recall: Recall }) {
  const [open, setOpen] = useState(false);
  const msg = `⚠️ Pet food recall alert: ${recall.product} by ${recall.firm}. Reason: ${recall.reason} — Check lumobites.net/recalls for details`;
  const url = 'https://lumobites.net/recalls';

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          fontSize: '12px', fontWeight: 600, color: '#8B5E3C',
          background: '#F5EDE4', border: '1.5px solid #E8D5C0',
          borderRadius: '100px', padding: '6px 14px', cursor: 'pointer',
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
        </svg>
        Share recall
      </button>
      {open && (
        <div style={{
          position: 'absolute', bottom: '40px', left: 0,
          background: '#fff', borderRadius: '16px', border: '1px solid #E8DDD4',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)', padding: '14px',
          minWidth: '200px', zIndex: 50,
        }}
          onMouseLeave={() => setOpen(false)}
        >
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#191919', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Warn others</p>
          <button
            onClick={() => { window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank'); setOpen(false); }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 10px', borderRadius: '10px', background: '#F0FDF4', border: '1px solid #DCF8C6', color: '#166534', fontWeight: 600, fontSize: '12px', cursor: 'pointer', marginBottom: '6px' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.122.553 4.109 1.517 5.838L0 24l6.335-1.482A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.6a9.6 9.6 0 01-4.9-1.35l-.35-.21-3.659.858.875-3.56-.23-.368A9.6 9.6 0 1112 21.6z"/></svg>
            WhatsApp
          </button>
          <button
            onClick={() => { window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(msg)}`, '_blank'); setOpen(false); }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 10px', borderRadius: '10px', background: '#EFF6FF', border: '1px solid #DBEAFE', color: '#1D4ED8', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.269h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg>
            Facebook
          </button>
        </div>
      )}
    </div>
  );
}

function RecallCard({ r }: { r: Recall }) {
  const cls = classificationColor(r.classification);
  return (
    <div className="bg-white rounded-[20px] p-6 shadow-[0_2px_16px_rgba(0,0,0,0.06)] border border-[#F0E8E0] hover:shadow-[0_4px_24px_rgba(0,0,0,0.1)] transition-all">
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
          <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${isActive(r) ? 'bg-[#FEE2E2] text-[#991B1B]' : 'bg-[#F3F4F6] text-[#6B7280]'}`}>
            {r.status}
          </span>
        </div>
      </div>

      <div className="bg-[#FDFAF7] rounded-[12px] p-4 mb-4">
        <p className="text-[12px] font-bold text-[#9A7760] uppercase tracking-[0.08em] mb-1">Reason for Recall</p>
        <p className="text-[#444] text-sm leading-relaxed">{r.reason}</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-4 text-[12px] text-[#999]">
          {r.date && <span className="flex items-center gap-1"><span>📅</span>{formatDate(r.date)}</span>}
          {r.state && <span className="flex items-center gap-1"><span>📍</span>{r.state}</span>}
          {r.voluntary && <span className="flex items-center gap-1"><span>📋</span>{r.voluntary}</span>}
        </div>
        <ShareRecallButton recall={r} />
      </div>

      {/* ── Safe Alternatives from Amazon ── */}
      <AmazonSafeAlternatives recall={r} />
    </div>
  );
}

export default function RecallsPage() {
  const [recalls, setRecalls] = useState<Recall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [source, setSource] = useState<'live' | 'historical'>('live');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [subError, setSubError] = useState('');
  const [petFilter, setPetFilter] = useState<'all' | 'dogs' | 'cats'>('all');
  const [search, setSearch] = useState('');
  const [showHistorical, setShowHistorical] = useState(false);
  const [checkedAt, setCheckedAt] = useState('');

  useEffect(() => {
    const now = new Date();
    setCheckedAt(now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }));
    fetch('/api/recalls')
      .then(r => r.json())
      .then(data => {
        setRecalls(data.results || []);
        setSource(data.source || 'live');
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
      if (res.ok && data.success) setSubscribed(true);
      else setSubError(data.error || 'Something went wrong. Please try again.');
    } catch {
      setSubError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // Split active vs historical
  const activeRecalls = useMemo(() => recalls.filter(isActive), [recalls]);
  const historicalRecalls = useMemo(() => recalls.filter(r => !isActive(r)), [recalls]);

  // Apply search + pet filter to active
  const filteredActive = useMemo(() => {
    return activeRecalls.filter(r => {
      const matchesPet = petTypeMatch(r, petFilter);
      const q = search.toLowerCase();
      const matchesSearch = !q || r.product.toLowerCase().includes(q) || r.firm.toLowerCase().includes(q) || r.reason.toLowerCase().includes(q);
      return matchesPet && matchesSearch;
    });
  }, [activeRecalls, petFilter, search]);

  const filteredHistorical = useMemo(() => {
    return historicalRecalls.filter(r => {
      const matchesPet = petTypeMatch(r, petFilter);
      const q = search.toLowerCase();
      const matchesSearch = !q || r.product.toLowerCase().includes(q) || r.firm.toLowerCase().includes(q) || r.reason.toLowerCase().includes(q);
      return matchesPet && matchesSearch;
    });
  }, [historicalRecalls, petFilter, search]);

  return (
    <div className="min-h-screen bg-[#FDFAF7]" style={{ fontFamily: 'Inter, -apple-system, sans-serif' }}>

      {/* NAV */}
      <Navbar />

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
          {!subscribed ? (
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-[480px] mx-auto">
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com" required
                className="flex-1 px-5 py-3 rounded-full border border-[#DDD] bg-white text-[#191919] text-base outline-none focus:border-[#C17D3C] focus:ring-2 focus:ring-[#C17D3C]/20 transition-all"
              />
              <button type="submit" disabled={submitting}
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

        {!loading && !error && (
          <>
            {/* ── Search + Filters ────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              {/* Search */}
              <div className="relative flex-1">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-[#BBB]" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search by brand or product…"
                  className="w-full pl-10 pr-4 py-2.5 rounded-full border border-[#E8DDD4] bg-white text-sm outline-none focus:border-[#C17D3C] focus:ring-2 focus:ring-[#C17D3C]/20 transition-all"
                />
              </div>
              {/* Pet type filter */}
              <div className="flex gap-2">
                {(['all', 'dogs', 'cats'] as const).map(f => (
                  <button key={f} onClick={() => setPetFilter(f)}
                    style={{
                      padding: '8px 18px', borderRadius: '100px', fontSize: '13px', fontWeight: 600,
                      cursor: 'pointer', transition: 'all 0.15s',
                      background: petFilter === f ? '#8B5E3C' : '#FFFFFF',
                      color: petFilter === f ? '#FFFFFF' : '#8B5E3C',
                      border: `1.5px solid ${petFilter === f ? '#8B5E3C' : '#E8D5C0'}`,
                    }}
                  >
                    {f === 'all' ? 'All' : f === 'dogs' ? '🐕 Dogs' : '🐈 Cats'}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Last checked ─────────────────────────────────────────── */}
            {checkedAt && (
              <div className="flex items-center gap-2 mb-6">
                <span className="w-2 h-2 bg-[#22C55E] rounded-full" style={{ animation: 'pulse 2s infinite' }}></span>
                <span className="text-xs text-[#666] font-medium">Last checked: Today at {checkedAt} · Source: FDA Enforcement Database</span>
              </div>
            )}

            {/* ── ACTIVE RECALLS ─────────────────────────────────────── */}
            {filteredActive.length === 0 ? (
              <div className="bg-[#DCFCE7] border border-[#86EFAC] rounded-[20px] p-8 text-center mb-8">
                <div className="text-4xl mb-3">✅</div>
                <h3 className="font-[800] text-[#166534] text-xl mb-2">No Active Pet Food Recalls</h3>
                <p className="text-[#166534]/80 text-sm">
                  {search || petFilter !== 'all'
                    ? 'No active recalls match your current filters.'
                    : `The FDA currently has no ongoing pet food recall actions. Last checked: Today at ${checkedAt}`}
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-[800] text-[#191919] text-xl">
                    {filteredActive.length} Active {filteredActive.length === 1 ? 'Recall' : 'Recalls'}
                  </h2>
                </div>
                <div className="flex flex-col gap-5 mb-8">
                  {filteredActive.map(r => <RecallCard key={r.id} r={r} />)}
                </div>
              </>
            )}

            {/* ── HISTORICAL RECALLS (collapsed) ───────────────────────── */}
            {filteredHistorical.length > 0 && (
              <div className="border border-[#E8DDD4] rounded-[20px] overflow-hidden">
                <button
                  onClick={() => setShowHistorical(v => !v)}
                  className="w-full flex items-center justify-between px-6 py-4 bg-[#FDFAF7] hover:bg-[#F5EDE4] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">📋</span>
                    <div className="text-left">
                      <p className="font-[700] text-[#191919] text-sm">View Historical Recalls</p>
                      <p className="text-xs text-[#999]">{filteredHistorical.length} completed or terminated recalls</p>
                    </div>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="#8B5E3C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"
                    style={{ transform: showHistorical ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}
                  >
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                {showHistorical && (
                  <div className="flex flex-col gap-5 p-6 bg-white">
                    <p className="text-xs text-[#999] bg-[#F3F4F6] px-4 py-2 rounded-full text-center">
                      These recalls have been completed or terminated — products may have been removed from shelves.
                    </p>
                    {filteredHistorical.map(r => <RecallCard key={r.id} r={r} />)}
                  </div>
                )}
              </div>
            )}

            <p className="text-center text-[12px] text-[#BBB] mt-10">
              Data sourced from the{' '}
              <a href="https://open.fda.gov/apis/food/enforcement/" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#8B5E3C]">
                FDA OpenData Enforcement API
              </a>. Refreshed hourly.
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

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}

// ─── Amazon Safe Alternatives ─────────────────────────────────────────────────
function AmazonSafeAlternatives({ recall }: { recall: Recall }) {
  const [products, setProducts] = useState<AmazonProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const petType = useMemo(() => {
    const txt = `${recall.product} ${recall.reason}`.toLowerCase();
    if (txt.includes('cat') || txt.includes('feline')) return 'cat';
    return 'dog';
  }, [recall]);

  useEffect(() => {
    if (!expanded) return;
    let cancelled = false;
    setLoading(true);
    const query = `best safe premium ${petType} food grain free no recall`;
    fetch(`/api/amazon/search?q=${encodeURIComponent(query)}&limit=2`)
      .then(r => r.json())
      .then(d => { if (!cancelled) { setProducts(d.products ?? []); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [expanded, petType]);

  return (
    <div className="mt-4 pt-4 border-t border-[#F0E8E0]">
      {!expanded ? (
        <button
          onClick={() => setExpanded(true)}
          className="flex items-center gap-2 text-[12px] font-semibold text-[#166534] bg-[#DCFCE7] border border-[#86EFAC] px-4 py-2 rounded-full hover:bg-[#BBF7D0] transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          Safe alternatives →
        </button>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[12px] font-bold text-[#166534] uppercase tracking-wide">✅ Safe Alternatives</p>
            <span className="text-[9px] text-gray-400">Powered by Amazon</span>
          </div>
          {loading ? (
            <div className="flex flex-col gap-2">
              <AmazonProductCardSkeleton compact />
              <AmazonProductCardSkeleton compact />
            </div>
          ) : products.length > 0 ? (
            <div className="flex flex-col gap-2">
              {products.map(p => <AmazonProductCard key={p.asin} product={p} compact />)}
            </div>
          ) : (
            <a
              href={`https://www.amazon.com/s?k=${encodeURIComponent('safe premium ' + petType + ' food')}&tag=lumobites-20`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-[#FFD814] border border-[#FCD200] text-[#0F1111] font-bold text-xs px-4 py-2.5 rounded-lg hover:bg-[#F7CA00] transition-colors"
            >
              Browse safe {petType} food on Amazon →
            </a>
          )}
          <p className="text-[9px] text-gray-400 mt-2">
            Affiliate links support Lumo Bites at no extra cost to you.
          </p>
        </div>
      )}
    </div>
  );
}
