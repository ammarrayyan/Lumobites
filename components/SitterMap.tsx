'use client';

import React, { useState, useEffect } from 'react';
import { APIProvider, Map, Marker, useMap } from '@vis.gl/react-google-maps';

export interface MapSitter {
  id: string;
  name: string;
  lat?: number;
  lng?: number;
  rate_per_night: number;
  distance?: number;
  city?: string;
  country?: string;
  [key: string]: any;
}

interface SitterMapProps {
  sitters: MapSitter[];
  searchCoords?: { lat: number, lng: number } | null;
  onSelectSitter: (sitter: MapSitter) => void;
  highlightedSitterId?: string | null;
}

const getMarkerIcon = (isHighlighted: boolean) => {
  const color = isHighlighted ? '%238B5E3C' : '%233B2410';
  const strokeColor = isHighlighted ? '%23FFFFFF' : '%23C17D3C';
  const size = isHighlighted ? 44 : 32;
  const pinSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}"><path fill="${color}" stroke="${strokeColor}" stroke-width="2" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle fill="%23FAF6F4" cx="12" cy="9" r="3"/></svg>`;
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

export default function SitterMap({ sitters, searchCoords, onSelectSitter, highlightedSitterId }: SitterMapProps) {
  const [isClient, setIsClient] = useState(false);
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
        <span className="text-[#8B7E7D] text-xs">Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to render the interactive sitter map.</span>
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
          {sitters.map((sitter) => {
            if (!sitter.lat || !sitter.lng) return null;
            const isHighlighted = highlightedSitterId === sitter.id;
            return (
              <Marker
                key={sitter.id}
                position={{ lat: sitter.lat, lng: sitter.lng }}
                onClick={() => onSelectSitter(sitter)}
                zIndex={isHighlighted ? 1000 : 1}
                icon={{
                  url: getMarkerIcon(isHighlighted),
                  scaledSize: {
                    width: isHighlighted ? 44 : 32,
                    height: isHighlighted ? 44 : 32,
                  } as any,
                  anchor: {
                    x: isHighlighted ? 22 : 16,
                    y: isHighlighted ? 44 : 32,
                  } as any,
                }}
              />
            );
          })}
        </Map>
      </APIProvider>
    </div>
  );
}
