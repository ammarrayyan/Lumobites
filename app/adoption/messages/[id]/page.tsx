'use client';

import React, { useState, useEffect, useRef, useCallback, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, CheckCheck, Check, PawPrint, AlertTriangle, Lock, Building2 } from 'lucide-react';
import PetPhotoCarousel from '@/components/PetPhotoCarousel';

interface Message {
  id: string;
  pet_id: string;
  shelter_id: string;
  sender_email: string;
  receiver_email: string;
  message: string;
  read: boolean;
  created_at: string;
}

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
  shelters?: {
    org_name: string;
    phone?: string;
    email: string;
  };
}

function formatName(email: string, isShelter: boolean, orgName?: string): string {
  if (isShelter && orgName) return orgName;
  if (!email) return 'User';
  const namePart = email.split('@')[0];
  return namePart.charAt(0).toUpperCase() + namePart.slice(1);
}

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name ? name.slice(0, 2).toUpperCase() : '?';
  const colors = [
    'from-amber-500 to-orange-600',
    'from-emerald-500 to-teal-600',
    'from-blue-500 to-indigo-600',
  ];
  const colorIdx = name.charCodeAt(0) % colors.length;
  const sz = size === 'sm' ? 'w-8 h-8 text-[11px]' : size === 'lg' ? 'w-12 h-12 text-base' : 'w-10 h-10 text-xs';
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br ${colors[colorIdx]} flex items-center justify-center text-white font-bold shrink-0 shadow-xs`}>
      {initials}
    </div>
  );
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function AdoptionMessagePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const petId = resolvedParams.id;
  const router = useRouter();

  const [pet, setPet] = useState<PetDetails | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const pro = localStorage.getItem('lumo_pro_email') || '';
    const sitter = localStorage.getItem('lumo_sitter_email') || '';
    const shelter = localStorage.getItem('lumo_shelter_email') || '';
    const email = (shelter || pro || sitter || '').toLowerCase().trim();
    setCurrentUserEmail(email);
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

  // Fetch messages
  const fetchMessages = useCallback(async (silent = false) => {
    if (!petId) return;
    try {
      const emailQuery = currentUserEmail ? `&user_email=${encodeURIComponent(currentUserEmail)}` : '';
      const res = await fetch(`/api/adoption/messages?pet_id=${petId}${emailQuery}&t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch {}
    finally {
      if (!silent) setIsLoading(false);
    }
  }, [petId, currentUserEmail]);

  useEffect(() => {
    if (!petId) return;
    setIsLoading(true);
    fetchMessages();
    pollIntervalRef.current = setInterval(() => fetchMessages(true), 3000);
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [petId, fetchMessages]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async () => {
    const msgText = newMessage.trim();
    if (!msgText || isSending || !pet) return;

    if (pet.status === 'adopted') {
      alert('This pet has been adopted. Messaging is closed.');
      return;
    }

    setIsSending(true);
    setNewMessage('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    const tempId = 'temp-' + Date.now();
    setMessages(prev => [...prev, {
      id: tempId,
      pet_id: petId,
      shelter_id: pet.shelters ? (pet as any).shelter_id : '',
      sender_email: currentUserEmail,
      receiver_email: (pet.shelters as any)?.email || '',
      message: msgText,
      read: false,
      created_at: new Date().toISOString(),
    }]);

    try {
      const res = await fetch('/api/adoption/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pet_id: petId,
          shelter_id: (pet as any).shelter_id,
          sender_email: currentUserEmail,
          message: msgText
        }),
      });

      if (res.ok) {
        await fetchMessages(true);
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Failed to send: ${errData.error || 'Please try again'}`);
        setMessages(prev => prev.filter(m => m.id !== tempId));
        setNewMessage(msgText);
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setNewMessage(msgText);
    } finally {
      setIsSending(false);
    }
  };

  const isShelter = pet?.shelters?.email?.toLowerCase().trim() === currentUserEmail.toLowerCase().trim();
  const displayName = isShelter ? 'Adopter' : (pet?.shelters?.org_name || 'Rescue Partner');
  const isAdopted = pet?.status === 'adopted';

  return (
    <div className="min-h-screen bg-[#FDF9F5] flex flex-col justify-between">
      {/* HEADER */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E8DDD4] px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => router.push('/adoption')}
            className="p-1.5 rounded-xl hover:bg-[#FAF6F0] text-[#8B5E3C] transition-colors cursor-pointer border-none bg-transparent flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Avatar name={displayName} size="sm" />
          <div className="min-w-0 flex-1">
            <h1 className="font-bold text-gray-900 text-sm md:text-base leading-tight truncate">{displayName}</h1>
            <p className="text-[11px] text-[#8B7E7D] truncate font-medium">Inquiry about {pet?.name || 'Pet'}</p>
          </div>
        </div>

        {pet && (
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
              isAdopted ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {pet.status}
            </span>
          </div>
        )}
      </header>

      {/* PET INFO CARD */}
      {pet && (
        <div className="bg-white border-b border-[#E8DDD4] p-3 px-4 shadow-2xs">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <PetPhotoCarousel photoUrls={pet.photo_urls || []} petType={pet.species} className="w-12 h-12 rounded-xl shrink-0" />
            <div className="min-w-0 flex-1 text-xs">
              <h2 className="font-bold text-gray-900 text-sm">{pet.name}</h2>
              <p className="text-gray-500 truncate">{pet.breed} &bull; {pet.age} &bull; {pet.size}</p>
            </div>
          </div>
        </div>
      )}

      {/* MESSAGES BODY */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 space-y-3">
        {isLoading ? (
          <div className="py-20 text-center text-xs text-gray-400">Loading conversation…</div>
        ) : messages.length === 0 ? (
          <div className="py-16 text-center text-gray-500 text-xs space-y-1">
            <p className="font-bold text-sm text-gray-800">Start an inquiry with {displayName}</p>
            <p>Ask about temperament, adoption fees, or schedule a visit.</p>
          </div>
        ) : (
          messages.map(msg => {
            const isMine = msg.sender_email.toLowerCase() === currentUserEmail.toLowerCase();
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                  isMine ? 'bg-[#8B5E3C] text-white rounded-br-xs' : 'bg-white text-gray-900 border border-[#E8DDD4] shadow-xs rounded-bl-xs'
                }`}>
                  <p>{msg.message}</p>
                  <span className={`text-[10px] block mt-1 ${isMine ? 'text-white/70 text-right' : 'text-gray-400'}`}>
                    {formatTime(msg.created_at)}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* FOOTER */}
      {isAdopted ? (
        <footer className="sticky bottom-0 z-30 bg-white border-t border-[#E8DDD4] p-4 text-center">
          <div className="max-w-2xl mx-auto flex items-center justify-center gap-2 text-xs font-bold text-amber-900 bg-amber-50/90 py-3 px-4 rounded-xl border border-amber-200">
            <Lock className="w-4 h-4 text-amber-700 shrink-0" />
            This pet has been adopted! Messaging is closed.
          </div>
        </footer>
      ) : (
        <footer className="sticky bottom-0 z-30 bg-white border-t border-[#E8DDD4] p-3 md:p-4">
          <div className="max-w-2xl mx-auto flex items-center gap-2">
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder={`Ask about ${pet?.name || 'this pet'}…`}
              rows={1}
              className="flex-1 bg-[#FAF6F0] border border-gray-200 rounded-2xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#8B5E3C] resize-none"
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
              }}
            />
            <button
              onClick={handleSend}
              disabled={!newMessage.trim() || isSending}
              className="w-10 h-10 rounded-full bg-[#8B5E3C] hover:bg-[#734A2E] text-white flex items-center justify-center disabled:opacity-40 cursor-pointer border-none shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}
