'use client';

import React, { useState, useEffect } from 'react';
import { PawPrint, ShieldCheck, Lock, AlertCircle, RefreshCw, Plus, Syringe, Tag, Stethoscope, CheckCircle2, X } from 'lucide-react';

interface LivePetProfileCardProps {
  petId?: string;
  partnerId: string;
  partnerType: 'vet' | 'daycare' | 'sitter';
}

export default function LivePetProfileCard({ petId, partnerId, partnerType }: LivePetProfileCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pet, setPet] = useState<any>(null);
  const [accessTier, setAccessTier] = useState<string>('');

  // Vet Add Entry Modal States
  const [activeModal, setActiveModal] = useState<'vaccination' | 'microchip' | 'chronic_condition' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Form Inputs
  const [vaxName, setVaxName] = useState('');
  const [vaxDateAdmin, setVaxDateAdmin] = useState('');
  const [vaxDateExp, setVaxDateExp] = useState('');
  const [chipNumber, setChipNumber] = useState('');
  const [conditionName, setConditionName] = useState('');
  const [conditionDate, setConditionDate] = useState('');

  const fetchLiveProfile = async () => {
    if (!petId || !partnerId || !partnerType) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/pets/live-profile?pet_id=${petId}&partner_id=${partnerId}&partner_type=${partnerType}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setPet(data.pet);
        setAccessTier(data.access_tier);
      } else {
        setError(data.error || 'Unable to fetch live pet profile');
      }
    } catch (err: any) {
      setError('Network error fetching live profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveProfile();
  }, [petId, partnerId, partnerType]);

  const handleAddMedicalEntry = async (entryType: 'vaccination' | 'microchip' | 'chronic_condition') => {
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    let payloadData: any = {};
    if (entryType === 'vaccination') {
      if (!vaxName || !vaxDateAdmin) {
        setSubmitError('Vaccine name and date administered are required');
        setSubmitting(false);
        return;
      }
      payloadData = { name: vaxName, date_administered: vaxDateAdmin, expiration_date: vaxDateExp };
    } else if (entryType === 'microchip') {
      if (!chipNumber) {
        setSubmitError('Microchip number is required');
        setSubmitting(false);
        return;
      }
      payloadData = { number: chipNumber };
    } else if (entryType === 'chronic_condition') {
      if (!conditionName) {
        setSubmitError('Condition / diagnosis name is required');
        setSubmitting(false);
        return;
      }
      payloadData = { condition: conditionName, date_diagnosed: conditionDate };
    }

    try {
      const res = await fetch('/api/pets/live-profile/add-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pet_id: petId,
          partner_id: partnerId,
          partner_type: partnerType,
          entry_type: entryType,
          data: payloadData
        })
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setSubmitSuccess(result.message || 'Record added successfully!');
        // Reset inputs
        setVaxName(''); setVaxDateAdmin(''); setVaxDateExp('');
        setChipNumber('');
        setConditionName(''); setConditionDate('');

        setTimeout(() => {
          setActiveModal(null);
          setSubmitSuccess(null);
        }, 1200);

        // Reload live profile
        fetchLiveProfile();
      } else {
        setSubmitError(result.error || 'Failed to add medical record');
      }
    } catch (err: any) {
      setSubmitError('Network error adding record');
    } finally {
      setSubmitting(false);
    }
  };

  if (!petId) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-center text-xs text-gray-500 font-medium">
        No pet profile linked to this inquiry/booking yet.
      </div>
    );
  }

  if (loading && !pet) {
    return (
      <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 flex items-center justify-center gap-2 text-xs text-amber-900 font-bold">
        <RefreshCw className="w-4 h-4 animate-spin text-[#8B5E3C]" />
        Fetching live current pet profile...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-2.5 text-xs text-rose-800">
        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-extrabold block">Live Profile Access Restricted</strong>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!pet) return null;

  const isVet = partnerType === 'vet';

  // Helper to parse structured medical JSON stored in behavior_notes
  let medicalNotes: any = { vaccinations: [], microchip: null, chronic_conditions: [] };
  if (pet.behavior_notes) {
    try {
      const parsed = JSON.parse(pet.behavior_notes);
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        medicalNotes = {
          vaccinations: Array.isArray(parsed.vaccinations) ? parsed.vaccinations : [],
          microchip: parsed.microchip || null,
          chronic_conditions: Array.isArray(parsed.chronic_conditions) ? parsed.chronic_conditions : []
        };
      }
    } catch (e) {
      // legacy string
    }
  }

  // Fallbacks for top level fields
  const microchipDisplay = medicalNotes.microchip?.number || pet.microchip_number;
  const microchipAddedBy = medicalNotes.microchip?.added_by || pet.microchip_added_by;
  const vaccinationsList = medicalNotes.vaccinations.length > 0 ? medicalNotes.vaccinations : (Array.isArray(pet.vaccination_records) ? pet.vaccination_records : []);
  const chronicConditionsList = medicalNotes.chronic_conditions || [];

  return (
    <div className="bg-white border border-amber-200/80 rounded-2xl shadow-xs overflow-hidden text-xs relative">
      {/* Header Badge */}
      <div className="bg-gradient-to-r from-amber-500 to-[#8B5E3C] text-white px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PawPrint className="w-4 h-4 text-amber-200" />
          <span className="font-extrabold text-sm">Live Pet Profile: {pet.pet_name}</span>
        </div>
        <span className="bg-white/20 backdrop-blur-xs font-bold text-[10px] uppercase px-2.5 py-0.5 rounded-full text-amber-100 flex items-center gap-1">
          {isVet ? <ShieldCheck className="w-3 h-3 text-emerald-300" /> : <Lock className="w-3 h-3 text-amber-200" />}
          {isVet ? 'Full Medical Access' : 'Care-Level Access'}
        </span>
      </div>

      <div className="p-4 space-y-3">
        {/* Core Info */}
        <div className="flex items-center gap-3">
          {pet.photo_url ? (
            <img src={pet.photo_url} alt={pet.pet_name} className="w-12 h-12 rounded-full object-cover border border-amber-200 shrink-0" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 font-black text-base flex items-center justify-center shrink-0">
              {pet.pet_name?.[0] || '🐾'}
            </div>
          )}
          <div>
            <div className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
              {pet.pet_name}
              <span className="bg-gray-100 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{pet.pet_type}</span>
            </div>
            <p className="text-gray-500 text-[11px] mt-0.5">
              {pet.breed || 'Mixed'} • {pet.age || 'N/A'} • {pet.gender || 'N/A'} • {pet.spayed_neutered ? 'Spayed/Neutered' : 'Intact'}
            </p>
          </div>
        </div>

        {/* Feeding & Medication */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-stone-50 p-3 rounded-xl border border-stone-200/60">
          <div>
            <span className="font-bold text-gray-800 block text-[11px] mb-0.5">🥣 Feeding Schedule</span>
            <p className="text-gray-600 text-[11px] leading-relaxed">{pet.feeding_schedule || 'None specified'}</p>
          </div>
          <div>
            <span className="font-bold text-gray-800 block text-[11px] mb-0.5">💊 Medications</span>
            <p className="text-gray-600 text-[11px] leading-relaxed">{pet.medication || 'None'}</p>
          </div>
        </div>

        {/* Allergies & Emergency */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {pet.allergies && (
            <div className="bg-rose-50 border border-rose-200/60 p-2.5 rounded-xl text-rose-900">
              <span className="font-extrabold block text-[11px]">⚠️ Allergies & Alerts</span>
              <p className="text-[11px]">{pet.allergies}</p>
            </div>
          )}
          {(pet.emergency_contact_name || pet.emergency_contact_phone) && (
            <div className="bg-emerald-50 border border-emerald-200/60 p-2.5 rounded-xl text-emerald-900">
              <span className="font-extrabold block text-[11px]">📞 Emergency Contact</span>
              <p className="text-[11px]">{pet.emergency_contact_name} ({pet.emergency_contact_phone || 'No phone'})</p>
            </div>
          )}
        </div>

        {/* Tier-based Medical Credentials View */}
        {isVet ? (
          <div className="bg-blue-50/60 border border-blue-200/70 p-3.5 rounded-xl space-y-3 text-blue-950">
            <div className="flex items-center justify-between border-b border-blue-200/60 pb-2">
              <span className="font-extrabold text-xs flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-700" />
                Licensed Vet Clinic Medical Portal
              </span>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full">
                Active Booking Direct Edit Enabled
              </span>
            </div>

            {/* 1. Microchip Number Section */}
            <div className="bg-white p-2.5 rounded-xl border border-blue-100">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[11px] text-gray-800 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-blue-600" />
                  Microchip Number:
                </span>
                <button
                  onClick={() => { setActiveModal('microchip'); setSubmitError(null); setSubmitSuccess(null); }}
                  className="bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-[10px] px-2 py-1 rounded-lg flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3 h-3" /> Add / Edit Microchip
                </button>
              </div>
              <p className="text-xs font-black text-gray-900 mt-1">
                {microchipDisplay || <span className="text-gray-400 font-normal italic">No microchip recorded</span>}
              </p>
              {microchipAddedBy && (
                <span className="inline-block mt-1 text-[9px] font-bold bg-blue-50 text-blue-800 border border-blue-200/60 px-2 py-0.5 rounded-md">
                  🏷️ {microchipAddedBy}
                </span>
              )}
            </div>

            {/* 2. Vaccination Records Section */}
            <div className="bg-white p-2.5 rounded-xl border border-blue-100">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-[11px] text-gray-800 flex items-center gap-1.5">
                  <Syringe className="w-3.5 h-3.5 text-blue-600" />
                  Vaccination Records:
                </span>
                <button
                  onClick={() => { setActiveModal('vaccination'); setSubmitError(null); setSubmitSuccess(null); }}
                  className="bg-blue-600 text-white hover:bg-blue-700 font-bold text-[10px] px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors shadow-xs"
                >
                  <Plus className="w-3 h-3" /> Add Vaccination
                </button>
              </div>

              {vaccinationsList.length > 0 ? (
                <div className="space-y-1.5 mt-2">
                  {vaccinationsList.map((vax: any, i: number) => (
                    <div key={i} className="bg-stone-50 p-2 rounded-lg border border-stone-200/70 text-[11px]">
                      <div className="flex items-center justify-between font-bold text-gray-900">
                        <span>{vax.name || vax.vaccine}</span>
                        <span className="text-[10px] text-gray-500 font-medium">Exp: {vax.expiration_date || 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-gray-600 mt-0.5">
                        <span>Administered: {vax.date_administered || 'N/A'}</span>
                        <span className="font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.2 rounded-md">
                          {vax.added_by || 'Added by Clinic'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-gray-400 italic mt-1">No vaccination records entered yet.</p>
              )}
            </div>

            {/* 3. Chronic Conditions / Diagnoses Section */}
            <div className="bg-white p-2.5 rounded-xl border border-blue-100">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-[11px] text-gray-800 flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                  Chronic Conditions / Diagnoses:
                </span>
                <button
                  onClick={() => { setActiveModal('chronic_condition'); setSubmitError(null); setSubmitSuccess(null); }}
                  className="bg-blue-600 text-white hover:bg-blue-700 font-bold text-[10px] px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors shadow-xs"
                >
                  <Plus className="w-3 h-3" /> Add Diagnosis
                </button>
              </div>

              {chronicConditionsList.length > 0 ? (
                <div className="space-y-1.5 mt-2">
                  {chronicConditionsList.map((cond: any, i: number) => (
                    <div key={i} className="bg-stone-50 p-2 rounded-lg border border-stone-200/70 text-[11px]">
                      <div className="flex items-center justify-between font-bold text-gray-900">
                        <span>{cond.condition}</span>
                        <span className="text-[10px] text-gray-500 font-medium">Diagnosed: {cond.date_diagnosed || cond.date_added || 'N/A'}</span>
                      </div>
                      <div className="mt-0.5">
                        <span className="font-semibold text-blue-700 bg-blue-50 border border-blue-100 text-[10px] px-1.5 py-0.2 rounded-md">
                          {cond.added_by || 'Added by Clinic'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-gray-400 italic mt-1">No chronic conditions recorded.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-stone-100/70 border border-stone-200 p-2.5 rounded-xl text-gray-500 text-[11px] flex items-center gap-2">
            <Lock className="w-4 h-4 text-stone-400 shrink-0" />
            <span>Care-Level Access: Detailed medical credentials (vaccines, microchip, insurance) are restricted to licensed Vet Clinics.</span>
          </div>
        )}
      </div>

      {/* VET DIRECT ADD MODAL */}
      {activeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-xl w-full max-w-md overflow-hidden text-xs">
            <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white p-3.5 flex items-center justify-between">
              <span className="font-extrabold text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                Add Direct Medical Entry
              </span>
              <button onClick={() => setActiveModal(null)} className="text-blue-100 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {submitSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-emerald-900 font-bold text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  {submitSuccess}
                </div>
              )}
              {submitError && (
                <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-xl text-rose-900 font-bold text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  {submitError}
                </div>
              )}

              {/* VACCINATION FORM */}
              {activeModal === 'vaccination' && (
                <div className="space-y-2.5">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Vaccine Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Rabies 3-Yr, DHPP, Bordetella"
                      value={vaxName}
                      onChange={(e) => setVaxName(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-gray-700 block mb-1">Date Administered *</label>
                      <input
                        type="date"
                        value={vaxDateAdmin}
                        onChange={(e) => setVaxDateAdmin(e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-gray-700 block mb-1">Expiration Date</label>
                      <input
                        type="date"
                        value={vaxDateExp}
                        onChange={(e) => setVaxDateExp(e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* MICROCHIP FORM */}
              {activeModal === 'microchip' && (
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Microchip Number *</label>
                  <input
                    type="text"
                    placeholder="e.g. 985141099887766"
                    value={chipNumber}
                    onChange={(e) => setChipNumber(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                </div>
              )}

              {/* CHRONIC CONDITION FORM */}
              {activeModal === 'chronic_condition' && (
                <div className="space-y-2.5">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Condition / Diagnosis Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Chronic Kidney Disease, Hip Dysplasia"
                      value={conditionName}
                      onChange={(e) => setConditionName(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Date Diagnosed</label>
                    <input
                      type="date"
                      value={conditionDate}
                      onChange={(e) => setConditionDate(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <p className="text-[10px] text-gray-500 italic bg-gray-50 p-2 rounded-lg border border-gray-200">
                ℹ️ Entry will be saved directly and tagged with <strong>"Added by [Clinic Name]"</strong>. Pet owner can view, edit, or delete if necessary.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleAddMedicalEntry(activeModal)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-1.5 rounded-xl flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {submitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Save Record
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
