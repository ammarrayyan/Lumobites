'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface Sitter {
  id: string;
  name: string;
  photo_url: string;
  city: string;
  zip: string;
  bio: string;
  pet_types: string;
  rate_per_night: number;
}

export default function PetSitting() {
  const [activeTab, setActiveTab] = useState<'find' | 'become'>('find');
  
  // Find Sitter State
  const [sitters, setSitters] = useState<Sitter[]>([]);
  const [loadingSitters, setLoadingSitters] = useState(true);
  const [searchZip, setSearchZip] = useState('');
  const [searchPetType, setSearchPetType] = useState('all');
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
  const [sitterName, setSitterName] = useState('Ammar');
  const [sitterPhoto, setSitterPhoto] = useState('');
  const [sitterCity, setSitterCity] = useState('Louisville');
  const [sitterZip, setSitterZip] = useState('40202');
  const [sitterBio, setSitterBio] = useState('');
  const [sitterPetTypes, setSitterPetTypes] = useState('both');
  const [sitterRate, setSitterRate] = useState('');
  const [sitterAvailable, setSitterAvailable] = useState(true);
  const [isProSitter, setIsProSitter] = useState(false);
  
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');

  useEffect(() => {
    fetchSitters();
    
    const cachedEmail = localStorage.getItem('lumo_pro_email');
    if (cachedEmail && cachedEmail !== 'undefined') {
      setReqEmail(cachedEmail);
      setSitterEmail(cachedEmail);
      loadSitterProfile(cachedEmail);
    }
  }, []);

  const fetchSitters = async () => {
    try {
      const res = await fetch('/api/petsitting/sitters');
      if (res.ok) {
        const data = await res.json();
        setSitters(data);
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
    setProfileSaving(true);
    setProfileMessage('');

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
          bio: sitterBio,
          pet_types: sitterPetTypes,
          rate_per_night: sitterRate,
          availability: sitterAvailable
        })
      });

      if (res.ok) {
        setProfileMessage('Profile saved successfully!');
        if (!isProSitter) {
          handleStripeCheckout();
        }
      } else {
        const err = await res.json();
        setProfileMessage(err.error || 'Failed to save profile');
      }
    } catch (error) {
      setProfileMessage('An error occurred while saving.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleStripeCheckout = async () => {
    try {
      const res = await fetch('/api/stripe/checkout-sitter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: sitterEmail })
      });
      const data = await res.json();
      if (data.sessionId) {
        const stripe = await stripePromise;
        await stripe?.redirectToCheckout({ sessionId: data.sessionId });
      } else {
        setProfileMessage(data.error || 'Failed to start checkout');
      }
    } catch (error) {
      setProfileMessage('Failed to connect to payment processor.');
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

  const filteredSitters = sitters.filter(s => {
    if (searchZip && !s.zip.includes(searchZip) && !s.city.toLowerCase().includes(searchZip.toLowerCase())) return false;
    if (searchPetType !== 'all' && s.pet_types !== 'both' && s.pet_types !== searchPetType) return false;
    return true;
  });

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
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-[#E8DDD4] mb-8 flex flex-col md:flex-row gap-4">
              <input
                type="text"
                placeholder="Zip code or city..."
                className="flex-1 bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]"
                value={searchZip}
                onChange={(e) => setSearchZip(e.target.value)}
              />
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
                <h3 className="text-xl font-bold text-[#4A3E3D] mb-2">No sitters found</h3>
                <p className="text-[#8B7E7D]">Try expanding your search criteria.</p>
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
                          📍 {sitter.city}, {sitter.zip}
                        </p>
                      </div>
                    </div>

                    <p className="text-[#555555] text-sm mb-4 line-clamp-3 h-[60px]">{sitter.bio}</p>

                    <div className="flex items-center justify-between mb-6">
                      <div className="text-sm font-semibold text-[#8B5E3C] bg-[#FAF6F4] px-3 py-1 rounded-lg">
                        {sitter.pet_types === 'both' ? 'Dogs & Cats' : sitter.pet_types === 'dog' ? 'Dogs Only' : 'Cats Only'}
                      </div>
                      <div className="text-lg font-black text-[#4A3E3D]">
                        ${sitter.rate_per_night}<span className="text-sm font-medium text-[#8B7E7D]">/night</span>
                      </div>
                    </div>

                    <button
                      onClick={() => { setSelectedSitter(sitter); setRequestModalOpen(true); }}
                      className="w-full bg-[#8B5E3C] hover:bg-[#7A5234] text-white font-bold py-3 rounded-xl transition-colors"
                    >
                      Request Sitter
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* BECOME A SITTER TAB */}
        {activeTab === 'become' && (
          <div className="max-w-2xl mx-auto bg-white rounded-3xl p-8 border border-[#E8DDD4] shadow-sm animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-black text-[#4A3E3D] mb-2">Join Lumo Sitters</h2>
              <p className="text-[#8B7E7D]">Create your profile to start receiving pet sitting requests in your neighborhood.</p>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-[#4A3E3D] mb-2">Account Email</label>
                <input required type="email" value={sitterEmail} onChange={e => {setSitterEmail(e.target.value); loadSitterProfile(e.target.value);}} className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]" placeholder="your@email.com" />
              </div>

              {profileLoading && <div className="text-sm text-[#8B5E3C]">Loading existing profile...</div>}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-[#4A3E3D] mb-2">Full Name</label>
                  <input required type="text" value={sitterName} onChange={e => setSitterName(e.target.value)} className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#4A3E3D] mb-2">Profile Photo</label>
                  <div className="flex items-center gap-4">
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
                      className="flex-1 block w-full text-sm text-[#666666] file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-[#FAF6F4] file:text-[#8B5E3C] hover:file:bg-[#F0E6DD] transition-colors cursor-pointer focus:outline-none" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#4A3E3D] mb-2">City</label>
                  <input required type="text" value={sitterCity} onChange={e => setSitterCity(e.target.value)} className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#4A3E3D] mb-2">Zip Code</label>
                  <input required type="text" value={sitterZip} onChange={e => setSitterZip(e.target.value)} className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]" />
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
                  <input required type="number" min="0" value={sitterRate} onChange={e => setSitterRate(e.target.value)} className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]" placeholder="25" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-[#4A3E3D] mb-2">About You (Bio)</label>
                <textarea required rows={4} value={sitterBio} onChange={e => setSitterBio(e.target.value)} className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]" placeholder="Tell pet owners about your experience..."></textarea>
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
                  <button type="submit" disabled={profileSaving} className="bg-green-700 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-800 transition">
                    {profileSaving ? 'Saving...' : 'Update Profile'}
                  </button>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2D2D2D] rounded-2xl p-6 text-center shadow-lg mt-8">
                  <h3 className="text-[#E8D5C0] font-black text-xl mb-2">Lumo Sitter Pro</h3>
                  <p className="text-gray-300 text-sm mb-6">Sitter profiles require an active $9.99/mo subscription to appear in search results and receive requests. No hidden booking fees.</p>
                  <button type="submit" disabled={profileSaving} className="w-full bg-gradient-to-r from-[#FFB703] to-[#FB8500] hover:from-[#F5A623] hover:to-[#E67E22] text-white font-black py-4 rounded-xl transition-all shadow-md">
                    {profileSaving ? 'Saving...' : 'Save & Subscribe for $9.99/mo'}
                  </button>
                </div>
              )}
            </form>
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

    </div>
  );
}
