'use client';

import React from 'react';
import {
  PawPrint,
  ShieldCheck,
  Lock,
  AlertTriangle,
  FileText,
  Stethoscope,
  Phone,
  Syringe,
  Tag,
  Plus,
  HeartPulse,
} from 'lucide-react';
import PetPhotoCarousel from '@/components/PetPhotoCarousel';

export interface VaccineRecord {
  id?: string;
  name?: string;
  vaccine?: string;
  date_administered?: string;
  expiration_date?: string;
  added_by?: string;
  notes?: string;
}

export interface ChronicCondition {
  condition: string;
  date_diagnosed?: string;
  date_added?: string;
  added_by?: string;
}

export interface PetProfileData {
  id?: string;
  owner_email?: string;
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
  allergies?: string;
  vet_name?: string;
  vet_phone?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  photo_url?: string;
  photo_urls?: string[];
  microchip_number?: string;
  microchip_added_by?: string;
  insurance_provider?: string;
  insurance_policy_number?: string;
  vaccination_records?: VaccineRecord[];
  chronic_conditions?: ChronicCondition[];
}

export interface PetProfileCardProps {
  pet: PetProfileData;
  tier?: 'owner' | 'vet' | 'care' | 'admin';
  layout?: 'card' | 'compact' | 'full';
  headerTitle?: string;
  actions?: React.ReactNode;
  onAddMedicalEntry?: (entryType: 'vaccination' | 'microchip' | 'chronic_condition') => void;
  className?: string;
}

export default function PetProfileCard({
  pet,
  tier = 'care',
  layout = 'card',
  headerTitle,
  actions,
  onAddMedicalEntry,
  className = '',
}: PetProfileCardProps) {
  const isVet = tier === 'vet';
  const isOwner = tier === 'owner';
  const isAdmin = tier === 'admin';
  const isCareOnly = tier === 'care';

  // Normalize photo URLs
  const photoUrls = Array.isArray(pet.photo_urls) && pet.photo_urls.filter(Boolean).length > 0
    ? pet.photo_urls
    : pet.photo_url
    ? [pet.photo_url]
    : [];

  // Parse structured medical notes if stored as JSON in behavior_notes
  let cleanBehaviorNotes = pet.behavior_notes || '';
  let parsedVaccinations: VaccineRecord[] = Array.isArray(pet.vaccination_records) ? pet.vaccination_records : [];
  let parsedMicrochip: string | undefined = pet.microchip_number;
  let parsedMicrochipAddedBy: string | undefined = pet.microchip_added_by;
  let parsedChronicConditions: ChronicCondition[] = Array.isArray(pet.chronic_conditions) ? pet.chronic_conditions : [];

  if (pet.behavior_notes && pet.behavior_notes.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(pet.behavior_notes);
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        if (Array.isArray(parsed.vaccinations) && parsedVaccinations.length === 0) {
          parsedVaccinations = parsed.vaccinations;
        }
        if (parsed.microchip) {
          parsedMicrochip = parsed.microchip.number || parsedMicrochip;
          parsedMicrochipAddedBy = parsed.microchip.added_by || parsedMicrochipAddedBy;
        }
        if (Array.isArray(parsed.chronic_conditions) && parsedChronicConditions.length === 0) {
          parsedChronicConditions = parsed.chronic_conditions;
        }
        cleanBehaviorNotes = parsed.notes || parsed.text || '';
      }
    } catch {
      // Plain text behavior note
    }
  }

  // Subtitle items: Breed • Age • Gender • Weight • Spayed/Neutered
  const subtitleParts: string[] = [];
  if (pet.breed) subtitleParts.push(pet.breed);
  if (pet.age) subtitleParts.push(pet.age);
  if (pet.gender) subtitleParts.push(pet.gender);
  if (pet.weight) subtitleParts.push(pet.weight.toLowerCase().includes('lb') ? pet.weight : `${pet.weight} lbs`);
  if (pet.spayed_neutered !== undefined) {
    subtitleParts.push(pet.spayed_neutered ? 'Spayed/Neutered' : 'Intact');
  }

  const defaultHeaderTitle = headerTitle || (
    isVet ? 'Live Medical Profile' :
    isOwner ? 'Pet Profile' :
    isCareOnly ? 'Care Profile' :
    'Pet Profile'
  );

  return (
    <div
      className={`bg-white border border-[#E8DDD4] rounded-2xl shadow-xs overflow-hidden text-xs transition-all ${className}`}
    >
      {/* ── Top Header Strip ── */}
      <div className="bg-[#FAF6F4] border-b border-[#E8DDD4] px-4 py-2.5 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <PawPrint className="w-4 h-4 text-[#8B5E3C]" />
          <span className="font-extrabold text-sm text-[#4A3E3D]">
            {defaultHeaderTitle}: {pet.pet_name}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Species Badge */}
          <span className="bg-amber-100/80 text-amber-900 border border-amber-200/60 font-bold text-[10px] uppercase px-2.5 py-0.5 rounded-full">
            {pet.pet_type || 'Pet'}
          </span>

          {/* Access Tier Indicator Badge */}
          {isVet ? (
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[10px] uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" /> Full Medical Access
            </span>
          ) : isCareOnly ? (
            <span className="bg-stone-100 text-stone-700 border border-stone-200 font-bold text-[10px] uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
              <Lock className="w-3 h-3 text-stone-500" /> Care-Level Access
            </span>
          ) : null}
        </div>
      </div>

      {/* ── Main Body ── */}
      <div className="p-4 space-y-3.5">
        {/* 1. Header / Hero Row (Photo + Core Info) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
          <div className="flex items-center gap-3.5">
            <PetPhotoCarousel
              photoUrls={photoUrls}
              petType={pet.pet_type}
              className="w-16 h-16 rounded-2xl"
            />

            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-black text-base sm:text-lg text-[#191919] leading-tight">
                  {pet.pet_name}
                </h4>
                {pet.spayed_neutered && (
                  <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-md">
                    ✓ Fixed
                  </span>
                )}
              </div>

              <p className="text-xs text-gray-500 mt-0.5 font-medium">
                {subtitleParts.length > 0 ? subtitleParts.join(' • ') : 'Mixed • Details N/A'}
              </p>
            </div>
          </div>

          {/* Action buttons (Owner Edit/QR/Delete or Custom) */}
          {actions && (
            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              {actions}
            </div>
          )}
        </div>

        {/* 2. Critical Care Alerts (Allergies) */}
        {pet.allergies && (
          <div className="bg-rose-50 border border-rose-200/80 p-3 rounded-xl text-rose-950 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-extrabold text-[11px] block uppercase tracking-wider text-rose-900">
                Allergies & Medical Alerts
              </strong>
              <p className="text-xs font-semibold leading-relaxed mt-0.5">{pet.allergies}</p>
            </div>
          </div>
        )}

        {/* 3. Feeding & Medication (2-Column Grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-[#FAF6F4] p-3 rounded-xl border border-[#E8DDD4]">
          <div>
            <span className="font-bold text-gray-800 block text-[11px] mb-0.5 flex items-center gap-1">
              🥣 Feeding Schedule
            </span>
            <p className="text-gray-700 text-xs leading-relaxed">
              {pet.feeding_schedule || <span className="text-gray-400 italic">None specified</span>}
            </p>
          </div>
          <div>
            <span className="font-bold text-gray-800 block text-[11px] mb-0.5 flex items-center gap-1">
              💊 Medications & Dosing
            </span>
            <p className="text-gray-700 text-xs leading-relaxed">
              {pet.medication || <span className="text-gray-400 italic">None</span>}
            </p>
          </div>
        </div>

        {/* 4. Behavior Notes (if present) */}
        {cleanBehaviorNotes && (
          <div className="bg-stone-50 border border-stone-200/80 p-3 rounded-xl">
            <span className="font-bold text-gray-800 block text-[11px] mb-0.5 flex items-center gap-1">
              🧠 Behavior & Temperament Notes
            </span>
            <p className="text-gray-700 text-xs leading-relaxed">{cleanBehaviorNotes}</p>
          </div>
        )}

        {/* 5. Emergency Contact & Primary Vet (2-Column Grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Emergency Contact */}
          {(pet.emergency_contact_name || pet.emergency_contact_phone) ? (
            <div className="bg-emerald-50/70 border border-emerald-200/80 p-2.5 rounded-xl text-emerald-950">
              <span className="font-extrabold block text-[11px] text-emerald-900">
                📞 Emergency Contact
              </span>
              <p className="text-xs font-semibold mt-0.5">
                {pet.emergency_contact_name || 'Owner / Emergency Contact'}
              </p>
              {pet.emergency_contact_phone && (
                <a
                  href={`tel:${pet.emergency_contact_phone}`}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:underline mt-0.5"
                >
                  <Phone className="w-3 h-3" /> {pet.emergency_contact_phone}
                </a>
              )}
            </div>
          ) : (
            <div className="bg-stone-50 border border-stone-200/60 p-2.5 rounded-xl text-gray-400 text-[11px] italic">
              No emergency contact on file
            </div>
          )}

          {/* Primary Vet Contact */}
          {(pet.vet_name || pet.vet_phone) ? (
            <div className="bg-blue-50/60 border border-blue-200/70 p-2.5 rounded-xl text-blue-950">
              <span className="font-extrabold block text-[11px] text-blue-900">
                🏥 Primary Vet Clinic
              </span>
              <p className="text-xs font-semibold mt-0.5">{pet.vet_name || 'Clinic on file'}</p>
              {pet.vet_phone && (
                <a
                  href={`tel:${pet.vet_phone}`}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:underline mt-0.5"
                >
                  <Phone className="w-3 h-3" /> {pet.vet_phone}
                </a>
              )}
            </div>
          ) : (
            <div className="bg-stone-50 border border-stone-200/60 p-2.5 rounded-xl text-gray-400 text-[11px] italic">
              No primary vet info on file
            </div>
          )}
        </div>

        {/* 6. Medical Credentials & Veterinary Records (Vet / Owner / Admin Tier Only) */}
        {(isVet || isOwner || isAdmin) ? (
          <div className="bg-blue-50/40 border border-blue-200/80 p-3.5 rounded-xl space-y-3 text-blue-950">
            <div className="flex items-center justify-between border-b border-blue-200/60 pb-2">
              <span className="font-extrabold text-xs flex items-center gap-1.5 text-blue-900">
                <Stethoscope className="w-4 h-4 text-blue-700" />
                Medical & Clinical Credentials
              </span>
              {isVet && (
                <span className="text-[10px] font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full">
                  Direct Edit Enabled
                </span>
              )}
            </div>

            {/* Microchip & Insurance Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Microchip */}
              <div className="bg-white p-2.5 rounded-xl border border-blue-100">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[11px] text-gray-800 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-blue-600" /> Microchip Number:
                  </span>
                  {isVet && onAddMedicalEntry && (
                    <button
                      type="button"
                      onClick={() => onAddMedicalEntry('microchip')}
                      className="bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-[10px] px-2 py-0.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Edit
                    </button>
                  )}
                </div>
                <p className="text-xs font-black text-gray-900 mt-1 font-mono">
                  {parsedMicrochip || <span className="text-gray-400 font-normal italic font-sans">No microchip recorded</span>}
                </p>
                {parsedMicrochipAddedBy && (
                  <span className="inline-block mt-1 text-[9px] font-bold bg-blue-50 text-blue-800 border border-blue-200/60 px-1.5 py-0.5 rounded-md">
                    🏷️ {parsedMicrochipAddedBy}
                  </span>
                )}
              </div>

              {/* Insurance */}
              <div className="bg-white p-2.5 rounded-xl border border-blue-100">
                <span className="font-bold text-[11px] text-gray-800 block">
                  🛡️ Pet Insurance:
                </span>
                <p className="text-xs font-black text-gray-900 mt-1">
                  {pet.insurance_provider ? (
                    <>
                      {pet.insurance_provider}
                      {pet.insurance_policy_number && (
                        <span className="text-gray-500 font-normal text-[11px] block">
                          Policy #{pet.insurance_policy_number}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-gray-400 font-normal italic">None specified</span>
                  )}
                </p>
              </div>
            </div>

            {/* Vaccination Records */}
            <div className="bg-white p-2.5 rounded-xl border border-blue-100">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-[11px] text-gray-800 flex items-center gap-1">
                  <Syringe className="w-3.5 h-3.5 text-blue-600" /> Vaccination Records:
                </span>
                {isVet && onAddMedicalEntry && (
                  <button
                    type="button"
                    onClick={() => onAddMedicalEntry('vaccination')}
                    className="bg-blue-600 text-white hover:bg-blue-700 font-bold text-[10px] px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Add Vaccine
                  </button>
                )}
              </div>

              {parsedVaccinations.length > 0 ? (
                <div className="space-y-1.5 mt-2">
                  {parsedVaccinations.map((vax, i) => (
                    <div key={i} className="bg-stone-50 p-2 rounded-lg border border-stone-200/70 text-[11px]">
                      <div className="flex items-center justify-between font-bold text-gray-900">
                        <span>{vax.name || vax.vaccine}</span>
                        <span className="text-[10px] text-gray-500 font-medium">
                          Exp: {vax.expiration_date || 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-gray-600 mt-0.5">
                        <span>Administered: {vax.date_administered || 'N/A'}</span>
                        {vax.added_by && (
                          <span className="font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.2 rounded-md">
                            {vax.added_by}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-gray-400 italic mt-1">No vaccination records entered.</p>
              )}
            </div>

            {/* Chronic Conditions & Diagnoses */}
            {(isVet || parsedChronicConditions.length > 0) && (
              <div className="bg-white p-2.5 rounded-xl border border-blue-100">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-[11px] text-gray-800 flex items-center gap-1">
                    <HeartPulse className="w-3.5 h-3.5 text-blue-600" /> Chronic Conditions & Diagnoses:
                  </span>
                  {isVet && onAddMedicalEntry && (
                    <button
                      type="button"
                      onClick={() => onAddMedicalEntry('chronic_condition')}
                      className="bg-blue-600 text-white hover:bg-blue-700 font-bold text-[10px] px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Add Diagnosis
                    </button>
                  )}
                </div>

                {parsedChronicConditions.length > 0 ? (
                  <div className="space-y-1.5 mt-2">
                    {parsedChronicConditions.map((cond, i) => (
                      <div key={i} className="bg-stone-50 p-2 rounded-lg border border-stone-200/70 text-[11px]">
                        <div className="flex items-center justify-between font-bold text-gray-900">
                          <span>{cond.condition}</span>
                          <span className="text-[10px] text-gray-500 font-medium">
                            Diagnosed: {cond.date_diagnosed || cond.date_added || 'N/A'}
                          </span>
                        </div>
                        {cond.added_by && (
                          <div className="mt-0.5">
                            <span className="font-semibold text-blue-700 bg-blue-50 border border-blue-100 text-[10px] px-1.5 py-0.2 rounded-md">
                              {cond.added_by}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-gray-400 italic mt-1">No chronic conditions recorded.</p>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Locked Medical Credentials for Care Tier (Daycare / Sitters) */
          <div className="bg-stone-100/80 border border-stone-200 p-2.5 rounded-xl text-gray-500 text-[11px] flex items-center gap-2">
            <Lock className="w-4 h-4 text-stone-400 shrink-0" />
            <span>
              <strong>Care-Level Tier:</strong> Clinical medical records (vaccine expiration logs, microchip ID, insurance policy details) are restricted to licensed Vet Clinics.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
