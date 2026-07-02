'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import MobileCommunityNav from '@/components/MobileCommunityNav';
import html2canvas from 'html2canvas';
import confetti from 'canvas-confetti';
import { AlertTriangle, Star, Camera, Footprints, Dog, Cat, CheckCircle2, XCircle, UploadCloud, Sparkles, Check, ArrowRight, Mail, RefreshCw, X } from 'lucide-react';

const LOADING_MESSAGES = [
  "Analyzing your features...",
  "Consulting the breed database...",
  "Finding your perfect match...",
  "Comparing 81 breeds...",
  "Almost there...",
  "Your Pet Twin is almost revealed..."
];

interface TwinResult {
  breed: string;
  petType: 'cat' | 'dog';
  matchScore: number;
  traits: string[];
  quote: string;
  reason: string;
  unsplashImageUrl: string;
  personalityBreakdown: string;
  famousPets: string[];
  bothSection: string[];
  compatibility: string;
  celebrityMatch: string;
}

const QUIZ_QUESTIONS = [
  {
    key: 'weekend',
    question: 'Your ideal weekend:',
    options: [
      { value: 'Hiking and adventures', label: 'Hiking and adventures' },
      { value: 'Netflix and couch', label: 'Netflix and couch' },
      { value: 'Social gathering with friends', label: 'Social gathering with friends' },
      { value: 'Exploring somewhere new', label: 'Exploring somewhere new' }
    ]
  },
  {
    key: 'energy',
    question: 'Your energy level:',
    options: [
      { value: 'Always on the go', label: 'Always on the go' },
      { value: 'Balanced — active but love rest', label: 'Balanced — active but love rest' },
      { value: 'Pretty chill and relaxed', label: 'Pretty chill and relaxed' },
      { value: 'Depends on my mood', label: 'Depends on my mood' }
    ]
  },
  {
    key: 'strangers',
    question: 'How do you handle strangers:',
    options: [
      { value: 'Warm and friendly immediately', label: 'Warm and friendly immediately' },
      { value: 'Takes time to warm up', label: 'Takes time to warm up' },
      { value: 'Observe first then engage', label: 'Observe first then engage' },
      { value: 'Selective — only certain people', label: 'Selective — only certain people' }
    ]
  },
  {
    key: 'friends',
    question: 'Your friends describe you as:',
    options: [
      { value: 'Loyal and dependable', label: 'Loyal and dependable' },
      { value: 'Independent and unique', label: 'Independent and unique' },
      { value: 'Playful and spontaneous', label: 'Playful and spontaneous' },
      { value: 'Calm and wise', label: 'Calm and wise' }
    ]
  },
  {
    key: 'trait',
    question: 'Your biggest trait:',
    options: [
      { value: 'Protective and loving', label: 'Protective and loving' },
      { value: 'Curious and adventurous', label: 'Curious and adventurous' },
      { value: 'Elegant and graceful', label: 'Elegant and graceful' },
      { value: 'Goofy and fun loving', label: 'Goofy and fun loving' }
    ]
  }
];

export default function TwinPage() {
  const [step, setStep] = useState<'quiz' | 'upload' | 'analyzing' | 'result'>('quiz');
  const [quizAnswers, setQuizAnswers] = useState({
    weekend: '',
    energy: '',
    strangers: '',
    friends: '',
    trait: ''
  });
  const [currentQuizQuestion, setCurrentQuizQuestion] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [analysisTimeout, setAnalysisTimeout] = useState(false);
  const [result, setResult] = useState<TwinResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [agreedToShare, setAgreedToShare] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [publicShareStatus, setPublicShareStatus] = useState<'idle' | 'sharing' | 'shared' | 'error'>('idle');

  // States for email capture modal
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [email, setEmail] = useState('');
  const [modalError, setModalError] = useState('');
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);

  // Progress bar state
  const [progress, setProgress] = useState(0);

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

  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Refs for off-screen premium download templates
  const squareCardRef = useRef<HTMLDivElement>(null);
  const storyCardRef = useRef<HTMLDivElement>(null);
  const twitterCardRef = useRef<HTMLDivElement>(null);
  // Rotate loading messages every 2 seconds
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'analyzing' && !analysisTimeout) {
      setProgress(0);
      // Trigger progress animation
      setTimeout(() => setProgress(90), 100);
      
      interval = setInterval(() => {
        setLoadingIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, analysisTimeout]);

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

    console.log('[Lumo Twin Pro] Page mounted. Checking subscription status...');

    if (adminParam === process.env.NEXT_PUBLIC_ADMIN_BYPASS_KEY) {
      console.log('[Lumo Twin Pro] Admin bypass activated via URL parameter.');
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
      console.log('[Lumo Twin Pro] Found Stripe session_id in URL:', sessionId);
      setVerifyingSession(true);
      fetch(`/api/stripe/verify-session?session_id=${sessionId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.isPro) {
            console.log('[Lumo Twin Pro] Session verified. User email:', data.email);
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
            console.warn('[Lumo Twin Pro] Session verification returned not pro or failed:', data);
          }
        })
        .catch(err => console.error('[Lumo Twin Pro] Verification error:', err))
        .finally(() => {
          setVerifyingSession(false);
          window.history.replaceState({}, document.title, window.location.pathname);
        });
    } else {
      const cachedEmail = localStorage.getItem('lumo_pro_email');
      const isAdminBypass = localStorage.getItem('lumo_admin_bypass') === 'true';
      console.log('[Lumo Twin Pro] Retrieved cached email from localStorage:', cachedEmail, 'isAdminBypass:', isAdminBypass);
      
      const isOwnerEmail = cachedEmail?.toLowerCase().trim() === 'premierpetnutritionllc@gmail.com' || cachedEmail?.toLowerCase().trim() === 'reviewer@lumobites.net';
      
      if (isAdminBypass || isOwnerEmail) {
        console.log('[Lumo Twin Pro] Admin/Owner bypass detected in localStorage. Activating Pro status.');
        setIsPro(true);
        setProEmail(cachedEmail || 'admin@lumobites.com');
      } else if (cachedEmail && cachedEmail !== 'undefined' && cachedEmail !== 'null' && cachedEmail.trim() !== '') {
        console.log('[Lumo Twin Pro] Active cached email found. Activating optimistic Pro state.');
        setProEmail(cachedEmail);
        setIsPro(true);
        
        console.log('[Lumo Twin Pro] Syncing status with database for email:', cachedEmail);
        fetch('/api/stripe/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cachedEmail })
        })
        .then(res => res.json())
        .then(data => {
          console.log('[Lumo Twin Pro] Database status reply:', data);
          if (data.isPro) {
            setIsPro(true);
            window.dispatchEvent(new Event('lumo-pro-update'));
            console.log('[Lumo Twin Pro] Pro status confirmed by Supabase.');
          } else {
            setIsPro(false);
            localStorage.removeItem('lumo_pro_email');
            window.dispatchEvent(new Event('lumo-pro-update'));
            console.log('[Lumo Twin Pro] Pro status rejected by Supabase. Downgraded to free tier.');
          }
        })
        .catch((err) => {
          console.error('[Lumo Twin Pro] Failed to sync status with Supabase:', err);
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

  // Limit checker: returns true if allowed to match, false if blocked (shows modal)
  const checkTwinLimit = (): boolean => {
    console.log('[Lumo Twin Limit] Evaluating checkTwinLimit. Current isPro state:', isPro);
    if (isPro) {
      console.log('[Lumo Twin Limit] User is PRO. Bypassing limit.');
      return true;
    }

    try {
      const countStr = localStorage.getItem('lumo_twin_count');
      const dateStr = localStorage.getItem('lumo_twin_date');
      
      const d = new Date();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const today = `${year}-${month}-${day}`;

      let count = countStr ? parseInt(countStr, 10) : 0;
      console.log(`[Lumo Twin Limit] Read from localStorage - count: ${count}, date: ${dateStr}, today: ${today}`);

      if (dateStr !== today) {
        console.log('[Lumo Twin Limit] Midnight reset triggered (date mismatch). Resetting count to 0.');
        count = 0;
      }

      if (count >= 1) {
        console.log('[Lumo Twin Limit] Limit exceeded! Displaying the Pro Upgrade Modal.');
        setShowUpgradeModal(true);
        return false;
      }

      console.log('[Lumo Twin Limit] Under limit. Access granted.');
      return true;
    } catch (err) {
      console.error('[Lumo Twin Limit] Error reading limit from localStorage:', err);
      return true;
    }
  };

  // Record twin match usage
  const recordTwinUsage = () => {
    if (isPro) {
      console.log('[Lumo Twin Limit] Pro user, skipping usage recording.');
      return;
    }

    try {
      const d = new Date();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const today = `${year}-${month}-${day}`;

      const countStr = localStorage.getItem('lumo_twin_count');
      let count = countStr ? parseInt(countStr, 10) : 0;
      const dateStr = localStorage.getItem('lumo_twin_date');

      if (dateStr !== today) {
        count = 0;
      }

      const newCount = count + 1;
      localStorage.setItem('lumo_twin_count', newCount.toString());
      localStorage.setItem('lumo_twin_date', today);
      console.log(`[Lumo Twin Limit] Recorded twin match. New count: ${newCount}, date: ${today}`);
    } catch (err) {
      console.error('[Lumo Twin Limit] Error writing limit to localStorage:', err);
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
        
        try {
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 }
          });
        } catch (e) {}

        setShowUpgradeModal(false);
        setModalMessage(null);
        setVerificationCode('');
        setModalStep('paywall');
        if (data.existed) {
          alert('Welcome back! ✨');
        } else {
          alert('Account created! 🐾');
        }
      } else {
        throw new Error('Could not verify code. Please try again.');
      }
    } catch (err: any) {
      console.error(err);
      setModalMessage({ text: err.message || 'Could not verify code. Try again.', isError: true });
    } finally {
      setModalLoading(false);
    }
  };

  // Handle active webcam stream
  useEffect(() => {
    if (cameraActive) {
      setError(null);
      stopCameraStream(); // Ensure we close the previous camera stream before switching
      navigator.mediaDevices.getUserMedia({ video: { facingMode: facingMode, width: { ideal: 1080 }, height: { ideal: 1080 } } })
        .then(stream => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(err => {
          console.error("Camera access error:", err);
          setError("Could not access camera. Please upload a photo instead.");
          setCameraActive(false);
        });
    } else {
      stopCameraStream();
    }
    return () => stopCameraStream();
  }, [cameraActive, facingMode]);

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const stopCamera = () => {
    setCameraActive(false);
  };

  const captureSelfie = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 1080;
      canvas.height = videoRef.current.videoHeight || 1080;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const capturedFile = new File([blob], "selfie.jpg", { type: "image/jpeg" });
            processFile(capturedFile);
            setCameraActive(false);
          }
        }, 'image/jpeg', 0.95);
      }
    }
  };

  // Trigger confetti on result screen
  useEffect(() => {
    if (step === 'result' && !showEmailModal) {
      const duration = 3 * 1000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 60,
          origin: { x: 0, y: 0.8 },
          colors: ['#FF3E6C', '#FF8E53', '#8A2387', '#E94057']
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 60,
          origin: { x: 1, y: 0.8 },
          colors: ['#FF3E6C', '#FF8E53', '#8A2387', '#E94057']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [step, showEmailModal]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handlePublicShare = async (forceSharedState = false) => {
    if (!result) return;
    setPublicShareStatus('sharing');
    try {
      let base64Photo = '';
      if (file) {
        base64Photo = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (e) => reject(e);
          reader.readAsDataURL(file);
        });
      }

      const res = await fetch('/api/twin/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPhoto: base64Photo,
          petBreed: result.breed,
          petType: result.petType,
          petPhoto: result.unsplashImageUrl,
          matchScore: result.matchScore,
          traits: result.traits,
          quote: result.quote,
          email: shareEmail,
          personalityBreakdown: result.personalityBreakdown,
          famousPets: result.famousPets,
          bothSection: result.bothSection,
          compatibility: result.compatibility,
          celebrityMatch: result.celebrityMatch
        })
      });

      if (res.ok) {
        setPublicShareStatus('shared');
        setAgreedToShare(true);
      } else {
        setPublicShareStatus('error');
        setAgreedToShare(false);
      }
    } catch (err) {
      console.error('Failed to share publicly:', err);
      setPublicShareStatus('error');
      setAgreedToShare(false);
    }
  };

  const resizeAndCompressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Maintain aspect ratio and resize to max 800x800
        const maxDim = 800;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Canvas toBlob returned null'));
            }
          },
          'image/jpeg',
          0.8 // 80% quality compression
        );
      };
      img.onerror = (err) => {
        reject(err);
      };
    });
  };

  const processFile = async (selectedFile: File) => {
    if (!checkTwinLimit()) {
      return;
    }

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setStep('analyzing');
    setLoadingIndex(0);
    setAnalysisTimeout(false);
    setError(null);
    setImageError(false);
    setResult(null);

    console.log(`[Twin Client] Initiating fresh API match. File: ${selectedFile.name}, size: ${selectedFile.size} bytes`);

    let uploadBlob: Blob = selectedFile;
    try {
      console.log(`[Twin Client] Compressing image: ${selectedFile.name} (${(selectedFile.size / 1024).toFixed(1)} KB)`);
      const compressed = await resizeAndCompressImage(selectedFile);
      uploadBlob = compressed;
      console.log(`[Twin Client] Compression complete. New size: ${(compressed.size / 1024).toFixed(1)} KB`);
    } catch (compressErr) {
      console.warn('[Twin Client] Image compression failed, falling back to original file:', compressErr);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn('[Twin Client] Request exceeded 30s limit. Aborting fetch...');
      controller.abort();
    }, 30000);

    try {
      const formData = new FormData();
      formData.append('image', uploadBlob, selectedFile.name || 'image.jpg');
      formData.append('quizAnswers', JSON.stringify(quizAnswers));

      const res = await fetch(`/api/twin?t=${Date.now()}`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      const data = await res.json();
      console.log("[Twin Client] Received match response data:", data);

      if (data.success) {
        recordTwinUsage();
        setResult(data);
        setStep('result');
        const emailCaptured = localStorage.getItem('lumo_twin_email_captured') === 'true';
        if (!emailCaptured) {
          setShowEmailModal(true);
        }
      } else {
        setError(data.error || 'Failed to detect matching breed.');
        setStep('upload');
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.error("[Twin Client] Analysis request timed out.");
        setAnalysisTimeout(true);
      } else {
        console.error("[Twin Client] Analysis request failed:", err);
        setError(err.message || 'An error occurred during matching.');
        setStep('upload');
      }
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const handleRetry = () => {
    if (file) {
      processFile(file);
    }
  };

  const handleCancel = () => {
    setStep('upload');
    setAnalysisTimeout(false);
    setError(null);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmittingEmail(true);
    setModalError('');

    try {
      const response = await fetch('/api/twin/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('lumo_twin_email_captured', 'true');
        setShowEmailModal(false);
      } else {
        setModalError(data.error || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      console.error('[Twin Email Modal] Submit error:', err);
      setModalError('Failed to submit. Please try again or skip.');
    } finally {
      setIsSubmittingEmail(false);
    }
  };

  const handleEmailSkip = () => {
    localStorage.setItem('lumo_twin_email_captured', 'true');
    setShowEmailModal(false);
  };

  const downloadSquareCard = async () => {
    if (squareCardRef.current) {
      const canvas = await html2canvas(squareCardRef.current, {
        useCORS: true,
        allowTaint: true,
        scale: 1,
        width: 1080,
        height: 1080
      });
      const link = document.createElement('a');
      link.download = `${result?.breed}_twin_square.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  const downloadStoryCard = async () => {
    if (storyCardRef.current) {
      const canvas = await html2canvas(storyCardRef.current, {
        useCORS: true,
        allowTaint: true,
        scale: 1,
        width: 1080,
        height: 1920
      });
      const link = document.createElement('a');
      link.download = `${result?.breed}_twin_story.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  const downloadTwitterCard = async () => {
    if (twitterCardRef.current) {
      const canvas = await html2canvas(twitterCardRef.current, {
        useCORS: true,
        allowTaint: true,
        scale: 1,
        width: 1200,
        height: 675
      });
      const link = document.createElement('a');
      link.download = `${result?.breed}_twin_twitter.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  const copyShareLink = () => {
    const text = `Just found my pet twin on Lumo Bites — I'm a ${result?.breed}! 😂🐾 Find yours free at lumobites.net/twin`;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const generateImageFile = async (ref: React.RefObject<HTMLDivElement | null>, filename: string): Promise<File | null> => {
    if (!ref.current) return null;
    try {
      const canvas = await html2canvas(ref.current, {
        useCORS: true,
        allowTaint: true,
        scale: 1.5,
        width: ref.current.offsetWidth || 1080,
        height: ref.current.offsetHeight || 1080
      });
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], filename, { type: 'image/png' }));
          } else {
            resolve(null);
          }
        }, 'image/png');
      });
    } catch (err) {
      console.error("Error generating image file:", err);
      return null;
    }
  };

  const sharePlatformWithImage = async (
    ref: React.RefObject<HTMLDivElement | null>, 
    filename: string, 
    fallbackUrl: string, 
    shareText: string
  ) => {
    if (!result) return;
    setError(null);
    setShareStatus(null);

    const imageFile = await generateImageFile(ref, filename);

    // 1. Mobile/Web Share API first (shares actual image + text)
    if (imageFile && navigator.share && navigator.canShare && navigator.canShare({ files: [imageFile] })) {
      try {
        await navigator.share({
          files: [imageFile],
          title: 'My Pet Twin',
          text: shareText
        });
        return;
      } catch (shareErr) {
        console.error("Web Share API failed:", shareErr);
        // Continue to fallback URL redirect on desktop/unsupported browser
      }
    }

    // 2. Fallback to direct redirect
    window.open(fallbackUrl, '_blank');
  };

  const sharePlatformWithDownloadOnly = async (
    ref: React.RefObject<HTMLDivElement | null>,
    filename: string,
    shareText: string,
    successToastMessage: string
  ) => {
    if (!result) return;
    setError(null);
    setShareStatus(null);

    const imageFile = await generateImageFile(ref, filename);

    // 1. Mobile/Web Share API first (shows WhatsApp and Instagram natively)
    if (imageFile && navigator.share && navigator.canShare && navigator.canShare({ files: [imageFile] })) {
      try {
        await navigator.share({
          files: [imageFile],
          title: 'My Pet Twin',
          text: shareText
        });
        return;
      } catch (shareErr) {
        console.error("Web Share API failed:", shareErr);
      }
    }

    // 2. Fallback to manual download + instructions
    if (ref.current) {
      try {
        const canvas = await html2canvas(ref.current, {
          useCORS: true,
          allowTaint: true,
          scale: 1,
          width: ref.current.offsetWidth || 1080,
          height: ref.current.offsetHeight || 1080
        });
        const link = document.createElement('a');
        link.download = filename;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        setShareStatus(successToastMessage);
        setTimeout(() => setShareStatus(null), 8000);
      } catch (err) {
        console.error("Download fallback error:", err);
      }
    }
  };

  const shareToWhatsApp = () => {
    const filename = `${result?.breed.replace(/\s+/g, '_')}_twin_square.png`;
    const shareText = `I'm a ${result?.breed}! Find your pet twin free at lumobites.net/twin`;
    const fallbackUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    sharePlatformWithImage(squareCardRef, filename, fallbackUrl, shareText);
  };

  const shareToFacebook = () => {
    const filename = `${result?.breed.replace(/\s+/g, '_')}_twin_square.png`;
    const shareText = `I'm a ${result?.breed}! Find your pet twin free at lumobites.net/twin`;
    const fallbackUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://lumobites.net/twin')}`;
    sharePlatformWithImage(squareCardRef, filename, fallbackUrl, shareText);
  };

  const shareToTwitter = () => {
    const filename = `${result?.breed.replace(/\s+/g, '_')}_twin_twitter.png`;
    const shareText = `I'm a ${result?.breed}! 🐾 https://lumobites.net/twin`;
    const fallbackUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    sharePlatformWithImage(twitterCardRef, filename, fallbackUrl, shareText);
  };

  const shareToInstagram = () => {
    const filename = `${result?.breed.replace(/\s+/g, '_')}_twin_square.png`;
    const shareText = `I'm a ${result?.breed}! Find your pet twin free at lumobites.net/twin`;
    const successToastMessage = "Image saved! Open Instagram → tap + → select this photo → share as post or story";
    sharePlatformWithDownloadOnly(squareCardRef, filename, shareText, successToastMessage);
  };

  const shareToInstagramStory = () => {
    const filename = `${result?.breed.replace(/\s+/g, '_')}_twin_story.png`;
    const shareText = `I'm a ${result?.breed}! Find your pet twin free at lumobites.net/twin`;
    const successToastMessage = "Story image saved! Open Instagram → swipe right to create a Story → select this image from your gallery.";
    sharePlatformWithDownloadOnly(storyCardRef, filename, shareText, successToastMessage);
  };

  const copyPageLink = async () => {
    try {
      await navigator.clipboard.writeText("https://lumobites.net/twin");
      setShareStatus("Link copied!");
      setTimeout(() => setShareStatus(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const shareMyTwin = async () => {
    if (!result || !squareCardRef.current) return;
    setIsSharing(true);
    setError(null);
    setShareStatus(null);

    try {
      const canvas = await html2canvas(squareCardRef.current, {
        useCORS: true,
        allowTaint: true,
        scale: 1.5,
        width: 1080,
        height: 1080
      });

      canvas.toBlob(async (blob) => {
        if (blob) {
          const imageFile = new File([blob], `${result.breed.replace(/\s+/g, '_')}_twin.png`, { type: 'image/png' });
          const shareText = `Just found my pet twin on Lumo Bites — I'm a ${result.breed}! 😂🐾 Find yours free at lumobites.net/twin`;

          // Check if Web Share API is available with files support
          if (navigator.share && navigator.canShare && navigator.canShare({ files: [imageFile] })) {
            try {
              await navigator.share({
                files: [imageFile],
                title: 'My Pet Twin',
                text: shareText
              });
              setIsSharing(false);
              return;
            } catch (shareErr) {
              console.error("Web Share API failed:", shareErr);
              // Fallback to desktop behavior below if user cancelled or failed
            }
          }

          // Desktop/Fallback behavior:
          // 1. Download image
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `${result.breed.replace(/\s+/g, '_')}_twin.png`;
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);

          // 2. Copy share text to clipboard
          try {
            await navigator.clipboard.writeText(shareText);
          } catch (clipErr) {
            console.error("Clipboard copy failed:", clipErr);
          }

          // 3. Show status toast
          setShareStatus("Card downloaded! Share it on social media");
          setTimeout(() => setShareStatus(null), 5000);
        } else {
          setError("Could not generate share image. Please try again.");
        }
        setIsSharing(false);
      }, 'image/png');

    } catch (err) {
      console.error("Share capture error:", err);
      setError("An error occurred while preparing your share card.");
      setIsSharing(false);
    }
  };

  const getWhatsAppShareUrl = () => {
    const text = `Just found my pet twin on Lumo Bites — I'm a ${result?.breed}! 😂🐾 Find yours free at https://lumobites.net/twin`;
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-[#555555] bg-[#FDFAF7] pt-[52px] md:pt-0">
      
      {/* NAVBAR */}
            <MobileCommunityNav />

      <main className={`flex-1 flex flex-col items-center py-12 px-6 ${(showEmailModal || showUpgradeModal) ? 'blur-md pointer-events-none select-none' : ''}`}>
        <div className="w-full max-w-[650px] bg-white rounded-3xl border border-[#EEEEEE] shadow-[0_12px_40px_rgba(0,0,0,0.03)] p-8 md:p-10 relative overflow-hidden">
          
          {/* HEADER */}
          <div className="text-center mb-8 flex flex-col items-center">
            <div className="inline-flex items-center gap-1.5 bg-[#8B5E3C]/5 border border-[#8B5E3C]/10 text-[#8B5E3C] text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-[#8B5E3C]">
                <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.6 3.102-1.196 4.622c-.21.81.67 1.45 1.366 1.012L10 15.71l4.217 2.341c.697.438 1.577-.202 1.366-1.012l-1.196-4.622 3.6-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
              </svg>
              AI Breed Matching
            </div>
            <h1 className="text-3xl md:text-4xl font-[900] text-[#191919] tracking-tight mb-3">
              Find Your Pet Twin
            </h1>
            <p className="text-[15px] text-[#666666] font-medium leading-relaxed max-w-[450px]">
              Discover which dog or cat breed matches your personality and traits using our advanced visual AI
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl flex items-center justify-center gap-1.5 font-medium">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              {error}
            </div>
          )}

          {shareStatus && (
            <div className="mb-6 p-4 bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] rounded-xl text-center font-bold animate-bounce flex items-center justify-center gap-2 shadow-xs">
              <Sparkles className="w-4 h-4 text-emerald-600" /> {shareStatus}
            </div>
          )}

          {/* STEP 0: QUIZ */}
          {step === 'quiz' && (
            <div className="flex flex-col gap-6 w-full text-left">
              {/* Progress indicator */}
              <div className="w-full flex justify-between items-center text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">
                <span>Personality Quiz</span>
                <span>Question {currentQuizQuestion + 1} of 5</span>
              </div>
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden mb-4 border border-gray-150/40">
                <div 
                  className="bg-[#8B5E3C] h-full transition-all duration-300"
                  style={{ width: `${(currentQuizQuestion + 1) * 20}%` }}
                ></div>
              </div>

              <h2 className="text-xl font-black text-[#191919] leading-tight mb-4">
                {QUIZ_QUESTIONS[currentQuizQuestion].question}
              </h2>

              <div className="flex flex-col gap-3.5">
                {QUIZ_QUESTIONS[currentQuizQuestion].options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      const key = QUIZ_QUESTIONS[currentQuizQuestion].key as keyof typeof quizAnswers;
                      setQuizAnswers(prev => ({
                        ...prev,
                        [key]: option.value
                      }));
                      
                      if (currentQuizQuestion < 4) {
                        setCurrentQuizQuestion(prev => prev + 1);
                      } else {
                        setStep('upload');
                      }
                    }}
                    className="w-full bg-[#FCFBF9]/60 hover:bg-[#FAF6F4] text-gray-700 font-bold py-4 px-6 rounded-2xl border border-gray-200 hover:border-[#8B5E3C] transition-all text-left shadow-xs flex items-center justify-between group cursor-pointer text-sm"
                  >
                    <span>{option.label}</span>
                    <span className="text-[#8B5E3C] opacity-0 group-hover:opacity-100 transition-opacity font-extrabold text-base">&rarr;</span>
                  </button>
                ))}
              </div>

              {currentQuizQuestion > 0 && (
                <button
                  onClick={() => setCurrentQuizQuestion(prev => prev - 1)}
                  className="mt-6 text-xs text-[#8B5E3C] font-bold hover:underline bg-transparent border-none cursor-pointer self-start"
                >
                  &larr; Back to previous question
                </button>
              )}
            </div>
          )}

          {/* STEP 1: UPLOAD */}
          {step === 'upload' && (
            cameraActive ? (
              <div className="flex flex-col items-center gap-6 w-full">
                <div className="w-full h-80 rounded-2xl overflow-hidden bg-black shadow-inner border border-[#D9C0A8] relative">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  <div className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse flex items-center gap-1.5 shadow-sm">
                    <span className="w-2 h-2 bg-white rounded-full"></span> LIVE
                  </div>
                  <button
                    onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')}
                    className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white text-xs font-bold px-3.5 py-2 rounded-full flex items-center gap-1.5 shadow-md border border-white/20 transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4 animate-spin-slow" /> Switch Camera
                  </button>
                </div>
                
                <div className="flex gap-3 w-full max-w-[340px]">
                  <button 
                    onClick={captureSelfie}
                    className="flex-1 bg-[#8B5E3C] text-white py-3.5 px-4 rounded-xl font-bold hover:bg-[#734A2E] transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    <Camera className="w-4 h-4" /> Capture Photo
                  </button>
                  <button 
                    onClick={stopCamera}
                    className="flex-1 bg-white border-2 border-[#D9C0A8] text-[#8B5E3C] py-3.5 px-4 rounded-xl font-bold hover:bg-[#FDF9F5] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <X className="w-4 h-4" /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-6 w-full">
                {/* Clean Minimalist Dropzone */}
                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className="group relative border-2 border-dashed border-gray-200 hover:border-[#8B5E3C] bg-[#FCFBF9]/60 hover:bg-white rounded-2xl p-8 md:p-10 text-center flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-300 hover:shadow-[0_8px_24px_rgba(139,94,60,0.03)]"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileSelect} 
                    accept="image/*" 
                    className="hidden" 
                  />
                  <input 
                    type="file" 
                    ref={cameraInputRef} 
                    onChange={handleFileSelect} 
                    accept="image/*"
                    capture="user"
                    className="hidden" 
                  />
                  
                  {/* Modern Illustrative Icon */}
                  <div className="w-16 h-16 bg-white border border-gray-100 rounded-2xl flex items-center justify-center shadow-xs group-hover:scale-105 group-hover:border-[#8B5E3C]/20 transition-all duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-gray-400 group-hover:text-[#8B5E3C] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
                    </svg>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-base text-gray-700 group-hover:text-[#8B5E3C] transition-colors">
                      Drag & drop your pet photo here
                    </span>
                    <span className="text-sm text-gray-500">
                      or <span className="text-[#8B5E3C] font-semibold hover:underline">browse files</span> from your device
                    </span>
                  </div>
                  
                  <span className="text-xs text-gray-400 font-medium">
                    Supports JPG, PNG, or WEBP up to 10MB
                  </span>
                </div>

                {/* Minimal Divider */}
                <div className="flex items-center gap-4 py-2">
                  <div className="flex-1 h-px bg-gray-100"></div>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">or</span>
                  <div className="flex-1 h-px bg-gray-100"></div>
                </div>

                {/* Live Action Selfie Option */}
                <button 
                  onClick={(e) => { e.stopPropagation(); setCameraActive(true); }}
                  className="w-full bg-[#8B5E3C] hover:bg-[#734A2E] text-white py-4 px-6 rounded-2xl font-bold transition-all flex items-center justify-center gap-2.5 shadow-[0_4px_14px_rgba(139,94,60,0.12)] hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                  </svg>
                  Use Live Camera / Take Selfie
                </button>

                {/* Secure Privacy Banner */}
                <div className="flex items-center justify-center gap-2 bg-[#F6FDF9] border border-[#E7F6EC] py-2.5 px-4 rounded-xl text-xs text-gray-500 font-medium mt-2 shadow-xs">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                  </svg>
                  <span>Your photo is private by default — we never save or share it without your permission. You can choose to share your result to our public gallery after matching.</span>
                </div>
              </div>
            )
          )}

          {/* STEP 2: ANALYZING */}
          {step === 'analyzing' && (
            <div className="flex flex-col items-center justify-center py-20 gap-8 w-full">
              {analysisTimeout ? (
                <div className="flex flex-col items-center justify-center max-w-md w-full bg-white border border-[#EBEBEB] rounded-3xl p-8 text-center shadow-md gap-6 animate-fade-in">
                  <div className="w-16 h-16 bg-[#FFF2F2] border border-[#FFE0E0] rounded-2xl flex items-center justify-center shadow-xs animate-bounce">
                    <AlertTriangle className="w-8 h-8 text-[#FF3E6C]" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-xl font-extrabold text-[#191919]">Analysis Taking Too Long</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">
                      This is taking longer than usual. Please try again.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 w-full mt-2">
                    <button
                      onClick={handleRetry}
                      className="flex-1 bg-[#8B5E3C] text-white py-3.5 px-4 rounded-xl font-bold hover:bg-[#734A2E] transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4" /> Retry Match
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex-1 bg-white border-2 border-[#D9C0A8] text-[#8B5E3C] py-3.5 px-4 rounded-xl font-bold hover:bg-[#FDF9F5] transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <X className="w-4 h-4" /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {previewUrl && (
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#F5EDE4] shadow-md relative">
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-[#8B5E3C] bg-opacity-20 flex items-center justify-center">
                        <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-[#8B5E3C] animate-pulse text-center">
                    {LOADING_MESSAGES[loadingIndex]}
                  </h3>
                </>
              )}
            </div>
          )}

          {/* STEP 3: RESULT SCREEN */}
          {step === 'result' && result && (
            <div className="flex flex-col items-center gap-6 w-full relative">
              
              {!isPro && (
                <div className="absolute inset-0 z-50 bg-white/40 backdrop-blur-xl flex flex-col items-start pt-16 md:justify-center md:pt-0 items-center p-4 text-center animate-fade-in rounded-3xl">
                  <div className="bg-white p-8 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.08)] border border-[#EEEEEE] w-full max-w-[400px] flex flex-col items-center animate-scale-up">
                    <div className="bg-[#FAF6F4] w-16 h-16 rounded-full flex items-center justify-center mb-5 shadow-inner">
                      <Sparkles className="w-8 h-8 text-[#8B5E3C]" />
                    </div>
                    <h3 className="text-2xl font-black text-[#191919] mb-3 leading-tight">Your Pet Twin is ready!</h3>
                    <p className="text-[#666666] font-medium text-[15px] mb-8">
                      Create a free account to reveal your match and discover your shared personality traits 🐾
                    </p>
                    <button
                      onClick={() => window.dispatchEvent(new Event('lumo-open-signin'))}
                      className="w-full bg-[#8B5E3C] hover:bg-[#734A2E] text-white py-4 px-6 rounded-xl font-black text-[15px] shadow-[0_4px_14px_rgba(139,94,60,0.4)] transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                    >
                      Reveal My Match — Sign Up Free
                    </button>
                  </div>
                </div>
              )}
              
              {/* Web UI Preview Card */}
              <div className="w-full bg-white border border-[#EBEBEB] rounded-3xl p-6 md:p-8 flex flex-col items-center gap-6 shadow-md relative overflow-hidden">
                
                {/* Match Badge */}
                <div className="absolute top-4 right-4 bg-[#1E1E1E] text-white font-bold text-[11px] px-3.5 py-1.5 rounded-full shadow-xs tracking-wider uppercase">
                  {result.matchScore}% Match
                </div>

                <div className="text-center mt-2">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Your Pet Twin Match</span>
                  <h2 className="text-3xl md:text-4xl font-extrabold text-[#191919] tracking-tight mt-1">
                    {result.breed}
                  </h2>
                </div>

                {/* Redesigned Side-by-Side Images with Match % in Middle */}
                <div className="flex items-center justify-between w-full my-4 relative max-w-[480px]">
                  {/* YOU Photo */}
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-4 border-white shadow-md relative shrink-0">
                    {previewUrl && <img src={previewUrl} alt="You" className="w-full h-full object-cover" />}
                    <span className="absolute bottom-1 right-2 text-[9px] bg-black/60 text-white px-2 py-0.5 rounded-full font-bold">You</span>
                  </div>
                  
                  {/* Big Match Percentage Badge in Middle */}
                  <div className="flex flex-col items-center justify-center bg-[#8B5E3C] text-white w-20 h-20 rounded-full border-4 border-white shadow-md shrink-0 z-10">
                    <span className="text-xl sm:text-2xl font-black">{result.matchScore}%</span>
                    <span className="text-[9px] font-bold uppercase tracking-wider">Match</span>
                  </div>

                  {/* TWIN Photo */}
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-4 border-white shadow-md relative shrink-0 bg-[#F9F7F5] flex items-center justify-center">
                    {imageError ? (
                      result.petType === 'cat' ? (
                        <Cat className="w-10 h-10 text-[#8B7E7D]" />
                      ) : (
                        <Dog className="w-10 h-10 text-[#8B7E7D]" />
                      )
                    ) : (
                      <img 
                        src={result.unsplashImageUrl} 
                        alt={result.breed} 
                        className="w-full h-full object-cover" 
                        onError={() => setImageError(true)}
                      />
                    )}
                    <span className="absolute bottom-1 right-2 text-[9px] bg-black/60 text-white px-2 py-0.5 rounded-full font-bold">Twin</span>
                  </div>
                </div>

                {/* Compatibility sentence */}
                <div className="w-full bg-[#FAF6F4] border border-[#8B5E3C]/10 rounded-2xl py-3 px-4 text-center mt-1 text-sm font-bold text-[#8B5E3C] leading-normal shadow-xs">
                  Your Pet Twin is a {result.breed} &mdash; you are most compatible with {result.compatibility}!
                </div>

                {/* Personality Traits */}
                <div className="flex flex-wrap justify-center gap-2 mt-2 w-full max-w-[90%]">
                  {result.traits.map((trait, index) => (
                    <span 
                      key={index}
                      className="bg-white border border-[#EBEBEB] text-[#333333] font-medium text-xs px-3.5 py-1.5 rounded-full shadow-xs"
                    >
                      {trait}
                    </span>
                  ))}
                </div>

                {/* Quote */}
                <div className="w-full text-center border-t border-[#F2ECE6] pt-5 mt-2">
                  <p className="text-[#444444] font-medium text-lg italic leading-relaxed max-w-[90%] mx-auto">
                    &quot;{result.quote}&quot;
                  </p>
                  <p className="text-sm text-gray-500 mt-3 max-w-[90%] mx-auto font-normal leading-relaxed">
                    {result.reason}
                  </p>
                </div>

                {/* Rich Details Section */}
                <div className="w-full flex flex-col gap-5 border-t border-[#F2ECE6] pt-5 mt-2 text-left text-sm text-[#444444]">
                  {/* Personality Breakdown */}
                  <div>
                    <h4 className="text-xs font-black text-[#8B5E3C] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#8B5E3C]" /> Personality Breakdown
                    </h4>
                    <p className="text-gray-600 leading-relaxed font-semibold">
                      {result.personalityBreakdown}
                    </p>
                  </div>

                  {/* You and Your Pet Twin Both */}
                  {result.bothSection && result.bothSection.length > 0 && (
                    <div>
                      <h4 className="text-xs font-black text-[#8B5E3C] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#8B5E3C]" /> You & Your Twin Both...
                      </h4>
                      <ul className="space-y-1.5">
                        {result.bothSection.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-gray-600 font-bold">
                            <span className="text-[#8B5E3C] shrink-0 font-extrabold">&#10003;</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Famous Pets */}
                    {result.famousPets && result.famousPets.length > 0 && (
                      <div className="bg-[#FAF6F4]/50 border border-[#E8DDD4]/65 rounded-xl p-3.5">
                        <h4 className="text-[11px] font-black text-[#8B5E3C] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                          <Star className="w-3 h-3 text-[#8B5E3C] fill-current" /> Famous {result.breed}s
                        </h4>
                        <ul className="space-y-1 text-xs text-gray-500 font-medium">
                          {result.famousPets.map((pet, idx) => (
                            <li key={idx}>&bull; {pet}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Celebrity Match */}
                    {result.celebrityMatch && (
                      <div className="bg-[#FAF6F4]/50 border border-[#E8DDD4]/65 rounded-xl p-3.5">
                        <h4 className="text-[11px] font-black text-[#8B5E3C] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                          <Star className="w-3 h-3 text-[#8B5E3C] fill-current" /> Celebrity Match
                        </h4>
                        <p className="text-xs text-gray-500 font-medium leading-relaxed">
                          {result.celebrityMatch}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer branding */}
                <div className="w-full flex justify-between items-center bg-[#F9F7F5] rounded-2xl p-4 mt-6 border border-[#EBEBEB] box-border">
                  <div className="flex items-center gap-3">
                    <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                      <img src="/lumo-bites-logo.png" alt="Lumo Bites Logo" className="h-6 object-contain" />
                      <sup style={{ fontSize: '8px', color: '#8B5A2B', fontWeight: 'bold', alignSelf: 'flex-start', marginTop: '-2px', marginLeft: '1px', fontFamily: 'sans-serif', userSelect: 'none' }}>™</sup>
                    </div>
                    <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider hidden sm:inline">Find Your Pet Twin Free</span>
                  </div>
                  <span className="text-xs font-bold text-[#8B5E3C]">lumobites.net/twin</span>
                </div>

              </div>

              {/* CTAs & Options */}
              <div className="w-full flex flex-col gap-4 mt-4">
                
                {/* 1. Explore Breed Resources */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                  <Link 
                    href={`/results?breed=${encodeURIComponent(result.breed)}`}
                    className="bg-[#8B5E3C] text-white py-3.5 rounded-xl font-bold text-sm text-center hover:bg-[#734A2E] transition-colors shadow-sm flex items-center justify-center gap-1.5"
                    style={{ textDecoration: 'none' }}
                  >
                    <Dog className="w-4 h-4" /> Find Best Food for {result.breed}
                  </Link>
                  <Link 
                    href="/petsitting"
                    className="bg-gradient-to-r from-[#FFB703] to-[#FB8500] hover:from-[#F5A623] hover:to-[#E67E22] text-white py-3.5 rounded-xl font-bold text-sm text-center transition-colors shadow-md flex items-center justify-center gap-1.5"
                    style={{ textDecoration: 'none' }}
                  >
                    <Footprints className="w-4 h-4 text-white" /> Search Sitters Near You &rarr;
                  </Link>
                </div>

                {/* 2. Public Gallery Opt-In Share Card */}
                <div className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-2xl p-4 flex flex-col gap-3 text-left">
                  <div className="flex items-start gap-3">
                    <input 
                      type="checkbox"
                      id="share-gallery-optin"
                      checked={agreedToShare}
                      onChange={(e) => {
                        setAgreedToShare(e.target.checked);
                        if (!e.target.checked) {
                          setPublicShareStatus('idle');
                        }
                      }}
                      disabled={publicShareStatus === 'shared' || publicShareStatus === 'sharing'}
                      className="mt-1 w-4.5 h-4.5 rounded border-[#D9C0A8] text-[#8B5E3C] focus:ring-[#8B5E3C]/20 cursor-pointer"
                    />
                    <div className="flex-1">
                      <label htmlFor="share-gallery-optin" className="text-sm font-bold text-[#4A3E3D] cursor-pointer flex items-center gap-1.5">
                        Share on Lumo Bites Public Gallery <Footprints className="w-4 h-4 text-gray-500" />
                      </label>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                        Optional: Tick this box to share your selfie and matched pet twin in our public directory for other pet lovers to see!
                      </p>
                    </div>
                  </div>

                  {agreedToShare && publicShareStatus !== 'shared' && (
                    <div className="mt-1.5 flex flex-col gap-2 pl-7.5 animate-fade-in w-full">
                      <label className="text-[11px] font-bold text-[#666] leading-relaxed">
                        Email (optional) — we'll send you a link to remove your result anytime
                      </label>
                      <div className="flex gap-2 w-full">
                        <input
                          type="email"
                          value={shareEmail}
                          onChange={(e) => setShareEmail(e.target.value)}
                          disabled={publicShareStatus === 'sharing'}
                          placeholder="your@email.com"
                          className="flex-1 bg-white border border-[#D9C0A8] rounded-xl px-3 py-1.5 text-xs text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C] focus:ring-2 focus:ring-[#8B5E3C]/10 transition-all"
                        />
                        <button
                          onClick={() => handlePublicShare()}
                          disabled={publicShareStatus === 'sharing'}
                          className="bg-[#8B5E3C] hover:bg-[#734A2E] text-white text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer disabled:bg-gray-400 flex items-center gap-1 shrink-0 justify-center"
                        >
                          {publicShareStatus === 'sharing' ? 'Sharing...' : (
                            <>
                              Share Now
                              <Footprints className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {publicShareStatus === 'sharing' && (
                    <p className="text-xs text-[#8B5E3C] font-semibold animate-pulse flex items-center gap-1.5 pl-7">
                      <span className="w-3.5 h-3.5 border-2 border-[#8B5E3C] border-t-transparent rounded-full animate-spin"></span>
                      Posting to public gallery...
                    </p>
                  )}
                  {publicShareStatus === 'shared' && (
                    <p className="text-xs text-emerald-600 font-bold flex items-center gap-1.5 pl-7">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Shared successfully! Thank you for sharing your pet twin!
                    </p>
                  )}
                  {publicShareStatus === 'error' && (
                    <p className="text-xs text-red-500 font-semibold pl-7 flex items-center gap-1.5">
                      <XCircle className="w-4 h-4 text-red-500 shrink-0" /> Failed to share. Please check your connection and try again.
                    </p>
                  )}
                </div>

                {/* 3. Unified Social Share & Download Card */}
                <div className="w-full bg-white border border-[#EBEBEB] rounded-2xl p-5 flex flex-col gap-4 text-center shadow-xs">
                  <span className="text-xs font-black text-[#8B5E3C] uppercase tracking-wider">Share & Save Your Twin</span>
                  
                  <div className="flex flex-col sm:flex-row gap-3 w-full">
                    {/* Share My Twin (Web Share / Native) */}
                    <button 
                      onClick={shareMyTwin}
                      disabled={isSharing}
                      className="flex-1 bg-[#8B5E3C] text-white border border-[#8B5E3C] py-3.5 rounded-xl font-bold text-sm hover:bg-[#734A2E] hover:border-[#734A2E] disabled:bg-gray-400 disabled:border-gray-400 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isSharing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Generating Card...
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-4 h-4" /> Share My Twin
                        </>
                      )}
                    </button>

                    {/* Share to Instagram Story (Gradient) */}
                    <button 
                      onClick={shareToInstagramStory}
                      className="flex-1 bg-gradient-to-r from-[#ee2a7b] to-[#6228d7] hover:from-[#d6246e] hover:to-[#551ec0] text-white py-3.5 rounded-xl font-bold text-sm text-center transition-colors shadow-md flex items-center justify-center gap-1.5 cursor-pointer border-0"
                    >
                      <Camera className="w-4 h-4 text-white" /> Instagram Stories 📸
                    </button>
                  </div>

                  {/* Share Link Row (WhatsApp, FB, Twitter/X, Copy Link) */}
                  <div className="flex flex-col items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Share Link:</span>
                    <div className="flex items-center justify-center gap-4">
                      {/* WhatsApp */}
                      <button
                        onClick={shareToWhatsApp}
                        className="w-10 h-10 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
                        title="Share on WhatsApp"
                      >
                        <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.451 5.437.002 9.859-4.416 9.862-9.852.002-2.633-1.02-5.107-2.88-6.97C16.39 1.905 13.916.88 11.288.88 5.856.88 1.437 5.298 1.435 10.734c-.001 1.558.411 3.076 1.196 4.417L1.674 21.03l6.095-1.599.278.169zM18.8 15.39c-.33-.164-1.953-.964-2.253-1.074-.3-.11-.519-.165-.738.165-.219.33-.849 1.073-1.04 1.293-.191.22-.383.247-.713.082-.33-.165-1.393-.513-2.653-1.636-.98-.873-1.643-1.953-1.835-2.283-.192-.33-.021-.508.144-.672.148-.148.33-.385.495-.578.165-.192.22-.33.33-.55.11-.22.055-.413-.028-.578-.083-.166-.738-1.782-1.01-2.44-.267-.643-.538-.553-.738-.553-.191 0-.41-.013-.629-.013-.218 0-.575.082-.876.412-.3.33-1.15 1.127-1.15 2.746 0 1.62 1.178 3.189 1.34 3.41.164.22 2.318 3.54 5.616 4.966.783.339 1.396.541 1.873.693.788.25 1.505.215 2.072.13.633-.095 1.953-.798 2.227-1.57.275-.77 2.75-1.897 1.897-2.072zm0 0"/>
                        </svg>
                      </button>

                      {/* Facebook */}
                      <button
                        onClick={shareToFacebook}
                        className="w-10 h-10 rounded-full bg-[#1877F2] hover:bg-[#166fe5] text-white flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
                        title="Share on Facebook"
                      >
                        <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                      </button>

                      {/* Twitter/X */}
                      <button
                        onClick={shareToTwitter}
                        className="w-10 h-10 rounded-full bg-[#000000] hover:bg-[#191919] text-white flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
                        title="Share on X (Twitter)"
                      >
                        <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                      </button>

                      {/* Copy Link */}
                      <button
                        onClick={copyPageLink}
                        className="w-10 h-10 rounded-full bg-[#7F8C8D] hover:bg-[#707b7c] text-white flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
                        title="Copy Link"
                      >
                        <svg className="w-4.5 h-4.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Download Card Section */}
                  <div className="flex flex-col items-center gap-2 mt-2 pt-3 border-t border-[#FAF6F4]">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      Save Image Card:
                    </span>
                    <div className="grid grid-cols-3 gap-2.5 w-full">
                      <button 
                        onClick={downloadSquareCard}
                        className="bg-white border border-[#E5E0DA] text-[#666666] py-2.5 rounded-xl font-medium text-xs hover:bg-[#F9F7F5] hover:text-[#444444] transition-all flex items-center justify-center gap-1 shadow-xs cursor-pointer text-center"
                      >
                        Square (1:1)
                      </button>
                      <button 
                        onClick={downloadStoryCard}
                        className="bg-white border border-[#E5E0DA] text-[#666666] py-2.5 rounded-xl font-medium text-xs hover:bg-[#F9F7F5] hover:text-[#444444] transition-all flex items-center justify-center gap-1 shadow-xs cursor-pointer text-center"
                      >
                        Story (9:16)
                      </button>
                      <button 
                        onClick={downloadTwitterCard}
                        className="bg-white border border-[#E5E0DA] text-[#666666] py-2.5 rounded-xl font-medium text-xs hover:bg-[#F9F7F5] hover:text-[#444444] transition-all flex items-center justify-center gap-1 shadow-xs cursor-pointer text-center"
                      >
                        Landscape (16:9)
                      </button>
                    </div>
                  </div>
                </div>

                {/* 4. Start Over (Try Again) */}
                <div className="w-full mt-2">
                  <button 
                    onClick={() => {
                      if (!checkTwinLimit()) return;
                      setResult(null);
                      setFile(null);
                      setPreviewUrl(null);
                      setImageError(false);
                      setAgreedToShare(false);
                      setShareEmail('');
                      setPublicShareStatus('idle');
                      setQuizAnswers({
                        weekend: '',
                        energy: '',
                        strangers: '',
                        friends: '',
                        trait: ''
                      });
                      setCurrentQuizQuestion(0);
                      setStep('quiz');
                    }}
                    className="w-full bg-white border border-[#D9C0A8] text-[#8B5E3C] py-3.5 rounded-xl font-bold text-sm hover:bg-[#FDF9F5] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="w-4 h-4" /> Match Another Photo / Try Again
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>
      </main>

      {/* ── UPGRADE TO PRO MODAL ── */}
      {showUpgradeModal && (
        <div className="modal-overlay fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-fade-in pointer-events-auto">
          <div className="bg-white rounded-3xl p-6 pb-32 md:p-8 max-w-md w-full shadow-2xl border border-gray-100 flex flex-col gap-6 relative animate-scale-up text-center">
            
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
                    Thank you for supporting Lumo Bites. You have unlimited Pet Twin matches and member features active.
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
                  <Footprints className="w-10 h-10 text-[#8B5E3C] mx-auto mb-3" />
                  <h3 className="text-2xl font-black text-[#191919] leading-tight text-center">
                    Want to try again?
                  </h3>
                  <p className="text-sm text-gray-500 mt-3 font-medium text-center leading-relaxed">
                    Create a free account for unlimited Pet Twin matches — plus contact verified pet sitters, email recall alerts, and unlimited food scans.
                  </p>
                </div>

                <div className="bg-[#FAF6F4] border border-[#8B5E3C]/10 rounded-2xl py-3 px-4 inline-block mx-auto text-center">
                  <span className="text-[#8B5E3C] font-extrabold text-base md:text-lg">Free Early Access Account 🐾</span>
                </div>

                <div className="bg-gray-50/60 rounded-2xl p-4 text-left border border-gray-100">
                  <ul className="space-y-2.5 text-xs text-gray-700 font-bold">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" /> Unlimited Pet Twin matches
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" /> Instant FDA email recall alerts
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" /> Contact verified pet sitters directly
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
                        Come back tomorrow for your free match
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

      {/* ========================================================
          1080x1080 INSTAGRAM SQUARE SHARE CARD TEMPLATE (OFF-SCREEN)
          ======================================================== */}
      {result && (
        <div 
          ref={squareCardRef}
          style={{
            position: 'absolute',
            left: '-9999px',
            top: '-9999px',
            width: '1080px',
            height: '1080px',
            background: '#FFFFFF',
            border: '20px solid #FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '70px 50px',
            color: '#191919',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            boxSizing: 'border-box',
            boxShadow: '0 20px 50px rgba(0,0,0,0.05)'
          }}
        >
          {/* Top Header */}
          <div style={{ textAlign: 'center', width: '100%' }}>
            <div style={{ fontSize: '20px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '3px', color: '#8B5E3C', marginBottom: '8px' }}>
              Your Pet Twin Match
            </div>
            <h2 style={{
              fontSize: '68px',
              fontWeight: 900,
              margin: 0,
              color: '#191919',
              letterSpacing: '-2px',
              lineHeight: 1.1
            }}>
              {result.breed}
            </h2>
          </div>

          {/* Double Photos Side-by-Side with Match % in Middle */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '30px',
            margin: '20px 0',
            width: '100%',
            position: 'relative'
          }}>
            {/* YOU photo column */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' }}>
              <div style={{
                width: '260px',
                height: '260px',
                borderRadius: '40px',
                overflow: 'hidden',
                border: '10px solid #FFFFFF',
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
              }}>
                {previewUrl && <img src={previewUrl} alt="You" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              </div>
              <span style={{
                color: '#888888',
                fontSize: '18px',
                fontWeight: 'bold',
                letterSpacing: '2px'
              }}>YOU</span>
            </div>

            {/* Match Score Badge (in the middle) */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#8B5E3C',
              color: 'white',
              width: '140px',
              height: '140px',
              borderRadius: '50%',
              border: '8px solid white',
              boxShadow: '0 12px 30px rgba(139,94,60,0.25)',
              margin: '0 -20px 30px -20px',
              zIndex: 10
            }}>
              <span style={{ fontSize: '38px', fontWeight: 900 }}>{result.matchScore}%</span>
              <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Match</span>
            </div>

            {/* TWIN photo column */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' }}>
              <div style={{
                width: '260px',
                height: '260px',
                borderRadius: '40px',
                overflow: 'hidden',
                border: '10px solid #FFFFFF',
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                background: '#F9F7F5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {imageError ? (
                  result.petType === 'cat' ? (
                    <Cat style={{ width: '90px', height: '90px', color: '#8B7E7D' }} />
                  ) : (
                    <Dog style={{ width: '90px', height: '90px', color: '#8B7E7D' }} />
                  )
                ) : (
                  <img 
                    src={result.unsplashImageUrl} 
                    alt="Twin" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    onError={() => setImageError(true)}
                  />
                )}
              </div>
              <span style={{
                color: '#888888',
                fontSize: '18px',
                fontWeight: 'bold',
                letterSpacing: '2px'
              }}>TWIN</span>
            </div>
          </div>

          {/* Personality Traits */}
          <div style={{
            display: 'flex',
            gap: '14px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            width: '100%'
          }}>
            {result.traits.map((trait, index) => (
              <span 
                key={index}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #EBEBEB',
                  color: '#333333',
                  fontWeight: 600,
                  fontSize: '20px',
                  padding: '10px 24px',
                  borderRadius: '100px',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.02)'
                }}
              >
                {trait}
              </span>
            ))}
          </div>

          {/* Custom Quote */}
          <div style={{
            textAlign: 'center',
            maxWidth: '850px',
            padding: '10px 0 20px 0'
          }}>
            <p style={{
              fontSize: '28px',
              fontWeight: 500,
              fontStyle: 'italic',
              color: '#444444',
              margin: 0,
              lineHeight: 1.4
            }}>
              &quot;{result.quote}&quot;
            </p>
          </div>

          {/* Footer branding */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            background: '#FFFFFF',
            borderRadius: '24px',
            padding: '24px 40px',
            boxSizing: 'border-box',
            border: '1px solid #EBEBEB'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ background: '#FFFFFF', padding: '8px 16px', borderRadius: '12px', border: '1px solid #EBEBEB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <img src="/lumo-bites-logo.png" alt="Lumo Bites" style={{ height: '55px', objectFit: 'contain' }} />
                  <span style={{ fontSize: '18px', color: '#8B5A2B', fontWeight: 'bold', alignSelf: 'flex-start', marginTop: '-4px', marginLeft: '2px', fontFamily: 'sans-serif', userSelect: 'none' }}>™</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '20px', fontWeight: 700, color: '#8B5E3C' }}>lumobites.net/twin</span>
                <span style={{ fontSize: '16px', color: '#666666', fontWeight: 400 }}>Find Your Pet Twin Free</span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================
          1080x1920 INSTAGRAM STORY SHARE CARD TEMPLATE (OFF-SCREEN)
          ======================================================== */}
      {result && (
        <div 
          ref={storyCardRef}
          style={{
            position: 'absolute',
            left: '-9999px',
            top: '-9999px',
            width: '1080px',
            height: '1920px',
            background: '#FFFFFF',
            border: '24px solid #FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '120px 60px 100px 60px',
            color: '#191919',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            boxSizing: 'border-box',
            boxShadow: '0 20px 50px rgba(0,0,0,0.05)'
          }}
        >
          {/* Top Header */}
          <div style={{ textAlign: 'center', width: '100%' }}>
            <div style={{ fontSize: '28px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '4px', color: '#8B5E3C', marginBottom: '15px' }}>
              My Pet Twin is a
            </div>
            <h2 style={{
              fontSize: '84px',
              fontWeight: 950,
              margin: 0,
              color: '#191919',
              letterSpacing: '-3px',
              lineHeight: 1.1
            }}>
              {result.breed}!
            </h2>
          </div>

          {/* Double Photos Side-by-Side with Match % in Middle */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '30px',
            margin: '40px 0',
            width: '100%',
            position: 'relative'
          }}>
            {/* YOU photo column */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
              <div style={{
                width: '320px',
                height: '320px',
                borderRadius: '40px',
                overflow: 'hidden',
                border: '12px solid #FFFFFF',
                boxShadow: '0 24px 48px rgba(0,0,0,0.1)'
              }}>
                {previewUrl && <img src={previewUrl} alt="You" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              </div>
              <span style={{
                color: '#888888',
                fontSize: '20px',
                fontWeight: 'bold',
                letterSpacing: '3px'
              }}>YOU</span>
            </div>

            {/* Match Score Badge (in the middle) */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#8B5E3C',
              color: 'white',
              width: '160px',
              height: '160px',
              borderRadius: '50%',
              border: '10px solid white',
              boxShadow: '0 12px 30px rgba(139,94,60,0.25)',
              margin: '0 -30px 40px -30px',
              zIndex: 10
            }}>
              <span style={{ fontSize: '42px', fontWeight: 900 }}>{result.matchScore}%</span>
              <span style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Match</span>
            </div>

            {/* TWIN photo column */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
              <div style={{
                width: '320px',
                height: '320px',
                borderRadius: '40px',
                overflow: 'hidden',
                border: '12px solid #FFFFFF',
                boxShadow: '0 24px 48px rgba(0,0,0,0.1)',
                background: '#F9F7F5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {imageError ? (
                  result.petType === 'cat' ? (
                    <Cat style={{ width: '110px', height: '110px', color: '#8B7E7D' }} />
                  ) : (
                    <Dog style={{ width: '110px', height: '110px', color: '#8B7E7D' }} />
                  )
                ) : (
                  <img 
                    src={result.unsplashImageUrl} 
                    alt="Twin" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    onError={() => setImageError(true)}
                  />
                )}
              </div>
              <span style={{
                color: '#888888',
                fontSize: '20px',
                fontWeight: 'bold',
                letterSpacing: '3px'
              }}>TWIN</span>
            </div>
          </div>

          {/* Personality Traits */}
          <div style={{
            display: 'flex',
            gap: '20px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            width: '100%',
            padding: '0 20px'
          }}>
            {result.traits.map((trait, index) => (
              <span 
                key={index}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #EBEBEB',
                  color: '#333333',
                  fontWeight: 600,
                  fontSize: '24px',
                  padding: '12px 30px',
                  borderRadius: '100px',
                  boxShadow: '0 6px 15px rgba(0,0,0,0.02)'
                }}
              >
                {trait}
              </span>
            ))}
          </div>

          {/* Quote & Text */}
          <div style={{
            textAlign: 'center',
            maxWidth: '900px',
            padding: '20px 20px 0 20px'
          }}>
            <p style={{
              fontSize: '32px',
              fontWeight: 500,
              fontStyle: 'italic',
              color: '#444444',
              margin: 0,
              lineHeight: 1.4
            }}>
              &quot;{result.quote}&quot;
            </p>
          </div>

          {/* Footer branding */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '15px',
            width: '100%',
            background: '#FFFFFF',
            borderRadius: '30px',
            padding: '35px 50px',
            boxSizing: 'border-box',
            border: '1px solid #EBEBEB',
            textAlign: 'center'
          }}>
            <div style={{ background: '#FFFFFF', padding: '12px 24px', borderRadius: '16px', border: '1px solid #EBEBEB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <img src="/lumo-bites-logo.png" alt="Lumo Bites" style={{ height: '75px', objectFit: 'contain' }} />
                <span style={{ fontSize: '24px', color: '#8B5A2B', fontWeight: 'bold', alignSelf: 'flex-start', marginTop: '-6px', marginLeft: '3px', fontFamily: 'sans-serif', userSelect: 'none' }}>™</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '24px', fontWeight: 800, color: '#8B5E3C', letterSpacing: '0.5px' }}>lumobites.net/twin</span>
              <span style={{ fontSize: '18px', color: '#666666', fontWeight: 400 }}>Find Your Pet Twin Free</span>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================
          1200x675 TWITTER / X LANDSCAPE SHARE CARD TEMPLATE (OFF-SCREEN)
          ======================================================== */}
      {result && (
        <div 
          ref={twitterCardRef}
          style={{
            position: 'absolute',
            left: '-9999px',
            top: '-9999px',
            width: '1200px',
            height: '675px',
            background: '#FFFFFF',
            border: '16px solid #FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '50px 60px',
            color: '#191919',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            boxSizing: 'border-box',
            boxShadow: '0 20px 50px rgba(0,0,0,0.05)'
          }}
        >
          {/* Top Header */}
          <div style={{ textAlign: 'center', width: '100%' }}>
            <div style={{ fontSize: '16px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '3px', color: '#8B5E3C', marginBottom: '4px' }}>
              Your Pet Twin Match
            </div>
            <h2 style={{
              fontSize: '52px',
              fontWeight: 900,
              margin: 0,
              color: '#191919',
              letterSpacing: '-1.5px',
              lineHeight: 1.1
            }}>
              {result.breed}
            </h2>
          </div>

          {/* Middle Row: Two Photos side by side with Match % in Middle */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '24px',
            margin: '15px 0',
            width: '100%',
            position: 'relative'
          }}>
            {/* YOU photo column */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '180px',
                height: '180px',
                borderRadius: '30px',
                overflow: 'hidden',
                border: '8px solid #FFFFFF',
                boxShadow: '0 12px 24px rgba(0,0,0,0.1)'
              }}>
                {previewUrl && <img src={previewUrl} alt="You" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              </div>
              <span style={{
                color: '#888888',
                fontSize: '14px',
                fontWeight: 'bold',
                letterSpacing: '2px'
              }}>YOU</span>
            </div>

            {/* Match Score Badge (in the middle) */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#8B5E3C',
              color: 'white',
              width: '110px',
              height: '110px',
              borderRadius: '50%',
              border: '6px solid white',
              boxShadow: '0 10px 24px rgba(139,94,60,0.25)',
              margin: '0 -15px 20px -15px',
              zIndex: 10
            }}>
              <span style={{ fontSize: '28px', fontWeight: 900 }}>{result.matchScore}%</span>
              <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Match</span>
            </div>

            {/* TWIN photo column */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '180px',
                height: '180px',
                borderRadius: '30px',
                overflow: 'hidden',
                border: '8px solid #FFFFFF',
                boxShadow: '0 12px 24px rgba(0,0,0,0.1)',
                background: '#F9F7F5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {imageError ? (
                  result.petType === 'cat' ? (
                    <Cat style={{ width: '65px', height: '65px', color: '#8B7E7D' }} />
                  ) : (
                    <Dog style={{ width: '65px', height: '65px', color: '#8B7E7D' }} />
                  )
                ) : (
                  <img 
                    src={result.unsplashImageUrl} 
                    alt="Twin" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    onError={() => setImageError(true)}
                  />
                )}
              </div>
              <span style={{
                color: '#888888',
                fontSize: '14px',
                fontWeight: 'bold',
                letterSpacing: '2px'
              }}>TWIN</span>
            </div>
          </div>

          {/* Personality Traits & Quote side-by-side or stacked cleanly */}
          <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', gap: '40px', borderTop: '1px solid #F2ECE6', paddingTop: '20px' }}>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', maxWidth: '50%' }}>
              {result.traits.map((trait, index) => (
                <span 
                  key={index}
                  style={{
                    background: '#F9F7F5',
                    border: '1px solid #EBEBEB',
                    color: '#333333',
                    fontWeight: 600,
                    fontSize: '16px',
                    padding: '8px 20px',
                    borderRadius: '100px'
                  }}
                >
                  {trait}
                </span>
              ))}
            </div>
            <p style={{
              fontSize: '22px',
              fontWeight: 500,
              fontStyle: 'italic',
              color: '#444444',
              margin: 0,
              maxWidth: '50%',
              textAlign: 'right',
              lineHeight: 1.3
            }}>
              &quot;{result.quote}&quot;
            </p>
          </div>

          {/* Bottom branding footer */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            background: '#FFFFFF',
            borderRadius: '16px',
            padding: '16px 30px',
            boxSizing: 'border-box',
            border: '1px solid #EBEBEB'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ background: '#FFFFFF', padding: '6px 12px', borderRadius: '10px', border: '1px solid #EBEBEB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <img src="/lumo-bites-logo.png" alt="Lumo Bites" style={{ height: '40px', objectFit: 'contain' }} />
                  <span style={{ fontSize: '14px', color: '#8B5A2B', fontWeight: 'bold', alignSelf: 'flex-start', marginTop: '-3px', marginLeft: '2px', fontFamily: 'sans-serif', userSelect: 'none' }}>™</span>
                </div>
              </div>
              <span style={{ fontSize: '15px', color: '#666666', fontWeight: 400 }}>Find Your Pet Twin Free</span>
            </div>
            <span style={{ fontSize: '18px', fontWeight: 700, color: '#8B5E3C' }}>lumobites.net/twin</span>
          </div>

        </div>
      )}

      {/* EMAIL CAPTURE MODAL OVERLAY */}
      {showEmailModal && (
        <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xl animate-fade-in">
          <div className="w-full max-w-[440px] bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] p-6 md:p-8 flex flex-col items-center text-center animate-scale-up relative">
            
            {/* Lumo Bites logo + trademark at the top */}
            <div className="flex items-center justify-center mb-6 relative">
              <img src="/Logo.png" alt="Lumo Bites Logo" className="h-9 object-contain" />
              <sup className="text-[9px] text-[#8B5A2B] font-bold align-self-start -mt-1 ml-0.5 select-none">™</sup>
            </div>

            {/* Title */}
            <h3 className="text-xl md:text-2xl font-[900] text-[#191919] tracking-tight mb-2 flex items-center justify-center gap-1.5">
              Your Pet Twin is Ready! <Footprints className="w-5 h-5 text-[#8B5E3C]" />
            </h3>

            {/* Subtitle */}
            <p className="text-[13px] md:text-sm text-[#666666] leading-relaxed mb-6 max-w-[340px]">
              Enter your email to reveal your match and get free FDA recall alerts for your pet
            </p>

            {/* Email form */}
            <form onSubmit={handleEmailSubmit} className="w-full flex flex-col gap-3">
              {modalError && (
                <div className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 rounded-lg p-2.5 mb-1 text-center">
                  {modalError}
                </div>
              )}
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setModalError('');
                }}
                placeholder="your@email.com"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/20 focus:border-[#8B5E3C] text-sm text-[#333333] transition-all bg-gray-50/50"
                disabled={isSubmittingEmail}
              />
              <button
                type="submit"
                disabled={isSubmittingEmail}
                className="w-full bg-[#8B5E3C] hover:bg-[#734A2E] text-white py-3 px-6 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(139,94,60,0.15)] disabled:bg-gray-400 cursor-pointer text-sm"
              >
                {isSubmittingEmail ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Revealing...
                  </>
                ) : (
                  <>Reveal My Match →</>
                )}
              </button>
            </form>

            {/* Skip button */}
            <button
              onClick={handleEmailSkip}
              disabled={isSubmittingEmail}
              className="mt-4 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              Skip for now
            </button>
          </div>
        </div>
      )}

      {/* Embedded CSS animations for the modal */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
        .animate-scale-up {
          animation: scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>

    </div>
  );
}
