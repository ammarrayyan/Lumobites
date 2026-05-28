'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

interface SitterInfo {
  name: string;
  photo_url: string;
}

export default function SitterReviewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const sitterId = params.sitterId as string;
  const tokenEmail = searchParams.get('token') || '';

  const [sitter, setSitter] = useState<SitterInfo | null>(null);
  const [loadingSitter, setLoadingSitter] = useState(true);

  // Form State
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [reviewText, setReviewText] = useState('');
  const [reviewerName, setReviewerName] = useState('');
  const [reviewerEmail, setReviewerEmail] = useState(tokenEmail);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!sitterId) return;

    const fetchSitterDetails = async () => {
      try {
        const res = await fetch(`/api/petsitting/reviews?sitter_id=${sitterId}`);
        const data = await res.json();
        if (res.ok && data.sitter) {
          setSitter(data.sitter);
        } else {
          setError('Failed to load sitter details');
        }
      } catch (err) {
        console.error('Error fetching sitter:', err);
        setError('Failed to connect to the server');
      } finally {
        setLoadingSitter(false);
      }
    };

    fetchSitterDetails();
  }, [sitterId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!reviewerName.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!reviewerEmail.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (reviewText.trim().length < 20) {
      setError('Your review must be at least 20 characters long.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/petsitting/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sitter_id: sitterId,
          rating,
          review_text: reviewText,
          owner_name: reviewerName,
          owner_email: reviewerEmail,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.message || data.error || 'Failed to submit review');
      }
    } catch (err) {
      console.error('Failed to submit review:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFAF7] font-sans flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-[600px] w-full mx-auto px-4 py-12">
        <div className="bg-white border border-[#E8DDD4] rounded-3xl p-8 shadow-sm">
          {loadingSitter ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#8B5E3C] mb-4"></div>
              <p className="text-[#8B7E7D] text-sm">Loading sitter details...</p>
            </div>
          ) : success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
                🐾
              </div>
              <h2 className="text-2xl font-black text-[#191919] mb-3">Thank you for your review! 🐾</h2>
              <p className="text-[#666666] leading-relaxed mb-8">
                Your feedback has been successfully saved and helps build a trusted marketplace for the whole Lumo Bites community.
              </p>
              <button
                onClick={() => router.push('/petsitting')}
                className="w-full bg-[#8B5E3C] text-white font-bold py-3.5 rounded-xl hover:bg-[#724C2F] active:scale-[0.98] transition-all cursor-pointer shadow-sm"
              >
                Return to Pet Sitting Marketplace
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              
              {/* Sitter Profile Preview */}
              <div className="flex flex-col items-center text-center gap-3 border-b border-[#F0E8E0] pb-6 mb-2">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-[#F5EDE4] border-2 border-[#E8DDD4]">
                  {sitter?.photo_url ? (
                    <img src={sitter.photo_url} alt={sitter.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#8B5E3C] font-bold text-2xl">
                      {sitter?.name?.charAt(0) || 'S'}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-[#8B5E3C] text-xs font-bold uppercase tracking-[0.1em] mb-1">Leave a Review for</p>
                  <h1 className="text-2xl font-black text-[#191919]">{sitter?.name || 'Local Sitter'}</h1>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex items-start gap-2">
                  <span className="text-lg">⚠️</span>
                  <span className="font-medium">{error}</span>
                </div>
              )}

              {/* Clickable Gold Stars */}
              <div className="flex flex-col items-center gap-2">
                <label className="text-sm font-bold text-[#4A3E3D]">Your Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = hoverRating !== null ? star <= hoverRating : star <= rating;
                    return (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        className="text-3xl focus:outline-none transition-transform duration-100 hover:scale-110 active:scale-95 cursor-pointer"
                        style={{ color: isFilled ? '#D97706' : '#D1D5DB' }}
                      >
                        {isFilled ? '★' : '☆'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reviewer Name */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="reviewerName" className="text-sm font-bold text-[#4A3E3D]">Your Name</label>
                <input
                  id="reviewerName"
                  type="text"
                  required
                  placeholder="e.g., Jane Miller"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  className="w-full bg-[#FDFAF7] border border-[#E8DDD4] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#8B5E3C] transition-colors"
                />
              </div>

              {/* Reviewer Email */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="reviewerEmail" className="text-sm font-bold text-[#4A3E3D]">Your Email Address</label>
                <input
                  id="reviewerEmail"
                  type="email"
                  required
                  placeholder="e.g., jane@example.com"
                  value={reviewerEmail}
                  onChange={(e) => setReviewerEmail(e.target.value)}
                  disabled={!!tokenEmail}
                  className={`w-full bg-[#FDFAF7] border border-[#E8DDD4] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#8B5E3C] transition-colors ${tokenEmail ? 'opacity-70 cursor-not-allowed' : ''}`}
                />
                {tokenEmail && (
                  <p className="text-[11px] text-[#8B7E7D] mt-0.5">Prefilled and verified from your request email.</p>
                )}
              </div>

              {/* Review Text */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label htmlFor="reviewText" className="text-sm font-bold text-[#4A3E3D]">Your Review</label>
                  <span className={`text-xs ${reviewText.trim().length >= 20 ? 'text-green-600' : 'text-[#8B7E7D]'}`}>
                    {reviewText.trim().length}/20 chars min
                  </span>
                </div>
                <textarea
                  id="reviewText"
                  required
                  rows={4}
                  placeholder="Describe your pet's experience with the sitter. Was the sitter responsive? Did they send updates? (minimum 20 characters)"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  className="w-full bg-[#FDFAF7] border border-[#E8DDD4] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#8B5E3C] transition-colors resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#8B5E3C] text-white font-bold py-3.5 rounded-xl hover:bg-[#724C2F] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm mt-2"
              >
                {submitting ? 'Submitting Review...' : 'Submit Review 🐾'}
              </button>

            </form>
          )}
        </div>
      </main>
    </div>
  );
}
