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

  const [cameraActive, setCameraActive] = useState(false);
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
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1080 }, height: { ideal: 1080 } } })
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
  }, [cameraActive]);

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

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const res = await fetch('/api/twin', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        setResult(data);
        setStep('result');
      } else {
        setError(data.error || 'Failed to detect matching breed.');
        setStep('upload');
      }
    } catch (err: any) {
      console.error(err);
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
              🐾 Find Your Pet Twin
            </h1>
            <p className="text-[17px] text-[#666666]">
              Upload your photo and discover which dog or cat breed you look like!
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
              <div className="w-full bg-gradient-to-br from-[#FFF8F2] to-[#FFF0E2] border border-[#F2DCC4] rounded-3xl p-6 md:p-8 flex flex-col items-center gap-6 shadow-sm relative overflow-hidden">
                
                {/* Match Badge */}
                <div className="absolute top-4 right-4 bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-[#553300] font-black text-xs px-3 py-1.5 rounded-full shadow-sm border border-[#D4AF37] tracking-wider uppercase">
                  ⭐ {result.matchScore}% Match
                </div>

                <div className="text-center mt-2">
                  <span className="text-xs font-bold text-[#8B5E3C] uppercase tracking-widest">Your Pet Twin is a</span>
                  <h2 className="text-3xl font-[900] text-[#191919] mt-1">
                    {result.petType === 'cat' ? '🐱' : '🐕'} {result.breed}
                  </h2>
                </div>

                {/* Side-by-Side Images */}
                <div className="flex items-center gap-4 my-2">
                  <div className="w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-white shadow-md relative shrink-0">
                    {previewUrl && <img src={previewUrl} alt="You" className="w-full h-full object-cover" />}
                    <span className="absolute bottom-1 right-3 text-xs bg-black/60 text-white px-2 py-0.5 rounded-full font-bold">You</span>
                  </div>
                  
                  <div className="text-4xl text-[#FF4D4D] animate-bounce">❤️</div>

                  <div className="w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-white shadow-md relative shrink-0">
                    <img src={result.unsplashImageUrl} alt={result.breed} className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 right-3 text-xs bg-black/60 text-white px-2 py-0.5 rounded-full font-bold">Twin</span>
                  </div>
                </div>

                {/* Personality Traits */}
                <div className="flex flex-wrap justify-center gap-2 mt-2 w-full max-w-[90%]">
                  {result.traits.map((trait, index) => (
                    <span 
                      key={index}
                      className="bg-white border border-[#E8D5C0] text-[#8B5E3C] font-extrabold text-sm px-4 py-2 rounded-xl shadow-xs"
                    >
                      {trait}
                    </span>
                  ))}
                </div>

                {/* Quote */}
                <div className="w-full text-center border-t border-[#F2DCC4] pt-4 mt-2">
                  <p className="text-[#8B5E3C] font-bold text-lg italic leading-relaxed max-w-[90%] mx-auto">
                    &quot;{result.quote}&quot;
                  </p>
                  <p className="text-sm text-[#666666] mt-3 max-w-[90%] mx-auto font-medium">
                    {result.reason}
                  </p>
                </div>

              </div>

              {/* CTAs & Options */}
              <div className="w-full flex flex-col gap-3 mt-4">
                
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <Link 
                    href={`/results?breed=${encodeURIComponent(result.breed)}`}
                    className="flex-1 bg-[#8B5E3C] text-white py-4 rounded-xl font-bold text-lg text-center hover:bg-[#734A2E] transition-colors shadow-sm"
                    style={{ textDecoration: 'none' }}
                  >
                    🍖 Find Best Food for {result.breed}
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-3 w-full">
                  <button 
                    onClick={downloadSquareCard}
                    className="bg-gradient-to-r from-[#FF3E6C] to-[#FF8E53] text-white py-3.5 rounded-xl font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    📸 Instagram Feed (1:1)
                  </button>
                  <button 
                    onClick={downloadStoryCard}
                    className="bg-gradient-to-r from-[#8A2387] to-[#E94057] text-white py-3.5 rounded-xl font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
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
                    onClick={() => setStep('upload')}
                    className="flex-1 bg-[#F5EDE4] text-[#8B5E3C] border border-[#D9C0A8] py-3.5 rounded-xl font-bold text-sm hover:bg-[#EAE0D3] transition-colors cursor-pointer"
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
            background: 'linear-gradient(135deg, #8A2387 0%, #E94057 50%, #F27121 100%)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '70px',
            color: '#FFFFFF',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            boxSizing: 'border-box'
          }}
        >
          {/* Top Badge and Header */}
          <div style={{ textAlign: 'center', width: '100%' }}>
            <div style={{
              display: 'inline-block',
              background: 'linear-gradient(to right, #FFD700, #FFA500)',
              color: '#553300',
              fontWeight: 900,
              fontSize: '32px',
              padding: '10px 30px',
              borderRadius: '50px',
              boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
              border: '2px solid #FFFFFF',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              marginBottom: '35px'
            }}>
              🎯 {result.matchScore}% Match
            </div>
            <h2 style={{
              fontSize: '64px',
              fontWeight: 900,
              margin: 0,
              letterSpacing: '-1px',
              textShadow: '0 4px 10px rgba(0,0,0,0.25)'
            }}>
              You&apos;re a {result.breed}!
            </h2>
          </div>

          {/* Double Photos */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '50px',
            margin: '30px 0'
          }}>
            <div style={{
              width: '280px',
              height: '280px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '8px solid #FFFFFF',
              boxShadow: '0 12px 35px rgba(0,0,0,0.3)',
              position: 'relative'
            }}>
              {previewUrl && <img src={previewUrl} alt="You" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              <span style={{
                position: 'absolute',
                bottom: '15px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0,0,0,0.6)',
                color: '#FFFFFF',
                fontSize: '22px',
                fontWeight: 'bold',
                padding: '4px 16px',
                borderRadius: '50px'
              }}>YOU</span>
            </div>

            <div style={{ fontSize: '100px', filter: 'drop-shadow(0 8px 15px rgba(0,0,0,0.3))' }}>🐾</div>

            <div style={{
              width: '280px',
              height: '280px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '8px solid #FFFFFF',
              boxShadow: '0 12px 35px rgba(0,0,0,0.3)',
              position: 'relative'
            }}>
              <img src={result.unsplashImageUrl} alt="Twin" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <span style={{
                position: 'absolute',
                bottom: '15px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0,0,0,0.6)',
                color: '#FFFFFF',
                fontSize: '22px',
                fontWeight: 'bold',
                padding: '4px 16px',
                borderRadius: '50px'
              }}>TWIN</span>
            </div>
          </div>

          {/* Personality Traits */}
          <div style={{
            display: 'flex',
            gap: '20px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            {result.traits.map((trait, index) => (
              <span 
                key={index}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(255, 255, 255, 0.4)',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '26px',
                  padding: '12px 30px',
                  borderRadius: '20px',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
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
            borderTop: '2px solid rgba(255,255,255,0.2)',
            paddingTop: '30px'
          }}>
            <p style={{
              fontSize: '34px',
              fontWeight: 700,
              fontStyle: 'italic',
              margin: 0,
              lineHeight: 1.4,
              textShadow: '0 2px 4px rgba(0,0,0,0.2)'
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
            borderTop: '2px solid rgba(255,255,255,0.15)',
            paddingTop: '25px',
            boxSizing: 'border-box'
          }}>
            <span style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🐾 Find Your Pet Twin Free
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
              <span style={{ fontSize: '28px', fontWeight: 900 }}>Lumo Bites</span>
              <span style={{ fontSize: '22px', opacity: 0.8, fontWeight: 600 }}>lumobites.net/twin</span>
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
            background: 'linear-gradient(135deg, #8A2387 0%, #E94057 50%, #F27121 100%)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '120px 80px',
            color: '#FFFFFF',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            boxSizing: 'border-box'
          }}
        >
          {/* Top Badge & Header */}
          <div style={{ textAlign: 'center', width: '100%' }}>
            <div style={{
              display: 'inline-block',
              background: 'linear-gradient(to right, #FFD700, #FFA500)',
              color: '#553300',
              fontWeight: 900,
              fontSize: '36px',
              padding: '12px 40px',
              borderRadius: '50px',
              boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
              border: '2px solid #FFFFFF',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              marginBottom: '50px'
            }}>
              🎯 {result.matchScore}% Match
            </div>
            
            <span style={{ fontSize: '32px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '4px', opacity: 0.9 }}>
              My Pet Twin Match
            </span>
            <h2 style={{
              fontSize: '84px',
              fontWeight: 900,
              margin: '20px 0 0 0',
              letterSpacing: '-2px',
              textShadow: '0 6px 15px rgba(0,0,0,0.3)',
              lineHeight: 1.1
            }}>
              You&apos;re a<br />
              <span style={{ fontSize: '96px', color: '#FFD700' }}>{result.breed}</span>!
            </h2>
          </div>

          {/* Double Stacked Photos for Vertical Story */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '40px',
            margin: '40px 0'
          }}>
            <div style={{
              width: '380px',
              height: '380px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '10px solid #FFFFFF',
              boxShadow: '0 15px 40px rgba(0,0,0,0.3)',
              position: 'relative'
            }}>
              {previewUrl && <img src={previewUrl} alt="You" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              <span style={{
                position: 'absolute',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0,0,0,0.6)',
                color: '#FFFFFF',
                fontSize: '26px',
                fontWeight: 'bold',
                padding: '6px 20px',
                borderRadius: '50px'
              }}>YOU</span>
            </div>

            <div style={{ fontSize: '130px', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.35))', lineHeight: 1 }}>❤️</div>

            <div style={{
              width: '380px',
              height: '380px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '10px solid #FFFFFF',
              boxShadow: '0 15px 40px rgba(0,0,0,0.3)',
              position: 'relative'
            }}>
              <img src={result.unsplashImageUrl} alt="Twin" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <span style={{
                position: 'absolute',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0,0,0,0.6)',
                color: '#FFFFFF',
                fontSize: '26px',
                fontWeight: 'bold',
                padding: '6px 20px',
                borderRadius: '50px'
              }}>TWIN</span>
            </div>
          </div>

          {/* Trait Tags */}
          <div style={{
            display: 'flex',
            gap: '20px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            width: '100%'
          }}>
            {result.traits.map((trait, index) => (
              <span 
                key={index}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(255, 255, 255, 0.4)',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '28px',
                  padding: '14px 36px',
                  borderRadius: '25px',
                  boxShadow: '0 5px 12px rgba(0,0,0,0.1)'
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
            borderTop: '2px solid rgba(255,255,255,0.2)',
            paddingTop: '40px',
            marginTop: '30px'
          }}>
            <p style={{
              fontSize: '38px',
              fontWeight: 700,
              fontStyle: 'italic',
              margin: 0,
              lineHeight: 1.4,
              textShadow: '0 2px 4px rgba(0,0,0,0.25)'
            }}>
              &quot;{result.quote}&quot;
            </p>
          </div>

          {/* Footer brand info */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '15px',
            width: '100%',
            borderTop: '2px solid rgba(255,255,255,0.15)',
            paddingTop: '40px',
            boxSizing: 'border-box'
          }}>
            <span style={{ fontSize: '32px', fontWeight: 900, letterSpacing: '1px' }}>
              🐾 Find Your Pet Twin Free
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '36px', fontWeight: 900 }}>Lumo Bites</span>
              <span style={{ fontSize: '26px', opacity: 0.8, fontWeight: 600 }}>lumobites.net/twin</span>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
