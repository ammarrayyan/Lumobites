'use client';

import React, { useState, useEffect, use } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

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
        body: JSON.stringify({ id, token: editToken })
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
        <Navbar />
        <div className="flex items-center justify-center py-32 text-[#8B5E3C] font-bold text-xl animate-pulse">
          Loading details...
        </div>
      </div>
    );
  }

  if (error || !pet) {
    return (
      <div className="min-h-screen bg-[#FDFAF7] font-sans">
        <Navbar />
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
      <Navbar />

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
            {/* Photo Column */}
            <div className="md:w-1/2 relative bg-gray-100 min-h-[300px]">
              {pet.photo_url ? (
                <img src={pet.photo_url} alt={pet.pet_name} className="w-full h-full object-cover absolute inset-0" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 absolute inset-0">No Photo</div>
              )}
              <div className="absolute top-4 left-4">
                <span className={`px-4 py-2 rounded-full text-sm font-black tracking-wider uppercase shadow-lg ${
                  pet.status === 'resolved' ? 'bg-green-500 text-white' :
                  pet.type === 'lost' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
                }`}>
                  {pet.status === 'resolved' ? 'Resolved 🎉' : pet.type}
                </span>
              </div>
            </div>

            {/* Details Column */}
            <div className="md:w-1/2 p-8 md:p-10 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-black text-[#4A3E3D]">{pet.pet_name || 'Unknown Pet'}</h1>
                <span className="text-sm font-bold text-[#8B5E3C] bg-[#FAF6F4] border border-[#E8DDD4] px-3 py-1 rounded-lg capitalize">
                  {pet.species}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-[#8B7E7D] font-medium mb-6">
                <span>📍 {pet.city}, {pet.zip_code}</span>
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
                        <span className="text-xl">📞</span> Contact {pet.type === 'lost' ? 'Owner' : 'Finder'}
                      </button>
                    ) : (
                      <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-center animate-fade-in">
                        <h4 className="font-bold text-blue-900 mb-2">Contact Info</h4>
                        {pet.contact_phone && <p className="text-blue-800 text-lg font-bold mb-1">📞 {pet.contact_phone}</p>}
                        {pet.contact_email && <p className="text-blue-800 text-lg font-bold">✉️ <a href={`mailto:${pet.contact_email}`} className="hover:underline">{pet.contact_email}</a></p>}
                      </div>
                    )}
                  </>
                )}

                <button 
                  onClick={handleShare}
                  className="w-full bg-[#FAF6F4] hover:bg-[#F0E6DD] border border-[#E8DDD4] text-[#8B5E3C] font-bold py-4 rounded-xl transition-all text-lg flex items-center justify-center gap-2"
                >
                  <span className="text-xl">🔗</span> {copied ? 'Link Copied!' : 'Share this post'}
                </button>

                {editToken && (
                  <div className="mt-6 border-t border-[#E8DDD4] pt-6">
                    <h4 className="font-bold text-[#4A3E3D] mb-3 flex items-center gap-2">
                      <span className="text-lg">⚙️</span> Manage Your Post
                    </h4>
                    <div className="flex flex-col gap-3">
                      {pet.status === 'active' && (
                        <button 
                          onClick={() => handleOwnerAction('resolve')}
                          disabled={actionLoading}
                          className="w-full bg-[#8B5E3C] hover:bg-[#7A5234] text-white font-bold py-3 rounded-xl transition-all shadow-sm text-sm disabled:opacity-50"
                        >
                          {actionLoading ? 'Processing...' : 'Mark as Resolved 🎉'}
                        </button>
                      )}
                      <button 
                        onClick={() => handleOwnerAction('delete')}
                        disabled={actionLoading}
                        className="w-full bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold py-3 rounded-xl transition-all shadow-sm text-sm disabled:opacity-50"
                      >
                        {actionLoading ? 'Processing...' : 'Delete My Post'}
                      </button>
                    </div>
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
    </div>
  );
}
