'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, Search, Filter, Sparkles, Camera, ExternalLink, MessageSquare, Building2, PawPrint, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import PetPhotoCarousel from '@/components/PetPhotoCarousel';

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
  source: 'lumo_bites' | 'petfinder';
  status?: string;
}

function AdoptionContent() {
  const router = useRouter();

  // Filter state
  const [species, setSpecies] = useState('all');
  const [age, setAge] = useState('all');
  const [size, setSize] = useState('all');
  const [citySearch, setCitySearch] = useState('');

  // Listings data
  const [localPets, setLocalPets] = useState<PetListing[]>([]);
  const [petfinderPets, setPetfinderPets] = useState<PetListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [petfinderFallbackMessage, setPetfinderFallbackMessage] = useState('');

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

  // Shelter Registration Modal
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

  useEffect(() => {
    fetchListings();
  }, [species, age, size, citySearch]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      // 1. Fetch Lumo Bites Shelter pets
      const localParams = new URLSearchParams();
      if (species !== 'all') localParams.append('species', species);
      if (age !== 'all') localParams.append('age', age);
      if (size !== 'all') localParams.append('size', size);
      if (citySearch) localParams.append('city', citySearch);
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

      // 2. Fetch Petfinder pets
      const pfParams = new URLSearchParams();
      if (species !== 'all') pfParams.append('type', species);
      if (age !== 'all') pfParams.append('age', age);
      if (size !== 'all') pfParams.append('size', size);
      if (citySearch) pfParams.append('location', citySearch);

      const pfRes = await fetch(`/api/petfinder?${pfParams.toString()}`);
      if (pfRes.ok) {
        const pfData = await pfRes.json();
        if (pfData.fallback) {
          setPetfinderFallbackMessage(pfData.message || '');
        } else {
          setPetfinderFallbackMessage('');
        }
        const formattedPf = (pfData.animals || []).map((p: any) => ({
          ...p,
          source: 'petfinder' as const
        }));
        setPetfinderPets(formattedPf);
      }
    } catch (err) {
      console.error('Failed to load listings:', err);
    } finally {
      setLoading(false);
    }
  };

  // Run AI Text Matcher
  const handleRunLifestyleMatch = async () => {
    if (!lifestylePrompt.trim()) return;
    setIsLifestyleLoading(true);
    setLifestyleMatches([]);

    try {
      const res = await fetch('/api/adoption/ai-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: lifestylePrompt,
          species,
          petfinderPets
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
    reader.onload = () => {
      setUploadedPhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRunVisualMatch = async () => {
    if (!uploadedPhoto) return;
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
        setShelterRegSuccess(true);
        localStorage.setItem('lumo_shelter_email', shelterFormData.email);
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
    <div className="min-h-screen bg-[#FDFAF7] text-[#191919] font-sans" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 64px)' }}>
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
            Search adoptable pets from verified local shelters and Petfinder partners. Use AI lifestyle matching or visual photo recognition to find your match.
          </p>

          {/* AI MATCHERS TRIGGERS */}
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              onClick={() => setIsLifestyleModalOpen(true)}
              className="bg-[#8B5E3C] hover:bg-[#734A2E] text-white font-bold py-3 px-5 rounded-2xl transition-all shadow-sm flex items-center gap-2 text-xs cursor-pointer border-none"
            >
              <Sparkles className="w-4 h-4 text-amber-300" /> AI Lifestyle Matcher
            </button>
            <button
              onClick={() => setIsVisualModalOpen(true)}
              className="bg-white hover:bg-amber-50 text-[#8B5E3C] font-bold py-3 px-5 rounded-2xl transition-all border border-[#E8DDD4] shadow-xs flex items-center gap-2 text-xs cursor-pointer"
            >
              <Camera className="w-4 h-4 text-[#8B5E3C]" /> AI Photo Visual Matcher
            </button>
          </div>

          {/* SECONDARY SHELTER SIGNUP LINK */}
          <div className="pt-3">
            <button
              onClick={() => setIsShelterRegOpen(true)}
              className="text-xs font-bold text-[#8B5E3C] hover:underline flex items-center justify-center gap-1 mx-auto cursor-pointer border-none bg-transparent"
            >
              <Building2 className="w-4 h-4" /> Are you a shelter or rescue? List your pets here &rarr;
            </button>
          </div>
        </div>
      </section>

      {/* FILTER & SEARCH BAR */}
      <section className="sticky top-[64px] z-20 bg-white/95 backdrop-blur-md border-b border-[#E8DDD4] px-4 py-3 shadow-xs">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-gray-500 uppercase text-[10px] tracking-wider flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filters:
            </span>
            <select
              value={species}
              onChange={e => setSpecies(e.target.value)}
              className="bg-[#FAF6F0] border border-gray-200 rounded-xl px-3 py-1.5 font-bold text-gray-800"
            >
              <option value="all">All Species</option>
              <option value="dog">Dogs</option>
              <option value="cat">Cats</option>
              <option value="other">Other Pets</option>
            </select>

            <select
              value={age}
              onChange={e => setAge(e.target.value)}
              className="bg-[#FAF6F0] border border-gray-200 rounded-xl px-3 py-1.5 font-bold text-gray-800"
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
              className="bg-[#FAF6F0] border border-gray-200 rounded-xl px-3 py-1.5 font-bold text-gray-800"
            >
              <option value="all">All Sizes</option>
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by city or zip…"
              value={citySearch}
              onChange={e => setCitySearch(e.target.value)}
              className="w-full bg-[#FAF6F0] border border-gray-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-[#8B5E3C]"
            />
          </div>
        </div>
      </section>

      {/* MAIN CONTENT FEED */}
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#8B5E3C]" />
            <p className="text-xs text-gray-400 font-bold">Loading adoptable pets near you…</p>
          </div>
        ) : (
          <>
            {/* SECTION 1: LOCAL RESCUES ON LUMO BITES */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-gray-900 flex items-center gap-2">
                    <Building2 className="w-6 h-6 text-[#8B5E3C]" /> Local Rescues on Lumo Bites
                  </h2>
                  <p className="text-xs text-gray-500">Direct shelter listings — contact shelters directly in-app</p>
                </div>
                <span className="bg-amber-100 text-amber-900 text-xs font-bold px-3 py-1 rounded-full">
                  {localPets.length} local pets
                </span>
              </div>

              {localPets.length === 0 ? (
                <div className="bg-white p-8 rounded-3xl border border-[#E8DDD4] text-center space-y-2">
                  <PawPrint className="w-8 h-8 text-gray-300 mx-auto" />
                  <p className="font-bold text-sm text-gray-700">No local shelter listings matching your filter</p>
                  <p className="text-xs text-gray-400">Check back soon as local shelters add new pets, or browse Petfinder listings below.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {localPets.map(pet => (
                    <div key={pet.id} className="bg-white rounded-3xl border border-[#E8DDD4] overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                      <div className="p-4 space-y-3">
                        <PetPhotoCarousel photoUrls={pet.photo_urls || []} petType={pet.species} className="w-full h-48 rounded-2xl" />
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

            {/* SECTION 2: MORE PETS NEARBY (VIA PETFINDER) */}
            <section className="space-y-4 pt-6 border-t border-[#E8DDD4]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-gray-900 flex items-center gap-2">
                    <Heart className="w-6 h-6 text-[#8B5E3C]" /> More Pets Nearby (via Petfinder)
                  </h2>
                  <p className="text-xs text-gray-500">External partner listings — click full listing to contact rescue</p>
                </div>
                <span className="bg-amber-100 text-amber-900 text-xs font-bold px-3 py-1 rounded-full">
                  {petfinderPets.length} pets
                </span>
              </div>

              {petfinderFallbackMessage && (
                <div className="bg-amber-50 border border-amber-200 p-3 px-4 rounded-2xl text-xs text-amber-900 font-medium">
                  ℹ️ {petfinderFallbackMessage}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {petfinderPets.map(pet => (
                  <div key={pet.id} className="bg-white rounded-3xl border border-[#E8DDD4] overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                    <div className="p-4 space-y-3">
                      <img src={pet.photo || '/placeholder-pet.png'} alt={pet.name} className="w-full h-48 rounded-2xl object-cover" />
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
                        href={pet.url || 'https://www.petfinder.com'}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full bg-[#FAF6F0] hover:bg-[#F5EDE4] text-[#8B5E3C] font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 border border-[#E8DDD4] no-underline transition-all"
                      >
                        <ExternalLink className="w-4 h-4" /> View Full Listing
                      </a>
                    </div>
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
                          href={match.pet.url || 'https://www.petfinder.com'}
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
              <button onClick={() => setIsVisualModalOpen(false)} className="text-xs font-bold text-gray-400 hover:text-gray-600 cursor-pointer border-none bg-transparent">Close</button>
            </div>

            <p className="text-xs text-gray-500">Upload a photo of the type of pet you love to find visually similar candidates from our local shelter listings.</p>

            <div className="space-y-3">
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="text-xs text-gray-600" />
              {uploadedPhoto && (
                <img src={uploadedPhoto} alt="Uploaded target" className="w-24 h-24 rounded-2xl object-cover border border-gray-200" />
              )}

              <button
                onClick={handleRunVisualMatch}
                disabled={!uploadedPhoto || isVisualLoading}
                className="w-full bg-[#8B5E3C] hover:bg-[#734A2E] text-white font-bold py-3 rounded-xl text-xs cursor-pointer border-none flex items-center justify-center gap-2"
              >
                {isVisualLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                {isVisualLoading ? 'Comparing Visual Features…' : 'Find Visually Similar Pets'}
              </button>
            </div>

            {/* VISUAL RESULTS */}
            {visualEmptyMessage ? (
              <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl text-xs text-amber-900 font-medium text-center">
                ℹ️ {visualEmptyMessage}
              </div>
            ) : visualMatches.length > 0 && (
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
            )}
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
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={shelterFormData.city}
                      onChange={e => setShelterFormData({ ...shelterFormData, city: e.target.value })}
                      className="w-full bg-[#FAF6F0] border border-gray-200 rounded-xl p-2.5"
                    />
                  </div>
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
