'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
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

  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Refs for off-screen premium download templates
  const squareCardRef = useRef<HTMLDivElement>(null);
  const storyCardRef = useRef<HTMLDivElement>(null);

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
    if (step === 'result') {
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
  }, [step]);

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

  const copyShareLink = () => {
    const text = `Just found my pet twin on Lumo Bites — I'm a ${result?.breed}! 😂🐾 Find yours free at lumobites.net/twin`;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
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
      <nav className="bg-white border-b border-[#EEEEEE] px-6 md:px-[48px] flex items-center shrink-0" style={{ height: '72px' }}>
        <Link href="/" className="flex items-center text-[#8B5E3C] font-bold text-sm hover:underline">
          &larr; Back to Home
        </Link>
        <div style={{ marginLeft: 'auto' }}>
           <img src="/Logo.png" alt="Lumo Bites" style={{ height: '50px', width: 'auto', display: 'block', objectFit: 'contain' }} />
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center py-12 px-6">
        <div className="w-full max-w-[650px] bg-white rounded-3xl border border-[#EEEEEE] shadow-sm p-8 md:p-10 relative overflow-hidden">
          
          {/* HEADER */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-[800] text-[#191919] tracking-tight mb-3">
              Find Your Pet Twin
            </h1>
            <p className="text-[16px] text-[#777777] font-normal">
              Discover which dog or cat breed matches your personality
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
              <div 
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="border-2 border-dashed border-[#D9C0A8] bg-[#F5EDE4] rounded-2xl p-8 md:p-12 text-center flex flex-col items-center gap-6 cursor-pointer hover:border-[#8B5E3C] transition-all"
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
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-4xl shadow-sm text-[#8B5E3C]">
                  📸
                </div>
                
                <div className="flex flex-col gap-2">
                  <span className="font-bold text-lg text-[#191919]">
                    Drop your photo here — we&apos;ll find your animal twin! 🐾
                  </span>
                  <span className="text-sm text-[#8B5E3C]">or click to select</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-[340px] mt-4" onClick={(e) => e.stopPropagation()}>
                  <button 
                    onClick={() => setCameraActive(true)}
                    className="flex-1 bg-[#8B5E3C] text-white py-3 px-4 rounded-xl font-bold hover:bg-[#734A2E] transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <span>📷</span> Take Selfie
                  </button>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 bg-white border-2 border-[#D9C0A8] text-[#8B5E3C] py-3 px-4 rounded-xl font-bold hover:bg-[#FDF9F5] hover:border-[#C17D3C] transition-all flex items-center justify-center gap-2"
                  >
                    <span>📁</span> Upload Photo
                  </button>
                </div>

                <p className="text-xs text-[#9A7760] mt-4">
                  🔒 Your photo is analyzed instantly and never stored
                </p>
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

                <div className="grid grid-cols-2 gap-3 w-full">
                  <button 
                    onClick={downloadSquareCard}
                    className="bg-white border border-[#E5E0DA] text-[#666666] py-3.5 rounded-xl font-medium text-xs hover:bg-[#F9F7F5] hover:text-[#444444] transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    📸 Instagram Feed (1:1)
                  </button>
                  <button 
                    onClick={downloadStoryCard}
                    className="bg-white border border-[#E5E0DA] text-[#666666] py-3.5 rounded-xl font-medium text-xs hover:bg-[#F9F7F5] hover:text-[#444444] transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    📱 Instagram Story (9:16)
                  </button>
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
            background: '#F9F7F5',
            borderRadius: '24px',
            padding: '24px 40px',
            boxSizing: 'border-box',
            border: '1px solid #EBEBEB'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '24px', fontWeight: 800, color: '#191919' }}>Lumo Bites</span>
              <span style={{ fontSize: '18px', color: '#666666', fontWeight: 400 }}>Find Your Pet Twin Free</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
              <span style={{ fontSize: '20px', fontWeight: 700, color: '#8B5E3C' }}>lumobites.net/twin</span>
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
              fontWeight: 800,
              fontSize: '28px',
              padding: '14px 40px',
              borderRadius: '50px',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginBottom: '40px'
            }}>
              {result.matchScore}% Match
            </div>
            
            <div style={{ fontSize: '24px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '4px', color: '#999999', marginBottom: '15px' }}>
              Your Pet Twin Match
            </div>
            <h2 style={{
              fontSize: '84px',
              fontWeight: 900,
              margin: 0,
              color: '#191919',
              letterSpacing: '-3px',
              lineHeight: 1.1
            }}>
              {result.breed}
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
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            background: '#F9F7F5',
            borderRadius: '30px',
            padding: '30px 50px',
            boxSizing: 'border-box',
            border: '1px solid #EBEBEB'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '28px', fontWeight: 800, color: '#191919' }}>Lumo Bites</span>
              <span style={{ fontSize: '20px', color: '#666666', fontWeight: 400 }}>Find Your Pet Twin Free</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
              <span style={{ fontSize: '24px', fontWeight: 700, color: '#8B5E3C' }}>lumobites.net/twin</span>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
