'use client';

import React, { useState } from 'react';
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
  ChevronDown,
  ChevronUp,
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

export interface VetVisitRecord {
  id?: string;
  visit_date: string;
  reason: string;
  summary: string;
  weight_at_visit?: string;
  treatment_administered?: string;
  next_visit_date?: string;
  follow_up_notes?: string;
  clinic_name?: string;
  added_by?: string;
  date_added?: string;
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
  vet_visits?: VetVisitRecord[];
}

export interface PetProfileCardProps {
  pet: PetProfileData;
  tier?: 'owner' | 'vet' | 'care' | 'admin';
  layout?: 'card' | 'compact' | 'full';
  headerTitle?: string;
  actions?: React.ReactNode;
  onAddMedicalEntry?: (entryType: 'vaccination' | 'microchip' | 'vet_visit') => void;
  className?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

export default function PetProfileCard({
  pet,
  tier = 'care',
  layout = 'card',
  headerTitle,
  actions,
  onAddMedicalEntry,
  className = '',
  collapsible = false,
  defaultExpanded = false,
}: PetProfileCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
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
  let parsedVetVisits: VetVisitRecord[] = Array.isArray(pet.vet_visits) ? pet.vet_visits : [];

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
        if (Array.isArray(parsed.vet_visits) && parsedVetVisits.length === 0) {
          parsedVetVisits = parsed.vet_visits;
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

        {(!collapsible || isExpanded) && (
          <>
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

            {/* 4. Behavior & Care Instructions */}
            {cleanBehaviorNotes && (
              <div className="bg-[#FAF6F4] p-3 rounded-xl border border-[#E8DDD4]">
                <span className="font-bold text-gray-800 block text-[11px] mb-0.5 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-[#8B5E3C]" /> Behavior & Routine Notes
                </span>
                <p className="text-gray-700 text-xs leading-relaxed whitespace-pre-line">
                  {cleanBehaviorNotes}
                </p>
              </div>
            )}

            {/* 5. Emergency & Veterinary Contacts (2-Column Grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-[#FAF6F4] p-3 rounded-xl border border-[#E8DDD4]">
              <div>
                <span className="font-bold text-gray-800 block text-[11px] mb-0.5 flex items-center gap-1">
                  <Stethoscope className="w-3.5 h-3.5 text-[#8B5E3C]" /> Primary Vet
                </span>
                {pet.vet_name || pet.vet_phone ? (
                  <div className="text-gray-700 text-xs leading-tight">
                    <p className="font-semibold">{pet.vet_name || 'Veterinarian'}</p>
                    {pet.vet_phone && (
                      <p className="text-gray-500 font-mono text-[11px] mt-0.5 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-gray-400" /> {pet.vet_phone}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-400 italic text-xs">No vet specified</p>
                )}
              </div>

              <div>
                <span className="font-bold text-gray-800 block text-[11px] mb-0.5 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-rose-600" /> Emergency Contact
                </span>
                {pet.emergency_contact_name || pet.emergency_contact_phone ? (
                  <div className="text-gray-700 text-xs leading-tight">
                    <p className="font-semibold">{pet.emergency_contact_name || 'Designated Contact'}</p>
                    {pet.emergency_contact_phone && (
                      <p className="text-gray-500 font-mono text-[11px] mt-0.5 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-gray-400" /> {pet.emergency_contact_phone}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-400 italic text-xs">No emergency contact</p>
                )}
              </div>
            </div>

            {/* 6. Clinical Records & Credentials (Tier Protected: Vet, Owner, Admin) */}
            {isVet || isOwner || isAdmin ? (
              <div className="bg-emerald-50/50 border border-emerald-200/70 p-3.5 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-emerald-200/50 pb-2">
                  <span className="font-extrabold text-emerald-950 text-xs flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Clinical Records & Credentials
                  </span>
                  <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100/70 px-2 py-0.5 rounded-md">
                    {isVet ? 'Vet Clinic View' : isOwner ? 'Full Owner Access' : 'Admin Inspection'}
                  </span>
                </div>

                {/* Microchip & Insurance Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="bg-white p-2.5 rounded-lg border border-emerald-100 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-800 text-[11px] flex items-center gap-1">
                        <Tag className="w-3 h-3 text-emerald-600" /> Microchip ID
                      </span>
                      {isVet && onAddMedicalEntry && (
                        <button
                          type="button"
                          onClick={() => onAddMedicalEntry('microchip')}
                          className="text-emerald-700 hover:text-emerald-900 font-bold text-[10px] flex items-center gap-0.5 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" /> Update
                        </button>
                      )}
                    </div>
                    <p className="font-mono text-emerald-900 font-bold mt-1 text-xs">
                      {parsedMicrochip || <span className="text-gray-400 font-normal italic">None registered</span>}
                    </p>
                    {parsedMicrochipAddedBy && (
                      <p className="text-[10px] text-emerald-700 mt-0.5 font-medium">{parsedMicrochipAddedBy}</p>
                    )}
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-emerald-100 shadow-2xs">
                    <span className="font-bold text-gray-800 text-[11px] flex items-center gap-1">
                      <HeartPulse className="w-3 h-3 text-emerald-600" /> Pet Insurance
                    </span>
                    {pet.insurance_provider ? (
                      <div className="mt-1">
                        <p className="font-bold text-gray-800 text-xs">{pet.insurance_provider}</p>
                        <p className="font-mono text-gray-500 text-[10px] mt-0.5">
                          Policy #{pet.insurance_policy_number || 'N/A'}
                        </p>
                      </div>
                    ) : (
                      <p className="text-gray-400 italic mt-1 text-xs">No insurance policy logged</p>
                    )}
                  </div>
                </div>

                {/* Vaccination Records Table */}
                <div className="bg-white p-3 rounded-lg border border-emerald-100 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-extrabold text-gray-900 text-xs flex items-center gap-1.5">
                      <Syringe className="w-3.5 h-3.5 text-emerald-600" /> Vaccination History
                    </span>
                    {isVet && onAddMedicalEntry && (
                      <button
                        type="button"
                        onClick={() => onAddMedicalEntry('vaccination')}
                        className="bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-[10px] px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Add Vaccine
                      </button>
                    )}
                  </div>

                  {parsedVaccinations.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-[11px] text-left">
                        <thead>
                          <tr className="border-b border-gray-100 text-gray-400 font-semibold text-[10px] uppercase">
                            <th className="pb-1">Vaccine</th>
                            <th className="pb-1">Administered</th>
                            <th className="pb-1">Expires</th>
                            <th className="pb-1 text-right">Verified By</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {parsedVaccinations.map((vax, i) => (
                            <tr key={vax.id || i} className="hover:bg-emerald-50/30">
                              <td className="py-1.5 font-bold text-gray-900">{vax.name || vax.vaccine}</td>
                              <td className="py-1.5 text-gray-600">{vax.date_administered || 'N/A'}</td>
                              <td className="py-1.5 font-semibold text-emerald-800">{vax.expiration_date || 'N/A'}</td>
                              <td className="py-1.5 text-right font-medium text-gray-500 text-[10px]">
                                {vax.added_by ? (
                                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100">
                                    {vax.added_by}
                                  </span>
                                ) : (
                                  'Owner Log'
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-400 italic">No vaccination records on file.</p>
                  )}
                </div>

                {/* 🏥 Vet Visit History & Follow-Up Notes */}
                {(isVet || parsedVetVisits.length > 0) && (
                  <div className="bg-white p-3 rounded-lg border border-emerald-100 shadow-2xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-extrabold text-gray-900 text-xs flex items-center gap-1.5">
                        <Stethoscope className="w-3.5 h-3.5 text-emerald-600" /> Vet Visit History & Follow-Up Notes
                      </span>
                      {isVet && onAddMedicalEntry && (
                        <button
                          type="button"
                          onClick={() => onAddMedicalEntry('vet_visit')}
                          className="bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-[10px] px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                        >
                          <Plus className="w-3 h-3" /> Add Visit Log
                        </button>
                      )}
                    </div>

                    {parsedVetVisits.length > 0 ? (
                      <div className="space-y-2 mt-2">
                        {parsedVetVisits.map((visit, i) => (
                          <div key={visit.id || i} className="bg-stone-50 p-2.5 rounded-lg border border-stone-200/70 text-[11px] space-y-1.5">
                            <div className="flex items-center justify-between flex-wrap gap-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-gray-900 text-xs">{visit.reason}</span>
                                {visit.weight_at_visit && (
                                  <span className="text-[10px] font-bold text-gray-700 bg-white border border-gray-200 px-1.5 py-0.5 rounded-md">
                                    ⚖️ {visit.weight_at_visit}
                                  </span>
                                )}
                                {visit.added_by && (
                                  <span className="font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 text-[10px] px-1.5 py-0.2 rounded-md">
                                    {visit.added_by}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-gray-500 font-medium">
                                Visit: <strong>{visit.visit_date}</strong>
                              </span>
                            </div>

                            <p className="text-gray-700 leading-relaxed text-xs">
                              {visit.summary}
                            </p>

                            {visit.treatment_administered && (
                              <div className="mt-1 bg-emerald-50/80 border border-emerald-200/80 p-2 rounded-md text-emerald-950 text-[11px] flex items-start gap-1.5">
                                <span className="font-bold text-emerald-900 shrink-0">💉 Treatment:</span>
                                <span className="leading-tight text-emerald-900">{visit.treatment_administered}</span>
                              </div>
                            )}

                            {visit.next_visit_date && (
                              <div className="mt-1 bg-blue-50/90 border border-blue-200/80 px-2.5 py-1.5 rounded-md text-blue-950 text-[11px] flex items-center justify-between">
                                <span className="font-bold text-blue-900 flex items-center gap-1">
                                  📅 Next Recommended Visit:
                                </span>
                                <strong className="font-extrabold text-blue-900">{visit.next_visit_date}</strong>
                              </div>
                            )}

                            {visit.follow_up_notes && (
                              <div className="mt-1 bg-amber-50/90 border border-amber-200/80 p-2 rounded-md text-amber-950 text-[11px] flex items-start gap-1.5">
                                <span className="font-bold text-amber-900 shrink-0">⚠️ Follow-Up:</span>
                                <span className="leading-tight">{visit.follow_up_notes}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-gray-400 italic mt-1">No vet visits recorded yet.</p>
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
          </>
        )}
      </div>

      {/* ── Expand / Collapse Toggle Button (When Collapsible) ── */}
      {collapsible && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full bg-[#FAF6F4] hover:bg-[#F3ECE7] border-t border-[#E8DDD4] py-2 px-4 flex items-center justify-center gap-1.5 text-xs font-bold text-[#8B5E3C] transition-colors cursor-pointer"
        >
          {isExpanded ? (
            <>
              <span>Hide Details</span>
              <ChevronUp className="w-3.5 h-3.5" />
            </>
          ) : (
            <>
              <span>View Full Details</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      )}
    </div>
  );
}
