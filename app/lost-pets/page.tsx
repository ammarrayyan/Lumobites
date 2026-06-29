'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import LostPetsMap from '@/components/LostPetsMap';
import { Megaphone, Footprints, MapPin, Check, RefreshCw, Loader2, LayoutList, Search, Camera, AlertTriangle, Sparkles, PenLine, PawPrint } from 'lucide-react';

export default function LostPetsFeed() {
  // ── Page Tab ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'board' | 'ai'>('board');

  // ── Tab 1: Lost & Found Board ─────────────────────────────────────────────
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const skipGeocodeRef = useRef(false);
  const [searchRadius, setSearchRadius] = useState('25');
  const [filterType, setFilterType] = useState('all');
  const [filterSpecies, setFilterSpecies] = useState('all');
  const [searchCoords, setSearchCoords] = useState<{lat: number, lng: number} | null>(null);
  const [searchLocationName, setSearchLocationName] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationVerified, setLocationVerified] = useState(false);

  // Refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDownY, setPullDownY] = useState(0);
  const isPullingRef = useRef(false);
  const pullStartYRef = useRef(0);

  const currentContextRef = useRef({ filterType, filterSpecies, searchQuery, searchCoords, searchRadius });
  currentContextRef.current = { filterType, filterSpecies, searchQuery, searchCoords, searchRadius };

  // ── Tab 2: AI Pet Search ──────────────────────────────────────────────────
  const [aiSearchTab, setAiSearchTab] = useState<'photo' | 'text'>('photo');
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [petDescription, setPetDescription] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiLoadingStep, setAiLoadingStep] = useState('');
  const [aiMatches, setAiMatches] = useState<any[]>([]);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSearchDone, setAiSearchDone] = useState(false);

  const [aiRadius, setAiRadius] = useState('any');
  const [aiTimeframe, setAiTimeframe] = useState('any');
  const [aiSpecies, setAiSpecies] = useState('all');
  const [aiMinScore, setAiMinScore] = useState(30);

  // Separate location state for AI tab
  const [aiSearchCoords, setAiSearchCoords] = useState<{lat: number, lng: number} | null>(null);
  const [aiLocationName, setAiLocationName] = useState('');
  const [aiLocationVerified, setAiLocationVerified] = useState(false);
  const [isDetectingAiLocation, setIsDetectingAiLocation] = useState(false);

  // ── Tab 1: Geocode on searchQuery change ──────────────────────────────────
  useEffect(() => {
    if (skipGeocodeRef.current) {
      skipGeocodeRef.current = false;
      return;
    }

    if (!searchQuery.trim()) {
      setSearchCoords(null);
      setLocationVerified(false);
      return;
    }

    const geocode = async () => {
      setIsGeocoding(true);
      setLocationVerified(false);
      try {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey) return;
        const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(searchQuery)}&key=${apiKey}`);
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          const lat = data.results[0].geometry.location.lat;
          const lng = data.results[0].geometry.location.lng;
          setSearchCoords({ lat, lng });
          setSearchLocationName(data.results[0].formatted_address);
          setLocationVerified(true);
        } else {
          setSearchCoords(null);
          setSearchLocationName('');
        }
      } catch (err) {
        setSearchCoords(null);
        setSearchLocationName('');
      } finally {
        setIsGeocoding(false);
      }
    };

    const delay = setTimeout(geocode, 600);
    return () => clearTimeout(delay);
  }, [searchQuery]);

  // ── Tab 1: Use My Location ────────────────────────────────────────────────
  const handleUseMyLocation = async () => {
    try {
      setIsDetectingLocation(true);
      setIsGeocoding(true);
      setLocationVerified(false);

      if (Capacitor.isNativePlatform()) {
        const permission = await Geolocation.requestPermissions();
        if (permission.location !== 'granted') {
          alert('Location permission is required to use this feature. Please enable it in your device settings.');
          setIsGeocoding(false);
          setIsDetectingLocation(false);
          return;
        }
      }

      const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 });
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      try {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey) return;
        const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`);
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          const locationName = data.results[0].formatted_address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
          skipGeocodeRef.current = true;
          setSearchQuery(locationName);
          setSearchCoords({ lat, lng });
          setSearchLocationName(locationName);
          setLocationVerified(true);
        } else {
          alert('Could not determine your location name.');
        }
      } catch (e) {
        console.error('Reverse geocoding error:', e);
        alert('Failed to parse your location name.');
      }
    } catch (error: any) {
      console.error('Geolocation error:', error);
      alert('Unable to get your location. Please enter your city manually.');
      document.getElementById('locationSearchInput')?.focus();
    } finally {
      setIsGeocoding(false);
      setIsDetectingLocation(false);
    }
  };

  // ── Tab 2: Use My Location (AI-only, separate state) ─────────────────────
  const handleUseMyLocationAI = async () => {
    try {
      setIsDetectingAiLocation(true);

      if (Capacitor.isNativePlatform()) {
        const permission = await Geolocation.requestPermissions();
        if (permission.location !== 'granted') {
          alert('Location permission is required. Please enable it in your device settings.');
          setIsDetectingAiLocation(false);
          return;
        }
      }

      const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 });
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      try {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          setAiSearchCoords({ lat, lng });
          setAiLocationName(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          setAiLocationVerified(true);
          return;
        }
        const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`);
        const data = await res.json();
        const locationName = data.results?.[0]?.formatted_address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        setAiSearchCoords({ lat, lng });
        setAiLocationName(locationName);
        setAiLocationVerified(true);
      } catch (e) {
        setAiSearchCoords({ lat, lng });
        setAiLocationName(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        setAiLocationVerified(true);
      }
    } catch (error: any) {
      console.error('AI geolocation error:', error);
      alert('Unable to get your location.');
    } finally {
      setIsDetectingAiLocation(false);
    }
  };

  // ── Tab 2: Photo upload ───────────────────────────────────────────────────
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => { setUploadedPhoto(reader.result as string); };
    reader.readAsDataURL(file);
  };

  // ── Tab 2: AI Match Search ────────────────────────────────────────────────
  const handleAIMatchSearch = async () => {
    if (aiSearchTab === 'photo' && !uploadedPhoto) {
      alert('Please upload a photo first.');
      return;
    }
    if (aiSearchTab === 'text' && !petDescription.trim()) {
      alert('Please enter a description of your pet.');
      return;
    }

    setAiLoading(true);
    setAiError(null);
    setAiSearchDone(false);
    setAiLoadingStep(aiSearchTab === 'photo' ? 'AI is analyzing photo...' : 'AI is analyzing description...');

    try {
      const payload: any = {
        radius: aiSearchCoords ? aiRadius : 'any',
        timeframe: aiTimeframe,
        species: aiSpecies,
        minMatchScore: aiMinScore
      };

      if (aiSearchTab === 'photo') {
        payload.photo = uploadedPhoto;
      } else {
        payload.description = petDescription;
      }

      if (aiSearchCoords) {
        payload.lat = aiSearchCoords.lat;
        payload.lng = aiSearchCoords.lng;
      }

      setAiLoadingStep('Scanning & matching database...');

      const res = await fetch('/api/lost-pets/search-by-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to search for matches.');

      setAiMatches(data.matches || []);
      setAiSearchDone(true);
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'An error occurred during search.');
    } finally {
      setAiLoading(false);
    }
  };

  // ── Tab 1: Fetch pets from DB ─────────────────────────────────────────────
  const fetchPets = useCallback(async (showRefreshIndicator = false) => {
    if (isGeocoding) return;
    if (showRefreshIndicator) setIsRefreshing(true);
    else setLoading(true);

    const ctx = currentContextRef.current;
    try {
      const params = new URLSearchParams();
      if (ctx.filterType !== 'all') params.append('type', ctx.filterType);
      if (ctx.filterSpecies !== 'all') params.append('species', ctx.filterSpecies);

      if (ctx.searchQuery) {
        if (ctx.searchCoords) {
          params.append('lat', ctx.searchCoords.lat.toString());
          params.append('lng', ctx.searchCoords.lng.toString());
          if (ctx.searchRadius !== 'any') params.append('radius', ctx.searchRadius);
        } else {
          params.append('q', ctx.searchQuery);
        }
      }

      const res = await fetch(`/api/lost-pets?${params.toString()}`);
      const data = await res.json();
      if (res.ok) setPets(data.pets || []);
    } catch (err) {
      console.error(err);
    } finally {
      if (showRefreshIndicator) setIsRefreshing(false);
      else setLoading(false);
    }
  }, [isGeocoding]);

  useEffect(() => { fetchPets(false); }, [searchQuery, searchCoords, searchRadius, filterType, filterSpecies, isGeocoding, fetchPets]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') fetchPets(false);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchPets]);

  // Pull-to-refresh
  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) { isPullingRef.current = true; pullStartYRef.current = e.touches[0].clientY; }
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPullingRef.current) return;
    const delta = e.touches[0].clientY - pullStartYRef.current;
    if (delta > 0 && window.scrollY === 0) setPullDownY(Math.min(delta * 0.4, 80));
    else { isPullingRef.current = false; setPullDownY(0); }
  };
  const handleTouchEnd = () => {
    if (pullDownY > 60 && !isRefreshing) fetchPets(true).finally(() => setPullDownY(0));
    else setPullDownY(0);
    isPullingRef.current = false;
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FDFAF7] font-sans flex flex-col relative">
      
      <div
        className="flex-1 flex flex-col w-full relative pt-2 md:pt-20"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ transform: `translateY(${pullDownY}px)`, transition: isPullingRef.current ? 'none' : 'transform 0.3s ease-out' }}
      >
        {(pullDownY > 0 || isRefreshing) && (
          <div className="absolute top-0 left-0 w-full flex justify-center pt-8 z-50 animate-fade-in" style={{ transform: isRefreshing ? 'none' : `translateY(${pullDownY}px)` }}>
            <div className="bg-white rounded-full shadow-md py-2.5 px-4 flex items-center justify-center gap-2 border border-[#E8DDD4] text-[#8B5E3C] font-bold text-xs">
              {isRefreshing ? (
                <><Loader2 className="w-4 h-4 text-[#8B5E3C] animate-spin" /><span>Refreshing...</span></>
              ) : (
                <RefreshCw className="w-4 h-4 text-[#8B5E3C]" style={{ transform: `rotate(${pullDownY * 3}deg)` }} />
              )}
            </div>
          </div>
        )}

        <main className="max-w-6xl mx-auto px-4 py-8 md:py-12 w-full">

          {/* ── Page Header ── */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
            <div className="text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-black text-[#4A3E3D] mb-3">Community Pet Board</h1>
              <p className="text-[#8B5E3C] font-medium text-lg">Help reunite lost pets with their families in your neighborhood.</p>
            </div>
            <Link href="/lost-pets/post" className="bg-[#8B5E3C] hover:bg-[#7A5234] text-white font-bold py-4 px-8 rounded-full transition-transform transform hover:scale-105 shadow-md flex items-center gap-2 flex-shrink-0">
              <Megaphone className="w-5 h-5" /> Report Lost/Found Pet
            </Link>
          </div>

          {/* ── Tab Switcher ── */}
          <div className="flex gap-2 mb-8 bg-white border border-[#E8DDD4] rounded-2xl p-1.5 shadow-sm w-full max-w-md">
            <button
              type="button"
              onClick={() => setActiveTab('board')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 ${
                activeTab === 'board'
                  ? 'bg-[#8B5E3C] text-white shadow-md'
                  : 'text-[#8B7E7D] hover:text-[#4A3E3D] hover:bg-[#FAF6F4]'
              }`}
            >
              <PawPrint className="w-4 h-4" />
              <span>Lost &amp; Found Board</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ai')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 ${
                activeTab === 'ai'
                  ? 'bg-[#8B5E3C] text-white shadow-md'
                  : 'text-[#8B7E7D] hover:text-[#4A3E3D] hover:bg-[#FAF6F4]'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>AI Pet Search</span>
            </button>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              TAB 1 — Lost & Found Board
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'board' && (
            <>
              {/* Filter Bar */}
              <div className="flex flex-col md:flex-row gap-4 bg-white border border-[#E8DDD4] rounded-2xl p-4 shadow-sm mb-8">
                <div className="flex-1 flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      id="locationSearchInput"
                      type="text"
                      placeholder="Search by city or zip code..."
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setLocationVerified(false); }}
                      className={`w-full bg-[#FAF6F4] border ${locationVerified ? 'border-green-500' : 'border-[#E8DDD4]'} rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C] pr-12`}
                    />
                    {isGeocoding && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-[#8B5E3C] border-t-transparent rounded-full animate-spin" />
                    )}
                    {locationVerified && !isGeocoding && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                      </div>
                    )}
                    {locationVerified && !isGeocoding && searchCoords && (
                      <p className="mt-2 text-sm font-bold text-green-600 flex items-center gap-1 absolute -bottom-6 left-1">
                        <Check className="w-4 h-4 text-green-600 stroke-[3]" /> {searchLocationName}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handleUseMyLocation}
                    type="button"
                    disabled={isDetectingLocation}
                    className={`bg-[#FAF6F4] hover:bg-[#E8DDD4] border border-[#E8DDD4] rounded-xl px-4 py-3 text-[#8B5E3C] font-semibold flex items-center gap-2 transition duration-200 shrink-0 ${isDetectingLocation ? 'opacity-70 cursor-not-allowed' : ''}`}
                    title="Use my current location"
                  >
                    {isDetectingLocation ? (
                      <><RefreshCw className="w-4 h-4 animate-spin text-[#8B5E3C]" /><span className="hidden sm:inline">Detecting location...</span></>
                    ) : (
                      <><MapPin className="w-4 h-4" /><span className="hidden sm:inline">Use My Location</span></>
                    )}
                  </button>
                </div>
                <select value={searchRadius} onChange={(e) => setSearchRadius(e.target.value)} className={`bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C] font-semibold ${!searchCoords && searchQuery ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={!searchCoords && !!searchQuery}>
                  <option value="10">Within 10 miles</option>
                  <option value="25">Within 25 miles</option>
                  <option value="50">Within 50 miles</option>
                  <option value="100">Within 100 miles</option>
                </select>
                <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C] font-semibold">
                  <option value="all">All Types</option>
                  <option value="lost">Lost Pets</option>
                  <option value="found">Found Pets</option>
                </select>
                <select value={filterSpecies} onChange={(e) => setFilterSpecies(e.target.value)} className="bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C] font-semibold">
                  <option value="all">All Species</option>
                  <option value="dog">Dogs</option>
                  <option value="cat">Cats</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Pet Results */}
              <div>
                {loading ? (
                  <div className="text-center py-20 text-[#8B5E3C] font-bold text-lg animate-pulse">Loading pets...</div>
                ) : pets.length === 0 ? (
                  <div className="text-center bg-white p-16 rounded-3xl border border-[#E8DDD4] shadow-sm">
                    <Footprints className="w-12 h-12 text-[#8B5E3C] mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-[#4A3E3D] mb-2">
                      {searchCoords && searchRadius !== 'any' ? `No pets found within ${searchRadius} miles of this location` : 'No pets found'}
                    </h3>
                    <p className="text-[#8B7E7D]">Try expanding your search distance or adjusting filters.</p>
                  </div>
                ) : (
                  <div className="flex flex-col lg:flex-row gap-8 items-start">
                    {/* Pets Grid */}
                    <div className="flex-1 order-2 lg:order-1 w-full">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {pets.map((pet) => (
                          <div key={pet.id} className="bg-white rounded-3xl overflow-hidden border border-[#E8DDD4] shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 flex flex-col">
                            <div className="relative h-64 bg-[#FAF6F4] flex items-center justify-center overflow-hidden border-b border-[#E8DDD4]">
                              {pet.photo_url ? (
                                <img src={pet.photo_url} alt={pet.pet_name} className="w-full h-full object-contain" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">No Photo</div>
                              )}
                              <div className="absolute top-4 left-4 flex flex-col gap-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase shadow-md ${
                                  pet.status === 'resolved' ? 'bg-green-500 text-white' :
                                  pet.type === 'lost' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
                                }`}>
                                  {pet.status === 'resolved' ? <span className="flex items-center gap-1"><Check className="w-3 h-3" />Resolved</span> : pet.type}
                                </span>
                              </div>
                            </div>
                            <div className="p-6 flex flex-col flex-1">
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="text-2xl font-black text-[#4A3E3D] truncate pr-2">{pet.pet_name || 'Unknown Pet'}</h3>
                                <span className="text-xs font-bold text-[#8B5E3C] bg-[#FAF6F4] px-2 py-1 rounded-lg capitalize">{pet.species}</span>
                              </div>
                              <p className="text-sm font-semibold text-[#8B7E7D] mb-4 flex flex-col gap-1.5">
                                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-gray-400" /> {pet.city} {pet.zip_code && `, ${pet.zip_code}`}</span>
                                {pet.distance !== undefined && pet.distance !== null && (
                                  <span className="inline-flex w-fit text-[#8B5E3C] font-black text-[11px] bg-[#F5EDE4] px-2 py-1 rounded-md uppercase tracking-wide">
                                    {pet.distance < 0.1 ? 'Less than 0.1 miles away' : `${pet.distance.toFixed(1)} miles away`}
                                  </span>
                                )}
                              </p>
                              <p className="text-[#555555] text-sm mb-6 line-clamp-3 flex-1">{pet.description}</p>
                              <div className="border-t border-[#E8DDD4] pt-4 mt-auto">
                                <div className="flex justify-between items-center mb-4">
                                  <span className="text-xs font-semibold text-[#8B7E7D]">
                                    {pet.type === 'lost' ? 'Lost on:' : 'Found on:'} {new Date(pet.date_lost_found).toLocaleDateString()}
                                  </span>
                                  <span className="text-xs text-[#8B7E7D]">Posted {formatDistanceToNow(new Date(pet.created_at))} ago</span>
                                </div>
                                <Link href={`/lost-pets/${pet.id}`} className="block w-full text-center bg-[#FAF6F4] hover:bg-[#F0E6DD] border border-[#E8DDD4] text-[#8B5E3C] font-bold py-3 rounded-xl transition-colors">
                                  View Details &amp; Help
                                </Link>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Interactive Map */}
                    <div className="w-full lg:w-[45%] lg:sticky lg:top-24 h-[400px] lg:h-[calc(100vh-140px)] order-1 lg:order-2 rounded-3xl overflow-hidden shadow-sm border border-[#E8DDD4]">
                      <LostPetsMap pets={pets} searchCoords={searchCoords} searchRadius={searchRadius} />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB 2 — AI Pet Search
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'ai' && (
            <div className="space-y-6">
              {/* AI Panel Card */}
              <div className="bg-white border border-[#E8DDD4] rounded-3xl p-6 shadow-sm animate-fade-in text-left">
                <div className="flex items-center gap-2.5 mb-5">
                  <Search className="w-6 h-6 text-[#8B5E3C]" />
                  <div>
                    <h3 className="text-xl font-black text-[#4A3E3D]">AI Pet Matching</h3>
                    <p className="text-xs text-[#8B7E7D] mt-0.5">
                      Upload a photo or describe your lost pet → AI searches all found pet reports for matches
                    </p>
                  </div>
                </div>

                {/* Photo / Text tabs */}
                <div className="flex gap-4 border-b border-[#E8DDD4] mb-6">
                  <button type="button" onClick={() => setAiSearchTab('photo')} className={`pb-2 font-bold text-sm transition-colors border-b-2 flex items-center gap-1.5 ${aiSearchTab === 'photo' ? 'border-[#8B5E3C] text-[#8B5E3C]' : 'border-transparent text-[#8B7E7D] hover:text-[#4A3E3D]'}`}>
                    <Camera className="w-3.5 h-3.5" /> Search by Photo
                  </button>
                  <button type="button" onClick={() => setAiSearchTab('text')} className={`pb-2 font-bold text-sm transition-colors border-b-2 flex items-center gap-1.5 ${aiSearchTab === 'text' ? 'border-[#8B5E3C] text-[#8B5E3C]' : 'border-transparent text-[#8B7E7D] hover:text-[#4A3E3D]'}`}>
                    <PenLine className="w-3.5 h-3.5" /> Describe Pet instead
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Input column */}
                  <div className="md:col-span-2 space-y-4">
                    {aiSearchTab === 'photo' ? (
                      <div className="flex flex-col items-center justify-center border-2 border-dashed border-[#E8DDD4] rounded-2xl p-6 bg-[#FAF6F4] relative hover:bg-[#F3EAE3] transition-colors">
                        {uploadedPhoto ? (
                          <div className="flex flex-col items-center gap-3">
                            <img src={uploadedPhoto} alt="Uploaded pet preview" className="max-h-48 object-contain rounded-xl shadow-sm" />
                            <button type="button" onClick={() => setUploadedPhoto(null)} className="text-xs font-bold text-red-600 hover:underline">Remove Photo</button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center gap-2 cursor-pointer w-full h-full py-6">
                            <Camera className="w-10 h-10 text-[#8B5E3C]" />
                            <span className="text-sm font-bold text-[#8B5E3C]">Upload Photo</span>
                            <span className="text-xs text-[#8B7E7D]">JPEG or PNG image of your pet</span>
                            <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                          </label>
                        )}
                      </div>
                    ) : (
                      <textarea
                        value={petDescription}
                        onChange={(e) => setPetDescription(e.target.value)}
                        placeholder="Describe your pet (e.g. golden retriever, wearing a red collar, white spot on chest, friendly...)"
                        className="w-full h-40 bg-[#FAF6F4] border border-[#E8DDD4] rounded-2xl p-4 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C] text-sm resize-none"
                      />
                    )}

                    {/* Location for radius search */}
                    <div>
                      <label className="text-[11px] font-black text-[#4A3E3D] uppercase tracking-wider block mb-2">Search Location (for radius filter)</label>
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <div className={`w-full bg-[#FAF6F4] border ${aiLocationVerified ? 'border-green-500' : 'border-[#E8DDD4]'} rounded-xl px-4 py-3 text-sm text-[#4A3E3D]`}>
                            {aiLocationVerified ? (
                              <span className="flex items-center gap-2 font-semibold">
                                <Check className="w-4 h-4 text-green-600 stroke-[3]" />
                                <span className="truncate text-green-700">{aiLocationName}</span>
                              </span>
                            ) : (
                              <span className="text-[#8B7E7D]">No location set — distance filter disabled</span>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleUseMyLocationAI}
                          disabled={isDetectingAiLocation}
                          className={`bg-[#FAF6F4] hover:bg-[#E8DDD4] border border-[#E8DDD4] rounded-xl px-4 py-3 text-[#8B5E3C] font-semibold flex items-center gap-2 transition duration-200 shrink-0 ${isDetectingAiLocation ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                          {isDetectingAiLocation ? (
                            <><RefreshCw className="w-4 h-4 animate-spin text-[#8B5E3C]" /><span className="hidden sm:inline text-sm">Detecting...</span></>
                          ) : (
                            <><MapPin className="w-4 h-4" /><span className="hidden sm:inline text-sm">Use My Location</span></>
                          )}
                        </button>
                        {aiLocationVerified && (
                          <button type="button" onClick={() => { setAiSearchCoords(null); setAiLocationName(''); setAiLocationVerified(false); }} className="text-xs font-bold text-red-500 hover:underline px-2">Clear</button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Filters column */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-[#4A3E3D] uppercase tracking-wider">AI Search Options</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-[11px] font-bold text-[#8B7E7D] block mb-1">Search Distance</label>
                        <select value={aiRadius} onChange={(e) => setAiRadius(e.target.value)} disabled={!aiLocationVerified} className={`w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-3 py-2 text-xs text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C] ${!aiLocationVerified ? 'opacity-50 cursor-not-allowed' : ''}`}>
                          <option value="5">Within 5 miles</option>
                          <option value="10">Within 10 miles</option>
                          <option value="25">Within 25 miles</option>
                          <option value="50">Within 50 miles</option>
                          <option value="any">Any distance</option>
                        </select>
                        {!aiLocationVerified && <p className="text-[10px] text-[#8B7E7D] mt-1">Set location above to enable</p>}
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-[#8B7E7D] block mb-1">Found Within</label>
                        <select value={aiTimeframe} onChange={(e) => setAiTimeframe(e.target.value)} className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-3 py-2 text-xs text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]">
                          <option value="today">Today</option>
                          <option value="3days">Last 3 days</option>
                          <option value="week">Last week</option>
                          <option value="month">Last month</option>
                          <option value="any">Any time</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-[#8B7E7D] block mb-1">Species</label>
                        <select value={aiSpecies} onChange={(e) => setAiSpecies(e.target.value)} className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-3 py-2 text-xs text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]">
                          <option value="all">All Species</option>
                          <option value="dog">Dogs</option>
                          <option value="cat">Cats</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-[#8B7E7D] block mb-1">Min Match Score</label>
                        <select value={aiMinScore} onChange={(e) => setAiMinScore(parseInt(e.target.value))} className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-3 py-2 text-xs text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]">
                          <option value="10">Any match (10%+)</option>
                          <option value="30">Fair match (30%+)</option>
                          <option value="50">Good match (50%+)</option>
                          <option value="70">Strong match (70%+)</option>
                          <option value="85">Excellent match (85%+)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action row */}
                <div className="mt-6 pt-4 border-t border-[#E8DDD4] flex flex-col sm:flex-row items-center justify-between gap-4">
                  {aiError && <span className="text-xs font-bold text-red-600 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> {aiError}</span>}
                  {!aiError && (
                    <span className="text-xs text-[#8B7E7D]">
                      {aiSearchTab === 'photo'
                        ? 'Note: Max size 5MB. AI will analyze the picture characteristics.'
                        : 'Note: Provide details like collar color, special markings, eye color, etc.'}
                    </span>
                  )}
                  {aiLoading ? (
                    <div className="flex items-center gap-2 bg-[#8B5E3C] text-white py-3 px-8 rounded-full font-bold text-sm shadow-md">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{aiLoadingStep}</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleAIMatchSearch}
                      className="bg-[#8B5E3C] hover:bg-[#7A5234] text-white font-bold py-3 px-8 rounded-full transition-transform transform hover:scale-105 shadow-md flex items-center gap-2 cursor-pointer text-sm"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Scan &amp; Match Pet</span>
                    </button>
                  )}
                </div>
              </div>

              {/* AI Results */}
              {aiSearchDone && !aiLoading && (
                <div>
                  {aiMatches.length === 0 ? (
                    <div className="text-center bg-white p-16 rounded-3xl border border-[#E8DDD4] shadow-sm">
                      <Footprints className="w-12 h-12 text-[#8B5E3C] mx-auto mb-4" />
                      <h3 className="text-2xl font-bold text-[#4A3E3D] mb-2">No matching found pets for your criteria</h3>
                      <p className="text-[#8B7E7D]">Try lowering the match score threshold, widening the radius, or using &quot;Any time&quot; for timeframe.</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-black text-[#4A3E3D]">
                          <Sparkles className="w-5 h-5 text-[#8B5E3C]" /> {aiMatches.length} Potential {aiMatches.length === 1 ? 'Match' : 'Matches'} Found
                        </h2>
                        <span className="text-xs text-[#8B7E7D] font-semibold">Sorted by match confidence</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {aiMatches.map((pet) => (
                          <div key={pet.id} className="bg-white rounded-3xl overflow-hidden border border-[#E8DDD4] shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 flex flex-col">
                            <div className="relative h-64 bg-[#FAF6F4] flex items-center justify-center overflow-hidden border-b border-[#E8DDD4]">
                              {pet.photo_url ? (
                                <img src={pet.photo_url} alt={pet.pet_name} className="w-full h-full object-contain" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">No Photo</div>
                              )}
                              <div className="absolute top-4 left-4 flex flex-col gap-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase shadow-md ${
                                  pet.status === 'resolved' ? 'bg-green-500 text-white' :
                                  (pet.type || pet.pet_type) === 'lost' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
                                }`}>
                                  {pet.status === 'resolved' ? <span className="flex items-center gap-1"><Check className="w-3 h-3" />Resolved</span> : (pet.type || pet.pet_type)}
                                </span>
                                {pet.score !== undefined && (
                                  <span className={`px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase shadow-md text-white ${
                                    pet.score >= 80 ? 'bg-emerald-600' : pet.score >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                                  }`}>
                                    {pet.score}% Match
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="p-6 flex flex-col flex-1">
                              {pet.matchSummary && (
                                <div className="mb-4 bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl p-3 text-xs font-bold text-[#8B5E3C]">
                                  <Sparkles className="w-3 h-3 inline mr-1" />{pet.matchSummary}
                                </div>
                              )}
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="text-2xl font-black text-[#4A3E3D] truncate pr-2">{pet.pet_name || 'Unknown Pet'}</h3>
                                <span className="text-xs font-bold text-[#8B5E3C] bg-[#FAF6F4] px-2 py-1 rounded-lg capitalize">{pet.species}</span>
                              </div>
                              <p className="text-sm font-semibold text-[#8B7E7D] mb-4 flex flex-col gap-1.5">
                                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-gray-400" /> {pet.city} {pet.zip_code && `, ${pet.zip_code}`}</span>
                                {pet.distance !== undefined && pet.distance !== null && (
                                  <span className="inline-flex w-fit text-[#8B5E3C] font-black text-[11px] bg-[#F5EDE4] px-2 py-1 rounded-md uppercase tracking-wide">
                                    {pet.distance < 0.1 ? 'Less than 0.1 miles away' : `${pet.distance.toFixed(1)} miles away`}
                                  </span>
                                )}
                              </p>
                              <p className="text-[#555555] text-sm mb-6 line-clamp-3 flex-1">{pet.description}</p>
                              <div className="border-t border-[#E8DDD4] pt-4 mt-auto">
                                <div className="flex justify-between items-center mb-4">
                                  <span className="text-xs font-semibold text-[#8B7E7D]">
                                    Found on: {new Date(pet.date_lost_found).toLocaleDateString()}
                                  </span>
                                  <span className="text-xs text-[#8B7E7D]">Posted {formatDistanceToNow(new Date(pet.created_at))} ago</span>
                                </div>
                                <Link href={`/lost-pets/${pet.id}`} className="block w-full text-center bg-[#FAF6F4] hover:bg-[#F0E6DD] border border-[#E8DDD4] text-[#8B5E3C] font-bold py-3 rounded-xl transition-colors">
                                  View Details &amp; Contact
                                </Link>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
