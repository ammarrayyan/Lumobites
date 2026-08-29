'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { Footprints, Camera, MapPin } from 'lucide-react';

export default function LostPetsPreview() {
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPets = async () => {
      try {
        const res = await fetch('/api/lost-pets');
        const data = await res.json();
        
        if (res.ok) {
          setPets(data.pets?.slice(0, 3) || []);
        } else {
          throw new Error(data.error);
        }
      } catch (err) {
        console.error('Failed to fetch preview pets:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPets();
  }, []);

  return (
    <section className="w-full bg-[#FAF6F4] border-t border-[#E8DDD4] px-6 py-16">
      <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center gap-10">
        
        {/* Left Side: Call to action */}
        <div className="flex-1 text-center md:text-left">
          <div className="inline-block bg-[#8B5E3C]/10 text-[#8B5E3C] text-xs font-bold tracking-[0.1em] uppercase px-3 py-1 rounded-full mb-4">
            Community Board
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#191919] tracking-[-0.02em] leading-tight mb-4 flex items-center justify-center md:justify-start gap-2">
            <Footprints className="w-7 h-7 text-[#8B5E3C] flex-shrink-0" /> Lost a pet? Found one?
          </h2>
          <p className="text-[#666666] text-sm md:text-base leading-[1.6] mb-8 max-w-[500px] mx-auto md:mx-0">
            Help reunite pets with their families in your neighborhood — completely free. Post a listing instantly, share it to your local groups, and join our alert network.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <Link 
              href="/lost-pets" 
              className="bg-[#8B5E3C] hover:bg-[#7A5234] text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md text-center"
              style={{ textDecoration: 'none' }}
            >
              View All Lost Pets &rarr;
            </Link>
            <Link 
              href="/lost-pets/post" 
              className="bg-white hover:bg-[#F5EDE4] border-2 border-[#E8DDD4] text-[#4A3E3D] font-bold py-3 px-6 rounded-xl transition-all shadow-sm text-center"
              style={{ textDecoration: 'none' }}
            >
              Report a Lost/Found Pet &rarr;
            </Link>
          </div>
        </div>

        {/* Right Side: 3 recent cards */}
        <div className="flex-1 w-full md:w-auto mt-8 md:mt-0 flex flex-col gap-4">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#E8DDD4]">
            <h3 className="text-sm font-bold text-[#8B7E7D] uppercase tracking-wider mb-4 border-b border-[#F0E8E0] pb-2">
              Recent Alerts
            </h3>
            
            {loading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-4 items-center">
                    <div className="w-16 h-16 bg-gray-200 rounded-xl"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : pets.length > 0 ? (
              <div className="space-y-4">
                {pets.map(pet => (
                  <Link href={`/lost-pets/${pet.id}`} key={pet.id} className="flex gap-4 items-center group text-decoration-none">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#F5EDE4] flex-shrink-0 relative">
                      {pet.photo_url ? (
                        <img src={pet.photo_url} alt={pet.pet_name} className="w-full h-full object-contain p-0.5 group-hover:scale-110 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Camera className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                        pet.status === 'resolved' ? 'bg-green-500' :
                        pet.pet_type === 'lost' ? 'bg-red-500' : 'bg-blue-500'
                      }`}></span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          pet.status === 'resolved' ? 'bg-green-50 text-green-600' :
                          pet.pet_type === 'lost' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                          {pet.status === 'resolved' ? 'Resolved 🎉' : pet.pet_type}
                        </span>
                        <h4 className="font-bold text-[#191919] text-sm truncate">{pet.pet_name || 'Unknown'}</h4>
                      </div>
                      <p className="text-xs text-[#666666] truncate flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" /> {pet.city}
                      </p>
                      <p className="text-[10px] text-[#999999] mt-0.5">
                        {formatDistanceToNow(new Date(pet.created_at))} ago
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#8B7E7D] italic text-center py-4">No active alerts right now.</p>
            )}
          </div>
        </div>

      </div>
    </section>
  );
}
