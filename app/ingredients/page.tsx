'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { PawPrint, Search, AlertTriangle, Leaf, Sparkles, Share2, ShieldCheck } from 'lucide-react';
import { getSignedInUserEmail } from '@/lib/authHelper';
import AiLimitModal from '@/components/AiLimitModal';

export default function IngredientsPage() {
  const [ingredientsText, setIngredientsText] = useState('');
  const [petType, setPetType] = useState<'dog' | 'cat'>('dog');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAiLimitModalOpen, setIsAiLimitModalOpen] = useState(false);
  const [aiLimitReason, setAiLimitReason] = useState<string | null>(null);
  const [results, setResults] = useState<{
    grade: string;
    dangerous: { name: string; reason: string }[];
    concerning: { name: string; reason: string }[];
    safe: { name: string }[];
    summary: string;
  } | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return '#10B981';
      case 'B': return '#84CC16';
      case 'C': return '#F59E0B';
      case 'D': return '#F97316';
      case 'F': return '#EF4444';
      default: return '#8B5E3C';
    }
  };

  const checkIngredients = async () => {
    if (!ingredientsText.trim()) return;

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const userEmail = getSignedInUserEmail();
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients: ingredientsText, email: userEmail })
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429 || data.error?.toLowerCase().includes('limit') || data.error?.toLowerCase().includes('sign in') || data.error?.toLowerCase().includes('checks')) {
          setAiLimitReason(data.error || 'Limit reached');
          setIsAiLimitModalOpen(true);
          return;
        }
        throw new Error(data.error || 'Failed to analyze ingredients');
      }

      setResults({
        grade: data.grade || 'C',
        dangerous: data.dangerous || [],
        concerning: data.concerning || [],
        safe: data.safe || [],
        summary: data.summary || ''
      });

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error analyzing ingredients with Claude AI.');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    if (!results) return;
    const text = `My pet's food received a grade of ${results.grade} on Lumo Bites Ingredient Checker! 🐾 Check your pet's food at lumobites.net`;
    if (navigator.share) {
      navigator.share({ title: 'Lumo Bites Ingredient Checker', text, url: 'https://lumobites.net/ingredients' });
    } else {
      navigator.clipboard.writeText(text);
      alert('Result copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFAF7] pb-24">
      {/* NAVBAR */}
      
      <main className="max-w-[800px] mx-auto px-6 pt-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-[#191919] mb-4 tracking-tight">Ingredient Danger Checker</h1>
          <p className="text-lg text-gray-600 max-w-[600px] mx-auto">
            Paste your pet's food ingredient list below to check for dangerous chemicals, fillers, and toxins.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-xl shadow-[#8B5E3C]/5 border border-[#F0E6DD]">
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">1. Select Pet Type</label>
            <div className="flex gap-4">
              <button 
                onClick={() => setPetType('dog')}
                className={`flex-1 py-4 rounded-2xl border-2 transition-all font-bold flex items-center justify-center gap-2 ${petType === 'dog' ? 'border-[#8B5E3C] bg-[#8B5E3C]/5 text-[#8B5E3C]' : 'border-gray-100 text-gray-400'}`}
              >
                <PawPrint className="w-4 h-4 shrink-0" /> Dog
              </button>
              <button 
                onClick={() => setPetType('cat')}
                className={`flex-1 py-4 rounded-2xl border-2 transition-all font-bold flex items-center justify-center gap-2 ${petType === 'cat' ? 'border-[#8B5E3C] bg-[#8B5E3C]/5 text-[#8B5E3C]' : 'border-gray-100 text-gray-400'}`}
              >
                <PawPrint className="w-4 h-4 shrink-0" /> Cat
              </button>
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">2. Paste Ingredient List</label>
            <textarea 
              value={ingredientsText}
              onChange={(e) => setIngredientsText(e.target.value)}
              placeholder="Chicken, Sweet Potato, Corn Syrup, BHA, ..."
              className="w-full h-48 bg-[#F9F9F9] border border-gray-200 rounded-2xl p-6 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/20 focus:border-[#8B5E3C] transition-all resize-none"
            />
          </div>

          <button 
            onClick={checkIngredients}
            disabled={!ingredientsText.trim() || loading}
            className="w-full bg-[#8B5E3C] text-white py-5 rounded-2xl font-black text-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-[#8B5E3C]/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2.5"
          >
            {loading ? (
              <>
                <Search className="w-5 h-5 animate-spin" /> Analyzing with AI...
              </>
            ) : (
              "Check Ingredients Now →"
            )}
          </button>
        </div>

        {/* LOADING INDICATOR */}
        {loading && (
          <div className="mt-12 bg-white rounded-3xl p-12 border border-[#F0E6DD] text-center flex flex-col items-center justify-center shadow-xl shadow-[#8B5E3C]/5 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="w-16 h-16 border-4 border-[#E8DDD4] border-t-[#8B5E3C] rounded-full animate-spin mb-6"></div>
            <h3 className="text-[#191919] font-bold text-lg mb-2 flex items-center justify-center gap-1.5">
              <Search className="w-5 h-5 animate-spin text-[#8B5E3C]" /> Analyzing ingredients with AI...
            </h3>
            <p className="text-gray-500 text-sm max-w-[280px] mx-auto leading-relaxed">
              Claude AI is evaluating ingredient safety against veterinary & FDA guidelines.
            </p>
          </div>
        )}

        {/* ERROR SCREEN */}
        {error && (
          <div className="mt-12 bg-red-50 border border-red-100 text-red-600 p-8 rounded-3xl text-sm text-center shadow-3xs">
            <p className="font-bold mb-2 uppercase text-xs tracking-widest">Analysis Failed</p>
            <p className="opacity-80">{error}</p>
          </div>
        )}

        {/* RESULTS */}
        {results && (
          <div ref={resultsRef} className="mt-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-[#F0E6DD]">
              <div className="p-8 text-center border-b border-gray-100 flex flex-col items-center">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Overall Safety Grade</p>
                <div 
                  className="w-20 h-20 rounded-full flex items-center justify-center text-4xl font-black text-white shadow-lg transition-transform hover:scale-105 mb-4"
                  style={{ backgroundColor: getGradeColor(results.grade) }}
                >
                  {results.grade}
                </div>
                <div className="bg-[#F8F6F4] p-4.5 rounded-2xl border border-gray-100/80 shadow-3xs max-w-xl w-full">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">AI Safety Analysis Summary</span>
                  <p className="text-sm text-gray-700 font-bold leading-normal">
                    {results.summary}
                  </p>
                </div>
              </div>

              <div className="p-8 text-left">
                <h3 className="font-black text-[#191919] text-xl mb-6 text-center">Detailed Analysis Breakdown</h3>
                
                <div className="space-y-6">
                  {/* 🔴 Dangerous Ingredients */}
                  {results.dangerous.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-red-600 uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" /> Dangerous Ingredients ({results.dangerous.length})
                      </h4>
                      <div className="space-y-1.5">
                        {results.dangerous.map((item, i) => (
                          <div key={i} className="p-3.5 bg-red-50/70 border border-red-100/50 rounded-xl text-xs flex flex-col gap-1 shadow-3xs">
                            <span className="font-extrabold text-red-950 uppercase">{item.name}</span>
                            <p className="text-red-800 leading-relaxed font-medium">{item.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 🟡 Concerning Ingredients */}
                  {results.concerning.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" /> Concerning Ingredients ({results.concerning.length})
                      </h4>
                      <div className="space-y-1.5">
                        {results.concerning.map((item, i) => (
                          <div key={i} className="p-3.5 bg-amber-50/70 border border-amber-100/50 rounded-xl text-xs flex flex-col gap-1 shadow-3xs">
                            <span className="font-extrabold text-amber-950 uppercase">{item.name}</span>
                            <p className="text-amber-800 leading-relaxed font-medium">{item.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 🟢 Safe Ingredients */}
                  {results.safe.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
                        <Leaf className="w-4 h-4 text-emerald-600 shrink-0" /> Safe & Beneficial ({results.safe.length})
                      </h4>
                      <div className="flex flex-wrap gap-1.5 p-3 bg-emerald-50/30 border border-emerald-100/30 rounded-xl max-h-40 overflow-y-auto">
                        {results.safe.map((item, i) => (
                          <span key={i} className="px-2.5 py-1 bg-white text-emerald-800 border border-emerald-100/50 rounded-lg text-[10px] font-bold shadow-3xs">
                            ✓ {item.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Perfect Score State */}
                  {results.dangerous.length === 0 && results.concerning.length === 0 && (
                    <div className="bg-emerald-50/60 border border-emerald-100/50 text-emerald-800 p-5 rounded-2xl text-center shadow-3xs">
                      <p className="font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-emerald-600 inline" /> Excellent Ingredient Quality!
                      </p>
                      <p className="text-xs text-emerald-700 mt-1 leading-normal">Claude AI did not identify any dangerous or concerning ingredients in this recipe.</p>
                    </div>
                  )}
                </div>

                <div className="mt-8 flex flex-col md:flex-row gap-4">
                  <button 
                    onClick={handleShare}
                    className="flex-1 bg-white border-2 border-gray-150 text-[#191919] py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:border-[#8B5E3C]/20 transition-all cursor-pointer"
                  >
                    <Share2 className="w-4 h-4 shrink-0" /> Share Result
                  </button>
                  <Link 
                    href={`/chat?issues=${[...results.dangerous, ...results.concerning].map(item => item.name).join(',')}`}
                    className="flex-1 bg-[#8B5E3C] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-all text-center"
                    style={{ textDecoration: 'none' }}
                  >
                    <ShieldCheck className="w-4 h-4 shrink-0" /> Find Safer Alternatives
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-8 bg-[#F9F9F9] p-6 rounded-2xl border border-gray-200">
              <p className="text-[11px] text-gray-400 leading-relaxed text-center uppercase font-bold tracking-widest italic">
                This tool is for informational purposes only based on FDA and ASPCA guidelines. Always consult your veterinarian before changing your pet's diet.
              </p>
            </div>
          </div>
        )}

        <AiLimitModal
          isOpen={isAiLimitModalOpen}
          onClose={() => setIsAiLimitModalOpen(false)}
          reason={aiLimitReason}
        />
      </main>

      {/* FOOTER */}
      <footer className="mt-24 bg-[#191919] py-16 px-6 text-center text-white">
        <Link href="/" style={{ textDecoration: 'none' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <img src="/Logo.png" alt="Lumo Bites" className="h-12 invert brightness-0" />
            <sup style={{ fontSize: '10px', color: '#8B5A2B', fontWeight: 'bold', alignSelf: 'flex-start', marginTop: '8px', marginLeft: '2px', fontFamily: 'sans-serif', userSelect: 'none' }}>™</sup>
          </div>
        </Link>
        <p className="text-gray-500 text-sm mb-6 mt-6">&copy; {new Date().getFullYear()} Premier Pet Nutrition LLC. Every pet deserves safe food.</p>
        <div className="flex flex-wrap justify-center gap-6 text-sm font-bold text-gray-400">
          <Link href="/scan" className="hover:text-white transition-colors">Is My Pet&apos;s Food Safe?</Link>
          <Link href="/recalls" className="hover:text-white transition-colors">Recall Alerts</Link>
          <Link href="/chat" className="hover:text-white transition-colors">Find Food</Link>
          <Link href="/affiliate" className="hidden hover:text-white transition-colors">Affiliate Program</Link>
        </div>
      </footer>
    </div>
  );
}
