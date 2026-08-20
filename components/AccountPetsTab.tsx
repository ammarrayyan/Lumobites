'use client';

import React, { useState, useEffect } from 'react';
import { PawPrint, ShieldCheck, ShieldAlert, Plus, Trash2, Edit2, Check, Clock, UserX, AlertCircle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

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
            <div className="grid grid-cols-1 gap-3">
              {pets.map(pet => (
                <div key={pet.id} className="bg-white border border-[#EEEEEE] rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="flex items-center gap-3">
                    {pet.photo_url ? (
                      <img src={pet.photo_url} alt={pet.pet_name} className="w-12 h-12 rounded-full object-cover border border-amber-200 shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-amber-100/70 text-amber-800 font-black text-lg flex items-center justify-center shrink-0">
                        {pet.pet_name?.[0]?.toUpperCase() || '🐾'}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-gray-900 text-base">{pet.pet_name}</span>
                        <span className="bg-amber-100 text-amber-900 font-bold text-[10px] uppercase px-2 py-0.5 rounded-full">
                          {pet.pet_type}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {pet.breed || 'Mixed'} • {pet.age || 'Age N/A'} • {pet.gender || 'N/A'}
                      </p>
                      {pet.allergies && (
                        <span className="inline-block mt-1 text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                          ⚠️ Allergies: {pet.allergies}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => { setEditingPet(pet); setShowModal(true); }}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold text-xs flex items-center gap-1 transition-all"
                    >
                      <Edit2 className="w-3 h-3 text-gray-500" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => pet.id && handleDeletePet(pet.id)}
                      className="px-2.5 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs flex items-center gap-1 transition-all"
                    >
                      <Trash2 className="w-3 h-3 text-rose-500" />
                    </button>
                  </div>
                </div>
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

      {/* ── EDIT / ADD PET MODAL ── */}
      {showModal && editingPet && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto my-8">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-extrabold text-gray-900 text-lg flex items-center gap-2">
                <PawPrint className="w-5 h-5 text-[#8B5E3C]" />
                {editingPet.id ? 'Edit Pet Profile' : 'Add New Pet'}
              </h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-lg">✕</button>
            </div>

            <form onSubmit={handleSavePet} className="space-y-4 text-xs">
              {/* Basic Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Pet Name *</label>
                  <input
                    type="text"
                    required
                    value={editingPet.pet_name}
                    onChange={e => setEditingPet({ ...editingPet, pet_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]"
                    placeholder="e.g. Milo"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Pet Type *</label>
                  <select
                    value={editingPet.pet_type}
                    onChange={e => setEditingPet({ ...editingPet, pet_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]"
                  >
                    <option value="Dog">Dog 🐶</option>
                    <option value="Cat">Cat 🐱</option>
                    <option value="Bird">Bird 🦜</option>
                    <option value="Rabbit">Rabbit 🐰</option>
                    <option value="Other">Other 🐾</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Breed</label>
                  <input
                    type="text"
                    value={editingPet.breed || ''}
                    onChange={e => setEditingPet({ ...editingPet, breed: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                    placeholder="e.g. Golden Retriever"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Age</label>
                  <input
                    type="text"
                    value={editingPet.age || ''}
                    onChange={e => setEditingPet({ ...editingPet, age: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                    placeholder="e.g. 3 years"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Weight</label>
                  <input
                    type="text"
                    value={editingPet.weight || ''}
                    onChange={e => setEditingPet({ ...editingPet, weight: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                    placeholder="e.g. 50 lbs"
                  />
                </div>
              </div>

              {/* Care Details */}
              <div>
                <label className="font-bold text-gray-700 block mb-1">🥣 Feeding Schedule</label>
                <textarea
                  rows={2}
                  value={editingPet.feeding_schedule || ''}
                  onChange={e => setEditingPet({ ...editingPet, feeding_schedule: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                  placeholder="e.g. 1 cup dry kibble at 8am and 6pm"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">💊 Medications</label>
                <textarea
                  rows={2}
                  value={editingPet.medication || ''}
                  onChange={e => setEditingPet({ ...editingPet, medication: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                  placeholder="e.g. Heartgard on 1st of month"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">⚠️ Allergies & Medical Conditions</label>
                <input
                  type="text"
                  value={editingPet.allergies || ''}
                  onChange={e => setEditingPet({ ...editingPet, allergies: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                  placeholder="e.g. Chicken allergy, sensitive skin"
                />
              </div>

              {/* Expanded Medical & Emergency Fields */}
              <div className="bg-amber-50/60 border border-amber-100 p-3 rounded-2xl space-y-3">
                <h4 className="font-extrabold text-amber-900 text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-800" />
                  Medical & Emergency Contact (Tiered Access)
                </h4>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Microchip #</label>
                    <input
                      type="text"
                      value={editingPet.microchip_number || ''}
                      onChange={e => setEditingPet({ ...editingPet, microchip_number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white"
                      placeholder="e.g. 985141000123456"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Insurance Provider</label>
                    <input
                      type="text"
                      value={editingPet.insurance_provider || ''}
                      onChange={e => setEditingPet({ ...editingPet, insurance_provider: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white"
                      placeholder="e.g. Trupanion"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Emergency Contact Name</label>
                    <input
                      type="text"
                      value={editingPet.emergency_contact_name || ''}
                      onChange={e => setEditingPet({ ...editingPet, emergency_contact_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white"
                      placeholder="e.g. Jane Doe"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Emergency Contact Phone</label>
                    <input
                      type="text"
                      value={editingPet.emergency_contact_phone || ''}
                      onChange={e => setEditingPet({ ...editingPet, emergency_contact_phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white"
                      placeholder="e.g. (555) 019-2834"
                    />
                  </div>
                </div>

                {/* Vaccination Records */}
                <div className="space-y-2 pt-1 border-t border-amber-200/60">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-amber-950 text-xs">Vaccination Records</span>
                    <button
                      type="button"
                      onClick={addVaccineRow}
                      className="text-[11px] font-bold text-[#8B5E3C] hover:underline flex items-center gap-1"
                    >
                      + Add Vaccine
                    </button>
                  </div>

                  {(editingPet.vaccination_records || []).map((vax: any, vi) => (
                    <div key={vi} className="flex flex-col gap-1 bg-white p-2 rounded-xl border border-gray-200">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Vaccine Name (e.g. Rabies)"
                          value={vax.name || vax.vaccine || ''}
                          onChange={e => {
                            const updated = [...(editingPet.vaccination_records || [])];
                            updated[vi].name = e.target.value;
                            setEditingPet({ ...editingPet, vaccination_records: updated });
                          }}
                          className="flex-1 px-2 py-1 border border-gray-200 rounded-lg text-xs"
                        />
                        <input
                          type="date"
                          value={vax.date_administered || ''}
                          onChange={e => {
                            const updated = [...(editingPet.vaccination_records || [])];
                            updated[vi].date_administered = e.target.value;
                            setEditingPet({ ...editingPet, vaccination_records: updated });
                          }}
                          className="w-28 px-1.5 py-1 border border-gray-200 rounded-lg text-xs"
                        />
                        <button type="button" onClick={() => removeVaccineRow(vi)} className="text-rose-500 hover:text-rose-700 font-bold px-1">✕</button>
                      </div>
                      {vax.added_by && (
                        <span className="text-[9px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-md self-start">
                          🏷️ {vax.added_by}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold text-xs hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-[#8B5E3C] hover:bg-[#734A2E] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  {saving ? 'Saving...' : 'Save Profile 🐾'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

