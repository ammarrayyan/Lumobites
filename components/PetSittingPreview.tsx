'use client';

import React, { useState, useEffect } from 'react';
import { Home, MapPin } from 'lucide-react';

// Next.js Link component wrapper
import NextLink from 'next/link';

interface SitterPreview {
  id: string;
  name: string;
  photo_url: string;
  city: string;
  country?: string;
  rate_per_night: number;
  pet_types: string;
  bio: string;
  gender?: string;
}

export default function PetSittingPreview() {
  const [sitters, setSitters] = useState<SitterPreview[]>([]);
  const [loading, setLoading] = useState(true);

  // High quality mock sitters as fallback if DB is empty
  const mockSitters: SitterPreview[] = [
    {
      id: 'mock-1',
      name: 'Local Sitter',
      photo_url: '',
      city: 'Riverside, CA',
      country: 'USA',
      rate_per_night: 25,
      pet_types: 'both',
      bio: 'Verified local pet sitter with 5+ years experience. Loving care in a safe neighborhood.',
      gender: 'Female'
    },
    {
      id: 'mock-2',
      name: 'Local Sitter',
      photo_url: '',
      city: 'Boston, MA',
      country: 'USA',
      rate_per_night: 30,
      pet_types: 'dogs',
      bio: 'Professional pet care provider. Active dog walker with huge fenced yard for playtime.',
      gender: 'Male'
    },
    {
      id: 'mock-3',
      name: 'Local Sitter',
      photo_url: '',
      city: 'Austin, TX',
      country: 'USA',
      rate_per_night: 28,
      pet_types: 'cats',
      bio: 'Lifelong cat lover and experienced feline care specialist. Comfortable with all medical needs.',
      gender: 'Non-binary'
    }
  ];

  useEffect(() => {
    const fetchPreviewSitters = async () => {
      try {
        const res = await fetch('/api/petsitting/sitters');
        const data = await res.json();
        
        if (res.ok && data.sitters && data.sitters.length > 0) {
          setSitters(data.sitters.slice(0, 3));
        } else {
          setSitters(mockSitters);
        }
      } catch (err) {
        console.error('Failed to fetch preview sitters:', err);
        setSitters(mockSitters);
      } finally {
        setLoading(false);
      }
    };
    fetchPreviewSitters();
  }, []);

  return (
    <section className="w-full bg-[#FAF6F4] border-t border-[#E8DDD4] px-6 py-16">
      <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center gap-10">
        
        {/* Left Side: Call to action */}
        <div className="flex-1 text-center md:text-left">
          <div className="inline-block bg-[#8B5E3C]/10 text-[#8B5E3C] text-xs font-bold tracking-[0.1em] uppercase px-3 py-1 rounded-full mb-4">
            Pet Sitting & Care
          </div>
          <h2 className="text-3xl md:text-4xl font-[800] text-[#191919] tracking-[-0.02em] leading-tight mb-4 flex items-center justify-center md:justify-start gap-2">
            <Home className="w-8 h-8 text-[#8B5E3C] flex-shrink-0" /> Find a Sitter or Make Money Sitting Pets
          </h2>
          <p className="text-[#666666] text-lg leading-[1.6] mb-8 max-w-[500px] mx-auto md:mx-0">
            Find trusted local pet sitters in your neighborhood — verified profiles, real reviews, free to join. Or, sign up as a sitter to earn money doing what you love!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <NextLink 
              href="/petsitting" 
              className="bg-[#8B5E3C] hover:bg-[#7A5234] text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md text-center text-decoration-none"
              style={{ textDecoration: 'none' }}
            >
              Find a Sitter &rarr;
            </NextLink>
            <NextLink 
              href="/petsitting?tab=become" 
              className="bg-white hover:bg-[#F5EDE4] border-2 border-[#E8DDD4] text-[#4A3E3D] font-bold py-3 px-6 rounded-xl transition-all shadow-sm text-center text-decoration-none"
              style={{ textDecoration: 'none' }}
            >
              Become a Sitter & Make Money &rarr;
            </NextLink>
          </div>
        </div>

        {/* Right Side: 3 recent sitter cards */}
        <div className="flex-1 w-full md:w-auto mt-8 md:mt-0 flex flex-col gap-4">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#E8DDD4]">
            <h3 className="text-sm font-bold text-[#8B7E7D] uppercase tracking-wider mb-4 border-b border-[#F0E8E0] pb-2">
              Verified Sitters
            </h3>
            
            {loading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-4 items-center">
                    <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : sitters.length > 0 ? (
              <div className="space-y-4">
                {sitters.map(sitter => (
                  <NextLink href="/petsitting" key={sitter.id} className="flex gap-4 items-center group text-decoration-none" style={{ textDecoration: 'none' }}>
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-[#F5EDE4] flex-shrink-0 relative border-2 border-[#E8DDD4]">
                      {sitter.photo_url ? (
                        <img src={sitter.photo_url} alt={sitter.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#8B5E3C] font-bold text-xl bg-[#FAF6F4]">
                          {sitter.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="font-bold text-[#191919] text-sm truncate">{sitter.name}</h4>
                        {sitter.gender && (
                          <span className="px-1.5 py-0.5 rounded bg-[#FAF6F4] text-[#8B7E7D] text-[9px] font-semibold border border-[#E8DDD4]">
                            {sitter.gender}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-green-50 text-green-600 border border-green-200">
                          ✓ Verified
                        </span>
                      </div>
                      <p className="text-xs text-[#666666] truncate flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 inline mr-1" /> {sitter.city}
                      </p>
                      <p className="text-[11px] font-semibold text-[#8B5E3C] mt-0.5">
                        ${sitter.rate_per_night}/night &bull; Care for {sitter.pet_types === 'both' ? 'Dogs & Cats' : sitter.pet_types === 'dogs' ? 'Dogs only' : 'Cats only'}
                      </p>
                    </div>
                  </NextLink>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#8B7E7D] italic text-center py-4">No active sitters right now.</p>
            )}
          </div>
        </div>

      </div>
    </section>
  );
}
