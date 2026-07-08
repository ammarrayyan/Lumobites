'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Search, MapPin, Phone, Mail, Share2, Settings } from 'lucide-react';

export default function LostPetDetail({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  
  const [pet, setPet] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [newComment, setNewComment] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const [copied, setCopied] = useState(false);
  const [showContact, setShowContact] = useState(false);

  const [editToken, setEditToken] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [blockedEmails, setBlockedEmails] = useState<string[]>([]);

  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
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
  }, []);

  const handleReportPost = async () => {
    if (!pet) return;
    const reason = window.prompt("Please enter the reason for reporting this post (e.g. Inappropriate Content, Spam, Harassment):");
    if (!reason || !reason.trim()) return;

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reporter_email: userEmail || 'guest@lumobitespet.com',
          reported_email: pet.contact_email || 'unknown@lumobitespet.com',
          reported_type: 'lost_pet_post',
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
          comment_text: newComment
        })
      });
      const data = await res.json();
      if (res.ok) {
        setComments([...comments, data.comment]);
        setNewComment('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFAF7] font-sans">
                <div className="flex items-center justify-center py-32 text-[#8B5E3C] font-bold text-xl animate-pulse">
          Loading details...
        </div>
      </div>
    );
  }

  if (error || !pet) {
    return (
      <div className="min-h-screen bg-[#FDFAF7] font-sans">
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
    <div className="min-h-screen bg-[#FDFAF7] font-sans">
      
      <main className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        <Link href="/lost-pets" className="text-[#8B5E3C] font-bold hover:underline mb-6 inline-block">&larr; Back to Board</Link>

        {pet.status === 'resolved' && (
          <div className="bg-green-100 border border-green-300 text-green-800 p-6 rounded-2xl mb-8 flex items-center justify-center gap-4 shadow-sm animate-fade-in">
            <span className="text-4xl">🎉</span>
            <div>
              <h2 className="text-2xl font-black">Great News!</h2>
              <p className="font-medium">This pet has been {pet.type === 'lost' ? 'found and returned home safely' : 'reunited with their owner'}!</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl overflow-hidden border border-[#E8DDD4] shadow-sm mb-12">
          <div className="flex flex-col md:flex-row">
            {/* Photo Gallery Column */}
            <div className="md:w-[58%] relative bg-[#FAF6F4] flex flex-col justify-between border-r border-[#E8DDD4] min-h-[400px] md:min-h-[550px]">
              
              {/* Main Image Slideshow Container */}
              <div 
                className="flex-1 relative flex items-center justify-center overflow-hidden cursor-pointer"
                onTouchStart={handleTouchStart}
                onTouchEnd={(e) => handleTouchEnd(e, photosList.length)}
                onClick={() => {
                  if (photosList.length > 0) {
                    setLightboxIndex(activePhotoIndex);
                    setLightboxOpen(true);
                  }
                }}
                title="Click to zoom in"
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

                {/* Click to Zoom indicator */}
                {photosList.length > 0 && (
                  <div className="absolute bottom-3 right-3 bg-black/60 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide uppercase flex items-center gap-1.5 shadow-sm transition-all hover:bg-black">
                    <Search className="w-3.5 h-3.5 text-white" /> Click to Zoom
                  </div>
                )}
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
                <p className="text-[#555555] leading-relaxed whitespace-pre-wrap">{pet.description}</p>
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
          
          <div className="space-y-6 mb-8">
            {comments.map((comment) => (
              <div key={comment.id} className="bg-white p-6 rounded-2xl shadow-sm border border-[#E8DDD4]">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-bold text-[#4A3E3D]">{comment.author_name}</h4>
                  <span className="text-xs text-[#8B7E7D]">{formatDistanceToNow(new Date(comment.created_at))} ago</span>
                </div>
                <p className="text-[#555555]">{comment.comment_text}</p>
              </div>
            ))}
            {comments.length === 0 && (
              <p className="text-[#8B7E7D] text-center italic py-4">No updates yet. Be the first to share information!</p>
            )}
          </div>

          <div className="bg-[#FAF6F4] p-6 md:p-8 rounded-3xl border border-[#E8DDD4]">
            <h4 className="font-bold text-[#4A3E3D] mb-4">Leave an Update</h4>
            <form onSubmit={handleCommentSubmit} className="space-y-4">
              <div>
                <input required type="text" value={commentAuthor} onChange={e => setCommentAuthor(e.target.value)} placeholder="Your Name" className="w-full bg-white border border-[#E8DDD4] rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]" />
              </div>
              <div>
                <textarea required rows={3} value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Share a sighting or helpful info..." className="w-full bg-white border border-[#E8DDD4] rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]" />
              </div>
              <button type="submit" disabled={submittingComment || !newComment.trim() || !commentAuthor.trim()} className="bg-[#8B5E3C] hover:bg-[#7A5234] text-white font-bold py-3 px-8 rounded-xl transition-all disabled:opacity-50">
                {submittingComment ? 'Posting...' : 'Post Update'}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Lightbox / Zoom Overlay */}
      {lightboxOpen && photosList.length > 0 && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-4 animate-fade-in"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Close button */}
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-6 right-6 text-white/80 hover:text-white text-4xl font-bold transition-colors cursor-pointer bg-white/10 hover:bg-white/20 rounded-full w-12 h-12 flex items-center justify-center border border-white/10"
            title="Close Lightbox"
          >
            &times;
          </button>

          {/* Lightbox Main Image */}
          <div className="relative max-w-4xl max-h-[80vh] w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <img 
              src={photosList[lightboxIndex]} 
              alt={`Zoomed Pet ${lightboxIndex + 1}`} 
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-scale-up"
            />

            {/* Lightbox Navigation Arrows */}
            {photosList.length > 1 && (
              <>
                <button
                  onClick={() => setLightboxIndex(prev => (prev - 1 + photosList.length) % photosList.length)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center font-bold text-3xl transition-all cursor-pointer border border-white/5"
                >
                  &#8249;
                </button>
                <button
                  onClick={() => setLightboxIndex(prev => (prev + 1) % photosList.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center font-bold text-3xl transition-all cursor-pointer border border-white/5"
                >
                  &#8250;
                </button>
              </>
            )}
          </div>

          {/* Indicator Info */}
          <div className="text-white/60 text-sm font-semibold mt-4">
            Photo {lightboxIndex + 1} of {photosList.length}
          </div>
        </div>
      )}

    </div>
  );
}
