'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import html2canvas from 'html2canvas';
import confetti from 'canvas-confetti';

const LOADING_MESSAGES = [
  "Sniffing out your twin... 🐽",
  "Comparing whiskers... 🐱",
  "Consulting the pack... 🐕",
  "Almost there... your twin is excited to meet you! 🎉"
];

interface TwinResult {
  breed: string;
  petType: 'cat' | 'dog';
  matchScore: number;
  traits: string[];
  quote: string;
  reason: string;
  unsplashImageUrl: string;
}

export default function TwinPage() {
  const [step, setStep] = useState<'upload' | 'analyzing' | 'result'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [result, setResult] = useState<TwinResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [imageError, setImageError] = useState(false);

  // States for email capture modal
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [email, setEmail] = useState('');
  const [modalError, setModalError] = useState('');
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);

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

  // Cycle loading messages
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'analyzing') {
      interval = setInterval(() => {
        setLoadingIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [step]);

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

  const processFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setStep('analyzing');
    setLoadingIndex(0);
    setError(null);
    setImageError(false);
    setResult(null);

    console.log(`[Twin Client] Initiating fresh API match. File: ${selectedFile.name}, size: ${selectedFile.size} bytes`);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const res = await fetch(`/api/twin?t=${Date.now()}`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      console.log("[Twin Client] Received match response data:", data);

      if (data.success) {
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
      console.error("[Twin Client] Analysis request failed:", err);
      setError('An error occurred during matching.');
      setStep('upload');
    }
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

    // 1. Mobile/Web Share API first (shows WhatsApp, Instagram, TikTok natively)
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

  const shareToTikTok = () => {
    const filename = `${result?.breed.replace(/\s+/g, '_')}_twin_story.png`;
    const shareText = `I'm a ${result?.breed}! Find your pet twin free at lumobites.net/twin`;
    const successToastMessage = "Image saved! Open TikTok → tap + → upload this photo → add your reaction and post!";
    sharePlatformWithDownloadOnly(storyCardRef, filename, shareText, successToastMessage);
  };

  const shareToInstagram = () => {
    const filename = `${result?.breed.replace(/\s+/g, '_')}_twin_square.png`;
    const shareText = `I'm a ${result?.breed}! Find your pet twin free at lumobites.net/twin`;
    const successToastMessage = "Image saved! Open Instagram → tap + → select this photo → share as post or story";
    sharePlatformWithDownloadOnly(squareCardRef, filename, shareText, successToastMessage);
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
          setShareStatus("Card downloaded! Share it on social media 📸");
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
    <div className="min-h-screen flex flex-col font-sans text-[#555555] bg-[#FDFAF7]">
      
      {/* NAVBAR */}
      <Navbar />

      <main className={`flex-1 flex flex-col items-center py-12 px-6 ${showEmailModal ? 'blur-md pointer-events-none select-none' : ''}`}>
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
            <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-center font-medium">
              ⚠️ {error}
            </div>
          )}

          {shareStatus && (
            <div className="mb-6 p-4 bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] rounded-xl text-center font-bold animate-bounce flex items-center justify-center gap-2 shadow-xs">
              🎉 {shareStatus}
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
                    🔄 Switch Camera
                  </button>
                </div>
                
                <div className="flex gap-3 w-full max-w-[340px]">
                  <button 
                    onClick={captureSelfie}
                    className="flex-1 bg-[#8B5E3C] text-white py-3.5 px-4 rounded-xl font-bold hover:bg-[#734A2E] transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    📸 Capture Photo
                  </button>
                  <button 
                    onClick={stopCamera}
                    className="flex-1 bg-white border-2 border-[#D9C0A8] text-[#8B5E3C] py-3.5 px-4 rounded-xl font-bold hover:bg-[#FDF9F5] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    ✕ Cancel
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
                  <span>Your privacy is protected — we do not save or share your photos</span>
                </div>
              </div>
            )
          )}

          {/* STEP 2: ANALYZING */}
          {step === 'analyzing' && (
            <div className="flex flex-col items-center justify-center py-20 gap-8">
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
            </div>
          )}

          {/* STEP 3: RESULT SCREEN */}
          {step === 'result' && result && (
            <div className="flex flex-col items-center gap-6 w-full">
              
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

                {/* Side-by-Side Images */}
                <div className="flex items-center gap-6 my-2">
                  <div className="w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-white shadow-[0_12px_28px_rgba(0,0,0,0.08)] relative shrink-0">
                    {previewUrl && <img src={previewUrl} alt="You" className="w-full h-full object-cover" />}
                    <span className="absolute bottom-1.5 right-3.5 text-[10px] bg-black/60 text-white px-2 py-0.5 rounded-full font-bold">You</span>
                  </div>
                  
                  <div className="text-3xl text-gray-300">🐾</div>

                  <div className="w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-white shadow-[0_12px_28px_rgba(0,0,0,0.08)] relative shrink-0 bg-[#F9F7F5] flex items-center justify-center">
                    {imageError ? (
                      <span className="text-4xl">🐕</span>
                    ) : (
                      <img 
                        src={result.unsplashImageUrl} 
                        alt={result.breed} 
                        className="w-full h-full object-cover" 
                        onError={() => setImageError(true)}
                      />
                    )}
                    <span className="absolute bottom-1.5 right-3.5 text-[10px] bg-black/60 text-white px-2 py-0.5 rounded-full font-bold">Twin</span>
                  </div>
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
              <div className="w-full flex flex-col gap-3 mt-4">
                
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <Link 
                    href={`/results?breed=${encodeURIComponent(result.breed)}`}
                    className="flex-1 bg-[#8B5E3C] text-white py-4 rounded-xl font-bold text-base text-center hover:bg-[#734A2E] transition-colors shadow-sm"
                    style={{ textDecoration: 'none' }}
                  >
                    🍖 Find Best Food for {result.breed}
                  </Link>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <Link 
                    href="/petsitting"
                    className="flex-1 bg-gradient-to-r from-[#FFB703] to-[#FB8500] hover:from-[#F5A623] hover:to-[#E67E22] text-white py-4 rounded-xl font-bold text-base text-center transition-colors shadow-md"
                    style={{ textDecoration: 'none' }}
                  >
                    🐕 Find a pet sitter who loves your breed! Search sitters near you &rarr;
                  </Link>
                </div>

                <div className="grid grid-cols-3 gap-2.5 w-full">
                  <button 
                    onClick={downloadSquareCard}
                    className="bg-white border border-[#E5E0DA] text-[#666666] py-3.5 rounded-xl font-medium text-xs hover:bg-[#F9F7F5] hover:text-[#444444] transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer text-center"
                  >
                    📸 Square (1:1)
                  </button>
                  <button 
                    onClick={downloadStoryCard}
                    className="bg-white border border-[#E5E0DA] text-[#666666] py-3.5 rounded-xl font-medium text-xs hover:bg-[#F9F7F5] hover:text-[#444444] transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer text-center"
                  >
                    📱 Story (9:16)
                  </button>
                  <button 
                    onClick={downloadTwitterCard}
                    className="bg-white border border-[#E5E0DA] text-[#666666] py-3.5 rounded-xl font-medium text-xs hover:bg-[#F9F7F5] hover:text-[#444444] transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer text-center"
                  >
                    🐦 Twitter/X (16:9)
                  </button>
                </div>

                {/* Social Media Share Buttons */}
                <div className="flex flex-col items-center gap-3 mt-4 pt-4 border-t border-[#F2ECE6]">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Share on:</span>
                  <div className="flex items-center justify-center gap-4">
                    {/* WhatsApp */}
                    <button
                      onClick={shareToWhatsApp}
                      className="w-11 h-11 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
                      title="Share on WhatsApp"
                    >
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.451 5.437.002 9.859-4.416 9.862-9.852.002-2.633-1.02-5.107-2.88-6.97C16.39 1.905 13.916.88 11.288.88 5.856.88 1.437 5.298 1.435 10.734c-.001 1.558.411 3.076 1.196 4.417L1.674 21.03l6.095-1.599.278.169zM18.8 15.39c-.33-.164-1.953-.964-2.253-1.074-.3-.11-.519-.165-.738.165-.219.33-.849 1.073-1.04 1.293-.191.22-.383.247-.713.082-.33-.165-1.393-.513-2.653-1.636-.98-.873-1.643-1.953-1.835-2.283-.192-.33-.021-.508.144-.672.148-.148.33-.385.495-.578.165-.192.22-.33.33-.55.11-.22.055-.413-.028-.578-.083-.166-.738-1.782-1.01-2.44-.267-.643-.538-.553-.738-.553-.191 0-.41-.013-.629-.013-.218 0-.575.082-.876.412-.3.33-1.15 1.127-1.15 2.746 0 1.62 1.178 3.189 1.34 3.41.164.22 2.318 3.54 5.616 4.966.783.339 1.396.541 1.873.693.788.25 1.505.215 2.072.13.633-.095 1.953-.798 2.227-1.57.275-.77 2.75-1.897 1.897-2.072zm0 0"/>
                      </svg>
                    </button>

                    {/* Facebook */}
                    <button
                      onClick={shareToFacebook}
                      className="w-11 h-11 rounded-full bg-[#1877F2] hover:bg-[#166fe5] text-white flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
                      title="Share on Facebook"
                    >
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </button>

                    {/* Instagram */}
                    <button
                      onClick={shareToInstagram}
                      className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] hover:brightness-110 text-white flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
                      title="Share on Instagram"
                    >
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051C.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                      </svg>
                    </button>

                    {/* Twitter/X */}
                    <button
                      onClick={shareToTwitter}
                      className="w-11 h-11 rounded-full bg-[#000000] hover:bg-[#191919] text-white flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
                      title="Share on X (Twitter)"
                    >
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                    </button>

                    {/* TikTok */}
                    <button
                      onClick={shareToTikTok}
                      className="w-11 h-11 rounded-full bg-[#000000] hover:bg-[#191919] text-white flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
                      title="Share on TikTok"
                    >
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M12.525.02c1.31-.032 2.61.1 3.86.38v3.47a8.13 8.13 0 0 1-2.38-.17v10.3a6 6 0 1 1-6-6c.3 0 .59.02.88.06v-3.1a9 9 0 1 0 9 9V0h4v3.5a4.5 4.5 0 0 1-4.5 4.5V5a7.1 7.1 0 0 0 4.5-4.5v-3h-8.475v.02z"/>
                      </svg>
                    </button>

                    {/* Copy Link */}
                    <button
                      onClick={copyPageLink}
                      className="w-11 h-11 rounded-full bg-[#7F8C8D] hover:bg-[#707b7c] text-white flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
                      title="Copy Link"
                    >
                      <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 w-full">
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
                      <>📤 Share My Twin</>
                    )}
                  </button>
                  <button 
                    onClick={() => {
                      setResult(null);
                      setFile(null);
                      setPreviewUrl(null);
                      setImageError(false);
                      setStep('upload');
                    }}
                    className="flex-1 bg-white border border-[#D9C0A8] text-[#8B5E3C] py-3.5 rounded-xl font-bold text-sm hover:bg-[#FDF9F5] transition-colors cursor-pointer"
                  >
                    🔄 Try Again
                  </button>
                </div>

              </div>

            </div>
          )}

        </div>
      </main>

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
          {/* Top Badge and Header */}
          <div style={{ textAlign: 'center', width: '100%' }}>
            <div style={{
              display: 'inline-block',
              background: '#1E1E1E',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '24px',
              padding: '12px 30px',
              borderRadius: '50px',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginBottom: '30px'
            }}>
              {result.matchScore}% Match
            </div>
            <div style={{ fontSize: '20px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '3px', color: '#999999', marginBottom: '8px' }}>
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

          {/* Double Photos Side-by-Side */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '40px',
            margin: '20px 0',
            width: '100%'
          }}>
            {/* YOU photo column */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' }}>
              <div style={{
                width: '280px',
                height: '280px',
                borderRadius: '50%',
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

            <div style={{ fontSize: '60px', paddingBottom: '30px', color: '#CCCCCC' }}>🐾</div>

            {/* TWIN photo column */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' }}>
              <div style={{
                width: '280px',
                height: '280px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '10px solid #FFFFFF',
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                background: '#F9F7F5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {imageError ? (
                  <span style={{ fontSize: '90px' }}>🐕</span>
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
          {/* Top Badge & Header */}
          <div style={{ textAlign: 'center', width: '100%' }}>
            <div style={{
              display: 'inline-block',
              background: '#1E1E1E',
              color: '#FFFFFF',
              fontWeight: 900,
              fontSize: '34px',
              padding: '16px 48px',
              borderRadius: '50px',
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              marginBottom: '40px',
              boxShadow: '0 12px 24px rgba(0,0,0,0.1)'
            }}>
              {result.matchScore}% Match
            </div>
            
            <div style={{ fontSize: '28px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '4px', color: '#666666', marginBottom: '15px' }}>
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

          {/* Double circular photos - side-by-side with 🐾 between */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '50px',
            margin: '40px 0',
            width: '100%'
          }}>
            {/* YOU photo column */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
              <div style={{
                width: '320px',
                height: '320px',
                borderRadius: '50%',
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

            <div style={{ fontSize: '70px', paddingBottom: '40px', color: '#CCCCCC' }}>🐾</div>

            {/* TWIN photo column */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
              <div style={{
                width: '320px',
                height: '320px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '12px solid #FFFFFF',
                boxShadow: '0 24px 48px rgba(0,0,0,0.1)',
                background: '#F9F7F5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {imageError ? (
                  <span style={{ fontSize: '110px' }}>🐕</span>
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
          {/* Top Row: Header & Badge */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '3px', color: '#999999', marginBottom: '4px' }}>
                Your Pet Twin Match
              </div>
              <h2 style={{ fontSize: '56px', fontWeight: 900, margin: 0, color: '#191919', letterSpacing: '-1.5px', lineHeight: 1 }}>
                {result.breed}
              </h2>
            </div>
            <div style={{
              background: '#1E1E1E',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '22px',
              padding: '12px 28px',
              borderRadius: '50px',
              letterSpacing: '1px',
              textTransform: 'uppercase'
            }}>
              {result.matchScore}% Match
            </div>
          </div>

          {/* Middle Row: Two Photos side by side */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '30px',
            margin: '10px 0',
            width: '100%'
          }}>
            {/* YOU photo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ color: '#888888', fontSize: '18px', fontWeight: 'bold', letterSpacing: '2px' }}>YOU</span>
              <div style={{
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '8px solid #FFFFFF',
                boxShadow: '0 15px 30px rgba(0,0,0,0.1)'
              }}>
                {previewUrl && <img src={previewUrl} alt="You" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              </div>
            </div>

            <div style={{ fontSize: '48px', color: '#CCCCCC' }}>🐾</div>

            {/* TWIN photo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '8px solid #FFFFFF',
                boxShadow: '0 15px 30px rgba(0,0,0,0.1)',
                background: '#F9F7F5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {imageError ? (
                  <span style={{ fontSize: '70px' }}>🐕</span>
                ) : (
                  <img 
                    src={result.unsplashImageUrl} 
                    alt="Twin" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    onError={() => setImageError(true)}
                  />
                )}
              </div>
              <span style={{ color: '#888888', fontSize: '18px', fontWeight: 'bold', letterSpacing: '2px' }}>TWIN</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xl animate-fade-in">
          <div className="w-full max-w-[440px] bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] p-6 md:p-8 flex flex-col items-center text-center animate-scale-up relative">
            
            {/* Lumo Bites logo + trademark at the top */}
            <div className="flex items-center justify-center mb-6 relative">
              <img src="/Logo.png" alt="Lumo Bites Logo" className="h-9 object-contain" />
              <sup className="text-[9px] text-[#8B5A2B] font-bold align-self-start -mt-1 ml-0.5 select-none">™</sup>
            </div>

            {/* Title */}
            <h3 className="text-xl md:text-2xl font-[900] text-[#191919] tracking-tight mb-2">
              Your Pet Twin is Ready! 🐾
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
