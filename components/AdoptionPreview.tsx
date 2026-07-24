'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, Sparkles, Building2, ExternalLink } from 'lucide-react';

export default function AdoptionPreview() {
  const samplePets = [
    {
      name: 'Buddy',
      species: 'Dog',
      breed: 'Golden Retriever Mix',
      age: 'Young',
      photo: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=600&q=80',
      shelter: 'Happy Paws Rescue'
    },
    {
      name: 'Luna',
      species: 'Cat',
      breed: 'Domestic Shorthair',
      age: 'Adult',
      photo: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80',
      shelter: 'City Animal Shelter'
    },
    {
      name: 'Milo',
      species: 'Dog',
      breed: 'Beagle / Terrier',
      age: 'Puppy',
      photo: 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?auto=format&fit=crop&w=600&q=80',
      shelter: 'Second Chance Pet Haven'
    }
  ];

  return (
    <section className="w-full bg-[#FDFAF7] px-6 py-12 border-b border-[#E8DDD4]">
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
              Find adoptable pets from verified local shelters and RescueGroups partners. Use AI lifestyle matching or visual photo comparison to find your perfect match.
            </p>
          </div>

          <Link
            href="/adoption"
            className="bg-[#8B5E3C] hover:bg-[#734A2E] text-white font-bold text-xs py-3 px-5 rounded-2xl transition-all shadow-sm flex items-center gap-2 cursor-pointer no-underline shrink-0"
          >
            Explore All Adoptable Pets &rarr;
          </Link>
        </div>

        {/* Sample Pet Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {samplePets.map((pet, i) => (
            <div key={i} className="bg-white rounded-3xl border border-[#E8DDD4] p-4 shadow-xs flex items-center gap-4 hover:shadow-md transition-all">
              <img src={pet.photo} alt={pet.name} className="w-16 h-16 rounded-2xl object-cover shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-base text-gray-900 truncate">{pet.name}</h3>
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md">{pet.age}</span>
                </div>
                <p className="text-xs text-gray-500 truncate">{pet.breed}</p>
                <p className="text-[11px] text-[#8B5E3C] font-medium truncate mt-1 flex items-center gap-1">
                  <Building2 className="w-3 h-3 shrink-0" /> {pet.shelter}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
