import React, { useState, useEffect } from 'react';

interface Review {
  id: string;
  sitter_id: string;
  sitter_name: string;
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
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReviews = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/reviews', {
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
    fetchReviews();
  }, [adminKey]);

  const handleDelete = async (reviewId: string, sitterId: string) => {
    if (!confirm("Are you sure you want to delete this review? This action cannot be undone and will recalculate the sitter's average rating.")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/reviews?id=${reviewId}&sitter_id=${sitterId}`, {
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
        setReviews(reviews.filter((r) => r.id !== reviewId));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete review');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting review');
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-white/70">Loading reviews...</div>;
  }

  if (error) {
    return <div className="bg-red-900/50 border border-red-500/50 text-red-200 p-4 rounded-xl">{error}</div>;
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-6 text-white">Sitter Reviews Management</h2>

      <div className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden">
        {reviews.length === 0 ? (
          <div className="p-12 text-center text-white/50">
            <p>No reviews found in the system.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="p-4 text-xs font-bold text-white/70 uppercase tracking-wider">Date</th>
                  <th className="p-4 text-xs font-bold text-white/70 uppercase tracking-wider">Sitter</th>
                  <th className="p-4 text-xs font-bold text-white/70 uppercase tracking-wider">Reviewer</th>
                  <th className="p-4 text-xs font-bold text-white/70 uppercase tracking-wider">Rating</th>
                  <th className="p-4 text-xs font-bold text-white/70 uppercase tracking-wider max-w-md">Review</th>
                  <th className="p-4 text-xs font-bold text-white/70 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {reviews.map((review) => (
                  <tr key={review.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 text-sm text-white/70 whitespace-nowrap">
                      {new Date(review.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-sm font-medium text-white">
                      {review.sitter_name}
                    </td>
                    <td className="p-4 text-sm text-white/80">
                      <div>{review.owner_name}</div>
                      <div className="text-xs text-white/50">{review.owner_email}</div>
                    </td>
                    <td className="p-4 text-sm text-[#c2e59c]">
                      {review.rating} / 5
                    </td>
                    <td className="p-4 text-sm text-white/70 max-w-md truncate" title={review.review_text}>
                      {review.review_text}
                    </td>
                    <td className="p-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleDelete(review.id, review.sitter_id)}
                        className="text-xs font-bold bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300 px-3 py-1.5 rounded-lg transition-colors border border-red-500/30"
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
    </div>
  );
}
