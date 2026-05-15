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
  const [manualBrand, setManualBrand] = useState('');
  const [safetyResults, setSafetyResults] = useState<{
    score: string;
    scoreColor: string;
    flagged: { info: IngredientInfo; match: string }[];
    counts: { dangerous: number; questionable: number; good: number; neutral: number };
  } | null>(null);
  
  const [isCameraStarted, setIsCameraStarted] = useState(false);
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
    const ctx = canvas.getContext('2d')!;

    // 1. Capture at 3x resolution
    const scale = 3;
    const srcW = video.videoWidth;
    const srcH = video.videoHeight;
    canvas.width = srcW * scale;
    canvas.height = srcH * scale;

    // 2. Draw original at high res
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // 3. Get pixel data and apply grayscale + contrast manually
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imgData.data;
    const contrast = 2.2; // >1 increases contrast
    const intercept = 128 * (1 - contrast);

    for (let i = 0; i < d.length; i += 4) {
      // Luminance-weighted grayscale
      const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      // Apply contrast
      const v = Math.min(255, Math.max(0, contrast * gray + intercept));
      d[i] = d[i + 1] = d[i + 2] = v;
      // d[i+3] alpha unchanged
    }
    ctx.putImageData(imgData, 0, 0);

    // 4. Sharpen with convolution kernel
    const sharpened = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const src = new Uint8ClampedArray(sharpened.data);
    const w = canvas.width;
    const h = canvas.height;
    // Sharpen kernel: [0,-1,0,-1,5,-1,0,-1,0]
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = (y * w + x) * 4;
        for (let c = 0; c < 3; c++) {
          const val =
            -src[((y - 1) * w + x) * 4 + c] +
            -src[(y * w + (x - 1)) * 4 + c] +
            5 * src[idx + c] +
            -src[(y * w + (x + 1)) * 4 + c] +
            -src[((y + 1) * w + x) * 4 + c];
          sharpened.data[idx + c] = Math.min(255, Math.max(0, val));
        }
      }
    }
    ctx.putImageData(sharpened, 0, 0);

    // 5. Crop center 80% where label text is most likely
    const cropX = Math.floor(canvas.width * 0.1);
    const cropY = Math.floor(canvas.height * 0.1);
    const cropW = Math.floor(canvas.width * 0.8);
    const cropH = Math.floor(canvas.height * 0.8);
    const cropped = ctx.getImageData(cropX, cropY, cropW, cropH);
    canvas.width = cropW;
    canvas.height = cropH;
    ctx.putImageData(cropped, 0, 0);

    return canvas.toDataURL('image/png');
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
      if (!video) throw new Error('Camera not active');

      if (scannerRef.current.isScanning) {
        await scannerRef.current.stop();
        setIsCameraStarted(false);
      }

      const imageData = preprocessCanvas(video);

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
      setOcrReviewText(cleaned);   // <-- show review step
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

  const checkBrandRecall = async (brand: string) => {
    setLoading(true);
    setOcrLoading(false);
    try {
      const res = await fetch(`https://api.fda.gov/food/enforcement.json?search=product_description:"${encodeURIComponent(brand)}"&limit=10`);
      const data = await res.json();
      const match = data.results?.find((r: any) => {
        const desc = (r.product_description || '').toLowerCase();
        const reason = (r.reason_for_recall || '').toLowerCase();
        const brandMatch = desc.includes(brand.toLowerCase());
        const isPetRelated = desc.includes('pet food') || desc.includes('dog food') || desc.includes('cat food') || desc.includes('animal feed') ||
                           reason.includes('pet food') || reason.includes('dog food') || reason.includes('cat food') || reason.includes('animal feed');
        return brandMatch && isPetRelated;
      });
      
      if (match) {
        setHasRecall(true);
        setRecallReason(match.reason_for_recall);
      }
      setProduct({ product_name: brand, brand: brand } as any);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
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
      <header className="bg-white border-b border-[#E8DDD4] p-4 flex items-center sticky top-0 z-50">
        <Link href="/" className="mr-4 text-[#8B5E3C]">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold text-[#191919]">Is This Food Safe?</h1>
      </header>

      <main className="max-w-md mx-auto p-6">
        <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-[#191919] mb-3">Is This Food Safe?</h2>
            <p className="text-gray-600 leading-relaxed text-sm">Scan barcode or ingredient list for instant safety analysis + live FDA recall check</p>
        </div>

        {/* Search / Scan UI */}
        <div className={(!product && !loading && !ocrLoading) ? 'block space-y-6' : 'hidden'}>
          <div className="relative">
            <div className="bg-white rounded-3xl p-4 shadow-sm border border-[#E8DDD4] overflow-hidden">
              <div id="reader" className="w-full"></div>
            </div>
            
            {isCameraStarted && (
              <div className="absolute bottom-6 left-0 right-0 flex justify-center px-6 z-10">
                <button 
                  onClick={captureAndOCR}
                  className="bg-[#8B5E3C] text-white px-8 py-4 rounded-full font-bold shadow-xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
                >
                  <span className="text-xl">📸</span>
                  Capture & Analyze
                </button>
              </div>
            )}
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-400 mb-6 font-medium italic">Point at barcode OR ingredient list on back of package</p>
            
            <div className="bg-white p-6 rounded-3xl border border-[#E8DDD4] shadow-sm mb-6">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 text-left">Or enter brand name manually</label>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (manualBrand.trim()) checkBrandRecall(manualBrand.trim());
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={manualBrand}
                  onChange={(e) => setManualBrand(e.target.value)}
                  placeholder="e.g. Wellness, Purina..."
                  className="flex-1 px-4 py-3 rounded-xl border border-[#E8DDD4] outline-none focus:ring-2 focus:ring-[#8B5E3C] text-sm"
                />
                <button type="submit" className="bg-[#8B5E3C] text-white px-6 py-3 rounded-xl font-bold text-sm">Check Recalls</button>
              </form>
            </div>

            <form onSubmit={handleBarcodeSubmit} className="mt-4">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 text-left">Manual Barcode Entry</label>
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

        {(loading || ocrLoading) && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 border-4 border-[#E8DDD4] border-t-[#8B5E3C] rounded-full animate-spin mb-6"></div>
            <h3 className="text-[#191919] font-bold text-lg mb-2">{ocrLoading ? 'Reading Label...' : 'Analyzing Safety...'}</h3>
            <p className="text-gray-500 text-sm max-w-[240px] mx-auto">
              {ocrLoading ? 'Preprocessing image and sending to Google Cloud Vision...' : 'Checking ingredients and live FDA databases.'}
            </p>
          </div>
        )}

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
            {/* Inline Brand Search if Product Not Found */}
            {product.product_name === 'Unknown Product' && (
              <div className="bg-[#FDFAF7] border border-[#E8DDD4] rounded-2xl p-6">
                <p className="text-xs font-bold text-[#8B5E3C] uppercase mb-2">Manual Brand Check</p>
                <p className="text-sm text-gray-600 mb-4">We couldn&apos;t find this exact product. Enter the brand name below to check for active FDA recalls.</p>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const b = (e.target as any).brand.value;
                    if (b) checkBrandRecall(b);
                  }}
                  className="flex gap-2"
                >
                  <input name="brand" placeholder="e.g. Purina" className="flex-1 px-4 py-2 rounded-xl border border-[#E8DDD4] outline-none text-sm" />
                  <button type="submit" className="bg-[#8B5E3C] text-white px-4 py-2 rounded-xl font-bold text-sm">Check</button>
                </form>
              </div>
            )}

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
