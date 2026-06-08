'use client';

import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';

export default function LostPetsManagement({ adminKey, onUnauthorized }: { adminKey: string, onUnauthorized: () => void }) {
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPets();
  }, []);

  const fetchPets = async () => {
    try {
      const res = await fetch('/api/admin/lost-pets', {
        headers: { 'x-admin-key': adminKey }
      });
      if (res.status === 401) {
        onUnauthorized();
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch lost pets');
      const data = await res.json();
      setPets(data.pets || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: 'resolve' | 'delete') => {
    if (action === 'delete') {
      const confirmed = window.confirm("Are you sure you want to delete this post? This cannot be undone.");
      if (!confirmed) return;
    }

    setProcessingId(id);
    try {
      const res = await fetch('/api/admin/lost-pets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey
        },
        body: JSON.stringify({ id, action })
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
      } else if (action === 'resolve') {
        setPets(pets.map(p => p.id === id ? { ...p, status: 'resolved' } : p));
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredPets = pets.filter(p => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (p.pet_name && p.pet_name.toLowerCase().includes(q)) ||
      (p.city && p.city.toLowerCase().includes(q)) ||
      (p.species && p.species.toLowerCase().includes(q))
    );
  });

  if (loading) {
    return <div className="text-gray-500 animate-pulse text-center py-12">Loading lost pets...</div>;
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-gray-200 pb-4">
        <h2 className="text-xl font-semibold text-[#191919]">Lost Pets Management</h2>
        <div className="w-full md:w-64">
          <input
            type="text"
            placeholder="Search by name, city, or species..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-lg p-2 text-sm text-[#191919] focus:outline-none focus:border-[#c2e59c] transition-colors"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-[#555555]">
          <thead className="bg-gray-50 text-[#191919]">
            <tr>
              <th className="p-4 font-semibold rounded-tl-xl">Pet Info</th>
              <th className="p-4 font-semibold">Location & Type</th>
              <th className="p-4 font-semibold">Contact</th>
              <th className="p-4 font-semibold">Posted</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold rounded-tr-xl">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {filteredPets.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500 italic border-b border-gray-200">No posts found.</td>
              </tr>
            ) : (
              filteredPets.map(pet => (
                <tr key={pet.id} className="hover:bg-gray-50 transition-colors border-b border-gray-200">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                        {pet.photo_url ? (
                          <img src={pet.photo_url} alt={pet.pet_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs">No img</div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-[#191919] text-base">{pet.pet_name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500 capitalize">{pet.species}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="mb-1"><span className="font-semibold text-gray-500">City:</span> {pet.city}</p>
                    <p><span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${pet.pet_type === 'lost' ? 'bg-red-500/20 text-red-600' : 'bg-blue-500/20 text-blue-600'}`}>
                      {pet.pet_type === 'lost' ? 'Lost' : 'Found'}
                    </span></p>
                  </td>
                  <td className="p-4">
                    {pet.contact_email && <p className="text-xs mb-1 break-all">{pet.contact_email}</p>}
                    {pet.contact_phone && <p className="text-xs">{pet.contact_phone}</p>}
                    {!pet.contact_email && !pet.contact_phone && <p className="text-xs text-gray-500">N/A</p>}
                  </td>
                  <td className="p-4 text-xs">
                    {new Date(pet.created_at).toLocaleDateString()}
                    <br/>
                    <span className="text-gray-500">{formatDistanceToNow(new Date(pet.created_at))} ago</span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${pet.status === 'resolved' ? 'bg-green-500/20 text-green-600' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {pet.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-2 w-28">
                      {pet.status === 'active' && (
                        <button
                          onClick={() => handleAction(pet.id, 'resolve')}
                          disabled={processingId === pet.id}
                          className="w-full bg-green-500 hover:bg-green-600 text-black font-bold py-1.5 px-2 rounded-lg text-xs transition-colors disabled:opacity-50"
                        >
                          {processingId === pet.id ? '...' : 'Mark Resolved'}
                        </button>
                      )}
                      <button
                        onClick={() => handleAction(pet.id, 'delete')}
                        disabled={processingId === pet.id}
                        className="w-full bg-red-500/20 hover:bg-red-500/40 text-red-600 font-bold py-1.5 px-2 rounded-lg border border-red-500/30 text-xs transition-colors disabled:opacity-50"
                      >
                        {processingId === pet.id ? '...' : 'Delete Post'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
