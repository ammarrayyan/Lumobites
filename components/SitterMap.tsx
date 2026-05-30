'use client';

import React, { useState, useEffect, useRef } from 'react';

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
}

export default function SitterMap({ sitters, searchCoords, onSelectSitter }: SitterMapProps) {
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
      // Dynamically import Leaflet (avoids SSR issues)
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
        : [39.8283, -98.5795];
      const defaultZoom = searchCoords ? 11 : 4;

      map = L.map(mapRef.current!, {
        center: defaultCenter,
        zoom: defaultZoom,
        zoomControl: true,
      });

      mapInstanceRef.current = map;

      // OpenStreetMap tiles — no API key needed
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Custom branded marker icon
      const customIcon = L.divIcon({
        className: '',
        html: `
          <div style="
            width: 32px;
            height: 32px;
            background: #3B2410;
            border: 3px solid #C17D3C;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 2px 8px rgba(59,36,16,0.4);
          "></div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -36],
      });

      // Add markers
      markersRef.current = [];
      sitters.forEach((sitter) => {
        if (!sitter.lat || !sitter.lng) return;

        const popup = L.popup({
          maxWidth: 200,
          className: 'lumo-popup',
        }).setContent(`
          <div style="font-family: inherit; padding: 4px 2px;">
            <div style="font-weight: 800; font-size: 15px; color: #3B2410; margin-bottom: 4px;">${sitter.name}</div>
            <div style="font-size: 13px; font-weight: 600; color: #4A3E3D; margin-bottom: 2px;">$${sitter.rate_per_night} / night</div>
            ${sitter.distance !== undefined ? `<div style="font-size: 12px; color: #888; margin-bottom: 10px;">${sitter.distance.toFixed(1)} miles away</div>` : `<div style="font-size: 12px; color: #888; margin-bottom: 10px;">${sitter.city || ''}</div>`}
            <button
              id="sitter-btn-${sitter.id}"
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
            >View Profile</button>
          </div>
        `);

        const marker = L.marker([sitter.lat, sitter.lng], { icon: customIcon })
          .addTo(map)
          .bindPopup(popup);

        marker.on('click', () => {
          onSelectSitter(sitter);
        });

        marker.on('popupopen', () => {
          setTimeout(() => {
            const btn = document.getElementById(`sitter-btn-${sitter.id}`);
            if (btn) {
              btn.onclick = () => onSelectSitter(sitter);
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
  }, [isClient]);

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
      <div ref={mapRef} className="w-full h-full" />
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
