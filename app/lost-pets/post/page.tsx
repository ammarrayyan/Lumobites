'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function PostLostPet() {
  const router = useRouter();
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
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

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

    const finalCity = city || locationInput.trim();
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

    setLoading(true);
    try {
      const res = await fetch('/api/lost-pets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type, species, pet_name: petName, description,
          city: finalCity, zip_code: zipCode, date_lost_found: dateLostFound,
          contact_email: contactEmail, contact_phone: contactPhone,
          photo_urls: photoUrls,
          latitude: finalLat, longitude: finalLng
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
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white p-10 rounded-3xl shadow-lg border border-[#E8DDD4] text-center max-w-md animate-fade-in">
            <span className="text-6xl mb-4 block">🐾</span>
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
    <div className="min-h-screen bg-[#FDFAF7] font-sans">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        <Link href="/lost-pets" className="text-[#8B5E3C] font-bold hover:underline mb-6 inline-block">&larr; Back to Board</Link>
        
        <div className="bg-white rounded-3xl p-6 md:p-10 border border-[#E8DDD4] shadow-sm">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-black text-[#4A3E3D] mb-2">Report a Pet</h1>
            <p className="text-[#8B7E7D]">Provide as much detail as possible to help the community.</p>
          </div>

          {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 font-bold text-center border border-red-200">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-[#4A3E3D] mb-2">I am reporting a...</label>
                <select value={type} onChange={e => setType(e.target.value as any)} className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C] font-bold">
                  <option value="lost">Lost Pet (I lost my pet)</option>
                  <option value="found">Found Pet (I found someone's pet)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-[#4A3E3D] mb-2">Pet Species</label>
                <select value={species} onChange={e => setSpecies(e.target.value as any)} className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C] font-bold">
                  <option value="dog">Dog</option>
                  <option value="cat">Cat</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-[#4A3E3D] mb-2">Pet's Name {type === 'found' && '(if known)'}</label>
                <input required={type === 'lost'} type="text" value={petName} onChange={e => setPetName(e.target.value)} className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]" placeholder="e.g. Bella" />
              </div>

              <div>
                <label className="block text-sm font-bold text-[#4A3E3D] mb-2">Date {type === 'lost' ? 'Lost' : 'Found'}</label>
                <input required type="date" value={dateLostFound} onChange={e => setDateLostFound(e.target.value)} className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-[#4A3E3D] mb-2">Last Seen Location (City or Zip Code)</label>
                <div className="relative">
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
                    className={`w-full bg-[#FAF6F4] border ${locationVerified ? 'border-green-500' : 'border-[#E8DDD4]'} rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C] pr-12`} 
                    placeholder="Enter city name OR 5-digit zip code..." 
                  />
                  {isLocating && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-[#8B5E3C] border-t-transparent rounded-full animate-spin"></div>
                  )}
                  {locationVerified && !isLocating && selectedLocation && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    </div>
                  )}
                </div>
                
                {selectedLocation && (
                  <p className="mt-2 text-sm font-bold text-green-600 flex items-center gap-1.5">
                    ✅ {selectedLocation.formatted_address}
                  </p>
                )}
                
                {locationOptions.length > 1 && !selectedLocation && (
                  <div className="mt-3 p-4 bg-white border border-[#E8DDD4] rounded-xl shadow-sm">
                    <p className="text-sm font-bold text-[#4A3E3D] mb-2">Multiple locations found. Please select one:</p>
                    <div className="flex flex-col gap-2">
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
                          className="text-left px-4 py-2 hover:bg-[#FAF6F4] rounded-lg border border-transparent hover:border-[#E8DDD4] transition-colors text-[#4A3E3D]"
                        >
                          📍 {opt.formatted_address}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-[#4A3E3D] mb-2">Description</label>
                <textarea required rows={4} value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]" placeholder="Breed, color, collar details, microchip info, behavioral traits..." />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-[#4A3E3D] mb-2">Pet Photos (up to 5) <span className="text-red-500">*At least 1 required</span></label>
                <div className="flex flex-col gap-4 p-4 rounded-xl border border-[#E8DDD4] bg-[#FAF6F4]">
                  {photoUrls.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {photoUrls.map((url, index) => (
                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-[#E8DDD4] bg-white shadow-sm group">
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
                      onChange={handlePhotoUpload} 
                      disabled={photoUrls.length >= 5}
                      className="block w-full text-sm text-[#666666] file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-white file:text-[#8B5E3C] file:border file:border-[#E8DDD4] hover:file:bg-[#F0E6DD] transition-colors cursor-pointer focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed" 
                    />
                    <p className="text-[11px] text-[#8B7E7D] mt-2 font-medium">
                      Select up to 5 photos. You have added {photoUrls.length}/5 photos.
                    </p>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 mt-4 pt-6 border-t border-[#E8DDD4]">
                <h3 className="text-lg font-black text-[#4A3E3D] mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-[#4A3E3D] mb-2">Email Address <span className="text-red-500">*Required</span></label>
                    <input required type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]" placeholder="you@email.com" />
                    <p className="text-xs text-[#8B7E7D] mt-2 font-medium">Required — we'll send you a secure link to manage or delete your post anytime.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#4A3E3D] mb-2">Phone Number</label>
                    <input type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)} className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]" placeholder="(555) 555-5555" />
                  </div>
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-[#8B5E3C] hover:bg-[#7A5234] text-white font-black py-4 rounded-xl transition-transform transform hover:scale-[1.02] shadow-lg text-lg mt-8 disabled:opacity-70 disabled:hover:scale-100">
              {loading ? 'Posting...' : 'Post to Community Board'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
