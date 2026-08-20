'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  PawPrint,
  CheckCircle2,
  AlertTriangle,
  Stethoscope,
  Building2,
  UserCheck,
  Phone,
  Calendar,
  FileText,
  Clock,
  ArrowLeft,
  ChevronRight,
  LogOut,
  Send,
} from 'lucide-react';

function PetAccessContent() {
  const searchParams = useSearchParams();
  const petId = searchParams.get('id') || searchParams.get('pet_id') || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Partner State
  const [partnerEmail, setPartnerEmail] = useState('');
  const [partnerType, setPartnerType] = useState<'vet' | 'daycare' | 'sitter'>('vet');
  const [partnerName, setPartnerName] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Manual Auth Form Input
  const [inputEmail, setInputEmail] = useState('');
  const [inputRole, setInputRole] = useState<'vet' | 'daycare' | 'sitter'>('vet');
  const [inputName, setInputName] = useState('');
  const [verifying, setVerifying] = useState(false);

  // Pet Profile State
  const [accessTier, setAccessTier] = useState<'full_vet' | 'care_level' | null>(null);
  const [pet, setPet] = useState<any>(null);
  const [grantedAt, setGrantedAt] = useState<string | null>(null);

  // Check-In Note State
  const [checkinNote, setCheckinNote] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteSuccess, setNoteSuccess] = useState(false);

  // 1. Detect existing partner login on mount
  useEffect(() => {
    try {
      const storedVet = localStorage.getItem('lumo_vet_email') || localStorage.getItem('lumo_partner_email');
      const storedDaycare = localStorage.getItem('lumo_daycare_email');
      const storedSitter = localStorage.getItem('lumo_sitter_email');

      if (storedVet) {
        setPartnerEmail(storedVet.trim().toLowerCase());
        setPartnerType('vet');
        setPartnerName(localStorage.getItem('lumo_vet_name') || 'Veterinary Partner');
        setIsAuthenticated(true);
      } else if (storedDaycare) {
        setPartnerEmail(storedDaycare.trim().toLowerCase());
        setPartnerType('daycare');
        setPartnerName(localStorage.getItem('lumo_daycare_name') || 'Daycare Facility');
        setIsAuthenticated(true);
      } else if (storedSitter) {
        setPartnerEmail(storedSitter.trim().toLowerCase());
        setPartnerType('sitter');
        setPartnerName(localStorage.getItem('lumo_sitter_name') || 'Pet Sitter');
        setIsAuthenticated(true);
      }
    } catch (e) {
      console.error('LocalStorage check failed:', e);
    }
  }, []);

  // 2. Fetch Check-In data when authenticated & petId present
  useEffect(() => {
    if (!petId) {
      setLoading(false);
      return;
    }

    if (isAuthenticated && partnerEmail) {
      fetchCheckinData(partnerEmail, partnerType, partnerName);
    } else {
      setLoading(false);
    }
  }, [petId, isAuthenticated, partnerEmail, partnerType]);

  const fetchCheckinData = async (email: string, type: 'vet' | 'daycare' | 'sitter', name?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/pets/qr-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pet_id: petId,
          partner_email: email,
          partner_type: type,
          partner_name: name || `${type.toUpperCase()} Partner (${email})`,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to verify partner access.');
      } else {
        setPet(data.pet);
        setAccessTier(data.access_tier);
        setGrantedAt(data.granted_at);
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to check-in server.');
    } finally {
      setLoading(false);
    }
  };

  const handlePartnerSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputEmail.trim()) return;

    setVerifying(true);
    const cleanEmail = inputEmail.trim().toLowerCase();
    setPartnerEmail(cleanEmail);
    setPartnerType(inputRole);
    setPartnerName(inputName.trim() || `${inputRole.toUpperCase()} Partner (${cleanEmail})`);

    // Persist login locally for convenience
    try {
      if (inputRole === 'vet') {
        localStorage.setItem('lumo_vet_email', cleanEmail);
      } else if (inputRole === 'daycare') {
        localStorage.setItem('lumo_daycare_email', cleanEmail);
      } else {
        localStorage.setItem('lumo_sitter_email', cleanEmail);
      }
    } catch (e) {}

    setIsAuthenticated(true);
    setVerifying(false);
  };

  const handlePartnerSignOut = () => {
    setIsAuthenticated(false);
    setPartnerEmail('');
    setPet(null);
    setAccessTier(null);
  };

  const handleLogCheckinVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkinNote.trim() || !pet?.id) return;

    setNoteSaving(true);
    try {
      const res = await fetch('/api/pets/live-profile/add-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pet_id: pet.id,
          partner_email: partnerEmail,
          partner_type: partnerType,
          partner_name: partnerName,
          entry_type: 'checkin_note',
          notes: checkinNote.trim(),
        }),
      });

      if (res.ok) {
        setCheckinNote('');
        setNoteSuccess(true);
        setTimeout(() => setNoteSuccess(false), 4000);
      } else {
        alert('Failed to submit check-in note');
      }
    } catch (ex) {
      alert('Error submitting check-in note');
    } finally {
      setNoteSaving(false);
    }
  };

  if (!petId) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] py-12 px-4 flex flex-col items-center justify-center text-center">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-[#EEEEEE] max-w-md w-full flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center">
            <PawPrint className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-extrabold text-gray-900">No Pet Specified</h1>
          <p className="text-xs text-gray-500 max-w-xs">
            This URL requires a valid pet QR code scanner link (e.g. <code className="bg-gray-100 px-1 py-0.5 rounded text-[11px]">/pet-access?id=123</code>).
          </p>
          <Link
            href="/"
            className="mt-2 px-5 py-2.5 rounded-xl bg-[#8B5E3C] text-white font-bold text-xs hover:bg-[#734A2E] transition-all"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] py-8 px-4 sm:px-6 flex flex-col items-center">
      {/* Header Badge */}
      <div className="w-full max-w-2xl flex items-center justify-between mb-6">
        <Link href="/" className="flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Home
        </Link>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-100/80 text-amber-900 rounded-full text-xs font-extrabold border border-amber-200">
          <ShieldCheck className="w-4 h-4 text-amber-800" />
          Lumo Partner Check-In Portal
        </div>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-2xl bg-white rounded-3xl border border-[#EBE5DF] shadow-md overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-3 border-amber-800 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-bold text-gray-600">Verifying Partner Check-In Credentials...</p>
          </div>
        ) : !isAuthenticated ? (
          /* ─────────────────────────────────────────────────────────────
             UNAUTHENTICATED / PUBLIC SCAN SCREEN (STRICT PRIVACY GUARANTEE)
             ───────────────────────────────────────────────────────────── */
          <div className="p-6 sm:p-8 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 border border-rose-100 shadow-inner">
              <Lock className="w-10 h-10" />
            </div>

            <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-900 font-extrabold text-[11px] uppercase tracking-wider mb-2">
              🔒 Licensed Partner Verification Required
            </span>

            <h2 className="text-2xl font-black text-gray-900 mb-2">Private Partner Check-In Code</h2>

            <p className="text-xs sm:text-sm text-gray-600 max-w-md mb-6 leading-relaxed">
              To protect pet owner privacy, detailed pet records and emergency care instructions are strictly restricted to verified <strong>Veterinary Clinics</strong>, <strong>Daycares</strong>, and <strong>Pet Sitters</strong>.
            </p>

            {/* Zero Privacy Leak Guarantee Banner */}
            <div className="w-full bg-[#FAF7F2] rounded-2xl p-4 border border-[#EAE2D8] mb-6 text-left flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-extrabold text-xs text-gray-900">Zero Privacy Exposure Guarantee</h4>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Unauthenticated scans reveal <strong>no owner contact info, home address, or medical history</strong>.
                </p>
              </div>
            </div>

            {/* Partner Quick Authentication Form */}
            <div className="w-full bg-white border border-[#EBE3DC] rounded-2xl p-5 text-left shadow-xs mb-6">
              <h3 className="font-extrabold text-sm text-gray-900 mb-1 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#8B5E3C]" />
                Are you an authorized Care Partner?
              </h3>
              <p className="text-xs text-gray-500 mb-4">Enter your partner credentials below to verify check-in access for this pet.</p>

              <form onSubmit={handlePartnerSignIn} className="flex flex-col gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-gray-500 mb-1">Partner Role</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setInputRole('vet')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        inputRole === 'vet'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Stethoscope className="w-3.5 h-3.5" /> Vet Clinic
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputRole('daycare')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        inputRole === 'daycare'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5" /> Daycare
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputRole('sitter')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        inputRole === 'sitter'
                          ? 'bg-amber-700 text-white border-amber-700 shadow-xs'
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <PawPrint className="w-3.5 h-3.5" /> Sitter
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-gray-500 mb-1">Partner Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="partner@clinic.com"
                    value={inputEmail}
                    onChange={e => setInputEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:ring-2 focus:ring-[#8B5E3C] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-gray-500 mb-1">Facility / Business Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Metro Vet Hospital & Boarding"
                    value={inputName}
                    onChange={e => setInputName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:ring-2 focus:ring-[#8B5E3C] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={verifying || !inputEmail.trim()}
                  className="mt-2 w-full py-3 rounded-xl bg-[#8B5E3C] hover:bg-[#734A2E] text-white font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {verifying ? 'Verifying Partner Access...' : 'Verify Partner Credentials & Check-In'}
                </button>
              </form>
            </div>

            {/* Portal Portal Links */}
            <div className="flex flex-col sm:flex-row gap-3 w-full justify-center text-xs font-bold">
              <Link href="/vet-boarding/dashboard" className="text-emerald-700 hover:underline">
                🏥 Vet Boarding Portal
              </Link>
              <span className="hidden sm:inline text-gray-300">•</span>
              <Link href="/pet-daycare/dashboard" className="text-blue-700 hover:underline">
                🐕 Daycare Partner Portal
              </Link>
              <span className="hidden sm:inline text-gray-300">•</span>
              <Link href="/petsitting" className="text-amber-800 hover:underline">
                🐾 Pet Sitter Portal
              </Link>
            </div>
          </div>
        ) : error ? (
          /* Error State */
          <div className="p-8 text-center flex flex-col items-center gap-3">
            <AlertTriangle className="w-12 h-12 text-rose-500" />
            <h3 className="text-lg font-bold text-gray-900">Check-In Access Failed</h3>
            <p className="text-xs text-gray-600 max-w-sm">{error}</p>
            <button
              type="button"
              onClick={handlePartnerSignOut}
              className="mt-3 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-bold text-gray-700 transition-all"
            >
              Try Different Partner Account
            </button>
          </div>
        ) : (
          /* ─────────────────────────────────────────────────────────────
             AUTHENTICATED PARTNER CHECK-IN VIEW
             ───────────────────────────────────────────────────────────── */
          <div className="p-6 sm:p-8 flex flex-col gap-6">
            {/* Top Partner Access Status Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAF7F2] p-4 rounded-2xl border border-[#EAE3D9]">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold ${
                  partnerType === 'vet' ? 'bg-emerald-600' : partnerType === 'daycare' ? 'bg-blue-600' : 'bg-amber-700'
                }`}>
                  {partnerType === 'vet' ? <Stethoscope className="w-5 h-5" /> : partnerType === 'daycare' ? <Building2 className="w-5 h-5" /> : <PawPrint className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs text-gray-900">{partnerName || partnerEmail}</span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      partnerType === 'vet' ? 'bg-emerald-100 text-emerald-900' : partnerType === 'daycare' ? 'bg-blue-100 text-blue-900' : 'bg-amber-100 text-amber-900'
                    }`}>
                      {partnerType} partner
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {accessTier === 'full_vet' ? '🏥 Full Veterinary Medical Access Granted' : '📋 Care-Level Access Granted'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handlePartnerSignOut}
                className="text-[11px] font-bold text-gray-500 hover:text-gray-900 flex items-center gap-1 self-end sm:self-center"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out Partner
              </button>
            </div>

            {/* Pet Main Header Card */}
            {pet && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-100 pb-6">
                <div className="flex items-center gap-4">
                  {pet.photo_url ? (
                    <img src={pet.photo_url} alt={pet.pet_name} className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-amber-200 shadow-xs" />
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-amber-100 text-amber-900 font-black text-2xl flex items-center justify-center">
                      {pet.pet_name?.[0]?.toUpperCase() || '🐾'}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl font-black text-gray-900">{pet.pet_name}</h1>
                      <span className="bg-amber-100 text-amber-900 font-extrabold text-xs uppercase px-2.5 py-0.5 rounded-full">
                        {pet.pet_type}
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 mt-1 font-medium">
                      {pet.breed || 'Mixed'} • {pet.age || 'Age N/A'} • {pet.gender || 'N/A'} • {pet.spayed_neutered ? 'Spayed/Neutered' : 'Intact'}
                    </p>

                    {pet.weight && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        Weight: <strong className="text-gray-800">{pet.weight} lbs</strong>
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-3.5 py-2 rounded-2xl text-xs font-extrabold flex items-center gap-2 self-stretch sm:self-auto justify-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Active Check-In Verified
                </div>
              </div>
            )}

            {/* Critical Care Alerts Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Allergies & Special Care */}
              <div className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-4">
                <h4 className="font-extrabold text-xs text-rose-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" /> Allergies & Warnings
                </h4>
                <p className="text-xs text-rose-950 font-bold leading-relaxed">
                  {pet?.allergies ? pet.allergies : 'No known allergies reported.'}
                </p>
              </div>

              {/* Medication Instructions */}
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4">
                <h4 className="font-extrabold text-xs text-amber-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-amber-700" /> Medications
                </h4>
                <p className="text-xs text-amber-950 font-medium leading-relaxed">
                  {pet?.medication ? pet.medication : 'No current medications required.'}
                </p>
              </div>
            </div>

            {/* Feeding & Behavior */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200/80 flex flex-col gap-3">
              <div>
                <h4 className="font-extrabold text-xs text-gray-700 uppercase tracking-wider mb-1">🍖 Feeding Schedule</h4>
                <p className="text-xs text-gray-900 font-medium">
                  {pet?.feeding_schedule ? pet.feeding_schedule : 'Standard feeding schedule.'}
                </p>
              </div>

              {pet?.behavior_notes && (
                <div className="border-t border-gray-200/60 pt-2.5">
                  <h4 className="font-extrabold text-xs text-gray-700 uppercase tracking-wider mb-1">🧠 Behavior & Temperament</h4>
                  <p className="text-xs text-gray-900 font-medium">{pet.behavior_notes}</p>
                </div>
              )}
            </div>

            {/* Full Veterinary Medical Records (Vet Tier Only) */}
            {accessTier === 'full_vet' && (
              <div className="bg-emerald-50/40 border border-emerald-200 rounded-2xl p-4 flex flex-col gap-3">
                <h4 className="font-extrabold text-xs text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-emerald-600" /> Clinical & Medical Credentials
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-emerald-100">
                    <span className="text-[11px] text-gray-500 font-bold block">Microchip #</span>
                    <strong className="text-gray-900 text-xs">{pet?.microchip_number || 'Not on file'}</strong>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-emerald-100">
                    <span className="text-[11px] text-gray-500 font-bold block">Insurance Provider</span>
                    <strong className="text-gray-900 text-xs">
                      {pet?.insurance_provider ? `${pet.insurance_provider} (${pet.insurance_policy_number || 'No Policy #'})` : 'None'}
                    </strong>
                  </div>
                </div>

                {Array.isArray(pet?.vaccination_records) && pet.vaccination_records.length > 0 && (
                  <div className="mt-1">
                    <span className="text-[11px] text-gray-600 font-extrabold uppercase block mb-1.5">Vaccination Log</span>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs bg-white rounded-xl border border-emerald-100">
                        <thead className="bg-emerald-100/60 text-emerald-950 font-bold text-[11px]">
                          <tr>
                            <th className="py-2 px-3">Vaccine</th>
                            <th className="py-2 px-3">Administered</th>
                            <th className="py-2 px-3">Expires</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {pet.vaccination_records.map((vac: any, idx: number) => (
                            <tr key={idx}>
                              <td className="py-2 px-3 font-extrabold text-gray-900">{vac.name}</td>
                              <td className="py-2 px-3 text-gray-600">{vac.date_administered || 'N/A'}</td>
                              <td className="py-2 px-3 font-semibold text-emerald-800">{vac.expiration_date || 'N/A'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Emergency Contacts & Primary Vet */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 justify-between">
              <div>
                <span className="text-[11px] font-extrabold text-gray-500 uppercase block">Emergency Contact</span>
                <p className="text-xs font-extrabold text-gray-900 mt-0.5">
                  {pet?.emergency_contact_name || 'Owner on file'}
                </p>
                {pet?.emergency_contact_phone && (
                  <a
                    href={`tel:${pet.emergency_contact_phone}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline mt-1"
                  >
                    <Phone className="w-3.5 h-3.5" /> {pet.emergency_contact_phone}
                  </a>
                )}
              </div>

              {pet?.vet_name && (
                <div className="border-t sm:border-t-0 sm:border-l border-gray-200 pt-3 sm:pt-0 sm:pl-4">
                  <span className="text-[11px] font-extrabold text-gray-500 uppercase block">Primary Vet Clinic</span>
                  <p className="text-xs font-extrabold text-gray-900 mt-0.5">{pet.vet_name}</p>
                  {pet?.vet_phone && (
                    <a
                      href={`tel:${pet.vet_phone}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 hover:underline mt-1"
                    >
                      <Phone className="w-3.5 h-3.5" /> {pet.vet_phone}
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Quick Partner Check-In Visit Logging Form */}
            <div className="bg-[#FAF7F2] border border-[#EAE2D8] rounded-2xl p-5">
              <h4 className="font-extrabold text-xs text-gray-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#8B5E3C]" /> Log Partner Visit / Check-In Note
              </h4>
              <p className="text-xs text-gray-500 mb-3">Add a quick check-in timestamp or care note for the pet owner to review.</p>

              {noteSuccess && (
                <div className="mb-3 p-3 bg-emerald-100 border border-emerald-200 text-emerald-900 font-bold text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" /> Check-in visit note logged successfully!
                </div>
              )}

              <form onSubmit={handleLogCheckinVisit} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Checked in safely at 2:30 PM. Medication administered."
                  value={checkinNote}
                  onChange={e => setCheckinNote(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-medium focus:ring-2 focus:ring-[#8B5E3C] focus:outline-none bg-white"
                />
                <button
                  type="submit"
                  disabled={noteSaving || !checkinNote.trim()}
                  className="px-4 py-2.5 rounded-xl bg-[#8B5E3C] hover:bg-[#734A2E] text-white font-bold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" /> {noteSaving ? 'Saving...' : 'Log'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PetAccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FAF7F2] py-20 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-3 border-amber-800 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <PetAccessContent />
    </Suspense>
  );
}
