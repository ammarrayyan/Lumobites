'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { Search, MapPin, Phone, Mail, Share2, Settings, Camera, Trash2, ChevronDown, Send } from 'lucide-react';

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
    const text = `🚨 ${pet.type === 'lost' ? 'Lost' : 'Found'} ${pet.species} in ${pet.city} ${pet.zip_code} — have you seen ${pet.pet_name || 'them'}?`;
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
    <div className="min-h-screen bg-[#F7F3EE] font-sans">
      
      <main className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        <button 
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined' && window.history.length > 1) {
              router.back();
            } else {
              router.push('/lost-pets');
            }
          }}
          className="text-[#8B5E3C] font-bold hover:underline mb-6 inline-flex items-center gap-1.5 cursor-pointer bg-transparent border-0 p-0 text-base"
        >
          &larr; Back to Board
        </button>

        {pet.status === 'resolved' && (
          <div className="bg-green-100 border border-green-300 text-green-800 p-6 rounded-2xl mb-8 flex items-center justify-center gap-4 shadow-sm animate-fade-in">
            <span className="text-4xl">🎉</span>
            <div>
              <h2 className="text-2xl font-black">Great News!</h2>
              <p className="font-medium">This pet has been {pet.type === 'lost' ? 'found and returned home safely' : 'reunited with their owner'}!</p>
            </div>
          </div>
        )}

        <div style={{ boxShadow: '0 2px 8px rgba(139, 94, 60, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)' }}
        className="bg-white rounded-3xl overflow-hidden border border-[#DFD3C7] shadow-xs mb-12">
          <div className="flex flex-col md:flex-row">
            {/* Photo Gallery Column */}
            <div className="md:w-[58%] relative bg-[#FAF5EE] flex flex-col justify-between border-r border-[#EADBCE] min-h-[400px] md:min-h-[550px]">
              
              {/* Main Image Slideshow Container */}
              <div 
                className="flex-1 relative flex items-center justify-center overflow-hidden"
                onTouchStart={handleTouchStart}
                onTouchEnd={(e) => handleTouchEnd(e, photosList.length)}
              >
                {photosList.length > 0 ? (
                  <img 
                    src={photosList[activePhotoIndex]} 
                    alt={`${pet.pet_name || 'Pet'} - Image ${activePhotoIndex + 1}`} 
                    className="w-full h-full object-contain max-h-[500px] transition-all duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">No Photo Available</div>
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
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center font-bold text-lg transition-all shadow-md cursor-pointer hover:scale-105 z-10"
                    >
                      &#8249;
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePhotoIndex(prev => (prev + 1) % photosList.length);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center font-bold text-lg transition-all shadow-md cursor-pointer hover:scale-105 z-10"
                    >
                      &#8250;
                    </button>
                  </>
                )}

                {/* Badge Overlay */}
                <div className="absolute top-4 left-4 z-10">
                  <span className={`px-4 py-2 rounded-full text-xs font-black tracking-wider uppercase shadow-md ${
                    pet.status === 'resolved' ? 'bg-green-500 text-white' :
                    pet.type === 'lost' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
                  }`}>
                    {pet.status === 'resolved' ? 'Resolved 🎉' : pet.type}
                  </span>
                </div>
              </div>

              {/* Gallery Thumbnails List */}
              {photosList.length > 1 && (
                <div className="p-4 bg-white border-t border-[#E8DDD4] flex justify-center gap-2 overflow-x-auto">
                  {photosList.map((url: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => setActivePhotoIndex(index)}
                      className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                        activePhotoIndex === index ? 'border-[#8B5E3C] scale-105 shadow-sm' : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <img src={url} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

            </div>

            {/* Details Column */}
            <div className="md:w-[42%] p-8 md:p-10 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-black text-[#4A3E3D]">{pet.pet_name || 'Unknown Pet'}</h1>
                <span className="text-sm font-bold text-[#8B5E3C] bg-[#FAF6F4] border border-[#E8DDD4] px-3 py-1 rounded-lg capitalize">
                  {pet.species}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-[#8B7E7D] font-medium mb-6">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  {pet.city}, {pet.zip_code}
                </span>
                <span>•</span>
                <span>{pet.type === 'lost' ? 'Lost on' : 'Found on'}: {new Date(pet.date_lost_found).toLocaleDateString()}</span>
              </div>

              <div className="bg-[#FAF6F4] p-6 rounded-2xl mb-8">
                <h3 className="font-bold text-[#4A3E3D] mb-2 text-lg">Description</h3>
                <p className="text-[#4A3E3D] text-[15px] sm:text-base leading-relaxed whitespace-pre-wrap">{pet.description}</p>
              </div>

              <div className="flex flex-col gap-4">
                {pet.status === 'active' && (
                  <>
                    {!showContact ? (
                      <button 
                        onClick={() => setShowContact(true)}
                        className="w-full bg-[#4A3E3D] hover:bg-[#3A302F] text-white font-bold py-4 rounded-xl transition-all shadow-md text-lg flex items-center justify-center gap-2"
                      >
                        <Phone className="w-5 h-5 text-white" /> Contact {pet.type === 'lost' ? 'Owner' : 'Finder'}
                      </button>
                    ) : (
                      <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-center animate-fade-in">
                        <h4 className="font-bold text-blue-900 mb-2">Contact Info</h4>
                        {pet.contact_phone && (
                          <p className="text-blue-800 text-lg font-bold mb-1 flex items-center justify-center gap-1.5">
                            <Phone className="w-4 h-4 text-blue-800" /> {pet.contact_phone}
                          </p>
                        )}
                        {pet.contact_email && (
                          <p className="text-blue-800 text-lg font-bold flex items-center justify-center gap-1.5">
                            <Mail className="w-4 h-4 text-blue-800" />{' '}
                            <a href={`mailto:${pet.contact_email}`} className="hover:underline">
                              {pet.contact_email}
                            </a>
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}

                <button 
                  onClick={handleShare}
                  className="w-full bg-[#FAF6F4] hover:bg-[#F0E6DD] border border-[#E8DDD4] text-[#8B5E3C] font-bold py-4 rounded-xl transition-all text-lg flex items-center justify-center gap-2"
                >
                  <Share2 className="w-5 h-5 text-[#8B5E3C]" /> {copied ? 'Link Copied!' : 'Share this post'}
                </button>

                {userEmail && pet.contact_email && pet.contact_email.toLowerCase().trim() === userEmail.toLowerCase().trim() ? (
                  <div className="mt-6 border-t border-[#E8DDD4] pt-6">
                    <h4 className="font-bold text-[#4A3E3D] mb-3 flex items-center gap-2">
                      <Settings className="w-5 h-5 text-gray-500" /> Manage Your Post
                    </h4>
                    <div className="flex flex-col gap-3">
                      {pet.status === 'active' && (
                        <button 
                          onClick={() => handleOwnerAction('resolve')}
                          disabled={actionLoading}
                          className="w-full bg-[#8B5E3C] hover:bg-[#7A5234] text-white font-bold py-3 rounded-xl transition-all shadow-sm text-sm disabled:opacity-50 cursor-pointer"
                        >
                          {actionLoading ? 'Processing...' : 'Mark as Resolved 🎉'}
                        </button>
                      )}
                      <button 
                        onClick={() => handleOwnerAction('delete')}
                        disabled={actionLoading}
                        className="w-full bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold py-3 rounded-xl transition-all shadow-sm text-sm disabled:opacity-50 cursor-pointer"
                      >
                        {actionLoading ? 'Processing...' : 'Delete My Post'}
                      </button>
                    </div>
                  </div>
                ) : editToken ? (
                  <div className="mt-6 border-t border-[#E8DDD4] pt-6">
                    <h4 className="font-bold text-[#4A3E3D] mb-3 flex items-center gap-2">
                      <Settings className="w-5 h-5 text-gray-500" /> Manage Your Post
                    </h4>
                    <div className="flex flex-col gap-3">
                      {pet.status === 'active' && (
                        <button 
                          onClick={() => handleOwnerAction('resolve')}
                          disabled={actionLoading}
                          className="w-full bg-[#8B5E3C] hover:bg-[#7A5234] text-white font-bold py-3 rounded-xl transition-all shadow-sm text-sm disabled:opacity-50 cursor-pointer"
                        >
                          {actionLoading ? 'Processing...' : 'Mark as Resolved 🎉'}
                        </button>
                      )}
                      <button 
                        onClick={() => handleOwnerAction('delete')}
                        disabled={actionLoading}
                        className="w-full bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold py-3 rounded-xl transition-all shadow-sm text-sm disabled:opacity-50 cursor-pointer"
                      >
                        {actionLoading ? 'Processing...' : 'Delete My Post'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 border-t border-[#E8DDD4] pt-6 flex gap-3">
                    <button 
                      onClick={handleReportPost}
                      className="flex-1 bg-white hover:bg-gray-50 border border-gray-200 text-[#8B7E7D] font-bold py-3 rounded-xl transition-all text-sm cursor-pointer text-center flex items-center justify-center gap-1.5"
                    >
                      Flag Post
                    </button>
                    {pet.contact_email && (
                      <button 
                        onClick={handleBlockUser}
                        className="flex-1 bg-white hover:bg-gray-50 border border-gray-200 text-[#8B7E7D] font-bold py-3 rounded-xl transition-all text-sm cursor-pointer text-center flex items-center justify-center gap-1.5"
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

        {/* Comments Section */}
        <div className="max-w-3xl mx-auto">
          <h3 className="text-2xl font-black text-[#4A3E3D] mb-6">Community Updates ({comments.length})</h3>
          
          <div className="mb-8">
            {comments.length > 0 && (
              <div className="space-y-3">
                {comments.slice(0, visibleCommentsCount).map((comment) => {
                  const isAuthor = userEmail && (
                    (comment.author_email && comment.author_email.toLowerCase().trim() === userEmail.toLowerCase().trim()) ||
                    userEmail.toLowerCase().trim() === 'ammar-rayyan@hotmail.com' ||
                    userEmail.toLowerCase().trim() === 'reviewer@lumobites.net'
                  );
                  const avatarColor = getAvatarColor(comment.author_email || comment.author_name || comment.id);
                  const avatarLetter = getAvatarLetter(comment.author_name);

                  return (
                    <div key={comment.id} className="flex gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm font-black text-sm"
                        style={{ backgroundColor: avatarColor.bg, color: avatarColor.text }}
                      >
                        {avatarLetter}
                      </div>
                      <div className="flex-1 bg-white p-5 rounded-2xl shadow-sm border border-[#E8DDD4] min-w-0">
                        <div className="flex justify-between items-start gap-2 flex-wrap">
                          <div>
                            <h4 className="font-bold text-[#4A3E3D] text-sm">{comment.author_name}</h4>
                            <span className="text-xs text-[#8B7E7D]">{formatDistanceToNow(new Date(comment.created_at))} ago</span>
                          </div>
                          {isAuthor && (
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                              title="Delete your update"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          )}
                        </div>
                        <p className="text-[#4A3E3D] text-[15px] leading-relaxed mt-2">{comment.comment_text}</p>

                        {/* Comment Photo Thumbnail */}
                        {comment.photo_url && (
                          <div className="pt-3">
                            <img
                              src={comment.photo_url}
                              alt="Sighting Attachment"
                              onClick={() => {
                                // Insert comment photo dynamically into photosList for zoom
                                photosList.unshift(comment.photo_url);
                                setLightboxIndex(0);
                                setLightboxOpen(true);
                              }}
                              className="w-36 h-36 object-cover rounded-xl border border-[#E8DDD4] cursor-pointer hover:opacity-90 transition-opacity shadow-xs"
                            />
                            <p className="text-[10px] text-gray-400 mt-1 italic">Click image to zoom</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {comments.length > visibleCommentsCount && (
                  <button
                    onClick={() => setVisibleCommentsCount(c => c + COMMENTS_PAGE_SIZE)}
                    className="w-full flex items-center justify-center gap-2 text-sm font-bold text-[#4A3E3D]/70 hover:text-[#4A3E3D] bg-white border border-[#E8DDD4] hover:border-[#8B5E3C]/40 py-3 rounded-xl shadow-sm transition-all cursor-pointer"
                  >
                    <ChevronDown className="w-4 h-4" />
                    Show {Math.min(comments.length - visibleCommentsCount, COMMENTS_PAGE_SIZE)} more {comments.length - visibleCommentsCount === 1 ? 'update' : 'updates'}
                  </button>
                )}
              </div>
            )}
            {comments.length === 0 && (
              <p className="text-[#8B7E7D] text-center italic py-4">No updates yet. Be the first to share information!</p>
            )}
          </div>

          <div className="bg-[#FAF6F4] p-6 md:p-8 rounded-3xl border border-[#E8DDD4]">
            <h4 className="font-bold text-[#4A3E3D] mb-4">Leave an Update</h4>
            {!userEmail ? (
              <div className="text-center py-6">
                <p className="text-gray-500 mb-3">Sign in to comment</p>
                <button
                  onClick={() => window.dispatchEvent(new Event('lumo-open-signin'))}
                  className="bg-[#8B5E3C] text-white px-6 py-3 rounded-xl font-medium"
                >
                  Sign In — It's Free
                </button>
              </div>
            ) : (
              <form onSubmit={handleCommentSubmit}>
                <div className="bg-white border border-[#E8DDD4] rounded-2xl p-3 focus-within:border-[#8B5E3C] transition-all">
                  <textarea
                    required
                    rows={2}
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Share a sighting or helpful info..."
                    className="w-full text-[#4A3E3D] focus:outline-none resize-none placeholder:text-[#8B7E7D]/70"
                  />
                  <div className="flex items-center justify-between pt-2 border-t border-[#E8DDD4] mt-2">
                    <label
                      className="inline-flex items-center justify-center w-9 h-9 rounded-full text-[#8B5E3C] hover:bg-[#FAF6F4] cursor-pointer transition-all"
                      title={commentPhotoPreview ? 'Change photo' : 'Attach a photo'}
                    >
                      <Camera className="w-5 h-5" />
                      <input type="file" accept="image/*" onChange={handleCommentPhotoChange} className="hidden" />
                    </label>
                    <button
                      type="submit"
                      disabled={submittingComment || !newComment.trim()}
                      className="inline-flex items-center gap-1.5 bg-[#8B5E3C] hover:bg-[#7A5234] text-white font-bold py-2 px-5 rounded-full transition-all disabled:opacity-50 text-sm"
                    >
                      {submittingComment ? 'Posting...' : 'Post'} <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {commentPhotoPreview && (
                    <div className="mt-3 relative inline-block">
                      <img src={commentPhotoPreview} alt="Preview" className="w-20 h-20 object-cover rounded-xl border border-[#E8DDD4]" />
                      <button
                        type="button"
                        onClick={() => {
                          setCommentPhoto(null);
                          setCommentPhotoPreview(null);
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-md hover:bg-red-600"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
