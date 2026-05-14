'use client';

import { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import Link from 'next/link';
import { Product, ScoredProduct, PetProfile } from '@/lib/types';
import { ingredientDatabase, IngredientInfo } from '@/lib/ingredients';


export default function ScanPage() {
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [product, setProduct] = useState<ScoredProduct | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasRecall, setHasRecall] = useState(false);
  const [recallReason, setRecallReason] = useState('');
  const [manualBarcode, setManualBarcode] = useState('');
  const [manualBrand, setManualBrand] = useState('');
  const [manualIngredients, setManualIngredients] = useState('');
  const [showBrandInput, setShowBrandInput] = useState(false);
  const [safetyResults, setSafetyResults] = useState<{
    score: string;
    scoreColor: string;
    flagged: { info: IngredientInfo; match: string }[];
    counts: { dangerous: number; questionable: number; good: number; neutral: number };
  } | null>(null);
  
  const [isCameraStarted, setIsCameraStarted] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const html5QrCode = new Html5Qrcode("reader");
    scannerRef.current = html5QrCode;

    const startScanner = async () => {
      try {
        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          onScanSuccess,
          onScanFailure
        );
        setIsCameraStarted(true);
      } catch (err) {
        console.error("Unable to start scanning", err);
        // Fallback to manual entry if camera fails
        setShowBrandInput(true);
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(err => console.error("Failed to stop scanner", err));
      }
    };
  }, []);

  async function onScanSuccess(decodedText: string) {
    if (loading) return;
    
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        setIsCameraStarted(false);
      } catch (e) {}
    }

    setScannedResult(decodedText);
    lookupProduct(decodedText);
  }

  function onScanFailure(error: any) {}

  async function lookupProduct(barcode: string) {
    setLoading(true);
    setError(null);
    setProduct(null);
    setSafetyResults(null);
    setShowBrandInput(false);
    
    try {
      const res = await fetch(`/api/scan/${barcode}`);
      const data = await res.json();
      
      if (!res.ok) {
        if (res.status === 400) {
          setError('This product is not available in the US or is listed in a different language.');
        } else {
          // If barcode not found in OPFF, ask for brand
          setShowBrandInput(true);
          setError(null);
        }
      } else {
        setProduct(data.product);
        setHasRecall(data.hasRecall);
        setRecallReason(data.recallReason);
        
        // Run ingredient safety check if ingredients exist
        if (data.product.ingredients) {
          analyzeIngredients(data.product.ingredients);
        }
      }
    } catch (err) {
      setError('Failed to lookup product. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }

  async function checkRecallByBrand(brand: string) {
    setLoading(true);
    setError(null);
    setProduct(null);
    
    try {
      const fdaRes = await fetch(`https://api.fda.gov/food/enforcement.json?search=product_description:"${encodeURIComponent(brand)}"&limit=10`);
      if (fdaRes.ok) {
        const fdaData = await fdaRes.json();
        const match = fdaData.results?.find((r: any) => {
          const desc = (r.product_description || '').toLowerCase();
          return desc.includes(brand.toLowerCase()) && 
                 (desc.includes('dog') || desc.includes('cat') || desc.includes('pet') || desc.includes('animal'));
        });
        
        if (match) {
          setHasRecall(true);
          setRecallReason(match.reason_for_recall);
        } else {
          setHasRecall(false);
        }
        setProduct({ brand } as any); // Minimal product info
      } else {
        setHasRecall(false);
        setProduct({ brand } as any);
      }
    } catch (err) {
      setError('Failed to check recalls. Please try again.');
    } finally {
      setLoading(false);
      setShowBrandInput(false);
    }
  }

  function analyzeIngredients(text: string) {
    if (!text) return;

    const list = text
      .split(/[,\n;]/)
      .map(i => i.trim())
      .filter(i => i.length > 0);

    const flagged: { info: IngredientInfo; match: string }[] = [];
    const counts = { dangerous: 0, questionable: 0, good: 0, neutral: 0 };
    const seen = new Set<string>();

    list.forEach(item => {
      const lowerItem = item.toLowerCase();
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

    let score = 'A';
    let scoreColor = '#10B981';
    if (counts.dangerous >= 2) { score = 'F'; scoreColor = '#EF4444'; }
    else if (counts.dangerous === 1) { score = 'D'; scoreColor = '#F97316'; }
    else if (counts.questionable >= 4) { score = 'C'; scoreColor = '#F59E0B'; }
    else if (counts.questionable >= 1) { score = 'B'; scoreColor = '#84CC16'; }

    setSafetyResults({ score, scoreColor, flagged, counts: { ...counts, neutral: list.length - flagged.length } });
  }

  const handleManualIngredientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualIngredients.trim()) return;
    
    setLoading(true);
    setProduct({ product_name: 'Custom Entry', brand: 'User Input', ingredients: manualIngredients } as any);
    analyzeIngredients(manualIngredients);
    setLoading(false);
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualBarcode.trim()) lookupProduct(manualBarcode.trim());
  };

  const handleBrandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualBrand.trim()) checkRecallByBrand(manualBrand.trim());
  };

  const resetScanner = async () => {
    setProduct(null);
    setSafetyResults(null);
    setScannedResult(null);
    setError(null);
    setShowBrandInput(false);
    setLoading(false);
    
    // Small delay to ensure UI has transitioned and div is visible
    setTimeout(async () => {
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            await scannerRef.current.stop();
          }
          await scannerRef.current.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            onScanSuccess,
            onScanFailure
          );
          setIsCameraStarted(true);
        } catch (err) {
          console.error("Failed to restart scanner", err);
          setError("Could not restart camera. Please refresh the page.");
        }
      }
    }, 300);
  };

  return (
    <div className="min-h-screen bg-[#FDFAF7] pb-12">
      <header className="bg-white border-b border-[#E8DDD4] p-4 flex items-center sticky top-0 z-50">
        <Link href="/" className="mr-4 text-[#8B5E3C]">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold text-[#191919]">Check for Recalls</h1>
      </header>

      <main className="max-w-md mx-auto p-6">
        <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-[#191919] mb-3">Is This Food Safe?</h2>
            <p className="text-gray-600 leading-relaxed text-sm">Scan any pet food label for instant ingredient safety analysis + live FDA recall check</p>
        </div>

        {/* Camera UI - Always mounted but hidden when not needed to avoid re-init bugs */}
        <div className={(!product && !error && !showBrandInput && !loading) ? 'block space-y-6' : 'hidden'}>
          <div className="bg-white rounded-3xl p-4 shadow-sm border border-[#E8DDD4] overflow-hidden">
            <div id="reader" className="w-full"></div>
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500 font-medium">Position the barcode within the frame</p>
              <div className="mt-2 h-1 w-32 bg-[#E8DDD4] mx-auto rounded-full overflow-hidden">
                  <div className="h-full bg-[#8B5E3C] w-1/2 animate-shimmer"></div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <div className="relative flex py-5 items-center">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="flex-shrink mx-4 text-gray-400 text-sm font-medium">OR</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>

            <form onSubmit={handleBarcodeSubmit} className="mt-4">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 text-left">Scan Food Label</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  placeholder="Enter barcode..."
                  className="flex-1 px-4 py-3 rounded-xl border border-[#E8DDD4] outline-none focus:ring-2 focus:ring-[#8B5E3C] text-sm"
                />
                <button type="submit" className="bg-[#8B5E3C] text-white px-6 py-3 rounded-xl font-bold text-sm">Go</button>
              </div>
            </form>

            <form onSubmit={handleManualIngredientSubmit} className="mt-6">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 text-left">Or paste ingredient list below</label>
              <textarea
                value={manualIngredients}
                onChange={(e) => setManualIngredients(e.target.value)}
                placeholder="Chicken, Rice, Corn Syrup..."
                className="w-full px-4 py-3 rounded-xl border border-[#E8DDD4] outline-none focus:ring-2 focus:ring-[#8B5E3C] text-sm h-24 resize-none"
              />
              <button type="submit" className="w-full mt-2 bg-white border border-[#E8DDD4] text-[#8B5E3C] py-3 rounded-xl font-bold text-sm hover:bg-[#FDFAF7]">Analyze Ingredients</button>
            </form>
          </div>
        </div>

        {showBrandInput && (
           <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#E8DDD4] animate-fade-in">
              <div className="text-4xl mb-4 text-center">🔍</div>
              <h3 className="text-xl font-bold text-[#191919] mb-6 text-center">Enter brand name to check FDA recalls</h3>
              <form onSubmit={handleBrandSubmit} className="space-y-4">
                <input
                    type="text"
                    value={manualBrand}
                    onChange={(e) => setManualBrand(e.target.value)}
                    placeholder="e.g. Purina, Hill's, Blue Buffalo"
                    className="w-full px-4 py-4 rounded-xl border border-[#E8DDD4] outline-none focus:ring-2 focus:ring-[#8B5E3C]"
                    autoFocus
                />
                <button type="submit" className="w-full bg-[#8B5E3C] text-white py-4 rounded-xl font-bold hover:bg-[#724a2e]">
                    Check for Recalls
                </button>
                <button type="button" onClick={resetScanner} className="w-full text-[#8B5E3C] font-semibold text-sm">
                    Back to Scanner
                </button>
              </form>
           </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-[#E8DDD4] border-t-[#8B5E3C] rounded-full animate-spin mb-4"></div>
            <p className="text-[#8B5E3C] font-semibold">Checking FDA Database...</p>
          </div>
        )}

        {error && (
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#E8DDD4] text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-[#191919] mb-2">Error</h2>
            <p className="text-gray-500 mb-6">{error}</p>
            <button onClick={resetScanner} className="w-full bg-[#8B5E3C] text-white py-4 rounded-full font-bold">Try Again</button>
          </div>
        )}

        {product && !loading && (
          <div className="space-y-6 animate-fade-in-up">
            {hasRecall ? (
              <div className="bg-[#FEE2E2] border-2 border-[#EF4444] rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">⚠️</span>
                    <h3 className="text-[#991B1B] text-xl font-black leading-tight uppercase">WARNING: Recall Active</h3>
                </div>
                <p className="text-[#B91C1C] font-bold mb-4">This product or brand has an active FDA recall!</p>
                <div className="bg-white/50 rounded-xl p-4 text-[#7F1D1D] text-sm">
                    <p className="mb-2"><strong>Reason:</strong> {recallReason}</p>
                    <p className="text-xs opacity-75">Check the full details on our <Link href="/recalls" className="underline font-bold">Recall Alerts</Link> page.</p>
                </div>
              </div>
            ) : (
              <div className="bg-[#DCFCE7] border-2 border-[#166534] rounded-2xl p-6 text-center">
                <div className="text-4xl mb-2">✅</div>
                <h3 className="text-[#166534] text-xl font-black uppercase">Safety Verified</h3>
                <p className="text-[#14532D] font-medium mt-1">No active recalls found for this product</p>
              </div>
            )}

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8DDD4]">
              <p className="text-[10px] uppercase tracking-widest text-[#8B5E3C] font-bold mb-1">Safety Report for</p>
              <h4 className="text-xl font-extrabold text-[#191919] mb-1">{product.product_name && product.product_name !== 'Custom Entry' ? product.product_name : (product.brand !== 'User Input' ? product.brand : 'Pasted Ingredients')}</h4>
              {product.product_name && product.product_name !== 'Custom Entry' && <p className="text-[#8B5E3C] font-bold mb-4">{product.brand}</p>}
              
              {safetyResults && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-bold text-[#191919]">Ingredient Grade</span>
                    <span className="text-3xl font-black" style={{ color: safetyResults.scoreColor }}>{safetyResults.score}</span>
                  </div>
                  <div className="space-y-3">
                    {safetyResults.flagged.length > 0 ? (
                      safetyResults.flagged.slice(0, 3).map((f, i) => (
                        <div key={i} className={`p-3 rounded-xl border text-xs ${f.info.category === 'dangerous' ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}>
                          <span className="font-bold uppercase block mb-1">{f.info.name} — {f.info.category}</span>
                          <p className="text-gray-600 leading-tight">{f.info.reason}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-green-600 font-medium">No dangerous ingredients found in our database.</p>
                    )}
                  </div>
                </div>
              )}
              
              {product.ingredients && (
                <div className="pt-4 border-t border-gray-100 mt-4">
                    <p className="text-xs font-bold text-[#191919] mb-2 uppercase">Ingredients</p>
                    <p className="text-xs text-gray-500 line-clamp-3">{product.ingredients}</p>
                </div>
              )}
            </div>

            <div className="bg-[#191919] rounded-2xl p-6 text-white">
              <h4 className="font-bold mb-2">🔔 Stay Protected</h4>
              <p className="text-xs text-gray-400 mb-4">
                We&apos;ll email you instantly if {product.product_name && product.product_name !== 'Unknown Product' ? product.product_name : product.brand} has a new FDA recall. Free service.
              </p>
              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  const email = (e.target as any).email.value;
                  const res = await fetch('/api/recall-subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                      email, 
                      pet_type: product.pet_type || 'both', 
                      product_names: [product.product_name !== 'Unknown Product' ? product.product_name : product.brand].filter(Boolean)
                    })
                  });
                  const data = await res.json();
                  if (res.ok) alert("You're subscribed to recall alerts!");
                  else alert(data.error || "Something went wrong. Please try again.");
                }}
                className="flex gap-2"
              >
                <input 
                  name="email"
                  type="email" 
                  placeholder="your@email.com" 
                  required
                  className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-sm outline-none focus:border-white/40"
                />
                <button type="submit" className="bg-[#8B5E3C] text-white px-4 py-2 rounded-lg text-sm font-bold">Alert Me</button>
              </form>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={() => {
                  const text = `My pet's food scored ${safetyResults?.score || 'N/A'} — is yours safe? lumobites.net`;
                  if (navigator.share) navigator.share({ title: 'Lumo Bites Safety Report', text, url: 'https://lumobites.net' });
                  else { navigator.clipboard.writeText(text); alert('Result copied!'); }
                }}
                className="w-full bg-white border border-[#E8DDD4] text-[#191919] py-4 rounded-full font-bold text-sm"
              >
                Share Safety Report
              </button>
              <button onClick={resetScanner} className="w-full bg-[#8B5E3C] text-white py-4 rounded-full font-bold text-sm">Scan Another</button>
              <Link href="/recalls" className="text-[#8B5E3C] font-bold text-xs text-center">View All FDA Recalls &rarr;</Link>
            </div>
          </div>
        )}
      </main>

      <style jsx>{`
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
        .animate-shimmer { animation: shimmer 1.5s infinite; }
        .animate-fade-in { animation: fadeIn 0.4s ease-out; }
        .animate-fade-in-up { animation: fadeInUp 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

