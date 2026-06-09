'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { X, Send, Check, Wifi } from 'lucide-react';

// Client-side Supabase for Realtime (uses anon key — fine since RLS is disabled)
const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
  bookingDetails
}: ChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<typeof supabaseClient.channel> | null>(null);

  // Fetch full message history from API
  const fetchMessages = useCallback(async () => {
    if (!bookingId || !currentUserEmail) return;
    try {
      const res = await fetch(
        `/api/petsitting/messages?booking_id=${bookingId}&email=${encodeURIComponent(currentUserEmail)}&t=${Date.now()}`
      );
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('[ChatModal] Error fetching messages:', err);
    } finally {
      setIsLoading(false);
    }
  }, [bookingId, currentUserEmail]);

  // Setup Supabase Realtime subscription
  useEffect(() => {
    if (!isOpen || !bookingId) return;

    console.log('[ChatModal] Opening for booking_id:', bookingId, 'email:', currentUserEmail);

    setIsLoading(true);
    setMessages([]);

    // 1. Load initial history
    fetchMessages();

    // 2. Subscribe to realtime inserts on this booking
    const channel = supabaseClient
      .channel(`messages:${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `booking_id=eq.${bookingId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          console.log('[ChatModal] Realtime: new message received', newMsg.id);
          setMessages((prev) => {
            // Avoid duplicates — replace optimistic message if same content+sender
            const filtered = prev.filter(
              (m) =>
                !(
                  m.id.startsWith('temp-') &&
                  m.sender_email === newMsg.sender_email &&
                  m.message === newMsg.message
                )
            );
            return [...filtered, newMsg];
          });
        }
      )
      .subscribe((status) => {
        console.log('[ChatModal] Realtime status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;

    return () => {
      console.log('[ChatModal] Unsubscribing from realtime');
      supabaseClient.removeChannel(channel);
      channelRef.current = null;
      setIsConnected(false);
    };
  }, [isOpen, bookingId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    const msgText = newMessage.trim();
    setNewMessage('');

    // Optimistic UI — show immediately
    const optimisticMsg: Message = {
      id: 'temp-' + Date.now(),
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

      if (!res.ok) {
        const errorData = await res.json();
        console.error('[ChatModal] Send failed:', errorData);
        alert(`Failed to send message: ${errorData.error || 'Unknown error'}`);
        // Revert optimistic message
        setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      }
      // On success, realtime subscription will replace the optimistic message automatically
    } catch (err) {
      console.error('[ChatModal] Error sending message:', err);
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center sm:p-4 p-0">
      <div
        className="bg-white sm:rounded-2xl rounded-none w-full max-w-lg h-full sm:h-[600px] flex flex-col shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white z-10 shrink-0 shadow-sm">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              Chat with {otherUserName}
              <span
                title={isConnected ? 'Live — connected' : 'Connecting...'}
                className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-gray-300'} transition-colors`}
              />
            </h3>
            <p className="text-gray-500 text-xs font-medium mt-0.5">{bookingDetails}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-3">
                <span className="text-2xl">💬</span>
              </div>
              <p className="text-gray-500 font-medium">No messages yet</p>
              <p className="text-gray-400 text-sm mt-1">Send a message to start the conversation.</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMine = msg.sender_email === currentUserEmail;
              const isLastMine =
                isMine &&
                (idx === messages.length - 1 ||
                  messages[idx + 1].sender_email !== currentUserEmail);
              const isOptimistic = msg.id.startsWith('temp-');

              return (
                <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`max-w-[80%] px-4 py-2.5 rounded-2xl transition-opacity ${
                      isMine
                        ? `bg-blue-500 text-white rounded-tr-sm ${isOptimistic ? 'opacity-60' : 'opacity-100'}`
                        : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm'
                    }`}
                  >
                    <p className="text-[15px] whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                  </div>

                  <div className={`flex items-center gap-1 mt-1 px-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-[11px] text-gray-400 font-medium">
                      {isOptimistic
                        ? 'Sending...'
                        : new Date(msg.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                    </span>
                    {isMine && isLastMine && msg.read && !isOptimistic && (
                      <span className="flex items-center text-[10px] text-blue-500 font-bold ml-1">
                        <Check size={12} className="mr-0.5" /> Seen
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 sm:p-4 bg-white border-t border-gray-100 shrink-0">
          <form onSubmit={handleSendMessage} className="flex items-end gap-2">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="w-full bg-transparent border-none focus:ring-0 resize-none p-3 max-h-32 min-h-[44px] text-sm text-gray-800"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
              />
            </div>
            <button
              type="submit"
              disabled={!newMessage.trim() || isSending}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-colors flex shrink-0 items-center justify-center h-[44px] w-[44px]"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
