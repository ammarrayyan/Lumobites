import React, { useState, useEffect } from 'react';

interface SharedTwin {
  id: string;
  created_at: string;
  userPhoto: string;
  petBreed: string;
  petType: string;
  petPhoto: string;
  matchScore: number;
  traits: string[];
  quote: string;
}

interface TwinGalleryManagementProps {
  adminKey: string;
  onUnauthorized: () => void;
}

export default function TwinGalleryManagement({ adminKey, onUnauthorized }: TwinGalleryManagementProps) {
  const [shares, setShares] = useState<SharedTwin[]>([]);
  const [stats, setStats] = useState({ total: 0, weekly: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchShares();
  }, []);

  const fetchShares = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/twin-gallery', {
        headers: {
          'x-admin-key': adminKey
        }
      });
      if (res.ok) {
        const data = await res.json();
        setShares(data.shares || []);
        setStats(data.stats || { total: 0, weekly: 0 });
      } else if (res.status === 401) {
        onUnauthorized();
      } else {
        setError('Failed to fetch shared twins');
      }
    } catch (e) {
      setError('An error occurred while loading shared twins');
    } finally {
      setLoading(false);
    }
  };

  const deleteShare = async (id: string) => {
    if (!confirm('Are you sure you want to delete this Pet Twin result from the gallery?')) return;

    try {
      const res = await fetch(`/api/admin/twin-gallery?id=${id}`, {
        method: 'DELETE',
        headers: {
          'x-admin-key': adminKey
        }
      });

      if (res.ok) {
        setShares(prev => prev.filter(item => item.id !== id));
        setStats(prev => ({
          ...prev,
          total: Math.max(0, prev.total - 1)
        }));
      } else if (res.status === 401) {
        onUnauthorized();
      } else {
        alert('Failed to delete twin share');
      }
    } catch (e) {
      alert('An error occurred during deletion');
    }
  };

  if (loading) return <div className="text-white/70 text-center py-8">Loading shared twins...</div>;
  if (error) return <div className="text-red-400 text-center py-8">{error}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">Pet Twin Gallery Management</h2>
        <button 
          onClick={fetchShares} 
          className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer"
        >
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-[#222]/80 border border-white/5 p-5 rounded-2xl">
          <div className="text-xs text-white/50 font-bold uppercase tracking-wider mb-1">Total Shared Results</div>
          <div className="text-3xl font-extrabold text-white">{stats.total}</div>
        </div>
        <div className="bg-[#222]/80 border border-white/5 p-5 rounded-2xl">
          <div className="text-xs text-white/50 font-bold uppercase tracking-wider mb-1">Results This Week</div>
          <div className="text-3xl font-extrabold text-[#c2e59c]">{stats.weekly}</div>
        </div>
      </div>

      {/* Gallery List */}
      <div className="space-y-4">
        {shares.map(share => (
          <div key={share.id} className="border border-white/10 bg-black/40 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:border-white/20">
            
            {/* Side-by-Side Images & Info */}
            <div className="flex items-center gap-5 flex-1 min-w-0">
              
              {/* Photo Avatars */}
              <div className="flex items-center -space-x-5 shrink-0">
                <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-white/10 shadow-lg bg-[#222] flex items-center justify-center text-xl z-10 relative">
                  {share.userPhoto ? (
                    <img src={share.userPhoto} alt="User selfie" className="w-full h-full object-cover" />
                  ) : (
                    <span>🧑</span>
                  )}
                </div>
                <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-white/10 shadow-lg bg-[#222] flex items-center justify-center text-xl z-0 relative">
                  {share.petPhoto ? (
                    <img src={share.petPhoto} alt={share.petBreed} className="w-full h-full object-cover" />
                  ) : (
                    <span>🐕</span>
                  )}
                </div>
              </div>

              {/* Match Description */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h4 className="font-bold text-white text-base truncate">{share.petBreed}</h4>
                  <span className="bg-[#c2e59c] text-black text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {share.matchScore}% Match
                  </span>
                  <span className="text-white/40 text-xs font-semibold px-2 py-0.5 bg-white/5 rounded border border-white/5">
                    {share.petType === 'cat' ? '🐱 Cat' : '🐶 Dog'}
                  </span>
                </div>
                
                <div className="text-xs text-white/50 mb-2">
                  ID: {share.id} • Shared on {new Date(share.created_at).toLocaleString()}
                </div>

                {share.traits && share.traits.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {share.traits.map(trait => (
                      <span key={trait} className="text-[10px] bg-white/5 text-white/70 px-2 py-0.5 rounded border border-white/5">
                        {trait}
                      </span>
                    ))}
                  </div>
                )}

                <p className="text-xs text-white/60 italic truncate max-w-lg">
                  &ldquo;{share.quote}&rdquo;
                </p>
              </div>

            </div>

            {/* Action Box */}
            <div className="shrink-0 flex items-center">
              <button 
                onClick={() => deleteShare(share.id)}
                className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/10 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                Delete Entry
              </button>
            </div>

          </div>
        ))}

        {shares.length === 0 && (
          <div className="text-white/50 text-center py-12 bg-black/20 rounded-xl border border-dashed border-white/10">
            No shared Pet Twin matches found.
          </div>
        )}
      </div>
    </div>
  );
}
