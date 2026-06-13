'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Send, CheckCheck, Check, Phone, Video, Info, PawPrint, Dog, Cat } from 'lucide-react';

// Privacy: show first name + last initial only (e.g. "Ammar Alrayyan" → "Ammar A.")
function formatName(fullName: string): string {
  if (!fullName) return 'User';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

interface Message {
  id: string;
  booking_id: string;
  sender_email: string;
  receiver_email: string;
  message: string;
  read: boolean;
  created_at: string;
}

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  currentUserEmail: string;
  otherUserName: string;
  bookingDetails: string;
  otherUserEmail: string;
  otherUserType: 'sitter' | 'user';
  onReport: (email: string, type: 'sitter' | 'user') => void;
  petDetails?: any;
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
  const sz = size === 'sm' ? 'w-7 h-7 text-[10px]' : size === 'lg' ? 'w-12 h-12 text-base' : 'w-9 h-9 text-xs';
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br ${colors[colorIdx]} flex items-center justify-center text-white font-bold shrink-0 shadow-sm`}>
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

export default function ChatModal({
  isOpen,
  onClose,
  bookingId,
  currentUserEmail,
  otherUserName,
  bookingDetails,
  otherUserEmail,
  otherUserType,
  onReport,
  petDetails,
}: ChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [showPetProfile, setShowPetProfile] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchMessages = useCallback(async (silent = false) => {
    if (!bookingId || !currentUserEmail) return;
    try {
      const res = await fetch(
        `/api/petsitting/messages?booking_id=${bookingId}&email=${encodeURIComponent(currentUserEmail)}&t=${Date.now()}`
      );
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch {}
    finally { if (!silent) setIsLoading(false); }
  }, [bookingId, currentUserEmail]);

  useEffect(() => {
    if (!isOpen || !bookingId) return;
    setIsLoading(true);
    setMessages([]);
    fetchMessages();
    pollIntervalRef.current = setInterval(() => fetchMessages(true), 4000);
    return () => { if (pollIntervalRef.current) clearInterval(pollIntervalRef.current); };
  }, [isOpen, bookingId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
  };

  const handleSend = async () => {
    const msgText = newMessage.trim();
    if (!msgText || isSending) return;
    setIsSending(true);
    setNewMessage('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    const tempId = 'temp-' + Date.now();
    setMessages(prev => [...prev, {
      id: tempId, booking_id: bookingId, sender_email: currentUserEmail,
      receiver_email: '', message: msgText, read: false, created_at: new Date().toISOString(),
    }]);

    try {
      const res = await fetch('/api/petsitting/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: bookingId, sender_email: currentUserEmail, message: msgText }),
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

  if (!isOpen) return null;

  const displayName = formatName(otherUserName);

  // Group messages by date + consecutive sender
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

  // Collect date boundaries for separators
  const dateBoundaries = new Set<number>();
  let lastDate = '';
  messages.forEach((msg, i) => {
    const d = formatDateLabel(msg.created_at);
    if (d !== lastDate) { dateBoundaries.add(i); lastDate = d; }
  });

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-6 p-0">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        style={{ animation: 'fadeIn 0.15s ease' }}
        onClick={onClose}
      />

      {/* Modal — compact on mobile so no zoom needed */}
      <div
        className="relative flex flex-col bg-white sm:rounded-2xl rounded-t-[24px] overflow-hidden shadow-2xl w-full max-w-[420px]"
        style={{ height: 'min(520px, 75svh)', animation: 'slideUp 0.2s cubic-bezier(0.34,1.56,0.64,1)' }}
        onClick={e => e.stopPropagation()}
      >

        {/* ── HEADER ── */}
        <div className="shrink-0 bg-white border-b border-gray-100 px-4 pt-4 pb-3 flex items-center gap-3">
          {/* Drag pill (mobile) */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-gray-200 sm:hidden" />

          <div className="relative">
            <Avatar name={displayName} size="sm" />
            {/* Online dot */}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full ring-2 ring-white" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-[14px] leading-tight truncate">{displayName}</p>
            <p className="text-[10px] text-gray-500 truncate">{bookingDetails}</p>
          </div>

          {/* Action icons */}
          <div className="flex items-center gap-1">
            {petDetails && (
              <button 
                onClick={() => setShowPetProfile(prev => !prev)} 
                title="View Pet Care Profile"
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors mr-1 cursor-pointer ${
                  showPetProfile ? 'bg-amber-100 text-amber-700 hover:bg-amber-150' : 'hover:bg-amber-50 text-amber-600'
                }`}
              >
                <PawPrint size={16} />
              </button>
            )}
            {otherUserEmail && (
              <button 
                onClick={() => onReport(otherUserEmail, otherUserType)} 
                title={`Report ${displayName}`}
                className="w-8 h-8 rounded-full hover:bg-red-50 flex items-center justify-center text-red-500 transition-colors mr-1 cursor-pointer"
              >
                <span className="text-xs">⚠️</span>
              </button>
            )}
            <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors cursor-pointer">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── MESSAGES ── */}
        <div
          className="flex-1 overflow-y-auto py-3 px-3 space-y-[2px]"
          style={{ background: 'linear-gradient(180deg, #f8faff 0%, #f0f2f5 100%)' }}
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className="flex gap-1.5">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
              <p className="text-gray-400 text-xs">Loading messages</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 pb-8">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                <span className="text-4xl">👋</span>
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-800 text-[15px]">Say hello to {displayName}</p>
                <p className="text-gray-400 text-sm mt-1">This is the beginning of your conversation</p>
              </div>
            </div>
          ) : (
            <>
              {groups.map((group, gi) => {
                const isMine = group.sender === currentUserEmail;
                const firstMsgIdx = messages.indexOf(group.msgs[0]);
                const showDate = dateBoundaries.has(firstMsgIdx);

                return (
                  <React.Fragment key={`${group.date}-${gi}`}>
                    {/* Date separator */}
                    {showDate && (
                      <div className="flex items-center justify-center py-3">
                        <span className="bg-white/80 backdrop-blur-sm text-gray-400 text-[11px] font-semibold px-3 py-1 rounded-full shadow-sm border border-gray-100">
                          {group.date}
                        </span>
                      </div>
                    )}

                    {/* Message group */}
                    <div className={`flex items-end gap-2 mb-1 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                      {/* Avatar — only for other person, only once per group */}
                      {!isMine ? (
                        <Avatar name={displayName} size="sm" />
                      ) : (
                        <div className="w-7 shrink-0" />
                      )}

                      {/* Bubble stack */}
                      <div className={`flex flex-col gap-[3px] max-w-[72%] ${isMine ? 'items-end' : 'items-start'}`}>
                        {group.msgs.map((msg, mi) => {
                          const isFirst = mi === 0;
                          const isLast = mi === group.msgs.length - 1;
                          const isOptimistic = msg.id.startsWith('temp-');

                          // Messenger-style bubble rounding
                          const myRadius = [
                            isFirst ? 'rounded-tl-2xl rounded-tr-2xl' : 'rounded-tl-2xl rounded-tr-sm',
                            isLast ? 'rounded-bl-2xl rounded-br-sm' : 'rounded-bl-sm rounded-br-sm',
                          ].join(' ');
                          const theirRadius = [
                            isFirst ? 'rounded-tl-2xl rounded-tr-2xl' : 'rounded-tl-sm rounded-tr-2xl',
                            isLast ? 'rounded-br-2xl rounded-bl-sm' : 'rounded-br-sm rounded-bl-sm',
                          ].join(' ');

                          return (
                            <div key={msg.id}>
                              <div
                                className={`px-3 py-2 rounded-2xl text-[13px] leading-relaxed break-words whitespace-pre-wrap max-w-full transition-opacity ${
                                  isMine
                                    ? `bg-blue-500 text-white ${myRadius} ${isOptimistic ? 'opacity-60' : 'opacity-100'}`
                                    : `bg-white text-gray-800 shadow-sm border border-gray-100 ${theirRadius}`
                                }`}
                                style={{ wordBreak: 'break-word' }}
                              >
                                {msg.message}
                              </div>

                              {/* Timestamp + status — only last in group */}
                              {isLast && (
                                <div className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-end pr-1' : 'justify-start pl-1'}`}>
                                  <span className="text-[10.5px] text-gray-400">
                                    {isOptimistic ? 'Sending…' : formatTime(msg.created_at)}
                                  </span>
                                  {isMine && !isOptimistic && (
                                    msg.read
                                      ? <CheckCheck size={13} className="text-blue-400" />
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
              })}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ── INPUT BAR ── */}
        <div className="shrink-0 bg-white border-t border-gray-100 px-3 py-2.5">
          <div className={`flex items-end gap-2 rounded-2xl border transition-all duration-200 px-3 py-2 ${
            newMessage ? 'border-blue-400 bg-white shadow-sm shadow-blue-100' : 'border-gray-200 bg-gray-50'
          }`}>
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={handleTextareaChange}
              placeholder={`Message ${displayName}…`}
              rows={1}
              className="flex-1 bg-transparent border-none focus:outline-none resize-none text-[14px] text-gray-800 placeholder-gray-400 leading-relaxed py-0.5"
              style={{ maxHeight: '128px' }}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
              }}
            />
            <button
              onClick={handleSend}
              disabled={!newMessage.trim() || isSending}
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-150 mb-0.5 ${
                newMessage.trim() && !isSending
                  ? 'bg-blue-500 hover:bg-blue-600 active:scale-90 text-white shadow-md shadow-blue-200'
                  : 'bg-gray-100 text-gray-300 cursor-not-allowed'
              }`}
            >
              {isSending
                ? <div className="w-3.5 h-3.5 border-[2px] border-white/30 border-t-white rounded-full animate-spin" />
                : <Send size={14} className={newMessage.trim() ? 'translate-x-[1px]' : ''} />
              }
            </button>
          </div>
          <p className="text-center text-[10px] text-gray-300 mt-1.5 select-none">
            Enter to send &middot; Shift+Enter for new line
          </p>
        </div>

        {/* ── PET CARE PROFILE DRAWER ── */}
        {showPetProfile && petDetails && (
          <div 
            className="absolute inset-x-0 bottom-0 top-[60px] bg-white z-20 flex flex-col p-4 overflow-y-auto border-t border-gray-100"
            style={{ animation: 'slideUp 0.2s ease-out' }}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h4 className="font-black text-gray-800 text-[15px] flex items-center gap-1.5">
                <PawPrint className="w-5 h-5 text-[#8B5E3C]" /> Pet Care Profile
              </h4>
              <button 
                onClick={() => setShowPetProfile(false)}
                className="text-[11px] font-bold text-[#8B5E3C] hover:underline cursor-pointer border-none bg-transparent"
              >
                Back to Chat
              </button>
            </div>

            <div className="flex gap-4 mb-4 items-center">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0">
                {petDetails.photo_url ? (
                  <img src={petDetails.photo_url} alt={petDetails.pet_name} className="w-full h-full object-cover" />
                ) : (
                  petDetails.pet_type === 'cat' ? <Cat className="w-8 h-8 text-[#8B5E3C]" /> : petDetails.pet_type === 'dog' ? <Dog className="w-8 h-8 text-[#8B5E3C]" /> : <PawPrint className="w-8 h-8 text-[#8B5E3C]" />
                )}
              </div>
              <div>
                <h5 className="font-bold text-gray-900 text-[15px]">{petDetails.pet_name}</h5>
                <p className="text-xs text-gray-500">
                  {petDetails.breed && `${petDetails.breed}`}
                  {petDetails.gender && ` • ${petDetails.gender}`}
                  {petDetails.age && ` • ${petDetails.age}`}
                  {petDetails.weight && ` • ${petDetails.weight}`}
                </p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs text-gray-700">
              {petDetails.spayed_neutered !== undefined && (
                <div className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
                  <span className="font-bold text-gray-600">Spayed/Neutered</span>
                  <span className="font-semibold">{petDetails.spayed_neutered ? 'Yes' : 'No'}</span>
                </div>
              )}

              {petDetails.feeding_schedule && (
                <div className="space-y-1">
                  <span className="font-bold text-gray-600 block">🥣 Feeding Schedule</span>
                  <div className="bg-amber-50/50 border border-amber-100 p-2.5 rounded-xl leading-relaxed text-gray-700">
                    {petDetails.feeding_schedule}
                  </div>
                </div>
              )}

              {petDetails.medication && (
                <div className="space-y-1">
                  <span className="font-bold text-gray-600 block">💊 Medications</span>
                  <div className="bg-red-50/40 border border-red-100 p-2.5 rounded-xl leading-relaxed text-gray-700">
                    {petDetails.medication}
                  </div>
                </div>
              )}

              {petDetails.behavior_notes && (
                <div className="space-y-1">
                  <span className="font-bold text-gray-600 block">🧠 Behavior Notes</span>
                  <div className="bg-blue-50/40 border border-blue-100 p-2.5 rounded-xl leading-relaxed text-gray-700">
                    {petDetails.behavior_notes}
                  </div>
                </div>
              )}

              {(petDetails.vet_name || petDetails.vet_phone) && (
                <div className="space-y-1">
                  <span className="font-bold text-gray-600 block">🏥 Veterinary Contact</span>
                  <div className="bg-gray-50 border border-gray-200 p-2.5 rounded-xl space-y-0.5 text-gray-700">
                    {petDetails.vet_name && <div><strong>Clinic/Vet:</strong> {petDetails.vet_name}</div>}
                    {petDetails.vet_phone && <div><strong>Phone:</strong> {petDetails.vet_phone}</div>}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(24px) scale(0.97) } to { opacity: 1; transform: translateY(0) scale(1) } }
      `}</style>
    </div>
  );
}
