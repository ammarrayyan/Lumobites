'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building2, Plus, Search, Filter, Trash2, CheckCircle2, Edit3, ArrowLeft, PawPrint, Calendar, ShieldCheck, Mail, MessageSquare, Camera, Upload, X, Image as ImageIcon } from 'lucide-react';
import PetPhotoCarousel from '@/components/PetPhotoCarousel';
import CityAutocompleteInput from '@/components/CityAutocompleteInput';

interface ShelterPet {
  id: string;
  name: string;
  species: string;
  breed: string;
  age: string;
  size: string;
  sex: string;
  spayed_neutered: boolean;
  temperament?: string;
  description?: string;
  adoption_fee?: string;
  adoption_process?: string;
  photo_urls: string[];
  status: 'available' | 'pending' | 'adopted';
  city: string;
  created_at: string;
}

function ShelterDashboardContent() {
  const router = useRouter();
  const [shelterEmail, setShelterEmail] = useState('');
  const [shelterInfo, setShelterInfo] = useState<any>(null);
  const [pets, setPets] = useState<ShelterPet[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Controls
  const [activeTab, setActiveTab] = useState<'available' | 'pending' | 'adopted' | 'inquiries' | 'all'>('available');
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(false);
  const [inquiryFilter, setInquiryFilter] = useState<'all' | 'unread' | 'replied'>('all');
  const [search, setSearch] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState('all');
  const [ageFilter, setAgeFilter] = useState('all');
  const [sizeFilter, setSizeFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'alpha'>('newest');

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Post / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<ShelterPet | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    species: 'dog',
    breed: '',
    age: 'adult',
    size: 'medium',
    sex: 'male',
    spayed_neutered: true,
    temperament: '',
    description: '',
    adoption_fee: '',
    adoption_process: '',
    photo_urls: [''],
    city: ''
  });

  // Re-application Modal State
  const [isReapplyOpen, setIsReapplyOpen] = useState(false);
  const [reapplyFormData, setReapplyFormData] = useState({
    org_name: '',
    tax_id: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    website: '',
    org_photo_url: ''
  });
  const [reapplySubmitting, setReapplySubmitting] = useState(false);

  const handleReapplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReapplySubmitting(true);
    try {
      const res = await fetch('/api/adoption/shelter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reapplyFormData)
      });
      if (res.ok) {
        const data = await res.json();
        setShelterInfo(data.shelter);
        setIsReapplyOpen(false);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(`Re-submission failed: ${err.error || 'Check details'}`);
      }
    } catch {
      alert('Network error while re-submitting.');
    } finally {
      setReapplySubmitting(false);
    }
  };

  const handleSwitchAccount = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('lumo_pro_email');
      localStorage.removeItem('lumo_sitter_email');
      localStorage.removeItem('lumo_shelter_email');
      localStorage.removeItem('lumo_sitter_id');
      localStorage.removeItem('lumo_admin_bypass');
      document.cookie = 'lumo_pro_email=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      window.dispatchEvent(new Event('lumo-pro-update'));
      router.push('/account');
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Always authenticate against the active logged-in account (lumo_pro_email or lumo_sitter_email)
    const email = (
      localStorage.getItem('lumo_shelter_email') ||
      localStorage.getItem('lumo_pro_email') ||
      localStorage.getItem('lumo_sitter_email') ||
      ''
    ).trim();
    setShelterEmail(email);

    if (email) {
      fetchShelterDetails(email);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchShelterDetails = async (email: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/adoption/shelter?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        setShelterInfo(data.shelter);
        if (data.shelter?.id) {
          fetchShelterPets(data.shelter.id);
          fetchShelterInquiries(data.shelter.id, data.shelter.email);
        } else {
          setLoading(false);
        }
      } else {
        setShelterInfo(null);
        setLoading(false);
      }
    } catch {
      setShelterInfo(null);
      setLoading(false);
    }
  };

  const fetchShelterInquiries = async (shelterId: string, email: string) => {
    setInquiriesLoading(true);
    try {
      const res = await fetch(`/api/adoption/messages?shelter_id=${shelterId}&shelter_email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        setInquiries(data.messages || []);
      }
    } catch (err) {
      console.error('Failed to fetch shelter inquiries:', err);
    } finally {
      setInquiriesLoading(false);
    }
  };

  const fetchShelterPets = async (shelterId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/adoption/pets?shelter_id=${shelterId}`);
      if (res.ok) {
        const data = await res.json();
        setPets(data.pets || []);
      }
    } catch (err) {
      console.error('Failed to fetch shelter pets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingPet(null);
    setFormData({
      name: '',
      species: 'dog',
      breed: '',
      age: 'adult',
      size: 'medium',
      sex: 'male',
      spayed_neutered: true,
      temperament: '',
      description: '',
      adoption_fee: '',
      adoption_process: '',
      photo_urls: [''],
      city: shelterInfo?.city || ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (pet: ShelterPet) => {
    setEditingPet(pet);
    setFormData({
      name: pet.name,
      species: pet.species,
      breed: pet.breed,
      age: pet.age,
      size: pet.size,
      sex: pet.sex,
      spayed_neutered: pet.spayed_neutered,
      temperament: pet.temperament || '',
      description: pet.description || '',
      adoption_fee: pet.adoption_fee || '',
      adoption_process: pet.adoption_process || '',
      photo_urls: pet.photo_urls.length > 0 ? pet.photo_urls : [''],
      city: pet.city
    });
    setIsModalOpen(true);
  };

  const handlePhotoFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be under 10MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          if (width > height) {
            if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
          } else {
            if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const base64 = canvas.toDataURL('image/jpeg', 0.8);
          setFormData(prev => ({
            ...prev,
            photo_urls: [...prev.photo_urls.filter(u => u.trim() !== ''), base64]
          }));
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photo_urls: prev.photo_urls.filter((_, i) => i !== index)
    }));
  };

  const handleSavePet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shelterInfo?.id) {
      alert('Shelter verification required before posting.');
      return;
    }

    const validPhotos = formData.photo_urls.filter(u => u.trim() !== '');
    if (validPhotos.length === 0) {
      alert('At least one pet photo is required before posting an adoption listing.');
      return;
    }

    try {
      const payload = {
        ...formData,
        shelter_id: shelterInfo.id,
        photo_urls: validPhotos
      };

      const url = '/api/adoption/pets';
      const method = editingPet ? 'PATCH' : 'POST';
      const body = editingPet ? { id: editingPet.id, ...payload } : payload;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchShelterPets(shelterInfo.id);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(`Failed to save: ${err.error || 'Check fields'}`);
      }
    } catch {
      alert('An error occurred while saving.');
    }
  };

  const handleStatusChange = async (petId: string, status: 'available' | 'pending' | 'adopted') => {
    try {
      const res = await fetch('/api/adoption/pets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: petId, status })
      });
      if (res.ok) {
        setPets(prev => prev.map(p => p.id === petId ? { ...p, status } : p));
      }
    } catch {
      alert('Status update failed');
    }
  };

  const handleDeletePet = async (petId: string) => {
    if (!confirm('Are you sure you want to delete this pet listing?')) return;
    try {
      const res = await fetch(`/api/adoption/pets?id=${petId}`, { method: 'DELETE' });
      if (res.ok) {
        setPets(prev => prev.filter(p => p.id !== petId));
      }
    } catch {
      alert('Delete failed');
    }
  };

  // Bulk operations
  const handleBulkAction = async (action: 'available' | 'pending' | 'adopted' | 'delete') => {
    if (selectedIds.length === 0) return;
    if (action === 'delete' && !confirm(`Delete ${selectedIds.length} selected listings?`)) return;

    try {
      const res = await fetch('/api/adoption/pets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: selectedIds,
          action: action === 'delete' ? 'delete' : undefined,
          status: action !== 'delete' ? action : undefined
        })
      });
      if (res.ok) {
        setSelectedIds([]);
        if (shelterInfo?.id) fetchShelterPets(shelterInfo.id);
      }
    } catch {
      alert('Bulk action failed');
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredPets.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredPets.map(p => p.id));
    }
  };

  const toggleSelectPet = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  // Filtering & Sorting
  let filteredPets = pets.filter(p => {
    const matchesTab = activeTab === 'all' || p.status === activeTab;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.breed.toLowerCase().includes(search.toLowerCase());
    const matchesSpecies = speciesFilter === 'all' || p.species.toLowerCase() === speciesFilter.toLowerCase();
    const matchesAge = ageFilter === 'all' || p.age.toLowerCase() === ageFilter.toLowerCase();
    const matchesSize = sizeFilter === 'all' || p.size.toLowerCase() === sizeFilter.toLowerCase();
    return matchesTab && matchesSearch && matchesSpecies && matchesAge && matchesSize;
  });

  if (sortBy === 'oldest') {
    filteredPets.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  } else if (sortBy === 'alpha') {
    filteredPets.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    filteredPets.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  const getDaysAgo = (iso: string) => {
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
    return days === 0 ? 'Today' : `${days} d ago`;
  };

  // Org photo edit state
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [editPhotoUrl, setEditPhotoUrl] = useState('');

  const handleSaveOrgPhoto = async () => {
    if (!shelterInfo?.id) return;
    try {
      const res = await fetch('/api/adoption/shelter', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: shelterInfo.id, org_photo_url: editPhotoUrl })
      });
      if (res.ok) {
        const data = await res.json();
        setShelterInfo(data.shelter);
        setShowPhotoModal(false);
      }
    } catch {
      alert('Failed to update organization photo.');
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFAF7] text-[#191919] p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-[#E8DDD4] shadow-xs">
          <div className="flex items-center gap-4">
            {shelterInfo?.org_photo_url ? (
              <img src={shelterInfo.org_photo_url} alt={shelterInfo.org_name} className="w-14 h-14 rounded-2xl object-cover border border-amber-200 shrink-0" />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800 shrink-0 font-bold">
                <Building2 className="w-7 h-7" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                {shelterInfo?.org_name || 'Shelter Management Dashboard'}
              </h1>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                <span>{shelterInfo?.status ? `Status: ${String(shelterInfo.status).toUpperCase()}` : 'Rescue Partner Portal'}</span>
                {shelterInfo && (
                  <button
                    onClick={() => { setEditPhotoUrl(shelterInfo.org_photo_url || ''); setShowPhotoModal(true); }}
                    className="text-[#8B5E3C] underline font-bold cursor-pointer border-none bg-transparent"
                  >
                    Edit Logo/Photo
                  </button>
                )}
              </div>
            </div>
          </div>

          {shelterInfo?.status?.toLowerCase() === 'approved' && (
            <button
              onClick={handleOpenAddModal}
              className="bg-[#8B5E3C] hover:bg-[#734A2E] text-white font-bold py-3 px-5 rounded-2xl transition-all shadow-sm flex items-center gap-2 cursor-pointer border-none text-xs"
            >
              <Plus className="w-4 h-4" /> Post a Pet for Adoption
            </button>
          )}
        </div>

        {/* ACCESS CONTROL BRANCHING */}
        {loading ? (
          <div className="bg-white p-12 rounded-3xl border border-[#E8DDD4] shadow-xs text-center max-w-md mx-auto space-y-3">
            <Building2 className="w-10 h-10 text-[#8B5E3C] animate-bounce mx-auto" />
            <p className="text-xs text-gray-500 font-bold">Verifying shelter administrator credentials...</p>
          </div>
        ) : !shelterEmail ? (
          <div className="bg-white p-8 md:p-12 rounded-3xl border border-[#E8DDD4] shadow-xs text-center max-w-md mx-auto space-y-4">
            <ShieldCheck className="w-12 h-12 text-[#8B5E3C] mx-auto" />
            <h2 className="text-lg font-black text-gray-900">Sign In Required</h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              Please sign in with your account to access your shelter or rescue organization dashboard.
            </p>
            <div className="pt-2">
              <Link
                href="/account"
                className="inline-block bg-[#8B5E3C] hover:bg-[#734A2E] text-white font-bold py-3 px-6 rounded-2xl text-xs transition-all shadow-sm no-underline"
              >
                Sign In / Register Account
              </Link>
            </div>
          </div>
        ) : !shelterInfo ? (
          <div className="bg-white p-8 md:p-12 rounded-3xl border border-[#E8DDD4] shadow-xs text-center max-w-lg mx-auto space-y-4">
            <Building2 className="w-12 h-12 text-amber-700 mx-auto" />
            <h2 className="text-lg font-black text-gray-900">Shelter Access Restricted</h2>
            <p className="text-xs text-gray-600 leading-relaxed">
              You are currently signed in as <strong className="text-gray-900">{shelterEmail}</strong>, but this account is not registered as an approved rescue partner.
            </p>
            <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-2">
              <Link
                href="/adoption"
                className="bg-[#8B5E3C] hover:bg-[#734A2E] text-white font-bold py-3 px-5 rounded-2xl text-xs no-underline transition-all shadow-2xs"
              >
                Apply as a Shelter Partner
              </Link>
              <button
                type="button"
                onClick={handleSwitchAccount}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-5 rounded-2xl text-xs border-none cursor-pointer transition-all"
              >
                Sign Out / Switch Account
              </button>
            </div>
          </div>
        ) : shelterInfo?.status?.toLowerCase() === 'pending' ? (
          <div className="bg-white p-8 md:p-12 rounded-3xl border border-amber-200 shadow-xs text-center max-w-lg mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800 mx-auto font-bold">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-gray-900">Application Under Review</h2>
            <p className="text-xs text-gray-600 leading-relaxed">
              Your application for <strong>{shelterInfo.org_name}</strong> has been received and is currently under review by our team.
            </p>
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-xs text-amber-900 text-left space-y-1">
              <p><strong>Registered Email:</strong> {shelterInfo.email}</p>
              <p><strong>Location:</strong> {shelterInfo.city}{shelterInfo.state ? `, ${shelterInfo.state}` : ''}</p>
              <p><strong>Status:</strong> <span className="bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-md uppercase text-[10px]">PENDING APPROVAL</span></p>
            </div>
            <p className="text-xs text-gray-400">
              We will send an email confirmation to <strong>{shelterInfo.email}</strong> as soon as your account is approved. Posting pets will be enabled once approved.
            </p>
          </div>
        ) : shelterInfo?.status?.toLowerCase() === 'rejected' ? (
          <div className="bg-white p-8 md:p-12 rounded-3xl border border-red-200 shadow-xs text-center max-w-lg mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 mx-auto font-bold">
              <Trash2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-gray-900">Application Not Approved</h2>
            <p className="text-xs text-gray-600 leading-relaxed">
              Thank you for your interest. At this time, the application for <strong>{shelterInfo.org_name}</strong> was not approved for partner posting access.
            </p>
            
            {shelterInfo.rejection_reason && (
              <div className="bg-red-50 p-4 rounded-2xl border border-red-200 text-xs text-red-900 text-left space-y-1">
                <p className="font-bold text-red-800">Reason Provided by Reviewer:</p>
                <p className="italic">"{shelterInfo.rejection_reason}"</p>
              </div>
            )}

            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 text-xs text-gray-700 text-left space-y-1">
              <p><strong>Organization:</strong> {shelterInfo.org_name}</p>
              <p><strong>Email:</strong> {shelterInfo.email}</p>
              <p><strong>Status:</strong> <span className="bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded-md uppercase text-[10px]">NOT APPROVED</span></p>
            </div>

            <p className="text-xs text-gray-500">
              You may update your organization information or credentials and re-submit your application for review anytime below.
            </p>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => {
                  setReapplyFormData({
                    org_name: shelterInfo.org_name || '',
                    tax_id: shelterInfo.tax_id || '',
                    email: shelterInfo.email || '',
                    phone: shelterInfo.phone || '',
                    address: shelterInfo.address || '',
                    city: shelterInfo.city || '',
                    state: shelterInfo.state || '',
                    zip: shelterInfo.zip || '',
                    website: shelterInfo.website || '',
                    org_photo_url: shelterInfo.org_photo_url || ''
                  });
                  setIsReapplyOpen(true);
                }}
                className="w-full bg-[#8B5E3C] hover:bg-[#734A2E] text-white font-bold py-3 px-4 rounded-xl transition-all border-none cursor-pointer text-xs"
              >
                Update Details & Re-apply Now &rarr;
              </button>
              <Link href="/adoption" className="text-xs font-bold text-gray-500 hover:underline">
                &larr; Return to Public Adoption Page
              </Link>
            </div>
          </div>
        ) : (
          /* APPROVED SHELTER DASHBOARD (FULL ACCESS) */
          <div className="space-y-6">
            {/* STATUS TABS */}
        <div className="flex items-center justify-between flex-wrap gap-3 bg-white p-2 rounded-2xl border border-[#E8DDD4]">
          <div className="flex gap-2 flex-wrap">
            {(['available', 'pending', 'adopted', 'inquiries', 'all'] as const).map(tab => {
              const cleanShelterEmail = (shelterInfo?.email || shelterEmail || '').toLowerCase().trim();
              const sortedInqMsgs = [...inquiries].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
              const threadKeys = new Set<string>();
              sortedInqMsgs.forEach(m => {
                const s = (m.sender_email || '').toLowerCase().trim();
                const r = (m.receiver_email || '').toLowerCase().trim();
                const adopter = s === cleanShelterEmail ? r : s;
                if (adopter) threadKeys.add(`${m.pet_id}_${adopter}`);
              });

              const count = tab === 'inquiries'
                ? threadKeys.size
                : pets.filter(p => tab === 'all' || p.status === tab).length;
              return (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setSelectedIds([]); }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer border-none flex items-center gap-1.5 ${
                    activeTab === tab ? 'bg-[#8B5E3C] text-white shadow-xs' : 'bg-transparent text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab === 'inquiries' ? (
                    <>
                      <MessageSquare className="w-3.5 h-3.5" /> Inquiries ({count})
                    </>
                  ) : (
                    <>{tab} ({count})</>
                  )}
                </button>
              );
            })}
          </div>

          {/* Sort Dropdown */}
          {activeTab !== 'inquiries' && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span className="font-bold">Sort:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-semibold"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="alpha">Alphabetical</option>
              </select>
            </div>
          )}
        </div>

        {activeTab === 'inquiries' ? (
          <div className="bg-white p-6 rounded-3xl border border-[#E8DDD4] space-y-4">
            {(() => {
              const cleanShelterEmail = (shelterInfo?.email || shelterEmail || '').toLowerCase().trim();
              const sortedInqMsgs = [...inquiries].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
              const threadMap = new Map<string, {
                threadId: string;
                petId: string;
                adopterEmail: string;
                petName: string;
                species: string;
                petStatus: string;
                latestMessage: string;
                latestTimestamp: string;
                unreadCount: number;
                messageCount: number;
                shelterReplied: boolean;
              }>();

              for (const msg of sortedInqMsgs) {
                const sender = (msg.sender_email || '').toLowerCase().trim();
                const receiver = (msg.receiver_email || '').toLowerCase().trim();
                const adopterEmail = sender === cleanShelterEmail ? receiver : sender;
                if (!adopterEmail) continue;

                const isShelterSender = sender === cleanShelterEmail;
                const threadKey = `${msg.pet_id}_${adopterEmail}`;
                if (!threadMap.has(threadKey)) {
                  threadMap.set(threadKey, {
                    threadId: threadKey,
                    petId: msg.pet_id,
                    adopterEmail: adopterEmail,
                    petName: msg.adoption_pets?.name || 'Pet',
                    species: msg.adoption_pets?.species || 'pet',
                    petStatus: msg.adoption_pets?.status || 'available',
                    latestMessage: msg.message,
                    latestTimestamp: msg.created_at,
                    unreadCount: (!msg.read && !isShelterSender) ? 1 : 0,
                    messageCount: 1,
                    shelterReplied: isShelterSender
                  });
                } else {
                  const existing = threadMap.get(threadKey)!;
                  existing.messageCount += 1;
                  if (!msg.read && !isShelterSender) {
                    existing.unreadCount += 1;
                  }
                  if (isShelterSender) {
                    existing.shelterReplied = true;
                  }
                }
              }

              let threads = Array.from(threadMap.values());
              if (inquiryFilter === 'unread') {
                threads = threads.filter(t => t.unreadCount > 0);
              } else if (inquiryFilter === 'replied') {
                threads = threads.filter(t => t.shelterReplied);
              }
              
              threads.sort((a, b) => new Date(b.latestTimestamp).getTime() - new Date(a.latestTimestamp).getTime());

              return (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-[#8B5E3C]" /> Adopter Inquiries & Messages
                      </h3>
                      <p className="text-xs text-gray-500">Incoming conversation threads from prospective adopters</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <div className="flex bg-gray-100 p-1 rounded-xl">
                        <button onClick={() => setInquiryFilter('all')} className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${inquiryFilter === 'all' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>All</button>
                        <button onClick={() => setInquiryFilter('unread')} className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${inquiryFilter === 'unread' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>Unread</button>
                        <button onClick={() => setInquiryFilter('replied')} className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${inquiryFilter === 'replied' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>Replied</button>
                      </div>
                      <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-xl hidden sm:inline-block">
                        {threads.length} {threads.length === 1 ? 'conversation' : 'conversations'}
                      </span>
                    </div>
                  </div>

                  {inquiriesLoading ? (
                    <div className="text-center py-10 text-xs text-gray-400 font-bold">Loading conversation threads…</div>
                  ) : threads.length === 0 ? (
                    <div className="text-center py-12 bg-amber-50/50 rounded-2xl border border-amber-200/60 space-y-2">
                      <MessageSquare className="w-8 h-8 text-amber-700/40 mx-auto" />
                      <p className="font-bold text-xs text-gray-700">No adopter inquiries found</p>
                      <p className="text-[11px] text-gray-400">Try changing your filters or check back later.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto pr-2">
                      {threads.map(thread => {
                        const isStale = thread.petStatus === 'adopted' && !thread.shelterReplied;
                        
                        return (
                          <div key={thread.threadId} className={`py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-opacity ${isStale ? 'opacity-50 grayscale hover:opacity-75' : ''}`}>
                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                {thread.unreadCount > 0 ? (
                                  <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse" title="Unread" />
                                ) : (
                                  <div className="w-2 h-2 rounded-full bg-gray-300" title="Read" />
                                )}
                                <span className="font-bold text-gray-900 text-sm">{thread.adopterEmail}</span>
                                <span className="text-[10px] text-gray-400">&bull; {getDaysAgo(thread.latestTimestamp)}</span>
                                {thread.unreadCount > 0 && (
                                  <span className="bg-red-50 text-red-600 border border-red-200 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    {thread.unreadCount > 1 ? `${thread.unreadCount} New` : 'New'}
                                  </span>
                                )}
                                <span className="bg-gray-100 text-gray-600 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                                  {thread.messageCount} {thread.messageCount === 1 ? 'msg' : 'msgs'}
                                </span>
                                {isStale && (
                                  <span className="text-[10px] font-bold text-gray-400 italic">
                                    Pet has since been adopted
                                  </span>
                                )}
                              </div>
                              <p className="text-gray-700 font-medium line-clamp-2 italic ml-4">"{thread.latestMessage}"</p>
                              <div className="flex items-center gap-1.5 ml-4 mt-1">
                                <p className="text-[11px] text-[#8B5E3C] font-bold">
                                  Regarding: {thread.petName}
                                </p>
                                <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold ${
                                  thread.petStatus === 'available' ? 'bg-emerald-100 text-emerald-800' :
                                  thread.petStatus === 'pending' ? 'bg-amber-100 text-amber-800' :
                                  'bg-purple-100 text-purple-800'
                                }`}>
                                  {thread.petStatus}
                                </span>
                              </div>
                            </div>

                            <Link
                              href={`/adoption/messages/${thread.petId}?adopter=${encodeURIComponent(thread.adopterEmail)}`}
                              className="bg-[#8B5E3C] hover:bg-[#734A2E] text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 no-underline shrink-0 transition-all shadow-2xs"
                            >
                              <MessageSquare className="w-3.5 h-3.5" /> View Thread &rarr;
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        ) : (
          <div className="space-y-4">
            {/* FILTERS & SEARCH BAR */}
            <div className="bg-white p-4 rounded-2xl border border-[#E8DDD4] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by pet name/breed…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-[#FAF6F0] border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-[#8B5E3C]"
                />
              </div>

              <select
                value={speciesFilter}
                onChange={e => setSpeciesFilter(e.target.value)}
                className="bg-[#FAF6F0] border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium"
              >
                <option value="all">All Species</option>
                <option value="dog">Dog</option>
                <option value="cat">Cat</option>
                <option value="other">Other</option>
              </select>

              <select
                value={ageFilter}
                onChange={e => setAgeFilter(e.target.value)}
                className="bg-[#FAF6F0] border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium"
              >
                <option value="all">All Ages</option>
                <option value="puppy">Puppy/Kitten</option>
                <option value="young">Young</option>
                <option value="adult">Adult</option>
                <option value="senior">Senior</option>
              </select>

              <select
                value={sizeFilter}
                onChange={e => setSizeFilter(e.target.value)}
                className="bg-[#FAF6F0] border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium"
              >
                <option value="all">All Sizes</option>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>

            {/* BULK ACTIONS BAR */}
            {selectedIds.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 p-3 px-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs text-amber-900 animate-fade-in">
                <span className="font-bold">{selectedIds.length} listings selected</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleBulkAction('available')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl border-none cursor-pointer"
                  >
                    Mark Available
                  </button>
                  <button
                    onClick={() => handleBulkAction('pending')}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-xl border-none cursor-pointer"
                  >
                    Mark Pending
                  </button>
                  <button
                    onClick={() => handleBulkAction('adopted')}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-3 py-1.5 rounded-xl border-none cursor-pointer"
                  >
                    Mark Adopted
                  </button>
                  <button
                    onClick={() => handleBulkAction('delete')}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded-xl border-none cursor-pointer"
                  >
                    Delete Selected
                  </button>
                </div>
              </div>
            )}

            {/* LIST VIEW */}
            {loading ? (
              <div className="text-center py-20 text-xs text-gray-400 font-medium">Loading shelter listings…</div>
            ) : filteredPets.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-[#E8DDD4] text-center space-y-3">
                <PawPrint className="w-10 h-10 text-gray-300 mx-auto" />
                <p className="font-bold text-gray-800 text-sm">No pet listings match this view</p>
                <button
                  onClick={handleOpenAddModal}
                  className="bg-[#8B5E3C] text-white text-xs font-bold py-2 px-4 rounded-xl cursor-pointer border-none"
                >
                  Add First Pet
                </button>
              </div>
            ) : (
          <div className="bg-white rounded-3xl border border-[#E8DDD4] overflow-hidden shadow-xs">
            <div className="p-3 bg-[#FAF6F0] border-b border-[#E8DDD4] flex items-center gap-3 text-xs font-bold text-gray-600">
              <input
                type="checkbox"
                checked={selectedIds.length === filteredPets.length && filteredPets.length > 0}
                onChange={toggleSelectAll}
                className="rounded text-[#8B5E3C]"
              />
              <span className="flex-1">Pet Listing</span>
              <span className="w-24 text-center hidden sm:inline">Status</span>
              <span className="w-28 text-center hidden md:inline">Posted</span>
              <span className="w-56 text-right">Quick Actions</span>
            </div>

            <div className="divide-y divide-gray-100">
              {filteredPets.map(pet => (
                <div key={pet.id} className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-amber-50/30 transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(pet.id)}
                      onChange={() => toggleSelectPet(pet.id)}
                      className="rounded text-[#8B5E3C] w-4 h-4"
                    />

                    <PetPhotoCarousel photoUrls={pet.photo_urls} petType={pet.species} className="w-14 h-14 rounded-2xl shrink-0" />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-sm text-gray-900 truncate">{pet.name}</h3>
                        <span className="text-xs text-gray-400">({pet.sex})</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{pet.breed} &bull; {pet.age} &bull; {pet.size}</p>
                      {pet.adoption_fee && <p className="text-[11px] font-bold text-[#8B5E3C]">Fee: {pet.adoption_fee}</p>}
                    </div>
                  </div>

                  {/* Status Badge - Hidden on mobile, visible on sm+ */}
                  <div className="w-24 text-center shrink-0 hidden sm:block">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold capitalize ${
                      pet.status === 'adopted' ? 'bg-purple-100 text-purple-800' : pet.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {pet.status}
                    </span>
                  </div>

                  {/* Posted duration - Hidden on mobile/tablet */}
                  <div className="w-28 text-center text-xs text-gray-400 font-medium hidden md:block">
                    {getDaysAgo(pet.created_at)}
                  </div>

                  {/* Actions & Status Selector */}
                  <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t border-gray-100 sm:border-0 w-full sm:w-auto">
                    <select
                      value={pet.status}
                      onChange={e => handleStatusChange(pet.id, e.target.value as 'available' | 'pending' | 'adopted')}
                      className={`text-xs font-bold py-2 px-3 rounded-xl border cursor-pointer focus:outline-none transition-all ${
                        pet.status === 'adopted'
                          ? 'bg-purple-50 text-purple-800 border-purple-200'
                          : pet.status === 'pending'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}
                      title="Change status"
                    >
                      <option value="available">Available</option>
                      <option value="pending">Pending</option>
                      <option value="adopted">Adopted</option>
                    </select>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditModal(pet)}
                        title="Edit Listing"
                        aria-label="Edit listing"
                        className="px-3 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 active:bg-amber-300 text-amber-900 text-xs font-bold cursor-pointer border border-amber-300 shrink-0 transition-colors flex items-center justify-center gap-1.5 min-w-[42px] min-h-[42px]"
                      >
                        <Edit3 className="w-4 h-4 text-amber-900" />
                        <span className="sm:hidden">Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeletePet(pet.id)}
                        title="Delete Listing"
                        aria-label="Delete listing"
                        className="px-3 py-2 rounded-xl bg-red-100 hover:bg-red-200 active:bg-red-300 text-red-800 text-xs font-bold cursor-pointer border border-red-300 shrink-0 transition-colors flex items-center justify-center gap-1.5 min-w-[42px] min-h-[42px]"
                      >
                        <Trash2 className="w-4 h-4 text-red-700" />
                        <span className="sm:hidden">Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
          </div>
        )}
      </div>
    )}
  </div>

      {/* POST / EDIT PET MODAL */}
      {isModalOpen && typeof window !== 'undefined' && createPortal(
        <div
          className="modal-overlay fixed inset-0 z-[100000] bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 pb-[calc(env(safe-area-inset-bottom,0px)+96px)] sm:p-6 overflow-y-auto"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full flex flex-col max-h-[78dvh] sm:max-h-[90dvh] shadow-2xl overflow-hidden my-auto border border-gray-200"
            onClick={e => e.stopPropagation()}
          >
            {/* STICKY HEADER WITH CLOSE BUTTON */}
            <div className="p-4 sm:p-5 border-b border-gray-200 flex items-center justify-between bg-amber-50/60 shrink-0">
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <div className="w-8 h-8 rounded-xl bg-[#8B5E3C]/10 text-[#8B5E3C] flex items-center justify-center shrink-0">
                  <Edit3 className="w-4 h-4 text-[#8B5E3C]" />
                </div>
                <h3 className="text-base sm:text-lg font-black text-gray-900 truncate">
                  {editingPet ? `Edit Listing — ${editingPet.name}` : 'Post Pet for Adoption'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-9 h-9 rounded-full bg-white hover:bg-gray-100 active:bg-gray-200 text-gray-700 hover:text-gray-900 flex items-center justify-center border border-gray-300 cursor-pointer shrink-0 transition-colors shadow-xs"
                aria-label="Close modal"
                title="Close"
              >
                <X className="w-5 h-5 text-gray-700 stroke-[2.5]" />
              </button>
            </div>

            {/* SCROLLABLE BODY */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs flex-1">
              <form id="petForm" onSubmit={handleSavePet} className="space-y-4">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Pet Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[#FAF6F0] border border-gray-200 rounded-xl p-2.5 focus:outline-none focus:border-[#8B5E3C]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Species *</label>
                    <select
                      value={formData.species}
                      onChange={e => setFormData({ ...formData, species: e.target.value })}
                      className="w-full bg-[#FAF6F0] border border-gray-200 rounded-xl p-2.5"
                    >
                      <option value="dog">Dog</option>
                      <option value="cat">Cat</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Breed</label>
                    <input
                      type="text"
                      value={formData.breed}
                      onChange={e => setFormData({ ...formData, breed: e.target.value })}
                      className="w-full bg-[#FAF6F0] border border-gray-200 rounded-xl p-2.5"
                      placeholder="e.g. Mixed / Labrador"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Age</label>
                    <select
                      value={formData.age}
                      onChange={e => setFormData({ ...formData, age: e.target.value })}
                      className="w-full bg-[#FAF6F0] border border-gray-200 rounded-xl p-2"
                    >
                      <option value="puppy">Puppy/Kitten</option>
                      <option value="young">Young</option>
                      <option value="adult">Adult</option>
                      <option value="senior">Senior</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Size</label>
                    <select
                      value={formData.size}
                      onChange={e => setFormData({ ...formData, size: e.target.value })}
                      className="w-full bg-[#FAF6F0] border border-gray-200 rounded-xl p-2"
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Sex</label>
                    <select
                      value={formData.sex}
                      onChange={e => setFormData({ ...formData, sex: e.target.value })}
                      className="w-full bg-[#FAF6F0] border border-gray-200 rounded-xl p-2"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                </div>

                {/* PET PHOTOS UPLOAD CONTROL */}
                <div className="space-y-2">
                  <label className="font-bold text-gray-700 block text-xs">
                    Pet Photos <span className="text-red-500 font-extrabold">* (At least 1 photo required)</span>
                  </label>
                  
                  {/* Photo Previews Grid */}
                  {formData.photo_urls.filter(u => u.trim() !== '').length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-2">
                      {formData.photo_urls.filter(u => u.trim() !== '').map((url, idx) => (
                        <div key={idx} className="relative group w-full h-24 rounded-2xl overflow-hidden border border-amber-200 bg-gray-100 shadow-xs">
                          <img src={url} alt={`Pet preview ${idx + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(idx)}
                            className="absolute top-1 right-1 bg-black/70 hover:bg-red-600 text-white rounded-full p-1 border-none cursor-pointer transition-all shadow-xs"
                            title="Remove photo"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {/* Take Photo (Camera on Mobile) */}
                    <label className="flex-1 min-w-[130px] bg-amber-50 hover:bg-amber-100 border border-amber-200 text-[#8B5E3C] font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer text-xs transition-all shadow-2xs">
                      <Camera className="w-4 h-4 text-[#8B5E3C]" />
                      <span>Take Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handlePhotoFiles}
                        className="hidden"
                      />
                    </label>

                    {/* Choose from Library / Desktop File Picker */}
                    <label className="flex-1 min-w-[130px] bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer text-xs transition-all shadow-2xs">
                      <Upload className="w-4 h-4 text-gray-500" />
                      <span>Choose Photos</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoFiles}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Optional Image URL Input */}
                  <div className="pt-1">
                    <input
                      type="url"
                      placeholder="Or paste image URL (https://…) & press Enter"
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = (e.target as HTMLInputElement).value.trim();
                          if (val) {
                            setFormData(prev => ({
                              ...prev,
                              photo_urls: [...prev.photo_urls.filter(u => u.trim() !== ''), val]
                            }));
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                      className="w-full bg-[#FAF6F0] border border-gray-200 rounded-xl p-2 text-xs"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Tip: Press Enter to add pasted image URL.</p>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Temperament / Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Good with kids, low energy, apartment friendly"
                    value={formData.temperament}
                    onChange={e => setFormData({ ...formData, temperament: e.target.value })}
                    className="w-full bg-[#FAF6F0] border border-gray-200 rounded-xl p-2.5"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-[#FAF6F0] border border-gray-200 rounded-xl p-2.5"
                    placeholder="Tell adopters about this pet's story and personality…"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Adoption Fee ($)</label>
                    <input
                      type="text"
                      placeholder="$150"
                      value={formData.adoption_fee}
                      onChange={e => setFormData({ ...formData, adoption_fee: e.target.value })}
                      className="w-full bg-[#FAF6F0] border border-gray-200 rounded-xl p-2.5"
                    />
                  </div>
                  <CityAutocompleteInput
                    label="City / Location"
                    value={formData.city}
                    onChange={val => setFormData({ ...formData, city: val })}
                    placeholder="Search city (e.g. Austin, TX)…"
                  />
                </div>
              </form>
            </div>

            {/* STICKY FOOTER ACTIONS */}
            <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3 shrink-0 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] sm:pb-5">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-800 font-extrabold px-5 py-2.5 rounded-xl border border-gray-300 cursor-pointer text-xs transition-colors shadow-xs min-h-[42px] flex items-center justify-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="petForm"
                className="bg-[#8B5E3C] hover:bg-[#734A2E] text-white font-extrabold px-6 py-2.5 rounded-xl transition-all cursor-pointer border-none text-xs shadow-md min-h-[42px] flex items-center justify-center"
              >
                {editingPet ? 'Save Changes' : 'Post Pet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT SHELTER LOGO / PHOTO MODAL */}
      {showPhotoModal && (
        <div
          className="fixed inset-0 z-[100000] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 pb-[calc(env(safe-area-inset-bottom,0px)+96px)] sm:p-6 overflow-y-auto"
          onClick={() => setShowPhotoModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl relative my-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-gray-900">Organization Logo / Photo</h3>
              <button
                type="button"
                onClick={() => setShowPhotoModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 flex items-center justify-center border-none cursor-pointer shrink-0 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <p className="text-xs text-gray-500">Enter a direct image URL for your rescue or shelter logo.</p>

            <div className="space-y-3 text-xs">
              {editPhotoUrl && (
                <img src={editPhotoUrl} alt="Preview" className="w-20 h-20 rounded-2xl object-cover border border-amber-200 mx-auto" />
              )}
              <input
                type="url"
                placeholder="https://..."
                value={editPhotoUrl}
                onChange={e => setEditPhotoUrl(e.target.value)}
                className="w-full bg-[#FAF6F0] border border-gray-200 rounded-xl p-2.5"
              />

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleSaveOrgPhoto}
                  className="flex-1 bg-[#8B5E3C] hover:bg-[#734A2E] text-white font-bold py-2.5 rounded-xl border-none cursor-pointer"
                >
                  Save Photo
                </button>
                <button
                  type="button"
                  onClick={() => setShowPhotoModal(false)}
                  className="bg-gray-100 text-gray-700 font-bold px-4 py-2.5 rounded-xl border-none cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* RE-APPLICATION FORM MODAL */}
      {isReapplyOpen && typeof window !== 'undefined' && createPortal(
        <div
          className="modal-overlay fixed inset-0 z-[100000] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 pb-[calc(env(safe-area-inset-bottom,0px)+96px)] sm:p-6 overflow-y-auto"
          onClick={() => setIsReapplyOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 max-h-[80vh] overflow-y-auto shadow-2xl relative my-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-gray-900">Update Info & Re-apply</h3>
              <button
                type="button"
                onClick={() => setIsReapplyOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 flex items-center justify-center border-none cursor-pointer shrink-0 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <p className="text-xs text-gray-500">Update your organization details below to re-submit your application for admin review.</p>

            <form onSubmit={handleReapplySubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Organization Name *</label>
                <input
                  type="text"
                  required
                  value={reapplyFormData.org_name}
                  onChange={e => setReapplyFormData({ ...reapplyFormData, org_name: e.target.value })}
                  className="w-full bg-[#FAF6F0] border border-gray-200 rounded-xl p-2.5 focus:outline-none focus:border-[#8B5E3C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    readOnly
                    value={reapplyFormData.email}
                    className="w-full bg-gray-100 border border-gray-200 rounded-xl p-2.5 text-gray-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Tax ID / EIN</label>
                  <input
                    type="text"
                    value={reapplyFormData.tax_id}
                    onChange={e => setReapplyFormData({ ...reapplyFormData, tax_id: e.target.value })}
                    className="w-full bg-[#FAF6F0] border border-gray-200 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Phone</label>
                  <input
                    type="tel"
                    value={reapplyFormData.phone}
                    onChange={e => setReapplyFormData({ ...reapplyFormData, phone: e.target.value })}
                    className="w-full bg-[#FAF6F0] border border-gray-200 rounded-xl p-2.5"
                  />
                </div>
                <CityAutocompleteInput
                  label="City *"
                  required
                  value={reapplyFormData.city}
                  onChange={val => setReapplyFormData({ ...reapplyFormData, city: val })}
                  placeholder="Search city (e.g. Austin, TX)…"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Website / Social URL</label>
                <input
                  type="text"
                  value={reapplyFormData.website}
                  onChange={e => setReapplyFormData({ ...reapplyFormData, website: e.target.value })}
                  className="w-full bg-[#FAF6F0] border border-gray-200 rounded-xl p-2.5"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="submit"
                  disabled={reapplySubmitting}
                  className="flex-1 bg-[#8B5E3C] hover:bg-[#734A2E] text-white font-bold py-3 rounded-xl transition-all border-none cursor-pointer text-xs"
                >
                  {reapplySubmitting ? 'Submitting…' : 'Submit Re-application'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsReapplyOpen(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-3 rounded-xl border-none cursor-pointer text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default function ShelterDashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-xs text-[#8B5E3C] font-bold">Loading Shelter Dashboard…</div>}>
      <ShelterDashboardContent />
    </Suspense>
  );
}
