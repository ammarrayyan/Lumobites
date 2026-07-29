'use client';

import React, { useState, useEffect } from 'react';
import { APIProvider, Map, Marker, InfoWindow, useMap } from '@vis.gl/react-google-maps';

export interface MapSitter {
  id: string;
  name?: string;
  clinic_name?: string;
  business_name?: string;
  lat?: number;
  lng?: number;
  rate_per_night?: number;
  distance?: number;
  city?: string;
  country?: string;
  [key: string]: any;
}

interface SitterMapProps {
  sitters: MapSitter[];
  vetClinics?: any[];
  petDaycares?: any[];
  searchCoords?: { lat: number; lng: number } | null;
  searchRadius?: string | number | null;
  onSelectSitter: (sitter: MapSitter) => void;
  onSelectVetClinic?: (clinic: any) => void;
  onSelectDaycare?: (daycare: any) => void;
  highlightedSitterId?: string | null;
}

const getMarkerIcon = (type: 'sitter' | 'vet' | 'daycare', isHighlighted: boolean) => {
  if (type === 'vet') {
    const color = isHighlighted ? '%231D4ED8' : '%232563EB';
    const strokeColor = isHighlighted ? '%23FFFFFF' : '%2393C5FD';
    const size = isHighlighted ? 44 : 36;
    const crossSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}"><path fill="${color}" stroke="${strokeColor}" stroke-width="1.5" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><rect fill="%23FFFFFF" x="10.5" y="5.5" width="3" height="7" rx="1"/><rect fill="%23FFFFFF" x="7.5" y="8.5" width="9" height="3" rx="1"/></svg>`;
    return `data:image/svg+xml;utf-8,${crossSvg}`;
  }
  if (type === 'daycare') {
    const color = isHighlighted ? '%23047857' : '%23059669';
    const strokeColor = isHighlighted ? '%23FFFFFF' : '%23A7F3D0';
    const size = isHighlighted ? 44 : 36;
    const daycareSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}"><path fill="${color}" stroke="${strokeColor}" stroke-width="1.5" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle fill="%23FFFFFF" cx="12" cy="8.5" r="3.5"/></svg>`;
    return `data:image/svg+xml;utf-8,${daycareSvg}`;
  }
  // Sitter pin (default brown)
  const color = isHighlighted ? '%238B5E3C' : '%233B2410';
  const strokeColor = isHighlighted ? '%23FFFFFF' : '%23C17D3C';
  const size = isHighlighted ? 44 : 34;
  const pinSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}"><path fill="${color}" stroke="${strokeColor}" stroke-width="2" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle fill="%23FAF6F4" cx="12" cy="9" r="3"/></svg>`;
  return `data:image/svg+xml;utf-8,${pinSvg}`;
};

function MapHandler({ searchCoords }: { searchCoords?: { lat: number; lng: number } | null }) {
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

function MapCircleHandler({
  searchCoords,
  searchRadius
}: {
  searchCoords?: { lat: number; lng: number } | null;
  searchRadius?: string | number | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map || !searchCoords) return;

    const distanceInMiles = typeof searchRadius === 'string' ? parseFloat(searchRadius) : (searchRadius || 0);
    if (isNaN(distanceInMiles) || distanceInMiles <= 0) return;

    const circle = new google.maps.Circle({
      strokeColor: "#8B5E3C",
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: "#8B5E3C",
      fillOpacity: 0.12,
      map: map,
      center: { lat: searchCoords.lat, lng: searchCoords.lng },
      radius: distanceInMiles * 1609.34,
      clickable: false
    });

    return () => {
      circle.setMap(null);
    };
  }, [map, searchCoords, searchRadius]);

  return null;
}

export default function SitterMap({
  sitters,
  vetClinics = [],
  petDaycares = [],
  searchCoords,
  searchRadius,
  onSelectSitter,
  onSelectVetClinic,
  onSelectDaycare,
  highlightedSitterId,
}: SitterMapProps) {
  const [isClient, setIsClient] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<{
    id: string;
    type: 'sitter' | 'vet' | 'daycare';
    position: { lat: number; lng: number };
    title: string;
    city?: string;
    photoUrl?: string;
    raw: any;
  } | null>(null);

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
        <span className="text-[#8B7E7D] text-xs">Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to render the interactive map.</span>
      </div>
    );
  }

  const defaultCenter = searchCoords
    ? { lat: searchCoords.lat, lng: searchCoords.lng }
    : { lat: 39.8283, lng: -98.5795 };
  
  const defaultZoom = searchCoords ? 11 : 4;

  const getItemCoords = (item: any, index: number, typeOffset: number) => {
    if (item.lat && item.lng) {
      return { lat: Number(item.lat), lng: Number(item.lng) };
    }
    if (searchCoords) {
      const angle = ((index + typeOffset) * 137.5) * (Math.PI / 180);
      const radius = 0.012 + (index % 5) * 0.008;
      return {
        lat: searchCoords.lat + radius * Math.cos(angle),
        lng: searchCoords.lng + radius * Math.sin(angle),
      };
    }
    return null;
  };

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
          <MapCircleHandler searchCoords={searchCoords} searchRadius={searchRadius} />

          {/* Sitter Markers */}
          {sitters.map((sitter, idx) => {
            const coords = getItemCoords(sitter, idx, 0);
            if (!coords) return null;
            const isHighlighted = highlightedSitterId === sitter.id;
            return (
              <Marker
                key={`sitter-${sitter.id}`}
                position={coords}
                onClick={() => {
                  setSelectedMarker({
                    id: sitter.id,
                    type: 'sitter',
                    position: coords,
                    title: sitter.name || 'Pet Sitter',
                    city: sitter.city,
                    photoUrl: sitter.profile_photo_url || sitter.photo_url,
                    raw: sitter,
                  });
                  onSelectSitter(sitter);
                }}
                zIndex={isHighlighted ? 1000 : 10}
                icon={{
                  url: getMarkerIcon('sitter', isHighlighted),
                  scaledSize: {
                    width: isHighlighted ? 44 : 34,
                    height: isHighlighted ? 44 : 34,
                  } as any,
                  anchor: {
                    x: isHighlighted ? 22 : 17,
                    y: isHighlighted ? 44 : 34,
                  } as any,
                }}
              />
            );
          })}

          {/* Vet Clinic Markers */}
          {vetClinics.map((clinic, idx) => {
            const coords = getItemCoords(clinic, idx, 10);
            if (!coords) return null;
            return (
              <Marker
                key={`vet-${clinic.id}`}
                position={coords}
                onClick={() => {
                  const markerObj = {
                    id: clinic.id,
                    type: 'vet' as const,
                    position: coords,
                    title: clinic.clinic_name || 'Vet Clinic',
                    city: clinic.city ? `${clinic.city}${clinic.state ? `, ${clinic.state}` : ''}` : '',
                    photoUrl: clinic.org_photo_url,
                    raw: clinic,
                  };
                  setSelectedMarker(markerObj);
                  if (onSelectVetClinic) onSelectVetClinic(clinic);
                }}
                zIndex={20}
                icon={{
                  url: getMarkerIcon('vet', false),
                  scaledSize: { width: 36, height: 36 } as any,
                  anchor: { x: 18, y: 36 } as any,
                }}
              />
            );
          })}

          {/* Pet Daycare Markers */}
          {petDaycares.map((daycare, idx) => {
            const coords = getItemCoords(daycare, idx, 20);
            if (!coords) return null;
            return (
              <Marker
                key={`daycare-${daycare.id}`}
                position={coords}
                onClick={() => {
                  const markerObj = {
                    id: daycare.id,
                    type: 'daycare' as const,
                    position: coords,
                    title: daycare.business_name || 'Pet Daycare',
                    city: daycare.city ? `${daycare.city}${daycare.state ? `, ${daycare.state}` : ''}` : '',
                    photoUrl: daycare.logo_url,
                    raw: daycare,
                  };
                  setSelectedMarker(markerObj);
                  if (onSelectDaycare) onSelectDaycare(daycare);
                }}
                zIndex={20}
                icon={{
                  url: getMarkerIcon('daycare', false),
                  scaledSize: { width: 36, height: 36 } as any,
                  anchor: { x: 18, y: 36 } as any,
                }}
              />
            );
          })}

          {/* Info Window Popup */}
          {selectedMarker && (
            <InfoWindow
              position={selectedMarker.position}
              onCloseClick={() => setSelectedMarker(null)}
            >
              <div className="p-1 max-w-[200px] text-left">
                {selectedMarker.photoUrl && (
                  <img
                    src={selectedMarker.photoUrl}
                    alt={selectedMarker.title}
                    className="w-full h-24 rounded-lg object-cover mb-2 border border-gray-200"
                  />
                )}
                <div className="flex items-center gap-1 mb-1">
                  <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded text-white ${
                    selectedMarker.type === 'vet' ? 'bg-blue-600' : selectedMarker.type === 'daycare' ? 'bg-emerald-600' : 'bg-[#8B5E3C]'
                  }`}>
                    {selectedMarker.type === 'vet' ? '🏥 Vet Boarding' : selectedMarker.type === 'daycare' ? '🐕 Pet Daycare' : '🐾 Pet Sitter'}
                  </span>
                </div>
                <h4 className="font-bold text-xs text-[#4A3E3D] line-clamp-1">{selectedMarker.title}</h4>
                {selectedMarker.city && <p className="text-[10px] text-gray-500 mb-2">{selectedMarker.city}</p>}
                <button
                  onClick={() => {
                    if (selectedMarker.type === 'sitter') onSelectSitter(selectedMarker.raw);
                    else if (selectedMarker.type === 'vet' && onSelectVetClinic) onSelectVetClinic(selectedMarker.raw);
                    else if (selectedMarker.type === 'daycare' && onSelectDaycare) onSelectDaycare(selectedMarker.raw);
                  }}
                  className={`w-full text-white font-bold py-1.5 px-3 rounded-lg text-xs transition-colors border-none cursor-pointer ${
                    selectedMarker.type === 'vet' ? 'bg-blue-600 hover:bg-blue-700' : selectedMarker.type === 'daycare' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-[#8B5E3C] hover:bg-[#734A2E]'
                  }`}
                >
                  {selectedMarker.type === 'sitter' ? 'View Details' : 'Inquire'}
                </button>
              </div>
            </InfoWindow>
          )}
        </Map>

        {/* Map Legend Overlay */}
        <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-xs px-3 py-2 rounded-xl border border-gray-200 shadow-md z-10 flex items-center gap-3 text-[11px] font-bold text-[#4A3E3D] pointer-events-auto">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#8B5E3C] inline-block shadow-xs" />
            <span>Sitters</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block shadow-xs" />
            <span>Vet Boarding</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block shadow-xs" />
            <span>Pet Daycare</span>
          </div>
        </div>
      </APIProvider>
    </div>
  );
}
