'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Footprints, CheckCircle, MapPin, RefreshCw, Lock, PawPrint, Navigation, Camera, Upload, Phone } from 'lucide-react';
import { formatPublicCity } from '@/lib/formatCity';

export default function PostLostPet() {
  const router = useRouter();
  const [proEmailAuth, setProEmailAuth] = useState('');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const email = localStorage.getItem('lumo_pro_email') || '';
    setProEmailAuth(email);
    setChecking(false);
  }, []);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [type, setType] = useState<'lost' | 'found'>('lost');
  const [species, setSpecies] = useState<'dog' | 'cat' | 'other'>('dog');
  const [petName, setPetName] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [locationVerified, setLocationVerified] = useState(false);
  const [locationOptions, setLocationOptions] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  
  const [dateLostFound, setDateLostFound] = useState('');
  const [contactEmail, setContactEmail] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('lumo_pro_email') || localStorage.getItem('lumo_sitter_email') || '';
    }
    return '';
  });
  const [contactPhone, setContactPhone] = useState('');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [notifyMatches, setNotifyMatches] = useState(true);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
    setContactPhone(digitsOnly);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const emailVal = localStorage.getItem('lumo_pro_email') || localStorage.getItem('lumo_sitter_email') || '';
      if (emailVal) {
        setIsSignedIn(true);
        setContactEmail(emailVal);
      }
    }
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    handlePhotoUpload(e);
  };

  const handleUseMyLocation = () => {
    if (navigator.geolocation) {
      setIsDetectingLocation(true);
      setIsLocating(true);
      setLocationVerified(false);
      setSelectedLocation(null);
      setLocationOptions([]);
      setError('');
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          try {
            const res = await fetch(`/api/petsitting/geocode?latlng=${lat},${lng}`);
            const data = await res.json();
            if (res.ok && data.lat && data.lng) {
              const locationName = data.formatted_address || data.city || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
              setLocationInput(locationName);
              setCity(locationName);
              setSelectedLocation({
                formatted_address: locationName,
                lat: data.lat,
                lng: data.lng
              });
              setLocationVerified(true);
            } else {
              setError('Could not determine your location name.');
            }
          } catch (e) {
            console.error('Reverse geocoding error:', e);
            setError('Failed to parse your location name.');
          } finally {
            setIsLocating(false);
            setIsDetectingLocation(false);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          setIsLocating(false);
          setIsDetectingLocation(false);
          setError('Unable to get your location. Please enter manually.');
          alert('Unable to get your location. Please enter manually.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  const handleLocationBlur = async () => {
    const input = locationInput.trim();
    if (!input) {
      setLocationVerified(false);
      setLocationOptions([]);
      setSelectedLocation(null);
      return;
    }
    
    setIsLocating(true);
    setLocationVerified(false);
    setLocationOptions([]);
    setSelectedLocation(null);

    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
         setCity(input);
         setLocationVerified(true);
         return;
      }
      
      const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(input)}&key=${apiKey}`);
      const data = await res.json();
      
      if (data.results && data.results.length > 0) {
        const options = data.results.map((r: any) => ({
          formatted_address: r.formatted_address,
          lat: r.geometry.location.lat,
          lng: r.geometry.location.lng,
          place_id: r.place_id
        }));
        
        setLocationOptions(options);
        
        if (options.length === 1) {
          setSelectedLocation(options[0]);
          setCity(options[0].formatted_address);
          setLocationVerified(true);
        }
      } else {
        setCity(input);
        setLocationVerified(true);
      }
    } catch (err) {
      console.error(err);
      setCity(input);
      setLocationVerified(true);
    } finally {
      setIsLocating(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (photoUrls.length + files.length > 5) {
      setError('You can upload up to 5 photos total.');
      return;
    }

    setError('');

    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        setError('Each photo must be under 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          if (width > height) {
            if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
          } else {
            if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const base64 = canvas.toDataURL('image/jpeg', 0.8);
          setPhotoUrls(prev => [...prev, base64].slice(0, 5));
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const rawLocation = city || locationInput.trim();
    const finalCity = formatPublicCity(rawLocation) || rawLocation;
    const finalLat = selectedLocation ? selectedLocation.lat : null;
    const finalLng = selectedLocation ? selectedLocation.lng : null;

    if (photoUrls.length === 0) {
      setError('At least one photo is required so others can identify the pet.');
      return;
    }
    if (!contactEmail) {
      setError('Email is required so we can send you a link to manage your post');
      return;
    }
    if (!finalCity) {
      setError('Please provide the last seen location.');
      return;
    }
    const cleanPhone = contactPhone.replace(/\D/g, '');
    if (cleanPhone.length > 0 && cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }
    if (type === 'lost' && notifyMatches && cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit phone number to receive match notifications.');
      return;
    }

    const formattedPhone = cleanPhone.length === 10 ? `+1${cleanPhone}` : '';

    setLoading(true);
    try {
      const res = await fetch('/api/lost-pets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type, species, pet_name: petName, description,
          city: finalCity, zip_code: zipCode, date_lost_found: dateLostFound,
          contact_email: contactEmail, contact_phone: formattedPhone || null,
          photo_urls: photoUrls,
          latitude: finalLat, longitude: finalLng,
          notify_matches: notifyMatches
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push('/lost-pets'), 3000);
      } else {
        setError(data.error || 'Failed to post');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#FDFAF7] font-sans flex flex-col">
                <main className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white p-10 rounded-3xl shadow-lg border border-[#E8DDD4] text-center max-w-md animate-fade-in">
            <Footprints className="w-16 h-16 text-[#8B5E3C] mx-auto mb-4 animate-bounce" />
            <h2 className="text-3xl font-black text-[#4A3E3D] mb-4">Post Shared!</h2>
            <p className="text-[#8B7E7D] font-medium text-lg mb-6">
              Your post has been shared! We hope you find {type === 'lost' ? 'your pet' : 'their owner'} soon.
            </p>
            {contactEmail && (
              <p className="text-sm text-[#555555]">
                We've sent an email to <strong>{contactEmail}</strong> with a secure link to edit your post or mark it as resolved.
              </p>
            )}
          </div>
        </main>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-[#F7F3EE] font-sans">
      <main className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        <Link href="/lost-pets" className="text-[#8B5E3C] font-bold hover:underline mb-6 inline-block">&larr; Back to Board</Link>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-[#2E2419] mb-2">Report a Pet</h1>
          <p className="text-gray-500 font-medium">Provide as much detail as possible to help reunite pets across the community.</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 font-bold text-center border border-red-200">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Pet Identity & Basic Info */}
          <div 
            style={{ boxShadow: '0 2px 8px rgba(139, 94, 60, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)' }}
            className="bg-white rounded-2xl border border-[#DFD3C7] shadow-xs overflow-hidden"
          >
            <div className="bg-[#FAF5EE] px-5 py-3.5 border-b border-[#EADBCE] flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-[#2E2419] flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#F0E6DA] text-[#8B5E3C] flex items-center justify-center text-xs">
                  <PawPrint className="w-3.5 h-3.5" />
                </span>
                Pet Identity & Type
              </h3>
              <span className="text-[10px] font-bold text-[#8B5E3C] bg-white px-2 py-0.5 rounded-full border border-[#EADBCE]">
                Step 1 of 4
              </span>
            </div>

            <div className="p-5 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#4A3E3D] mb-1.5">I am reporting a...</label>
                  <select 
                    value={type} 
                    onChange={e => setType(e.target.value as any)} 
                    className="w-full bg-[#FAF6F2] border border-[#E2D5C8] rounded-xl px-3.5 py-2.5 text-[#2E2419] text-sm focus:outline-none focus:border-[#8B5E3C] focus:ring-2 focus:ring-[#8B5E3C]/20 font-bold"
                  >
                    <option value="lost">Lost Pet (I lost my pet)</option>
                    <option value="found">Found Pet (I found someone's pet)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#4A3E3D] mb-1.5">Pet Species</label>
                  <select 
                    value={species} 
                    onChange={e => setSpecies(e.target.value as any)} 
                    className="w-full bg-[#FAF6F2] border border-[#E2D5C8] rounded-xl px-3.5 py-2.5 text-[#2E2419] text-sm focus:outline-none focus:border-[#8B5E3C] focus:ring-2 focus:ring-[#8B5E3C]/20 font-bold"
                  >
                    <option value="dog">Dog</option>
                    <option value="cat">Cat</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A3E3D] mb-1.5">Pet's Name {type === 'found' && '(if known)'}</label>
                  <input 
                    required={type === 'lost'} 
                    type="text" 
                    value={petName} 
                    onChange={e => setPetName(e.target.value)} 
                    className="w-full bg-[#FAF6F2] border border-[#E2D5C8] rounded-xl px-3.5 py-2.5 text-[#2E2419] text-sm focus:outline-none focus:border-[#8B5E3C] focus:ring-2 focus:ring-[#8B5E3C]/20" 
                    placeholder="e.g. Bella" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A3E3D] mb-1.5">Date {type === 'lost' ? 'Lost' : 'Found'}</label>
                  <input 
                    required 
                    type="date" 
                    value={dateLostFound} 
                    onChange={e => setDateLostFound(e.target.value)} 
                    className="w-full bg-[#FAF6F2] border border-[#E2D5C8] rounded-xl px-3.5 py-2.5 text-[#2E2419] text-sm focus:outline-none focus:border-[#8B5E3C] focus:ring-2 focus:ring-[#8B5E3C]/20" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A3E3D] mb-1.5">Description & Distinguishing Features</label>
                <textarea 
                  required 
                  rows={3} 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  className="w-full bg-[#FAF6F2] border border-[#E2D5C8] rounded-xl px-3.5 py-2.5 text-[#2E2419] text-sm focus:outline-none focus:border-[#8B5E3C] focus:ring-2 focus:ring-[#8B5E3C]/20" 
                  placeholder="Distinctive markings, collar, microchip, or behavior traits..." 
                />
              </div>
            </div>
          </div>

          {/* Section 2: Last Seen Date & Location */}
          <div 
            style={{ boxShadow: '0 2px 8px rgba(139, 94, 60, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)' }}
            className="bg-white rounded-2xl border border-[#DFD3C7] shadow-xs overflow-hidden"
          >
            <div className="bg-[#FAF5EE] px-5 py-3.5 border-b border-[#EADBCE] flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-[#2E2419] flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-900 flex items-center justify-center text-xs">
                  <MapPin className="w-3.5 h-3.5" />
                </span>
                Last Seen Location
              </h3>
              <span className="text-[10px] font-bold text-[#8B5E3C] bg-white px-2 py-0.5 rounded-full border border-[#EADBCE]">
                Step 2 of 4
              </span>
            </div>

            <div className="p-5 sm:p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#4A3E3D] mb-1.5">City, Neighborhood, or 5-Digit Zip Code</label>
                <div className="flex gap-2">
                  <div className="relative flex-grow">
                    <input 
                      required 
                      type="text" 
                      value={locationInput} 
                      onChange={e => {
                        setLocationInput(e.target.value);
                        setLocationVerified(false);
                        setSelectedLocation(null);
                        setLocationOptions([]);
                      }} 
                      onBlur={handleLocationBlur}
                      className={`w-full bg-[#FAF6F2] border ${locationVerified ? 'border-emerald-500' : 'border-[#E2D5C8]'} rounded-xl px-3.5 py-2.5 text-[#2E2419] text-sm focus:outline-none focus:border-[#8B5E3C] focus:ring-2 focus:ring-[#8B5E3C]/20 pr-12`} 
                      placeholder="City or 5-digit zip code" 
                    />
                    {isLocating && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-[#8B5E3C] border-t-transparent rounded-full animate-spin"></div>
                    )}
                    {locationVerified && !isLocating && selectedLocation && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleUseMyLocation}
                    disabled={isDetectingLocation}
                    className={`bg-[#FAF6F4] hover:bg-[#F0E6DD] border border-[#DFD3C7] rounded-xl px-4 py-2.5 text-[#8B5E3C] font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                      isDetectingLocation ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                    title="Use my current location"
                  >
                    {isDetectingLocation ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#8B5E3C]" />
                        <span className="hidden sm:inline">Detecting...</span>
                      </>
                    ) : (
                      <>
                        <Navigation className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Use My Location</span>
                      </>
                    )}
                  </button>
                </div>
                
                {selectedLocation && (
                  <p className="mt-2 text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> {selectedLocation.formatted_address}
                  </p>
                )}
                
                {locationOptions.length > 1 && !selectedLocation && (
                  <div className="mt-3 p-3 bg-[#FAF6F2] border border-[#E2D5C8] rounded-xl">
                    <p className="text-xs font-bold text-[#4A3E3D] mb-1.5">Multiple locations found. Please select one:</p>
                    <div className="flex flex-col gap-1.5">
                      {locationOptions.map((opt, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setSelectedLocation(opt);
                            setCity(opt.formatted_address);
                            setLocationVerified(true);
                            setLocationInput(opt.formatted_address);
                          }}
                          className="text-left px-3 py-2 hover:bg-white rounded-lg border border-transparent hover:border-[#E2D5C8] transition-colors text-xs text-[#2E2419] font-medium flex items-center gap-1.5"
                        >
                          <MapPin className="w-3.5 h-3.5 text-gray-500 shrink-0" /> {opt.formatted_address}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Pet Photos */}
          <div 
            style={{ boxShadow: '0 2px 8px rgba(139, 94, 60, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)' }}
            className="bg-white rounded-2xl border border-[#DFD3C7] shadow-xs overflow-hidden"
          >
            <div className="bg-[#FAF5EE] px-5 py-3.5 border-b border-[#EADBCE] flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-[#2E2419] flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs">
                  <Camera className="w-3.5 h-3.5" />
                </span>
                Pet Photos (up to 5)
              </h3>
              <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                *At least 1 required
              </span>
            </div>

            <div className="p-5 sm:p-6 space-y-4">
              {photoUrls.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {photoUrls.map((url, index) => (
                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-[#DFD3C7] bg-white shadow-2xs group">
                      <img src={url} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setPhotoUrls(prev => prev.filter((_, i) => i !== index))}
                        className="absolute top-1.5 right-1.5 bg-black/75 hover:bg-black text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold transition-all shadow-md cursor-pointer hover:scale-105"
                        title="Remove photo"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <input 
                  type="file" 
                  accept="image/*" 
                  multiple 
                  ref={fileInputRef}
                  onChange={handlePhotoUpload} 
                  disabled={photoUrls.length >= 5}
                  className="hidden" 
                />
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  ref={cameraInputRef}
                  onChange={handlePhotoCapture}
                  disabled={photoUrls.length >= 5}
                  className="hidden"
                />
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={photoUrls.length >= 5}
                    className="flex-1 min-w-[140px] bg-[#FAF6F4] border border-[#DFD3C7] hover:bg-[#F0E6DD] text-[#8B5E3C] font-bold py-2.5 px-4 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 text-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Choose from Gallery</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={photoUrls.length >= 5}
                    className="flex-1 min-w-[140px] bg-[#8B5E3C] hover:bg-[#7A5234] text-white font-bold py-2.5 px-4 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 text-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Take Photo</span>
                  </button>
                </div>
                <p className="text-[11px] text-[#8B7E7D] mt-2 font-medium">
                  Select up to 5 photos. You have added {photoUrls.length}/5 photos.
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: Contact Info & Match Alerts */}
          <div 
            style={{ boxShadow: '0 2px 8px rgba(139, 94, 60, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)' }}
            className="bg-white rounded-2xl border border-[#DFD3C7] shadow-xs overflow-hidden"
          >
            <div className="bg-[#FAF5EE] px-5 py-3.5 border-b border-[#EADBCE] flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-[#2E2419] flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center text-xs">
                  <Phone className="w-3.5 h-3.5" />
                </span>
                Contact Information & Alerts
              </h3>
              <span className="text-[10px] font-bold text-[#8B5E3C] bg-white px-2 py-0.5 rounded-full border border-[#EADBCE]">
                Step 4 of 4
              </span>
            </div>

            <div className="p-5 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#4A3E3D] mb-1.5">Email Address <span className="text-red-500">*Required</span></label>
                  <div className="relative">
                    {isSignedIn && (
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <input 
                      required 
                      type="email" 
                      value={contactEmail} 
                      onChange={e => !isSignedIn && setContactEmail(e.target.value)}
                      readOnly={isSignedIn} 
                      className={`w-full border rounded-xl py-2.5 text-sm focus:outline-none ${isSignedIn ? 'bg-gray-100 text-gray-500 cursor-not-allowed pl-9 pr-3.5 border-gray-200' : 'bg-[#FAF6F2] text-[#2E2419] border-[#E2D5C8] focus:border-[#8B5E3C] focus:ring-2 focus:ring-[#8B5E3C]/20 px-3.5'}`} 
                      placeholder="you@email.com" 
                    />
                  </div>
                  <p className="text-[11px] text-[#8B7E7D] mt-1 font-medium">We'll send you a secure link to manage or delete your post anytime.</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#4A3E3D] mb-1.5">Phone Number</label>
                  <div className="relative flex items-center">
                    <div className="absolute left-0 top-0 bottom-0 px-3 bg-[#EADBCE]/50 border-r border-[#E2D5C8] rounded-l-xl flex items-center justify-center text-[#4A3E3D] font-bold text-xs select-none pointer-events-none">
                      +1
                    </div>
                    <input 
                      type="tel" 
                      value={contactPhone} 
                      onChange={handlePhoneChange} 
                      maxLength={10}
                      className="w-full bg-[#FAF6F2] border border-[#E2D5C8] rounded-xl pl-11 pr-3.5 py-2.5 text-[#2E2419] text-sm focus:outline-none focus:border-[#8B5E3C] focus:ring-2 focus:ring-[#8B5E3C]/20 font-mono tracking-wider" 
                      placeholder="5555555555" 
                    />
                  </div>
                  <p className="text-[11px] text-[#8B7E7D] mt-1 font-medium">Enter 10-digit US phone number for instant alerts</p>
                </div>
              </div>

              {type === 'lost' && (
                <div className="flex items-start gap-2 pt-2 border-t border-[#FAF6F2]">
                  <input
                    type="checkbox"
                    id="notify_matches"
                    name="notify_matches"
                    checked={notifyMatches && contactPhone.length === 10}
                    disabled={contactPhone.length !== 10}
                    onChange={(e) => setNotifyMatches(e.target.checked)}
                    className="mt-0.5 rounded text-[#8B5E3C] focus:ring-[#8B5E3C] disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <label htmlFor="notify_matches" className={`text-xs ${contactPhone.length !== 10 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 font-medium'}`}>
                    Notify me via SMS when a possible match is found nearby (requires 10-digit phone number)
                    <span className="text-[10px] text-gray-400 block mt-0.5">
                      We'll only notify you for strong AI matches (70%+ similarity) within 10 miles. Max 3 alerts per day.
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-[#8B5E3C] hover:bg-[#734A2E] text-white font-extrabold py-3.5 rounded-xl transition-all shadow-md text-base mt-8 disabled:opacity-70 cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Posting...</span>
            ) : (
              <>
                <PawPrint className="w-4 h-4" />
                <span>Post to Community Board</span>
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
