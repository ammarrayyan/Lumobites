'use client';

import React, { useState, useEffect, useRef, useCallback, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, CheckCheck, Check, PawPrint, AlertTriangle, ShieldAlert, Lock, Camera, Utensils, HeartPulse, Brain, Stethoscope, MessageSquare } from 'lucide-react';
import PetPhotoCarousel from '@/components/PetPhotoCarousel';
import ChatModal from '@/components/ChatModal';
import BookingProgressStepper from '@/components/BookingProgressStepper';
import SendPetUpdateModal from '@/components/SendPetUpdateModal';

interface Message {
  id: string;
  booking_id: string;
  sender_email: string;
  receiver_email: string;
  message: string;
  read: boolean;
  created_at: string;
}

interface SittingRequest {
  id: string;
  owner_email: string;
  owner_name?: string;
  pet_name: string;
  pet_type: string;
  dates: string;
  status: string;
  sitter_id: string;
  pet_details?: any;
  sitters?: {
    id: string;
    name: string;
    email: string;
    phone_number?: string;
    city?: string;
  };
}

function formatName(fullName: string): string {
  if (!fullName) return 'User';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?';
  const colors = [
    'from-violet-500 to-purple-600',
    'from-blue-500 to-cyan-500',
    'from-emerald-500 to-teal-600',
    'from-orange-500 to-rose-500',
    'from-pink-500 to-fuchsia-600',
  ];
  const colorIdx = name.charCodeAt(0) % colors.length;
  const sz = size === 'sm' ? 'w-8 h-8 text-[11px]' : size === 'lg' ? 'w-12 h-12 text-base' : 'w-10 h-10 text-xs';
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br ${colors[colorIdx]} flex items-center justify-center text-[#FFFFFF] font-bold shrink-0 shadow-sm`}>
      {initials}
    </div>
  );
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
}

export default function SitterOwnerChatPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const bookingId = resolvedParams.id;
  const router = useRouter();

  const [booking, setBooking] = useState<SittingRequest | null>(null);
  const [inquiryData, setInquiryData] = useState<{
    type: 'vet' | 'daycare';
    title: string;
    otherUserName: string;
    otherUserEmail: string;
    otherUserType: 'sitter' | 'user';
  } | null>(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(true);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showPetProfile, setShowPetProfile] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [showReportConfirm, setShowReportConfirm] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Identify current user email
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const pro = localStorage.getItem('lumo_pro_email') || '';
    const sitter = localStorage.getItem('lumo_sitter_email') || '';
    const ownerHist = localStorage.getItem('lumo_owner_history_email') || '';
    const email = (pro || sitter || ownerHist || '').toLowerCase().trim();
    setCurrentUserEmail(email);
  }, []);

  // Load booking or inquiry info
  useEffect(() => {
    if (!bookingId) return;
    let isMounted = true;

    async function loadBooking() {
      setIsDetailsLoading(true);
      try {
        const userEmail = (
          localStorage.getItem('lumo_pro_email') ||
          localStorage.getItem('lumo_sitter_email') ||
          localStorage.getItem('lumo_owner_history_email') ||
          ''
        ).toLowerCase().trim();

        // 1. Check if this ID is a real Pet Sitting booking
        const res = await fetch(`/api/petsitting/request?id=${bookingId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.booking && isMounted) {
            setBooking(data.booking);
            return; // It's a sitting request! Keep existing Sitter UI completely untouched!
          }
        }

        // 2. If not a sitting request, check if it's a Vet Boarding inquiry
        const vetRes = await fetch(`/api/vet-boarding/inquiries?id=${bookingId}`);
        if (vetRes.ok) {
          const vetData = await vetRes.json();
          if (vetData.inquiry && isMounted) {
            const inq = vetData.inquiry;
            const clinic = inq.vet_clinics;
            const clinicEmail = (clinic?.email || '').toLowerCase().trim();
            const isClinicOwner = userEmail && clinicEmail && userEmail === clinicEmail;

            setInquiryData({
              type: 'vet',
              title: `Boarding Inquiry • ${clinic?.clinic_name || 'Veterinary Clinic'}`,
              otherUserName: isClinicOwner ? (inq.owner_email?.split('@')[0] || 'Pet Owner') : (clinic?.clinic_name || 'Veterinary Clinic'),
              otherUserEmail: isClinicOwner ? (inq.owner_email || '') : (clinic?.email || ''),
              otherUserType: isClinicOwner ? 'user' : 'sitter',
            });
            return;
          }
        }

        // 3. Check if it's a Pet Daycare inquiry
        const daycareRes = await fetch(`/api/pet-daycare/inquiries?id=${bookingId}`);
        if (daycareRes.ok) {
          const daycareData = await daycareRes.json();
          if (daycareData.inquiry && isMounted) {
            const inq = daycareData.inquiry;
            const daycare = inq.pet_daycares;
            const daycareEmail = (daycare?.email || '').toLowerCase().trim();
            const isDaycareOwner = userEmail && daycareEmail && userEmail === daycareEmail;

            setInquiryData({
              type: 'daycare',
              title: `Daycare Inquiry • ${daycare?.business_name || 'Pet Daycare'}`,
              otherUserName: isDaycareOwner ? (inq.owner_email?.split('@')[0] || 'Pet Owner') : (daycare?.business_name || 'Pet Daycare'),
              otherUserEmail: isDaycareOwner ? (inq.owner_email || '') : (daycare?.email || ''),
              otherUserType: isDaycareOwner ? 'user' : 'sitter',
            });
            return;
          }
        }
      } catch (err) {
        console.error('Error fetching booking/inquiry details:', err);
      } finally {
        if (isMounted) setIsDetailsLoading(false);
      }
    }

    loadBooking();
    return () => { isMounted = false; };
  }, [bookingId]);

  // Fetch messages
  const fetchMessages = useCallback(async (silent = false) => {
    if (!bookingId) return;
    try {
      const emailQuery = currentUserEmail ? `&email=${encodeURIComponent(currentUserEmail)}` : '';
      const res = await fetch(
        `/api/petsitting/messages?booking_id=${bookingId}${emailQuery}&t=${Date.now()}`
      );
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch {}
    finally {
      if (!silent) setIsLoading(false);
    }
  }, [bookingId, currentUserEmail]);

  useEffect(() => {
    if (!bookingId) return;
    setIsLoading(true);
    fetchMessages();
    pollIntervalRef.current = setInterval(() => fetchMessages(true), 4000);
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [bookingId, fetchMessages]);

  const mainScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message inside container only (never scroll whole window)
  useEffect(() => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTop = mainScrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  const handleSend = async () => {
    const msgText = newMessage.trim();
    if (!msgText || isSending || !booking) return;

    setIsSending(true);
    setNewMessage('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    const tempId = 'temp-' + Date.now();
    setMessages(prev => [...prev, {
      id: tempId,
      booking_id: bookingId,
      sender_email: currentUserEmail,
      receiver_email: '',
      message: msgText,
      read: false,
      created_at: new Date().toISOString(),
    }]);

    try {
      const res = await fetch('/api/petsitting/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: bookingId,
          sender_email: currentUserEmail,
          message: msgText
        }),
      });
      if (res.ok) {
        await fetchMessages(true);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(`Failed to send: ${err.error || 'Please try again'}`);
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

  const handleSendPetUpdate = async (update: { photo_url?: string; category: string; note: string }) => {
    const payload = `[PET_UPDATE]${JSON.stringify(update)}`;
    const tempId = `temp-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: tempId,
      booking_id: bookingId,
      sender_email: currentUserEmail,
      receiver_email: otherUserEmail,
      message: payload,
      read: false,
      created_at: new Date().toISOString(),
    }]);

    try {
      const res = await fetch('/api/petsitting/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: bookingId,
          sender_email: currentUserEmail,
          message: payload,
        }),
      });
      if (res.ok) {
        await fetchMessages(true);
      }
    } catch (err) {
      console.error('Failed to send pet update', err);
    }
  };

  // Determine counterpart identity
  const isOwner = booking ? currentUserEmail.toLowerCase() === (booking.owner_email || '').toLowerCase() : false;
  const otherUserName = booking
    ? (isOwner ? booking.sitters?.name || 'Sitter' : booking.owner_name || 'Pet Owner')
    : 'Chat';
  const otherUserEmail = booking
    ? (isOwner ? booking.sitters?.email || '' : booking.owner_email || '')
    : '';
  const otherUserType = isOwner ? 'sitter' : 'user';

  const displayName = formatName(otherUserName);
  const bookingDetails = booking
    ? `${booking.pet_type ? booking.pet_type.toUpperCase() : 'PET'} • ${booking.dates || ''} • ${booking.status ? booking.status.toUpperCase() : ''}`
    : '';
  const petDetails = booking?.pet_details;

  // Group messages
  type MsgGroup = { date: string; sender: string; msgs: Message[] };
  const groups: MsgGroup[] = [];
  messages.forEach(msg => {
    const dateLabel = formatDateLabel(msg.created_at);
    const last = groups[groups.length - 1];
    if (last && last.date === dateLabel && last.sender === msg.sender_email) {
      last.msgs.push(msg);
    } else {
      groups.push({ date: dateLabel, sender: msg.sender_email, msgs: [msg] });
    }
  });

  const dateBoundaries = new Set<number>();
  let lastDate = '';
  messages.forEach((msg, i) => {
    const d = formatDateLabel(msg.created_at);
    if (d !== lastDate) { dateBoundaries.add(i); lastDate = d; }
  });

  const handleReportUser = async () => {
    if (!otherUserEmail) return;
    try {
      await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reported_email: otherUserEmail,
          reporter_email: currentUserEmail,
          reason: `Reported from chat (Booking ID: ${bookingId})`,
          target_type: otherUserType,
        }),
      });
      setShowReportConfirm(false);
      setReportSuccess(true);
      setTimeout(() => setReportSuccess(false), 4000);
    } catch {}
  };

  if (inquiryData) {
    const isPartner = inquiryData.otherUserType === 'user';
    const handleClose = () => {
      if (isPartner) {
        router.push(inquiryData.type === 'vet' ? '/vet-boarding/dashboard' : '/pet-daycare/dashboard');
      } else {
        if (typeof window !== 'undefined' && window.history.length > 1) {
          router.back();
        } else {
          router.push('/petsitting');
        }
      }
    };

    return (
      <div className="min-h-screen bg-[#FDFAF7]">
        <ChatModal
          isOpen={true}
          onClose={handleClose}
          bookingId={bookingId}
          bookingDetails={inquiryData.title}
          currentUserEmail={currentUserEmail}
          otherUserName={inquiryData.otherUserName}
          otherUserEmail={inquiryData.otherUserEmail}
          otherUserType={inquiryData.otherUserType}
          onReport={() => {}}
        />
      </div>
    );
  }

  if (isDetailsLoading && !booking) {
    return (
      <div className="min-h-screen bg-[#FDF9F5] flex flex-col items-center justify-center p-6 text-center">
        <div className="flex gap-1.5 mb-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2.5 h-2.5 rounded-full bg-[#8B5E3C] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
        <p className="text-xs font-bold text-[#8B7E7D]">Loading conversation...</p>
      </div>
    );
  }

  if (booking?.status === 'cancelled') {
    return (
      <div className="min-h-screen bg-[#FDF9F5] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4 text-red-600">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Booking Cancelled</h2>
        <p className="text-sm text-gray-600 max-w-md mb-6">
          This booking has been cancelled. The conversation is no longer available.
        </p>
        <button
          onClick={() => router.push('/petsitting')}
          className="bg-[#8B5E3C] hover:bg-[#734A2E] text-white font-bold py-3 px-6 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer border-none"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Pet Sitting
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#FDF9F5] flex flex-col min-h-[calc(100vh-140px)] pb-12">
      {/* ── TOP BAR: HEADER + PROGRESS STEPPER ── */}
      <div className="bg-white shadow-sm border-b border-[#E8DDD4] max-w-2xl w-full mx-auto sm:rounded-2xl overflow-hidden">
        <header className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => router.push('/petsitting')}
              className="p-1.5 rounded-xl hover:bg-[#FAF6F0] text-[#8B5E3C] transition-colors cursor-pointer border-none bg-transparent flex items-center justify-center"
              title="Back to Pet Sitting"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="relative shrink-0">
              <Avatar name={displayName} size="sm" />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full ring-2 ring-white" />
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="font-bold text-gray-900 text-sm md:text-base leading-tight truncate">{displayName}</h1>
              <p className="text-[11px] text-[#8B7E7D] truncate font-medium">{bookingDetails}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {petDetails && (
              <button 
                onClick={() => setShowPetProfile(prev => !prev)} 
                title="View Pet Care Profile"
                className={`p-2 rounded-xl flex items-center gap-1 text-xs font-bold transition-all cursor-pointer border-none ${
                  showPetProfile ? 'bg-[#8B5E3C] text-white' : 'bg-[#FAF6F0] text-[#8B5E3C] hover:bg-[#F5EDE4]'
                }`}
              >
                <PawPrint className="w-4 h-4" />
                <span className="hidden sm:inline">Pet Profile</span>
              </button>
            )}

            {otherUserEmail && (
              <button 
                onClick={() => setShowReportConfirm(true)} 
                title={`Report ${displayName}`}
                className="p-2 rounded-xl hover:bg-red-50 text-red-500 transition-colors cursor-pointer border-none bg-transparent"
              >
                <ShieldAlert className="w-5 h-5" />
              </button>
            )}
          </div>
        </header>

        {/* Visual Booking Progress Tracker Stepper */}
        {booking && (
          <div className="border-t border-gray-100">
            <BookingProgressStepper
              status={booking.status}
              dates={booking.dates}
              createdAt={(booking as any).created_at}
            />
          </div>
        )}
      </div>

      {/* Report confirmation notification */}
      {reportSuccess && (
        <div className="bg-emerald-600 text-white text-xs font-bold text-center py-2 px-4 animate-fade-in">
          ✓ Report submitted. Thank you for keeping our community safe.
        </div>
      )}

      {showReportConfirm && (
        <div className="bg-amber-50 border-b border-amber-200 p-3 px-4 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Report <strong>{displayName}</strong> for inappropriate behavior?</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleReportUser}
              className="bg-red-600 text-white font-bold px-3 py-1 rounded-lg text-xs hover:bg-red-700 cursor-pointer border-none"
            >
              Confirm Report
            </button>
            <button
              onClick={() => setShowReportConfirm(false)}
              className="bg-gray-200 text-gray-700 font-bold px-3 py-1 rounded-lg text-xs hover:bg-gray-300 cursor-pointer border-none"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── PET CARE PROFILE DRAWER / PANEL ── */}
      {showPetProfile && petDetails && (
        <div className="bg-white border-b border-[#E8DDD4] p-4 md:p-6 shadow-inner animate-fade-in">
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h3 className="font-extrabold text-[#191919] text-sm md:text-base flex items-center gap-2">
                <PawPrint className="w-5 h-5 text-[#8B5E3C]" /> Pet Care Profile
              </h3>
              <button 
                onClick={() => setShowPetProfile(false)}
                className="text-xs text-gray-400 hover:text-gray-600 font-bold cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="flex items-center gap-4 bg-[#FAF6F0] p-4 rounded-2xl border border-[#E8DDD4]">
              <PetPhotoCarousel
                photos={petDetails.photo_urls && petDetails.photo_urls.length > 0 ? petDetails.photo_urls : petDetails.photo_url ? [petDetails.photo_url] : []}
                alt={petDetails.pet_name}
                className="w-16 h-16 rounded-2xl"
              />
              <div>
                <h4 className="font-bold text-gray-900 text-base">{petDetails.pet_name}</h4>
                <p className="text-xs text-gray-500">
                  {petDetails.breed && `${petDetails.breed}`}
                  {petDetails.gender && ` • ${petDetails.gender}`}
                  {petDetails.age && ` • ${petDetails.age}`}
                  {petDetails.weight && ` • ${petDetails.weight}`}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-700">
              {petDetails.spayed_neutered !== undefined && (
                <div className="flex justify-between items-center bg-gray-50 px-3.5 py-2.5 rounded-xl border border-gray-100">
                  <span className="font-bold text-gray-600">Spayed/Neutered</span>
                  <span className="font-semibold">{petDetails.spayed_neutered ? 'Yes' : 'No'}</span>
                </div>
              )}

              {petDetails.feeding_schedule && (
                <div className="space-y-1 md:col-span-2">
                  <span className="font-bold text-gray-600 flex items-center gap-1.5">
                    <Utensils className="w-3.5 h-3.5 text-[#8B5E3C]" /> Feeding Schedule
                  </span>
                  <div className="bg-amber-50/60 border border-amber-100 p-3 rounded-xl leading-relaxed">
                    {petDetails.feeding_schedule}
                  </div>
                </div>
              )}

              {petDetails.medication && (
                <div className="space-y-1 md:col-span-2">
                  <span className="font-bold text-gray-600 flex items-center gap-1.5">
                    <HeartPulse className="w-3.5 h-3.5 text-rose-500" /> Medications
                  </span>
                  <div className="bg-red-50/50 border border-red-100 p-3 rounded-xl leading-relaxed">
                    {petDetails.medication}
                  </div>
                </div>
              )}

              {petDetails.behavior_notes && (
                <div className="space-y-1 md:col-span-2">
                  <span className="font-bold text-gray-600 flex items-center gap-1.5">
                    <Brain className="w-3.5 h-3.5 text-blue-500" /> Behavior Notes
                  </span>
                  <div className="bg-blue-50/50 border border-blue-100 p-3 rounded-xl leading-relaxed">
                    {petDetails.behavior_notes}
                  </div>
                </div>
              )}

              {(petDetails.vet_name || petDetails.vet_phone) && (
                <div className="space-y-1 md:col-span-2">
                  <span className="font-bold text-gray-600 flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-emerald-600" /> Veterinary Contact
                  </span>
                  <div className="bg-gray-50 border border-gray-200 p-3 rounded-xl space-y-1">
                    {petDetails.vet_name && <div><strong>Clinic/Vet:</strong> {petDetails.vet_name}</div>}
                    {petDetails.vet_phone && <div><strong>Phone:</strong> {petDetails.vet_phone}</div>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN MESSAGES LIST ── */}
      <main ref={mainScrollRef} className="flex-1 overflow-y-auto max-w-2xl w-full mx-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="flex gap-2">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-2.5 h-2.5 rounded-full bg-[#8B5E3C] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
            <p className="text-gray-400 text-xs font-medium">Loading conversation…</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#8B5E3C]/10 text-[#8B5E3C] flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-[#8B5E3C]" />
            </div>
            <div>
              <p className="font-extrabold text-gray-800 text-base">Say hello to {displayName}</p>
              <p className="text-gray-500 text-xs mt-1">Send a message to coordinate pet care details</p>
            </div>
          </div>
        ) : (
          groups.map((group, gi) => {
            const isMine = group.sender.toLowerCase() === currentUserEmail.toLowerCase();
            const firstMsgIdx = messages.indexOf(group.msgs[0]);
            const showDate = dateBoundaries.has(firstMsgIdx);

            return (
              <React.Fragment key={`${group.date}-${gi}`}>
                {/* Date Header */}
                {showDate && (
                  <div className="flex items-center justify-center my-3">
                    <span className="bg-white/90 backdrop-blur-sm text-gray-500 text-[11px] font-bold px-3 py-1 rounded-full shadow-xs border border-gray-200">
                      {group.date}
                    </span>
                  </div>
                )}

                {/* Message Stack */}
                <div className={`flex items-end gap-2 my-1 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                  {!isMine ? (
                    <Avatar name={displayName} size="sm" />
                  ) : (
                    <div className="w-8 shrink-0" />
                  )}

                  <div className={`flex flex-col gap-1 max-w-[82%] sm:max-w-[75%] ${isMine ? 'items-end' : 'items-start'}`}>
                    {group.msgs.map((msg, mi) => {
                      const isFirst = mi === 0;
                      const isLast = mi === group.msgs.length - 1;
                      const isOptimistic = msg.id.startsWith('temp-');

                      const isPetUpdate = msg.message.startsWith('[PET_UPDATE]');
                      let updateData: { photo_url?: string; category?: string; note?: string } | null = null;
                      if (isPetUpdate) {
                        try {
                          updateData = JSON.parse(msg.message.slice(12));
                        } catch {}
                      }

                      const myRadius = [
                        isFirst ? 'rounded-tl-2xl rounded-tr-2xl' : 'rounded-tl-2xl rounded-tr-xs',
                        isLast ? 'rounded-bl-2xl rounded-br-xs' : 'rounded-bl-xs rounded-br-xs',
                      ].join(' ');
                      const theirRadius = [
                        isFirst ? 'rounded-tl-2xl rounded-tr-2xl' : 'rounded-tl-xs rounded-tr-2xl',
                        isLast ? 'rounded-br-2xl rounded-bl-xs' : 'rounded-br-xs rounded-bl-xs',
                      ].join(' ');

                      return (
                        <div key={msg.id}>
                          {updateData ? (
                            /* Rich Pet Care Update Card */
                            <div className={`p-4 rounded-2xl border shadow-sm max-w-sm space-y-2.5 ${
                              isMine ? 'bg-[#FAF6F0] border-[#E8DDD4] text-[#2B231D]' : 'bg-white border-[#E8DDD4] text-[#2B231D]'
                            }`}>
                              <div className="flex items-center justify-between border-b border-[#E8DDD4]/60 pb-2">
                                <div className="flex items-center gap-1.5 text-xs font-black text-[#8B5E3C]">
                                  <Camera className="w-3.5 h-3.5" />
                                  <span>Pet Care Update</span>
                                </div>
                                {updateData.category && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-[#8B5E3C] border border-[#E8DDD4]">
                                    {updateData.category}
                                  </span>
                                )}
                              </div>
                              {updateData.photo_url && (
                                <div className="rounded-xl overflow-hidden border border-[#E8DDD4] aspect-video max-h-56 bg-[#FAF6F4] flex items-center justify-center">
                                  <img src={updateData.photo_url} alt="Pet update photo" className="w-full h-full object-cover" />
                                </div>
                              )}
                              <p className="text-xs text-[#2B231D] font-medium leading-relaxed whitespace-pre-wrap">
                                {updateData.note}
                              </p>
                            </div>
                          ) : (
                            /* Standard Chat Message */
                            <div
                              className={`px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed break-words whitespace-pre-wrap ${
                                isMine
                                  ? `bg-[#8B5E3C] text-white ${myRadius} ${isOptimistic ? 'opacity-70' : 'opacity-100'}`
                                  : `bg-white text-gray-900 shadow-sm border border-[#E8DDD4] ${theirRadius}`
                              }`}
                            >
                              {msg.message}
                            </div>
                          )}

                          {isLast && (
                            <div className={`flex items-center gap-1 mt-1 px-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                              <span className="text-[10px] text-gray-400 font-medium">
                                {isOptimistic ? 'Sending…' : formatTime(msg.created_at)}
                              </span>
                              {isMine && !isOptimistic && (
                                msg.read
                                  ? <CheckCheck size={13} className="text-[#8B5E3C]" />
                                  : <Check size={13} className="text-gray-300" />
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* ── STICKY INPUT FOOTER ── */}
      {booking?.status === 'completed' ? (
        <footer className="shrink-0 bg-white border-t border-[#E8DDD4] p-4 text-center shadow-sm pb-20 md:pb-4 z-30">
          <div className="max-w-2xl mx-auto flex items-center justify-center gap-2 text-xs font-bold text-amber-900 bg-amber-50/80 py-3 px-4 rounded-xl border border-amber-200">
            <Lock className="w-4 h-4 text-amber-700 shrink-0" />
            This booking has been completed. Messaging is closed.
          </div>
        </footer>
      ) : (
        <footer className="shrink-0 bg-white border-t border-[#E8DDD4] p-3 md:p-4 pb-20 md:pb-4 z-30">
          <div className="max-w-2xl mx-auto">
            <div className={`flex items-end gap-2 rounded-2xl border transition-all duration-200 px-3.5 py-2.5 ${
              newMessage ? 'border-[#8B5E3C] bg-white shadow-sm' : 'border-gray-200 bg-[#FAF6F0]'
            }`}>
              {booking && (
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(true)}
                  title="Send Pet Care Update"
                  className="pressable p-2 rounded-xl text-[#8B5E3C] bg-white hover:bg-[#F5EDE4] border border-[#E8DDD4] flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer shrink-0 shadow-2xs mb-0.5"
                >
                  <Camera className="w-4 h-4" />
                  <span className="hidden sm:inline">Update</span>
                </button>
              )}
              <textarea
                ref={textareaRef}
                value={newMessage}
                onChange={handleTextareaChange}
                placeholder={`Message ${displayName}…`}
                rows={1}
                className="flex-1 bg-transparent border-none focus:outline-none resize-none text-sm text-gray-800 placeholder-gray-400 leading-relaxed py-1"
                style={{ maxHeight: '120px' }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
                }}
              />
              <button
                onClick={handleSend}
                disabled={!newMessage.trim() || isSending}
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-150 mb-0.5 border-none ${
                  newMessage.trim() && !isSending
                    ? 'bg-[#8B5E3C] hover:bg-[#734A2E] active:scale-95 text-white shadow-sm cursor-pointer'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isSending
                  ? <div className="w-4 h-4 border-[2px] border-white/40 border-t-white rounded-full animate-spin" />
                  : <Send size={15} className={newMessage.trim() ? 'translate-x-[1px]' : ''} />
                }
              </button>
            </div>
            <p className="text-center text-[10px] text-gray-400 mt-2 select-none font-medium">
              Press Enter to send &middot; Shift+Enter for line break
            </p>
          </div>
        </footer>
      )}

      {/* Send Pet Update Modal */}
      <SendPetUpdateModal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        petName={booking?.pet_name}
        onSendUpdate={handleSendPetUpdate}
      />
    </div>
  );
}
