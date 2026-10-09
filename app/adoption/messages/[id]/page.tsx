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

function AdoptionMessageContent({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const petId = resolvedParams.id;
  const router = useRouter();

  // Edge-swipe-right-to-go-back gesture
  useSwipeBack({ fallbackUrl: '/adoption?tab=messages' });

  const [pet, setPet] = useState<PetDetails | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const [targetAdopter, setTargetAdopter] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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

  const shelterEmail = (
    pet?.shelters?.email ||
    (pet as any)?.shelter_email ||
    ''
  ).toLowerCase().trim();

  const isShelter = !!(
    currentUserEmail &&
    shelterEmail &&
    currentUserEmail === shelterEmail
  );

  const displayName = isShelter
    ? (targetAdopter ? targetAdopter.split('@')[0] : 'Adopter')
    : (pet?.shelters?.org_name || (pet as any)?.shelter_name || 'Rescue Partner');
  const targetEmail = isShelter ? (targetAdopter || '') : (shelterEmail || (pet?.shelters as any)?.email || '');

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#FDFAF7] flex items-center justify-center">
        <div className="text-xs text-[#8B5E3C] font-bold">Loading conversation…</div>
      </div>
    );
  }

  const handleReportUser = async (email: string, type: 'sitter' | 'user' | 'shelter' | 'poster') => {
    if (!email) return;
    const reason = window.prompt("Please state the reason for reporting this user/conversation:");
    if (!reason || !reason.trim()) return;
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reported_email: email,
          reporter_email: currentUserEmail || 'anonymous@lumobites.net',
          reason: reason.trim(),
          details: `Adoption inquiry report for pet: ${pet?.name || petId}`,
          reported_type: type,
        }),
      });
      if (res.ok) {
        alert('Thank you. Your report has been submitted to admin for review.');
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Failed to submit report. Please try again.');
      }
    } catch {
      alert('An error occurred submitting the report. Please try again.');
    }
  };

  const handleBlockUser = async (email: string) => {
    if (!email) return;
    if (!window.confirm("Are you sure you want to block this user? You will no longer see their inquiries or listings.")) return;
    try {
      const blocker = currentUserEmail || 'anonymous@lumobites.net';
      await fetch('/api/petsitting/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blockerEmail: blocker,
          blockedEmail: email
        })
      });
      if (typeof window !== 'undefined') {
        try {
          const currentBlocked = JSON.parse(localStorage.getItem('lumo_blocked_emails') || '[]');
          if (!currentBlocked.includes(email.toLowerCase().trim())) {
            currentBlocked.push(email.toLowerCase().trim());
            localStorage.setItem('lumo_blocked_emails', JSON.stringify(currentBlocked));
          }
        } catch {}
      }
      alert('User blocked successfully.');
      if (isShelter) router.push('/adoption/shelter/dashboard');
      else router.push('/adoption');
    } catch {
      alert('Failed to block user. Please try again.');
    }
  };

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
        onReport={handleReportUser}
        onBlock={handleBlockUser}
        petDetails={pet}
        chatType="adoption"
        shelterId={(pet as any)?.shelter_id}
      />
    </div>
  );
}

export default function AdoptionMessagePage(props: { params: Promise<{ id: string }> }) {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-[#FDFAF7] flex items-center justify-center text-xs text-[#8B5E3C] font-bold">Loading conversation…</div>}>
      <AdoptionMessageContent {...props} />
    </React.Suspense>
  );
}

