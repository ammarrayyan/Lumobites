'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { APIProvider, Map, Marker, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import { MapPin } from 'lucide-react';

export interface MapPet {
  id: string;
  pet_name: string;
  type: string;
  species: string;
  status: string;
  latitude?: number;
  longitude?: number;
  distance?: number;
  city?: string;
  zip_code?: string;
  photo_url?: string;
  [key: string]: any;
}

interface LostPetsMapProps {
  pets: MapPet[];
  searchCoords?: { lat: number, lng: number } | null;
}

const getMarkerIcon = (type: string, status: string) => {
  const isLost = type === 'lost';
  const isResolved = status === 'resolved';
  
  let color = '%233B82F6'; // Blue for found
  if (isLost) color = '%23EF4444'; // Red for lost
  if (isResolved) color = '%2310B981'; // Green for resolved

  const pinSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32"><path fill="${color}" stroke="%23FFFFFF" stroke-width="2" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle fill="%23FFFFFF" cx="12" cy="9" r="3"/></svg>`;
  return `data:image/svg+xml;utf-8,${pinSvg}`;
};

function MapHandler({ searchCoords }: { searchCoords?: { lat: number, lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    if (searchCoords) {
      map.setCenter({ lat: searchCoords.lat, lng: searchCoords.lng });
      map.setZoom(11);
    } else {
      map.setCenter({ lat: 39.8283, lng: -98.5795 });
      map.setZoom(4);
    }
  }, [map, searchCoords]);
  return null;
}

export default function LostPetsMap({ pets, searchCoords }: LostPetsMapProps) {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [activePet, setActivePet] = useState<MapPet | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="w-full h-full bg-[#F5EDE4] flex items-center justify-center rounded-2xl border border-[#E8D5C0]">
        <div className="text-[#8B5E3C] font-medium text-sm">Loading map...</div>
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div className="w-full h-full bg-[#F5EDE4] flex flex-col items-center justify-center p-6 rounded-2xl border border-[#E8D5C0] text-center">
        <span className="text-[#8B5E3C] font-black text-base mb-1">Google Maps API Key Missing</span>
        <span className="text-[#8B7E7D] text-xs">Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to render the interactive lost pets map.</span>
      </div>
    );
  }

  const defaultCenter = searchCoords
    ? { lat: searchCoords.lat, lng: searchCoords.lng }
    : { lat: 39.8283, lng: -98.5795 };
  
  const defaultZoom = searchCoords ? 11 : 4;

  return (
    <div className="w-full h-full relative rounded-2xl overflow-hidden border border-[#E8D5C0] shadow-sm">
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={defaultCenter}
          defaultZoom={defaultZoom}
          gestureHandling="cooperative"
          disableDefaultUI={false}
          className="w-full h-full"
        >
          <MapHandler searchCoords={searchCoords} />
          {pets.map((pet) => {
            if (!pet.latitude || !pet.longitude) return null;
            return (
              <Marker
                key={pet.id}
                position={{ lat: pet.latitude, lng: pet.longitude }}
                onClick={() => setActivePet(pet)}
                icon={{
                  url: getMarkerIcon(pet.type, pet.status),
                  scaledSize: { width: 32, height: 32 } as any,
                  anchor: { x: 16, y: 32 } as any,
                }}
              />
            );
          })}

          {activePet && activePet.latitude && activePet.longitude && (
            <InfoWindow
              position={{ lat: activePet.latitude, lng: activePet.longitude }}
              onCloseClick={() => setActivePet(null)}
            >
              <div style={{ fontFamily: 'inherit', padding: '4px 2px', maxWidth: 200 }}>
                {activePet.photo_url && (
                  <img
                    src={activePet.photo_url}
                    alt={activePet.pet_name}
                    style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }}
                  />
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: '#3B2410', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>
                    {activePet.pet_name || 'Unknown Pet'}
                  </div>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: activePet.status === 'resolved' ? '#10B981' : activePet.type === 'lost' ? '#EF4444' : '#3B82F6',
                    color: 'white',
                    textTransform: 'uppercase'
                  }}>
                    {activePet.status === 'resolved' ? 'Resolved' : activePet.type}
                  </span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#4A3E3D', marginBottom: 8, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin style={{ width: 14, height: 14, color: '#8B5E3C' }} /> {activePet.city}
                </div>
                <button
                  onClick={() => router.push(`/lost-pets/${activePet.id}`)}
                  style={{
                    width: '100%',
                    background: '#8B5E3C',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 12px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  View Details
                </button>
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>
    </div>
  );
}
