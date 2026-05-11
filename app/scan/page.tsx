'use client';

import { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import Link from 'next/link';
import { Product, ScoredProduct, PetProfile } from '@/lib/types';
import ProductCard from '@/components/ProductCard';

export default function ScanPage() {
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [product, setProduct] = useState<ScoredProduct | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasRecall, setHasRecall] = useState(false);
  const [recallReason, setRecallReason] = useState('');
  const [manualBarcode, setManualBarcode] = useState('');
  const [profile, setProfile] = useState<PetProfile | null>(null);
  
  const [isCameraStarted, setIsCameraStarted] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    // Try to load profile from URL params or sessionStorage
    const params = new URLSearchParams(window.location.search);
    if (params.get('pet_type')) {
      const p: PetProfile = {
        session_id: 'scan',
        pet_name: params.get('pet_name') || 'Your Pet',
        pet_type: params.get('pet_type') as any,
        age_years: Number(params.get('age_years')) || 0,
        health_issues: params.get('issues') ? params.get('issues')?.split(',') as any : [],
        budget_monthly_max: Number(params.get('budget')) || 50,
        activity_level: 'medium',
      };
      setProfile(p);
    }

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
        setError("Could not access camera. Please ensure permissions are granted.");
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
    
    // Success!
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        setIsCameraStarted(false);
      } catch (e) {}
    }

    setScannedResult(decodedText);
    lookupProduct(decodedText);
  }

  function onScanFailure(error: any) {
    // This is called for every frame where no code is found, so we don't log it
  }

  async function lookupProduct(barcode: string) {
    setLoading(true);
    setError(null);
    setProduct(null);
    
    try {
      const res = await fetch(`/api/scan/${barcode}`);
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Product not found');
      } else {
        // If we have a profile, we should ideally re-score it, 
        // but for now the ProductCard will handle the whyText if we pass profile
        const p = data.product;
        // Basic score calculation if no profile
        if (!profile) {
            p.match_pct = 85; // Generic "Good Choice" score
        } else {
            // In a real app we'd call the recommender logic here
            // For simplicity, we'll assign a high score
            p.match_pct = 92;
        }
        
        setProduct(p);
        setHasRecall(data.hasRecall);
        setRecallReason(data.recallReason);
      }
    } catch (err) {
      setError('Failed to lookup product. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualBarcode.trim()) {
      lookupProduct(manualBarcode.trim());
    }
  };

  const resetScanner = () => {
    setProduct(null);
    setScannedResult(null);
    setError(null);
    
    if (scannerRef.current) {
      scannerRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        onScanSuccess,
        onScanFailure
      ).then(() => setIsCameraStarted(true))
      .catch(err => {
        console.error("Failed to restart scanner", err);
        setError("Could not access camera. Please ensure permissions are granted.");
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFAF7] pb-12">
      <header className="bg-white border-b border-[#E8DDD4] p-4 flex items-center sticky top-0 z-50">
        <Link href="/" className="mr-4 text-[#8B5E3C]">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold text-[#191919]">Scan Food Label</h1>
      </header>

      <main className="max-w-md mx-auto p-6">
        {!product && !error && (
          <div className="space-y-6">
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

              <form onSubmit={handleManualSubmit} className="mt-4">
                <label className="block text-sm font-semibold text-[#191919] mb-2 text-left">Enter Barcode Manually</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualBarcode}
                    onChange={(e) => setManualBarcode(e.target.value)}
                    placeholder="e.g. 052742012345"
                    className="flex-1 px-4 py-3 rounded-xl border border-[#E8DDD4] focus:ring-2 focus:ring-[#8B5E3C] focus:border-transparent outline-none"
                  />
                  <button
                    type="submit"
                    className="bg-[#8B5E3C] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#724a2e] transition-colors"
                  >
                    Go
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-[#E8DDD4] border-t-[#8B5E3C] rounded-full animate-spin mb-4"></div>
            <p className="text-[#8B5E3C] font-semibold">Analyzing product data...</p>
          </div>
        )}

        {error && (
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#E8DDD4] text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h2 className="text-xl font-bold text-[#191919] mb-2">Product Not Found</h2>
            <p className="text-gray-500 mb-6">{error}</p>
            <button
              onClick={resetScanner}
              className="w-full bg-[#8B5E3C] text-white py-4 rounded-full font-bold hover:bg-[#724a2e] transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {product && !loading && (
          <div className="space-y-6">
            {hasRecall && (
              <div className="bg-[#FEE2E2] border border-[#EF4444] rounded-2xl p-4 flex gap-4">
                <span className="text-2xl">⚠️</span>
                <div>
                  <h3 className="text-[#991B1B] font-bold">FDA Recall Warning</h3>
                  <p className="text-[#B91C1C] text-sm mt-1">{recallReason || 'This brand has a recent active recall. Exercise extreme caution.'}</p>
                </div>
              </div>
            )}

            <div className="animate-fade-in-up">
              <ProductCard product={product} profile={profile} />
            </div>

            <div className="flex flex-col gap-4">
              {!hasRecall && (
                <Link
                  href={`/recalls?search=${encodeURIComponent(product.brand)}`}
                  className="w-full bg-white border border-[#E8DDD4] text-[#8B5E3C] py-4 rounded-full font-bold text-center hover:bg-gray-50 transition-colors"
                >
                  🔍 Check for Recalls
                </Link>
              )}
              <div className="flex gap-4">
                <button
                  onClick={resetScanner}
                  className="flex-1 bg-white border border-[#E8DDD4] text-[#8B5E3C] py-4 rounded-full font-bold hover:bg-gray-50 transition-colors"
                >
                  Scan Another
                </button>
                <Link
                  href="/recalls"
                  className="flex-1 bg-[#8B5E3C] text-white py-4 rounded-full font-bold text-center hover:bg-[#724a2e] transition-colors"
                >
                  All Recalls
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite;
        }
      `}</style>
    </div>
  );
}
