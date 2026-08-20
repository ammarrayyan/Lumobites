'use client';

import React, { useState, useEffect } from 'react';
import { PawPrint, ShieldCheck, Lock, AlertCircle, RefreshCw, FileText, Phone, Shield } from 'lucide-react';

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

  useEffect(() => {
    if (!petId || !partnerId || !partnerType) return;

    let isMounted = true;
    const fetchLiveProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/pets/live-profile?pet_id=${petId}&partner_id=${partnerId}&partner_type=${partnerType}`);
        const data = await res.json();
        if (isMounted) {
          if (res.ok && data.success) {
            setPet(data.pet);
            setAccessTier(data.access_tier);
          } else {
            setError(data.error || 'Unable to fetch live pet profile');
          }
        }
      } catch (err: any) {
        if (isMounted) setError('Network error fetching live profile');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLiveProfile();
    return () => { isMounted = false; };
  }, [petId, partnerId, partnerType]);

  if (!petId) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-center text-xs text-gray-500 font-medium">
        No pet profile linked to this inquiry/booking yet.
      </div>
    );
  }

  if (loading) {
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

  return (
    <div className="bg-white border border-amber-200/80 rounded-2xl shadow-xs overflow-hidden text-xs">
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
          <div className="bg-blue-50/60 border border-blue-200/70 p-3 rounded-xl space-y-2 text-blue-950">
            <div className="flex items-center justify-between border-b border-blue-200/60 pb-1.5">
              <span className="font-extrabold text-xs flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-700" />
                Licensed Vet Clinic Credentials
              </span>
              <span className="text-[10px] font-bold text-blue-700">Microchip: {pet.microchip_number || 'N/A'}</span>
            </div>

            {pet.insurance_provider && (
              <p className="text-[11px]">
                Insurance: <strong>{pet.insurance_provider}</strong> (Policy #{pet.insurance_policy_number || 'N/A'})
              </p>
            )}

            {/* Vaccination Records Table */}
            {Array.isArray(pet.vaccination_records) && pet.vaccination_records.length > 0 ? (
              <div className="mt-2 space-y-1">
                <span className="font-bold text-[11px] block">Vaccination History:</span>
                <div className="space-y-1">
                  {pet.vaccination_records.map((vax: any, i: number) => (
                    <div key={i} className="flex items-center justify-between bg-white px-2.5 py-1 rounded-lg border border-blue-100 text-[11px]">
                      <span className="font-bold text-gray-800">{vax.name}</span>
                      <span className="text-gray-500">Administered: {vax.date_administered || 'N/A'} | Expires: {vax.expiration_date || 'N/A'}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-gray-500 italic">No vaccination records uploaded yet.</p>
            )}
          </div>
        ) : (
          <div className="bg-stone-100/70 border border-stone-200 p-2.5 rounded-xl text-gray-500 text-[11px] flex items-center gap-2">
            <Lock className="w-4 h-4 text-stone-400 shrink-0" />
            <span>Care-Level Access: Detailed medical credentials (vaccines, microchip, insurance) are restricted to licensed Vet Clinics.</span>
          </div>
        )}
      </div>
    </div>
  );
}
