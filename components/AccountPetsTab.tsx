'use client';

import React, { useState, useEffect } from 'react';
import { PawPrint, ShieldCheck, ShieldAlert, Plus, Trash2, Edit2, Check, Clock, UserX, AlertCircle, RefreshCw, ChevronDown, ChevronUp, QrCode, Share2, Copy, Download, X, Lock, ArrowLeft } from 'lucide-react';
import PetProfileCard from '@/components/PetProfileCard';

interface VaccineRecord {
  id?: string;
  name: string;
  date_administered: string;
  expiration_date: string;
  notes?: string;
}

interface Pet {
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

interface AccessGrant {
  id: string;
  pet_id: string;
  owner_email: string;
  partner_type: 'vet' | 'daycare' | 'sitter';
  partner_id: string;
  partner_name: string;
  partner_email: string;
  status: 'active' | 'revoked' | 'dormant';
  effective_status?: 'active' | 'revoked' | 'dormant';
  granted_at: string;
  last_activity_at: string;
  owner_pets?: {
    id: string;
    pet_name: string;
    pet_type: string;
  };
}

export default function AccountPetsTab({ ownerEmail }: { ownerEmail: string }) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [grants, setGrants] = useState<AccessGrant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'pets' | 'access'>('pets');
  
  // Edit modal state
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [qrPet, setQrPet] = useState<Pet | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Prevent background page scrolling when modal is open
  useEffect(() => {
    if (showModal && editingPet) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [showModal, editingPet]);

  const fetchPetsAndGrants = async () => {
    if (!ownerEmail) return;
    setLoading(true);
    try {
      const [petsRes, grantsRes] = await Promise.all([
        fetch(`/api/petsitting/pets?email=${encodeURIComponent(ownerEmail)}`),
        fetch(`/api/pets/access?owner_email=${encodeURIComponent(ownerEmail)}`),
      ]);

      if (petsRes.ok) {
        const pData = await petsRes.json();
        setPets(pData.pets || []);
      }
      if (grantsRes.ok) {
        const gData = await grantsRes.json();
        setGrants(gData.grants || []);
      }
    } catch (err) {
      console.error('Failed to load pets and grants:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPetsAndGrants();
  }, [ownerEmail]);

  const handleOpenAdd = () => {
    setEditingPet({
      owner_email: ownerEmail,
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
    });
    setShowModal(true);
  };

  const handleSavePet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPet || !editingPet.pet_name.trim()) return;

    setSaving(true);
    try {
      const res = await fetch('/api/petsitting/pets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editingPet,
          owner_email: ownerEmail,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setEditingPet(null);
        fetchPetsAndGrants();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save pet profile');
      }
    } catch (ex: any) {
      alert('Error saving pet profile');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePet = async (petId: string) => {
    if (!confirm('Are you sure you want to delete this pet profile?')) return;
    try {
      const res = await fetch(`/api/petsitting/pets?id=${petId}&email=${encodeURIComponent(ownerEmail)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchPetsAndGrants();
      }
    } catch (ex) {
      alert('Error deleting pet');
    }
  };

  const handleRevokeOrRestore = async (accessId: string, currentStatus: string) => {
    const action = currentStatus === 'revoked' ? 'restore' : 'revoke';
    const confirmMsg = action === 'revoke'
      ? 'Revoke access for this business? They will no longer be able to view this pet profile.'
      : 'Restore active access for this business?';
    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch('/api/pets/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_id: accessId,
          owner_email: ownerEmail,
          action,
        }),
      });

      if (res.ok) {
        fetchPetsAndGrants();
      } else {
        alert('Failed to update access status');
      }
    } catch (ex) {
      alert('Error modifying access');
    }
  };

  const addVaccineRow = () => {
    if (!editingPet) return;
    const current = editingPet.vaccination_records || [];
    setEditingPet({
      ...editingPet,
      vaccination_records: [
        ...current,
        { id: Math.random().toString(36).substring(7), name: '', date_administered: '', expiration_date: '' },
      ],
    });
  };

  const removeVaccineRow = (index: number) => {
    if (!editingPet) return;
    const current = [...(editingPet.vaccination_records || [])];
    current.splice(index, 1);
    setEditingPet({ ...editingPet, vaccination_records: current });
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Sub-nav toggle */}
      <div className="flex bg-[#F5EFEB] p-1 rounded-2xl gap-1 border border-[#EBE3DC]">
        <button
          type="button"
          onClick={() => setActiveTab('pets')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'pets' ? 'bg-white text-[#191919] shadow-xs' : 'text-[#777777] hover:text-[#191919]'
          }`}
        >
          <PawPrint className="w-3.5 h-3.5 text-[#8B5E3C]" />
          My Pets ({pets.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('access')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'access' ? 'bg-white text-[#191919] shadow-xs' : 'text-[#777777] hover:text-[#191919]'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-[#63825D]" />
          Profile Access Control ({grants.filter(g => (g.effective_status || g.status) === 'active').length} Active)
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center py-10 gap-2">
          <RefreshCw className="w-6 h-6 text-[#8B5E3C] animate-spin" />
          <p className="text-xs text-gray-500 font-medium">Loading pet profile details...</p>
        </div>
      ) : activeTab === 'pets' ? (
        /* ── MY PETS TAB ── */
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-[#191919] text-base">Registered Pets</h3>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-3.5 py-2 rounded-xl bg-[#8B5E3C] hover:bg-[#734A2E] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Pet
            </button>
          </div>

          {pets.length === 0 ? (
            <div className="text-center py-10 px-4 bg-[#FAF7F2] rounded-2xl border border-dashed border-[#EAE3D9] flex flex-col items-center gap-2">
              <PawPrint className="w-8 h-8 text-amber-700/40" />
              <p className="font-bold text-gray-800 text-sm">No pets registered yet</p>
              <p className="text-xs text-gray-500 max-w-xs">Add your pet once to use seamlessly across Pet Sitting, Vet Boarding, and Daycare.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {pets.map(pet => (
                <PetProfileCard
                  key={pet.id}
                  pet={pet}
                  tier="owner"
                  collapsible={true}
                  defaultExpanded={false}
                  actions={
                    <>
                      <button
                        type="button"
                        onClick={() => { setQrPet(pet); setCopiedLink(false); }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5 text-emerald-600" /> Partner QR
                      </button>
                      <button
                        type="button"
                        onClick={() => { setEditingPet(pet); setShowModal(true); }}
                        className="px-3 py-1.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3 text-gray-500" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => pet.id && handleDeletePet(pet.id)}
                        className="px-2.5 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3 text-rose-500" />
                      </button>
                    </>
                  }
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ── PROFILE ACCESS CONTROL TAB ── */
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="font-extrabold text-[#191919] text-base">Authorized Businesses & Sitters</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Businesses gain access when you submit an inquiry or booking. Access auto-renews with new bookings, goes dormant after 6 months of inactivity, and can be revoked anytime.
            </p>
          </div>

          {grants.length === 0 ? (
            <div className="text-center py-10 px-4 bg-[#FAF7F2] rounded-2xl border border-dashed border-[#EAE3D9] flex flex-col items-center gap-2">
              <ShieldCheck className="w-8 h-8 text-emerald-600/40" />
              <p className="font-bold text-gray-800 text-sm">No active access grants</p>
              <p className="text-xs text-gray-500 max-w-xs">When you inquire or book with Vets, Daycares, or Sitters, they will appear here.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {grants.map(grant => {
                const status = grant.effective_status || grant.status;
                const petName = grant.owner_pets?.pet_name || 'Pet';
                const typeBadge = grant.partner_type === 'vet' ? '🏥 Vet Clinic (Full Access)' : grant.partner_type === 'daycare' ? '🐕 Daycare (Care Access)' : '🏡 Pet Sitter (Care Access)';

                return (
                  <div key={grant.id} className="bg-white border border-[#EEEEEE] rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-gray-900 text-sm">{grant.partner_name}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-100">
                          {typeBadge}
                        </span>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          status === 'active' ? 'bg-emerald-100 text-emerald-800' : status === 'dormant' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {status === 'active' ? '● Active' : status === 'dormant' ? '🌙 Dormant (>6mo)' : '✕ Revoked'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Pet: <strong className="text-gray-800">{petName}</strong> • Granted: {new Date(grant.granted_at).toLocaleDateString()}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRevokeOrRestore(grant.id, status)}
                      className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all self-end sm:self-center cursor-pointer ${
                        status === 'revoked'
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                          : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {status === 'revoked' ? 'Restore Access' : 'Revoke Access'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── EDIT / ADD PET FULL-SCREEN MODAL ── */}
      {showModal && editingPet && (
        <div className="fixed inset-0 z-50 bg-[#FDFAF7] flex flex-col w-full h-full overflow-hidden text-left animate-in fade-in duration-150">
          {/* Sticky Full-Screen Top Header */}
          <div className="bg-white border-b border-[#E8DDD4] px-4 sm:px-8 py-3.5 sm:py-4 flex items-center justify-between sticky top-0 z-30 shrink-0 shadow-xs">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FAF6F4] hover:bg-[#F0E6DD] border border-[#E8DDD4] text-[#4A3E3D] font-bold text-xs transition-colors cursor-pointer"
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
                  {editingPet.id ? (editingPet.pet_name ? `Edit Profile: ${editingPet.pet_name}` : 'Edit Pet Profile') : 'Add New Pet Profile'}
                </h3>
                <p className="text-xs text-gray-500 font-medium hidden sm:block">Update care instructions, routine, and medical credentials</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                form="account-pet-edit-form"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-[#8B5E3C] hover:bg-[#734A2E] text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Profile 🐾'}
              </button>
            </div>
          </div>

          {/* Full-Screen Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-10">
            <form id="account-pet-edit-form" onSubmit={handleSavePet} className="max-w-4xl mx-auto space-y-6 text-xs">
              {/* Section 1: Basic Identity & Core Information */}
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E8DDD4] shadow-xs space-y-4">
                <h4 className="font-black text-sm text-[#4A3E3D] flex items-center gap-2 border-b border-[#FAF6F4] pb-2.5">
                  <PawPrint className="w-4 h-4 text-[#8B5E3C]" /> Basic Details & Identity
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Pet Name *</label>
                    <input
                      type="text"
                      required
                      value={editingPet.pet_name}
                      onChange={e => setEditingPet({ ...editingPet, pet_name: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl focus:outline-none focus:border-[#8B5E3C] text-sm text-[#4A3E3D]"
                      placeholder="e.g. Milo"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Pet Type *</label>
                    <select
                      value={editingPet.pet_type}
                      onChange={e => setEditingPet({ ...editingPet, pet_type: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl focus:outline-none focus:border-[#8B5E3C] text-sm text-[#4A3E3D]"
                    >
                      <option value="Dog">Dog 🐶</option>
                      <option value="Cat">Cat 🐱</option>
                      <option value="Bird">Bird 🦜</option>
                      <option value="Rabbit">Rabbit 🐰</option>
                      <option value="Other">Other 🐾</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="sm:col-span-2">
                    <label className="font-bold text-gray-700 block mb-1">Breed</label>
                    <input
                      type="text"
                      value={editingPet.breed || ''}
                      onChange={e => setEditingPet({ ...editingPet, breed: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl focus:outline-none focus:border-[#8B5E3C] text-sm text-[#4A3E3D]"
                      placeholder="e.g. Golden Retriever"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Age</label>
                    <input
                      type="text"
                      value={editingPet.age || ''}
                      onChange={e => setEditingPet({ ...editingPet, age: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl focus:outline-none focus:border-[#8B5E3C] text-sm text-[#4A3E3D]"
                      placeholder="e.g. 3 years"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Weight</label>
                    <input
                      type="text"
                      value={editingPet.weight || ''}
                      onChange={e => setEditingPet({ ...editingPet, weight: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl focus:outline-none focus:border-[#8B5E3C] text-sm text-[#4A3E3D]"
                      placeholder="e.g. 50 lbs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Gender</label>
                    <select
                      value={editingPet.gender || ''}
                      onChange={e => setEditingPet({ ...editingPet, gender: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl focus:outline-none focus:border-[#8B5E3C] text-sm text-[#4A3E3D]"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div className="flex items-center pt-2 sm:pt-6">
                    <label className="flex items-center gap-2.5 text-xs font-bold text-gray-800 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={!!editingPet.spayed_neutered}
                        onChange={e => setEditingPet({ ...editingPet, spayed_neutered: e.target.checked })}
                        className="rounded text-[#8B5E3C] focus:ring-[#8B5E3C] w-4 h-4 border-[#E8DDD4]"
                      />
                      <span>Spayed / Neutered (Fixed)</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Section 2: Daily Care & Routine */}
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E8DDD4] shadow-xs space-y-4">
                <h4 className="font-black text-sm text-[#4A3E3D] flex items-center gap-2 border-b border-[#FAF6F4] pb-2.5">
                  🥣 Daily Care, Feeding & Routine
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">🥣 Feeding Schedule</label>
                    <textarea
                      rows={3}
                      value={editingPet.feeding_schedule || ''}
                      onChange={e => setEditingPet({ ...editingPet, feeding_schedule: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl focus:outline-none focus:border-[#8B5E3C] text-sm text-[#4A3E3D]"
                      placeholder="e.g. 1 cup dry kibble at 8 AM and 6 PM"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">💊 Medications & Dosing</label>
                    <textarea
                      rows={3}
                      value={editingPet.medication || ''}
                      onChange={e => setEditingPet({ ...editingPet, medication: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl focus:outline-none focus:border-[#8B5E3C] text-sm text-[#4A3E3D]"
                      placeholder="e.g. Heartgard on 1st of month, 10mg Apoquel with breakfast"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">⚠️ Allergies & Medical Warnings</label>
                    <input
                      type="text"
                      value={editingPet.allergies || ''}
                      onChange={e => setEditingPet({ ...editingPet, allergies: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl focus:outline-none focus:border-[#8B5E3C] text-sm text-[#4A3E3D]"
                      placeholder="e.g. Chicken allergy, sensitive skin"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">🧠 Behavior & Temperament Notes</label>
                    <input
                      type="text"
                      value={editingPet.behavior_notes || ''}
                      onChange={e => setEditingPet({ ...editingPet, behavior_notes: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl focus:outline-none focus:border-[#8B5E3C] text-sm text-[#4A3E3D]"
                      placeholder="e.g. Friendly with kids, anxious around storms"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Emergency & Veterinary Contacts */}
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E8DDD4] shadow-xs space-y-4">
                <h4 className="font-black text-sm text-[#4A3E3D] flex items-center gap-2 border-b border-[#FAF6F4] pb-2.5">
                  📞 Emergency Contacts & Primary Vet
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Emergency Contact Name</label>
                    <input
                      type="text"
                      value={editingPet.emergency_contact_name || ''}
                      onChange={e => setEditingPet({ ...editingPet, emergency_contact_name: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl focus:outline-none focus:border-[#8B5E3C] text-sm text-[#4A3E3D]"
                      placeholder="e.g. Jane Doe (Neighbor)"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Emergency Contact Phone</label>
                    <input
                      type="text"
                      value={editingPet.emergency_contact_phone || ''}
                      onChange={e => setEditingPet({ ...editingPet, emergency_contact_phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl focus:outline-none focus:border-[#8B5E3C] text-sm text-[#4A3E3D]"
                      placeholder="e.g. (555) 019-2834"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Primary Vet Clinic Name</label>
                    <input
                      type="text"
                      value={editingPet.vet_name || ''}
                      onChange={e => setEditingPet({ ...editingPet, vet_name: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl focus:outline-none focus:border-[#8B5E3C] text-sm text-[#4A3E3D]"
                      placeholder="e.g. Metro Animal Hospital"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Primary Vet Clinic Phone</label>
                    <input
                      type="text"
                      value={editingPet.vet_phone || ''}
                      onChange={e => setEditingPet({ ...editingPet, vet_phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl focus:outline-none focus:border-[#8B5E3C] text-sm text-[#4A3E3D]"
                      placeholder="e.g. (555) 321-7654"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Clinical Credentials & Medical Records */}
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E8DDD4] shadow-xs space-y-4">
                <h4 className="font-black text-sm text-[#4A3E3D] flex items-center gap-2 border-b border-[#FAF6F4] pb-2.5">
                  <ShieldCheck className="w-4 h-4 text-[#8B5E3C]" /> Clinical Credentials & Insurance
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Microchip Number</label>
                    <input
                      type="text"
                      value={editingPet.microchip_number || ''}
                      onChange={e => setEditingPet({ ...editingPet, microchip_number: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl focus:outline-none focus:border-[#8B5E3C] text-sm text-[#4A3E3D] font-mono"
                      placeholder="e.g. 985141000123456"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Insurance Provider</label>
                    <input
                      type="text"
                      value={editingPet.insurance_provider || ''}
                      onChange={e => setEditingPet({ ...editingPet, insurance_provider: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl focus:outline-none focus:border-[#8B5E3C] text-sm text-[#4A3E3D]"
                      placeholder="e.g. Trupanion"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Insurance Policy #</label>
                    <input
                      type="text"
                      value={editingPet.insurance_policy_number || ''}
                      onChange={e => setEditingPet({ ...editingPet, insurance_policy_number: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl focus:outline-none focus:border-[#8B5E3C] text-sm text-[#4A3E3D]"
                      placeholder="e.g. POL-987213"
                    />
                  </div>
                </div>

                {/* Vaccination Records Dynamic List */}
                <div className="space-y-3 pt-2 border-t border-[#FAF6F4]">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-900 text-xs">Vaccination Records Log</span>
                    <button
                      type="button"
                      onClick={addVaccineRow}
                      className="text-xs font-bold text-[#8B5E3C] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      + Add Vaccine Record
                    </button>
                  </div>

                  {(editingPet.vaccination_records || []).map((vax: any, vi) => (
                    <div key={vi} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-[#FAF6F4] p-3 rounded-xl border border-[#E8DDD4]">
                      <input
                        type="text"
                        placeholder="Vaccine Name (e.g. Rabies 3-Yr, DHPP)"
                        value={vax.name || vax.vaccine || ''}
                        onChange={e => {
                          const updated = [...(editingPet.vaccination_records || [])];
                          updated[vi].name = e.target.value;
                          setEditingPet({ ...editingPet, vaccination_records: updated });
                        }}
                        className="flex-1 px-3 py-2 bg-white border border-[#E8DDD4] rounded-lg text-xs"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          title="Date Administered"
                          value={vax.date_administered || ''}
                          onChange={e => {
                            const updated = [...(editingPet.vaccination_records || [])];
                            updated[vi].date_administered = e.target.value;
                            setEditingPet({ ...editingPet, vaccination_records: updated });
                          }}
                          className="px-2 py-2 bg-white border border-[#E8DDD4] rounded-lg text-xs"
                        />
                        <input
                          type="date"
                          title="Expiration Date"
                          value={vax.expiration_date || ''}
                          onChange={e => {
                            const updated = [...(editingPet.vaccination_records || [])];
                            updated[vi].expiration_date = e.target.value;
                            setEditingPet({ ...editingPet, vaccination_records: updated });
                          }}
                          className="px-2 py-2 bg-white border border-[#E8DDD4] rounded-lg text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => removeVaccineRow(vi)}
                          className="text-rose-500 hover:text-rose-700 font-bold px-2 py-1 bg-white border border-rose-200 rounded-lg cursor-pointer"
                          title="Remove Record"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 pb-12">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 rounded-xl border border-[#E8DDD4] text-gray-700 font-bold text-xs hover:bg-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-8 py-3 rounded-xl bg-[#8B5E3C] hover:bg-[#734A2E] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Profile 🐾'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── PARTNER CHECK-IN QR CODE MODAL ── */}
      {qrPet && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-base leading-tight">Partner Check-In QR Code</h3>
                  <p className="text-xs text-gray-500 font-semibold">{qrPet.pet_name} ({qrPet.pet_type})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQrPet(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col items-center text-center space-y-4 py-2">
              <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl flex flex-col items-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(`https://lumobites.net/pet-access?id=${qrPet.id}`)}`}
                  alt={`QR Code for ${qrPet.pet_name}`}
                  className="w-48 h-48 rounded-xl shadow-md border border-white"
                />
                <span className="mt-3 text-[11px] font-bold text-emerald-900 bg-emerald-100/90 px-3 py-1 rounded-full uppercase tracking-wider">
                  ID: {qrPet.id ? qrPet.id.substring(0, 8) : 'PET'}
                </span>
              </div>

              <div className="bg-amber-50 border border-amber-200/70 rounded-xl p-3 text-left w-full space-y-1">
                <div className="flex items-center gap-1.5 text-amber-900 font-extrabold text-xs">
                  <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>Restricted Access & Privacy Guard</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-snug">
                  Show this QR code at check-in with any verified Vet Clinic, Daycare, or Sitter. Unauthenticated or public scans reveal <strong>zero private owner details</strong>. Authorized partners gain temporary read-only access.
                </p>
              </div>

              <div className="w-full flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const link = `https://lumobites.net/pet-access?id=${qrPet.id}`;
                    navigator.clipboard.writeText(link);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 3000);
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-800 hover:bg-gray-50 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" /> Copied Link!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-gray-500" /> Copy Access Link
                    </>
                  )}
                </button>

                <a
                  href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(`https://lumobites.net/pet-access?id=${qrPet.id}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  download={`${qrPet.pet_name}-partner-qr.png`}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
                >
                  <Download className="w-4 h-4" /> Save High-Res QR
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

