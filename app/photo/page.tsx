'use client';

import { useState, useRef, useEffect, ChangeEvent, DragEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { Dog, Cat, Sparkles, Footprints } from 'lucide-react';

type Step = 'upload' | 'analyzing' | 'confirm_breed' | 'age' | 'budget';

export default function PhotoPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('upload');
  
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [detectedPetType, setDetectedPetType] = useState<'cat' | 'dog' | 'none'>('dog');
  const [detectedBreed, setDetectedBreed] = useState('');
  const [detectedBreed2, setDetectedBreed2] = useState('');
  const [confidence, setConfidence] = useState('');
  const [breedDescription, setBreedDescription] = useState('');
  const [isManualBreed, setIsManualBreed] = useState(false);
  const [manualBreedInput, setManualBreedInput] = useState('');
  const [manualPetType, setManualPetType] = useState<'cat' | 'dog'>('dog');

  const [age, setAge] = useState<number | null>(null);
  const [foodType, setFoodType] = useState<string>('');
  const [budget, setBudget] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const isHumanDetected = 
    detectedBreed.toLowerCase().includes('human') || 
    detectedBreed2.toLowerCase().includes('human') || 
    breedDescription.toLowerCase().includes('human');

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

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const processFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setStep('analyzing');

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const res = await fetch('/api/vision', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      
      if (data.success) {
        setDetectedBreed(data.breed);
        setDetectedPetType(data.petType as 'cat' | 'dog' | 'none');
        if (data.breed2) setDetectedBreed2(data.breed2);
        else setDetectedBreed2('');
        setConfidence(data.confidence || '');
        setBreedDescription(data.breedDescription || '');
      } else {
        // Surface error to user for debugging
        alert('API Error: ' + (data.error || 'Unknown error'));
        setDetectedBreed('Unknown Breed');
      }
      setStep('confirm_breed');
    } catch (error) {
      console.error('Error uploading photo:', error);
      setDetectedBreed('Unknown Breed');
      setStep('confirm_breed');
    }
  };

  const handleConfirmBreed = (selectedBreed?: string) => {
    if (selectedBreed) setDetectedBreed(selectedBreed);
    setStep('age');
  };

  const handleRejectBreed = () => {
    setIsManualBreed(true);
  };

  const handleSubmitManualBreed = () => {
    if (manualBreedInput.trim()) {
      setDetectedBreed(manualBreedInput.trim());
      if (detectedPetType === 'none') {
        setDetectedPetType(manualPetType);
      }
      setStep('age');
    }
  };

  const submitFinal = (finalBudget: string) => {
    setIsSubmitting(true);
    const params = new URLSearchParams();
    
    // Pass breed and petType
    params.append('breed', detectedBreed);
    params.append('pet_type', detectedPetType);
    
    // Pass answers
    if (age !== null) params.append('age_years', age.toString());
    if (foodType) params.append('food_type', foodType);
    if (finalBudget) {
      // Extract number from budget string
      const match = finalBudget.match(/\d+/);
      if (match) params.append('budget', match[0]);
    }

    router.push(`/results?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-[#FDFAF7] text-[#555555] font-sans flex flex-col">
      {/* NAVBAR */}
      <Navbar />

      <main className="flex-1 flex flex-col items-center py-12 px-6">
        <div className="w-full max-w-[600px] bg-white rounded-3xl border border-[#EEEEEE] shadow-sm p-8 md:p-10">
          
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-[800] text-[#191919] tracking-tight mb-3">
              Upload Your Pet&apos;s Photo
            </h1>
            <p className="text-[17px] text-[#666666]">
              We&apos;ll identify the breed and find the perfect food
            </p>
          </div>

          {/* UPLOAD STEP */}
          {step === 'upload' && (
            <div className="flex flex-col gap-6">
              {cameraActive ? (
                <div className="relative bg-black rounded-3xl overflow-hidden aspect-[4/3] w-full border border-gray-150 shadow-sm flex flex-col items-center justify-center">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Camera Control Overlays */}
                  <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-3 px-6 z-10">
                    <button 
                      onClick={captureSelfie}
                      className="bg-white hover:bg-gray-100 text-[#8B5E3C] px-6 py-3.5 rounded-full font-bold shadow-2xl flex items-center gap-2 text-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[#8B5E3C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                      </svg>
                      Capture Photo
                    </button>
                    
                    <button 
                      onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')}
                      className="bg-black/60 hover:bg-black/80 border border-white/20 text-white p-3.5 rounded-full font-bold shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
                      title="Flip Camera"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                      </svg>
                    </button>
                    
                    <button 
                      onClick={stopCamera}
                      className="bg-black/60 hover:bg-black/80 border border-white/20 text-white p-3.5 rounded-full font-bold shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
                      title="Close Camera"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className="border-2 border-dashed border-gray-200 bg-[#FAF8F6] rounded-3xl p-8 md:p-12 text-center flex flex-col items-center gap-6 hover:border-[#8B5E3C] transition-colors group relative"
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
                    capture="environment"
                    className="hidden" 
                  />
                  
                  {/* Decorative Paw Pathway Icon */}
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-xs border border-gray-100 group-hover:scale-105 transition-transform duration-300">
                    <svg className="w-8 h-8 text-[#8B5E3C]" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M12 14c-1.66 0-3 1.34-3 3 0 1.66 1.34 3 3 3s3-1.34 3-3c0-1.66-1.34-3-3-3zm-4.5-3c-.83 0-1.5.67-1.5 1.5S6.67 14 7.5 14s1.5-.67 1.5-1.5S8.33 11 7.5 11zm9 0c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm-8.2-3.8c-.55.62-.48 1.58.15 2.13.62.55 1.58.48 2.13-.15l1.2-1.35c.55-.62.48-1.58-.15-2.13-.62-.55-1.58-.48-2.13.15l-1.2 1.35zm7.4.63c-.63-.55-1.58-.48-2.13.15l-1.2 1.35c-.55.62-.48 1.58.15 2.13.63.55 1.58.48 2.13-.15l1.2-1.35c.55-.62.48-1.58-.15-2.13z" />
                    </svg>
                  </div>
                  
                  <div className="flex flex-col gap-3 w-full max-w-[280px]">
                    {/* Live Camera Button */}
                    <button 
                      onClick={() => setCameraActive(true)}
                      className="bg-[#8B5E3C] hover:bg-[#734A2E] text-white py-3.5 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2.5 w-full shadow-xs cursor-pointer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                      </svg>
                      Open Live Camera
                    </button>

                    {/* Gallery Button */}
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-white border border-gray-200 text-gray-700 hover:text-[#8B5E3C] hover:border-[#8B5E3C]/30 py-3.5 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2.5 w-full shadow-xs cursor-pointer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400 group-hover:text-[#8B5E3C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                      Upload from Gallery
                    </button>
                  </div>

                  <p className="text-xs font-semibold text-gray-400 mt-1 hidden md:block">
                    or drag and drop your file here
                  </p>
                </div>
              )}

              {/* Secure Privacy Banner */}
              <div className="flex items-center justify-center gap-2 bg-[#F6FDF9] border border-[#E7F6EC] py-2.5 px-4 rounded-xl text-xs text-gray-500 font-medium mt-2 shadow-xs">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                </svg>
                <span>Your privacy is protected — we do not save or share your photos</span>
              </div>
            </div>
          )}

          {/* ANALYZING STEP */}
          {step === 'analyzing' && (
            <div className="flex flex-col items-center justify-center py-16 gap-6">
              {previewUrl && (
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#F5EDE4] shadow-md relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-[#8B5E3C] bg-opacity-20 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                </div>
              )}
              <h3 className="text-xl font-bold text-[#8B5E3C] animate-pulse">Detecting breed...</h3>
            </div>
          )}

          {/* CONFIRM BREED STEP */}
          {step === 'confirm_breed' && (
            <div className="flex flex-col items-center text-center gap-8 animate-fade-in py-4">
              {previewUrl && (
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#F5EDE4] shadow-md">
                   {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
              
              {isHumanDetected ? (
                <div className="flex flex-col items-center gap-6 w-full max-w-[90%] mx-auto animate-fade-in">
                  <h2 className="text-2xl md:text-3xl font-[800] text-[#191919] leading-tight">
                    Oops! That looks like a human
                  </h2>
                  <p className="text-[#666666] leading-relaxed">
                    Please upload a photo of your dog or cat instead. We&apos;re designed to find the perfect food for pets!
                  </p>
                  
                  <button 
                    onClick={() => setStep('upload')}
                    className="bg-[#8B5E3C] hover:bg-[#734A2E] text-white py-4 px-8 rounded-xl font-bold text-lg transition-all hover:scale-105 active:scale-95 shadow-md cursor-pointer mt-2"
                  >
                    Try Another Photo
                  </button>

                  <div className="mt-6 pt-6 border-t border-[#EEEEEE] w-full text-center">
                    <p className="text-sm text-gray-500 font-medium">
                      Looking for YOUR pet twin instead? 
                    </p>
                    <Link 
                      href="/twin" 
                      className="inline-flex items-center gap-1.5 text-[#8B5E3C] hover:underline font-bold text-sm mt-1.5 animate-pulse"
                    >
                      Try our Pet Twin feature! <Footprints className="w-4 h-4 text-[#8B5E3C]" />
                    </Link>
                  </div>
                </div>
              ) : detectedPetType === 'none' ? (
                <div className="w-full flex flex-col gap-4 items-center">
                  <h2 className="text-2xl font-[800] text-[#191919] leading-tight">
                    We couldn&apos;t detect a pet!
                  </h2>
                  <p className="text-[#666666] mb-4">Please upload a clear photo of your cat or dog, or enter the breed manually.</p>
                  <button 
                    onClick={() => setStep('upload')}
                    className="bg-[#F5EDE4] text-[#8B5E3C] border border-[#D9C0A8] py-3 px-6 rounded-xl font-bold hover:bg-[#EAE0D3] transition-colors"
                  >
                    Try another photo
                  </button>
                  <div className="w-full text-left mt-4 border-t border-[#EEEEEE] pt-6">
                    <label className="font-bold text-[#191919] text-lg">Or enter breed manually:</label>
                    <div className="flex gap-4 mt-3 mb-4">
                      <button 
                        onClick={() => setManualPetType('dog')}
                        className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all flex items-center justify-center gap-1.5 ${manualPetType === 'dog' ? 'border-[#8B5E3C] bg-[#FDF9F5] text-[#8B5E3C]' : 'border-[#EEEEEE] text-[#999999]'}`}
                      >
                        <Dog className="w-5 h-5" /> Dog
                      </button>
                      <button 
                        onClick={() => setManualPetType('cat')}
                        className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all flex items-center justify-center gap-1.5 ${manualPetType === 'cat' ? 'border-[#8B5E3C] bg-[#FDF9F5] text-[#8B5E3C]' : 'border-[#EEEEEE] text-[#999999]'}`}
                      >
                        <Cat className="w-5 h-5" /> Cat
                      </button>
                    </div>
                    <div className="flex gap-3 mt-2">
                      <input 
                        type="text" 
                        value={manualBreedInput}
                        onChange={(e) => setManualBreedInput(e.target.value)}
                        placeholder="e.g. Beagle mix"
                        className="flex-1 border-2 border-[#EEEEEE] rounded-xl px-5 py-4 text-lg focus:border-[#8B5E3C] focus:outline-none"
                      />
                      <button 
                        onClick={handleSubmitManualBreed}
                        disabled={!manualBreedInput.trim()}
                        className="bg-[#8B5E3C] text-white px-8 rounded-xl font-bold disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              ) : !isManualBreed ? (
                <>
                  <div className="flex flex-col items-center gap-2">
                    <h2 className="text-2xl md:text-3xl font-[800] text-[#191919] leading-tight max-w-[80%]">
                      {detectedBreed2 ? (
                        <span className="inline-flex items-center justify-center gap-1.5 flex-wrap">{detectedPetType === 'cat' ? <Cat className="w-6 h-6 text-[#8B5E3C]" /> : <Dog className="w-6 h-6 text-[#8B5E3C]" />} Is your pet a <span className="text-[#8B5E3C]">{detectedBreed}</span> or <span className="text-[#8B5E3C]">{detectedBreed2}</span>?</span>
                      ) : (
                        <span className="inline-flex items-center justify-center gap-1.5 flex-wrap">{detectedPetType === 'cat' ? <Cat className="w-6 h-6 text-[#8B5E3C]" /> : <Dog className="w-6 h-6 text-[#8B5E3C]" />} Looks like a <span className="text-[#8B5E3C]">{detectedBreed}</span>! Is that right?</span>
                      )}
                    </h2>
                    {confidence && !detectedBreed2 && (
                      <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest ${
                        confidence === 'High' ? 'bg-green-100 text-green-700' :
                        confidence === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {confidence} Match
                      </span>
                    )}
                  </div>
                  
                  {breedDescription && !detectedBreed2 && (
                    <p className="text-sm text-[#666666] max-w-[90%] italic">
                      &quot;{breedDescription}&quot;
                    </p>
                  )}

                  {confidence === 'Low' && !detectedBreed2 && (
                    <div className="bg-orange-50 border border-orange-200 text-orange-800 p-4 rounded-xl text-sm w-full">
                      We are not 100% sure. Please confirm or correct the breed below.
                    </div>
                  )}

                  {detectedBreed2 ? (
                    <div className="flex flex-col gap-3 w-full mt-4">
                      <div className="flex gap-3">
                        <button 
                          onClick={() => handleConfirmBreed(detectedBreed)}
                          className="flex-1 bg-[#8B5E3C] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#734A2E] transition-colors"
                        >
                          {detectedBreed}
                        </button>
                        <button 
                          onClick={() => handleConfirmBreed(detectedBreed2)}
                          className="flex-1 bg-[#8B5E3C] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#734A2E] transition-colors"
                        >
                          {detectedBreed2}
                        </button>
                      </div>
                      <button 
                        onClick={handleRejectBreed}
                        className="w-full bg-[#F5EDE4] text-[#8B5E3C] border border-[#D9C0A8] py-4 rounded-xl font-bold text-lg hover:bg-[#EAE0D3] transition-colors"
                      >
                        Neither, let me type it
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col md:flex-row gap-4 w-full mt-2">
                      <button 
                        onClick={() => handleConfirmBreed()}
                        className="flex-1 bg-[#8B5E3C] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#734A2E] transition-colors"
                      >
                        Yes, that&apos;s right!
                      </button>
                      <button 
                        onClick={handleRejectBreed}
                        className="flex-1 bg-[#F5EDE4] text-[#8B5E3C] border border-[#D9C0A8] py-4 rounded-xl font-bold text-lg hover:bg-[#EAE0D3] transition-colors"
                      >
                        No, let me correct it
                      </button>
                    </div>
                  )}

                  {confidence === 'Low' && (
                    <div className="w-full text-left mt-2">
                      <div className="flex gap-3 mt-2">
                        <input 
                          type="text" 
                          value={manualBreedInput}
                          onChange={(e) => setManualBreedInput(e.target.value)}
                          placeholder="e.g. Beagle mix"
                          className="flex-1 border-2 border-[#EEEEEE] rounded-xl px-5 py-4 text-lg focus:border-[#8B5E3C] focus:outline-none"
                        />
                        <button 
                          onClick={handleSubmitManualBreed}
                          disabled={!manualBreedInput.trim()}
                          className="bg-[#8B5E3C] text-white px-8 rounded-xl font-bold disabled:opacity-50"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full flex flex-col gap-4 text-left">
                  <label className="font-bold text-[#191919] text-lg">What breed is your pet?</label>
                  <div className="flex gap-3">
                    <input 
                      type="text" 
                      value={manualBreedInput}
                      onChange={(e) => setManualBreedInput(e.target.value)}
                      placeholder="e.g. Beagle mix"
                      className="flex-1 border-2 border-[#EEEEEE] rounded-xl px-5 py-4 text-lg focus:border-[#8B5E3C] focus:outline-none"
                      autoFocus
                    />
                    <button 
                      onClick={handleSubmitManualBreed}
                      disabled={!manualBreedInput.trim()}
                      className="bg-[#8B5E3C] text-white px-8 rounded-xl font-bold disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
              {!isHumanDetected && detectedPetType !== 'none' && (
                <button 
                  onClick={() => setStep('upload')}
                  className="mt-4 text-sm font-bold text-[#9A7760] underline hover:text-[#8B5E3C] transition-colors"
                >
                  Retake Photo
                </button>
              )}
            </div>
          )}

          {/* AGE STEP */}
          {step === 'age' && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <h2 className="text-2xl font-[800] text-[#191919] text-center mb-2">How old is your pet?</h2>
              <div className="flex flex-col gap-3">
                {[
                  { label: detectedPetType === 'cat' ? 'Kitten (Under 1 year)' : 'Puppy (Under 1 year)', val: 0.5 },
                  { label: 'Adult (1-7 years)', val: 4 },
                  { label: 'Senior (7+ years)', val: 10 }
                ].map((opt) => (
                  <button 
                    key={opt.label}
                    onClick={() => {
                      setAge(opt.val);
                      setStep('budget');
                    }}
                    className="border-2 border-[#EEEEEE] rounded-xl p-5 text-left font-bold text-lg text-[#555555] hover:border-[#8B5E3C] hover:bg-[#FDF9F5] transition-all flex items-center justify-between group"
                  >
                    {opt.label}
                    <span className="text-[#8B5E3C] opacity-0 group-hover:opacity-100 transition-opacity">&rarr;</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* BUDGET STEP */}
          {step === 'budget' && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <h2 className="text-2xl font-[800] text-[#191919] text-center mb-2">What&apos;s your monthly budget?</h2>
              <div className="flex flex-col gap-4">
                <input 
                  type="text" 
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="e.g. $50"
                  className="border-2 border-[#EEEEEE] rounded-xl px-5 py-5 text-xl text-center font-bold focus:border-[#8B5E3C] focus:outline-none"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && budget.trim()) submitFinal(budget);
                  }}
                />
                <button 
                  onClick={() => submitFinal(budget)}
                  disabled={!budget.trim() || isSubmitting}
                  className="bg-[#8B5E3C] hover:bg-[#734A2E] text-white py-5 rounded-xl font-bold text-lg hover:bg-[#734A2E] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? 'Finding food...' : (
                    <>
                      Find Matches!
                      <Sparkles className="w-4 h-4 text-white" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* DISCLAIMER */}
        <p className="mt-8 text-center text-sm text-[#999999] max-w-[500px]">
          Breed detection is approximate. Always confirm with your vet for specific dietary needs.
        </p>

      </main>

      <style>{`
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
