'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

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

export default function LostPetsMap({ pets, searchCoords }: LostPetsMapProps) {
  const router = useRouter();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize map
  useEffect(() => {
    if (!isClient || !mapRef.current) return;

    let L: any;
    let map: any;

    const initMap = async () => {
      // Dynamically import Leaflet
      L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');

      // Fix default marker icon paths broken by webpack
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const defaultCenter: [number, number] = searchCoords
        ? [searchCoords.lat, searchCoords.lng]
        : [39.8283, -98.5795]; // Default center (USA)
      
      const defaultZoom = searchCoords ? 11 : 4;

      map = L.map(mapRef.current!, {
        center: defaultCenter,
        zoom: defaultZoom,
        zoomControl: true,
      });

      mapInstanceRef.current = map;

      // OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Add markers
      markersRef.current = [];
      pets.forEach((pet) => {
        if (!pet.latitude || !pet.longitude) return;

        const isLost = pet.type === 'lost';
        const isResolved = pet.status === 'resolved';
        
        let markerColor = '#3B82F6'; // Blue for found
        if (isLost) markerColor = '#EF4444'; // Red for lost
        if (isResolved) markerColor = '#10B981'; // Green for resolved

        const customIcon = L.divIcon({
          className: '',
          html: `
            <div style="
              width: 32px;
              height: 32px;
              background: ${markerColor};
              border: 3px solid white;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            "></div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -36],
        });

        const popup = L.popup({
          maxWidth: 220,
          className: 'lumo-popup',
        }).setContent(`
          <div style="font-family: inherit; padding: 4px 2px;">
            ${pet.photo_url ? `<img src="${pet.photo_url}" style="width: 100%; height: 100px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;" />` : ''}
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
              <div style="font-weight: 800; font-size: 15px; color: #4A3E3D; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${pet.pet_name || 'Unknown Pet'}</div>
              <span style="font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px; background: ${markerColor}; color: white; text-transform: uppercase;">${isResolved ? 'Resolved' : pet.type}</span>
            </div>
            <div style="font-size: 13px; font-weight: 600; color: #8B7E7D; margin-bottom: 8px;">📍 ${pet.city}</div>
            <button
              id="pet-btn-${pet.id}"
              style="
                width: 100%;
                background: #8B5E3C;
                color: white;
                border: none;
                border-radius: 8px;
                padding: 8px 12px;
                font-size: 12px;
                font-weight: 700;
                cursor: pointer;
              "
            >View Details</button>
          </div>
        `);

        const marker = L.marker([pet.latitude, pet.longitude], { icon: customIcon })
          .addTo(map)
          .bindPopup(popup);

        marker.on('popupopen', () => {
          setTimeout(() => {
            const btn = document.getElementById(`pet-btn-${pet.id}`);
            if (btn) {
              btn.onclick = () => {
                window.location.href = `/lost-pets/${pet.id}`;
              };
            }
          }, 100);
        });

        markersRef.current.push(marker);
      });
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isClient, pets]); // Re-initialize when pets change to update markers

  // Re-center map when searchCoords change
  useEffect(() => {
    if (!mapInstanceRef.current || !searchCoords) return;
    mapInstanceRef.current.setView([searchCoords.lat, searchCoords.lng], 11);
  }, [searchCoords]);

  if (!isClient) {
    return (
      <div className="w-full h-full bg-[#F5EDE4] flex items-center justify-center rounded-2xl border border-[#E8D5C0]">
        <div className="text-[#8B5E3C] font-medium text-sm">Loading map...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative rounded-2xl overflow-hidden border border-[#E8D5C0] shadow-sm">
      <div ref={mapRef} className="w-full h-full min-h-[400px]" />
      <style>{`
        .lumo-popup .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(59,36,16,0.15);
          border: 1px solid #E8D5C0;
        }
        .lumo-popup .leaflet-popup-tip {
          background: white;
        }
        .leaflet-control-attribution {
          font-size: 10px !important;
        }
      `}</style>
    </div>
  );
}
