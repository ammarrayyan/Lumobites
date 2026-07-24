'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { APIProvider, Map, Marker, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import { Building2, MessageSquare, ExternalLink } from 'lucide-react';

export interface AdoptionMapPet {
  id: string;
  name: string;
  species: string;
  breed: string;
  age: string;
  size?: string;
  sex?: string;
  photo_urls?: string[];
  photo?: string;
  shelter_name: string;
  shelter_photo_url?: string;
  description?: string;
  temperament?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
  url?: string;
  source: 'lumo_bites' | 'petfinder';
}

interface AdoptionPetsMapProps {
  pets: AdoptionMapPet[];
  citySearch?: string;
}

const getMarkerIcon = (source: 'lumo_bites' | 'petfinder', isSelected: boolean) => {
  const isLocal = source === 'lumo_bites';
  const color = isLocal ? '%238B5E3C' : '%23D97706'; // Warm Brown for Local, Amber for Petfinder
  const strokeColor = '%23FFFFFF';
  const size = isSelected ? 40 : 32;

  const pinSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}"><path fill="${color}" stroke="${strokeColor}" stroke-width="2" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle fill="%23FFFFFF" cx="12" cy="9" r="3.5"/></svg>`;
  return `data:image/svg+xml;utf-8,${pinSvg}`;
};

function MapHandler({ pets, searchCity }: { pets: AdoptionMapPet[]; searchCity?: string }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    const validPets = pets.filter(p => (p.latitude || p.lat) && (p.longitude || p.lng));
    if (validPets.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      validPets.forEach(p => {
        const lat = p.latitude || p.lat;
        const lng = p.longitude || p.lng;
        if (lat && lng) bounds.extend({ lat, lng });
      });
      map.fitBounds(bounds);
      if (validPets.length === 1) {
        map.setZoom(12);
      }
    } else {
      map.setCenter({ lat: 39.8283, lng: -98.5795 });
      map.setZoom(4);
    }
  }, [map, pets, searchCity]);

  return null;
}

export default function AdoptionPetsMap({ pets, citySearch }: AdoptionPetsMapProps) {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [activePet, setActivePet] = useState<AdoptionMapPet | null>(null);
  const [petsWithCoords, setPetsWithCoords] = useState<AdoptionMapPet[]>([]);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Geocode city locations for pets missing explicit lat/lng coordinates
  useEffect(() => {
    if (!isClient) return;

    let isMounted = true;
    const cityCache: Record<string, { lat: number; lng: number }> = {};

    async function resolveCoordinates() {
      const updated = await Promise.all(
        pets.map(async (pet, index) => {
          const lat = pet.latitude || pet.lat;
          const lng = pet.longitude || pet.lng;
          if (lat && lng) {
            // Apply slight offset for multiple pets at the exact same shelter coordinates
            // so their map pins don't perfectly overlap and hide each other
            const offsetLat = (index % 5) * 0.0008 - 0.0016;
            const offsetLng = Math.floor((index % 25) / 5) * 0.0008 - 0.0016;
            return { ...pet, lat: lat + offsetLat, lng: lng + offsetLng };
          }

          const rawCity = pet.city || citySearch;
          const city = (typeof rawCity === 'string' && rawCity.trim()) ? rawCity.trim() : 'New York, NY';
          if (cityCache[city]) {
            // Apply slight offset for multiple pets in the same city so pins don't overlap perfectly
            const offsetLat = (index % 5) * 0.008 - 0.016;
            const offsetLng = Math.floor(index / 5) * 0.008 - 0.016;
            return {
              ...pet,
              lat: cityCache[city].lat + offsetLat,
              lng: cityCache[city].lng + offsetLng
            };
          }

          try {
            const res = await fetch(`/api/petsitting/geocode?address=${encodeURIComponent(city)}`);
            if (res.ok) {
              const data = await res.json();
              if (data.lat && data.lng) {
                cityCache[city] = { lat: data.lat, lng: data.lng };
                const offsetLat = (index % 5) * 0.008 - 0.016;
                const offsetLng = Math.floor(index / 5) * 0.008 - 0.016;
                return {
                  ...pet,
                  lat: data.lat + offsetLat,
                  lng: data.lng + offsetLng
                };
              }
            }
          } catch (e) {
            console.warn(`[Adoption Map] Geocoding fallback for ${city}:`, e);
          }

          // Default fallback coordinates (US center offset)
          return {
            ...pet,
            lat: 39.8283 + (index % 5) * 0.05,
            lng: -98.5795 + Math.floor(index / 5) * 0.05
          };
        })
      );

      if (isMounted) {
        setPetsWithCoords(updated);
      }
    }

    resolveCoordinates();

    return () => {
      isMounted = false;
    };
  }, [pets, citySearch, isClient]);

  if (!isClient) {
    return (
      <div className="w-full h-[500px] bg-[#FAF6F0] flex items-center justify-center rounded-3xl border border-[#E8DDD4]">
        <div className="text-[#8B5E3C] font-bold text-xs">Loading map view…</div>
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div className="w-full h-[500px] bg-[#FAF6F0] flex flex-col items-center justify-center p-6 rounded-3xl border border-[#E8DDD4] text-center space-y-2">
        <span className="text-[#8B5E3C] font-black text-sm">Google Maps API Key Required</span>
        <span className="text-gray-500 text-xs">Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to display interactive adoptable pet map pins.</span>
      </div>
    );
  }

  return (
    <div className="w-full h-[540px] relative rounded-3xl overflow-hidden border border-[#E8DDD4] shadow-xs">
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={{ lat: 39.8283, lng: -98.5795 }}
          defaultZoom={4}
          gestureHandling="cooperative"
          disableDefaultUI={false}
          className="w-full h-full"
        >
          <MapHandler pets={petsWithCoords} searchCity={citySearch} />
          {petsWithCoords.map(pet => {
            if (!pet.lat || !pet.lng) return null;
            const isSelected = activePet?.id === pet.id;
            return (
              <Marker
                key={pet.id}
                position={{ lat: pet.lat, lng: pet.lng }}
                onClick={() => setActivePet(pet)}
                icon={{
                  url: getMarkerIcon(pet.source, isSelected),
                  scaledSize: { width: isSelected ? 40 : 32, height: isSelected ? 40 : 32 } as any,
                  anchor: { x: isSelected ? 20 : 16, y: isSelected ? 40 : 32 } as any
                }}
              />
            );
          })}

          {activePet && activePet.lat && activePet.lng && (
            <InfoWindow
              position={{ lat: activePet.lat, lng: activePet.lng }}
              onCloseClick={() => setActivePet(null)}
            >
              <div style={{ fontFamily: 'inherit', padding: '4px', maxWidth: 220, fontSize: '12px' }}>
                <div className="relative w-full h-28 rounded-xl overflow-hidden mb-2 bg-gray-100 border border-gray-200">
                  <img
                    src={
                      (activePet.photo_urls && activePet.photo_urls[0]) ||
                      activePet.photo ||
                      '/placeholder-pet.png'
                    }
                    alt={activePet.name}
                    className="w-full h-full object-cover"
                  />
                  <span className={`absolute top-1.5 left-1.5 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase text-white shadow-xs ${
                    activePet.source === 'lumo_bites' ? 'bg-[#8B5E3C]' : 'bg-amber-600'
                  }`}>
                    {activePet.source === 'lumo_bites' ? 'Local Shelter' : 'Petfinder'}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-sm text-gray-900 truncate">{activePet.name}</h4>
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full capitalize">
                      {activePet.age}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 truncate">{activePet.breed} &bull; {activePet.sex || 'Unknown'}</p>
                  
                  <div className="text-[10px] text-[#8B5E3C] font-bold flex items-center gap-1 truncate pt-0.5">
                    <Building2 className="w-3 h-3 shrink-0" />
                    <span className="truncate">{activePet.shelter_name}</span>
                  </div>

                  <div className="pt-2">
                    {activePet.source === 'lumo_bites' ? (
                      <button
                        onClick={() => router.push(`/adoption/messages/${activePet.id}`)}
                        className="w-full bg-[#8B5E3C] hover:bg-[#734A2E] text-white font-bold py-1.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer border-none shadow-2xs"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Ask About Pet
                      </button>
                    ) : (
                      <a
                        href={activePet.url || 'https://www.petfinder.com'}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 no-underline border-none shadow-2xs text-center"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Full Listing
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>
    </div>
  );
}
