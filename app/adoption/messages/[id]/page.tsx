'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import ChatModal from '@/components/ChatModal';
import { useSwipeBack } from '@/lib/useSwipeBack';

interface PetDetails {
  id: string;
  name: string;
  species: string;
  breed?: string;
  age?: string;
  size?: string;
  sex?: string;
  status: string;
  photo_urls?: string[];
  description?: string;
  temperament?: string;
  shelter_id?: string;
  shelters?: {
    org_name: string;
    phone?: string;
    email: string;
  };
}

export default function AdoptionMessagePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const petId = resolvedParams.id;
  const router = useRouter();

  // Edge-swipe-right-to-go-back gesture
  useSwipeBack({ fallbackUrl: '/adoption?tab=messages' });

  const [pet, setPet] = useState<PetDetails | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const [targetAdopter, setTargetAdopter] = useState<string>('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const shelter = localStorage.getItem('lumo_shelter_email') || '';
    const pro = localStorage.getItem('lumo_pro_email') || '';
    const sitter = localStorage.getItem('lumo_sitter_email') || '';
    const email = (shelter || pro || sitter || '').toLowerCase().trim();
    setCurrentUserEmail(email);

    const searchParams = new URLSearchParams(window.location.search);
    const adopterParam = searchParams.get('adopter') || searchParams.get('user_email') || '';
    if (adopterParam) setTargetAdopter(adopterParam.toLowerCase().trim());
  }, []);

  // Fetch pet details
  useEffect(() => {
    if (!petId) return;
    async function loadPet() {
      try {
        const res = await fetch(`/api/adoption/pets?id=${petId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.pets && data.pets.length > 0) {
            setPet(data.pets.find((p: any) => p.id === petId) || data.pets[0]);
          }
        }
      } catch (err) {
        console.error('Error fetching pet details:', err);
      }
    }
    loadPet();
  }, [petId]);

  const isShelter = targetAdopter ? true : (pet?.shelters?.email?.toLowerCase().trim() === currentUserEmail.toLowerCase().trim());
  const displayName = isShelter ? (targetAdopter || 'Adopter') : (pet?.shelters?.org_name || 'Rescue Partner');
  const targetEmail = targetAdopter || ((pet?.shelters as any)?.email || '');

  return (
    <div className="min-h-screen bg-[#FDFAF7]">
      <ChatModal
        isOpen={true}
        onClose={() => {
          if (isShelter) router.push('/adoption/shelter/dashboard');
          else router.push('/adoption');
        }}
        bookingId={petId}
        bookingDetails={`Adoption Inquiry • ${pet?.name || 'Pet'}`}
        currentUserEmail={currentUserEmail}
        otherUserName={displayName}
        otherUserEmail={targetEmail}
        otherUserType={isShelter ? 'user' : 'shelter'}
        onReport={() => {}}
        petDetails={pet}
        chatType="adoption"
        shelterId={(pet as any)?.shelter_id}
      />
    </div>
  );
}

