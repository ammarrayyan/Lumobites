'use client';

import React, { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import LostPetsMap from '@/components/LostPetsMap';
import { Megaphone, Footprints, MapPin, Check } from 'lucide-react';

export default function LostPetsFeed() {
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
  const [locationVerified, setLocationVerified] = useState(false);


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

  const handleUseMyLocation = () => {
    if (navigator.geolocation) {
      setIsGeocoding(true);
      setLocationVerified(false);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
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
          } finally {
            setIsGeocoding(false);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          setIsGeocoding(false);
          alert('Unable to get your location. Please enter a city manually.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  useEffect(() => {
    if (isGeocoding) return;

    const fetchPets = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filterType !== 'all') params.append('type', filterType);
        if (filterSpecies !== 'all') params.append('species', filterSpecies);
        
        if (searchQuery) {
          if (searchCoords) {
            params.append('lat', searchCoords.lat.toString());
            params.append('lng', searchCoords.lng.toString());
            if (searchRadius !== 'any') {
              params.append('radius', searchRadius);
            }
          } else {
            params.append('q', searchQuery);
          }
        }

        const res = await fetch(`/api/lost-pets?${params.toString()}`);
        const data = await res.json();
        if (res.ok) {
          setPets(data.pets || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPets();
  }, [searchQuery, searchCoords, searchRadius, filterType, filterSpecies, isGeocoding]);

  return (
    <div className="min-h-screen bg-[#FDFAF7] font-sans">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-black text-[#4A3E3D] mb-3">Community Pet Board</h1>
            <p className="text-[#8B5E3C] font-medium text-lg">Help reunite lost pets with their families in your neighborhood.</p>
          </div>
          <Link href="/lost-pets/post" className="bg-[#8B5E3C] hover:bg-[#7A5234] text-white font-bold py-4 px-8 rounded-full transition-transform transform hover:scale-105 shadow-md flex items-center gap-2 flex-shrink-0">
            <Megaphone className="w-5 h-5" /> Report Lost/Found Pet
          </Link>
        </div>

        {/* Unified Filter Bar — normal flow on all devices, stacks on mobile */}
        <div className="flex flex-col md:flex-row gap-4 bg-white border border-[#E8DDD4] rounded-2xl p-4 shadow-sm mb-8">
          <div className="flex-1 flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search by city or zip code..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setLocationVerified(false);
                }}
                className={`w-full bg-[#FAF6F4] border ${locationVerified ? 'border-green-500' : 'border-[#E8DDD4]'} rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C] pr-12`}
              />
              {isGeocoding && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-[#8B5E3C] border-t-transparent rounded-full animate-spin"></div>
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
              className="bg-[#FAF6F4] hover:bg-[#E8DDD4] border border-[#E8DDD4] rounded-xl px-4 py-3 text-[#8B5E3C] font-semibold flex items-center gap-2 transition duration-200 shrink-0"
              title="Use my current location"
            >
              <span>📍</span>
              <span className="hidden sm:inline">Use My Location</span>
            </button>
          </div>
          <select
            value={searchRadius}
            onChange={(e) => setSearchRadius(e.target.value)}
            className={`bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C] font-semibold ${!searchCoords && searchQuery ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!searchCoords && !!searchQuery}
          >
            <option value="10">Within 10 miles</option>
            <option value="25">Within 25 miles</option>
            <option value="50">Within 50 miles</option>
            <option value="100">Within 100 miles</option>
            <option value="any">Any distance</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C] font-semibold"
          >
            <option value="all">All Types</option>
            <option value="lost">Lost Pets</option>
            <option value="found">Found Pets</option>
          </select>
          <select
            value={filterSpecies}
            onChange={(e) => setFilterSpecies(e.target.value)}
            className="bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C] font-semibold"
          >
            <option value="all">All Species</option>
            <option value="dog">Dogs</option>
            <option value="cat">Cats</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Content — no extra offset needed on desktop; mobile offset handled by padding-top on the outer wrapper */}
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
                    <div className="absolute top-4 left-4 flex gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase shadow-md ${
                        pet.status === 'resolved' ? 'bg-green-500 text-white' :
                        pet.type === 'lost' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
                      }`}>
                        {pet.status === 'resolved' ? 'Resolved 🎉' : pet.type}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-2xl font-black text-[#4A3E3D] truncate pr-2">
                        {pet.pet_name || 'Unknown Pet'}
                      </h3>
                      <span className="text-xs font-bold text-[#8B5E3C] bg-[#FAF6F4] px-2 py-1 rounded-lg capitalize">
                        {pet.species}
                      </span>
                    </div>
                    
                    <p className="text-sm font-semibold text-[#8B7E7D] mb-4 flex flex-col gap-1.5">
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-gray-400" /> {pet.city} {pet.zip_code && `, ${pet.zip_code}`}</span>
                      {pet.distance !== undefined && pet.distance !== null && (
                        <span className="inline-flex w-fit text-[#8B5E3C] font-black text-[11px] bg-[#F5EDE4] px-2 py-1 rounded-md uppercase tracking-wide">
                          {pet.distance < 0.1 ? 'Less than 0.1 miles away' : `${pet.distance.toFixed(1)} miles away`}
                        </span>
                      )}
                    </p>
                    
                    <p className="text-[#555555] text-sm mb-6 line-clamp-3 flex-1">
                      {pet.description}
                    </p>
  
                    <div className="border-t border-[#E8DDD4] pt-4 mt-auto">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-semibold text-[#8B7E7D]">
                          {pet.type === 'lost' ? 'Lost on:' : 'Found on:'} {new Date(pet.date_lost_found).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-[#8B7E7D]">
                          Posted {formatDistanceToNow(new Date(pet.created_at))} ago
                        </span>
                      </div>
                      
                      <Link href={`/lost-pets/${pet.id}`} className="block w-full text-center bg-[#FAF6F4] hover:bg-[#F0E6DD] border border-[#E8DDD4] text-[#8B5E3C] font-bold py-3 rounded-xl transition-colors">
                        View Details & Help
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
      </main>
    </div>
  );
}
