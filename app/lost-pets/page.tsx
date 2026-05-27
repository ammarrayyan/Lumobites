'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

export default function LostPetsFeed() {
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterSpecies, setFilterSpecies] = useState('all');

  useEffect(() => {
    const fetchPets = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filterType !== 'all') params.append('type', filterType);
        if (filterSpecies !== 'all') params.append('species', filterSpecies);
        if (searchQuery) params.append('q', searchQuery);

        const res = await fetch(`/api/lost-pets?${params.toString()}`);
        const data = await res.json();
        if (res.ok) {
          setPets(data.pets || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const delay = setTimeout(fetchPets, 500);
    return () => clearTimeout(delay);
  }, [searchQuery, filterType, filterSpecies]);

  return (
    <div className="min-h-screen bg-[#FDFAF7] font-sans">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-black text-[#4A3E3D] mb-3">Community Pet Board</h1>
            <p className="text-[#8B5E3C] font-medium text-lg">Help reunite lost pets with their families in your neighborhood.</p>
          </div>
          <Link href="/lost-pets/post" className="bg-[#8B5E3C] hover:bg-[#7A5234] text-white font-bold py-4 px-8 rounded-full transition-transform transform hover:scale-105 shadow-md flex items-center gap-2 flex-shrink-0">
            <span className="text-xl">📢</span> Report Lost/Found Pet
          </Link>
        </div>

        {/* Search & Filters */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-[#E8DDD4] mb-8 flex flex-col md:flex-row gap-4 sticky top-4 z-10">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by city or zip code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C] font-semibold"
          >
            <option value="all">All Types</option>
            <option value="lost">Lost Pets</option>
            <option value="found">Found Pets</option>
          </select>
          <select
            value={filterSpecies}
            onChange={(e) => setFilterSpecies(e.target.value)}
            className="bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C] font-semibold"
          >
            <option value="all">All Species</option>
            <option value="dog">Dogs</option>
            <option value="cat">Cats</option>
            <option value="other">Other</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-20 text-[#8B5E3C] font-bold text-lg animate-pulse">Loading pets...</div>
        ) : pets.length === 0 ? (
          <div className="text-center bg-white p-16 rounded-3xl border border-[#E8DDD4] shadow-sm">
            <span className="text-5xl mb-4 block">🐾</span>
            <h3 className="text-2xl font-bold text-[#4A3E3D] mb-2">No pets found</h3>
            <p className="text-[#8B7E7D]">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pets.map((pet) => (
              <div key={pet.id} className="bg-white rounded-3xl overflow-hidden border border-[#E8DDD4] shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 flex flex-col">
                <div className="relative h-64 overflow-hidden bg-gray-100">
                  {pet.photo_url ? (
                    <img src={pet.photo_url} alt={pet.pet_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">No Photo</div>
                  )}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase shadow-md ${
                      pet.status === 'resolved' ? 'bg-green-500 text-white' :
                      pet.type === 'lost' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
                    }`}>
                      {pet.status === 'resolved' ? 'Resolved 🎉' : pet.type}
                    </span>
                  </div>
                </div>
                
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-2xl font-black text-[#4A3E3D] truncate pr-2">
                      {pet.pet_name || 'Unknown Pet'}
                    </h3>
                    <span className="text-xs font-bold text-[#8B5E3C] bg-[#FAF6F4] px-2 py-1 rounded-lg capitalize">
                      {pet.species}
                    </span>
                  </div>
                  
                  <p className="text-sm font-semibold text-[#8B7E7D] mb-4 flex items-center gap-1">
                    📍 {pet.city}, {pet.zip_code}
                  </p>
                  
                  <p className="text-[#555555] text-sm mb-6 line-clamp-3 flex-1">
                    {pet.description}
                  </p>

                  <div className="border-t border-[#E8DDD4] pt-4 mt-auto">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-semibold text-[#8B7E7D]">
                        {pet.type === 'lost' ? 'Lost on:' : 'Found on:'} {new Date(pet.date_lost_found).toLocaleDateString()}
                      </span>
                      <span className="text-xs text-[#8B7E7D]">
                        Posted {formatDistanceToNow(new Date(pet.created_at))} ago
                      </span>
                    </div>
                    
                    <Link href={`/lost-pets/${pet.id}`} className="block w-full text-center bg-[#FAF6F4] hover:bg-[#F0E6DD] border border-[#E8DDD4] text-[#8B5E3C] font-bold py-3 rounded-xl transition-colors">
                      View Details & Help
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
