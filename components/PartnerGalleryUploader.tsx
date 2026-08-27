'use client';

import React, { useState } from 'react';
import { Camera, Trash2, Plus, Loader2, Image as ImageIcon } from 'lucide-react';

interface PartnerGalleryUploaderProps {
  gallery: string[];
  onChange: (updatedGallery: string[]) => void;
  maxPhotos?: number;
}

export default function PartnerGalleryUploader({
  gallery,
  onChange,
  maxPhotos = 10,
}: PartnerGalleryUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [photoUrlInput, setPhotoUrlInput] = useState('');

  const currentGallery = gallery || [];

  const handleAddPhotoUrl = () => {
    const trimmed = photoUrlInput.trim();
    if (!trimmed || !trimmed.startsWith('http')) return;
    if (currentGallery.includes(trimmed)) return;
    if (currentGallery.length >= maxPhotos) return;

    onChange([...currentGallery, trimmed]);
    setPhotoUrlInput('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        if (currentGallery.length >= maxPhotos) break;
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'partner-photo');

        const res = await fetch('/api/vision', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          if (data.url && !currentGallery.includes(data.url)) {
            onChange([...currentGallery, data.url]);
          }
        }
      }
    } catch (err) {
      console.error('Gallery photo upload error:', err);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRemovePhoto = (index: number) => {
    const next = [...currentGallery];
    next.splice(index, 1);
    onChange(next);
  };

  return (
    <div className="bg-[#FAF6F2] border border-[#E2D5C8] rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-[#2E2419] flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-[#8B5E3C]" /> Facility & Care Photo Gallery
          </h3>
          <p className="text-[11px] text-[#8B7E7D]">
            Upload up to {maxPhotos} photos of your facility, play yards, rooms, and happy pets ({currentGallery.length}/{maxPhotos})
          </p>
        </div>

        <label className="bg-[#8B5E3C] hover:bg-[#734A2E] text-white text-xs font-bold py-1.5 px-3 rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5 border-none">
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          <span>Upload Photos</span>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading || currentGallery.length >= maxPhotos}
            className="hidden"
          />
        </label>
      </div>

      {/* URL Add Input */}
      <div className="flex items-center gap-2">
        <input
          type="url"
          value={photoUrlInput}
          onChange={(e) => setPhotoUrlInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPhotoUrl())}
          placeholder="Or paste an image URL (https://...)"
          className="flex-1 bg-white border border-[#E2D5C8] rounded-xl px-3 py-1.5 text-xs text-[#2E2419] focus:outline-hidden focus:border-[#8B5E3C]"
        />
        <button
          type="button"
          onClick={handleAddPhotoUrl}
          disabled={!photoUrlInput.trim() || currentGallery.length >= maxPhotos}
          className="bg-white hover:bg-[#FAF6F2] text-[#8B5E3C] border border-[#E2D5C8] font-bold px-3 py-1.5 rounded-xl text-xs cursor-pointer transition-colors"
        >
          Add
        </button>
      </div>

      {/* Photos Grid */}
      {currentGallery.length === 0 ? (
        <div className="text-center py-6 border-2 border-dashed border-[#E2D5C8] rounded-2xl bg-white/50 text-[#8B7E7D] space-y-1">
          <ImageIcon className="w-8 h-8 mx-auto opacity-40 text-[#8B5E3C]" />
          <p className="text-xs font-bold">No gallery photos uploaded yet</p>
          <p className="text-[11px]">Listings with 3+ photos receive up to 4x more owner inquiries.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {currentGallery.map((url, idx) => (
            <div
              key={url + idx}
              className="group relative aspect-4/3 rounded-xl overflow-hidden border border-[#E2D5C8] bg-gray-100 shadow-xs"
            >
              <img src={url} alt={`Gallery photo ${idx + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => handleRemovePhoto(idx)}
                className="absolute top-1.5 right-1.5 p-1.5 bg-black/70 hover:bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all cursor-pointer border-none"
                title="Remove photo"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              {idx === 0 && (
                <span className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-xs">
                  Cover
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
