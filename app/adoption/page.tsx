'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, Search, Filter, Sparkles, Camera, ExternalLink, MessageSquare, Building2, PawPrint, ArrowLeft, Loader2, CheckCircle2, LayoutGrid, Map as MapIcon, Navigation, MapPin, ChevronDown, ChevronUp, Upload, Trash2, ChevronRight } from 'lucide-react';
import PetPhotoCarousel from '@/components/PetPhotoCarousel';
import AdoptionPetsMap from '@/components/AdoptionPetsMap';
import CityAutocompleteInput from '@/components/CityAutocompleteInput';
import MobileCommunityNav from '@/components/MobileCommunityNav';

interface PetListing {
  id: string;
  name: string;
  species: string;
  breed: string;
  age: string;
  size: string;
  sex: string;
  photo?: string;
  photo_urls?: string[];
  shelter_name: string;
  url?: string;
  description?: string;
  temperament?: string;
  city?: string;
  source: 'lumo_bites' | 'rescuegroups';
  tracker_image_url?: string;
  status?: string;
}

function AdoptionContent() {
  const router = useRouter();

  // Filter state
  const [species, setSpecies] = useState('all');
  const [age, setAge] = useState('all');
  const [size, setSize] = useState('all');
  const [citySearch, setCitySearch] = useState('');
  const [debouncedCitySearch, setDebouncedCitySearch] = useState('');

  // Inline Map & Location Autocomplete State
  const [showMap, setShowMap] = useState(true);
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [showCityOptions, setShowCityOptions] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Debounce citySearch by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedCitySearch(citySearch);
    }, 300);
    return () => clearTimeout(handler);
  }, [citySearch]);

  const fetchCitySuggestions = async (input: string) => {
    if (!input || input.trim().length < 2) {
      setCityOptions([]);
      return;
    }
    try {
      const res = await fetch(`/api/city-board/autocomplete?input=${encodeURIComponent(input)}`);
      if (res.ok) {
        const data = await res.json();
        const rawOptions = data.options || [];
        const stringOptions: string[] = rawOptions.map((opt: any) =>
          typeof opt === 'string'
            ? opt
            : (opt?.clean_city || opt?.formatted_address || '')
        ).filter((str: string) => str && str.trim() !== '');
        setCityOptions(stringOptions);
      }
    } catch {
      setCityOptions([]);
    }
  };

  const handleGPSDetect = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(`/api/petsitting/geocode?latlng=${pos.coords.latitude},${pos.coords.longitude}`);
          if (res.ok) {
            const data = await res.json();
            if (data.city) {
              setCitySearch(data.city);
              setDebouncedCitySearch(data.city);
              setShowCityOptions(false);
            }
          }
        } catch (e) {
          console.error('Reverse geocode error:', e);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        console.error('GPS error:', err);
        setIsLocating(false);
        alert('Could not detect location. Please type your city name manually.');
      }
    );
  };

  // Listings data
  const [localPets, setLocalPets] = useState<PetListing[]>([]);
  const [rescueGroupsPets, setRescueGroupsPets] = useState<PetListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [rescueGroupsFallbackMessage, setRescueGroupsFallbackMessage] = useState('');

  // AI Matcher Modals
  const [isLifestyleModalOpen, setIsLifestyleModalOpen] = useState(false);
  const [lifestylePrompt, setLifestylePrompt] = useState('');
  const [lifestyleMatches, setLifestyleMatches] = useState<any[]>([]);
  const [isLifestyleLoading, setIsLifestyleLoading] = useState(false);

  const [isVisualModalOpen, setIsVisualModalOpen] = useState(false);
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [visualMatches, setVisualMatches] = useState<any[]>([]);
  const [isVisualLoading, setIsVisualLoading] = useState(false);
  const [visualEmptyMessage, setVisualEmptyMessage] = useState('');

  // Shelter Registration Modal & Persistent User Shelter
  const [isShelterRegOpen, setIsShelterRegOpen] = useState(false);
  const [shelterFormData, setShelterFormData] = useState({
    org_name: '',
    tax_id: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    website: ''
  });
  const [shelterRegSuccess, setShelterRegSuccess] = useState(false);
  const [userShelter, setUserShelter] = useState<{ status: string; org_name: string } | null>(null);
  const fetchListings = async () => {
    setLoading(true);
    try {
      // 1. Fetch Lumo Bites Shelter pets
      const localParams = new URLSearchParams();
      if (species !== 'all') localParams.append('species', species);
      if (age !== 'all') localParams.append('age', age);
      if (size !== 'all') localParams.append('size', size);
      if (debouncedCitySearch) localParams.append('city', debouncedCitySearch);
      localParams.append('status', 'available');

      const localRes = await fetch(`/api/adoption/pets?${localParams.toString()}`);
      if (localRes.ok) {
        const localData = await localRes.json();
        const formatted = (localData.pets || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          species: p.species,
          breed: p.breed,
          age: p.age,
          size: p.size,
          sex: p.sex,
          photo_urls: p.photo_urls || [],
          shelter_name: p.shelters?.org_name || 'Local Rescue Partner',
          shelter_photo_url: p.shelters?.org_photo_url || '',
          description: p.description,
          temperament: p.temperament,
          city: p.city,
          source: 'lumo_bites' as const,
          status: p.status
        }));
        setLocalPets(formatted);
      }

      // 2. Fetch RescueGroups pets
      const rgParams = new URLSearchParams();
      if (species !== 'all') rgParams.append('type', species);
      if (age !== 'all') rgParams.append('age', age);
      if (size !== 'all') rgParams.append('size', size);
      if (debouncedCitySearch) rgParams.append('location', debouncedCitySearch);

      const rgRes = await fetch(`/api/rescuegroups?${rgParams.toString()}`);
      if (rgRes.ok) {
        const rgData = await rgRes.json();
        if (rgData.message) {
          setRescueGroupsFallbackMessage(rgData.message || '');
        } else {
          setRescueGroupsFallbackMessage('');
        }
        
        const formattedRg = (rgData.pets || []).map((p: any) => ({
          ...p,
          source: 'rescuegroups' as const
        }));
        setRescueGroupsPets(formattedRg);
      }
    } catch (err) {
      console.error('Failed to load listings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
    if (typeof window !== 'undefined') {
      const email = localStorage.getItem('lumo_pro_email') || localStorage.getItem('lumo_sitter_email') || '';
      if (email) {
        fetch(`/api/adoption/shelter?email=${encodeURIComponent(email)}`)
          .then(r => (r.ok ? r.json() : null))
          .then(data => {
            if (data && data.shelter) {
              setUserShelter(data.shelter);
            } else {
              setUserShelter(null);
            }
          })
          .catch(() => setUserShelter(null));
      } else {
        setUserShelter(null);
      }
    }
  }, [species, age, size, debouncedCitySearch]);

  // Helper to require sign-in for AI tools
  const checkAuthAndRun = (action: () => void) => {
    if (typeof window === 'undefined') return;
    const userEmail = (
      localStorage.getItem('lumo_pro_email') ||
      localStorage.getItem('lumo_sitter_email') ||
      localStorage.getItem('lumo_shelter_email') ||
      ''
    ).trim();

    if (!userEmail) {
      localStorage.setItem('lumo_redirect_after_login', '/adoption');
      window.location.href = '/?signin=true';
      return;
    }
    action();
  };

  // Run AI Text Matcher
  const handleRunLifestyleMatch = async () => {
    if (!lifestylePrompt.trim()) return;
    const userEmail = (
      localStorage.getItem('lumo_pro_email') ||
      localStorage.getItem('lumo_sitter_email') ||
      localStorage.getItem('lumo_shelter_email') ||
      ''
    ).trim();

    if (!userEmail) {
      localStorage.setItem('lumo_redirect_after_login', '/adoption');
      window.location.href = '/?signin=true';
      return;
    }

    setIsLifestyleLoading(true);
    setLifestyleMatches([]);

    try {
      const res = await fetch('/api/adoption/ai-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: lifestylePrompt,
          species: species !== 'all' ? species : undefined
        })
      });

      if (res.ok) {
        const data = await res.json();
        setLifestyleMatches(data.matches || []);
      }
    } catch (err) {
      console.error('AI match error:', err);
    } finally {
      setIsLifestyleLoading(false);
    }
  };

  // Run AI Visual Matcher
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 1200;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
          setUploadedPhoto(compressedBase64);
        } else {
          setUploadedPhoto(event.target?.result as string);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRunVisualMatch = async () => {
    if (!uploadedPhoto) return;
    const userEmail = (
      localStorage.getItem('lumo_pro_email') ||
      localStorage.getItem('lumo_sitter_email') ||
      localStorage.getItem('lumo_shelter_email') ||
      ''
    ).trim();

    if (!userEmail) {
      localStorage.setItem('lumo_redirect_after_login', '/adoption');
      window.location.href = '/?signin=true';
      return;
    }

    setIsVisualLoading(true);
    setVisualMatches([]);
    setVisualEmptyMessage('');

    try {
      const res = await fetch('/api/adoption/visual-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo: uploadedPhoto })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.empty) {
          setVisualEmptyMessage(data.message || 'No local rescue photos yet to compare.');
        } else {
          setVisualMatches(data.matches || []);
        }
      }
    } catch (err) {
      console.error('Visual match error:', err);
    } finally {
      setIsVisualLoading(false);
    }
  };

  // Submit Shelter Application
  const handleShelterRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/adoption/shelter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shelterFormData)
      });
      if (res.ok) {
        const data = await res.json();
        setShelterRegSuccess(true);
        localStorage.setItem('lumo_shelter_email', shelterFormData.email);
        if (data.shelter) {
          setUserShelter(data.shelter);
        }
        setTimeout(() => {
          setShelterRegSuccess(false);
          setIsShelterRegOpen(false);
        }, 3000);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(`Registration failed: ${err.error || 'Check fields'}`);
      }
    } catch {
      alert('An error occurred while submitting.');
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFAF7] text-[#191919] font-sans">
      <MobileCommunityNav />
      {/* HERO SECTION */}
      <section className="bg-gradient-to-b from-[#FAF5EE] to-[#FDFAF7] border-b border-[#E8DDD4] px-6 py-12">
        <div className="max-w-5xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-[#F5EDE4] text-[#8B5E3C] px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider shadow-2xs">
            <Heart className="w-4 h-4 fill-[#8B5E3C]" /> Pet Adoption Portal
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight">
            Find Your New Best Friend
          </h1>
          <p className="text-gray-600 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Search adoptable pets from verified local shelters and RescueGroups partners. Use AI lifestyle matching or visual photo recognition to find your match.
          </p>

          {/* AI MATCHERS TRIGGERS */}
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              onClick={() => checkAuthAndRun(() => setIsLifestyleModalOpen(true))}
              className="bg-[#8B5E3C] hover:bg-[#734A2E] text-white font-bold py-3 px-5 rounded-2xl transition-all shadow-sm flex items-center gap-2 text-xs cursor-pointer border-none"
            >
              <Sparkles className="w-4 h-4 text-amber-300" /> AI Lifestyle Matcher
            </button>
            <button
              onClick={() => checkAuthAndRun(() => setIsVisualModalOpen(true))}
              className="bg-white hover:bg-amber-50 text-[#8B5E3C] font-bold py-3 px-5 rounded-2xl transition-all border border-[#E8DDD4] shadow-xs flex items-center gap-2 text-xs cursor-pointer"
            >
              <Camera className="w-4 h-4 text-[#8B5E3C]" /> AI Photo Visual Matcher
            </button>
          </div>

          {/* REDESIGNED DYNAMIC SHELTER ENTRY POINT BANNER */}
          <div className="pt-4 border-t border-[#E8DDD4]/60 flex justify-center">
            {userShelter ? (
              <div className="w-full flex justify-center">
                {userShelter.status === 'approved' && (
                  <Link
                    href="/adoption/shelter/dashboard"
                    className="inline-flex items-center justify-between gap-3 px-5 py-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/80 text-emerald-900 shadow-2xs transition-all no-underline group text-xs sm:text-sm font-extrabold max-w-md w-full"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-base shrink-0">🐾</span>
                      <span className="truncate">{userShelter.org_name || 'Organization'} — <span className="text-emerald-700 font-bold">Go to Your Dashboard</span></span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-emerald-700 group-hover:translate-x-1 transition-transform shrink-0" />
                  </Link>
                )}
                {userShelter.status === 'pending' && (
                  <Link
                    href="/adoption/shelter/dashboard"
                    className="inline-flex items-center justify-between gap-3 px-5 py-3 rounded-2xl bg-amber-50 hover:bg-amber-100/80 border border-amber-200/80 text-amber-900 shadow-2xs transition-all no-underline group text-xs sm:text-sm font-extrabold max-w-md w-full"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <Building2 className="w-3.5 h-3.5" />
                      </div>
                      <span className="truncate">{userShelter.org_name ? `${userShelter.org_name} — ` : ''}<span className="text-amber-800 font-bold">Your application is under review</span></span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-amber-700 group-hover:translate-x-1 transition-transform shrink-0" />
                  </Link>
                )}
                {userShelter.status === 'rejected' && (
                  <button
                    onClick={() => {
                      setShelterFormData({
                        org_name: userShelter.org_name || '',
                        tax_id: (userShelter as any).tax_id || '',
                        email: (userShelter as any).email || '',
                        phone: (userShelter as any).phone || '',
                        address: (userShelter as any).address || '',
                        city: (userShelter as any).city || '',
                        state: (userShelter as any).state || '',
                        zip: (userShelter as any).zip || '',
                        website: (userShelter as any).website || ''
                      });
                      setIsShelterRegOpen(true);
                    }}
                    className="inline-flex items-center justify-between gap-3 px-5 py-3 rounded-2xl bg-rose-50 hover:bg-rose-100/80 border border-rose-200/80 text-rose-900 shadow-2xs transition-all cursor-pointer group text-xs sm:text-sm font-extrabold max-w-md w-full"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <Building2 className="w-3.5 h-3.5" />
                      </div>
                      <span className="truncate">{userShelter.org_name ? `${userShelter.org_name} — ` : ''}<span className="text-rose-800 font-bold">Application update available</span></span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-rose-700 group-hover:translate-x-1 transition-transform shrink-0" />
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsShelterRegOpen(true)}
                className="inline-flex items-center justify-between gap-3 px-5 py-3 rounded-2xl bg-[#F5EDE4] hover:bg-[#EBDCCF] border border-[#8B5E3C]/20 text-[#8B5E3C] shadow-2xs transition-all cursor-pointer group text-xs sm:text-sm font-extrabold max-w-md w-full"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-[#8B5E3C] text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <Building2 className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-left font-bold text-[#8B5E3C]">Are you a shelter or rescue? <span className="text-[#6D472B] underline">List your pets here</span></span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#8B5E3C] group-hover:translate-x-1 transition-transform shrink-0" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* FILTER & SEARCH BAR */}
      <section className="sticky top-[calc(env(safe-area-inset-top,0px)+124px)] md:top-[calc(env(safe-area-inset-top,0px)+72px)] z-20 bg-white/95 backdrop-blur-md border-b border-[#E8DDD4] px-4 py-3 shadow-xs">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 max-w-full shrink-0">
            <span className="font-bold text-gray-500 uppercase text-[10px] tracking-wider flex items-center gap-1 shrink-0">
              <Filter className="w-3.5 h-3.5" /> Filters:
            </span>
            <select
              value={species}
              onChange={e => setSpecies(e.target.value)}
              className="bg-[#FAF6F0] border border-gray-200 rounded-xl px-3 py-1.5 font-bold text-gray-800 shrink-0"
            >
              <option value="all">All Species</option>
              <option value="dog">Dogs</option>
              <option value="cat">Cats</option>
              <option value="other">Other Pets</option>
            </select>

            <select
              value={age}
              onChange={e => setAge(e.target.value)}
              className="bg-[#FAF6F0] border border-gray-200 rounded-xl px-3 py-1.5 font-bold text-gray-800 shrink-0"
            >
              <option value="all">All Ages</option>
              <option value="puppy">Puppy / Kitten</option>
              <option value="young">Young</option>
              <option value="adult">Adult</option>
              <option value="senior">Senior</option>
            </select>

            <select
              value={size}
              onChange={e => setSize(e.target.value)}
              className="bg-[#FAF6F0] border border-gray-200 rounded-xl px-3 py-1.5 font-bold text-gray-800 shrink-0"
            >
              <option value="all">All Sizes</option>
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
          <div className="relative w-full sm:w-72">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search city (e.g. Austin, TX)…"
                value={citySearch}
                onChange={e => {
                  setCitySearch(e.target.value);
                  fetchCitySuggestions(e.target.value);
                  setShowCityOptions(true);
                }}
                onFocus={() => setShowCityOptions(true)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    setShowCityOptions(false);
                    setDebouncedCitySearch(citySearch);
                  }
                }}
                className="w-full bg-[#FAF6F0] border border-gray-200 rounded-xl pl-8 pr-14 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-[#8B5E3C]"
              />
              <div className="absolute right-2 top-1.5 flex items-center gap-1">
                {citySearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setCitySearch('');
                      setDebouncedCitySearch('');
                      setCityOptions([]);
                      setShowCityOptions(false);
                    }}
                    title="Clear location filter"
                    className="text-gray-400 hover:text-gray-600 p-0.5 rounded-md bg-transparent border-none cursor-pointer text-xs font-bold"
                  >
                    X
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleGPSDetect}
                  disabled={isLocating}
                  title="Detect current location"
                  className="text-[#8B5E3C] hover:text-[#734A2E] p-1 rounded-md bg-transparent border-none cursor-pointer"
                >
                  {isLocating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* City Autocomplete Dropdown */}
            {showCityOptions && cityOptions.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-40 mt-1 bg-white border border-[#E8DDD4] rounded-2xl shadow-lg max-h-48 overflow-y-auto divide-y divide-gray-100 text-xs">
                {cityOptions.map((opt, i) => {
                  const displayText = typeof opt === 'string' ? opt : ((opt as any)?.clean_city || (opt as any)?.formatted_address || '');
                  if (!displayText) return null;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setCitySearch(displayText);
                        setDebouncedCitySearch(displayText);
                        setShowCityOptions(false);
                      }}
                      className="w-full text-left p-2.5 hover:bg-amber-50 text-gray-700 font-medium cursor-pointer border-none bg-transparent flex items-center gap-1.5"
                    >
                      <Building2 className="w-3.5 h-3.5 text-[#8B5E3C] shrink-0" />
                      <span className="truncate">{displayText}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* MAIN CONTENT FEED */}
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* INLINE MAP TOGGLE BAR */}
        <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-[#E8DDD4]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowMap(!showMap)}
              className="bg-[#FAF6F0] hover:bg-[#F5EDE4] text-[#8B5E3C] border border-[#E8DDD4] font-extrabold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
            >
              <MapIcon className="w-4 h-4 text-[#8B5E3C]" />
              <span>{showMap ? 'Hide Map' : 'Show Map'}</span>
              {showMap ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            <span className="text-xs text-gray-500 font-medium hidden sm:inline">
              Interactive map pins match your selected filters below
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
            <span className="bg-amber-100 text-amber-900 px-3 py-1 rounded-full">
              {localPets.length + rescueGroupsPets.length} adoptable pets listed
            </span>
          </div>
        </div>

        {/* INLINE EXPANDABLE MAP SECTION */}
        {showMap && !loading && (
          <section className="space-y-3 bg-white p-4 rounded-3xl border border-[#E8DDD4] shadow-2xs">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-black text-gray-900 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#8B5E3C]" /> Pet Locations Map
              </h3>
              <div className="flex items-center gap-3 text-[11px] font-bold">
                <div className="flex items-center gap-1 text-[#8B5E3C]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#8B5E3C]"></span> Lumo Bites Local
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span> RescueGroups
                </div>
              </div>
            </div>
            <div className="h-[400px] w-full">
              <AdoptionPetsMap 
                key={`${species}-${age}-${size}-${debouncedCitySearch}`}
                pets={[...localPets, ...rescueGroupsPets]}
                citySearch={citySearch}
              />
            </div>
          </section>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#8B5E3C]" />
            <p className="text-xs text-gray-400 font-bold">Loading adoptable pets near you…</p>
          </div>
        ) : (
          <>
            {/* SECTION 1: LOCAL RESCUES ON LUMO BITES */}
            <section className="space-y-4 bg-amber-50/50 p-5 md:p-6 rounded-3xl border border-amber-200/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-gray-900 flex items-center gap-2">
                    <Building2 className="w-6 h-6 text-[#8B5E3C]" /> Local Rescues on Lumo Bites
                  </h2>
                  <p className="text-xs text-gray-600">Direct shelter partner listings — message shelter in-app</p>
                </div>
                <span className="bg-[#8B5E3C] text-white text-xs font-bold px-3 py-1 rounded-full shadow-2xs">
                  {localPets.length} local pets
                </span>
              </div>

              {localPets.length === 0 ? (
                <div className="bg-white p-8 rounded-3xl border border-[#E8DDD4] text-center space-y-2">
                  <PawPrint className="w-8 h-8 text-gray-300 mx-auto" />
                  <p className="font-bold text-sm text-gray-700">No local shelter listings matching your filter</p>
                  <p className="text-xs text-gray-400">Check back soon as local shelters add new pets, or browse RescueGroups listings below.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {localPets.map(pet => (
                    <div key={pet.id} className="bg-white rounded-3xl border border-amber-200 hover:border-[#8B5E3C] overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                      <div className="p-4 space-y-3">
                        <div className="relative">
                          <PetPhotoCarousel photoUrls={pet.photo_urls || []} petType={pet.species} className="w-full h-48 rounded-2xl" />
                          <span className="absolute top-2 left-2 bg-[#8B5E3C] text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 z-10">
                            🏠 Lumo Bites Shelter
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center justify-between">
                            <h3 className="font-extrabold text-base text-gray-900 truncate">{pet.name}</h3>
                            <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full capitalize">{pet.age}</span>
                          </div>
                          <p className="text-xs text-gray-500 font-medium">{pet.breed} &bull; {pet.size} &bull; {pet.sex}</p>
                          <div className="text-[11px] text-[#8B5E3C] font-bold mt-1.5 flex items-center gap-1.5">
                            {(pet as any).shelter_photo_url ? (
                              <img src={(pet as any).shelter_photo_url} alt={pet.shelter_name} className="w-4 h-4 rounded-full object-cover shrink-0 border border-amber-200" />
                            ) : (
                              <Building2 className="w-3.5 h-3.5 shrink-0 text-[#8B5E3C]" />
                            )}
                            <span className="truncate">{pet.shelter_name}</span>
                          </div>
                          {pet.temperament && (
                            <p className="text-xs text-gray-600 bg-amber-50/70 p-2.5 rounded-xl border border-amber-100 mt-2 leading-relaxed">
                              {pet.temperament}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="p-4 pt-0">
                        <button
                          onClick={() => router.push(`/adoption/messages/${pet.id}`)}
                          className="w-full bg-[#8B5E3C] hover:bg-[#734A2E] text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer border-none transition-all shadow-xs"
                        >
                          <MessageSquare className="w-4 h-4" /> Ask About {pet.name}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* SECTION 2: MORE PETS NEARBY (VIA RESCUEGROUPS) */}
            <section className="space-y-4 bg-[#FAF6F0]/70 p-5 md:p-6 rounded-3xl border border-amber-300/40 shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-gray-900 flex items-center gap-2">
                    <Heart className="w-6 h-6 text-amber-600" /> More Pets Nearby (via RescueGroups)
                  </h2>
                  <p className="text-xs text-gray-600">External partner listings — click full listing to contact rescue</p>
                  <p className="text-[10px] text-amber-600/80 mt-1 italic font-medium">*Note: Partner listings are periodically synced and may occasionally reflect pets that have just been adopted.</p>
                </div>
                <span className="bg-amber-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-2xs">
                  {rescueGroupsPets.length} pets
                </span>
              </div>

              {rescueGroupsFallbackMessage && (
                <div className="bg-amber-50 border border-amber-200 p-3 px-4 rounded-2xl text-xs text-amber-900 font-medium">
                  ℹ️ {rescueGroupsFallbackMessage}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {rescueGroupsPets.map(pet => (
                  <div key={pet.id} className="bg-white rounded-3xl border border-amber-200/80 hover:border-amber-500 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                    <div className="p-4 space-y-3">
                      <div className="relative">
                        <img src={pet.photo || '/placeholder-pet.png'} alt={pet.name} className="w-full h-48 rounded-2xl object-cover" />
                        <span className="absolute top-2 left-2 bg-amber-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 z-10">
                          🔗 RescueGroups Partner
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center justify-between">
                          <h3 className="font-extrabold text-base text-gray-900 truncate">{pet.name}</h3>
                          <span className="text-[11px] font-bold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full capitalize">{pet.age}</span>
                        </div>
                        <p className="text-xs text-gray-500 font-medium">{pet.breed} &bull; {pet.size} &bull; {pet.sex}</p>
                        <p className="text-[11px] text-[#8B5E3C] font-bold mt-1 flex items-center gap-1 truncate">
                          <Building2 className="w-3.5 h-3.5 shrink-0" /> {pet.shelter_name}
                        </p>
                        {pet.description && (
                          <p className="text-xs text-gray-600 line-clamp-2 mt-2 leading-relaxed">
                            {pet.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="p-4 pt-0">
                      <a
                        href={pet.url || 'https://rescuegroups.org'}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 border border-amber-200 no-underline transition-all"
                      >
                        <ExternalLink className="w-4 h-4" /> View Full Listing
                      </a>
                    </div>
                    {pet.tracker_image_url && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={pet.tracker_image_url} width="0" height="0" alt="" aria-hidden="true" />
                    )}
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>

      {/* AI LIFESTYLE MATCHER MODAL */}
      {isLifestyleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#8B5E3C]" /> AI Lifestyle Matcher
              </h3>
              <button onClick={() => setIsLifestyleModalOpen(false)} className="text-xs font-bold text-gray-400 hover:text-gray-600 cursor-pointer border-none bg-transparent">Close</button>
            </div>

            <p className="text-xs text-gray-500">Describe your living situation and pet preferences (e.g., "small dog, low energy, good with kids, apartment friendly").</p>

            <div className="space-y-3">
              <textarea
                rows={3}
                value={lifestylePrompt}
                onChange={e => setLifestylePrompt(e.target.value)}
                placeholder="e.g. I live in a 2-bedroom apartment with a toddler. Looking for a quiet, low-energy companion dog…"
                className="w-full bg-[#FAF6F0] border border-gray-200 rounded-xl p-3 text-xs text-gray-800 focus:outline-none focus:border-[#8B5E3C]"
              />

              <button
                onClick={handleRunLifestyleMatch}
                disabled={!lifestylePrompt.trim() || isLifestyleLoading}
                className="w-full bg-[#8B5E3C] hover:bg-[#734A2E] text-white font-bold py-3 rounded-xl text-xs cursor-pointer border-none flex items-center justify-center gap-2"
              >
                {isLifestyleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {isLifestyleLoading ? 'Analyzing Listings…' : 'Find Matching Pets'}
              </button>
            </div>

            {/* RESULTS */}
            {lifestyleMatches.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <h4 className="font-bold text-xs text-gray-800">Top AI Ranked Matches:</h4>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {lifestyleMatches.map((match, idx) => (
                    <div key={idx} className="bg-amber-50/60 border border-amber-100 p-3 rounded-2xl flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-gray-900">{match.pet.name} ({match.pet.species})</h5>
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">{match.score}% Match</span>
                        </div>
                        <p className="text-[11px] text-gray-600 mt-0.5">{match.reason}</p>
                      </div>
                      {match.pet.source === 'lumo_bites' ? (
                        <button
                          onClick={() => { setIsLifestyleModalOpen(false); router.push(`/adoption/messages/${match.pet.id}`); }}
                          className="bg-[#8B5E3C] text-white font-bold text-[11px] py-1.5 px-3 rounded-xl shrink-0 border-none cursor-pointer"
                        >
                          Inquire
                        </button>
                      ) : (
                        <a
                          href={match.pet.url || 'https://www.rescuegroups.org'}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-gray-200 text-gray-800 font-bold text-[11px] py-1.5 px-3 rounded-xl shrink-0 no-underline"
                        >
                          View
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI PHOTO VISUAL MATCHER MODAL */}
      {isVisualModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                <Camera className="w-5 h-5 text-[#8B5E3C]" /> AI Photo Visual Matcher
              </h3>
              <button
                onClick={() => {
                  setIsVisualModalOpen(false);
                  setUploadedPhoto(null);
                  setVisualMatches([]);
                  setVisualEmptyMessage('');
                }}
                className="text-xs font-bold text-gray-400 hover:text-gray-600 cursor-pointer border-none bg-transparent"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed">
              Upload or snap a photo of a pet you love to find visually similar adoptable candidates from local shelters.
            </p>

            <div className="space-y-4">
              {/* Hidden file inputs for Camera and Gallery */}
              <input
                id="visual-camera-input"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <input
                id="visual-file-input"
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />

              {!uploadedPhoto ? (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => document.getElementById('visual-camera-input')?.click()}
                    className="p-4 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-[#8B5E3C] font-bold text-xs flex flex-col items-center justify-center gap-2 cursor-pointer transition-all shadow-2xs"
                  >
                    <Camera className="w-6 h-6 text-[#8B5E3C]" />
                    <span>Take Photo (Camera)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => document.getElementById('visual-file-input')?.click()}
                    className="p-4 rounded-2xl bg-[#FAF6F0] hover:bg-[#F5EDE4] border border-gray-200 text-gray-700 font-bold text-xs flex flex-col items-center justify-center gap-2 cursor-pointer transition-all shadow-2xs"
                  >
                    <Upload className="w-6 h-6 text-gray-500" />
                    <span>Choose from Library</span>
                  </button>
                </div>
              ) : (
                <div className="relative bg-[#FAF6F0] p-3 rounded-2xl border border-gray-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img src={uploadedPhoto} alt="Uploaded target" className="w-20 h-20 rounded-xl object-cover border border-amber-200" />
                    <div>
                      <p className="font-extrabold text-xs text-gray-900">Photo Attached</p>
                      <p className="text-[11px] text-gray-500">Ready for visual AI comparison</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setUploadedPhoto(null);
                      setVisualMatches([]);
                      setVisualEmptyMessage('');
                    }}
                    className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold border border-red-200 cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              )}

              <button
                onClick={handleRunVisualMatch}
                disabled={!uploadedPhoto || isVisualLoading}
                className={`w-full font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 border-none transition-all ${
                  uploadedPhoto && !isVisualLoading
                    ? 'bg-[#8B5E3C] hover:bg-[#734A2E] text-white cursor-pointer shadow-xs'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isVisualLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing Visual Features…</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{uploadedPhoto ? 'Find Visually Similar Pets' : 'Select or Take a Photo First'}</span>
                  </>
                )}
              </button>
            </div>

            {/* VISUAL RESULTS */}
            {visualEmptyMessage ? (
              <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl text-xs text-amber-900 font-medium text-center">
                ℹ️ {visualEmptyMessage}
              </div>
            ) : visualMatches.length > 0 ? (
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <h4 className="font-bold text-xs text-gray-800">Visually Similar Local Shelter Candidates:</h4>
                <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                  {visualMatches.map((m, idx) => (
                    <div key={idx} className="bg-white border border-[#E8DDD4] p-3 rounded-2xl space-y-2 text-xs">
                      <img src={m.pet.photo || '/placeholder-pet.png'} alt={m.pet.name} className="w-full h-24 rounded-xl object-cover" />
                      <div>
                        <h5 className="font-bold text-gray-900">{m.pet.name}</h5>
                        <p className="text-[11px] text-gray-500">{m.pet.breed}</p>
                        <p className="text-[10px] text-emerald-700 font-bold mt-1">{m.similarityScore}% Visual Match</p>
                      </div>
                      <button
                        onClick={() => { setIsVisualModalOpen(false); router.push(`/adoption/messages/${m.pet.id}`); }}
                        className="w-full bg-[#8B5E3C] text-white font-bold py-1.5 rounded-xl text-[11px] border-none cursor-pointer"
                      >
                        Ask About {m.pet.name}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* SHELTER REGISTRATION MODAL */}
      {isShelterRegOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#8B5E3C]" /> Rescue / Shelter Account Registration
            </h3>

            {shelterRegSuccess ? (
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-center space-y-2 text-xs text-emerald-900 font-medium">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="font-bold text-sm">Application Submitted!</p>
                <p>Your shelter application is pending admin review. You will receive an update once approved.</p>
              </div>
            ) : (
              <form onSubmit={handleShelterRegisterSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Organization Name *</label>
                  <input
                    type="text"
                    required
                    value={shelterFormData.org_name}
                    onChange={e => setShelterFormData({ ...shelterFormData, org_name: e.target.value })}
                    className="w-full bg-[#FAF6F0] border border-gray-200 rounded-xl p-2.5"
                    placeholder="e.g. Happy Paws Animal Rescue"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">EIN / Non-Profit ID</label>
                    <input
                      type="text"
                      value={shelterFormData.tax_id}
                      onChange={e => setShelterFormData({ ...shelterFormData, tax_id: e.target.value })}
                      className="w-full bg-[#FAF6F0] border border-gray-200 rounded-xl p-2.5"
                      placeholder="XX-XXXXXXX"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Contact Email *</label>
                    <input
                      type="email"
                      required
                      value={shelterFormData.email}
                      onChange={e => setShelterFormData({ ...shelterFormData, email: e.target.value })}
                      className="w-full bg-[#FAF6F0] border border-gray-200 rounded-xl p-2.5"
                      placeholder="contact@shelter.org"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={shelterFormData.phone}
                      onChange={e => setShelterFormData({ ...shelterFormData, phone: e.target.value })}
                      className="w-full bg-[#FAF6F0] border border-gray-200 rounded-xl p-2.5"
                    />
                  </div>
                  <CityAutocompleteInput
                    label="City *"
                    required
                    value={shelterFormData.city}
                    onChange={val => setShelterFormData({ ...shelterFormData, city: val })}
                    placeholder="Search city (e.g. Austin, TX)…"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Website / Social Profile</label>
                  <input
                    type="url"
                    value={shelterFormData.website}
                    onChange={e => setShelterFormData({ ...shelterFormData, website: e.target.value })}
                    className="w-full bg-[#FAF6F0] border border-gray-200 rounded-xl p-2.5"
                    placeholder="https://..."
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-[#8B5E3C] hover:bg-[#734A2E] text-white font-bold py-3 rounded-xl cursor-pointer border-none"
                  >
                    Submit Application
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsShelterRegOpen(false)}
                    className="bg-gray-100 text-gray-700 font-bold px-4 py-3 rounded-xl cursor-pointer border-none"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdoptionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-xs text-[#8B5E3C] font-bold">Loading Adoption Portal…</div>}>
      <AdoptionContent />
    </Suspense>
  );
}
