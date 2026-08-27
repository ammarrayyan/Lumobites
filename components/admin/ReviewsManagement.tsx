import React, { useState, useEffect } from 'react';

interface Review {
  id: string;
  partner_id?: string;
  sitter_id?: string;
  clinic_id?: string;
  daycare_id?: string;
  shelter_id?: string;
  partner_name: string;
  partner_type?: string;
  rating: number;
  review_text: string;
  owner_name: string;
  owner_email: string;
  created_at: string;
}

interface ReviewsManagementProps {
  adminKey: string;
  onUnauthorized: () => void;
}

export default function ReviewsManagement({ adminKey, onUnauthorized }: ReviewsManagementProps) {
  const [activePartnerType, setActivePartnerType] = useState<'sitter' | 'vet' | 'daycare' | 'shelter'>('sitter');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReviews = async (type = activePartnerType) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/reviews?type=${type}`, {
        headers: {
          'x-admin-key': adminKey,
        },
      });

      if (res.status === 401) {
        onUnauthorized();
        return;
      }

      const data = await res.json();
      if (res.ok) {
        setReviews(data.reviews || []);
      } else {
        setError(data.error || 'Failed to fetch reviews');
      }
    } catch (err) {
      console.error(err);
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews(activePartnerType);
  }, [adminKey, activePartnerType]);

  const handleDelete = async (review: Review) => {
    const partnerId = review.partner_id || review.sitter_id || review.clinic_id || review.daycare_id || review.shelter_id;
    if (!confirm(`Are you sure you want to delete this review? This action cannot be undone and will recalculate the partner's average rating.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/reviews?id=${review.id}&partner_id=${partnerId}&type=${activePartnerType}`, {
        method: 'DELETE',
        headers: {
          'x-admin-key': adminKey,
        },
      });

      if (res.status === 401) {
        onUnauthorized();
        return;
      }

      if (res.ok) {
        setReviews(reviews.filter((r) => r.id !== review.id));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete review');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting review');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <h2 className="text-xl font-bold text-[#191919]">Partner Reviews Moderation</h2>

        {/* Vertical Tabs */}
        <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl">
          {[
            { id: 'sitter', label: 'Pet Sitters', emoji: '🐾' },
            { id: 'vet', label: 'Vet Clinics', emoji: '🏥' },
            { id: 'daycare', label: 'Pet Daycare', emoji: '🐕' },
            { id: 'shelter', label: 'Shelters', emoji: '🏠' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActivePartnerType(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border-none ${
                activePartnerType === tab.id
                  ? 'bg-white shadow-xs text-gray-900'
                  : 'text-gray-600 hover:text-gray-900 bg-transparent'
              }`}
            >
              {tab.emoji} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[#555555]">Loading reviews...</div>
      ) : error ? (
        <div className="bg-red-900/50 border border-red-500/50 text-red-200 p-4 rounded-xl">{error}</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
          {reviews.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <p>No reviews found for this partner category.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="p-4 text-xs font-bold text-[#555555] uppercase tracking-wider">Date</th>
                    <th className="p-4 text-xs font-bold text-[#555555] uppercase tracking-wider">Partner</th>
                    <th className="p-4 text-xs font-bold text-[#555555] uppercase tracking-wider">Reviewer</th>
                    <th className="p-4 text-xs font-bold text-[#555555] uppercase tracking-wider">Rating</th>
                    <th className="p-4 text-xs font-bold text-[#555555] uppercase tracking-wider max-w-md">Review</th>
                    <th className="p-4 text-xs font-bold text-[#555555] uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reviews.map((review) => (
                    <tr key={review.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="p-4 text-sm text-[#555555] whitespace-nowrap">
                        {new Date(review.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-sm font-bold text-[#191919]">
                        {review.partner_name}
                      </td>
                      <td className="p-4 text-sm text-[#555555]">
                        <div className="font-semibold text-gray-800">{review.owner_name}</div>
                        <div className="text-xs text-gray-500">{review.owner_email}</div>
                      </td>
                      <td className="p-4 text-sm font-black text-amber-500">
                        ⭐ {review.rating} / 5
                      </td>
                      <td className="p-4 text-sm text-[#555555] max-w-md italic truncate" title={review.review_text}>
                        &quot;{review.review_text}&quot;
                      </td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleDelete(review)}
                          className="text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-colors border border-rose-200 cursor-pointer"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
