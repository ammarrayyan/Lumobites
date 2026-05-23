'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');
const stripePromiseTest = loadStripe(process.env.NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface Sitter {
  id: string;
  name: string;
  photo_url: string;
  city: string;
  zip: string;
  country?: string;
  lat?: number;
  lng?: number;
  bio: string;
  pet_types: string;
  rate_per_night: number;
  distance?: number;
}

// Haversine formula to calculate distance between two coordinates in miles
function getDistanceInMiles(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 3958.8; // Radius of the earth in miles
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c;
}

export default function PetSitting() {
  const [activeTab, setActiveTab] = useState<'find' | 'become'>('find');
  
  // Find Sitter State
  const [sitters, setSitters] = useState<Sitter[]>([]);
  const [loadingSitters, setLoadingSitters] = useState(true);
  const [isOwnerPro, setIsOwnerPro] = useState(false);
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [unlockEmail, setUnlockEmail] = useState('');
  const [unlockLoading, setUnlockLoading] = useState(false);
  const [searchZip, setSearchZip] = useState('');
  const [searchPetType, setSearchPetType] = useState('all');
  const [searchRadius, setSearchRadius] = useState('25');
  const [searchCoords, setSearchCoords] = useState<{lat: number, lng: number} | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [selectedSitter, setSelectedSitter] = useState<Sitter | null>(null);
  
  // Request Form State
  const [reqEmail, setReqEmail] = useState('');
  const [reqPetName, setReqPetName] = useState('');
  const [reqPetType, setReqPetType] = useState('dog');
  const [reqDates, setReqDates] = useState('');
  const [reqNotes, setReqNotes] = useState('');
  const [reqLoading, setReqLoading] = useState(false);
  const [reqError, setReqError] = useState('');
  const [reqSuccess, setReqSuccess] = useState(false);

  // Become Sitter State
  const [sitterEmail, setSitterEmail] = useState('');
  const [sitterName, setSitterName] = useState('');
  const [sitterPhoto, setSitterPhoto] = useState('');
  const [sitterCity, setSitterCity] = useState('');
  const [sitterZip, setSitterZip] = useState('');
  const [sitterCountry, setSitterCountry] = useState('United States');
  const [sitterBio, setSitterBio] = useState('');
  const [sitterPetTypes, setSitterPetTypes] = useState('both');
  const [sitterRate, setSitterRate] = useState('');
  const [sitterAvailable, setSitterAvailable] = useState(true);
  const [isProSitter, setIsProSitter] = useState(false);
  
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [profilePreviewMode, setProfilePreviewMode] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);

  useEffect(() => {
    const cachedEmail = localStorage.getItem('lumo_pro_email');
    if (cachedEmail && cachedEmail !== 'undefined') {
      setReqEmail(cachedEmail);
      fetchSitters(cachedEmail);
    } else {
      fetchSitters();
    }
  }, []);

  // Debounced geocoding effect
  useEffect(() => {
    if (!searchZip.trim()) {
      setSearchCoords(null);
      return;
    }
    
    const timeoutId = setTimeout(async () => {
      setIsGeocoding(true);
      try {
        const res = await fetch(`/api/petsitting/geocode?address=${encodeURIComponent(searchZip)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.lat && data.lng) {
            setSearchCoords({ lat: data.lat, lng: data.lng });
          } else {
            setSearchCoords(null);
          }
        } else {
          setSearchCoords(null);
        }
      } catch (e) {
        setSearchCoords(null);
      } finally {
        setIsGeocoding(false);
      }
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [searchZip]);

  const fetchSitters = async (email?: string) => {
    try {
      const url = email ? `/api/petsitting/sitters?owner_email=${encodeURIComponent(email)}` : '/api/petsitting/sitters';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setSitters(data.sitters);
        setIsOwnerPro(data.isOwnerPro);
      }
    } catch (e) {
      console.error('Failed to fetch sitters');
    } finally {
      setLoadingSitters(false);
    }
  };

  const loadSitterProfile = async (email: string) => {
    setProfileLoading(true);
    try {
      const res = await fetch(`/api/petsitting/profile?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setSitterName(data.name || '');
          setSitterPhoto(data.photo_url || '');
          setSitterCity(data.city || '');
          setSitterZip(data.zip || '');
          setSitterCountry(data.country || 'United States');
          setSitterBio(data.bio || '');
          setSitterPetTypes(data.pet_types || 'both');
          setSitterRate(data.rate_per_night?.toString() || '');
          setSitterAvailable(data.availability);
          setIsProSitter(data.is_pro);
        }
      }
    } catch (e) {
      console.error('Failed to load profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage('');
    setFormErrors([]);

    // Strict Validation
    const errors: string[] = [];
    if (!sitterEmail.trim()) errors.push('email');
    if (!sitterName.trim()) errors.push('name');
    if (!sitterPhoto) errors.push('photo');
    if (!sitterCity.trim()) errors.push('city');
    if (!sitterZip.trim()) errors.push('zip');
    if (!sitterRate || parseInt(sitterRate) <= 0) errors.push('rate');
    if (!sitterBio.trim()) errors.push('bio');
    
    if (errors.length > 0) {
      setFormErrors(errors);
      setProfileMessage('Please fill out all missing fields highlighted in red.');
      return;
    }

    setProfileLoading(true);

    try {
      const res = await fetch('/api/petsitting/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: sitterEmail,
          name: sitterName,
          photo_url: sitterPhoto,
          city: sitterCity,
          zip: sitterZip,
          country: sitterCountry,
          bio: sitterBio,
          pet_types: sitterPetTypes,
          rate_per_night: sitterRate,
          availability: sitterAvailable
        })
      });

      if (res.ok) {
        if (!isProSitter) {
          // If not PRO, show the preview screen
          setProfilePreviewMode(true);
        } else {
          setProfileMessage('Profile saved successfully!');
        }
      } else {
        const err = await res.json();
        setProfileMessage(err.error || 'Failed to save profile');
      }
    } catch (error) {
      setProfileMessage('An error occurred while saving.');
    } finally {
      setProfileSaving(false);
      setProfileLoading(false);
    }
  };

  const handleStripeCheckout = async () => {
    setProfileLoading(true);
    setProfileMessage('');
    try {
      const res = await fetch('/api/stripe/checkout-sitter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: sitterEmail })
      });
      const data = await res.json();
      if (data.sessionId) {
        const stripe = await stripePromiseTest;
        await stripe?.redirectToCheckout({ sessionId: data.sessionId });
      } else {
        setProfileMessage(data.error || 'Failed to start checkout');
        setProfileLoading(false);
      }
    } catch (error) {
      setProfileMessage('Failed to connect to payment processor.');
      setProfileLoading(false);
    }
  };

  const handleOwnerStripeCheckout = async () => {
    try {
      setReqLoading(true);
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: reqEmail })
      });
      const data = await res.json();
      if (data.sessionId) {
        const stripe = await stripePromise;
        await stripe?.redirectToCheckout({ sessionId: data.sessionId });
      } else {
        setReqError(data.error || 'Failed to start checkout');
        setReqLoading(false);
      }
    } catch (error) {
      setReqError('Failed to connect to payment processor.');
      setReqLoading(false);
    }
  };

  const handleUnlockProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnlockLoading(true);
    setReqError('');

    try {
      const res = await fetch(`/api/petsitting/sitters?owner_email=${encodeURIComponent(unlockEmail)}`);
      const data = await res.json();
      
      if (data.isOwnerPro) {
        setSitters(data.sitters);
        setIsOwnerPro(true);
        setUnlockModalOpen(false);
        localStorage.setItem('lumo_pro_email', unlockEmail);
        setReqEmail(unlockEmail);
      } else {
        // Not PRO, trigger checkout
        const checkoutRes = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: unlockEmail })
        });
        const checkoutData = await checkoutRes.json();
        if (checkoutData.sessionId) {
          const stripe = await stripePromise;
          await stripe?.redirectToCheckout({ sessionId: checkoutData.sessionId });
        } else {
          setReqError('Failed to start checkout');
        }
      }
    } catch (error) {
      setReqError('An error occurred.');
    } finally {
      setUnlockLoading(false);
    }
  };

  const submitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setReqLoading(true);
    setReqError('');
    setReqSuccess(false);

    try {
      const res = await fetch('/api/petsitting/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sitter_id: selectedSitter?.id,
          owner_email: reqEmail,
          pet_name: reqPetName,
          pet_type: reqPetType,
          dates: reqDates,
          special_notes: reqNotes
        })
      });

      const data = await res.json();
      if (res.ok) {
        setReqSuccess(true);
        setTimeout(() => {
          setRequestModalOpen(false);
          setReqSuccess(false);
        }, 3000);
      } else {
        if (data.error === 'requires_pro') {
          setReqError('requires_pro');
        } else {
          setReqError(data.error || 'Failed to submit request');
        }
      }
    } catch (err) {
      setReqError('An unexpected error occurred.');
    } finally {
      setReqLoading(false);
    }
  };

  let filteredSitters = sitters.filter(s => {
    if (searchPetType !== 'all' && s.pet_types !== 'both' && s.pet_types !== searchPetType) return false;
    return true;
  });

  if (searchCoords && searchRadius !== 'any') {
    // Add distance to each sitter
    filteredSitters = filteredSitters.map(s => {
      if (s.lat && s.lng) {
        return { ...s, distance: getDistanceInMiles(searchCoords.lat, searchCoords.lng, s.lat, s.lng) };
      }
      return s;
    });

    // Filter by radius and sort
    const radius = parseFloat(searchRadius);
    filteredSitters = filteredSitters
      .filter(s => s.distance !== undefined && s.distance <= radius)
      .sort((a, b) => (a.distance || 0) - (b.distance || 0));
  } else if (searchZip) {
    // Fallback to text matching if geocoding failed or isn't ready
    filteredSitters = filteredSitters.filter(s => {
      const q = searchZip.toLowerCase();
      return s.zip.toLowerCase().includes(q) || s.city.toLowerCase().includes(q);
    });
  }

  const isFormValid = sitterEmail.trim() && sitterName.trim() && sitterPhoto && sitterCity.trim() && sitterZip.trim() && sitterRate && sitterBio.trim();

  return (
    <div className="min-h-screen bg-[#FDFAF7] font-sans">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-black text-[#4A3E3D] mb-4">Lumo Bites Pet Sitting</h1>
          <p className="text-[#8B5E3C] font-medium text-lg">Connect with trusted, local pet sitters in your neighborhood.</p>
        </div>

        {/* Custom Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white p-1 rounded-full shadow-sm inline-flex border border-[#E8DDD4]">
            <button
              onClick={() => setActiveTab('find')}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'find' ? 'bg-[#8B5E3C] text-white shadow-md' : 'text-[#666666] hover:text-[#8B5E3C]'}`}
            >
              Find a Sitter
            </button>
            <button
              onClick={() => setActiveTab('become')}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'become' ? 'bg-[#8B5E3C] text-white shadow-md' : 'text-[#666666] hover:text-[#8B5E3C]'}`}
            >
              Become a Sitter
            </button>
          </div>
        </div>

        {/* FIND A SITTER TAB */}
        {activeTab === 'find' && (
          <div className="animate-fade-in">
            {/* Search Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-[#E8DDD4] mb-8 flex flex-col md:flex-row gap-4 relative">
              <input
                type="text"
                placeholder="City, Zip or Postal Code..."
                className="flex-1 bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]"
                value={searchZip}
                onChange={(e) => setSearchZip(e.target.value)}
              />
              {isGeocoding && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 md:static md:translate-y-0 text-sm text-[#8B5E3C] md:flex md:items-center">
                  Locating...
                </div>
              )}
              <select
                className="bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]"
                value={searchRadius}
                onChange={(e) => setSearchRadius(e.target.value)}
              >
                <option value="10">Within 10 miles</option>
                <option value="25">Within 25 miles</option>
                <option value="50">Within 50 miles</option>
                <option value="100">Within 100 miles</option>
                <option value="any">Any distance</option>
              </select>
              <select
                className="bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]"
                value={searchPetType}
                onChange={(e) => setSearchPetType(e.target.value)}
              >
                <option value="all">All Pets</option>
                <option value="dog">Dogs Only</option>
                <option value="cat">Cats Only</option>
              </select>
            </div>

            {/* Sitters Grid */}
            {loadingSitters ? (
              <div className="text-center text-[#8B5E3C] py-12">Loading trusted sitters...</div>
            ) : filteredSitters.length === 0 ? (
              <div className="text-center bg-white p-12 rounded-3xl border border-[#E8DDD4]">
                <span className="text-4xl mb-4 block">🐾</span>
                <h3 className="text-xl font-bold text-[#4A3E3D] mb-2">No sitters found in your area yet.</h3>
                <p className="text-[#8B7E7D] mb-4">Try expanding your search distance, or be the first to join!</p>
                <button 
                  onClick={() => setActiveTab('become')}
                  className="text-[#8B5E3C] font-bold hover:text-[#7A5234] flex items-center justify-center gap-1 mx-auto"
                >
                  Be the first! &rarr;
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSitters.map(sitter => (
                  <div key={sitter.id} className="bg-white rounded-3xl p-6 border border-[#E8DDD4] shadow-sm hover:shadow-md transition-shadow relative">
                    <div className="absolute top-4 right-4 bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                      Verified
                    </div>
                    
                    <div className="flex items-center gap-4 mb-4">
                      {sitter.photo_url ? (
                        <img src={sitter.photo_url} alt={sitter.name} className="w-16 h-16 rounded-full object-cover border-2 border-[#FAF6F4]" />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-[#E8DDD4] flex items-center justify-center text-[#8B5E3C] font-bold text-xl">
                          {sitter.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h3 className="text-xl font-bold text-[#4A3E3D]">{sitter.name}</h3>
                        <p className="text-[#8B7E7D] text-sm flex items-center gap-1">
                          📍 {sitter.city}, {sitter.country || 'United States'}
                        </p>
                        {sitter.distance !== undefined && (
                          <p className="text-[#8B5E3C] text-xs font-bold mt-0.5 ml-5">
                            {sitter.distance.toFixed(1)} miles away
                          </p>
                        )}
                      </div>
                    </div>

                    <p className={`text-[#555555] text-sm mb-4 line-clamp-3 h-[60px] ${!isOwnerPro ? 'blur-[3px] select-none' : ''}`}>{sitter.bio}</p>

                    <div className="flex items-center justify-between mb-6">
                      <div className="text-sm font-semibold text-[#8B5E3C] bg-[#FAF6F4] px-3 py-1 rounded-lg">
                        {sitter.pet_types === 'both' ? 'Dogs & Cats' : sitter.pet_types === 'dog' ? 'Dogs Only' : 'Cats Only'}
                      </div>
                      <div className="text-lg font-black text-[#4A3E3D]">
                        ${sitter.rate_per_night}<span className="text-sm font-medium text-[#8B7E7D]">/night</span>
                      </div>
                    </div>

                    {isOwnerPro ? (
                      <button
                        onClick={() => { setSelectedSitter(sitter); setRequestModalOpen(true); }}
                        className="w-full bg-[#8B5E3C] hover:bg-[#7A5234] text-white font-bold py-3 rounded-xl transition-colors"
                      >
                        Request Sitter
                      </button>
                    ) : (
                      <button
                        onClick={() => setUnlockModalOpen(true)}
                        className="w-full bg-gradient-to-r from-[#FFB703] to-[#FB8500] hover:from-[#F5A623] hover:to-[#E67E22] text-white font-bold py-3 rounded-xl transition-colors shadow-sm flex justify-center items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/></svg>
                        Unlock Profile
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* BECOME A SITTER TAB */}
        {activeTab === 'become' && (
          <div className="max-w-2xl mx-auto bg-white rounded-3xl p-8 border border-[#E8DDD4] shadow-sm animate-fade-in">
            {profilePreviewMode ? (
              <div className="animate-fade-in text-center">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h2 className="text-3xl font-black text-[#4A3E3D] mb-2">Your profile is ready!</h2>
                <p className="text-[#8B7E7D] mb-8 max-w-md mx-auto">Upgrade to Lumo Sitter Pro for $9.99/month to go live and start receiving requests from pet owners near you.</p>
                
                {/* Profile Preview Card */}
                <div className="bg-[#FAF6F4] border border-[#E8DDD4] rounded-2xl p-6 text-left mb-8 shadow-sm max-w-sm mx-auto">
                  <div className="flex items-center gap-4 mb-4">
                    {sitterPhoto ? (
                      <img src={sitterPhoto} alt={sitterName} className="w-16 h-16 rounded-full object-cover shadow-sm border-2 border-white" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-[#E8DDD4] flex items-center justify-center text-xl font-bold text-[#8B7E7D]">
                        {sitterName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-lg text-[#4A3E3D] leading-tight">{sitterName}</h3>
                      <p className="text-[#8B7E7D] text-sm flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/></svg>
                        {sitterCity}, {sitterZip}
                      </p>
                    </div>
                  </div>
                  <p className="text-[#555555] text-sm mb-4 line-clamp-3">{sitterBio}</p>
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-[#8B5E3C] bg-white px-3 py-1 rounded-lg border border-[#E8DDD4]">
                      {sitterPetTypes === 'both' ? 'Dogs & Cats' : sitterPetTypes === 'dog' ? 'Dogs Only' : 'Cats Only'}
                    </div>
                    <div className="text-lg font-black text-[#4A3E3D]">
                      ${sitterRate}<span className="text-sm font-medium text-[#8B7E7D]">/night</span>
                    </div>
                  </div>
                </div>

                {profileMessage && <div className="text-red-600 text-sm font-bold mb-4">{profileMessage}</div>}

                <button onClick={handleStripeCheckout} disabled={profileLoading} className="w-full max-w-sm bg-gradient-to-r from-[#FFB703] to-[#FB8500] hover:from-[#F5A623] hover:to-[#E67E22] text-white font-black py-4 rounded-xl transition-all shadow-md mx-auto flex justify-center items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  {profileLoading ? 'Redirecting...' : 'Go Live for $9.99/mo'}
                </button>
                <button onClick={() => setProfilePreviewMode(false)} className="mt-6 text-[#8B7E7D] text-sm font-semibold hover:text-[#8B5E3C]">
                  &larr; Back to edit profile
                </button>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-black text-[#4A3E3D] mb-2">Join Lumo Sitters</h2>
                  <p className="text-[#8B7E7D]">Create your profile to start receiving pet sitting requests in your neighborhood.</p>
                </div>

            {!isProSitter && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 items-start animate-fade-in">
                <span className="text-xl">⚠️</span>
                <div>
                  <h4 className="font-bold text-red-800 text-sm">Profile Inactive & Hidden</h4>
                  <p className="text-red-700 text-xs mt-1">Your sitter profile is hidden from search results. Enter your email below to update your profile and subscribe for $9.99/mo to go live.</p>
                </div>
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-6" noValidate>
              <div>
                <label className="block text-sm font-bold text-[#4A3E3D] mb-2">Account Email</label>
                <input required type="email" value={sitterEmail} onChange={e => {setSitterEmail(e.target.value); loadSitterProfile(e.target.value);}} className={`w-full bg-[#FAF6F4] border ${formErrors.includes('email') ? 'border-red-500 bg-red-50' : 'border-[#E8DDD4]'} rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]`} placeholder="your@email.com" />
              </div>

              {profileLoading && <div className="text-sm text-[#8B5E3C]">Loading existing profile...</div>}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-[#4A3E3D] mb-2">Full Name</label>
                  <input required type="text" value={sitterName} onChange={e => setSitterName(e.target.value)} className={`w-full bg-[#FAF6F4] border ${formErrors.includes('name') ? 'border-red-500 bg-red-50' : 'border-[#E8DDD4]'} rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]`} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#4A3E3D] mb-2">Profile Photo</label>
                  <div className={`flex items-center gap-4 p-2 rounded-xl ${formErrors.includes('photo') ? 'border border-red-500 bg-red-50' : ''}`}>
                    {sitterPhoto ? (
                      <img src={sitterPhoto} alt="Profile" className="w-16 h-16 rounded-full object-cover border-2 border-[#E8DDD4]" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-[#E8DDD4] flex items-center justify-center text-gray-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </div>
                    )}
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setSitterPhoto(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }} 
                      className={`flex-1 block w-full text-sm ${formErrors.includes('photo') ? 'text-red-500' : 'text-[#666666]'} file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-[#FAF6F4] file:text-[#8B5E3C] hover:file:bg-[#F0E6DD] transition-colors cursor-pointer focus:outline-none`} 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#4A3E3D] mb-2">City</label>
                  <input required type="text" value={sitterCity} onChange={e => setSitterCity(e.target.value)} className={`w-full bg-[#FAF6F4] border ${formErrors.includes('city') ? 'border-red-500 bg-red-50' : 'border-[#E8DDD4]'} rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]`} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#4A3E3D] mb-2">Zip Code</label>
                  <input required type="text" value={sitterZip} onChange={e => setSitterZip(e.target.value)} className={`w-full bg-[#FAF6F4] border ${formErrors.includes('zip') ? 'border-red-500 bg-red-50' : 'border-[#E8DDD4]'} rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]`} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#4A3E3D] mb-2">Country</label>
                  <select value={sitterCountry} onChange={e => setSitterCountry(e.target.value)} className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]">
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Australia">Australia</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#4A3E3D] mb-2">Pets Accepted</label>
                  <select value={sitterPetTypes} onChange={e => setSitterPetTypes(e.target.value)} className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]">
                    <option value="both">Dogs & Cats</option>
                    <option value="dog">Dogs Only</option>
                    <option value="cat">Cats Only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#4A3E3D] mb-2">Rate per night ($)</label>
                  <input required type="number" min="0" value={sitterRate} onChange={e => setSitterRate(e.target.value)} className={`w-full bg-[#FAF6F4] border ${formErrors.includes('rate') ? 'border-red-500 bg-red-50' : 'border-[#E8DDD4]'} rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]`} placeholder="25" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-[#4A3E3D] mb-2">About You (Bio)</label>
                <textarea required rows={4} value={sitterBio} onChange={e => setSitterBio(e.target.value)} className={`w-full bg-[#FAF6F4] border ${formErrors.includes('bio') ? 'border-red-500 bg-red-50' : 'border-[#E8DDD4]'} rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]`} placeholder="Tell pet owners about your experience..."></textarea>
              </div>

              <div className="flex items-center gap-3 bg-[#FAF6F4] p-4 rounded-xl border border-[#E8DDD4]">
                <input type="checkbox" id="avail" checked={sitterAvailable} onChange={e => setSitterAvailable(e.target.checked)} className="w-5 h-5 accent-[#8B5E3C]" />
                <label htmlFor="avail" className="text-[#4A3E3D] font-bold cursor-pointer">I am currently accepting new requests</label>
              </div>

              {profileMessage && (
                <div className="p-4 rounded-xl bg-blue-50 text-blue-800 text-sm font-bold text-center">
                  {profileMessage}
                </div>
              )}

              {isProSitter ? (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
                  <span className="text-3xl mb-2 block">✨</span>
                  <h3 className="text-green-800 font-bold text-lg mb-1">Lumo Sitter Pro Active</h3>
                  <p className="text-green-700 text-sm mb-4">Your profile is visible in search results.</p>
                  <button type="submit" disabled={profileSaving} className={`bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition ${!isFormValid ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:bg-green-800'}`}>
                    {profileSaving ? 'Saving...' : 'Update Profile'}
                  </button>
                </div>
              ) : (
                <button type="submit" disabled={profileSaving} className={`w-full text-white font-black py-4 rounded-xl transition-all shadow-md ${!isFormValid ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#8B5E3C] hover:bg-[#7A5234]'}`}>
                  {profileSaving ? 'Saving...' : 'Save Profile'}
                </button>
              )}
            </form>
          </>
          )}
          </div>
        )}

      </main>

      {/* REQUEST MODAL */}
      {requestModalOpen && selectedSitter && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative animate-fade-in">
            <button onClick={() => setRequestModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            
            <h3 className="text-2xl font-black text-[#4A3E3D] mb-2">Request {selectedSitter.name}</h3>
            <p className="text-[#8B7E7D] text-sm mb-6">The sitter will reply to you directly via email to coordinate details.</p>

            {reqSuccess ? (
              <div className="text-center py-8">
                <span className="text-5xl mb-4 block">🎉</span>
                <h4 className="text-xl font-bold text-green-600 mb-2">Request Sent!</h4>
                <p className="text-gray-600">Keep an eye on your email inbox for a reply from {selectedSitter.name}.</p>
              </div>
            ) : (
              <form onSubmit={submitRequest} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#4A3E3D] mb-1">Your Email</label>
                  <input required type="email" value={reqEmail} onChange={e => setReqEmail(e.target.value)} className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-lg px-3 py-2 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#4A3E3D] mb-1">Pet Name</label>
                    <input required type="text" value={reqPetName} onChange={e => setReqPetName(e.target.value)} className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-lg px-3 py-2 text-[#4A3E3D]" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#4A3E3D] mb-1">Pet Type</label>
                    <select value={reqPetType} onChange={e => setReqPetType(e.target.value)} className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-lg px-3 py-2 text-[#4A3E3D]">
                      <option value="dog">Dog</option>
                      <option value="cat">Cat</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#4A3E3D] mb-1">Dates Needed</label>
                  <input required type="text" placeholder="e.g. Oct 12 - Oct 15" value={reqDates} onChange={e => setReqDates(e.target.value)} className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-lg px-3 py-2 text-[#4A3E3D]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#4A3E3D] mb-1">Special Notes (Optional)</label>
                  <textarea rows={3} value={reqNotes} onChange={e => setReqNotes(e.target.value)} className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-lg px-3 py-2 text-[#4A3E3D]"></textarea>
                </div>

                {reqError && reqError !== 'requires_pro' && <div className="text-red-600 text-sm font-bold mt-2">{reqError}</div>}

                {reqError === 'requires_pro' ? (
                  <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2D2D2D] rounded-xl p-5 text-center shadow-md mt-6">
                    <h3 className="text-[#E8D5C0] font-black mb-1">Lumo Bites Pro Required</h3>
                    <p className="text-gray-300 text-xs mb-4">You need an active $2.99/mo PRO membership to contact sitters.</p>
                    <button type="button" onClick={handleOwnerStripeCheckout} disabled={reqLoading} className="w-full bg-gradient-to-r from-[#FFB703] to-[#FB8500] hover:from-[#F5A623] hover:to-[#E67E22] text-white font-black py-3 rounded-lg transition-all shadow-sm">
                      {reqLoading ? 'Redirecting...' : 'Upgrade to PRO for $2.99/mo'}
                    </button>
                  </div>
                ) : (
                  <>
                    <button disabled={reqLoading} type="submit" className="w-full bg-[#8B5E3C] hover:bg-[#7A5234] text-white font-bold py-3 rounded-xl transition-colors mt-6 shadow-sm">
                      {reqLoading ? 'Sending...' : 'Send Request'}
                    </button>
                    <p className="text-[10px] text-center text-gray-400 mt-3">Active Lumo Bites PRO membership ($2.99/mo) required to contact sitters.</p>
                  </>
                )}
              </form>
            )}
          </div>
        </div>
      )}

      {/* UNLOCK MODAL */}
      {unlockModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative animate-fade-in">
            <button onClick={() => setUnlockModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            
            <h3 className="text-2xl font-black text-[#4A3E3D] mb-2 text-center">Unlock Profiles</h3>
            <p className="text-[#8B7E7D] text-sm mb-6 text-center">Enter your email to verify your Lumo Bites PRO membership ($2.99/mo).</p>

            <form onSubmit={handleUnlockProfile} className="space-y-4">
              <div>
                <input required type="email" placeholder="your@email.com" value={unlockEmail} onChange={e => setUnlockEmail(e.target.value)} className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C] text-center" />
              </div>

              {reqError && <div className="text-red-600 text-sm font-bold text-center mt-2">{reqError}</div>}

              <button disabled={unlockLoading} type="submit" className="w-full bg-gradient-to-r from-[#FFB703] to-[#FB8500] hover:from-[#F5A623] hover:to-[#E67E22] text-white font-black py-4 rounded-xl transition-all shadow-md mt-4">
                {unlockLoading ? 'Verifying...' : 'Unlock Profiles'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
