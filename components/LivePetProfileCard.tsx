'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertCircle, RefreshCw, CheckCircle2, X } from 'lucide-react';
import PetProfileCard from '@/components/PetProfileCard';

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
  const [accessStatus, setAccessStatus] = useState<'active' | 'pending' | 'denied' | 'revoked' | 'none' | null>(null);

  // Vet Add Entry Modal States
  const [activeModal, setActiveModal] = useState<'vaccination' | 'microchip' | 'chronic_condition' | 'vet_visit' | null>(null);
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
  const [visitDate, setVisitDate] = useState('');
  const [visitReason, setVisitReason] = useState('');
  const [visitWeight, setVisitWeight] = useState('');
  const [visitSummary, setVisitSummary] = useState('');
  const [visitTreatment, setVisitTreatment] = useState('');
  const [visitNextDate, setVisitNextDate] = useState('');
  const [visitFollowUp, setVisitFollowUp] = useState('');

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
        setAccessStatus('active');
      } else {
        setAccessStatus(data.status || 'denied');
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

  const handleAddMedicalEntry = async (entryType: 'vaccination' | 'microchip' | 'chronic_condition' | 'vet_visit') => {
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
    } else if (entryType === 'vet_visit') {
      if (!visitDate || !visitReason || !visitSummary) {
        setSubmitError('Visit date, reason for visit, and clinical summary are required');
        setSubmitting(false);
        return;
      }
      payloadData = {
        visit_date: visitDate,
        reason: visitReason,
        summary: visitSummary,
        weight_at_visit: visitWeight || undefined,
        treatment_administered: visitTreatment || undefined,
        next_visit_date: visitNextDate || undefined,
        follow_up_notes: visitFollowUp || undefined
      };
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
        setVisitDate(''); setVisitReason(''); setVisitWeight(''); setVisitSummary(''); setVisitTreatment(''); setVisitNextDate(''); setVisitFollowUp('');

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

  if (loading && !pet && !accessStatus) {
    return (
      <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 flex items-center justify-center gap-2 text-xs text-amber-900 font-bold">
        <RefreshCw className="w-4 h-4 animate-spin text-[#8B5E3C]" />
        Fetching live current pet profile...
      </div>
    );
  }

  if (accessStatus === 'pending') {
    return (
      <div 
        style={{ boxShadow: '0 2px 8px rgba(139, 94, 60, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)' }}
        className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-900"
      >
        <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 text-base">
          ⏳
        </div>
        <div className="flex-1 min-w-0">
          <strong className="font-extrabold text-amber-950 block text-xs mb-0.5">
            Pet Profile Access Request Pending Owner Approval
          </strong>
          <span className="text-amber-800 leading-relaxed block text-[11px]">
            A notification has been sent to the pet owner. Live profile records will unlock automatically once the owner approves access. You can still message and manage this booking normally in the meantime.
          </span>
        </div>
      </div>
    );
  }

  if (accessStatus === 'denied') {
    return (
      <div 
        style={{ boxShadow: '0 2px 8px rgba(139, 94, 60, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)' }}
        className="bg-[#FAF6F2] border border-[#DFD3C7] rounded-2xl p-4 flex items-start gap-3 text-xs text-[#5C4533]"
      >
        <div className="w-8 h-8 rounded-xl bg-[#F0E6DA] flex items-center justify-center shrink-0 text-base">
          🔒
        </div>
        <div className="flex-1 min-w-0">
          <strong className="font-extrabold text-[#2E2419] block text-xs mb-0.5">
            Profile Access Declined by Owner
          </strong>
          <span className="text-[#7A6B5E] leading-relaxed block text-[11px]">
            The pet owner chose not to share full profile records. You can still message, confirm, and complete this booking normally.
          </span>
        </div>
      </div>
    );
  }

  if (accessStatus === 'revoked') {
    return (
      <div 
        style={{ boxShadow: '0 2px 8px rgba(139, 94, 60, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)' }}
        className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-rose-900"
      >
        <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center shrink-0 text-base">
          ✕
        </div>
        <div className="flex-1 min-w-0">
          <strong className="font-extrabold text-rose-950 block text-xs mb-0.5">
            Profile Access Revoked by Owner
          </strong>
          <span className="text-rose-800 leading-relaxed block text-[11px]">
            Access to live pet profile records was revoked by the pet owner.
          </span>
        </div>
      </div>
    );
  }

  if (error && !pet) {
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

  return (
    <div className="relative">
      <PetProfileCard
        pet={pet}
        tier={isVet ? 'vet' : 'care'}
        headerTitle="Live Pet Profile"
        onAddMedicalEntry={(type) => {
          setActiveModal(type);
          setSubmitError(null);
          setSubmitSuccess(null);
        }}
      />

      {/* VET DIRECT ADD MODAL */}
      {activeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-xl w-full max-w-md overflow-hidden text-xs">
            <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white p-3.5 flex items-center justify-between">
              <span className="font-extrabold text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                Add Direct Medical Entry
              </span>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="text-blue-100 hover:text-white cursor-pointer"
              >
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

              {/* VET VISIT LOG FORM */}
              {activeModal === 'vet_visit' && (
                <div className="space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="font-bold text-gray-700 block mb-1">Visit Date *</label>
                      <input
                        type="date"
                        value={visitDate}
                        onChange={(e) => setVisitDate(e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-gray-700 block mb-1">Reason for Visit *</label>
                      <input
                        type="text"
                        placeholder="e.g. Annual Exam, Limp"
                        value={visitReason}
                        onChange={(e) => setVisitReason(e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-gray-700 block mb-1">Weight at Visit</label>
                      <input
                        type="text"
                        placeholder="e.g. 48.5 lbs"
                        value={visitWeight}
                        onChange={(e) => setVisitWeight(e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Clinical Summary & Observations *</label>
                    <textarea
                      rows={2}
                      placeholder="Brief clinical observations and findings..."
                      value={visitSummary}
                      onChange={(e) => setVisitSummary(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Treatment Administered</label>
                    <input
                      type="text"
                      placeholder="e.g. Administered 100ml SubQ fluids, Convenia injection"
                      value={visitTreatment}
                      onChange={(e) => setVisitTreatment(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-gray-700 block mb-1">Next Recommended Visit Date</label>
                      <input
                        type="date"
                        value={visitNextDate}
                        onChange={(e) => setVisitNextDate(e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-gray-700 block mb-1">Follow-Up Notes</label>
                      <input
                        type="text"
                        placeholder="e.g. Recheck incision in 10 days"
                        value={visitFollowUp}
                        onChange={(e) => setVisitFollowUp(e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              <p className="text-[10px] text-gray-500 italic bg-gray-50 p-2 rounded-lg border border-gray-200">
                ℹ️ Entry will be saved directly and tagged with <strong>"Added by [Clinic Name]"</strong>. This clinical entry is permanently verified and locked from pet owner mutation.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleAddMedicalEntry(activeModal)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-1.5 rounded-xl flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
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
