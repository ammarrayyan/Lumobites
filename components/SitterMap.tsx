'use client';

import React, { useState, useEffect } from 'react';
import {
  APIProvider,
  Map,
  Marker,
  InfoWindow,
  useMap
} from '@vis.gl/react-google-maps';

export interface MapSitter {
  id: string;
  name: string;
  lat?: number;
  lng?: number;
  rate_per_night: number;
  distance?: number;
  [key: string]: any;
}

interface SitterMapProps {
  sitters: MapSitter[];
  searchCoords?: { lat: number, lng: number } | null;
  onSelectSitter: (sitter: MapSitter) => void;
}

// A component to handle map centering when searchCoords change
const MapUpdater = ({ searchCoords }: { searchCoords: { lat: number, lng: number } | null | undefined }) => {
  const map = useMap();
  useEffect(() => {
    if (map && searchCoords) {
      map.setCenter(searchCoords);
      map.setZoom(11);
    }
  }, [map, searchCoords]);
  return null;
};

export default function SitterMap({ sitters, searchCoords, onSelectSitter }: SitterMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  const [selectedSitter, setSelectedSitter] = useState<MapSitter | null>(null);

  const defaultCenter = searchCoords || { lat: 39.8283, lng: -98.5795 };
  const defaultZoom = searchCoords ? 11 : 4;

  if (!apiKey) {
    return (
      <div className="w-full h-full bg-[#F5EDE4] flex items-center justify-center text-[#8B5E3C] font-medium rounded-2xl border border-[#E8D5C0]">
        Map unavailable (Missing API key)
      </div>
    );
  }

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden border border-[#E8D5C0] shadow-sm relative z-0">
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={defaultCenter}
          defaultZoom={defaultZoom}
          gestureHandling="greedy"
          disableDefaultUI={false}
          zoomControl={true}
          mapTypeControl={false}
          streetViewControl={false}
        >
          <MapUpdater searchCoords={searchCoords} />
          
          {sitters.map(sitter => {
            if (!sitter.lat || !sitter.lng) return null;
            
            return (
              <Marker
                key={sitter.id}
                position={{ lat: sitter.lat, lng: sitter.lng }}
                onClick={() => setSelectedSitter(sitter)}
              />
            );
          })}

          {selectedSitter && selectedSitter.lat && selectedSitter.lng && (
            <InfoWindow
              position={{ lat: selectedSitter.lat, lng: selectedSitter.lng }}
              onCloseClick={() => setSelectedSitter(null)}
              headerContent={<div className="font-bold text-[#3B2410]">{selectedSitter.name}</div>}
            >
              <div className="p-1 min-w-[140px]">
                <div className="text-sm font-semibold mb-1 text-[#4A3E3D]">${selectedSitter.rate_per_night} / night</div>
                {selectedSitter.distance !== undefined && (
                  <div className="text-xs text-gray-500 mb-3">{selectedSitter.distance.toFixed(1)} miles away</div>
                )}
                <button 
                  onClick={() => onSelectSitter(selectedSitter)}
                  className="w-full bg-[#8B5E3C] text-white text-xs font-bold py-2 px-3 rounded-lg hover:bg-[#7A5234] transition-colors"
                >
                  View Profile
                </button>
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>
    </div>
  );
}
