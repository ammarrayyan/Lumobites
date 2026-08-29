'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Star, X, Loader2, MessageSquare, ShieldCheck, Plus } from 'lucide-react';
import PartnerReviewModal from './PartnerReviewModal';
import { useScrollLock } from '@/lib/useScrollLock';

interface PartnerReviewsListModalProps {
  isOpen: boolean;
  onClose: () => void;
  partnerId: string;
  partnerName: string;
  partnerType: 'vet' | 'daycare' | 'shelter';
  currentUserEmail?: string;
}

export default function PartnerReviewsListModal({
  isOpen,
  onClose,
  partnerId,
  partnerName,
  partnerType,
  currentUserEmail,
}: PartnerReviewsListModalProps) {
  useScrollLock(isOpen);

  const [reviews, setReviews] = useState<any[]>([]);
  const [avgRating, setAvgRating] = useState<number>(0);
  const [reviewCount, setReviewCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  const fetchReviews = async () => {
    setLoading(true);
    const endpoint =
      partnerType === 'vet'
        ? `/api/vet-boarding/reviews?clinic_id=${partnerId}`
        : partnerType === 'daycare'
        ? `/api/pet-daycare/reviews?daycare_id=${partnerId}`
        : `/api/adoption/shelter-reviews?shelter_id=${partnerId}`;

    try {
      const res = await fetch(endpoint);
      const data = await res.json();
      if (res.ok) {
        setReviews(data.reviews || []);
        setAvgRating(Number(data.avg_rating || 0));
        setReviewCount(Number(data.review_count || (data.reviews || []).length));
      }
    } catch (e) {
      console.error('Error fetching partner reviews:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && partnerId) {
      fetchReviews();
    }
  }, [isOpen, partnerId]);

  if (!isOpen || typeof window === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[999999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl border border-[#DFD3C7] relative animate-modal-spring text-left overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-[#E2D5C8] flex items-center justify-between shrink-0 bg-[#FAF6F2]">
          <div>
            <h3 className="text-base font-black text-[#2E2419] flex items-center gap-2">
              Reviews for {partnerName}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center text-amber-500">
                <Star className="w-4 h-4 fill-current" />
                <span className="text-xs font-black text-[#2E2419] ml-1">
                  {avgRating > 0 ? avgRating.toFixed(1) : 'New'}
                </span>
              </div>
              <span className="text-xs text-[#8B7E7D]">
                • {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-white transition-colors cursor-pointer border-none bg-transparent"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="text-center py-12 text-[#8B7E7D] space-y-2">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#8B5E3C]" />
              <p className="text-xs font-medium">Loading reviews...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12 text-[#8B7E7D] space-y-2">
              <MessageSquare className="w-10 h-10 mx-auto opacity-30" />
              <p className="text-sm font-bold text-[#2E2419]">No reviews yet</p>
              <p className="text-xs">Be the first verified client to leave a review for {partnerName}!</p>
            </div>
          ) : (
            reviews.map((r, i) => (
              <div key={r.id || i} className="bg-[#FAF6F2] border border-[#E2D5C8] rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#8B5E3C] text-white text-xs font-bold flex items-center justify-center">
                      {(r.ownerName || r.owner_name || 'U')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-black text-[#2E2419]">{r.ownerName || r.owner_name || 'Verified Client'}</p>
                      <p className="text-[10px] text-[#8B7E7D]">
                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Verified Stay'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center text-amber-500">
                    {[...Array(r.rating || 5)].map((_, idx) => (
                      <Star key={idx} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                </div>

                <p className="text-xs text-[#4A3E3D] leading-relaxed italic">
                  "{r.reviewText || r.review_text}"
                </p>
              </div>
            ))
          )}
        </div>

        {/* Footer CTA */}
        <div className="p-4 border-t border-[#E2D5C8] bg-white flex items-center justify-between shrink-0">
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full bg-[#8B5E3C] hover:bg-[#734A2E] text-white font-bold py-3 rounded-xl transition-all shadow-xs text-xs border-none cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Write a Review
          </button>
        </div>

        {showAddModal && (
          <PartnerReviewModal
            isOpen={showAddModal}
            onClose={() => {
              setShowAddModal(false);
              fetchReviews();
            }}
            partnerId={partnerId}
            partnerName={partnerName}
            partnerType={partnerType}
            currentUserEmail={currentUserEmail || ''}
            onSuccess={() => {
              fetchReviews();
            }}
          />
        )}
      </div>
    </div>,
    document.body
  );
}
