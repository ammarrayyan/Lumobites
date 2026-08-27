'use client';

import React, { useState, useEffect } from 'react';
import { Trash2, AlertTriangle, CheckCircle, Eye, RefreshCw, LogOut, XCircle } from 'lucide-react';
import SitterMap from '@/components/SitterMap';

export default function SitterManagement({ adminKey, onUnauthorized }: { adminKey: string, onUnauthorized: () => void }) {
  const [sitters, setSitters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available'>('all');

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

  const handleResetID = async (id: string) => {
    const confirmed = window.confirm("Are you sure you want to reset this sitter's ID verification? This will delete their ID document, reset their status to pending, and send them an email notification.");
    if (!confirmed) return;

    setProcessingId(id);
    try {
      const res = await fetch('/api/admin/sitters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey
        },
        body: JSON.stringify({ id, action: 'reset_id' })
      });
      if (res.status === 401) {
        onUnauthorized();
        return;
      }
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to reset ID verification');
      }

      // Update local state: clear id_photo_url, set status back to pending, not approved
      setSitters(sitters.map(s => {
        if (s.id === id) {
          return {
            ...s,
            id_photo_url: null,
            is_approved: false,
            approval_status: 'pending',
            rejection_reason: null,
            needs_reapproval: false
          };
        }
        return s;
      }));

      alert('ID verification reset successfully!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleForceSignOut = async (email: string, id: string) => {
    const confirmed = window.confirm(`Are you sure you want to force sign out all sessions for ${email}?`);
    if (!confirmed) return;

    setProcessingId(id);
    try {
      const res = await fetch('/api/admin/force-signout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey
        },
        body: JSON.stringify({ email, target: 'sitter' })
      });

      if (res.status === 401) {
        onUnauthorized();
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to force sign out');
      }

      alert('Sitter has been signed out from all devices.');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredSitters = sitters
    .filter(s => filter === 'all' || s.approval_status === filter)
    .filter(s => availabilityFilter === 'all' || s.availability === true);

  const sittersWithLocation = sitters.filter(s => s.lat && s.lng);

  if (loading) {
    return <div className="text-gray-500 animate-pulse text-center py-12">Loading sitters...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <p className="text-sm text-[#555555] mb-2">
          Showing {sittersWithLocation.length} of {sitters.length} sitters with saved location data
        </p>
        <div className="w-full h-[450px]">
          <SitterMap sitters={sittersWithLocation} onSelectSitter={() => {}} />
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-gray-200 pb-4">
        <h2 className="text-xl font-semibold text-[#191919]">Sitter Management</h2>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex space-x-2 border-r border-gray-200 pr-2 mr-2">
            {['all', 'pending', 'approved', 'rejected'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                  filter === f ? 'bg-white text-black' : 'bg-gray-50 text-[#555555] hover:bg-gray-100'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setAvailabilityFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                availabilityFilter === 'all' ? 'bg-white text-black' : 'bg-gray-50 text-[#555555] hover:bg-gray-100'
              }`}
            >
              Show All
            </button>
            <button
              onClick={() => setAvailabilityFilter('available')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                availabilityFilter === 'available' ? 'bg-white text-black border border-green-500/30 font-bold' : 'bg-gray-50 text-[#555555] hover:bg-gray-100'
              }`}
            >
              Show Available Only
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredSitters.length === 0 ? (
          <p className="text-gray-500 text-center py-12">No sitters found.</p>
        ) : (
          filteredSitters.map(sitter => (
            <div key={sitter.id} className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col lg:flex-row gap-6 items-start">
              {/* Profile Image */}
              <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                {sitter.photo_url ? (
                  <img src={sitter.photo_url} alt={sitter.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">No Photo</div>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <h3 className="text-xl font-extrabold text-[#191919]">{sitter.name}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                      sitter.approval_status === 'approved' ? 'bg-green-500/20 text-green-600' :
                      sitter.approval_status === 'rejected' ? 'bg-red-500/20 text-red-600' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {sitter.approval_status || 'pending'}
                    </span>
                    {sitter.availability ? (
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-500/10 text-green-600 border border-green-500/20 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-green-600" /> Available
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-500/10 text-red-600 border border-red-500/20 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5 text-red-600" /> Unavailable
                      </span>
                    )}
                    {sitter.needs_reapproval && (
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-orange-500/20 text-orange-600 border border-orange-500/30 animate-pulse flex items-center gap-1">
                        Re-review <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />
                      </span>
                    )}
                    {sitter.self_declared && (
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-500/20 text-blue-600 border border-blue-500/30 flex items-center gap-1">
                        Self Declared <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-gray-50 text-gray-500 border border-gray-200">
                      No Shows: {sitter.no_show_count || 0}
                    </span>
                    {sitter.no_show_count >= 3 && (
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-500/20 text-red-600 border border-red-500/30 animate-pulse flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-600" /> HIGH NO-SHOW RISK
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mb-2">{sitter.email}</p>
                  <p className="text-sm text-[#555555]">
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
                  <p className="text-sm text-[#555555]"><strong>Rate:</strong> ${sitter.daily_rate}/day</p>
                  <p className="text-sm text-[#555555]"><strong>Phone:</strong> {sitter.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-[#555555]"><strong>Pets Accepted:</strong> {sitter.pets_accepted?.join(', ')}</p>
                  {sitter.social_link && (
                    <p className="text-sm text-[#555555] overflow-hidden text-ellipsis whitespace-nowrap">
                      <strong>Social:</strong> <a href={sitter.social_link} target="_blank" className="text-blue-600 hover:underline">{sitter.social_link}</a>
                    </p>
                  )}
                  {sitter.id_photo_url && (
                    <p className="text-sm mt-2">
                      <a href={sitter.id_photo_url} target="_blank" className="inline-flex items-center gap-1.5 text-xs bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded text-[#191919] transition-colors">
                        <Eye className="w-3.5 h-3.5" /> View ID Photo
                      </a>
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-3">Submitted: {new Date(sitter.submitted_at || sitter.created_at).toLocaleString()}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-[#555555] bg-gray-50 p-3 rounded-lg">{sitter.bio}</p>
                </div>
                {sitter.approval_status === 'rejected' && sitter.rejection_reason && (
                  <div className="md:col-span-2 mt-2 bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
                    <p className="text-xs text-red-600 font-bold mb-1">Rejection Reason:</p>
                    <p className="text-sm text-[#555555]">{sitter.rejection_reason}</p>
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
                      <div className="bg-white p-3 rounded-lg border border-red-500/30 space-y-2">
                        <textarea
                          placeholder="Reason for rejection..."
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded p-2 text-sm text-[#191919] focus:border-red-500 outline-none"
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAction(sitter.id, 'reject')}
                            disabled={processingId === sitter.id}
                            className="flex-1 bg-red-500 hover:bg-red-600 text-[#191919] font-bold py-1.5 px-2 rounded transition-colors text-sm disabled:opacity-50"
                          >
                            Submit
                          </button>
                          <button
                            onClick={() => { setRejectingId(null); setRejectionReason(''); }}
                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-[#191919] font-medium py-1.5 px-2 rounded transition-colors text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setRejectingId(sitter.id)}
                        disabled={processingId === sitter.id}
                        className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-600 border border-red-500/20 font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                      >
                        Reject
                      </button>
                    )}
                  </>
                )}

                {/* Reset ID Verification button */}
                {sitter.id_photo_url && (
                  <button
                    onClick={() => handleResetID(sitter.id)}
                    disabled={processingId === sitter.id}
                    className="w-full bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 border border-orange-500/20 font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 text-sm mt-1"
                  >
                    {processingId === sitter.id ? 'Processing...' : <span className="flex items-center justify-center gap-1.5"><RefreshCw className="w-3.5 h-3.5" /> Reset ID Verification</span>}
                  </button>
                )}

                {/* Force Sign Out button */}
                <button
                  onClick={() => handleForceSignOut(sitter.email, sitter.id)}
                  disabled={processingId === sitter.id}
                  className="w-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 border border-amber-500/20 font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 text-sm mt-1"
                >
                  {processingId === sitter.id ? 'Processing...' : <span className="flex items-center justify-center gap-1.5"><LogOut className="w-3.5 h-3.5" /> Force Sign Out</span>}
                </button>

                {/* Delete Button — always visible */}
                <button
                  onClick={() => handleDelete(sitter.id)}
                  disabled={processingId === sitter.id || deletingId === sitter.id}
                  className="w-full bg-red-600 hover:bg-red-700 text-[#191919] font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 text-sm mt-1"
                >
                  {deletingId === sitter.id ? 'Deleting...' : <span className="flex items-center justify-center gap-1.5"><Trash2 className="w-3.5 h-3.5" /> Delete Profile</span>}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
