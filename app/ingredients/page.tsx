'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { ingredientDatabase, IngredientInfo, IngredientCategory } from '@/lib/ingredients';

export default function IngredientsPage() {
  const [ingredientsText, setIngredientsText] = useState('');
  const [petType, setPetType] = useState<'dog' | 'cat'>('dog');
  const [results, setResults] = useState<{
    score: string;
    scoreColor: string;
    flagged: { info: IngredientInfo; match: string }[];
    counts: { dangerous: number; questionable: number; good: number; neutral: number };
  } | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const checkIngredients = () => {
    if (!ingredientsText.trim()) return;

    // Split ingredients by comma, semi-colon or new line
    const list = ingredientsText
      .split(/[,\n;]/)
      .map(i => i.trim())
      .filter(i => i.length > 0);

    const flagged: { info: IngredientInfo; match: string }[] = [];
    const counts = { dangerous: 0, questionable: 0, good: 0, neutral: 0 };
    const seen = new Set<string>();

    list.forEach(item => {
      const lowerItem = item.toLowerCase();
      
      // Find matching ingredient in database
      const match = ingredientDatabase.find(dbItem => 
        lowerItem.includes(dbItem.name.toLowerCase()) || 
        dbItem.name.toLowerCase().includes(lowerItem)
      );

      if (match && !seen.has(match.name)) {
        flagged.push({ info: match, match: item });
        counts[match.category]++;
        seen.add(match.name);
      }
    });

    // Scoring logic
    let score = 'A';
    let scoreColor = '#10B981'; // Green

    if (counts.dangerous >= 2) {
      score = 'F';
      scoreColor = '#EF4444'; // Red
    } else if (counts.dangerous === 1) {
      score = 'D';
      scoreColor = '#F97316'; // Orange
    } else if (counts.questionable >= 4) {
      score = 'C';
      scoreColor = '#F59E0B'; // Yellow/Amber
    } else if (counts.questionable >= 1) {
      score = 'B';
      scoreColor = '#84CC16'; // Light Green
    }

    setResults({ score, scoreColor, flagged, counts: { ...counts, neutral: list.length - flagged.length } });
    
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleShare = () => {
    if (!results) return;
    const text = `My pet's food scored a ${results.score} on Lumo Bites Ingredient Checker! 🐾 Check your pet's food at lumobites.net`;
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
      <nav className="bg-white border-b border-[#EEEEEE] px-6 md:px-[48px] flex items-center h-[72px]">
        <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', transform: 'scale(1.4)', transformOrigin: 'left center' }}>
            <img src="/Logo.png" alt="Lumo Bites" style={{ height: '40px', width: 'auto', display: 'block', objectFit: 'contain' }} />
            <sup style={{ fontSize: '10px', color: '#8B5A2B', fontWeight: 'bold', alignSelf: 'flex-start', marginTop: '5px', marginLeft: '2px', fontFamily: 'sans-serif', userSelect: 'none' }}>™</sup>
          </div>
        </Link>
      </nav>

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
                <span>🐶</span> Dog
              </button>
              <button 
                onClick={() => setPetType('cat')}
                className={`flex-1 py-4 rounded-2xl border-2 transition-all font-bold flex items-center justify-center gap-2 ${petType === 'cat' ? 'border-[#8B5E3C] bg-[#8B5E3C]/5 text-[#8B5E3C]' : 'border-gray-100 text-gray-400'}`}
              >
                <span>🐱</span> Cat
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
            disabled={!ingredientsText.trim()}
            className="w-full bg-[#8B5E3C] text-white py-5 rounded-2xl font-black text-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-[#8B5E3C]/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            Check Ingredients Now &rarr;
          </button>
        </div>

        {/* RESULTS */}
        {results && (
          <div ref={resultsRef} className="mt-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-[#F0E6DD]">
              <div className="p-8 text-center border-b border-gray-100">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Overall Safety Score</p>
                <div 
                  className="text-8xl font-black mb-4 inline-block"
                  style={{ color: results.scoreColor }}
                >
                  {results.score}
                </div>
                <div className="flex justify-center gap-8 mt-4">
                  <div className="text-center">
                    <span className="block text-2xl font-bold text-[#EF4444]">{results.counts.dangerous}</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Dangerous</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-2xl font-bold text-[#F59E0B]">{results.counts.questionable}</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Questionable</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-2xl font-bold text-[#10B981]">{results.counts.good}</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Good</span>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <h3 className="font-black text-[#191919] text-xl mb-6">Detailed Analysis</h3>
                
                {results.flagged.length === 0 ? (
                  <div className="bg-[#F0FDF4] p-6 rounded-2xl border border-[#BBF7D0] text-center">
                    <p className="text-[#15803D] font-bold">No dangerous or questionable ingredients found! 🎉</p>
                    <p className="text-[#166534] text-sm mt-1">This food appears to use clean ingredients based on our database.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {results.flagged.sort((a,b) => {
                      const order = { dangerous: 0, questionable: 1, good: 2, neutral: 3 };
                      return order[a.info.category] - order[b.info.category];
                    }).map((f, i) => (
                      <div 
                        key={i} 
                        className={`p-6 rounded-2xl border flex flex-col md:flex-row gap-4 md:items-center ${
                          f.info.category === 'dangerous' ? 'bg-[#FEF2F2] border-[#FEE2E2]' :
                          f.info.category === 'questionable' ? 'bg-[#FFFBEB] border-[#FEF3C7]' :
                          'bg-[#F0FDF4] border-[#DCFCE7]'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`w-3 h-3 rounded-full ${
                              f.info.category === 'dangerous' ? 'bg-[#EF4444]' :
                              f.info.category === 'questionable' ? 'bg-[#F59E0B]' :
                              'bg-[#10B981]'
                            }`}></span>
                            <h4 className="font-black text-[#191919] uppercase text-sm tracking-tight">{f.info.name}</h4>
                            <span className="text-gray-400 text-xs font-bold px-2 py-0.5 bg-white/50 rounded-full border border-gray-100">{f.info.category}</span>
                          </div>
                          <p className="text-xs text-gray-600 font-medium mb-2">{f.info.reason}</p>
                          <p className="text-sm text-gray-800 leading-relaxed"><span className="font-bold">Impact:</span> {f.info.effects}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-8 flex flex-col md:flex-row gap-4">
                  <button 
                    onClick={handleShare}
                    className="flex-1 bg-white border-2 border-gray-100 text-[#191919] py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:border-[#8B5E3C]/20 transition-all"
                  >
                    <span>🔗</span> Share Result
                  </button>
                  <Link 
                    href={`/chat?issues=${results.flagged.filter(f => f.info.category !== 'good').map(f => f.info.name).join(',')}`}
                    className="flex-1 bg-[#8B5E3C] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
                  >
                    <span>🛡️</span> Find Safer Alternatives
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
      </main>

      {/* FOOTER */}
      <footer className="mt-24 bg-[#191919] py-16 px-6 text-center text-white">
        <Link href="/" style={{ textDecoration: 'none' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <img src="/Logo.png" alt="Lumo Bites" className="h-12 invert brightness-0" />
            <sup style={{ fontSize: '10px', color: '#8B5A2B', fontWeight: 'bold', alignSelf: 'flex-start', marginTop: '8px', marginLeft: '2px', fontFamily: 'sans-serif', userSelect: 'none' }}>™</sup>
          </div>
        </Link>
        <p className="text-gray-500 text-sm mb-4 mt-6">&copy; {new Date().getFullYear()} Lumo Bites<sup style={{ fontSize: '50%', color: '#8B5A2B', verticalAlign: 'super', marginLeft: '1px' }}>™</sup>. Every pet deserves safe food.</p>
        <div className="flex justify-center gap-6 text-sm font-bold text-gray-400">
          <Link href="/scan" className="hover:text-white transition-colors">Is My Pet&apos;s Food Safe?</Link>
          <Link href="/recalls" className="hover:text-white transition-colors">Recall Alerts</Link>
          <Link href="/chat" className="hover:text-white transition-colors">Find Food</Link>
        </div>
      </footer>
    </div>
  );
}
