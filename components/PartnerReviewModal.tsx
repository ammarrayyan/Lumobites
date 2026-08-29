'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Star, X, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useScrollLock } from '@/lib/useScrollLock';

interface PartnerReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  partnerId: string;
  partnerName: string;
  partnerType: 'vet' | 'daycare' | 'shelter';
  currentUserEmail: string;
  currentUserName?: string;
  onSuccess?: (newRating: number, newCount: number) => void;
}

export default function PartnerReviewModal({
  isOpen,
  onClose,
  partnerId,
  partnerName,
  partnerType,
  currentUserEmail,
  currentUserName,
  onSuccess,
}: PartnerReviewModalProps) {
  useScrollLock(isOpen);

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState<string>('');
  const [ownerName, setOwnerName] = useState<string>(currentUserName || '');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);

  if (!isOpen || typeof window === 'undefined') return null;

  const endpoint =
    partnerType === 'vet'
      ? '/api/vet-boarding/reviews'
      : partnerType === 'daycare'
      ? '/api/pet-daycare/reviews'
      : '/api/adoption/shelter-reviews';

  const partnerIdField =
    partnerType === 'vet'
      ? 'clinic_id'
      : partnerType === 'daycare'
      ? 'daycare_id'
      : 'shelter_id';

  const partnerTypeLabel =
    partnerType === 'vet' ? 'Vet Clinic' : partnerType === 'daycare' ? 'Pet Daycare' : 'Rescue / Shelter';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserEmail) {
      setError('You must be signed in to submit a review.');
      return;
    }
    if (!reviewText.trim()) {
      setError('Please write a few words about your experience.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [partnerIdField]: partnerId,
          owner_email: currentUserEmail,
          owner_name: ownerName.trim() || currentUserEmail.split('@')[0],
          rating,
          review_text: reviewText.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitted(true);
        if (onSuccess) {
          onSuccess(data.avg_rating, data.review_count);
        }
        setTimeout(() => {
          onClose();
        }, 1800);
      } else {
        setError(data.error || 'Failed to submit review. Please try again.');
      }
    } catch (err: any) {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[999999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-[#DFD3C7] relative animate-modal-spring text-left">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors cursor-pointer border-none bg-transparent"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="text-center py-6 space-y-3">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto border border-emerald-100">
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            </div>
            <h3 className="text-lg font-black text-[#2E2419]">Review Submitted!</h3>
            <p className="text-xs text-[#8B7E7D]">Thank you for sharing your experience with {partnerName}.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#8B5E3C] uppercase tracking-wider mb-1">
                <ShieldCheck className="w-4 h-4" /> Verified Client Review
              </div>
              <h2 className="text-lg font-black text-[#2E2419]">Review {partnerName}</h2>
              <p className="text-xs text-[#8B7E7D]">How was your experience with this {partnerTypeLabel.toLowerCase()}?</p>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
                {error}
              </div>
            )}

            {/* Star Picker */}
            <div className="bg-[#FAF6F2] p-4 rounded-2xl border border-[#E2D5C8] text-center space-y-1">
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = (hoverRating || rating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 border-none bg-transparent cursor-pointer transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-7 h-7 transition-colors ${
                          active ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <p className="text-xs font-bold text-[#2E2419]">
                {rating === 5 ? '⭐⭐⭐⭐⭐ Exceptional (5/5)' : rating === 4 ? '⭐⭐⭐⭐ Great (4/5)' : rating === 3 ? '⭐⭐⭐ Average (3/5)' : rating === 2 ? '⭐⭐ Below Average (2/5)' : '⭐ Needs Improvement (1/5)'}
              </p>
            </div>

            {/* Reviewer Name */}
            <div>
              <label className="text-xs font-bold text-[#2E2419] block mb-1">Your Name / Display Name</label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="e.g. Sarah M."
                className="w-full bg-[#FAF6F2] border border-[#E2D5C8] rounded-xl px-3.5 py-2.5 text-xs text-[#2E2419] focus:outline-hidden focus:border-[#8B5E3C]"
              />
            </div>

            {/* Review Text */}
            <div>
              <label className="text-xs font-bold text-[#2E2419] block mb-1">Your Review</label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={4}
                placeholder="Describe the care, facility condition, staff friendliness, and overall experience..."
                className="w-full bg-[#FAF6F2] border border-[#E2D5C8] rounded-xl p-3 text-xs text-[#2E2419] focus:outline-hidden focus:border-[#8B5E3C] resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#8B5E3C] hover:bg-[#734A2E] text-white font-bold py-3 rounded-xl transition-all shadow-sm text-xs border-none cursor-pointer flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Review'}
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}
