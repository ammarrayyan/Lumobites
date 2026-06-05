'use client';

import React, { useState, useEffect } from 'react';

export default function SitterManagement({ adminKey, onUnauthorized }: { adminKey: string, onUnauthorized: () => void }) {
  const [sitters, setSitters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    fetchSitters();
  }, []);

  const fetchSitters = async () => {
    try {
      const res = await fetch('/api/admin/sitters', {
        headers: { 'x-admin-key': adminKey }
      });
      if (res.status === 401) {
        onUnauthorized();
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch sitters');
      const data = await res.json();
      setSitters(data.sitters || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    if (action === 'reject' && !rejectionReason.trim()) {
      alert('Please provide a reason for rejection.');
      return;
    }

    setProcessingId(id);
    try {
      const res = await fetch('/api/admin/sitters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey
        },
        body: JSON.stringify({ id, action, reason: action === 'reject' ? rejectionReason : undefined })
      });
      if (res.status === 401) {
        onUnauthorized();
        return;
      }
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to process action');
      }

      // Update local state
      setSitters(sitters.map(s => {
        if (s.id === id) {
          return {
            ...s,
            is_approved: action === 'approve',
            approval_status: action === 'approve' ? 'approved' : 'rejected',
            rejection_reason: action === 'reject' ? rejectionReason : null,
            needs_reapproval: false
          };
        }
        return s;
      }));

      if (action === 'reject') {
        setRejectingId(null);
        setRejectionReason('');
      }

    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('Are you sure you want to permanently delete this sitter profile? This cannot be undone.');
    if (!confirmed) return;

    setDeletingId(id);
    try {
      const res = await fetch('/api/admin/sitters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey
        },
        body: JSON.stringify({ id, action: 'delete' })
      });
      if (res.status === 401) {
        onUnauthorized();
        return;
      }
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete sitter');
      }

      // Remove from local state immediately
      setSitters(sitters.filter(s => s.id !== id));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredSitters = sitters.filter(s => filter === 'all' || s.approval_status === filter);

  if (loading) {
    return <div className="text-white/60 animate-pulse text-center py-12">Loading sitters...</div>;
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-white/10 pb-4">
        <h2 className="text-xl font-semibold text-white">Sitter Management</h2>
        <div className="flex space-x-2">
          {['all', 'pending', 'approved', 'rejected'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                filter === f ? 'bg-white text-black' : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filteredSitters.length === 0 ? (
          <p className="text-white/60 text-center py-12">No sitters found.</p>
        ) : (
          filteredSitters.map(sitter => (
            <div key={sitter.id} className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6 flex flex-col lg:flex-row gap-6 items-start">
              {/* Profile Image */}
              <div className="w-24 h-24 rounded-xl overflow-hidden bg-white/5 flex-shrink-0">
                {sitter.photo_url ? (
                  <img src={sitter.photo_url} alt={sitter.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/20">No Photo</div>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <h3 className="text-xl font-extrabold text-white">{sitter.name}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                      sitter.approval_status === 'approved' ? 'bg-green-500/20 text-green-400' :
                      sitter.approval_status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {sitter.approval_status || 'pending'}
                    </span>
                    {sitter.needs_reapproval && (
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 animate-pulse">
                        Re-review ⚠️
                      </span>
                    )}
                    {sitter.self_declared && (
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        Self Declared ✅
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-white/60 mb-2">{sitter.email}</p>
                  <p className="text-sm text-white/80">
                    <strong>Location:</strong> {sitter.city ? (() => {
                      let locStr = sitter.city;
                      const cityLower = sitter.city.toLowerCase();
                      const zipVal = sitter.zip || sitter.zip_code;
                      if (zipVal && !cityLower.includes(zipVal.toLowerCase())) {
                        locStr += `, ${zipVal}`;
                      }
                      if (sitter.country) {
                        const countryLower = sitter.country.toLowerCase();
                        const hasCountry = cityLower.includes(countryLower) || 
                                           (countryLower === 'united states' && (cityLower.includes('usa') || cityLower.includes('u.s.a.'))) ||
                                           (countryLower === 'united kingdom' && (cityLower.includes('uk') || cityLower.includes('u.k.')));
                        if (!hasCountry) {
                          locStr += `, ${sitter.country}`;
                        }
                      }
                      return locStr;
                    })() : ''}
                  </p>
                  <p className="text-sm text-white/80"><strong>Rate:</strong> ${sitter.daily_rate}/day</p>
                  <p className="text-sm text-white/80"><strong>Phone:</strong> {sitter.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-white/80"><strong>Pets Accepted:</strong> {sitter.pets_accepted?.join(', ')}</p>
                  {sitter.social_link && (
                    <p className="text-sm text-white/80 overflow-hidden text-ellipsis whitespace-nowrap">
                      <strong>Social:</strong> <a href={sitter.social_link} target="_blank" className="text-blue-400 hover:underline">{sitter.social_link}</a>
                    </p>
                  )}
                  {sitter.id_photo_url && (
                    <p className="text-sm mt-2">
                      <a href={sitter.id_photo_url} target="_blank" className="inline-flex items-center gap-1 text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-white transition-colors">
                        🪪 View ID Photo
                      </a>
                    </p>
                  )}
                  <p className="text-xs text-white/40 mt-3">Submitted: {new Date(sitter.submitted_at || sitter.created_at).toLocaleString()}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-white/70 bg-white/5 p-3 rounded-lg">{sitter.bio}</p>
                </div>
                {sitter.approval_status === 'rejected' && sitter.rejection_reason && (
                  <div className="md:col-span-2 mt-2 bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
                    <p className="text-xs text-red-400 font-bold mb-1">Rejection Reason:</p>
                    <p className="text-sm text-white/80">{sitter.rejection_reason}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 w-full lg:w-48">
                {sitter.approval_status !== 'approved' && (
                  <button
                    onClick={() => handleAction(sitter.id, 'approve')}
                    disabled={processingId === sitter.id}
                    className="w-full bg-green-500 hover:bg-green-600 text-black font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {processingId === sitter.id ? 'Processing...' : 'Approve'}
                  </button>
                )}
                
                {sitter.approval_status !== 'rejected' && (
                  <>
                    {rejectingId === sitter.id ? (
                      <div className="bg-black/50 p-3 rounded-lg border border-red-500/30 space-y-2">
                        <textarea
                          placeholder="Reason for rejection..."
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          className="w-full bg-black border border-white/10 rounded p-2 text-sm text-white focus:border-red-500 outline-none"
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAction(sitter.id, 'reject')}
                            disabled={processingId === sitter.id}
                            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-1.5 px-2 rounded transition-colors text-sm disabled:opacity-50"
                          >
                            Submit
                          </button>
                          <button
                            onClick={() => { setRejectingId(null); setRejectionReason(''); }}
                            className="flex-1 bg-white/10 hover:bg-white/20 text-white font-medium py-1.5 px-2 rounded transition-colors text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setRejectingId(sitter.id)}
                        disabled={processingId === sitter.id}
                        className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                      >
                        Reject
                      </button>
                    )}
                  </>
                )}

                {/* Delete Button — always visible */}
                <button
                  onClick={() => handleDelete(sitter.id)}
                  disabled={processingId === sitter.id || deletingId === sitter.id}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 text-sm mt-1"
                >
                  {deletingId === sitter.id ? 'Deleting...' : '🗑️ Delete Profile'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
