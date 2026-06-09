'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Send, Check, CheckCheck } from 'lucide-react';

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
}

export default function ChatModal({
  isOpen,
  onClose,
  bookingId,
  currentUserEmail,
  otherUserName,
  bookingDetails,
}: ChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch full message history
  const fetchMessages = useCallback(async (silent = false) => {
    if (!bookingId || !currentUserEmail) return;
    try {
      const res = await fetch(
        `/api/petsitting/messages?booking_id=${bookingId}&email=${encodeURIComponent(currentUserEmail)}&t=${Date.now()}`
      );
      if (res.ok) {
        const data = await res.json();
        // Replace ALL temp messages with confirmed ones from server
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('[ChatModal] Error fetching messages:', err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [bookingId, currentUserEmail]);

  // Open: load history + start polling every 4 seconds
  useEffect(() => {
    if (!isOpen || !bookingId) return;

    setIsLoading(true);
    setMessages([]);
    fetchMessages();

    // Poll every 4s for new messages (fallback if realtime not enabled)
    pollIntervalRef.current = setInterval(() => fetchMessages(true), 4000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [isOpen, bookingId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-grow textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const msgText = newMessage.trim();
    if (!msgText || isSending) return;

    setIsSending(true);
    setNewMessage('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    // Optimistic message
    const tempId = 'temp-' + Date.now();
    const optimisticMsg: Message = {
      id: tempId,
      booking_id: bookingId,
      sender_email: currentUserEmail,
      receiver_email: '',
      message: msgText,
      read: false,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const res = await fetch('/api/petsitting/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: bookingId,
          sender_email: currentUserEmail,
          message: msgText,
        }),
      });

      if (res.ok) {
        // Fetch confirmed messages from server — replaces the optimistic one
        await fetchMessages(true);
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error('[ChatModal] Send failed:', errorData);
        alert(`Failed to send: ${errorData.error || 'Please try again'}`);
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setNewMessage(msgText); // restore
      }
    } catch (err) {
      console.error('[ChatModal] Network error:', err);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setNewMessage(msgText);
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  // Group messages by date
  const groupedMessages: { date: string; msgs: Message[] }[] = [];
  messages.forEach((msg) => {
    const dateLabel = new Date(msg.created_at).toLocaleDateString([], {
      weekday: 'short', month: 'short', day: 'numeric',
    });
    const last = groupedMessages[groupedMessages.length - 1];
    if (last && last.date === dateLabel) {
      last.msgs.push(msg);
    } else {
      groupedMessages.push({ date: dateLabel, msgs: [msg] });
    }
  });

  const initials = otherUserName ? otherUserName.charAt(0).toUpperCase() : '?';

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 p-0">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div
        className="relative bg-white sm:rounded-2xl rounded-t-3xl w-full max-w-md sm:max-w-lg flex flex-col shadow-2xl overflow-hidden"
        style={{ height: 'min(600px, 92vh)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── Header ─── */}
        <div className="shrink-0 bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-3.5 flex items-center gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-base shrink-0 ring-2 ring-white/40">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-base leading-tight truncate">{otherUserName}</p>
            <p className="text-blue-100 text-xs truncate">{bookingDetails}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* ─── Messages ─── */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
              <p className="text-gray-400 text-sm">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3 pb-8">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center border-2 border-blue-100">
                <span className="text-3xl">💬</span>
              </div>
              <div>
                <p className="text-gray-700 font-semibold">Start the conversation</p>
                <p className="text-gray-400 text-sm mt-1">Send a message to {otherUserName}</p>
              </div>
            </div>
          ) : (
            groupedMessages.map(({ date, msgs }) => (
              <div key={date}>
                {/* Date separator */}
                <div className="flex items-center gap-3 my-3">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{date}</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                <div className="space-y-1">
                  {msgs.map((msg, idx) => {
                    const isMine = msg.sender_email === currentUserEmail;
                    const isOptimistic = msg.id.startsWith('temp-');
                    const isLastInGroup = idx === msgs.length - 1 || msgs[idx + 1].sender_email !== msg.sender_email;

                    return (
                      <div key={msg.id} className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
                        {/* Other party avatar — only on last of group */}
                        {!isMine && (
                          <div className={`w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-[10px] shrink-0 ${isLastInGroup ? 'opacity-100' : 'opacity-0'}`}>
                            {initials}
                          </div>
                        )}

                        <div className={`max-w-[72%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                          <div
                            className={`px-3.5 py-2.5 rounded-2xl text-[14px] leading-relaxed whitespace-pre-wrap break-words ${
                              isMine
                                ? `bg-blue-500 text-white ${isLastInGroup ? 'rounded-br-sm' : ''} ${isOptimistic ? 'opacity-70' : ''}`
                                : `bg-white text-gray-800 border border-gray-100 shadow-sm ${isLastInGroup ? 'rounded-bl-sm' : ''}`
                            }`}
                          >
                            {msg.message}
                          </div>

                          {isLastInGroup && (
                            <div className={`flex items-center gap-1 mt-1 px-0.5 ${isMine ? 'justify-end' : 'justify-start'}`}>
                              <span className="text-[10px] text-gray-400">
                                {isOptimistic
                                  ? 'Sending...'
                                  : new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {isMine && !isOptimistic && (
                                msg.read
                                  ? <CheckCheck size={12} className="text-blue-400" />
                                  : <Check size={12} className="text-gray-300" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ─── Input ─── */}
        <div className="shrink-0 bg-white border-t border-gray-100 px-3 py-3">
          <div className="flex items-end gap-2 bg-gray-100 rounded-2xl px-3 py-2 focus-within:ring-2 focus-within:ring-blue-400/50 transition-all">
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={handleTextareaChange}
              placeholder={`Message ${otherUserName}...`}
              rows={1}
              className="flex-1 bg-transparent border-none focus:outline-none resize-none text-sm text-gray-800 placeholder-gray-400 py-1 max-h-[120px] leading-relaxed"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!newMessage.trim() || isSending}
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all mb-0.5 ${
                newMessage.trim() && !isSending
                  ? 'bg-blue-500 hover:bg-blue-600 active:scale-95 text-white shadow-sm'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isSending ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </button>
          </div>
          <p className="text-[10px] text-gray-400 text-center mt-2">Press Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </div>
  );
}
