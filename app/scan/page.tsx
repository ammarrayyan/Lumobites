'use client';

import { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import Link from 'next/link';
import { Product, ScoredProduct, PetProfile } from '@/lib/types';
import confetti from 'canvas-confetti';
import Navbar from '@/components/Navbar';
import MobileFoodNav from '@/components/MobileFoodNav';
import AmazonProductCard, { AmazonProductCardSkeleton, AmazonProduct } from '@/components/AmazonProductCard';
import { Search, Check, AlertTriangle, CheckCircle2, Leaf, Bell, Sparkles, ArrowRight, Footprints, Mail } from 'lucide-react';

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
    grade: string;
    dangerous: { name: string; reason: string }[];
    concerning: { name: string; reason: string }[];
    safe: { name: string }[];
    summary: string;
  } | null>(null);

  // Stripe & subscription state
  const [isPro, setIsPro] = useState(false);
  const [proEmail, setProEmail] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [modalEmail, setModalEmail] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalMessage, setModalMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [verifyingSession, setVerifyingSession] = useState(false);
  const [modalStep, setModalStep] = useState<'paywall' | 'upgrade_email' | 'restore_email' | 'verification' | 'already_pro'>('paywall');
  const [verificationCode, setVerificationCode] = useState('');
  const [showProMenu, setShowProMenu] = useState(false);

  // Recall subscription states inside scan results
  const [recallSubscribed, setRecallSubscribed] = useState(false);
  const [recallSubmitting, setRecallSubmitting] = useState(false);
  const [recallSubError, setRecallSubError] = useState('');
  const [recallSuccessMsg, setRecallSuccessMsg] = useState('');

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
  
  const [isCameraStarted, setIsCameraStarted] = useState(false);
  const [activeTab, setActiveTab] = useState<'scanner' | 'manual'>('scanner');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load and verify Pro status on page mount
  useEffect(() => {
    const syncStatus = () => {
      const cachedEmail = localStorage.getItem('lumo_pro_email');
      const isAdminBypass = localStorage.getItem('lumo_admin_bypass') === 'true';
      const isOwnerEmail = cachedEmail?.toLowerCase().trim() === 'premierpetnutritionllc@gmail.com' || cachedEmail?.toLowerCase().trim() === 'reviewer@lumobites.net';
      
      if (isAdminBypass || isOwnerEmail) {
        setIsPro(true);
        setProEmail(cachedEmail || 'admin@lumobites.com');
      } else if (cachedEmail && cachedEmail !== 'undefined' && cachedEmail !== 'null' && cachedEmail.trim() !== '') {
        setIsPro(true);
        setProEmail(cachedEmail);
      } else {
        setIsPro(false);
        setProEmail('');
      }
    };

    syncStatus();
    window.addEventListener('lumo-pro-update', syncStatus);
    window.addEventListener('storage', syncStatus);

    const searchParams = new URLSearchParams(window.location.search);
    const sessionId = searchParams.get('session_id');
    const emailParam = searchParams.get('email');
    const adminParam = searchParams.get('admin');

    console.log('[Lumo Subscription] Page mounted. Checking subscription status...');

    if (adminParam === process.env.NEXT_PUBLIC_ADMIN_BYPASS_KEY) {
      console.log('[Lumo Subscription] Admin bypass activated via URL parameter.');
      setIsPro(true);
      setProEmail('admin@lumobites.com');
      localStorage.setItem('lumo_pro_email', 'admin@lumobites.com');
      localStorage.setItem('lumo_admin_bypass', 'true');
      window.dispatchEvent(new Event('lumo-pro-update'));
      
      try {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch (e) {}
      
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (sessionId) {
      console.log('[Lumo Subscription] Found Stripe session_id in URL:', sessionId);
      setVerifyingSession(true);
      fetch(`/api/stripe/verify-session?session_id=${sessionId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.isPro) {
            console.log('[Lumo Subscription] Session verified. User email:', data.email);
            setIsPro(true);
            const userEmail = data.email || emailParam || '';
            setProEmail(userEmail);
            localStorage.setItem('lumo_pro_email', userEmail);
            localStorage.removeItem('lumo_admin_bypass');
            window.dispatchEvent(new Event('lumo-pro-update'));
            
            try {
              confetti({
                particleCount: 150,
                spread: 80,
                origin: { y: 0.6 }
              });
            } catch (e) {}
          } else {
            console.warn('[Lumo Subscription] Session verification returned not pro or failed:', data);
          }
        })
        .catch(err => console.error('[Lumo Subscription] Verification error:', err))
        .finally(() => {
          setVerifyingSession(false);
          window.history.replaceState({}, document.title, window.location.pathname);
        });
    } else {
      const cachedEmail = localStorage.getItem('lumo_pro_email');
      const isAdminBypass = localStorage.getItem('lumo_admin_bypass') === 'true';
      console.log('[Lumo Subscription] Retrieved cached email from localStorage:', cachedEmail, 'isAdminBypass:', isAdminBypass);
      
      const isOwnerEmail = cachedEmail?.toLowerCase().trim() === 'premierpetnutritionllc@gmail.com' || cachedEmail?.toLowerCase().trim() === 'reviewer@lumobites.net';
      
      if (isAdminBypass || isOwnerEmail) {
        console.log('[Lumo Subscription] Admin/Owner bypass detected in localStorage. Activating Pro status.');
        setIsPro(true);
        setProEmail(cachedEmail || 'admin@lumobites.com');
      } else if (cachedEmail && cachedEmail !== 'undefined' && cachedEmail !== 'null' && cachedEmail.trim() !== '') {
        console.log('[Lumo Subscription] Active cached email found. Activating optimistic Pro state.');
        setProEmail(cachedEmail);
        setIsPro(true);
        
        console.log('[Lumo Subscription] Syncing status with database for email:', cachedEmail);
        fetch('/api/stripe/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cachedEmail })
        })
        .then(res => res.json())
        .then(data => {
          console.log('[Lumo Subscription] Database status reply:', data);
          if (data.isPro) {
            setIsPro(true);
            window.dispatchEvent(new Event('lumo-pro-update'));
            console.log('[Lumo Subscription] Pro status confirmed by Supabase.');
          } else {
            setIsPro(false);
            localStorage.removeItem('lumo_pro_email');
            window.dispatchEvent(new Event('lumo-pro-update'));
            console.log('[Lumo Subscription] Pro status rejected by Supabase. Downgraded to free tier.');
          }
        })
        .catch((err) => {
          console.error('[Lumo Subscription] Failed to sync status with Supabase:', err);
        });
      } else {
        setIsPro(false);
      }
    }

    return () => {
      window.removeEventListener('lumo-pro-update', syncStatus);
      window.removeEventListener('storage', syncStatus);
    };
  }, []);

  // Limit checker: returns true if allowed to scan, false if blocked (shows modal)
  const checkScanLimit = (): boolean => {
    console.log('[Lumo Scan Limit] Evaluating checkScanLimit. Current isPro state:', isPro);
    if (isPro) {
      console.log('[Lumo Scan Limit] User is PRO. Bypassing scan checks.');
      return true;
    }

    try {
      const countStr = localStorage.getItem('lumo_scan_count');
      const dateStr = localStorage.getItem('lumo_scan_date');
      
      // Robust local timezone date string formatter (YYYY-MM-DD)
      const d = new Date();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const today = `${year}-${month}-${day}`;

      let count = countStr ? parseInt(countStr, 10) : 0;
      console.log(`[Lumo Scan Limit] Read from localStorage - count: ${count}, date: ${dateStr}, today: ${today}`);

      if (dateStr !== today) {
        console.log('[Lumo Scan Limit] Midnight reset triggered (date mismatch). Resetting scan count to 0.');
        count = 0;
      }

      if (count >= 1) {
        console.log('[Lumo Scan Limit] Limit exceeded! Displaying the Pro Upgrade Modal.');
        setShowUpgradeModal(true);
        return false;
      }

      console.log('[Lumo Scan Limit] Under limit. Access granted.');
      return true;
    } catch (err) {
      console.error('[Lumo Scan Limit] Error reading scan limit from localStorage:', err);
      // Fallback: allow scan in case localStorage is disabled
      return true;
    }
  };

  // Record scan usage
  const recordScanUsage = () => {
    if (isPro) {
      console.log('[Lumo Scan Limit] Pro user, skipping scan usage recording.');
      return;
    }

    try {
      // Robust local timezone date string formatter (YYYY-MM-DD)
      const d = new Date();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const today = `${year}-${month}-${day}`;

      const countStr = localStorage.getItem('lumo_scan_count');
      let count = countStr ? parseInt(countStr, 10) : 0;
      const dateStr = localStorage.getItem('lumo_scan_date');

      if (dateStr !== today) {
        count = 0;
      }

      const newCount = count + 1;
      localStorage.setItem('lumo_scan_count', newCount.toString());
      localStorage.setItem('lumo_scan_date', today);
      console.log(`[Lumo Scan Limit] Recorded scan. New count: ${newCount}, date: ${today}`);
    } catch (err) {
      console.error('[Lumo Scan Limit] Error writing scan limit to localStorage:', err);
    }
  };

  // Dedicated, bulletproof camera cleanup when the component unmounts completely
  useEffect(() => {
    return () => {
      console.log('[Lumo Scan] ScanPage unmounting, double-checking that all camera tracks are stopped.');
      try {
        if (typeof window !== 'undefined') {
          const videos = document.querySelectorAll('video');
          videos.forEach(video => {
            const stream = video.srcObject as MediaStream;
            if (stream && typeof stream.getTracks === 'function') {
              stream.getTracks().forEach(track => {
                track.stop();
                console.log('[Lumo Scan] Unmount cleanup: track stopped:', track.label);
              });
            }
          });
        }
      } catch (e) {
        console.error('[Lumo Scan] Unmount tracks cleanup error:', e);
      }
    };
  }, []);

  // Ref to hold the latest scan success callback to prevent stale closures
  const onScanSuccessRef = useRef(onScanSuccess);
  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess;
  });

  useEffect(() => {
    let active = true;

    // Ensure the container is completely empty to avoid duplicate/stacked video rendering in React Strict Mode
    try {
      const container = document.getElementById('reader');
      if (container) {
        container.innerHTML = '';
      }
    } catch (e) {}

    const html5QrCode = new Html5Qrcode("reader");
    scannerRef.current = html5QrCode;

    const startScanner = async () => {
      try {
        // Short timeout allows previous elements/streams to detach cleanly
        await new Promise(r => setTimeout(r, 100));
        if (!active) return;

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            // Read from the ref to always get the freshest callback execution context
            onScanSuccessRef.current(decodedText);
          },
          onScanFailure
        );
        
        if (active) {
          setIsCameraStarted(true);
        } else {
          html5QrCode.stop().catch(() => {});
        }
      } catch (err) {
        console.error("Unable to start scanning", err);
      }
    };

    startScanner();

    return () => {
      active = false;
      console.log('[Lumo Scan] Cleaning up scanner and stopping all active camera tracks...');
      
      const stopAllTracks = () => {
        try {
          if (typeof window !== 'undefined') {
            const videos = document.querySelectorAll('video');
            videos.forEach(video => {
              const stream = video.srcObject as MediaStream;
              if (stream && typeof stream.getTracks === 'function') {
                stream.getTracks().forEach(track => {
                  track.stop();
                  console.log('[Lumo Scan] Camera track stopped:', track.label);
                });
              }
            });
          }
        } catch (err) {
          console.error('[Lumo Scan] Error stopping tracks:', err);
        }
      };

      if (html5QrCode.isScanning) {
        html5QrCode.stop()
          .then(() => {
            console.log('[Lumo Scan] Scanner stopped successfully.');
          })
          .catch(err => {
            console.error('[Lumo Scan] Failed to stop scanner:', err);
          })
          .finally(() => {
            stopAllTracks();
          });
      } else {
        stopAllTracks();
      }
    };
  }, []); // Empty dependency array ensures we only initialize the scanner ONCE on mount

  async function onScanSuccess(decodedText: string) {
    if (loading || ocrLoading) return;
    
    console.log('[Lumo Scan Limit] Barcode scanned by camera:', decodedText);
    
    const stopAllTracks = () => {
      try {
        const videos = document.querySelectorAll('video');
        videos.forEach(video => {
          const stream = video.srcObject as MediaStream;
          if (stream && typeof stream.getTracks === 'function') {
            stream.getTracks().forEach(track => track.stop());
          }
        });
      } catch (e) {}
    };

    if (!checkScanLimit()) {
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            await scannerRef.current.stop();
          }
          setIsCameraStarted(false);
          stopAllTracks();
        } catch (e) {}
      }
      return;
    }

    recordScanUsage();

    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        setIsCameraStarted(false);
        stopAllTracks();
      } catch (e) {}
    }

    setScannedResult(decodedText);
    lookupProduct(decodedText, true);
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

    const stopAllTracks = () => {
      try {
        const videos = document.querySelectorAll('video');
        videos.forEach(video => {
          const stream = video.srcObject as MediaStream;
          if (stream && typeof stream.getTracks === 'function') {
            stream.getTracks().forEach(track => track.stop());
          }
        });
      } catch (e) {}
    };

    if (!checkScanLimit()) {
      if (scannerRef.current.isScanning) {
        await scannerRef.current.stop().catch(() => {});
        setIsCameraStarted(false);
        stopAllTracks();
      }
      return;
    }

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
        stopAllTracks();
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
      
      const normalized = cleaned.toLowerCase();
      const ingredientKeywords = ['chicken', 'beef', 'rice', 'corn', 'wheat', 'salmon', 'turkey', 'lamb',
        'protein', 'fat', 'fiber', 'ingredients', 'meal', 'extract', 'oil', 'vitamin', 'mineral', 'salt'];
      const hasIngredientKeywords = ingredientKeywords.some(w => normalized.includes(w));
      const commaCount = (cleaned.match(/,/g) || []).length;

      if (!cleaned.trim() || !(hasIngredientKeywords || commaCount > 2 || cleaned.length > 40)) {
        throw new Error('Could not clearly identify an ingredient list. Please ensure you are scanning the back of the pet food package under good lighting, or paste ingredients manually below.');
      }

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
    if (!checkScanLimit()) return;
    recordScanUsage();

    const normalized = text.toLowerCase();
    const ingredientKeywords = ['chicken', 'beef', 'rice', 'corn', 'wheat', 'salmon', 'turkey', 'lamb',
      'protein', 'fat', 'fiber', 'ingredients', 'meal', 'extract', 'oil', 'vitamin', 'mineral', 'salt'];
    const hasIngredientKeywords = ingredientKeywords.some(w => normalized.includes(w));
    const commaCount = (text.match(/,/g) || []).length;

    if (hasIngredientKeywords || commaCount > 2 || text.length > 40) {
      setProduct({ product_name: 'Scanned Ingredients', brand: 'Camera Scan', ingredients: text } as any);
      analyzeIngredients(text, false, true);
    } else {
      setError('Could not clearly identify an ingredient list. Please point at the back of the package or paste manually below.');
    }
  };



  async function lookupProduct(barcode: string, skipLimitCheck: boolean = false) {
    if (!skipLimitCheck) {
      if (!checkScanLimit()) return;
      recordScanUsage();
    }

    setLoading(true);
    setError(null);
    setProduct(null);
    setSafetyResults(null);
    setHasRecall(false);
    setRecallReason('');
    
    try {
      const res = await fetch(`/api/scan/${barcode}`);
      const data = await res.json();
      
      if (!res.ok || !data || !data.product) {
        throw new Error(data?.error || "Barcode not recognized. We couldn't find this product in our database. Please scan the ingredients list on the back of the package instead, or enter them manually.");
      } else {
        setProduct(data.product);
        setHasRecall(data.hasRecall);
        setRecallReason(data.recallReason);
        if (data.product.ingredients) {
          await analyzeIngredients(data.product.ingredients, data.hasRecall, true);
        } else {
          throw new Error("Product found in database, but it has no ingredients list. Please scan the ingredients list on the back of the package instead, or enter them manually.");
        }
      }
    } catch (err: any) {
      setError(err.message || "Barcode not recognized. We couldn't find this product in our database. Please scan the ingredients list on the back of the package instead, or enter them manually.");
    } finally {
      setLoading(false);
    }
  }

  async function analyzeIngredients(text: string, recallActive: boolean = false, skipLimitCheck: boolean = false) {
    if (!text) return;
    if (!skipLimitCheck) {
      if (!checkScanLimit()) return;
      recordScanUsage();
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients: text })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to analyze ingredients');
      }
      
      let finalGrade = data.grade || 'C';
      if (recallActive) {
        finalGrade = 'F';
      }
      
      setSafetyResults({
        grade: finalGrade,
        dangerous: data.dangerous || [],
        concerning: data.concerning || [],
        safe: data.safe || [],
        summary: data.summary || ''
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error analyzing ingredients with Claude AI.');
    } finally {
      setLoading(false);
    }
  }

  const handleManualIngredientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualIngredients.trim()) return;
    
    console.log('[Lumo Scan Limit] Manual ingredients submitted');
    if (!checkScanLimit()) return;
    recordScanUsage();
    
    setProduct({ product_name: 'Custom Entry', brand: 'User Input', ingredients: manualIngredients } as any);
    await analyzeIngredients(manualIngredients, false, true);
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualBarcode.trim()) {
      console.log('[Lumo Scan Limit] Manual barcode submitted:', manualBarcode.trim());
      if (!checkScanLimit()) return;
      recordScanUsage();
      lookupProduct(manualBarcode.trim(), true);
    }
  };

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalEmail.trim()) {
      setModalMessage({ text: 'Please enter a valid email address.', isError: true });
      return;
    }
    
    setModalLoading(true);
    setModalMessage(null);
    
    try {
      const res = await fetch('/api/stripe/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: modalEmail })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send verification code');
      }
      
      setModalStep('verification');
      setModalMessage({ text: 'Verification code sent! Please check your email.', isError: false });
    } catch (err: any) {
      console.error(err);
      setModalMessage({ text: err.message || 'Something went wrong. Please try again.', isError: true });
      setModalLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!modalEmail.trim()) {
      setModalMessage({ text: 'Please enter your email to restore your subscription.', isError: true });
      return;
    }
    
    setModalLoading(true);
    setModalMessage(null);
    
    try {
      const res = await fetch('/api/stripe/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: modalEmail })
      });
      
      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'not_pro') {
          throw new Error('not_pro');
        }
        throw new Error(data.error || 'Failed to send verification code');
      }
      
      setModalStep('verification');
      setModalMessage({ text: 'Verification code sent! Please check your email.', isError: false });
    } catch (err: any) {
      console.error(err);
      setModalMessage({ text: err.message || 'Could not send verification code. Try again later.', isError: true });
    } finally {
      setModalLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode.trim() || verificationCode.length !== 6) {
      setModalMessage({ text: 'Please enter a valid 6-digit verification code.', isError: true });
      return;
    }

    setModalLoading(true);
    setModalMessage(null);

    try {
      const res = await fetch('/api/stripe/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: modalEmail, code: verificationCode })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to verify code');
      }

      if (data.isPro) {
        setIsPro(true);
        setProEmail(modalEmail);
        localStorage.setItem('lumo_pro_email', modalEmail);
        localStorage.removeItem('lumo_admin_bypass');
        window.dispatchEvent(new Event('lumo-pro-update'));
        setShowUpgradeModal(false);
        setModalStep('paywall');
        setVerificationCode('');

        try {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch (e) {}

        if (data.existed) {
          alert('Welcome back! ✨');
        } else {
          alert('Account created! 🐾');
        }
      } else {
        setModalMessage({ text: 'Could not restore account status. Please try again.', isError: true });
      }
    } catch (err: any) {
      console.error(err);
      setModalMessage({ text: err.message || 'Could not verify code. Please try again.', isError: true });
    } finally {
      setModalLoading(false);
    }
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
    setRecallSubscribed(false);
    setRecallSubError('');
    setRecallSuccessMsg('');

    const stopAllTracks = () => {
      try {
        const videos = document.querySelectorAll('video');
        videos.forEach(video => {
          const stream = video.srcObject as MediaStream;
          if (stream && typeof stream.getTracks === 'function') {
            stream.getTracks().forEach(track => track.stop());
          }
        });
      } catch (e) {}
    };
    
    setTimeout(async () => {
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            await scannerRef.current.stop();
            stopAllTracks();
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
    <div className="min-h-screen bg-[#FDFAF7] pb-12 pt-[52px] md:pt-0">
      <Navbar />
      <MobileFoodNav />

      <main className="max-w-2xl mx-auto p-4 md:p-8 flex flex-col items-center justify-center min-h-[calc(100vh-120px)]">
        <canvas ref={canvasRef} className="hidden" />

        {/* Outer Premium Card Container */}
        <div className="w-full max-w-[650px] bg-white rounded-3xl border border-[#EEEEEE] shadow-[0_12px_40px_rgba(0,0,0,0.03)] p-6 md:p-10 flex flex-col gap-6">
          
          {/* Header Title Section */}
          <div className="text-center flex flex-col items-center">
            {/* Sparkle Badge */}
            {isPro ? (
              <div className="hidden md:inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-yellow-600 border border-amber-400 text-white text-[11px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full mb-3 shadow-md">
                <Sparkles className="w-3.5 h-3.5 text-white" /> Lumo Bites Member
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 bg-[#8B5E3C]/5 border border-[#8B5E3C]/10 text-[#8B5E3C] text-[11px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full mb-3 shadow-xs">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-[#8B5E3C]">
                  <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.6 3.102-1.196 4.622c-.21.81.67 1.45 1.366 1.012L10 15.71l4.217 2.341c.697.438 1.577-.202 1.366-1.012l-1.196-4.622 3.6-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
                </svg>
                Live FDA Safety Check
              </div>
            )}
            
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
              <h3 className="text-[#191919] font-bold text-lg mb-2 flex items-center justify-center gap-1.5">
                {ocrLoading ? 'Reading Label...' : (
                  <>
                    <Search className="w-5 h-5 text-[#8B5E3C] animate-pulse" />
                    Analyzing ingredients with AI...
                  </>
                )}
              </h3>
              <p className="text-gray-500 text-sm max-w-[280px] mx-auto leading-relaxed">
                {ocrLoading 
                  ? 'Preprocessing image and sending to Google Cloud Vision...' 
                  : 'Claude AI is evaluating ingredient safety against veterinary & FDA guidelines.'}
              </p>
            </div>
          )}
        </div>

        {/* ── OCR Review Step ── show extracted text before analysis ────────── */}
        {ocrReviewText && !product && !loading && !ocrLoading && (
          <div className="bg-white rounded-2xl border border-[#E8DDD4] shadow-sm p-6 space-y-4 animate-fade-in-up">
            <div className="flex items-center gap-2 mb-1">
              <Search className="w-5 h-5 text-[#8B5E3C]" />
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
                className="flex-1 bg-[#8B5E3C] text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Analyze These Ingredients
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
                    <AlertTriangle className="w-8 h-8 text-red-600 shrink-0" />
                    <h3 className="text-[#991B1B] text-xl font-black leading-tight uppercase">WARNING: Recall Active</h3>
                </div>
                <p className="text-[#B91C1C] font-bold mb-4">This product or brand has an active FDA recall!</p>
                <div className="bg-white/50 rounded-xl p-4 text-[#7F1D1D] text-sm">
                    <p className="mb-2"><strong>Reason:</strong> {recallReason}</p>
                    <p className="text-xs opacity-75">Check the full details on our <Link href="/recalls" className="underline font-bold">Recall Alerts</Link> page.</p>
                </div>
              </div>
            ) : product.product_name !== 'Unknown Product' && (
              <div className="bg-[#DCFCE7] border-2 border-[#166534] rounded-2xl p-6 text-center flex flex-col items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mb-2" />
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
                <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-5 text-left">
                  {/* Premium Badge & Summary */}
                  <div className="flex items-center gap-4 bg-[#F8F6F4] p-4 rounded-2xl border border-gray-100/80 shadow-3xs">
                    <div 
                      className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-black text-white shrink-0 shadow-sm"
                      style={{ backgroundColor: getGradeColor(safetyResults.grade) }}
                    >
                      {safetyResults.grade}
                    </div>
                    <div className="flex-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">AI Safety Grade</span>
                      <p className="text-xs text-gray-700 font-bold leading-normal mt-0.5">
                        {safetyResults.summary}
                      </p>
                    </div>
                  </div>

                  {/* Detailed Analysis Breakdown */}
                  <div className="space-y-4">
                    {/* 🔴 Dangerous Ingredients */}
                    {safetyResults.dangerous.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-xs font-bold text-red-600 uppercase tracking-wider flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                          Dangerous Ingredients ({safetyResults.dangerous.length})
                        </h5>
                        <div className="space-y-1.5">
                          {safetyResults.dangerous.map((item, i) => (
                            <div key={i} className="p-3 bg-red-50/70 border border-red-100/50 rounded-xl text-xs flex flex-col gap-1 shadow-3xs">
                              <span className="font-extrabold text-red-950 uppercase">{item.name}</span>
                              <p className="text-red-800 leading-relaxed font-medium">{item.reason}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 🟡 Concerning Ingredients */}
                    {safetyResults.concerning.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                          Concerning Ingredients ({safetyResults.concerning.length})
                        </h5>
                        <div className="space-y-1.5">
                          {safetyResults.concerning.map((item, i) => (
                            <div key={i} className="p-3 bg-amber-50/70 border border-amber-100/50 rounded-xl text-xs flex flex-col gap-1 shadow-3xs">
                              <span className="font-extrabold text-amber-950 uppercase">{item.name}</span>
                              <p className="text-amber-800 leading-relaxed font-medium">{item.reason}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 🟢 Safe Ingredients */}
                    {safetyResults.safe.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
                          <Leaf className="w-4 h-4 text-emerald-500 shrink-0" />
                          Safe & Beneficial ({safetyResults.safe.length})
                        </h5>
                        <div className="flex flex-wrap gap-1.5 p-3 bg-emerald-50/30 border border-emerald-100/30 rounded-xl max-h-40 overflow-y-auto">
                          {safetyResults.safe.map((item, i) => (
                            <span key={i} className="px-2.5 py-1 bg-white text-emerald-800 border border-emerald-100/50 rounded-lg text-[10px] font-bold shadow-3xs">
                              ✓ {item.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Perfect Score State */}
                    {safetyResults.dangerous.length === 0 && safetyResults.concerning.length === 0 && (
                      <div className="bg-emerald-50/60 border border-emerald-100/50 text-emerald-800 p-5 rounded-2xl text-center shadow-3xs">
                        <p className="font-bold text-sm uppercase tracking-wide">Excellent Ingredient Quality! 🎉</p>
                        <p className="text-xs text-emerald-700 mt-1 leading-normal">Claude AI did not identify any dangerous or concerning ingredients in this recipe.</p>
                      </div>
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

              {/* ── Find on Amazon ── */}
              <AmazonFindBlock product={product} />
            </div>


            <div className="bg-[#191919] rounded-2xl p-6 text-white border border-[#333]">
              <h4 className="font-bold mb-2 flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-[#8B5E3C]" />
                Stay Protected
              </h4>
              <p className="text-xs text-gray-400 mb-4">
                We&apos;ll email you instantly if {product.product_name && product.product_name !== 'Unknown Product' ? product.product_name : (product.brand || 'this product')} has a new FDA recall. Members get instant alerts.
              </p>
              {!recallSubscribed ? (
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!isPro) {
                      setRecallSubError("Email recall alerts require a free account. Please create one to subscribe.");
                      return;
                    }
                    setRecallSubmitting(true);
                    setRecallSubError('');
                    try {
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
                      if (res.ok && data.success) {
                        setRecallSubscribed(true);
                        setRecallSuccessMsg(data.message || "Successfully subscribed to recall alerts!");
                      } else {
                        setRecallSubError(data.error || "Something went wrong. Please try again.");
                      }
                    } catch {
                      setRecallSubError("Network error. Please try again.");
                    } finally {
                      setRecallSubmitting(false);
                    }
                  }}
                  className="flex flex-col gap-2"
                >
                  <div className="flex gap-2">
                    <input 
                      name="email"
                      type="email" 
                      placeholder="your@email.com" 
                      required
                      disabled={recallSubmitting}
                      className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-sm outline-none focus:border-white/40 text-white"
                    />
                    <button 
                      type="submit" 
                      disabled={recallSubmitting} 
                      className="bg-[#8B5E3C] hover:bg-[#734A2E] text-white px-4 py-2 rounded-lg text-sm font-bold shrink-0 transition-colors"
                    >
                      {recallSubmitting ? 'Saving…' : 'Alert Me'}
                    </button>
                  </div>
                  {recallSubError && (
                    <div className="mt-2">
                      <p className="text-red-400 text-xs font-semibold leading-relaxed">{recallSubError}</p>
                      {!isPro && recallSubError.includes('PRO feature') && (
                        <Link
                          href="/account"
                          className="inline-block mt-2 bg-[#8B5E3C] hover:bg-[#734A2E] text-white py-1.5 px-4 rounded-full text-[11px] font-bold transition-all shadow-sm"
                          style={{ textDecoration: 'none' }}
                        >
                          Upgrade to PRO ✨
                        </Link>
                      )}
                    </div>
                  )}
                </form>
              ) : (
                <div className="inline-flex items-center gap-1.5 bg-emerald-950/40 text-emerald-400 border border-emerald-800/35 px-3 py-2 rounded-lg font-semibold text-xs w-full justify-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  {recallSuccessMsg}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={() => {
                  const productName = product.product_name && product.product_name !== 'Custom Entry' && product.product_name !== 'Unknown Product' ? product.product_name : product.brand;
                  const text = `${productName} received a grade of ${safetyResults?.grade || 'N/A'} for safety on Lumo Bites — is your pet's food safe? lumobites.net`;
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

      {/* ── VERIFYING SESSION SPINNER ── */}
      {verifyingSession && (
        <div className="modal-overlay fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-[99999] animate-fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-gray-100 flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-12 h-12 border-4 border-[#E8DDD4] border-t-[#8B5E3C] rounded-full animate-spin mb-2"></div>
            <h3 className="text-lg font-black text-[#191919]">Verifying Subscription...</h3>
            <p className="text-xs text-gray-500">Securing your premium credentials from Stripe. Hold tight!</p>
          </div>
        </div>
      )}

      {/* ── UPGRADE TO PRO MODAL ── */}
      {showUpgradeModal && (
        <div className="modal-overlay fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-fade-in">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-gray-100 flex flex-col gap-6 relative animate-scale-up text-center">
            
            {!modalLoading && (
              <button 
                onClick={() => {
                  setShowUpgradeModal(false);
                  setModalStep('paywall');
                  setModalMessage(null);
                  setVerificationCode('');
                }}
                className="absolute right-5 top-5 text-gray-400 hover:text-gray-600 font-extrabold text-lg cursor-pointer"
              >
                ✕
              </button>
            )}

            {isPro ? (
              <div className="flex flex-col gap-5 py-4">
                <div>
                  <Sparkles className="w-10 h-10 text-amber-500 mx-auto mb-3" />
                  <h3 className="text-2xl font-black text-[#191919] leading-tight text-center">
                    You are a Member!
                  </h3>
                  <p className="text-sm text-gray-500 mt-2 font-medium text-center">
                    Thank you for supporting Lumo Bites. You have unlimited scans and full safety analysis active.
                  </p>
                </div>
                <Link
                  href="/account"
                  className="w-full bg-[#8B5E3C] hover:bg-[#734A2E] text-white py-3.5 rounded-xl font-bold text-sm shadow-md transition-colors cursor-pointer text-center"
                  style={{ textDecoration: 'none' }}
                >
                  Manage Account
                </Link>
              </div>
            ) : (
              <>
                <div>
                  <Search className="w-10 h-10 text-[#8B5E3C] mx-auto mb-3" />
                  <h3 className="text-2xl font-black text-[#191919] leading-tight text-center">
                    You&apos;ve used your free scan today
                  </h3>
                  <p className="text-sm text-gray-500 mt-2 font-medium text-center">
                    Create a free account for unlimited scans
                  </p>
                </div>

                <div className="bg-[#FAF6F4] border border-[#8B5E3C]/10 rounded-2xl py-3 px-4 inline-block mx-auto text-center">
                  <span className="text-[#8B5E3C] font-extrabold text-base md:text-lg">Free Early Access Account 🐾</span>
                </div>

                <div className="bg-gray-50/60 rounded-2xl p-4 text-left border border-gray-100">
                  <ul className="space-y-2.5 text-xs text-gray-700 font-bold">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" /> Unlimited ingredient scans
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" /> Instant FDA email recall alerts
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" /> Detailed AI safety reports
                    </li>
                  </ul>
                </div>

                {modalStep === 'paywall' && (
                  <div className="flex flex-col gap-4 mt-2">
                      <button
                        onClick={() => {
                          setModalStep('upgrade_email');
                          setModalMessage(null);
                        }}
                        className="w-full bg-[#8B5E3C] hover:bg-[#734A2E] text-white py-3.5 rounded-xl font-bold text-sm shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
                      >
                        Create Free Account
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowUpgradeModal(false);
                          window.dispatchEvent(new Event('lumo-open-signin'));
                        }}
                        className="w-full bg-white border-2 border-[#E8DDD4] hover:border-[#8B5E3C] text-[#8B5E3C] py-3.5 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                      >
                        Already have an account? Sign in to access your account →
                      </button>

                      <div className="flex flex-col gap-2.5 mt-1">
                        <button 
                          type="button"
                          onClick={() => {
                            setModalStep('restore_email');
                            setModalMessage(null);
                          }}
                          className="text-xs text-[#8B5E3C]/80 hover:text-[#8B5E3C] font-semibold hover:underline bg-transparent border-none cursor-pointer"
                        >
                          Already have an account? Sign in
                        </button>
                      <span className="text-[11px] text-gray-400 text-center">
                        Come back tomorrow for your free scan
                      </span>
                    </div>
                  </div>
                )}

                {modalStep === 'upgrade_email' && (
                  <>
                    <div className="text-left mt-2">
                      <h4 className="text-sm font-extrabold text-[#191919] uppercase tracking-wider mb-1">Create Free Account</h4>
                      <p className="text-xs text-gray-500 font-medium">Enter your email to get a verification code.</p>

                    </div>

                    <form onSubmit={handleUpgrade} className="flex flex-col gap-3">
                      <div className="flex flex-col gap-1.5 text-left">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          Enter Your Email
                        </label>
                        <input
                          type="email"
                          value={modalEmail}
                          onChange={(e) => setModalEmail(e.target.value)}
                          placeholder="your@email.com"
                          required
                          className="w-full px-4 py-3 rounded-xl border border-[#E8DDD4] outline-none focus:ring-2 focus:ring-[#8B5E3C]/20 focus:border-[#8B5E3C] text-sm text-[#191919] bg-white transition-all"
                          autoFocus
                        />
                      </div>

                      {modalMessage && (
                        <p className={`text-xs font-semibold ${modalMessage.isError ? 'text-red-500' : 'text-emerald-600'}`}>
                          {modalMessage.text}
                        </p>
                      )}

                      <button
                        type="submit"
                        disabled={modalLoading}
                        className="w-full bg-[#8B5E3C] hover:bg-[#734A2E] disabled:bg-gray-300 text-white py-3.5 rounded-xl font-bold text-sm shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
                      >
                        {modalLoading ? (
                          <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                          <>
                            Send Verification Code
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                      
                      <p className="text-[11px] text-gray-400 text-center mt-2">
                        Already have an account?{" "}
                        <button
                          type="button"
                          onClick={() => {
                            setShowUpgradeModal(false);
                            window.dispatchEvent(new Event('lumo-open-signin'));
                          }}
                          className="text-[#8B5E3C] font-bold hover:underline bg-transparent border-none cursor-pointer p-0"
                        >
                          Sign in to access your account
                        </button>
                      </p>
                    </form>

                    <div className="flex justify-between items-center mt-2 border-t border-gray-150/40 pt-3">
                      <button
                        type="button"
                        onClick={() => {
                          setModalStep('paywall');
                          setModalMessage(null);
                        }}
                        className="text-xs text-gray-500 font-bold hover:underline bg-transparent border-none cursor-pointer"
                      >
                        ← Back
                      </button>

                      <button 
                        type="button"
                        onClick={() => {
                          setModalStep('restore_email');
                          setModalMessage(null);
                        }}
                        className="text-xs text-[#8B5E3C] font-bold hover:underline bg-transparent border-none cursor-pointer"
                      >
                        Restore subscription
                      </button>
                    </div>
                  </>
                )}

                {modalStep === 'already_pro' && (
                  <>
                    <div className="text-left mt-2 flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-[#8B5E3C]/10 rounded-full flex items-center justify-center text-[#8B5E3C] mb-3">
                        <Footprints className="w-6 h-6" />
                      </div>
                      <h4 className="text-base font-extrabold text-[#191919] uppercase tracking-wider mb-2">Active Membership Found</h4>
                      <p className="text-sm text-gray-600 font-medium max-w-sm mb-4">
                        We found an active account for <strong>{modalEmail}</strong>. You don't need to purchase another subscription!
                      </p>
                    </div>

                    <div className="flex flex-col gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowUpgradeModal(false);
                          window.dispatchEvent(new Event('lumo-open-signin'));
                        }}
                        className="w-full bg-[#8B5E3C] hover:bg-[#734A2E] text-white py-3.5 rounded-xl font-bold text-sm shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
                      >
                        Sign in to Your Account
                        <Footprints className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex justify-center items-center mt-4 border-t border-gray-150/40 pt-3">
                      <button
                        type="button"
                        onClick={() => {
                          setModalStep('upgrade_email');
                          setModalMessage(null);
                        }}
                        className="text-xs text-gray-500 font-bold hover:underline bg-transparent border-none cursor-pointer"
                      >
                        ← Back
                      </button>
                    </div>
                  </>
                )}

                {modalStep === 'restore_email' && (
                  <>
                    <div className="text-left mt-2">
                      <h4 className="text-sm font-extrabold text-[#191919] uppercase tracking-wider mb-1">Sign In to Account</h4>
                      <p className="text-xs text-gray-500 font-medium">Enter your email to receive a 2-step verification code.</p>
                    </div>

                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-1.5 text-left">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          Enter Your Email
                        </label>
                        <input
                          type="email"
                          value={modalEmail}
                          onChange={(e) => setModalEmail(e.target.value)}
                          placeholder="your@email.com"
                          required
                          className="w-full px-4 py-3 rounded-xl border border-[#E8DDD4] outline-none focus:ring-2 focus:ring-[#8B5E3C]/20 focus:border-[#8B5E3C] text-sm text-[#191919] bg-white transition-all"
                          autoFocus
                        />
                      </div>

                      {modalMessage && (
                        <p className={`text-xs font-semibold text-center ${modalMessage.isError ? 'text-red-500' : 'text-emerald-600'}`}>
                          {modalMessage.text}
                        </p>
                      )}

                      <button
                        type="button"
                        onClick={handleRestore}
                        disabled={modalLoading}
                        className="w-full bg-[#8B5E3C] hover:bg-[#734A2E] disabled:bg-gray-300 text-white py-3.5 rounded-xl font-bold text-sm shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
                      >
                        {modalLoading ? (
                          <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                          <>
                            Send Verification Code
                            <Mail className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex justify-between items-center mt-2 border-t border-gray-150/40 pt-3">
                      <button
                        type="button"
                        onClick={() => {
                          setModalStep('paywall');
                          setModalMessage(null);
                        }}
                        className="text-xs text-gray-500 font-bold hover:underline bg-transparent border-none cursor-pointer"
                      >
                        ← Back
                      </button>

                      <button 
                        type="button"
                        onClick={() => {
                          setModalStep('upgrade_email');
                          setModalMessage(null);
                        }}
                        className="text-xs text-[#8B5E3C] font-bold hover:underline bg-transparent border-none cursor-pointer"
                      >
                        Create Free Account
                      </button>
                    </div>
                  </>
                )}

                {modalStep === 'verification' && (
                  <form onSubmit={handleVerifyCode} className="flex flex-col gap-3 mt-2">
                    <div className="flex flex-col gap-1.5 text-left">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Enter 6-Digit Verification Code
                      </label>
                      <p className="text-xs text-gray-500 font-medium">
                        We sent a code to <strong className="text-gray-700">{modalEmail}</strong>. Valid for 15 minutes.
                      </p>
                      <div className="bg-stone-50 border border-stone-200/60 text-stone-600 rounded-xl p-3 text-xs leading-relaxed text-center font-medium mt-1 mb-2 animate-fade-in">
                        📧 Code sent! Check your inbox — and don't forget to check your spam/junk folder if you don't see it within a minute.
                      </div>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="••••••"
                        required
                        className="w-full px-4 py-3 rounded-xl border border-[#E8DDD4] outline-none focus:ring-2 focus:ring-[#8B5E3C]/20 focus:border-[#8B5E3C] text-center font-mono text-lg tracking-widest text-[#191919] bg-white transition-all"
                        autoFocus
                      />
                    </div>

                    {modalMessage && (
                      <div className={`text-xs font-semibold text-center flex flex-col items-center gap-1 ${modalMessage.isError ? 'text-red-500' : 'text-emerald-600'}`}>
                        <span>{modalMessage.text}</span>
                        {modalMessage.isError && modalMessage.text.includes('Code expired') && (
                          <button
                            type="button"
                            onClick={handleRestore}
                            className="text-xs font-bold text-[#8B5E3C] hover:underline mt-0.5 cursor-pointer bg-transparent border-none"
                          >
                            Still nothing? Resend Code
                          </button>
                        )}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={modalLoading}
                      className="w-full bg-[#8B5E3C] hover:bg-[#734A2E] disabled:bg-gray-300 text-white py-3.5 rounded-xl font-bold text-sm shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      {modalLoading ? (
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      ) : 'Verify Code'}
                    </button>

                    <div className="mt-4 flex flex-col gap-2 pt-3 border-t border-gray-150/40">
                      <div className="text-center text-xs text-[#8B7E7D]">
                        Didn't receive the code? Check your spam or junk folder.
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setModalStep('restore_email');
                            setModalMessage(null);
                            setVerificationCode('');
                          }}
                          className="text-xs text-gray-500 font-bold hover:underline bg-transparent border-none cursor-pointer"
                        >
                          ← Back to Email
                        </button>

                        <button
                          type="button"
                          onClick={handleRestore}
                          disabled={modalLoading}
                          className="text-xs text-[#8B5E3C] font-bold hover:underline bg-transparent border-none cursor-pointer"
                        >
                          Still nothing? Resend Code
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </>
            )}

          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
        .animate-fade-in-up { animation: fadeInUp 0.4s ease-out; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        .animate-fade-in { animation: fadeIn 0.25s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .animate-scale-up { animation: scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}

// ─── Amazon Find Block ────────────────────────────────────────────────────────
function AmazonFindBlock({ product }: { product: any }) {
  const [items, setItems] = useState<AmazonProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const productName =
    product?.product_name &&
    product.product_name !== 'Unknown Product' &&
    product.product_name !== 'Custom Entry' &&
    product.product_name !== 'Scanned Ingredients'
      ? product.product_name
      : product?.brand;

  useEffect(() => {
    if (!productName) { setLoading(false); return; }
    let cancelled = false;
    fetch(`/api/amazon/search?q=${encodeURIComponent(productName + ' pet food')}&limit=2`)
      .then(r => r.json())
      .then(d => { if (!cancelled) { setItems(d.products ?? []); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [productName]);

  if (!productName) return null;

  const searchUrl = `https://www.amazon.com/s?k=${encodeURIComponent(productName + ' pet food')}&tag=lumobites-20`;

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-[#191919] uppercase tracking-wide">🛒 Find on Amazon</p>
        <span className="text-[9px] text-gray-400">Powered by Amazon</span>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          <AmazonProductCardSkeleton compact />
          <AmazonProductCardSkeleton compact />
        </div>
      ) : items.length > 0 ? (
        <div className="flex flex-col gap-2">
          {items.map(p => <AmazonProductCard key={p.asin} product={p} compact />)}
        </div>
      ) : (
        <a
          href={searchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full bg-[#FFD814] border border-[#FCD200] text-[#0F1111] font-bold text-xs py-2.5 rounded-lg hover:bg-[#F7CA00] transition-colors"
        >
          Find &ldquo;{productName}&rdquo; on Amazon →
        </a>
      )}
      <p className="text-[9px] text-gray-400 mt-2 text-center">
        Affiliate links support Lumo Bites at no extra cost to you.
      </p>
    </div>
  );
}
