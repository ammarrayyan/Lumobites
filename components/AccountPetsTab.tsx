'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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

  const handleAccessDecision = async (
    accessId: string,
    action: 'approve' | 'deny' | 'revoke' | 'restore',
    partnerType?: string,
    partnerName?: string
  ) => {
    let confirmMsg = '';
    if (action === 'approve') {
      confirmMsg = `Approve profile access for ${partnerName || 'this business'}? They will be able to view the profile during your booking.`;
    } else if (action === 'deny') {
      confirmMsg = `Decline profile access for ${partnerName || 'this business'}? Your booking will still proceed, but profile details won't be shared.`;
    } else if (action === 'revoke') {
      confirmMsg = `Revoke access for ${partnerName || 'this business'}? They will no longer be able to view this pet profile.`;
    } else if (action === 'restore') {
      confirmMsg = `Restore profile access for ${partnerName || 'this business'}?`;
    }

    if (confirmMsg && !confirm(confirmMsg)) return;

    try {
      const res = await fetch('/api/pets/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_id: accessId,
          partner_type: partnerType,
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

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingPet) return;
    const currentPhotos = editingPet.photo_urls || (editingPet.photo_url ? [editingPet.photo_url] : []);
    if (currentPhotos.length >= 3) {
      alert("Maximum of 3 photos reached");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        if (width > height) {
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        } else {
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', 0.8);
        const updated = [...currentPhotos, compressed].slice(0, 3);
        setEditingPet({
          ...editingPet,
          photo_urls: updated,
          photo_url: updated[0] || '',
        });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
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
          Profile Access Control
          {grants.filter(g => (g.effective_status || g.status) === 'pending').length > 0 ? (
            <span className="bg-amber-600 text-white text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse">
              {grants.filter(g => (g.effective_status || g.status) === 'pending').length} Pending
            </span>
          ) : (
            <span className="text-gray-400 font-normal">
              ({grants.filter(g => (g.effective_status || g.status) === 'active').length} Active)
            </span>
          )}
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
              className="px-3.5 py-2 rounded-xl bg-[#8B5E3C] hover:bg-[#734A2E] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer btn-gloss"
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
        <div className="flex flex-col gap-6">
          <div>
            <h3 className="font-extrabold text-[#191919] text-base">Pet Profile Access & Permissions</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Control which businesses and sitters can view your pet&apos;s records. All access requests require your explicit approval before profile details are unlocked.
            </p>
          </div>

          {/* ── 1. PENDING ACCESS REQUESTS ── */}
          {grants.filter(g => (g.effective_status || g.status) === 'pending').length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                <h4 className="font-extrabold text-amber-950 text-sm">
                  Pending Access Requests ({grants.filter(g => (g.effective_status || g.status) === 'pending').length})
                </h4>
              </div>

              <div className="flex flex-col gap-3">
                {grants
                  .filter(g => (g.effective_status || g.status) === 'pending')
                  .map(grant => {
                    const petName = grant.owner_pets?.pet_name || 'Pet';
                    const typeBadge = grant.partner_type === 'vet' ? '🏥 Vet Clinic (Full Medical Access)' : grant.partner_type === 'daycare' ? '🐕 Daycare (Care Access)' : '🏡 Pet Sitter (Care Access)';

                    return (
                      <div
                        key={grant.id}
                        style={{ boxShadow: '0 2px 8px rgba(139, 94, 60, 0.05), 0 1px 3px rgba(0, 0, 0, 0.02)' }}
                        className="bg-white border-2 border-amber-300/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-gray-900 text-sm">{grant.partner_name}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-100">
                              {typeBadge}
                            </span>
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                              ⏳ Approval Needed
                            </span>
                          </div>
                          <p className="text-xs text-gray-600">
                            Requested access to <strong className="text-gray-900">{petName}</strong>&apos;s live profile • {new Date(grant.granted_at).toLocaleDateString()}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            {grant.partner_type === 'vet'
                              ? 'Includes vaccinations, medical history, microchip, and clinical visit notes.'
                              : 'Includes feeding instructions, medication schedule, allergies, behavior notes, and emergency contacts.'}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                          <button
                            type="button"
                            onClick={() => handleAccessDecision(grant.id, 'deny', grant.partner_type, grant.partner_name)}
                            className="flex-1 sm:flex-initial px-4 py-2 rounded-xl border border-[#DFD3C7] bg-[#FAF6F2] hover:bg-[#F0E6DD] text-gray-700 font-bold text-xs transition-colors cursor-pointer text-center"
                          >
                            Decline
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAccessDecision(grant.id, 'approve', grant.partner_type, grant.partner_name)}
                            className="flex-1 sm:flex-initial px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Approve Access
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* ── 2. ACTIVE ACCESS GRANTS ── */}
          <div className="flex flex-col gap-3">
            <h4 className="font-extrabold text-[#191919] text-sm">
              Authorized Businesses & Sitters ({grants.filter(g => (g.effective_status || g.status) === 'active').length})
            </h4>

            {grants.filter(g => (g.effective_status || g.status) === 'active').length === 0 ? (
              <div className="text-center py-8 px-4 bg-[#FAF7F2] rounded-2xl border border-dashed border-[#EAE3D9] flex flex-col items-center gap-2">
                <ShieldCheck className="w-7 h-7 text-emerald-600/40" />
                <p className="font-bold text-gray-800 text-xs">No active access grants</p>
                <p className="text-[11px] text-gray-500 max-w-xs">
                  When a Vet, Daycare, or Sitter requests access for a booking, their request will appear above for your approval.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {grants
                  .filter(g => (g.effective_status || g.status) === 'active')
                  .map(grant => {
                    const petName = grant.owner_pets?.pet_name || 'Pet';
                    const typeBadge = grant.partner_type === 'vet' ? '🏥 Vet Clinic (Full Access)' : grant.partner_type === 'daycare' ? '🐕 Daycare (Care Access)' : '🏡 Pet Sitter (Care Access)';

                    return (
                      <div
                        key={grant.id}
                        style={{ boxShadow: '0 2px 8px rgba(139, 94, 60, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)' }}
                        className="bg-white border border-[#DFD3C7] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-gray-900 text-sm">{grant.partner_name}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-100">
                              {typeBadge}
                            </span>
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              ● Active
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            Pet: <strong className="text-gray-800">{petName}</strong> • Approved: {new Date(grant.granted_at).toLocaleDateString()}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAccessDecision(grant.id, 'revoke', grant.partner_type, grant.partner_name)}
                          className="px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all self-end sm:self-center cursor-pointer bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                        >
                          Revoke Access
                        </button>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* ── 3. DECLINED / REVOKED GRANTS ── */}
          {grants.filter(g => (g.effective_status || g.status) === 'revoked' || (g.effective_status || g.status) === 'denied').length > 0 && (
            <div className="flex flex-col gap-3 pt-2">
              <h4 className="font-extrabold text-gray-500 text-xs uppercase tracking-wider">
                Declined & Revoked Access ({grants.filter(g => (g.effective_status || g.status) === 'revoked' || (g.effective_status || g.status) === 'denied').length})
              </h4>

              <div className="flex flex-col gap-2.5">
                {grants
                  .filter(g => (g.effective_status || g.status) === 'revoked' || (g.effective_status || g.status) === 'denied')
                  .map(grant => {
                    const st = grant.effective_status || grant.status;
                    const petName = grant.owner_pets?.pet_name || 'Pet';
                    const typeBadge = grant.partner_type === 'vet' ? '🏥 Vet Clinic' : grant.partner_type === 'daycare' ? '🐕 Daycare' : '🏡 Pet Sitter';

                    return (
                      <div
                        key={grant.id}
                        className="bg-gray-50/80 border border-gray-200 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 opacity-80 hover:opacity-100 transition-opacity"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-gray-700 text-xs">{grant.partner_name}</span>
                            <span className="text-[10px] text-gray-500">{typeBadge}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">
                              {st === 'denied' ? 'Declined' : 'Revoked'}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500">
                            Pet: {petName}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAccessDecision(grant.id, 'restore', grant.partner_type, grant.partner_name)}
                          className="px-3 py-1.5 rounded-xl font-bold text-xs transition-all self-end sm:self-center cursor-pointer bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200"
                        >
                          Restore Access
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── EDIT / ADD PET FULL-SCREEN MODAL ── */}
      {showModal && editingPet && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] bg-[#F7F3EE] flex flex-col w-screen h-screen overflow-hidden text-left animate-in fade-in duration-150">
          {/* Sticky Full-Screen Top Header */}
          <div className="bg-white/95 backdrop-blur-xs border-b border-[#DFD3C7] px-4 sm:px-8 py-3.5 sm:py-4 flex items-center justify-between sticky top-0 z-30 shrink-0 shadow-xs">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
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
                className="px-5 py-2.5 rounded-xl bg-[#8B5E3C] hover:bg-[#734A2E] text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 btn-gloss"
              >
                {saving ? 'Saving...' : 'Save Profile 🐾'}
              </button>
            </div>
          </div>

          {/* Full-Screen Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-10">
            <form id="account-pet-edit-form" onSubmit={handleSavePet} className="max-w-4xl mx-auto space-y-6 text-xs">
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
                        value={editingPet.pet_name}
                        onChange={e => setEditingPet({ ...editingPet, pet_name: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-[#FAF6F2] border border-[#E2D5C8] rounded-xl focus:outline-none focus:border-[#8B5E3C] focus:ring-2 focus:ring-[#8B5E3C]/20 text-sm text-[#2E2419]"
                        placeholder="e.g. Milo"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-gray-700 block mb-1">Pet Type *</label>
                      <select
                        value={editingPet.pet_type}
                        onChange={e => setEditingPet({ ...editingPet, pet_type: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-[#FAF6F2] border border-[#E2D5C8] rounded-xl focus:outline-none focus:border-[#8B5E3C] focus:ring-2 focus:ring-[#8B5E3C]/20 text-sm text-[#2E2419]"
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
                        className="w-full px-3.5 py-2.5 bg-[#FAF6F2] border border-[#E2D5C8] rounded-xl focus:outline-none focus:border-[#8B5E3C] focus:ring-2 focus:ring-[#8B5E3C]/20 text-sm text-[#2E2419]"
                        placeholder="e.g. Golden Retriever"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-gray-700 block mb-1">Age</label>
                      <input
                        type="text"
                        value={editingPet.age || ''}
                        onChange={e => setEditingPet({ ...editingPet, age: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-[#FAF6F2] border border-[#E2D5C8] rounded-xl focus:outline-none focus:border-[#8B5E3C] focus:ring-2 focus:ring-[#8B5E3C]/20 text-sm text-[#2E2419]"
                        placeholder="e.g. 3 years"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-gray-700 block mb-1">Weight</label>
                      <input
                        type="text"
                        value={editingPet.weight || ''}
                        onChange={e => setEditingPet({ ...editingPet, weight: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-[#FAF6F2] border border-[#E2D5C8] rounded-xl focus:outline-none focus:border-[#8B5E3C] focus:ring-2 focus:ring-[#8B5E3C]/20 text-sm text-[#2E2419]"
                        placeholder="e.g. 45 lbs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-gray-700 block mb-1">Gender</label>
                      <select
                        value={editingPet.gender || ''}
                        onChange={e => setEditingPet({ ...editingPet, gender: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-[#FAF6F2] border border-[#E2D5C8] rounded-xl focus:outline-none focus:border-[#8B5E3C] focus:ring-2 focus:ring-[#8B5E3C]/20 text-sm text-[#2E2419]"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2 sm:pt-6">
                      <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-700">
                        <input
                          type="checkbox"
                          checked={!!editingPet.spayed_neutered}
                          onChange={e => setEditingPet({ ...editingPet, spayed_neutered: e.target.checked })}
                          className="w-4 h-4 text-[#8B5E3C] rounded-md focus:ring-[#8B5E3C]"
                        />
                        <span>Spayed / Neutered</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Care, Feeding & Routine */}
              <div 
                style={{ boxShadow: '0 2px 8px rgba(139, 94, 60, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)' }}
                className="bg-white rounded-2xl border border-[#DFD3C7] shadow-xs overflow-hidden"
              >
                <div className="bg-[#FAF5EE] px-5 py-3.5 border-b border-[#EADBCE] flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-[#2E2419] flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs">
                      🍲
                    </span>
                    Care, Routine & Feeding
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
                      value={editingPet.feeding_schedule || ''}
                      onChange={e => setEditingPet({ ...editingPet, feeding_schedule: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#FAF6F2] border border-[#E2D5C8] rounded-xl focus:outline-none focus:border-[#8B5E3C] focus:ring-2 focus:ring-[#8B5E3C]/20 text-sm text-[#2E2419] resize-none"
                      placeholder="e.g. 1 cup dry kibble at 8am and 6pm. Fresh water daily."
                    />
                  </div>

                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Medication Instructions</label>
                    <textarea
                      rows={2}
                      value={editingPet.medication || ''}
                      onChange={e => setEditingPet({ ...editingPet, medication: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#FAF6F2] border border-[#E2D5C8] rounded-xl focus:outline-none focus:border-[#8B5E3C] focus:ring-2 focus:ring-[#8B5E3C]/20 text-sm text-[#2E2419] resize-none"
                      placeholder="e.g. 1 tablet heartgard on the 1st of every month."
                    />
                  </div>

                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Behavior & Routine Notes</label>
                    <textarea
                      rows={2}
                      value={editingPet.behavior_notes || ''}
                      onChange={e => setEditingPet({ ...editingPet, behavior_notes: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#FAF6F2] border border-[#E2D5C8] rounded-xl focus:outline-none focus:border-[#8B5E3C] focus:ring-2 focus:ring-[#8B5E3C]/20 text-sm text-[#2E2419] resize-none"
                      placeholder="e.g. Loves belly rubs, scared of thunder, dog-friendly."
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Primary Vet & Emergency Contact */}
              <div 
                style={{ boxShadow: '0 2px 8px rgba(139, 94, 60, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)' }}
                className="bg-white rounded-2xl border border-[#DFD3C7] shadow-xs overflow-hidden"
              >
                <div className="bg-[#FAF5EE] px-5 py-3.5 border-b border-[#EADBCE] flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-[#2E2419] flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-900 flex items-center justify-center text-xs">
                      🏥
                    </span>
                    Primary Vet & Emergency Contacts
                  </h4>
                  <span className="text-[10px] font-bold text-[#8B5E3C] bg-white px-2 py-0.5 rounded-full border border-[#EADBCE]">
                    Step 3 of 4
                  </span>
                </div>

                <div className="p-5 sm:p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-gray-700 block mb-1">Primary Vet Clinic Name</label>
                      <input
                        type="text"
                        value={editingPet.vet_name || ''}
                        onChange={e => setEditingPet({ ...editingPet, vet_name: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-[#FAF6F2] border border-[#E2D5C8] rounded-xl focus:outline-none focus:border-[#8B5E3C] focus:ring-2 focus:ring-[#8B5E3C]/20 text-sm text-[#2E2419]"
                        placeholder="e.g. Downtown Animal Hospital"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-gray-700 block mb-1">Vet Phone Number</label>
                      <input
                        type="tel"
                        value={editingPet.vet_phone || ''}
                        onChange={e => setEditingPet({ ...editingPet, vet_phone: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-[#FAF6F2] border border-[#E2D5C8] rounded-xl focus:outline-none focus:border-[#8B5E3C] focus:ring-2 focus:ring-[#8B5E3C]/20 text-sm text-[#2E2419]"
                        placeholder="e.g. (555) 019-2834"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-gray-700 block mb-1">Emergency Contact Name</label>
                      <input
                        type="text"
                        value={editingPet.emergency_contact_name || ''}
                        onChange={e => setEditingPet({ ...editingPet, emergency_contact_name: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-[#FAF6F2] border border-[#E2D5C8] rounded-xl focus:outline-none focus:border-[#8B5E3C] focus:ring-2 focus:ring-[#8B5E3C]/20 text-sm text-[#2E2419]"
                        placeholder="e.g. Sarah Jenkins (Sister)"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-gray-700 block mb-1">Emergency Contact Phone</label>
                      <input
                        type="tel"
                        value={editingPet.emergency_contact_phone || ''}
                        onChange={e => setEditingPet({ ...editingPet, emergency_contact_phone: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-[#FAF6F2] border border-[#E2D5C8] rounded-xl focus:outline-none focus:border-[#8B5E3C] focus:ring-2 focus:ring-[#8B5E3C]/20 text-sm text-[#2E2419]"
                        placeholder="e.g. (555) 987-6543"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: Medical Credentials, Microchip & Insurance */}
              <div 
                style={{ boxShadow: '0 2px 8px rgba(139, 94, 60, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)' }}
                className="bg-white rounded-2xl border border-[#DFD3C7] shadow-xs overflow-hidden"
              >
                <div className="bg-[#FAF5EE] px-5 py-3.5 border-b border-[#EADBCE] flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-[#2E2419] flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-900 flex items-center justify-center text-xs">
                      💉
                    </span>
                    Medical Credentials, Microchip & Insurance
                  </h4>
                  <span className="text-[10px] font-bold text-[#8B5E3C] bg-white px-2 py-0.5 rounded-full border border-[#EADBCE]">
                    Step 4 of 4
                  </span>
                </div>

                <div className="p-5 sm:p-6 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-gray-700 block text-xs">Microchip #</label>
                        {editingPet.microchip_added_by &&
                         editingPet.microchip_added_by !== 'Added by Owner' &&
                         editingPet.microchip_added_by !== 'Owner Log' && (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            🔒 {editingPet.microchip_added_by}
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        disabled={
                          !!(editingPet.microchip_added_by &&
                          editingPet.microchip_added_by !== 'Added by Owner' &&
                          editingPet.microchip_added_by !== 'Owner Log' &&
                          editingPet.microchip_number)
                        }
                        value={editingPet.microchip_number || ''}
                        onChange={e => setEditingPet({ ...editingPet, microchip_number: e.target.value })}
                        className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-mono ${
                          editingPet.microchip_added_by &&
                          editingPet.microchip_added_by !== 'Added by Owner' &&
                          editingPet.microchip_added_by !== 'Owner Log' &&
                          editingPet.microchip_number
                            ? 'bg-gray-100 border border-[#E2D5C8] text-gray-700 cursor-not-allowed opacity-90'
                            : 'bg-[#FAF6F2] border border-[#E2D5C8] focus:outline-none focus:border-[#8B5E3C] focus:ring-2 focus:ring-[#8B5E3C]/20 text-[#2E2419]'
                        }`}
                        placeholder="e.g. 985141000123456"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-gray-700 block mb-1 text-xs">Insurance Provider</label>
                      <input
                        type="text"
                        value={editingPet.insurance_provider || ''}
                        onChange={e => setEditingPet({ ...editingPet, insurance_provider: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-[#FAF6F2] border border-[#E2D5C8] rounded-xl focus:outline-none focus:border-[#8B5E3C] focus:ring-2 focus:ring-[#8B5E3C]/20 text-sm text-[#2E2419]"
                        placeholder="e.g. Trupanion"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-gray-700 block mb-1 text-xs">Insurance Policy #</label>
                      <input
                        type="text"
                        value={editingPet.insurance_policy_number || ''}
                        onChange={e => setEditingPet({ ...editingPet, insurance_policy_number: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-[#FAF6F2] border border-[#E2D5C8] rounded-xl focus:outline-none focus:border-[#8B5E3C] focus:ring-2 focus:ring-[#8B5E3C]/20 text-sm text-[#2E2419]"
                        placeholder="e.g. POL-987213"
                      />
                    </div>
                  </div>

                  {/* Vaccination Records Section */}
                  <div className="space-y-3 pt-3 border-t border-[#EADBCE]">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-extrabold text-[#2E2419] text-xs block">Vaccination Records</span>
                        <span className="text-[11px] text-gray-500">Vet-verified records are locked; add your own entries below.</span>
                      </div>
                      <button
                        type="button"
                        onClick={addVaccineRow}
                        className="text-xs font-bold text-[#8B5E3C] hover:underline flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        + Add Vaccine Record
                      </button>
                    </div>

                    {/* 1. Verified Clinic Vaccines (Read-Only) */}
                    {(editingPet.vaccination_records || []).filter(
                      (v: any) => v.added_by && v.added_by !== 'Owner Log' && v.added_by !== 'Added by Owner'
                    ).length > 0 && (
                      <div className="space-y-1.5 mb-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-900 block">
                          🔒 Clinic Verified Vaccinations (Locked)
                        </span>
                        {(editingPet.vaccination_records || [])
                          .filter((v: any) => v.added_by && v.added_by !== 'Owner Log' && v.added_by !== 'Added by Owner')
                          .map((vax: any, vi: number) => (
                            <div key={vi} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-emerald-50/70 border border-emerald-200/90 p-2.5 rounded-xl text-xs">
                              <div>
                                <span className="font-bold text-gray-900">{vax.name || vax.vaccine}</span>
                                <div className="text-[11px] text-gray-600 mt-0.5">
                                  Administered: <strong>{vax.date_administered || 'N/A'}</strong> • Expires: <strong className="text-emerald-800">{vax.expiration_date || 'N/A'}</strong>
                                </div>
                              </div>
                              <span className="text-[10px] font-semibold text-emerald-800 bg-white px-2 py-0.5 rounded-md border border-emerald-200 shrink-0">
                                {vax.added_by}
                              </span>
                            </div>
                          ))}
                      </div>
                    )}

                    {/* 2. Owner Logged Vaccines (Editable) */}
                    {(editingPet.vaccination_records || []).filter(
                      (v: any) => !v.added_by || v.added_by === 'Owner Log' || v.added_by === 'Added by Owner'
                    ).length === 0 && (editingPet.vaccination_records || []).filter(
                      (v: any) => v.added_by && v.added_by !== 'Owner Log' && v.added_by !== 'Added by Owner'
                    ).length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No vaccination records logged yet.</p>
                    ) : null}

                    {(editingPet.vaccination_records || [])
                      .map((vax: any, originalIndex: number) => ({ vax, originalIndex }))
                      .filter(({ vax }) => !vax.added_by || vax.added_by === 'Owner Log' || vax.added_by === 'Added by Owner')
                      .map(({ vax, originalIndex }) => (
                        <div key={originalIndex} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-[#FAF6F2] p-3 rounded-xl border border-[#E2D5C8]">
                          <input
                            type="text"
                            placeholder="Vaccine Name (e.g. Rabies 3-Yr, DHPP)"
                            value={vax.name || vax.vaccine || ''}
                            onChange={e => {
                              const updated = [...(editingPet.vaccination_records || [])];
                              updated[originalIndex].name = e.target.value;
                              setEditingPet({ ...editingPet, vaccination_records: updated });
                            }}
                            className="flex-1 px-3 py-2 bg-white border border-[#DFD3C7] rounded-lg text-xs text-[#2E2419]"
                          />
                          <div className="flex items-center gap-2">
                            <input
                              type="date"
                              title="Date Administered"
                              value={vax.date_administered || ''}
                              onChange={e => {
                                const updated = [...(editingPet.vaccination_records || [])];
                                updated[originalIndex].date_administered = e.target.value;
                                setEditingPet({ ...editingPet, vaccination_records: updated });
                              }}
                              className="px-2 py-2 bg-white border border-[#DFD3C7] rounded-lg text-xs text-[#2E2419]"
                            />
                            <input
                              type="date"
                              title="Expiration Date"
                              value={vax.expiration_date || ''}
                              onChange={e => {
                                const updated = [...(editingPet.vaccination_records || [])];
                                updated[originalIndex].expiration_date = e.target.value;
                                setEditingPet({ ...editingPet, vaccination_records: updated });
                              }}
                              className="px-2 py-2 bg-white border border-[#DFD3C7] rounded-lg text-xs text-[#2E2419]"
                            />
                            <button
                              type="button"
                              onClick={() => removeVaccineRow(originalIndex)}
                              className="text-rose-500 hover:text-rose-700 font-bold px-2.5 py-1.5 bg-white border border-rose-200 rounded-lg cursor-pointer"
                              title="Remove Record"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* Photo upload section */}
                  <div className="pt-3 border-t border-[#EADBCE] space-y-2">
                    <label className="font-bold text-gray-700 block mb-1">Pet Photos (Up to 3)</label>
                    <div className="flex flex-wrap gap-3">
                      {(editingPet.photo_urls || (editingPet.photo_url ? [editingPet.photo_url] : [])).map((url: string, index: number) => (
                        <div key={index} className="relative w-20 h-20 rounded-2xl overflow-hidden border border-[#DFD3C7] shadow-2xs group">
                          <img src={url} alt={`Pet ${index + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => {
                              const basePhotos: string[] = (editingPet.photo_urls && editingPet.photo_urls.length > 0)
                                ? editingPet.photo_urls
                                : (editingPet.photo_url ? [editingPet.photo_url] : []);
                              const updated = basePhotos.filter((_, i) => i !== index);
                              setEditingPet({ ...editingPet, photo_urls: updated, photo_url: updated[0] || '' });
                            }}
                            className="absolute top-1 right-1 w-5 h-5 bg-rose-600 text-white rounded-full flex items-center justify-center text-xs opacity-90 hover:opacity-100 transition-opacity cursor-pointer border-none shadow-sm"
                            title="Remove photo"
                          >
                            ×
                          </button>
                        </div>
                      ))}

                      {(editingPet.photo_urls || (editingPet.photo_url ? [editingPet.photo_url] : [])).length < 3 && (
                        <label className="w-20 h-20 rounded-2xl border-2 border-dashed border-[#DFD3C7] hover:border-[#8B5E3C] bg-[#FAF6F2] hover:bg-[#F0E6DD] flex flex-col items-center justify-center cursor-pointer transition-colors text-center p-2 group">
                          <Plus className="w-5 h-5 text-[#8B5E3C] group-hover:scale-110 transition-transform" />
                          <span className="text-[10px] font-bold text-[#8B5E3C] mt-0.5">Add</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handlePhotoUpload}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Sticky Bottom Action Bar */}
          <div className="bg-white/95 backdrop-blur-md border-t border-[#DFD3C7] px-4 sm:px-8 py-3 sm:py-4 flex items-center justify-end gap-3 sticky bottom-0 z-30 shrink-0 shadow-lg">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="flex-1 sm:flex-initial px-6 py-3 rounded-xl border border-[#DFD3C7] bg-[#FAF6F2] hover:bg-[#F0E6DD] text-gray-700 font-bold text-sm transition-colors cursor-pointer text-center btn-gloss"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="account-pet-edit-form"
              disabled={saving}
              className="flex-1 sm:flex-initial px-8 py-3 rounded-xl bg-[#8B5E3C] hover:bg-[#734A2E] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-center btn-gloss"
            >
              {saving ? 'Saving...' : 'Save Profile 🐾'}
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* ── PARTNER CHECK-IN QR CODE MODAL ── */}
      {qrPet && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
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
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs btn-gloss cursor-pointer"
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
                  className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md btn-gloss cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Save High-Res QR
                </a>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
