'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin, Phone, Mail, Share2, Settings } from 'lucide-react';
import { formatPublicCity } from '@/lib/formatCity';
import FacebookStyleCommentThread from '@/components/FacebookStyleCommentThread';
import FacebookReactionPicker from '@/components/FacebookReactionPicker';

// Avatar palette, reused from the same treatment applied to City Board for visual consistency.
const AVATAR_COLORS = [
  { bg: '#F2D5D5', text: '#7A2222' },
  { bg: '#E1E8D5', text: '#2C3B1E' },
  { bg: '#E6E2F0', text: '#3A2C5C' },
  { bg: '#FFF3CD', text: '#664D03' },
  { bg: '#E2EBEB', text: '#234A4A' },
  { bg: '#F5E6DA', text: '#6E4225' },
  { bg: '#D9E2E8', text: '#2B3D45' },
  { bg: '#EADBCE', text: '#5C4533' },
];

const getAvatarColor = (key: string) => {
  if (!key) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

// Derives a no-PII display name from a signed-in email, e.g. "jane@x.com" -> "User J".
const getDisplayNameFromEmail = (email: string) => {
  const letter = (email || '').trim().charAt(0).toUpperCase();
  return letter ? `User ${letter}` : 'User';
};

// Extracts the meaningful letter for an avatar: the "J" from "User J", or the
// first letter of a legacy freeform name (e.g. "Sarah" -> "S").
const getAvatarLetter = (name: string) => {
  if (!name) return '?';
  const match = name.trim().match(/^User\s+([A-Za-z])$/i);
  if (match) return match[1].toUpperCase();
  return name.trim().charAt(0).toUpperCase();
};

const COMMENTS_PAGE_SIZE = 10;

export default function LostPetDetail({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  
  const [pet, setPet] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [newComment, setNewComment] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentPhoto, setCommentPhoto] = useState<string | null>(null);
  const [commentPhotoPreview, setCommentPhotoPreview] = useState<string | null>(null);

  const [copied, setCopied] = useState(false);
  const [showContact, setShowContact] = useState(false);

  const [editToken, setEditToken] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [blockedEmails, setBlockedEmails] = useState<string[]>([]);
  const [visibleCommentsCount, setVisibleCommentsCount] = useState(COMMENTS_PAGE_SIZE);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Auto-derive the comment display name from the signed-in email — no manual typing,
  // no PII shown (see getDisplayNameFromEmail).
  useEffect(() => {
    setCommentAuthor(getDisplayNameFromEmail(userEmail));
  }, [userEmail]);

  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent, photosLength: number) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    if (diff > 50) {
      setActivePhotoIndex(prev => (prev + 1) % photosLength);
    } else if (diff < -50) {
      setActivePhotoIndex(prev => (prev - 1 + photosLength) % photosLength);
    }
    setTouchStart(null);
  };

  const photosList = pet?.photos || (pet?.photo_url ? [pet.photo_url] : []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const emailVal = localStorage.getItem('lumo_pro_email') || localStorage.getItem('lumo_sitter_email') || '';
      setUserEmail(emailVal);
      const blocked = localStorage.getItem('lumo_blocked_emails');
      if (blocked) {
        try {
          setBlockedEmails(JSON.parse(blocked));
        } catch (e) {}
      }
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'lumo_pro_email' && e.newValue) {
        setUserEmail(e.newValue);
      }
    };
    const handleFocus = () => {
      const email = localStorage.getItem('lumo_pro_email') || '';
      if (email !== userEmail) {
        setUserEmail(email);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [userEmail]);

  const handleReportPost = async () => {
    if (!pet) return;
    const reason = window.prompt("Please enter the reason for reporting this post (e.g. Inappropriate Content, Spam, Harassment):");
    if (!reason || !reason.trim()) return;

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reported_by_email: userEmail || 'guest@lumobitespet.com',
          reporter_email: userEmail || 'guest@lumobitespet.com',
          reported_email: pet.contact_email || 'unknown@lumobitespet.com',
          reported_type: 'lost_pet',
          post_id: pet.id,
          post_type: 'lost_pet',
          reason: reason.trim(),
          details: `Reported Lost Pet Post ID: ${pet.id}`,
          status: 'pending'
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit report');
      }

      alert("Thank you. The report has been submitted to administrators for review.");
    } catch (err: any) {
      alert(err.message || "Failed to submit report. Please try again.");
    }
  };

  const handleBlockUser = () => {
    if (!pet?.contact_email) return;
    if (pet.contact_email.toLowerCase().trim() === userEmail.toLowerCase().trim()) {
      alert("You cannot block yourself.");
      return;
    }
    if (!window.confirm("Are you sure you want to block this user? You will no longer see their posts.")) return;

    const nextBlocked = [...blockedEmails, pet.contact_email.toLowerCase().trim()];
    if (typeof window !== 'undefined') {
      localStorage.setItem('lumo_blocked_emails', JSON.stringify(nextBlocked));
    }
    alert("User blocked successfully.");
    window.location.href = '/lost-pets';
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('token')) {
      setEditToken(params.get('token'));
    }
  }, []);

  useEffect(() => {
    const fetchPetAndComments = async () => {
      try {
        const petRes = await fetch(`/api/lost-pets/${id}`);
        if (!petRes.ok) throw new Error('Pet not found');
        const petData = await petRes.json();
        setPet(petData.pet);

        const commRes = await fetch(`/api/lost-pets/comments?lost_pet_id=${id}`);
        if (commRes.ok) {
          const commData = await commRes.json();
          setComments(commData.comments || []);
        }
      } catch (err) {
        setError('Failed to load pet details.');
      } finally {
        setLoading(false);
      }
    };
    fetchPetAndComments();
  }, [id]);

  const handleShare = async () => {
    if (!pet) return;
    const publicCity = formatPublicCity(pet.city) || pet.city;
    const text = `🚨 ${pet.type === 'lost' ? 'Lost' : 'Found'} ${pet.species} in ${publicCity}${pet.zip_code ? ` ${pet.zip_code}` : ''} — have you seen ${pet.pet_name || 'them'}?`;
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Lumo Bites Pet Board', text, url });
        return;
      } catch (err) {
        console.log('Share canceled', err);
      }
    }
    
    // Fallback to clipboard
    navigator.clipboard.writeText(`${text} ${url}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleOwnerAction = async (action: 'resolve' | 'delete') => {
    if (action === 'delete') {
      if (!window.confirm("Are you sure you want to delete this post? This cannot be undone.")) return;
    }
    
    setActionLoading(true);
    try {
      const endpoint = action === 'resolve' ? '/api/lost-pets/resolve' : '/api/lost-pets/delete';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, token: editToken, email: userEmail })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to perform action');
      }
      
      if (action === 'delete') {
        window.location.href = '/lost-pets';
      } else {
        setPet({ ...pet, status: 'resolved' });
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCommentPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const compressedBase64 = await resizeCommentPhoto(file);
        setCommentPhoto(compressedBase64);
        setCommentPhotoPreview(URL.createObjectURL(file));
      } catch (err) {
        console.error('Failed to compress comment photo:', err);
      }
    }
  };

  const resizeCommentPhoto = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const maxDim = 1200;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm("Are you sure you want to delete your update?")) return;

    try {
      const res = await fetch('/api/lost-pets/comments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment_id: commentId, email: userEmail })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete comment');
      }

      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err: any) {
      alert(err.message || 'Could not delete comment.');
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !commentAuthor.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await fetch('/api/lost-pets/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lost_pet_id: id,
          author_name: commentAuthor,
          comment_text: newComment,
          author_email: userEmail,
          photo_url: commentPhoto
        })
      });
      const data = await res.json();
      if (res.ok) {
        setComments([...comments, data.comment]);
        setNewComment('');
        setCommentPhoto(null);
        setCommentPhotoPreview(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F3EE] font-sans">
                <div className="flex items-center justify-center py-32 text-[#8B5E3C] font-bold text-xl animate-pulse">
          Loading details...
        </div>
      </div>
    );
  }

  if (error || !pet) {
    return (
      <div className="min-h-screen bg-[#F7F3EE] font-sans">
                <div className="max-w-xl mx-auto px-4 py-20 text-center">
          <h2 className="text-3xl font-black text-[#4A3E3D] mb-4">Post Not Found</h2>
          <p className="text-[#8B7E7D] mb-8">This post may have been removed or does not exist.</p>
          <Link href="/lost-pets" className="bg-[#8B5E3C] text-white font-bold py-3 px-8 rounded-xl hover:bg-[#7A5234]">
            Back to Board
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F3EE] font-sans pb-16">
      
      <main className="max-w-4xl mx-auto px-4 py-6 md:py-8">
        <button 
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined' && window.history.length > 1) {
              router.back();
            } else {
              router.push('/lost-pets');
            }
          }}
          className="text-[#8B5E3C] font-bold hover:underline mb-4 inline-flex items-center gap-1.5 cursor-pointer bg-transparent border-0 p-0 text-xs sm:text-sm transition-colors"
        >
          &larr; Back to Lost & Found Board
        </button>

        {pet.status === 'resolved' && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 sm:p-5 rounded-2xl mb-5 flex items-center gap-3.5 shadow-xs">
            <span className="text-3xl">🎉</span>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-emerald-950">Great News!</h2>
              <p className="text-xs sm:text-sm font-medium text-emerald-800">
                This pet has been {pet.type === 'lost' ? 'found and returned home safely' : 'reunited with their owner'}!
              </p>
            </div>
          </div>
        )}

        {/* Main Pet Card */}
        <div className="bg-white rounded-3xl overflow-hidden border border-[#E8DDD4] shadow-xs mb-6 sm:mb-8">
          <div className="flex flex-col md:flex-row">
            {/* Photo Gallery Column */}
            <div className="md:w-[52%] relative bg-[#FAF6F4] flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#E8DDD4] min-h-[320px] md:min-h-[460px]">
              
              {/* Main Image Slideshow Container */}
              <div 
                className="flex-1 relative flex items-center justify-center overflow-hidden cursor-zoom-in"
                onTouchStart={handleTouchStart}
                onTouchEnd={(e) => handleTouchEnd(e, photosList.length)}
                onClick={() => {
                  if (photosList[activePhotoIndex]) {
                    setPreviewImage(photosList[activePhotoIndex]);
                  }
                }}
              >
                {photosList.length > 0 ? (
                  <img 
                    src={photosList[activePhotoIndex]} 
                    alt={`${pet.pet_name || 'Pet'} - Image ${activePhotoIndex + 1}`} 
                    className="w-full h-full object-contain max-h-[440px] transition-all duration-300 select-none"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-semibold">
                    No Photo Available
                  </div>
                )}

                {/* Left/Right Click Navs */}
                {photosList.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePhotoIndex(prev => (prev - 1 + photosList.length) % photosList.length);
                      }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center font-bold text-base transition-all shadow-md cursor-pointer hover:scale-105 z-10"
                      aria-label="Previous photo"
                    >
                      &#8249;
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePhotoIndex(prev => (prev + 1) % photosList.length);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center font-bold text-base transition-all shadow-md cursor-pointer hover:scale-105 z-10"
                      aria-label="Next photo"
                    >
                      &#8250;
                    </button>
                  </>
                )}

                {/* Badge Overlay */}
                <div className="absolute top-3.5 left-3.5 z-10 flex items-center gap-1.5">
                  <span className={`px-3 py-1 rounded-full text-[11px] font-black tracking-wider uppercase shadow-xs ${
                    pet.status === 'resolved' ? 'bg-emerald-600 text-white' :
                    pet.type === 'lost' ? 'bg-rose-600 text-white' : 'bg-blue-600 text-white'
                  }`}>
                    {pet.status === 'resolved' ? 'Resolved 🎉' : pet.type}
                  </span>
                  {photosList.length > 1 && (
                    <span className="bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {activePhotoIndex + 1} / {photosList.length}
                    </span>
                  )}
                </div>
              </div>

              {/* Gallery Thumbnails List */}
              {photosList.length > 1 && (
                <div className="p-3 bg-white border-t border-[#E8DDD4] flex justify-center gap-2 overflow-x-auto">
                  {photosList.map((url: string, index: number) => (
                    <button
                      key={index}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePhotoIndex(index);
                      }}
                      className={`w-11 h-11 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                        activePhotoIndex === index ? 'border-[#8B5E3C] scale-105 shadow-xs' : 'border-transparent hover:border-gray-300 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details Column */}
            <div className="md:w-[48%] p-5 sm:p-7 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-3 mb-1.5 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[#3B2410] tracking-tight">
                    {pet.pet_name || 'Unknown Pet'}
                  </h1>
                  <span className="text-xs font-bold text-[#8B5E3C] bg-[#FAF6F4] border border-[#E8DDD4] px-2.5 py-1 rounded-xl capitalize shrink-0">
                    {pet.species}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-xs sm:text-sm text-[#8B7E7D] font-medium mb-4 flex-wrap">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#8B5E3C] shrink-0" />
                    {formatPublicCity(pet.city) || pet.city}{pet.zip_code ? `, ${pet.zip_code}` : ''}
                  </span>
                  <span>•</span>
                  <span>{pet.type === 'lost' ? 'Lost on' : 'Found on'}: {new Date(pet.date_lost_found).toLocaleDateString()}</span>
                </div>

                <div className="bg-[#FAF6F4] p-4 rounded-2xl mb-5 border border-[#E8DDD4]/70">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-[#8B5E3C] mb-1.5">Description</h3>
                  <p className="text-[#4A3E3D] text-sm leading-relaxed whitespace-pre-wrap">{pet.description}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 pt-2">
                {pet.status === 'active' && (
                  <>
                    {!showContact ? (
                      <button 
                        type="button"
                        onClick={() => setShowContact(true)}
                        className="w-full bg-[#4A3E3D] hover:bg-[#3A302F] text-white font-bold py-3 px-4 rounded-xl transition-all shadow-xs text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Phone className="w-4 h-4 text-white" /> Contact {pet.type === 'lost' ? 'Owner' : 'Finder'}
                      </button>
                    ) : (
                      <div className="bg-blue-50/80 border border-blue-200 p-3.5 rounded-xl text-center animate-fade-in">
                        <h4 className="font-bold text-blue-900 text-xs uppercase tracking-wider mb-2">Contact Information</h4>
                        {pet.contact_phone && (
                          <p className="text-blue-900 text-sm sm:text-base font-bold mb-1 flex items-center justify-center gap-1.5">
                            <Phone className="w-4 h-4 text-blue-700" /> {pet.contact_phone}
                          </p>
                        )}
                        {pet.contact_email && (
                          <p className="text-blue-900 text-sm sm:text-base font-bold flex items-center justify-center gap-1.5">
                            <Mail className="w-4 h-4 text-blue-700" />{' '}
                            <a href={`mailto:${pet.contact_email}`} className="hover:underline text-blue-800">
                              {pet.contact_email}
                            </a>
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Post Reactions */}
                <div className="py-2 px-1 border-t border-[#E8DDD4]/80 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#8B7E7D] uppercase tracking-wider">React</span>
                  <FacebookReactionPicker
                    itemId={pet.id}
                    size="md"
                    showSummary={true}
                  />
                </div>

                <button 
                  type="button"
                  onClick={handleShare}
                  className="w-full bg-[#FAF6F4] hover:bg-[#F0E6DD] border border-[#E8DDD4] text-[#8B5E3C] font-bold py-3 px-4 rounded-xl transition-all text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Share2 className="w-4 h-4 text-[#8B5E3C]" /> {copied ? 'Link Copied!' : 'Share this post'}
                </button>

                {userEmail && pet.contact_email && pet.contact_email.toLowerCase().trim() === userEmail.toLowerCase().trim() ? (
                  <div className="mt-4 border-t border-[#E8DDD4] pt-4">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-[#4A3E3D] mb-2.5 flex items-center gap-1.5">
                      <Settings className="w-3.5 h-3.5 text-gray-500" /> Manage Your Post
                    </h4>
                    <div className="flex gap-2">
                      {pet.status === 'active' && (
                        <button 
                          type="button"
                          onClick={() => handleOwnerAction('resolve')}
                          disabled={actionLoading}
                          className="flex-1 bg-[#8B5E3C] hover:bg-[#7A5234] text-white font-bold py-2.5 px-3 rounded-xl transition-all shadow-xs text-xs sm:text-sm disabled:opacity-50 cursor-pointer"
                        >
                          {actionLoading ? 'Processing...' : 'Mark as Resolved 🎉'}
                        </button>
                      )}
                      <button 
                        type="button"
                        onClick={() => handleOwnerAction('delete')}
                        disabled={actionLoading}
                        className="flex-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold py-2.5 px-3 rounded-xl transition-all shadow-xs text-xs sm:text-sm disabled:opacity-50 cursor-pointer"
                      >
                        {actionLoading ? 'Processing...' : 'Delete Post'}
                      </button>
                    </div>
                  </div>
                ) : editToken ? (
                  <div className="mt-4 border-t border-[#E8DDD4] pt-4">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-[#4A3E3D] mb-2.5 flex items-center gap-1.5">
                      <Settings className="w-3.5 h-3.5 text-gray-500" /> Manage Your Post
                    </h4>
                    <div className="flex gap-2">
                      {pet.status === 'active' && (
                        <button 
                          type="button"
                          onClick={() => handleOwnerAction('resolve')}
                          disabled={actionLoading}
                          className="flex-1 bg-[#8B5E3C] hover:bg-[#7A5234] text-white font-bold py-2.5 px-3 rounded-xl transition-all shadow-xs text-xs sm:text-sm disabled:opacity-50 cursor-pointer"
                        >
                          {actionLoading ? 'Processing...' : 'Mark as Resolved 🎉'}
                        </button>
                      )}
                      <button 
                        type="button"
                        onClick={() => handleOwnerAction('delete')}
                        disabled={actionLoading}
                        className="flex-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold py-2.5 px-3 rounded-xl transition-all shadow-xs text-xs sm:text-sm disabled:opacity-50 cursor-pointer"
                      >
                        {actionLoading ? 'Processing...' : 'Delete Post'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 border-t border-[#E8DDD4]/80 pt-3 flex gap-2">
                    <button 
                      type="button"
                      onClick={handleReportPost}
                      className="flex-1 bg-white hover:bg-gray-50 border border-gray-200 text-[#8B7E7D] font-bold py-2 px-3 rounded-xl transition-all text-xs cursor-pointer text-center flex items-center justify-center gap-1"
                    >
                      Flag Post
                    </button>
                    {pet.contact_email && (
                      <button 
                        type="button"
                        onClick={handleBlockUser}
                        className="flex-1 bg-white hover:bg-gray-50 border border-gray-200 text-[#8B7E7D] font-bold py-2 px-3 rounded-xl transition-all text-xs cursor-pointer text-center flex items-center justify-center gap-1"
                      >
                        Block Poster
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Facebook-style Community Updates & Comments Section */}
        <div id="comments" className="scroll-mt-8">
          <FacebookStyleCommentThread
            comments={comments}
            currentUserEmail={userEmail}
            currentUserName={commentAuthor || (userEmail ? getDisplayNameFromEmail(userEmail) : '')}
            postAuthorEmail={pet?.contact_email || ''}
            isPostAuthor={!!(userEmail && pet?.contact_email && userEmail.toLowerCase().trim() === pet.contact_email.toLowerCase().trim())}
            title="Community Updates"
            placeholder="Share a sighting, location detail, or helpful update..."
            allowPhoto={true}
            signInPromptText="Sign in to comment or share a sighting"
            requireAuth={true}
            onAddComment={async (text, photoUrl, parentId, replyToName) => {
              let payloadText = text;
              if (parentId && replyToName) {
                payloadText = `[[reply_to:${parentId}:${replyToName}]] ${text}`;
              }

              const res = await fetch('/api/lost-pets/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  lost_pet_id: id,
                  author_name: commentAuthor || (userEmail ? getDisplayNameFromEmail(userEmail) : 'Community Member'),
                  comment_text: payloadText,
                  author_email: userEmail,
                  photo_url: photoUrl
                })
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.error || 'Failed to post comment');
              if (data.comment) {
                setComments(prev => [...prev, data.comment]);
              }
            }}
            onDeleteComment={async (commentId) => {
              if (!window.confirm("Are you sure you want to delete this comment?")) return;

              const res = await fetch('/api/lost-pets/comments', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ comment_id: commentId, email: userEmail })
              });

              if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to delete comment');
              }

              setComments(prev => prev.filter(c => c.id !== commentId));
            }}
          />
        </div>
      </main>
    </div>
  );
}
