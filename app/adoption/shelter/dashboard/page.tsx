'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building2, Plus, Search, Filter, Trash2, CheckCircle2, Edit3, ArrowLeft, PawPrint, Calendar, ShieldCheck, Mail, MessageSquare } from 'lucide-react';
import PetPhotoCarousel from '@/components/PetPhotoCarousel';

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

export default function ShelterDashboardPage() {
  const router = useRouter();
  const [shelterEmail, setShelterEmail] = useState('');
  const [shelterInfo, setShelterInfo] = useState<any>(null);
  const [pets, setPets] = useState<ShelterPet[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Controls
  const [activeTab, setActiveTab] = useState<'available' | 'pending' | 'adopted' | 'all'>('available');
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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const email = localStorage.getItem('lumo_shelter_email') || localStorage.getItem('lumo_pro_email') || '';
    setShelterEmail(email);

    if (email) {
      fetchShelterDetails(email);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchShelterDetails = async (email: string) => {
    try {
      const res = await fetch(`/api/adoption/shelter?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        setShelterInfo(data.shelter);
        if (data.shelter?.id) {
          fetchShelterPets(data.shelter.id);
        } else {
          setLoading(false);
        }
      }
    } catch {
      setLoading(false);
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

  const handleSavePet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shelterInfo?.id) {
      alert('Shelter verification required before posting.');
      return;
    }

    try {
      const payload = {
        ...formData,
        shelter_id: shelterInfo.id,
        photo_urls: formData.photo_urls.filter(u => u.trim() !== '')
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
  const handleBulkAction = async (action: 'adopted' | 'delete') => {
    if (selectedIds.length === 0) return;
    if (action === 'delete' && !confirm(`Delete ${selectedIds.length} selected listings?`)) return;

    try {
      const res = await fetch('/api/adoption/pets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: selectedIds,
          action: action === 'delete' ? 'delete' : undefined,
          status: action === 'adopted' ? 'adopted' : undefined
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
    <div className="min-h-screen bg-[#FDFAF7] text-[#191919] p-4 md:p-8" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 64px)' }}>
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
              <div className="flex items-center gap-2">
                <Link href="/adoption" className="text-[#8B5E3C] hover:underline text-xs font-bold flex items-center gap-1">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Adoption
                </Link>
              </div>
              <h1 className="text-2xl font-black text-gray-900 mt-1 flex items-center gap-2">
                {shelterInfo?.org_name || 'Shelter Management Dashboard'}
              </h1>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                <span>{shelterInfo ? `Status: ${shelterInfo.status.toUpperCase()}` : 'Rescue Partner Portal'}</span>
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

          <button
            onClick={handleOpenAddModal}
            className="bg-[#8B5E3C] hover:bg-[#734A2E] text-white font-bold py-3 px-5 rounded-2xl transition-all shadow-sm flex items-center gap-2 cursor-pointer border-none text-xs"
          >
            <Plus className="w-4 h-4" /> Post a Pet for Adoption
          </button>
        </div>

        {/* STATUS TABS */}
        <div className="flex items-center justify-between flex-wrap gap-3 bg-white p-2 rounded-2xl border border-[#E8DDD4]">
          <div className="flex gap-2">
            {(['available', 'pending', 'adopted', 'all'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setSelectedIds([]); }}
                className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer border-none ${
                  activeTab === tab ? 'bg-[#8B5E3C] text-white shadow-xs' : 'bg-transparent text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab} ({pets.filter(p => tab === 'all' || p.status === tab).length})
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
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
        </div>

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
          <div className="bg-amber-50 border border-amber-200 p-3 px-4 rounded-2xl flex items-center justify-between text-xs text-amber-900 animate-fade-in">
            <span className="font-bold">{selectedIds.length} listings selected</span>
            <div className="flex gap-2">
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
              <span className="w-48 text-right">Quick Actions</span>
            </div>

            <div className="divide-y divide-gray-100">
              {filteredPets.map(pet => (
                <div key={pet.id} className="p-4 flex items-center gap-3 hover:bg-amber-50/30 transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(pet.id)}
                    onChange={() => toggleSelectPet(pet.id)}
                    className="rounded text-[#8B5E3C]"
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

                  {/* Status Badge */}
                  <div className="w-24 text-center shrink-0">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold capitalize ${
                      pet.status === 'adopted' ? 'bg-purple-100 text-purple-800' : pet.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {pet.status}
                    </span>
                  </div>

                  {/* Posted duration */}
                  <div className="w-28 text-center text-xs text-gray-400 font-medium hidden md:block">
                    {getDaysAgo(pet.created_at)}
                  </div>

                  {/* Actions */}
                  <div className="w-48 flex items-center justify-end gap-1.5 shrink-0">
                    {pet.status !== 'adopted' && (
                      <button
                        onClick={() => handleStatusChange(pet.id, 'adopted')}
                        title="Mark Adopted"
                        className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold cursor-pointer border border-emerald-200"
                      >
                        Adopted
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenEditModal(pet)}
                      title="Edit"
                      className="p-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs font-bold cursor-pointer border-none"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeletePet(pet.id)}
                      title="Delete"
                      className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold cursor-pointer border-none"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* POST / EDIT PET MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-extrabold text-gray-900">
              {editingPet ? `Edit Listing — ${editingPet.name}` : 'Post Pet for Adoption'}
            </h3>

            <form onSubmit={handleSavePet} className="space-y-3 text-xs">
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

              <div>
                <label className="font-bold text-gray-700 block mb-1">Photo Image URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formData.photo_urls[0] || ''}
                  onChange={e => setFormData({ ...formData, photo_urls: [e.target.value] })}
                  className="w-full bg-[#FAF6F0] border border-gray-200 rounded-xl p-2.5"
                />
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
                <div>
                  <label className="font-bold text-gray-700 block mb-1">City / Location</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    className="w-full bg-[#FAF6F0] border border-gray-200 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="submit"
                  className="flex-1 bg-[#8B5E3C] hover:bg-[#734A2E] text-white font-bold py-3 rounded-xl transition-all cursor-pointer border-none"
                >
                  {editingPet ? 'Save Changes' : 'Post Pet'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-3 rounded-xl cursor-pointer border-none"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT SHELTER LOGO / PHOTO MODAL */}
      {showPhotoModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4">
            <h3 className="text-base font-extrabold text-gray-900">Organization Logo / Photo</h3>
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
        </div>
      )}
    </div>
  );
}
