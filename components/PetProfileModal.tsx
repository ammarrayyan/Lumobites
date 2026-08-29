'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { PawPrint, Plus, Trash2, ArrowLeft, AlertCircle, Camera, FolderOpen, Image as ImageIcon } from 'lucide-react';
import { useScrollLock } from '@/lib/useScrollLock';

export interface VaccineRecord {
  id?: string;
  name: string;
  date_administered: string;
  expiration_date: string;
  notes?: string;
}

export interface PetFormData {
  id?: string;
  owner_email: string;
  pet_name: string;
  pet_type: string;
  breed?: string;
  age?: string;
  weight?: string;
  gender?: string;
  spayed_neutered?: boolean;
  feeding_schedule?: string;
  medication?: string;
  behavior_notes?: string;
  vet_name?: string;
  vet_phone?: string;
  photo_url?: string;
  photo_urls?: string[];
  vaccination_records?: VaccineRecord[];
  microchip_number?: string;
  allergies?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  insurance_provider?: string;
  insurance_policy_number?: string;
}

export interface PetProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  ownerEmail: string;
  initialPet?: PetFormData | null;
  onSaved?: (savedPet: PetFormData) => void;
}

export default function PetProfileModal({
  isOpen,
  onClose,
  ownerEmail,
  initialPet,
  onSaved,
}: PetProfileModalProps) {
  // Lock background page scroll while modal is active
  useScrollLock(isOpen);

  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const [formData, setFormData] = useState<PetFormData>({
    owner_email: ownerEmail || '',
    pet_name: '',
    pet_type: 'Dog',
    breed: '',
    age: '',
    weight: '',
    gender: 'Male',
    spayed_neutered: true,
    feeding_schedule: '',
    medication: '',
    behavior_notes: '',
    vet_name: '',
    vet_phone: '',
    microchip_number: '',
    allergies: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    insurance_provider: '',
    insurance_policy_number: '',
    vaccination_records: [],
    photo_urls: [],
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync form data whenever initialPet or isOpen changes
  useEffect(() => {
    if (isOpen) {
      if (initialPet) {
        const urls = Array.isArray(initialPet.photo_urls) && initialPet.photo_urls.length > 0
          ? initialPet.photo_urls
          : initialPet.photo_url ? [initialPet.photo_url] : [];

        setFormData({
          ...initialPet,
          owner_email: initialPet.owner_email || ownerEmail,
          pet_type: initialPet.pet_type || 'Dog',
          gender: initialPet.gender || 'Male',
          spayed_neutered: initialPet.spayed_neutered !== undefined ? !!initialPet.spayed_neutered : true,
          vaccination_records: Array.isArray(initialPet.vaccination_records) ? initialPet.vaccination_records : [],
          photo_urls: urls,
        });
      } else {
        setFormData({
          owner_email: ownerEmail || '',
          pet_name: '',
          pet_type: 'Dog',
          breed: '',
          age: '',
          weight: '',
          gender: 'Male',
          spayed_neutered: true,
          feeding_schedule: '',
          medication: '',
          behavior_notes: '',
          vet_name: '',
          vet_phone: '',
          microchip_number: '',
          allergies: '',
          emergency_contact_name: '',
          emergency_contact_phone: '',
          insurance_provider: '',
          insurance_policy_number: '',
          vaccination_records: [],
          photo_urls: [],
        });
      }
      setError(null);
    }
  }, [isOpen, initialPet, ownerEmail]);

  if (!isOpen) return null;

  const addVaccineRow = () => {
    const current = formData.vaccination_records || [];
    setFormData({
      ...formData,
      vaccination_records: [
        ...current,
        { name: '', date_administered: '', expiration_date: '', notes: '' },
      ],
    });
  };

  const removeVaccineRow = (idx: number) => {
    const current = [...(formData.vaccination_records || [])];
    current.splice(idx, 1);
    setFormData({ ...formData, vaccination_records: current });
  };

  const updateVaccineRow = (idx: number, field: keyof VaccineRecord, val: string) => {
    const current = [...(formData.vaccination_records || [])];
    current[idx] = { ...current[idx], [field]: val };
    setFormData({ ...formData, vaccination_records: current });
  };

  const handlePhotoUpload = (file: File) => {
    if (!file) return;
    const currentPhotos = formData.photo_urls || [];
    if (currentPhotos.length >= 3) {
      alert('Maximum 3 photos allowed per pet.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_SIZE = 800;

        if (width > height && width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        } else if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const compressed = canvas.toDataURL('image/jpeg', 0.85);
        setFormData({
          ...formData,
          photo_urls: [...currentPhotos, compressed].slice(0, 3),
          photo_url: currentPhotos.length === 0 ? compressed : formData.photo_url,
        });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = (idx: number) => {
    const current = [...(formData.photo_urls || [])];
    current.splice(idx, 1);
    setFormData({
      ...formData,
      photo_urls: current,
      photo_url: current[0] || '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.pet_name.trim()) {
      setError('Pet name is required.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/petsitting/pets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          owner_email: ownerEmail || formData.owner_email,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const saved = data.pet || { ...formData, id: data.id || formData.id };
        if (onSaved) onSaved(saved);
        onClose();
      } else {
        setError(data.error || 'Failed to save pet profile.');
      }
    } catch (err: any) {
      setError('Network error saving pet profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (typeof window === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[200000] bg-[#F7F3EE] flex flex-col w-screen h-screen overflow-hidden text-left animate-in fade-in duration-150">
      {/* Sticky Full-Screen Top Header */}
      <div className="bg-white/95 backdrop-blur-xs border-b border-[#DFD3C7] px-4 sm:px-8 py-3.5 sm:py-4 flex items-center justify-between sticky top-0 z-30 shrink-0 shadow-xs">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FAF6F4] hover:bg-[#F0E6DD] border border-[#DFD3C7] text-[#4A3E3D] font-bold text-xs transition-colors cursor-pointer btn-gloss"
            title="Go back without saving"
          >
            <ArrowLeft className="w-4 h-4 text-[#8B5E3C]" />
            <span>Back</span>
          </button>
          <div className="w-10 h-10 rounded-2xl bg-amber-100/80 text-amber-900 flex items-center justify-center font-bold shrink-0 hidden md:flex">
            <PawPrint className="w-5 h-5 text-[#8B5E3C]" />
          </div>
          <div>
            <h3 className="font-black text-gray-900 text-base sm:text-lg leading-tight">
              {formData.id ? (formData.pet_name ? `Edit Profile: ${formData.pet_name}` : 'Edit Pet Profile') : 'Add New Pet Profile'}
            </h3>
            <p className="text-xs text-gray-500 font-medium hidden sm:block">
              Used automatically across Pet Sitting, Vet Boarding, and Daycare
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="submit"
            form="canonical-pet-profile-form"
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-[#8B5E3C] hover:bg-[#734A2E] text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 btn-gloss"
          >
            {saving ? 'Saving...' : 'Save Pet Profile 🐾'}
          </button>
        </div>
      </div>

      {/* Full-Screen Scrollable Form Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-10">
        <form id="canonical-pet-profile-form" onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6 text-xs">
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-2.5 text-rose-800 text-xs font-bold">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Basic Identity & Core Information */}
          <div 
            style={{ boxShadow: '0 2px 8px rgba(139, 94, 60, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)' }}
            className="bg-white rounded-2xl border border-[#DFD3C7] shadow-xs overflow-hidden"
          >
            <div className="bg-[#FAF5EE] px-5 py-3.5 border-b border-[#EADBCE] flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-[#2E2419] flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#F0E6DA] text-[#8B5E3C] flex items-center justify-center text-xs">
                  🐾
                </span>
                Basic Details & Identity
              </h4>
              <span className="text-[10px] font-bold text-[#8B5E3C] bg-white px-2 py-0.5 rounded-full border border-[#EADBCE]">
                Step 1 of 4
              </span>
            </div>

            <div className="p-5 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Pet Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.pet_name}
                    onChange={e => setFormData({ ...formData, pet_name: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-[#8B5E3C]"
                    placeholder="e.g. Barnaby"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Pet Type *</label>
                  <select
                    value={formData.pet_type}
                    onChange={e => setFormData({ ...formData, pet_type: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-[#8B5E3C]"
                  >
                    <option value="Dog">Dog</option>
                    <option value="Cat">Cat</option>
                    <option value="Bird">Bird</option>
                    <option value="Rabbit">Rabbit</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Breed</label>
                  <input
                    type="text"
                    value={formData.breed || ''}
                    onChange={e => setFormData({ ...formData, breed: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-[#8B5E3C]"
                    placeholder="e.g. Golden Retriever"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Age</label>
                  <input
                    type="text"
                    value={formData.age || ''}
                    onChange={e => setFormData({ ...formData, age: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-[#8B5E3C]"
                    placeholder="e.g. 3 years"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Weight</label>
                  <input
                    type="text"
                    value={formData.weight || ''}
                    onChange={e => setFormData({ ...formData, weight: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-[#8B5E3C]"
                    placeholder="e.g. 65 lbs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Gender</label>
                  <select
                    value={formData.gender || ''}
                    onChange={e => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-[#8B5E3C]"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="canonical-spayed-neutered"
                    checked={!!formData.spayed_neutered}
                    onChange={e => setFormData({ ...formData, spayed_neutered: e.target.checked })}
                    className="w-4 h-4 rounded text-[#8B5E3C] focus:ring-[#8B5E3C]"
                  />
                  <label htmlFor="canonical-spayed-neutered" className="font-bold text-gray-700 cursor-pointer">
                    Spayed / Neutered
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Care, Feeding, Medication & Behavior */}
          <div 
            style={{ boxShadow: '0 2px 8px rgba(139, 94, 60, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)' }}
            className="bg-white rounded-2xl border border-[#DFD3C7] shadow-xs overflow-hidden"
          >
            <div className="bg-[#FAF5EE] px-5 py-3.5 border-b border-[#EADBCE] flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-[#2E2419] flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#F0E6DA] text-[#8B5E3C] flex items-center justify-center text-xs">
                  🍖
                </span>
                Care Routine & Instructions
              </h4>
              <span className="text-[10px] font-bold text-[#8B5E3C] bg-white px-2 py-0.5 rounded-full border border-[#EADBCE]">
                Step 2 of 4
              </span>
            </div>

            <div className="p-5 sm:p-6 space-y-4">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Feeding Schedule & Diet</label>
                <textarea
                  rows={2}
                  value={formData.feeding_schedule || ''}
                  onChange={e => setFormData({ ...formData, feeding_schedule: e.target.value })}
                  className="w-full bg-[#FAF7F2] border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-[#8B5E3C]"
                  placeholder="e.g. 2 cups of dry kibble at 8:00 AM and 6:00 PM. Needs slow feeder bowl."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Medications & Supplements</label>
                  <textarea
                    rows={2}
                    value={formData.medication || ''}
                    onChange={e => setFormData({ ...formData, medication: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-[#8B5E3C]"
                    placeholder="e.g. 1 chewable joint supplement with breakfast."
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Allergies & Sensitivities</label>
                  <textarea
                    rows={2}
                    value={formData.allergies || ''}
                    onChange={e => setFormData({ ...formData, allergies: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-[#8B5E3C]"
                    placeholder="e.g. Chicken allergy, sensitive to loud thunderstorms."
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Behavior & Personality Notes</label>
                <textarea
                  rows={2}
                  value={formData.behavior_notes || ''}
                  onChange={e => setFormData({ ...formData, behavior_notes: e.target.value })}
                  className="w-full bg-[#FAF7F2] border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-[#8B5E3C]"
                  placeholder="e.g. Friendly with dogs, shy around new men, loves fetch, crate trained."
                />
              </div>
            </div>
          </div>

          {/* Section 3: Medical Credentials & Primary Vet */}
          <div 
            style={{ boxShadow: '0 2px 8px rgba(139, 94, 60, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)' }}
            className="bg-white rounded-2xl border border-[#DFD3C7] shadow-xs overflow-hidden"
          >
            <div className="bg-[#FAF5EE] px-5 py-3.5 border-b border-[#EADBCE] flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-[#2E2419] flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#F0E6DA] text-[#8B5E3C] flex items-center justify-center text-xs">
                  🏥
                </span>
                Medical Credentials & Veterinary Details
              </h4>
              <span className="text-[10px] font-bold text-[#8B5E3C] bg-white px-2 py-0.5 rounded-full border border-[#EADBCE]">
                Step 3 of 4
              </span>
            </div>

            <div className="p-5 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Primary Vet Clinic / Doctor</label>
                  <input
                    type="text"
                    value={formData.vet_name || ''}
                    onChange={e => setFormData({ ...formData, vet_name: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-[#8B5E3C]"
                    placeholder="e.g. Manhattan Veterinary Center"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Vet Phone Number</label>
                  <input
                    type="tel"
                    value={formData.vet_phone || ''}
                    onChange={e => setFormData({ ...formData, vet_phone: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-[#8B5E3C]"
                    placeholder="e.g. (212) 555-0199"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Microchip Number</label>
                  <input
                    type="text"
                    value={formData.microchip_number || ''}
                    onChange={e => setFormData({ ...formData, microchip_number: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-[#8B5E3C]"
                    placeholder="e.g. 985141002938475"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Pet Insurance Provider</label>
                  <input
                    type="text"
                    value={formData.insurance_provider || ''}
                    onChange={e => setFormData({ ...formData, insurance_provider: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-[#8B5E3C]"
                    placeholder="e.g. Trupanion, Healthy Paws"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Insurance Policy / Member #</label>
                  <input
                    type="text"
                    value={formData.insurance_policy_number || ''}
                    onChange={e => setFormData({ ...formData, insurance_policy_number: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-[#8B5E3C]"
                    placeholder="e.g. POL-9928124"
                  />
                </div>
              </div>

              {/* Vaccination Records Table */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-gray-700 block">Vaccination History & Records</label>
                  <button
                    type="button"
                    onClick={addVaccineRow}
                    className="text-[11px] text-[#8B5E3C] hover:text-[#734A2E] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Vaccine Row
                  </button>
                </div>

                {(!formData.vaccination_records || formData.vaccination_records.length === 0) ? (
                  <p className="text-[11px] text-gray-400 italic bg-[#FAF7F2] p-3 rounded-xl border border-dashed border-gray-200">
                    No vaccination records added yet. Tap &quot;Add Vaccine Row&quot; above to log Rabies, DHPP, Bordetella, etc.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {formData.vaccination_records.map((vac, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-[#FAF7F2] p-2.5 rounded-xl border border-gray-200 flex-wrap sm:flex-nowrap">
                        <input
                          type="text"
                          value={vac.name}
                          onChange={e => updateVaccineRow(idx, 'name', e.target.value)}
                          placeholder="Vaccine (e.g. Rabies)"
                          className="flex-1 bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-xs"
                        />
                        <input
                          type="date"
                          value={vac.date_administered}
                          onChange={e => updateVaccineRow(idx, 'date_administered', e.target.value)}
                          className="w-32 bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs"
                          title="Administered Date"
                        />
                        <input
                          type="date"
                          value={vac.expiration_date}
                          onChange={e => updateVaccineRow(idx, 'expiration_date', e.target.value)}
                          className="w-32 bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs"
                          title="Expiration / Due Date"
                        />
                        <input
                          type="text"
                          value={vac.notes || ''}
                          onChange={e => updateVaccineRow(idx, 'notes', e.target.value)}
                          placeholder="Notes"
                          className="flex-1 bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => removeVaccineRow(idx)}
                          className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 4: Emergency Contacts & Photos */}
          <div 
            style={{ boxShadow: '0 2px 8px rgba(139, 94, 60, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)' }}
            className="bg-white rounded-2xl border border-[#DFD3C7] shadow-xs overflow-hidden"
          >
            <div className="bg-[#FAF5EE] px-5 py-3.5 border-b border-[#EADBCE] flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-[#2E2419] flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#F0E6DA] text-[#8B5E3C] flex items-center justify-center text-xs">
                  📸
                </span>
                Emergency Contacts & Photos
              </h4>
              <span className="text-[10px] font-bold text-[#8B5E3C] bg-white px-2 py-0.5 rounded-full border border-[#EADBCE]">
                Step 4 of 4
              </span>
            </div>

            <div className="p-5 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Emergency Contact Name</label>
                  <input
                    type="text"
                    value={formData.emergency_contact_name || ''}
                    onChange={e => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-[#8B5E3C]"
                    placeholder="e.g. Sarah Jenkins (Friend / Co-owner)"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Emergency Contact Phone</label>
                  <input
                    type="tel"
                    value={formData.emergency_contact_phone || ''}
                    onChange={e => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-[#8B5E3C]"
                    placeholder="e.g. (555) 019-2834"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1.5 text-xs flex items-center justify-between">
                  <span>Pet Photos (Up to 3)</span>
                  <span className="text-[10px] text-[#8B5E3C] font-semibold">
                    {formData.photo_urls?.length || 0}/3 uploaded
                  </span>
                </label>

                {/* Photo Previews Grid */}
                <div className="flex items-center gap-3 flex-wrap pt-1 mb-3">
                  {(formData.photo_urls || []).map((url, i) => (
                    <div key={i} className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-[#DFD3C7] shadow-xs bg-[#FAF6F4]">
                      <img src={url} alt={`Pet preview ${i + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        className="absolute top-1.5 right-1.5 w-7 h-7 bg-black/75 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors cursor-pointer border-none shadow-sm"
                        title="Remove photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {(!formData.photo_urls || formData.photo_urls.length === 0) && (
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-[#FAF6F2] border-2 border-dashed border-[#DFD3C7] flex flex-col items-center justify-center text-stone-400 gap-1">
                      <ImageIcon className="w-6 h-6 text-[#8B5E3C]/60" />
                      <span className="text-[10px] font-bold">No photos yet</span>
                    </div>
                  )}
                </div>

                {/* Large Ergonomic Touch Buttons for Mobile/Desktop */}
                {(!formData.photo_urls || formData.photo_urls.length < 3) ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      className="min-h-[48px] px-4 py-3 bg-[#FAF6F4] hover:bg-[#F0E6DD] border-2 border-[#DFD3C7] text-[#4A3E3D] font-bold text-xs rounded-2xl flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-all shadow-2xs"
                    >
                      <FolderOpen className="w-4 h-4 text-[#8B5E3C]" />
                      <span>Choose from Gallery</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="min-h-[48px] px-4 py-3 bg-[#FAF6F4] hover:bg-[#F0E6DD] border-2 border-[#DFD3C7] text-[#4A3E3D] font-bold text-xs rounded-2xl flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-all shadow-2xs"
                    >
                      <Camera className="w-4 h-4 text-[#8B5E3C]" />
                      <span>Take Photo</span>
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-[#8B7E7D] italic bg-[#FAF6F4] p-2.5 rounded-xl border border-[#DFD3C7]">
                    Maximum of 3 pet photos reached. Remove an existing photo to upload a new one.
                  </p>
                )}

                {/* Hidden Native File Inputs */}
                <input
                  type="file"
                  ref={galleryInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handlePhotoUpload(file);
                    e.target.value = '';
                  }}
                />
                <input
                  type="file"
                  ref={cameraInputRef}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handlePhotoUpload(file);
                    e.target.value = '';
                  }}
                />
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
