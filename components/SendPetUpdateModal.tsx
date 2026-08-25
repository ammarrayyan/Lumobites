'use client';

import React, { useState, useRef } from 'react';
import { Camera, Utensils, Footprints, HeartPulse, Moon, Sparkles, X, Check, Loader2, Upload } from 'lucide-react';

interface SendPetUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  petName?: string;
  onSendUpdate: (update: { photo_url?: string; category: string; note: string }) => Promise<void>;
}

const CATEGORIES = [
  { id: 'Meal', label: 'Meal / Feeding', icon: Utensils, preset: 'Ate all their food and drank plenty of water!' },
  { id: 'Walk', label: 'Potty & Walk', icon: Footprints, preset: 'Had a wonderful 30-minute walk in the neighborhood.' },
  { id: 'Meds', label: 'Medication', icon: HeartPulse, preset: 'All medications administered on time.' },
  { id: 'Nap', label: 'Rest & Nap', icon: Moon, preset: 'Relaxing, cozy, and having a peaceful nap.' },
  { id: 'General', label: 'Daily Update', icon: Sparkles, preset: 'Having a great time and doing wonderfully!' },
];

export default function SendPetUpdateModal({ isOpen, onClose, petName = 'your pet', onSendUpdate }: SendPetUpdateModalProps) {
  const [selectedCategory, setSelectedCategory] = useState('Walk');
  const [note, setNote] = useState(CATEGORIES[1].preset);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleCategorySelect = (cat: typeof CATEGORIES[0]) => {
    setSelectedCategory(cat.id);
    if (!note || CATEGORIES.some(c => c.preset === note)) {
      setNote(cat.preset);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Fast image preview compression
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const scale = Math.min(1, MAX_WIDTH / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          setPhotoPreview(canvas.toDataURL('image/jpeg', 0.85));
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;

    setIsSubmitting(true);
    try {
      await onSendUpdate({
        photo_url: photoPreview || undefined,
        category: selectedCategory,
        note: note.trim(),
      });
      onClose();
      setPhotoPreview(null);
    } catch (err) {
      console.error('Failed to send update', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-[#E8DDD4] my-auto animate-modal-spring relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E8DDD4] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#8B5E3C]/10 text-[#8B5E3C] flex items-center justify-center font-bold">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#2B231D] text-base leading-tight">Send Pet Care Update</h3>
              <p className="text-[11px] text-[#8B7E7D] font-medium">Share a photo & moment with {petName}'s owner</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF6F4] text-[#4A3E3D] hover:bg-[#E8DDD4] flex items-center justify-center transition-colors cursor-pointer border border-[#E8DDD4]"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quick Activity Category Chips */}
          <div>
            <label className="block text-[11px] font-bold text-[#8B7E7D] uppercase tracking-wider mb-2">
              Activity Type
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategorySelect(cat)}
                    className={`pressable flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-[#8B5E3C] text-white border-[#8B5E3C] shadow-xs'
                        : 'bg-[#FAF6F4] text-[#4A3E3D] border-[#E8DDD4] hover:bg-[#E8DDD4]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Photo Upload Area */}
          <div>
            <label className="block text-[11px] font-bold text-[#8B7E7D] uppercase tracking-wider mb-2">
              Photo (Optional)
            </label>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handlePhotoUpload}
              className="hidden"
            />

            {photoPreview ? (
              <div className="relative rounded-2xl overflow-hidden border border-[#E8DDD4] bg-[#FAF6F4] aspect-video flex items-center justify-center group">
                <img src={photoPreview} alt="Update preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotoPreview(null)}
                  className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black transition-colors cursor-pointer"
                  title="Remove photo"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-5 px-4 border-2 border-dashed border-[#E8DDD4] rounded-2xl bg-[#FAF6F4] hover:bg-[#F5EDE4] hover:border-[#8B5E3C] transition-all flex flex-col items-center justify-center gap-1.5 text-[#8B5E3C] cursor-pointer"
              >
                <Camera className="w-6 h-6 text-[#8B5E3C]" />
                <span className="text-xs font-bold">Snap or Upload Pet Photo</span>
                <span className="text-[10px] text-gray-400">JPEG, PNG supported</span>
              </button>
            )}
          </div>

          {/* Note Input */}
          <div>
            <label className="block text-[11px] font-bold text-[#8B7E7D] uppercase tracking-wider mb-2">
              Update Note
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Write a quick update on how the stay is going..."
              className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-2xl p-3 text-xs text-[#2B231D] focus:outline-none focus:border-[#8B5E3C] focus:bg-white transition-all font-medium resize-none leading-relaxed"
              required
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-[#E8DDD4] bg-[#FAF6F4] text-[#4A3E3D] hover:bg-[#E8DDD4] font-bold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !note.trim()}
              className="pressable flex-[2] py-2.5 px-4 rounded-xl bg-[#8B5E3C] hover:bg-[#734A2E] text-white font-bold text-xs transition-all disabled:opacity-50 shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Camera className="w-3.5 h-3.5" />
                  <span>Send Update</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
