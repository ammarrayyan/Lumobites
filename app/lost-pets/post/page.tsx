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
  
  const [dateLostFound, setDateLostFound] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  const handleLocationBlur = async () => {
    const input = locationInput.trim();
    if (!input) {
      setLocationVerified(false);
      return;
    }
    
    // If it's a 5 digit number, treat as Zip Code
    if (/^\d{5}$/.test(input)) {
      setIsLocating(true);
      try {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
           setZipCode(input);
           setCity('');
           setLocationVerified(true);
           return;
        }
        
        const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${input}&key=${apiKey}`);
        const data = await res.json();
        
        if (data.results && data.results.length > 0) {
          const addressComponents = data.results[0].address_components;
          const cityComponent = addressComponents.find((c: any) => c.types.includes('locality') || c.types.includes('administrative_area_level_3') || c.types.includes('neighborhood'));
          
          if (cityComponent) {
            setCity(cityComponent.long_name);
            setZipCode(input);
            setLocationVerified(true);
            setLocationInput(`${cityComponent.long_name}, ${input}`);
          } else {
            setZipCode(input);
            setCity('');
            setLocationVerified(true);
          }
        } else {
          setZipCode(input);
          setCity('');
          setLocationVerified(true);
        }
      } catch (err) {
        console.error(err);
        setZipCode(input);
        setLocationVerified(true);
      } finally {
        setIsLocating(false);
      }
    } else {
      // Treat as city
      setCity(input);
      setZipCode('');
      setLocationVerified(true);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Photo must be under 5MB');
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
          setPhotoUrl(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const finalCity = city || locationInput.trim();

    if (!photoUrl) {
      setError('A photo is required so others can identify the pet.');
      return;
    }
    if (!contactEmail && !contactPhone) {
      setError('Please provide at least an email or phone number so you can be contacted.');
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
          photo_url: photoUrl
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
                    }} 
                    onBlur={handleLocationBlur}
                    className={`w-full bg-[#FAF6F4] border ${locationVerified ? 'border-green-500' : 'border-[#E8DDD4]'} rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C] pr-12`} 
                    placeholder="Enter city name OR 5-digit zip code..." 
                  />
                  {isLocating && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-[#8B5E3C] border-t-transparent rounded-full animate-spin"></div>
                  )}
                  {locationVerified && !isLocating && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    </div>
                  )}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-[#4A3E3D] mb-2">Description</label>
                <textarea required rows={4} value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]" placeholder="Breed, color, collar details, microchip info, behavioral traits..." />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-[#4A3E3D] mb-2">Pet Photo <span className="text-red-500">*Required</span></label>
                <div className="flex items-center gap-4 p-4 rounded-xl border border-[#E8DDD4] bg-[#FAF6F4]">
                  {photoUrl ? (
                    <img src={photoUrl} alt="Preview" className="w-24 h-24 rounded-lg object-cover shadow-sm border border-[#E8DDD4]" />
                  ) : (
                    <div className="w-24 h-24 rounded-lg bg-[#E8DDD4] flex items-center justify-center text-3xl">📷</div>
                  )}
                  <input required type="file" accept="image/*" onChange={handlePhotoUpload} className="block w-full text-sm text-[#666666] file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-white file:text-[#8B5E3C] file:border file:border-[#E8DDD4] hover:file:bg-[#F0E6DD] transition-colors cursor-pointer focus:outline-none" />
                </div>
              </div>

              <div className="md:col-span-2 mt-4 pt-6 border-t border-[#E8DDD4]">
                <h3 className="text-lg font-black text-[#4A3E3D] mb-4">Contact Information</h3>
                <p className="text-sm text-[#8B7E7D] mb-4">Please provide at least one way for the community to reach you.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-[#4A3E3D] mb-2">Email Address</label>
                    <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]" placeholder="you@email.com" />
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
