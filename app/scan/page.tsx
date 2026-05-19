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
  const [ocrLoading, setOcrLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawOcrText, setRawOcrText] = useState<string | null>(null);
  const [ocrReviewText, setOcrReviewText] = useState<string>('');
  const [hasRecall, setHasRecall] = useState(false);
  const [recallReason, setRecallReason] = useState('');
  const [manualBarcode, setManualBarcode] = useState('');
  const [manualIngredients, setManualIngredients] = useState('');
  const [safetyResults, setSafetyResults] = useState<{
    score: string;
    scoreColor: string;
    flagged: { info: IngredientInfo; match: string }[];
    counts: { dangerous: number; questionable: number; good: number; neutral: number };
  } | null>(null);
  
  const [isCameraStarted, setIsCameraStarted] = useState(false);
  const [activeTab, setActiveTab] = useState<'scanner' | 'manual'>('scanner');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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
    if (loading || ocrLoading) return;
    
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

  // ─── Advanced image preprocessing for best OCR accuracy ─────────────────────
  const preprocessCanvas = (video: HTMLVideoElement): string => {
    const canvas = canvasRef.current!;

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!vw || !vh) throw new Error('Camera not ready — hold still and try again');

    // Step 1: Crop center 80% of the frame.
    const srcX = Math.floor(vw * 0.1);
    const srcY = Math.floor(vh * 0.1);
    const srcW = Math.floor(vw * 0.8);
    const srcH = Math.floor(vh * 0.8);

    // Cap output width at 1600px to stay well under Google Vision's 20MB limit.
    // Google Vision works best between 800-1600px wide for text detection.
    const MAX_WIDTH = 1600;
    const scale = Math.min(3, MAX_WIDTH / srcW);
    canvas.width  = Math.round(srcW * scale);
    canvas.height = Math.round(srcH * scale);

    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    // Crop + scale in one drawImage call (avoids getImageData range errors)
    ctx.drawImage(video, srcX, srcY, srcW, srcH, 0, 0, canvas.width, canvas.height);

    // Step 2: Grayscale + contrast via offscreen canvas CSS filter.
    const tmp = document.createElement('canvas');
    tmp.width  = canvas.width;
    tmp.height = canvas.height;
    const tmpCtx = tmp.getContext('2d')!;
    tmpCtx.filter = 'grayscale(100%) contrast(200%) brightness(108%)';
    tmpCtx.drawImage(canvas, 0, 0);
    ctx.drawImage(tmp, 0, 0);

    // Step 3: Sharpen with 5-tap kernel (read from frozen copy, write to dst).
    const w = canvas.width;
    const h = canvas.height;
    const imgData = ctx.getImageData(0, 0, w, h);
    const src = new Uint8ClampedArray(imgData.data);
    const dst = imgData.data;

    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = (y * w + x) * 4;
        for (let c = 0; c < 3; c++) {
          dst[i + c] = Math.min(255, Math.max(0,
            5 * src[i + c]
            - src[((y - 1) * w + x    ) * 4 + c]
            - src[(     y  * w + x - 1) * 4 + c]
            - src[(     y  * w + x + 1) * 4 + c]
            - src[((y + 1) * w + x    ) * 4 + c]
          ));
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // Output as JPEG (much smaller than PNG for photos — keeps payload < 2MB)
    return canvas.toDataURL('image/jpeg', 0.85);
  };

  // ─── Post-OCR text cleanup ────────────────────────────────────────────────────

  const cleanOcrText = (raw: string): string => {
    let t = raw;
    // Fix common OCR digit/letter confusions in ingredient context
    t = t.replace(/\b0(?=[a-zA-Z])/g, 'O');   // 0rgan → Organ
    t = t.replace(/(?<=[a-zA-Z])0\b/g, 'o');   // Chickeno → Chickeno (trailing)
    t = t.replace(/\bl(?=[A-Z])/g, 'I');        // lNGREDIENTS → INGREDIENTS
    t = t.replace(/\b1(?=[a-zA-Z]{2})/g, 'l'); // 1iver → liver
    t = t.replace(/5(?=[a-zA-Z])/g, 'S');       // 5odium → Sodium
    t = t.replace(/(?<=[a-zA-Z])5\b/g, 's');    // trailing 5
    // Remove stray non-text characters but keep commas, parens, percent
    t = t.replace(/[^a-zA-Z0-9\s,().%&\-'\n]/g, ' ');
    // Collapse multiple spaces/newlines
    t = t.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
    return t;
  };

  const captureAndOCR = async () => {
    if (!scannerRef.current || ocrLoading) return;

    setOcrLoading(true);
    setError(null);
    setRawOcrText(null);
    setOcrReviewText('');

    try {
      const video = document.querySelector('#reader video') as HTMLVideoElement;
      if (!video) throw new Error('Camera not active — please allow camera access and try again');

      // Wait up to 2 seconds for the video to report valid dimensions.
      // videoWidth is 0 until the stream has delivered at least one frame.
      let attempts = 0;
      while ((!video.videoWidth || !video.videoHeight) && attempts < 20) {
        await new Promise(r => setTimeout(r, 100));
        attempts++;
      }
      if (!video.videoWidth || !video.videoHeight) {
        throw new Error('Camera not ready — hold the camera still and tap Capture again');
      }

      // ⚠️ Capture BEFORE stopping the scanner.
      // Stopping the stream resets videoWidth/videoHeight to 0.
      const imageData = preprocessCanvas(video);

      // Now it's safe to stop the scanner
      if (scannerRef.current.isScanning) {
        await scannerRef.current.stop().catch(() => {});
        setIsCameraStarted(false);
      }

      const res = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to read label');
      }

      const { text } = await res.json();
      const cleaned = cleanOcrText(text || '');
      setRawOcrText(cleaned);
      setOcrReviewText(cleaned);
      setOcrLoading(false);
    } catch (err: any) {
      console.error('OCR Error:', err);
      setError(err.message || 'Could not read label clearly. Please ensure good lighting and hold camera steady, or paste ingredients manually below.');
      setOcrLoading(false);
    }
  };

  const processOCRResult = (text: string) => {
    const normalized = text.toLowerCase();
    const ingredientKeywords = ['chicken', 'beef', 'rice', 'corn', 'wheat', 'salmon', 'turkey', 'lamb',
      'protein', 'fat', 'fiber', 'ingredients', 'meal', 'extract', 'oil', 'vitamin', 'mineral', 'salt'];
    const hasIngredientKeywords = ingredientKeywords.some(w => normalized.includes(w));
    const commaCount = (text.match(/,/g) || []).length;

    if (hasIngredientKeywords || commaCount > 2 || text.length > 40) {
      setProduct({ product_name: 'Scanned Ingredients', brand: 'Camera Scan', ingredients: text } as any);
      analyzeIngredients(text, false);
    } else {
      setError('Could not clearly identify an ingredient list. Please point at the back of the package or paste manually below.');
    }
  };



  async function lookupProduct(barcode: string) {
    setLoading(true);
    setError(null);
    setProduct(null);
    setSafetyResults(null);
    setHasRecall(false);
    setRecallReason('');
    
    try {
      const res = await fetch(`/api/scan/${barcode}`);
      const data = await res.json();
      
      if (!res.ok) {
        setProduct({ product_name: 'Unknown Product', brand: 'Unknown Brand' } as any);
      } else {
        setProduct(data.product);
        setHasRecall(data.hasRecall);
        setRecallReason(data.recallReason);
        if (data.product.ingredients) {
          analyzeIngredients(data.product.ingredients, data.hasRecall);
        }
      }
    } catch (err) {
      setProduct({ product_name: 'Unknown Product', brand: 'Unknown Brand' } as any);
    } finally {
      setLoading(false);
    }
  }

  function analyzeIngredients(text: string, recallActive: boolean = false) {
    if (!text) return;

    const list = text
      .split(/[,\n;]/)
      .map(i => i.trim())
      .filter(i => i.length > 0);

    const flagged: { info: IngredientInfo; match: string }[] = [];
    const counts = { dangerous: 0, questionable: 0, good: 0, neutral: 0 };
    const seen = new Set<string>();

    list.forEach(item => {
      const normalizedItem = item.toLowerCase().trim().replace(/[().]/g, ' ');
      const match = ingredientDatabase.find(dbItem => {
        const dbName = dbItem.name.toLowerCase();
        if (dbName.length <= 3) {
          const regex = new RegExp(`\\b${dbName}\\b`, 'i');
          return regex.test(normalizedItem);
        }
        return normalizedItem.includes(dbName) || dbName.includes(normalizedItem);
      });

      if (match && !seen.has(match.name)) {
        flagged.push({ info: match, match: item });
        counts[match.category]++;
        seen.add(match.name);
      }
    });

    let score = 'A';
    let scoreColor = '#10B981';

    if (recallActive || counts.dangerous >= 4) {
      score = 'F';
      scoreColor = '#EF4444';
    } else if (counts.dangerous >= 2) {
      score = 'D';
      scoreColor = '#F97316';
    } else if (counts.dangerous === 1 || counts.questionable >= 6) {
      score = 'C';
      scoreColor = '#F59E0B';
    } else if (counts.questionable >= 3) {
      score = 'B';
      scoreColor = '#84CC16';
    }

    setSafetyResults({ score, scoreColor, flagged, counts: { ...counts, neutral: list.length - flagged.length } });
  }

  const handleManualIngredientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualIngredients.trim()) return;
    
    setLoading(true);
    setProduct({ product_name: 'Custom Entry', brand: 'User Input', ingredients: manualIngredients } as any);
    analyzeIngredients(manualIngredients, false);
    setLoading(false);
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualBarcode.trim()) lookupProduct(manualBarcode.trim());
  };

  const resetScanner = async () => {
    setProduct(null);
    setSafetyResults(null);
    setScannedResult(null);
    setError(null);
    setRawOcrText(null);
    setOcrReviewText('');
    setLoading(false);
    setOcrLoading(false);
    
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
        }
      }
    }, 300);
  };

  return (
    <div className="min-h-screen bg-[#FDFAF7] pb-12">
      <header className="bg-white border-b border-[#E8DDD4] px-6 md:px-[48px] flex items-center sticky top-0 z-50" style={{ height: '72px' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', transform: 'scale(1.4)', transformOrigin: 'left center', margin: '-15px 0' }}>
            <img src="/Logo.png" alt="Lumo Bites" style={{ height: '63px', width: 'auto', display: 'block', objectFit: 'contain' }} />
            <sup style={{ fontSize: '10px', color: '#8B5A2B', fontWeight: 'bold', alignSelf: 'flex-start', marginTop: '10px', marginLeft: '2px', fontFamily: 'sans-serif', userSelect: 'none' }}>™</sup>
          </div>
        </Link>
        <div style={{ marginLeft: 'auto' }}>
          <Link href="/" className="text-[#8B5E3C] font-semibold text-sm hover:underline" style={{ textDecoration: 'none' }}>
            &larr; Go Home
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 md:p-8 flex flex-col items-center justify-center min-h-[calc(100vh-120px)]">
        <canvas ref={canvasRef} className="hidden" />

        {/* Outer Premium Card Container */}
        <div className="w-full max-w-[650px] bg-white rounded-3xl border border-[#EEEEEE] shadow-[0_12px_40px_rgba(0,0,0,0.03)] p-6 md:p-10 flex flex-col gap-6">
          
          {/* Header Title Section */}
          <div className="text-center flex flex-col items-center">
            {/* Sparkle Badge */}
            <div className="inline-flex items-center gap-1.5 bg-[#8B5E3C]/5 border border-[#8B5E3C]/10 text-[#8B5E3C] text-[11px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full mb-3 shadow-xs">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-[#8B5E3C]">
                <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.6 3.102-1.196 4.622c-.21.81.67 1.45 1.366 1.012L10 15.71l4.217 2.341c.697.438 1.577-.202 1.366-1.012l-1.196-4.622 3.6-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
              </svg>
              Live FDA Safety Check
            </div>
            
            <h2 className="text-3xl font-[900] text-[#191919] mb-2 tracking-tight">Is This Food Safe?</h2>
            <p className="text-sm text-gray-500 leading-relaxed max-w-[400px]">
              Scan barcode or paste ingredients for instant safety analysis + live FDA recall check
            </p>
          </div>

          {/* Search / Scan UI */}
          {(!product && !loading && !ocrLoading) ? (
            <div className="flex flex-col gap-6">
              
              {/* Tab Selector */}
              <div className="flex bg-[#F8F6F4] p-1.5 rounded-2xl border border-gray-100">
                <button
                  onClick={() => setActiveTab('scanner')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer ${
                    activeTab === 'scanner'
                      ? 'bg-white text-[#8B5E3C] shadow-xs'
                      : 'text-gray-500 hover:text-[#8B5E3C]'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                  </svg>
                  Live Camera Scanner
                </button>
                <button
                  onClick={() => setActiveTab('manual')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer ${
                    activeTab === 'manual'
                      ? 'bg-white text-[#8B5E3C] shadow-xs'
                      : 'text-gray-500 hover:text-[#8B5E3C]'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                  Manual Entry
                </button>
              </div>

              {/* TAB 1: Live Scanner Viewport */}
              {activeTab === 'scanner' && (
                <div className="flex flex-col gap-5">
                  <div className="relative group">
                    <div className="bg-[#FAF8F6] rounded-3xl p-4 border-2 border-dashed border-gray-200 overflow-hidden shadow-xs hover:border-[#8B5E3C] transition-colors relative">
                      <div id="reader" className="w-full rounded-2xl overflow-hidden"></div>
                    </div>
                    
                    {isCameraStarted && (
                      <div className="absolute bottom-6 left-0 right-0 flex justify-center px-6 z-10">
                        <button 
                          onClick={captureAndOCR}
                          className="bg-[#8B5E3C] hover:bg-[#734A2E] text-white px-8 py-4 rounded-full font-bold shadow-xl flex items-center gap-2.5 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
                          </svg>
                          Capture & Scan Ingredients
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Two-Column Scan Instructions Organiser */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    {/* Column 1: Barcode Scan */}
                    <div className="bg-[#FAF8F6] border border-[#F0EBE5] rounded-2xl p-4 flex gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-150 shrink-0 text-[#8B5E3C] shadow-xs">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 10.5v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 10.5v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM16.5 13.5v.008h-.008V13.5h.008zm0 2.25v.008h-.008V15.75h.008zm0 2.25v.008h-.008V18h.008zm-2.25-4.5v.008h-.008V13.5h.008zm0 2.25v.008h-.008V15.75h.008zm0 2.25v.008h-.008V18h.008zm4.5-2.25v.008h-.008V15.75h.008zm0 2.25v.008h-.008V18h.008z" />
                        </svg>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-[#191919] mb-0.5">Scan Barcode</span>
                        <p className="text-[11px] text-gray-500 leading-normal">
                          Align any pet food barcode in the viewfinder. It will automatically detect and fetch the product.
                        </p>
                      </div>
                    </div>

                    {/* Column 2: Ingredients Scan */}
                    <div className="bg-[#FAF8F6] border border-[#F0EBE5] rounded-2xl p-4 flex gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-150 shrink-0 text-[#8B5E3C] shadow-xs">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-[#191919] mb-0.5">Scan Ingredients</span>
                        <p className="text-[11px] text-gray-500 leading-normal">
                          Point the camera directly at the text ingredients block on the package back, then tap <strong className="text-[#8B5E3C]">Capture & Scan Ingredients</strong>.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Manual Barcode / Ingredient Input */}
              {activeTab === 'manual' && (
                <div className="flex flex-col gap-6">
                  {/* Barcode Search Form */}
                  <form onSubmit={handleBarcodeSubmit} className="flex flex-col gap-2">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest text-left">
                      Manual Barcode Search
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={manualBarcode}
                          onChange={(e) => setManualBarcode(e.target.value)}
                          placeholder="e.g. 079100002598"
                          className="w-full pl-4 pr-10 py-3 rounded-xl border border-[#E8DDD4] outline-none focus:ring-2 focus:ring-[#8B5E3C]/20 focus:border-[#8B5E3C] text-sm text-[#191919] bg-white transition-all"
                        />
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 10.5v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 10.5v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM16.5 13.5v.008h-.008V13.5h.008zm0 2.25v.008h-.008V15.75h.008zm0 2.25v.008h-.008V18h.008zm-2.25-4.5v.008h-.008V13.5h.008zm0 2.25v.008h-.008V15.75h.008zm0 2.25v.008h-.008V18h.008zm4.5-2.25v.008h-.008V15.75h.008zm0 2.25v.008h-.008V18h.008z" />
                          </svg>
                        </div>
                      </div>
                      <button 
                        type="submit" 
                        className="bg-[#8B5E3C] hover:bg-[#734A2E] text-white px-6 py-3 rounded-xl font-bold text-sm shadow-xs transition-colors cursor-pointer"
                      >
                        Search
                      </button>
                    </div>
                  </form>

                  {/* Minimal Separator */}
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-px bg-gray-150"></div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">or</span>
                    <div className="flex-1 h-px bg-gray-150"></div>
                  </div>

                  {/* Paste Ingredients Form */}
                  <form onSubmit={handleManualIngredientSubmit} className="flex flex-col gap-2">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest text-left">
                      Paste Ingredient List Below
                    </label>
                    <textarea
                      value={manualIngredients}
                      onChange={(e) => setManualIngredients(e.target.value)}
                      placeholder="e.g. Chicken, Brown Rice, Barley, Natural Flavor, Sodium Selenite..."
                      className="w-full px-4 py-3.5 rounded-xl border border-[#E8DDD4] outline-none focus:ring-2 focus:ring-[#8B5E3C]/20 focus:border-[#8B5E3C] text-sm text-[#191919] bg-white h-28 resize-none transition-all placeholder:text-gray-300"
                    />
                    <button 
                      type="submit" 
                      className="w-full bg-[#8B5E3C] hover:bg-[#734A2E] text-white py-3.5 rounded-xl font-bold text-sm shadow-xs transition-colors cursor-pointer"
                    >
                      Analyze Ingredients
                    </button>
                  </form>
                </div>
              )}
            </div>
          ) : null}

          {(loading || ocrLoading) && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 border-4 border-[#E8DDD4] border-t-[#8B5E3C] rounded-full animate-spin mb-6"></div>
              <h3 className="text-[#191919] font-bold text-lg mb-2">{ocrLoading ? 'Reading Label...' : 'Analyzing Safety...'}</h3>
              <p className="text-gray-500 text-sm max-w-[240px] mx-auto">
                {ocrLoading ? 'Preprocessing image and sending to Google Cloud Vision...' : 'Checking ingredients and live FDA databases.'}
              </p>
            </div>
          )}
        </div>

        {/* ── OCR Review Step ── show extracted text before analysis ────────── */}
        {ocrReviewText && !product && !loading && !ocrLoading && (
          <div className="bg-white rounded-2xl border border-[#E8DDD4] shadow-sm p-6 space-y-4 animate-fade-in-up">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🔍</span>
              <p className="text-[11px] font-bold text-[#8B5E3C] uppercase tracking-widest">Text Extracted — Review Before Analysis</p>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">Check the text below matches what&apos;s on the label. Edit anything that looks wrong, then tap <strong>Analyze</strong>.</p>
            <textarea
              value={ocrReviewText}
              onChange={e => setOcrReviewText(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[#E8DDD4] outline-none focus:ring-2 focus:ring-[#8B5E3C] text-xs text-gray-700 font-mono h-36 resize-none leading-relaxed"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { processOCRResult(ocrReviewText); }}
                className="flex-1 bg-[#8B5E3C] text-white py-3 rounded-xl font-bold text-sm"
              >
                ✅ Analyze These Ingredients
              </button>
              <button
                onClick={() => { setOcrReviewText(''); resetScanner(); }}
                className="px-4 py-3 rounded-xl border border-[#E8DDD4] text-gray-500 text-sm font-bold"
              >
                Retake
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 p-6 rounded-2xl text-sm mb-6 text-center">
            <p className="font-bold mb-2 uppercase text-xs tracking-widest">Analysis Failed</p>
            <p className="mb-4 opacity-80">{error}</p>
            <button onClick={resetScanner} className="bg-white border border-red-200 text-red-600 px-6 py-2 rounded-full font-bold text-xs uppercase tracking-widest">Restart Camera</button>
          </div>
        )}

        {product && !loading && !ocrLoading && (
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
            ) : product.product_name !== 'Unknown Product' && (
              <div className="bg-[#DCFCE7] border-2 border-[#166534] rounded-2xl p-6 text-center">
                <div className="text-4xl mb-2">✅</div>
                <h3 className="text-[#166534] text-xl font-black uppercase">Safety Verified</h3>
                <p className="text-[#14532D] font-medium mt-1">No active recalls found for this product</p>
              </div>
            )}

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8DDD4]">
              <p className="text-[10px] uppercase tracking-widest text-[#8B5E3C] font-bold mb-1">Safety Report for</p>
              <h4 className="text-xl font-extrabold text-[#191919] mb-1">
                {product.product_name && product.product_name !== 'Custom Entry' && product.product_name !== 'Unknown Product' 
                  ? product.product_name 
                  : (product.brand && product.brand !== 'User Input' && product.brand !== 'Unknown Brand' 
                      ? product.brand 
                      : 'Safety Report')}
              </h4>
              {product.brand && product.brand !== 'User Input' && product.brand !== 'Camera Scan' && <p className="text-[#8B5E3C] font-bold mb-4">{product.brand}</p>}
              
              {safetyResults && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-bold text-[#191919]">Ingredient Grade</span>
                    <span className="text-3xl font-black" style={{ color: safetyResults.scoreColor }}>{safetyResults.score}</span>
                  </div>
                  <div className="space-y-3">
                    {safetyResults.flagged.length > 0 ? (
                      safetyResults.flagged.map((f, i) => (
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
                We&apos;ll email you instantly if {product.product_name && product.product_name !== 'Unknown Product' ? product.product_name : (product.brand || 'this product')} has a new FDA recall. Free service.
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
                      product_names: [product.product_name !== 'Unknown Product' ? product.product_name : (product.brand || 'Unknown Product')].filter(Boolean)
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
                  const productName = product.product_name && product.product_name !== 'Custom Entry' && product.product_name !== 'Unknown Product' ? product.product_name : product.brand;
                  const text = `${productName} scored ${safetyResults?.score || 'N/A'} for safety on Lumo Bites — is your pet's food safe? lumobites.net`;
                  if (navigator.share) navigator.share({ title: 'Lumo Bites Safety Report', text, url: 'https://lumobites.net/scan' });
                  else { navigator.clipboard.writeText(text); alert('Result copied!'); }
                }}
                className="w-full bg-white border border-[#E8DDD4] text-[#191919] py-4 rounded-full font-bold text-sm"
              >
                Share Safety Report
              </button>
              <button onClick={resetScanner} className="w-full bg-[#8B5E3C] text-white py-4 rounded-full font-bold text-sm">Scan Another</button>
              <Link href="/recalls" className="text-[#8B5E3C] font-bold text-xs text-center">View All FDA Recalls &rarr;</Link>
            </div>

            <p className="text-[10px] text-gray-400 text-center mt-6 leading-relaxed italic">
              Results based on FDA and ASPCA guidelines for informational purposes only. Always consult your veterinarian before changing your pet&apos;s diet.
            </p>
          </div>
        )}
      </main>

      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>

      <style jsx>{`
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
        .animate-fade-in-up { animation: fadeInUp 0.4s ease-out; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
