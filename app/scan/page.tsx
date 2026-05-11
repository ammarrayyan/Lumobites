'use client';

import { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import Link from 'next/link';
import { Product, ScoredProduct, PetProfile } from '@/lib/types';

export default function ScanPage() {
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [product, setProduct] = useState<ScoredProduct | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasRecall, setHasRecall] = useState(false);
  const [recallReason, setRecallReason] = useState('');
  const [manualBarcode, setManualBarcode] = useState('');
  const [manualBrand, setManualBrand] = useState('');
  const [showBrandInput, setShowBrandInput] = useState(false);
  
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
    setShowBrandInput(false);
    
    try {
      const res = await fetch(`/api/scan/${barcode}`);
      const data = await res.json();
      
      if (!res.ok) {
        // If barcode not found in OPFF, ask for brand
        setShowBrandInput(true);
        setError(null); 
      } else {
        setProduct(data.product);
        setHasRecall(data.hasRecall);
        setRecallReason(data.recallReason);
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
    setScannedResult(null);
    setError(null);
    setShowBrandInput(false);
    
    // Small delay to ensure UI has transitioned
    setTimeout(async () => {
      if (scannerRef.current && !scannerRef.current.isScanning) {
        try {
          await scannerRef.current.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            onScanSuccess,
            onScanFailure
          );
          setIsCameraStarted(true);
        } catch (err) {
          console.error("Failed to restart scanner", err);
        }
      }
    }, 100);
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
            <h2 className="text-2xl font-extrabold text-[#191919] mb-2">Recall Checker</h2>
            <p className="text-gray-600">Scan your pet&apos;s food barcode to instantly check for FDA recalls</p>
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
              <label className="block text-sm font-semibold text-[#191919] mb-2 text-left">Enter Barcode Manually</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  placeholder="e.g. 052742012345"
                  className="flex-1 px-4 py-3 rounded-xl border border-[#E8DDD4] outline-none focus:ring-2 focus:ring-[#8B5E3C]"
                />
                <button type="submit" className="bg-[#8B5E3C] text-white px-6 py-3 rounded-xl font-bold">Go</button>
              </div>
            </form>
          </div>
        </div>

        {showBrandInput && (
           <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#E8DDD4] animate-fade-in">
              <div className="text-4xl mb-4 text-center">🔍</div>
              <h3 className="text-xl font-bold text-[#191919] mb-2 text-center">Product Not Found</h3>
              <p className="text-gray-500 mb-6 text-center text-sm">We couldn&apos;t identify that barcode. Please enter the brand name to check for recalls.</p>
              <form onSubmit={handleBrandSubmit} className="space-y-4">
                <input
                    type="text"
                    value={manualBrand}
                    onChange={(e) => setManualBrand(e.target.value)}
                    placeholder="Brand Name (e.g. Purina, Hill's)"
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
              <p className="text-[10px] uppercase tracking-widest text-[#8B5E3C] font-bold mb-1">Product Details</p>
              <h4 className="text-xl font-extrabold text-[#191919] mb-1">{product.product_name || 'Generic Product'}</h4>
              <p className="text-[#8B5E3C] font-bold mb-4">{product.brand}</p>
              
              {product.ingredients && (
                <div className="pt-4 border-t border-gray-100">
                    <p className="text-xs font-bold text-[#191919] mb-2 uppercase">Ingredients</p>
                    <p className="text-xs text-gray-500 line-clamp-3">{product.ingredients}</p>
                </div>
              )}
            </div>

            <div className="bg-[#191919] rounded-2xl p-6 text-white">
              <h4 className="font-bold mb-2">🔔 Stay Protected</h4>
              <p className="text-xs text-gray-400 mb-4">We&apos;ll email you instantly if {product.brand || 'this brand'} has a new FDA recall. Free service.</p>
              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  const email = (e.target as any).email.value;
                  const res = await fetch('/api/recall-subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                      email, 
                      pet_type: product.pet_type || 'dog', 
                      product_names: [product.brand].filter(Boolean)
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

            <div className="flex gap-4">
              <button onClick={resetScanner} className="flex-1 bg-white border border-[#E8DDD4] text-[#8B5E3C] py-4 rounded-full font-bold">Scan Another</button>
              <Link href="/recalls" className="flex-1 bg-[#8B5E3C] text-white py-4 rounded-full font-bold text-center">View All Recalls</Link>
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

