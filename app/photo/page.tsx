'use client';

import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Step = 'upload' | 'analyzing' | 'confirm_breed' | 'age' | 'food' | 'budget';

export default function PhotoPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('upload');
  
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [detectedBreed, setDetectedBreed] = useState('');
  const [detectedPetType, setDetectedPetType] = useState('dog');
  const [confidence, setConfidence] = useState('');
  const [breedDescription, setBreedDescription] = useState('');
  const [isManualBreed, setIsManualBreed] = useState(false);
  const [manualBreedInput, setManualBreedInput] = useState('');

  const [age, setAge] = useState<number | null>(null);
  const [foodType, setFoodType] = useState<string>('');
  const [budget, setBudget] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);

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
        setDetectedPetType(data.petType || 'dog');
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

  const handleConfirmBreed = () => {
    setStep('age');
  };

  const handleRejectBreed = () => {
    setIsManualBreed(true);
  };

  const handleSubmitManualBreed = () => {
    if (manualBreedInput.trim()) {
      setDetectedBreed(manualBreedInput.trim());
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
      <nav className="bg-white border-b border-[#EEEEEE] px-6 md:px-[48px] flex items-center shrink-0" style={{ height: '72px' }}>
        <Link href="/" className="flex items-center text-[#8B5E3C] font-bold text-sm hover:underline">
          &larr; Back to Home
        </Link>
        <div style={{ marginLeft: 'auto' }}>
           <img src="/Logo.png" alt="Lumo Bites" style={{ height: '50px', width: 'auto', display: 'block', objectFit: 'contain' }} />
        </div>
      </nav>

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
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-[#D9C0A8] bg-[#F5EDE4] rounded-2xl p-8 md:p-12 text-center flex flex-col items-center gap-6"
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
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-4xl shadow-sm text-[#8B5E3C]">
                🐾
              </div>
              
              <div className="flex flex-col gap-3 w-full max-w-[280px]">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white border-2 border-[#D9C0A8] text-[#8B5E3C] py-3 px-4 rounded-xl font-bold hover:bg-[#FDF9F5] hover:border-[#C17D3C] transition-all flex items-center justify-center gap-2 w-full"
                >
                  <span className="text-xl">📁</span> Upload from gallery
                </button>
                
                <button 
                  onClick={() => cameraInputRef.current?.click()}
                  className="md:hidden bg-[#8B5E3C] text-white py-3 px-4 rounded-xl font-bold hover:bg-[#734A2E] transition-all flex items-center justify-center gap-2 w-full shadow-sm"
                >
                  <span className="text-xl">📷</span> Take a photo
                </button>
              </div>

              <p className="text-sm text-[#9A7760] mt-2 hidden md:block">
                or drag and drop your file here
              </p>
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
              
              {detectedPetType === 'none' ? (
                <div className="w-full flex flex-col gap-4 items-center">
                  <h2 className="text-2xl font-[800] text-[#191919] leading-tight">
                    We couldn&apos;t detect a pet! 🕵️
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
                      {detectedPetType === 'cat' ? '🐱' : '🐕'} Looks like a <span className="text-[#8B5E3C]">{detectedBreed}</span>! Is that right?
                    </h2>
                    {confidence && (
                      <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest ${
                        confidence === 'High' ? 'bg-green-100 text-green-700' :
                        confidence === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {confidence} Match
                      </span>
                    )}
                  </div>
                  
                  {breedDescription && (
                    <p className="text-sm text-[#666666] max-w-[90%] italic">
                      &quot;{breedDescription}&quot;
                    </p>
                  )}

                  {confidence === 'Low' && (
                    <div className="bg-orange-50 border border-orange-200 text-orange-800 p-4 rounded-xl text-sm w-full">
                      We are not 100% sure. Please confirm or correct the breed below.
                    </div>
                  )}

                  <div className="flex flex-col md:flex-row gap-4 w-full mt-2">
                    <button 
                      onClick={handleConfirmBreed}
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
                      setStep('food');
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

          {/* FOOD PREF STEP */}
          {step === 'food' && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <h2 className="text-2xl font-[800] text-[#191919] text-center mb-2">What food do they prefer?</h2>
              <div className="flex flex-col gap-3">
                {[
                  { label: '🥩 Dry food (kibble)', val: 'dry' },
                  { label: '🍖 Wet food (canned)', val: 'wet' },
                  { label: '🔀 Both / No preference', val: 'both' }
                ].map((opt) => (
                  <button 
                    key={opt.val}
                    onClick={() => {
                      setFoodType(opt.val);
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
                  className="bg-[#8B5E3C] text-white py-5 rounded-xl font-bold text-lg hover:bg-[#734A2E] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? 'Finding food...' : 'Find Matches! 🐾'}
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
