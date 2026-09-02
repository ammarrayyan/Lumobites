'use client';

import { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import Link from 'next/link';
import { Product, ScoredProduct, PetProfile } from '@/lib/types';
import confetti from 'canvas-confetti';
import MobileFoodNav from '@/components/MobileFoodNav';
import AmazonProductCard, { AmazonProductCardSkeleton, AmazonProduct } from '@/components/AmazonProductCard';
import { 
  Search, Check, AlertTriangle, CheckCircle2, Leaf, Bell, Sparkles, ArrowRight, 
  Footprints, Mail, Camera, Barcode, FileText, Scan, Zap, ShieldCheck, RefreshCw, Info 
} from 'lucide-react';
import { getSignedInUserEmail } from '@/lib/authHelper';
import AiLimitModal from '@/components/AiLimitModal';

export default function ScanPage() {
  const [proEmail, setProEmail] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const syncEmail = () => {
      const email = getSignedInUserEmail();
      setProEmail(email);
      setMounted(true);
    };

    syncEmail();
    window.addEventListener('lumo-pro-update', syncEmail);
    window.addEventListener('lumo-signin-success', syncEmail);

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'lumo_pro_email' || e.key === 'lumo_sitter_email' || e.key === 'lumo_shelter_email') {
        syncEmail();
      }
    };
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('lumo-pro-update', syncEmail);
      window.removeEventListener('lumo-signin-success', syncEmail);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  if (!mounted) return null

  if (!proEmail) {
    return (
      <div 
        className="fixed inset-0 flex flex-col items-center justify-center text-center px-4"
        style={{ 
          zIndex: 50, 
          backgroundColor: 'white',
          paddingBottom: 'env(safe-area-inset-bottom, 20px)',
          paddingTop: 'env(safe-area-inset-top, 20px)',
          minHeight: '100dvh'
        }}
      >
        <p className="text-lg font-medium text-[#4A3E3D] mb-2">
          Pet Food Safety Scanner
        </p>
        <p className="text-gray-500 mb-6">
          Sign in to use the scanner
        </p>
        <button
          onClick={() => {
            localStorage.setItem('lumo_redirect_after_login', '/scan')
            window.location.href = '/?signin=true'
          }}
          className="bg-[#8B5E3C] text-white px-8 py-3 rounded-xl font-medium"
          style={{
            marginBottom: 'env(safe-area-inset-bottom, 20px)'
          }}
        >
          Sign In — It's Free
        </button>
      </div>
    )
  }

  return <ScanPageContent />
}

function ScanPageContent() {
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
      const email = getSignedInUserEmail();
      const isAdminBypass = localStorage.getItem('lumo_admin_bypass') === 'true';
      const isOwnerEmail = email?.toLowerCase().trim() === 'premierpetnutritionllc@gmail.com' || email?.toLowerCase().trim() === 'reviewer@lumobites.net';
      
      if (isAdminBypass || isOwnerEmail) {
        setIsPro(true);
        setProEmail(email || 'admin@lumobites.com');
      } else if (email && email !== 'undefined' && email !== 'null' && email.trim() !== '') {
        setProEmail(email);
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

    console.log('[Lumo Subscription] Page mounted. Checking subscription status...');

    if (sessionId) {
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
      const activeEmail = getSignedInUserEmail();
      const isAdminBypass = localStorage.getItem('lumo_admin_bypass') === 'true';
      console.log('[Lumo Subscription] Retrieved active email:', activeEmail, 'isAdminBypass:', isAdminBypass);
      
      const isOwnerEmail = activeEmail?.toLowerCase().trim() === 'premierpetnutritionllc@gmail.com' || activeEmail?.toLowerCase().trim() === 'reviewer@lumobites.net';
      
      if (isAdminBypass || isOwnerEmail) {
        console.log('[Lumo Subscription] Admin/Owner bypass detected in localStorage. Activating Pro status.');
        setIsPro(true);
        setProEmail(activeEmail || 'admin@lumobites.com');
      } else if (activeEmail && activeEmail !== 'undefined' && activeEmail !== 'null' && activeEmail.trim() !== '') {
        setProEmail(activeEmail);
        
        console.log('[Lumo Subscription] Syncing status with database for email:', activeEmail);
        fetch('/api/stripe/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: activeEmail })
        })
        .then(res => res.json())
        .then(data => {
          if (data && data.session_invalidated_at) {
            const sessionStarted = localStorage.getItem('lumo_session_started_at');
            if (sessionStarted) {
              const startedDate = new Date(sessionStarted);
              const invalidatedDate = new Date(data.session_invalidated_at);
              if (invalidatedDate > startedDate) {
                localStorage.clear();
                document.cookie = 'lumo_pro_email=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
                alert("You have been signed out of all devices for security.");
                window.location.href = "/";
                return;
              }
            }
          }
          if (data.isPro) {
            setIsPro(true);
          } else {
            setIsPro(false);
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

  const [aiLimitReason, setAiLimitReason] = useState<string | null>(null);
  const [aiLimitIsPro, setAiLimitIsPro] = useState<boolean | undefined>(undefined);

  // Limit checker: returns true if allowed to scan, false if blocked (shows modal)
  const checkScanLimit = (): boolean => {
    const userEmail = getSignedInUserEmail();
    if (!userEmail) {
      setAiLimitReason('Please sign in to use AI features.');
      setShowUpgradeModal(true);
      return false;
    }

    if (isPro) return true;

    try {
      const countStr = localStorage.getItem('lumo_scan_count');
      const dateStr = localStorage.getItem('lumo_scan_date');
      
      const d = new Date();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const today = `${year}-${month}-${day}`;

      let count = countStr ? parseInt(countStr, 10) : 0;
      if (dateStr !== today) count = 0;

      if (count >= 2) {
        setAiLimitReason("You've used both of your free AI checks. Upgrade to Membership for 5 checks a day!");
        setShowUpgradeModal(true);
        return false;
      }

      return true;
    } catch (err) {
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
      setOcrLoading(false);
      processOCRResult(cleaned);
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
      const userEmail = getSignedInUserEmail();
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients: text, email: userEmail })
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429 || data.error?.toLowerCase().includes('limit') || data.error?.toLowerCase().includes('sign in') || data.error?.toLowerCase().includes('checks')) {
          setAiLimitReason(data.error || 'Limit reached');
          if (typeof data.isPro === 'boolean') setAiLimitIsPro(data.isPro);
          setShowUpgradeModal(true);
          return;
        }
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
    <div 
      className="min-h-screen bg-[#FDFAF7] pb-12 pt-[52px] md:pt-0"
    >
            <MobileFoodNav />

      <main className="max-w-2xl mx-auto p-4 md:p-8 flex flex-col items-center justify-center min-h-[calc(100vh-120px)]">
        <canvas ref={canvasRef} className="hidden" />

        {/* Outer Premium Card Container */}
        <div className="w-full max-w-[650px] bg-white rounded-3xl border border-[#EEEEEE] shadow-[0_12px_40px_rgba(0,0,0,0.03)] p-6 md:p-10 flex flex-col gap-6">
          
          {/* Header Title Section */}
          <div className="text-center flex flex-col items-center">
            {/* Shield / Safety Badge */}
            <div className="inline-flex items-center gap-1.5 bg-[#8B5E3C]/10 border border-[#8B5E3C]/20 text-[#8B5E3C] text-[11px] font-extrabold uppercase tracking-wider px-3.5 py-1.5 rounded-full mb-3 shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-[#8B5E3C]" />
              Live FDA Safety Check
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-[900] text-[#191919] mb-2 tracking-tight">Is This Food Safe?</h2>
            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed max-w-[420px]">
              Scan barcode or capture package ingredients for instant AI toxicity analysis &amp; live FDA recall verification
            </p>
          </div>

          {/* Search / Scan UI */}
          {(!product && !loading && !ocrLoading) ? (
            <div className="flex flex-col gap-6">
              
              {/* Modern Segmented Tab Switcher */}
              <div className="bg-[#FAF6F4] p-1.5 rounded-2xl flex gap-1 border border-[#EADBCE]">
                <button
                  type="button"
                  onClick={() => setActiveTab('scanner')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    activeTab === 'scanner'
                      ? 'bg-[#8B5E3C] text-white shadow-md'
                      : 'text-[#664333] hover:bg-[#F0E6DD]'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  <span>Live Camera Scanner</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('manual')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    activeTab === 'manual'
                      ? 'bg-[#8B5E3C] text-white shadow-md'
                      : 'text-[#664333] hover:bg-[#F0E6DD]'
                  }`}
                >
                  <Barcode className="w-4 h-4" />
                  <span>Manual Entry</span>
                </button>
              </div>

              {/* TAB 1: Modern Cinematic Viewfinder */}
              {activeTab === 'scanner' && (
                <div className="flex flex-col gap-5">
                  {/* Viewfinder Outer Chassis */}
                  <div className="relative rounded-[28px] overflow-hidden bg-gradient-to-b from-[#1E1916] to-[#120E0C] p-2 sm:p-2.5 border border-[#3E342B] shadow-2xl">
                    {/* Viewport Core */}
                    <div className="relative rounded-[22px] overflow-hidden min-h-[340px] sm:min-h-[380px] bg-black flex items-center justify-center">
                      
                      {/* Scanner Container for Html5Qrcode */}
                      <div id="reader" className="w-full h-full min-h-[340px] sm:min-h-[380px] rounded-[22px]"></div>

                      {/* Top Status Pill */}
                      <div className="absolute top-4 left-0 right-0 flex justify-center px-4 z-20 pointer-events-none">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white text-[11px] font-semibold tracking-wide shadow-lg">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          <span>Auto Barcode &amp; Label AI Active</span>
                        </div>
                      </div>

                      {/* Viewfinder Reticle Framing Area */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 p-6">
                        <div className="w-[230px] h-[230px] sm:w-[260px] sm:h-[260px] relative rounded-2xl">
                          {/* 4 Sleek Glowing Corner Brackets */}
                          <div className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-[#C17D3C] rounded-tl-xl drop-shadow-[0_0_8px_rgba(193,125,60,0.6)]"></div>
                          <div className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-[#C17D3C] rounded-tr-xl drop-shadow-[0_0_8px_rgba(193,125,60,0.6)]"></div>
                          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-[#C17D3C] rounded-bl-xl drop-shadow-[0_0_8px_rgba(193,125,60,0.6)]"></div>
                          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-[#C17D3C] rounded-br-xl drop-shadow-[0_0_8px_rgba(193,125,60,0.6)]"></div>

                          {/* Center Alignment Reticle */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-25">
                            <div className="w-5 h-0.5 bg-white"></div>
                            <div className="h-5 w-0.5 bg-white -ml-2.75"></div>
                          </div>

                          {/* Animated Laser Sweep Beam */}
                          <div className="absolute left-1 right-1 h-0.5 bg-gradient-to-r from-transparent via-[#FFC278] to-transparent shadow-[0_0_12px_#FFA740] animate-scan-laser"></div>
                        </div>
                      </div>

                      {/* Bottom Shutter & Capture Action Bar */}
                      <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-2 z-20 px-4">
                        <button 
                          type="button"
                          onClick={captureAndOCR}
                          className="group flex items-center gap-3 bg-white/95 hover:bg-white text-[#4A3E3D] px-6 py-3.5 rounded-full font-extrabold text-sm shadow-[0_8px_30px_rgba(0,0,0,0.45)] hover:scale-105 active:scale-95 transition-all cursor-pointer border border-[#EADBCE]"
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#8B5E3C] to-[#C17D3C] flex items-center justify-center text-white shadow-xs group-hover:rotate-12 transition-transform">
                            <Camera className="w-4 h-4" />
                          </div>
                          <span>Capture &amp; Scan Ingredients</span>
                        </button>
                        <span className="text-[10px] text-white/85 font-medium bg-black/50 px-3 py-0.5 rounded-full backdrop-blur-xs">
                          Hold steady over barcode or tap above for ingredients
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Two-Column Modern Scan Instructions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-1">
                    {/* Column 1: Barcode Scan */}
                    <div className="bg-[#FAF6F4] border border-[#EADBCE] rounded-2xl p-4 flex items-start gap-3.5 transition-all hover:border-[#8B5E3C]/40">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-[#EADBCE] shrink-0 text-[#8B5E3C] shadow-xs">
                        <Barcode className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-extrabold text-[#3B2C24]">Instant Barcode Lookup</span>
                        <p className="text-[12px] text-[#6E5D53] leading-relaxed mt-0.5">
                          Align any pet food barcode in the frame for automated lookup &amp; live FDA recall check.
                        </p>
                      </div>
                    </div>

                    {/* Column 2: Ingredients Scan */}
                    <div className="bg-[#FAF6F4] border border-[#EADBCE] rounded-2xl p-4 flex items-start gap-3.5 transition-all hover:border-[#8B5E3C]/40">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-[#EADBCE] shrink-0 text-[#8B5E3C] shadow-xs">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-extrabold text-[#3B2C24]">AI Ingredient Label Scan</span>
                        <p className="text-[12px] text-[#6E5D53] leading-relaxed mt-0.5">
                          Point at the ingredient list on package back, then tap <strong className="text-[#8B5E3C]">Capture</strong>.
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
                    <label className="text-[11px] font-bold text-[#8B5E3C] uppercase tracking-wider text-left flex items-center gap-1.5">
                      <Barcode className="w-3.5 h-3.5" /> Search by UPC / Barcode Number
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={manualBarcode}
                          onChange={(e) => setManualBarcode(e.target.value)}
                          placeholder="e.g. 079100002598"
                          className="w-full pl-4 pr-10 py-3 rounded-xl border border-[#E8DDD4] outline-none focus:ring-2 focus:ring-[#8B5E3C]/20 focus:border-[#8B5E3C] text-sm text-[#191919] bg-white transition-all shadow-2xs"
                        />
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                          <Search className="w-4 h-4" />
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
                    <div className="flex-1 h-px bg-[#EADBCE]"></div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">or</span>
                    <div className="flex-1 h-px bg-[#EADBCE]"></div>
                  </div>

                  {/* Paste Ingredients Form */}
                  <form onSubmit={handleManualIngredientSubmit} className="flex flex-col gap-2">
                    <label className="text-[11px] font-bold text-[#8B5E3C] uppercase tracking-wider text-left flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" /> Paste Ingredient List Directly
                    </label>
                    <textarea
                      value={manualIngredients}
                      onChange={(e) => setManualIngredients(e.target.value)}
                      placeholder="e.g. Chicken, Brown Rice, Barley, Natural Flavor, Sodium Selenite..."
                      className="w-full px-4 py-3.5 rounded-xl border border-[#E8DDD4] outline-none focus:ring-2 focus:ring-[#8B5E3C]/20 focus:border-[#8B5E3C] text-sm text-[#191919] bg-white h-28 resize-none transition-all placeholder:text-gray-300 shadow-2xs"
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
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-full border-4 border-[#E8DDD4] border-t-[#8B5E3C] animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-[#8B5E3C] animate-pulse" />
                </div>
              </div>
              <h3 className="text-[#191919] font-black text-xl mb-2">
                {ocrLoading ? 'Reading Label with AI Vision...' : 'Analyzing Ingredients & FDA Recalls...'}
              </h3>
              <p className="text-gray-500 text-sm max-w-[320px] mx-auto leading-relaxed">
                {ocrLoading 
                  ? 'Extracting ingredient text from your camera capture...' 
                  : 'Evaluating ingredient safety and nutritional risk factors against veterinary standards.'}
              </p>
            </div>
          )}
        </div>

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

      <AiLimitModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        reason={aiLimitReason}
        isPro={aiLimitIsPro ?? isPro}
      />

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
