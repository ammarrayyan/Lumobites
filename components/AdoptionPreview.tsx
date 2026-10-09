'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, Building2 } from 'lucide-react';

interface AdoptionPet {
  id: string;
  name: string;
  species: string;
  breed?: string;
  age?: string;
  photo_urls?: string[];
  shelters?: { org_name?: string };
  city?: string;
  state?: string;
}

export default function AdoptionPreview() {
  const [pets, setPets] = useState<AdoptionPet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPets = async () => {
      try {
        const res = await fetch('/api/adoption/pets');
        const data = await res.json();
        if (res.ok && data.pets && Array.isArray(data.pets) && data.pets.length > 0) {
          setPets(data.pets.slice(0, 3));
        } else {
          setPets([]);
        }
      } catch (err) {
        console.error('Failed to fetch adoption pets for preview:', err);
        setPets([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPets();
  }, []);

  // If loading or no real approved pets in the database, cleanly hide the section
  if (loading || pets.length === 0) {
    return null;
  }

  return (
    <section className="w-full bg-[#FDFAF7] px-6 py-12 border-t border-[#E8DDD4]">
      <div className="max-w-[1200px] mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#8B5E3C] font-bold text-xs uppercase tracking-wider mb-1">
              <Heart className="w-4 h-4 fill-[#8B5E3C]" /> Pet Adoption Portal
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-[#191919] tracking-tight">
              Adopt a Pet in Your Area
            </h2>
            <p className="text-[#666666] text-sm md:text-base mt-1 max-w-2xl leading-relaxed">
              Find adoptable pets from verified local shelters and rescue partners.
            </p>
          </div>

          <Link
            href="/adoption"
            className="bg-[#8B5E3C] hover:bg-[#734A2E] text-white font-bold text-xs py-3 px-5 rounded-2xl transition-all shadow-sm flex items-center gap-2 cursor-pointer no-underline shrink-0"
            style={{ textDecoration: 'none' }}
          >
            Explore All Adoptable Pets &rarr;
          </Link>
        </div>

        {/* Real Approved Pet Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {pets.map((pet) => (
            <Link
              key={pet.id}
              href={`/adoption?pet=${pet.id}`}
              className="bg-white rounded-3xl border border-[#E8DDD4] p-4 shadow-xs flex items-center gap-4 hover:shadow-md transition-all text-decoration-none"
              style={{ textDecoration: 'none' }}
            >
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[#F5EDE4] shrink-0">
                {pet.photo_urls && pet.photo_urls[0] ? (
                  <img src={pet.photo_urls[0]} alt={pet.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#8B5E3C] font-bold text-lg">
                    {pet.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-base text-gray-900 truncate">{pet.name}</h3>
                  {pet.age && (
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md">{pet.age}</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate">{pet.breed || pet.species}</p>
                <p className="text-[11px] text-[#8B5E3C] font-medium truncate mt-1 flex items-center gap-1">
                  <Building2 className="w-3 h-3 shrink-0" /> {pet.shelters?.org_name || (pet.city ? `${pet.city}${pet.state ? `, ${pet.state}` : ''}` : 'Local Rescue')}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
