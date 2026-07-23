'use client';

import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ExternalLink, Trash2, Edit2, ShieldAlert } from 'lucide-react';

export default function AdoptionPetsManagement({ adminKey, onUnauthorized }: { adminKey: string, onUnauthorized: () => void }) {
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'pending' | 'adopted'>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPets();
  }, []);

  const fetchPets = async () => {
    try {
      const res = await fetch('/api/admin/adoption-pets', {
        headers: { 'x-admin-key': adminKey }
      });
      if (res.status === 401) {
        onUnauthorized();
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch adoption pets');
      const data = await res.json();
      setPets(data.pets || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: 'delete' | 'update_status', newStatus?: string) => {
    if (action === 'delete') {
      const confirmed = window.confirm("Are you sure you want to delete this listing? This cannot be undone.");
      if (!confirmed) return;
    } else if (action === 'update_status') {
      const confirmed = window.confirm(`Are you sure you want to change the status to ${newStatus}?`);
      if (!confirmed) return;
    }

    setProcessingId(id);
    try {
      const res = await fetch('/api/admin/adoption-pets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey
        },
        body: JSON.stringify({ id, action, status: newStatus })
      });
      if (res.status === 401) {
        onUnauthorized();
        return;
      }
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to process action');
      }

      if (action === 'delete') {
        setPets(pets.filter(p => p.id !== id));
      } else if (action === 'update_status' && newStatus) {
        setPets(pets.map(p => p.id === id ? { ...p, status: newStatus } : p));
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredPets = pets.filter(p => {
    // Status Filter
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;

    // Search Query
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const shelterName = p.shelters?.org_name || '';
    return (
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.breed && p.breed.toLowerCase().includes(q)) ||
      (shelterName.toLowerCase().includes(q))
    );
  });

  // Calculate Stats
  const totalPets = pets.length;
  const availablePets = pets.filter(p => p.status === 'available').length;
  const pendingPets = pets.filter(p => p.status === 'pending').length;
  const adoptedPets = pets.filter(p => p.status === 'adopted').length;

  if (loading) {
    return <div className="text-gray-500 animate-pulse text-center py-12">Loading adoption pets...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-4">
        <h2 className="text-xl font-semibold text-[#191919]">Adoption Pets Management</h2>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-white border border-gray-200 rounded-lg p-2 text-sm text-[#191919] focus:outline-none focus:border-[#c2e59c] transition-colors"
          >
            <option value="all">All Statuses</option>
            <option value="available">Available</option>
            <option value="pending">Pending</option>
            <option value="adopted">Adopted</option>
          </select>

          {/* Search Input */}
          <input
            type="text"
            placeholder="Search by name, breed, shelter..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-64 bg-white border border-gray-200 rounded-lg p-2 text-sm text-[#191919] focus:outline-none focus:border-[#c2e59c] transition-colors"
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 text-sm font-medium">
        <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full">{totalPets} Total Listings</span>
        <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">{availablePets} Available</span>
        <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full">{pendingPets} Pending</span>
        <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full">{adoptedPets} Adopted</span>
      </div>

      {filteredPets.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200">
          No adoption pets found matching your criteria.
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredPets.map(pet => (
            <div key={pet.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-32 h-32 shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
                {pet.photo_urls && pet.photo_urls.length > 0 ? (
                  <img src={pet.photo_urls[0]} alt={pet.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-400 text-xs">No Photo</span>
                )}
              </div>
              
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-[#191919] text-lg truncate flex items-center gap-2">
                      {pet.name}
                      <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold ${
                        pet.status === 'available' ? 'bg-emerald-100 text-emerald-800' :
                        pet.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {pet.status}
                      </span>
                    </h3>
                    <p className="text-sm text-gray-500 font-medium truncate">
                      {pet.species} &bull; {pet.breed || 'Unknown breed'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {pet.age} &bull; {pet.size}
                    </p>
                  </div>
                  
                  <div className="text-right shrink-0">
                    <p className="text-xs font-semibold text-[#8B5E3C] bg-amber-50 px-2 py-1 rounded border border-amber-100 truncate max-w-[150px]">
                      {pet.shelters?.org_name || 'Unknown Shelter'}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      Posted {formatDistanceToNow(new Date(pet.created_at))} ago
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 mt-2">
                  <a
                    href={`/adoption`} // Note: A dedicated pet page would be better if one exists, falling back to adoption board
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs font-semibold bg-gray-50 hover:bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg transition-colors border border-gray-200"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> View Public
                  </a>
                  
                  <div className="flex items-center gap-1.5 ml-auto">
                    <select
                      value={pet.status}
                      onChange={(e) => handleAction(pet.id, 'update_status', e.target.value)}
                      disabled={processingId === pet.id}
                      className="text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-2 py-1.5 rounded-lg cursor-pointer disabled:opacity-50"
                    >
                      <option value="available">Set Available</option>
                      <option value="pending">Set Pending</option>
                      <option value="adopted">Set Adopted</option>
                    </select>

                    <button
                      onClick={() => handleAction(pet.id, 'delete')}
                      disabled={processingId === pet.id}
                      className="flex items-center gap-1.5 text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg transition-colors border border-red-200 disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {processingId === pet.id ? '...' : 'Remove Listing'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
