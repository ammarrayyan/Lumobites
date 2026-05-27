'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

export default function ManageLostPet() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [petId, setPetId] = useState('');
  const [token, setToken] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const t = params.get('token');
    if (id && t) {
      setPetId(id);
      setToken(t);
    } else {
      setError('Invalid link. Please check the email we sent you.');
    }
  }, []);

  const handleResolve = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/lost-pets/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: petId, token })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || 'Failed to update post.');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFAF7] font-sans flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-3xl shadow-lg border border-[#E8DDD4] text-center max-w-md w-full animate-fade-in">
          {error && !success ? (
            <>
              <span className="text-6xl mb-4 block">⚠️</span>
              <h2 className="text-2xl font-black text-[#4A3E3D] mb-4">Link Invalid</h2>
              <p className="text-red-600 font-medium mb-6">{error}</p>
              <Link href="/lost-pets" className="text-[#8B5E3C] font-bold hover:underline">Return to Board</Link>
            </>
          ) : success ? (
            <>
              <span className="text-6xl mb-4 block">🎉</span>
              <h2 className="text-3xl font-black text-[#4A3E3D] mb-4">Post Resolved!</h2>
              <p className="text-[#8B7E7D] font-medium text-lg mb-6">
                That's amazing news! Your post has been updated and the community will see that this pet is safe.
              </p>
              <Link href={`/lost-pets/${petId}`} className="bg-[#8B5E3C] hover:bg-[#7A5234] text-white font-bold py-3 px-6 rounded-xl transition-colors inline-block">
                View Post
              </Link>
            </>
          ) : (
            <>
              <span className="text-6xl mb-4 block">🏡</span>
              <h2 className="text-3xl font-black text-[#4A3E3D] mb-2">Mark as Resolved</h2>
              <p className="text-[#8B7E7D] font-medium mb-8">
                Is your pet safe? Click below to mark this post as resolved. This will update the status to "Resolved 🎉" on the community board.
              </p>
              <button 
                onClick={handleResolve}
                disabled={loading || !petId || !token}
                className="w-full bg-[#8B5E3C] hover:bg-[#7A5234] text-white font-black py-4 rounded-xl transition-transform transform hover:scale-105 shadow-md text-lg disabled:opacity-50 disabled:hover:scale-100 mb-4"
              >
                {loading ? 'Updating...' : 'Yes, Mark as Resolved 🎉'}
              </button>
              <Link href={`/lost-pets/${petId}`} className="text-[#8B7E7D] text-sm font-bold hover:underline">
                Cancel
              </Link>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
