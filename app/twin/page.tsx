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
  const [showShareModal, setShowShareModal] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

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

  // Trigger confetti on result screen
  useEffect(() => {
    if (step === 'result') {
      const duration = 3 * 1000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#8B5E3C', '#E8D5C0', '#F5EDE4']
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#8B5E3C', '#E8D5C0', '#F5EDE4']
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

  const downloadCard = async () => {
    if (cardRef.current) {
      const canvas = await html2canvas(cardRef.current, {
        useCORS: true,
        scale: 2
      });
      const link = document.createElement('a');
      link.download = `${result?.breed}_twin_match.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  const copyShareLink = () => {
    const text = `Just found my pet twin on Lumo Bites — I'm a ${result?.breed}! 😂🐾 Find yours free at lumobites.net/twin`;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
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

          {/* STEP 1: UPLOAD */}
          {step === 'upload' && (
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
                  onClick={() => cameraInputRef.current?.click()}
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

          {/* STEP 3: RESULT CARD */}
          {step === 'result' && result && (
            <div className="flex flex-col items-center gap-6">
              
              {/* Dynamic Twin Card to Download */}
              <div 
                ref={cardRef} 
                className="w-full bg-gradient-to-br from-[#FFF8F2] to-[#FFF0E2] border border-[#F2DCC4] rounded-3xl p-6 md:p-8 flex flex-col items-center gap-6 shadow-sm relative overflow-hidden"
              >
                
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
                    className="flex-1 bg-[#8B5E3C] text-white py-4 rounded-xl font-bold text-lg text-center hover:bg-[#734A2E] transition-colors shadow-sm text-decoration-none"
                    style={{ textDecoration: 'none' }}
                  >
                    🍖 Find Best Food for {result.breed}
                  </Link>
                  
                  <button 
                    onClick={downloadCard}
                    className="flex-1 bg-white border-2 border-[#D9C0A8] text-[#8B5E3C] py-4 rounded-xl font-bold text-lg hover:bg-[#FDF9F5] transition-all flex items-center justify-center gap-2"
                  >
                    📥 Download Result Card
                  </button>
                </div>

                <div className="flex gap-3 w-full">
                  <button 
                    onClick={() => setShowShareModal(true)}
                    className="flex-1 bg-[#F5EDE4] text-[#8B5E3C] border border-[#D9C0A8] py-3 rounded-xl font-bold text-sm hover:bg-[#EAE0D3] transition-colors"
                  >
                    📤 Share My Twin
                  </button>
                  <button 
                    onClick={() => setStep('upload')}
                    className="flex-1 bg-[#F5EDE4] text-[#8B5E3C] border border-[#D9C0A8] py-3 rounded-xl font-bold text-sm hover:bg-[#EAE0D3] transition-colors"
                  >
                    🔄 Try Again
                  </button>
                </div>

              </div>

            </div>
          )}

        </div>
      </main>

      {/* SHARE MODAL */}
      {showShareModal && result && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-[400px] w-full p-6 flex flex-col gap-6 shadow-xl border border-[#EEEEEE]">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-xl text-[#191919]">📤 Share Your Pet Twin</h3>
              <button 
                onClick={() => setShowShareModal(false)}
                className="text-[#999999] hover:text-[#191919] font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <a 
                href={getWhatsAppShareUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 bg-[#25D366] text-white rounded-xl font-bold text-center flex items-center justify-center gap-2 text-decoration-none hover:opacity-90 transition-opacity"
                style={{ textDecoration: 'none' }}
              >
                💬 Share on WhatsApp
              </a>

              <button 
                onClick={copyShareLink}
                className="w-full py-4 bg-white border-2 border-[#D9C0A8] text-[#8B5E3C] rounded-xl font-bold text-center flex items-center justify-center gap-2 hover:bg-[#FDF9F5] transition-all"
              >
                {isCopied ? "✓ Copied!" : "🔗 Copy Share Text"}
              </button>
            </div>
            
            <p className="text-xs text-[#999999] text-center italic">
              &quot;Just found my pet twin on Lumo Bites — I&apos;m a {result.breed}! 😂🐾 Find yours free at lumobites.net/twin&quot;
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
