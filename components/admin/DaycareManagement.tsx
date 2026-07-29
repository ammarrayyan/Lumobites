'use client';

import React, { useState, useEffect } from 'react';
import { Building2, CheckCircle2, XCircle, Clock, Globe, Phone, Mail, MapPin, Search, PauseCircle, Trash2 } from 'lucide-react';

interface PetDaycare {
  id: string;
  business_name: string;
  license_number?: string;
  email: string;
  phone?: string;
  address?: string;
  city: string;
  state?: string;
  zip?: string;
  website?: string;
  logo_url?: string;
  description?: string;
  services?: string[];
  rejection_reason?: string;
  status: 'pending' | 'approved' | 'rejected' | 'paused';
  created_at: string;
}

export default function DaycareManagement({ adminKey }: { adminKey: string }) {
  const [daycares, setDaycares] = useState<PetDaycare[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'paused'>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [tableError, setTableError] = useState<string | null>(null);

  const fetchDaycares = async () => {
    setLoading(true);
    setTableError(null);
    try {
      const res = await fetch('/api/admin/daycares', {
        headers: { 'x-admin-key': adminKey },
      });
      if (res.ok) {
        const data = await res.json();
        setDaycares(data.daycares || []);
      } else {
        const errData = await res.json().catch(() => ({}));
        if (errData.error && errData.error.includes('schema cache')) {
          setTableError("Database table 'pet_daycares' does not exist yet. Please run scratch/create-pet-daycares-table.sql in Supabase SQL Editor.");
        } else {
          setTableError(errData.error || 'Failed to load daycares');
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch daycares:', err);
      setTableError('Network error loading daycares');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDaycares();
  }, [adminKey]);

  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected' | 'paused', reason?: string) => {
    setProcessingId(id);
    try {
      const res = await fetch('/api/admin/daycares', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({ id, status, rejection_reason: reason }),
      });
      if (res.ok) {
        setDaycares(prev =>
          prev.map(d => d.id === id ? { ...d, status, rejection_reason: reason } : d)
        );
        setRejectingId(null);
        setRejectionReason('');
      } else {
        alert('Failed to update status');
      }
    } catch {
      alert('Failed to update status');
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = daycares.filter(d => {
    if (statusFilter !== 'all' && d.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        d.business_name?.toLowerCase().includes(q) ||
        d.email?.toLowerCase().includes(q) ||
        d.city?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const StatusBadge = ({ status }: { status: PetDaycare['status'] }) => {
    const map = {
      pending: { icon: <Clock className="w-3.5 h-3.5" />, label: 'Pending', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
      approved: { icon: <CheckCircle2 className="w-3.5 h-3.5" />, label: 'Approved', cls: 'bg-green-100 text-green-700 border-green-200' },
      rejected: { icon: <XCircle className="w-3.5 h-3.5" />, label: 'Rejected', cls: 'bg-red-100 text-red-700 border-red-200' },
      paused: { icon: <PauseCircle className="w-3.5 h-3.5" />, label: 'Paused', cls: 'bg-gray-100 text-gray-600 border-gray-200' },
    };
    const s = map[status] || map.pending;
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${s.cls}`}>
        {s.icon} {s.label}
      </span>
    );
  };

  if (loading) {
    return <div className="text-center py-12 text-[#8B7E7D]">Loading daycares…</div>;
  }

  if (tableError) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-amber-800 text-sm space-y-3">
        <p className="font-bold">⚠️ Database Setup Required</p>
        <p>{tableError}</p>
        <p className="text-xs opacity-70">Run <code>scratch/create-pet-daycares-table.sql</code> in your Supabase SQL Editor first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#4A3E3D] flex items-center gap-2">
            <span className="text-xl">🐕</span> Pet Daycare Facilities
          </h2>
          <p className="text-sm text-[#8B7E7D] mt-1">
            {daycares.filter(d => d.status === 'pending').length} pending review
          </p>
        </div>
        <button
          onClick={fetchDaycares}
          className="text-sm text-[#8B5E3C] hover:underline font-medium border-none bg-transparent cursor-pointer"
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search daycares…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-600"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as any)}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-600 bg-white"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="paused">Paused</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-[#8B7E7D]">No daycares match your filters.</div>
      ) : (
        <div className="space-y-4">
          {filtered.map(daycare => (
            <div key={daycare.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Logo */}
                <div className="shrink-0">
                  {daycare.logo_url ? (
                    <img
                      src={daycare.logo_url}
                      alt={daycare.business_name}
                      className="w-16 h-16 rounded-xl object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <span className="text-2xl">🐕</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-grow min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-[#4A3E3D]">{daycare.business_name}</h3>
                    <StatusBadge status={daycare.status} />
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#8B7E7D]">
                    <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{daycare.email}</span>
                    {daycare.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{daycare.phone}</span>}
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{daycare.city}{daycare.state ? `, ${daycare.state}` : ''}</span>
                    {daycare.website && (
                      <a href={daycare.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-emerald-600 hover:underline">
                        <Globe className="w-3.5 h-3.5" />{daycare.website.replace(/^https?:\/\//, '')}
                      </a>
                    )}
                  </div>

                  {daycare.license_number && (
                    <p className="text-xs text-[#8B7E7D]">License: <span className="font-semibold text-[#4A3E3D]">{daycare.license_number}</span></p>
                  )}

                  {daycare.description && (
                    <p className="text-sm text-[#555555] line-clamp-2">{daycare.description}</p>
                  )}

                  {daycare.services && daycare.services.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {daycare.services.map(s => (
                        <span key={s} className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  {daycare.rejection_reason && (
                    <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mt-1">
                      <strong>Rejection reason:</strong> {daycare.rejection_reason}
                    </p>
                  )}

                  <p className="text-[10px] text-gray-400 pt-1">
                    Applied: {new Date(daycare.created_at).toLocaleDateString()}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 shrink-0">
                  {daycare.status !== 'approved' && (
                    <button
                      onClick={() => handleUpdateStatus(daycare.id, 'approved')}
                      disabled={processingId === daycare.id}
                      className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors disabled:opacity-50 border-none cursor-pointer"
                    >
                      {processingId === daycare.id ? '…' : '✓ Approve'}
                    </button>
                  )}
                  {daycare.status === 'approved' && (
                    <button
                      onClick={() => handleUpdateStatus(daycare.id, 'paused')}
                      disabled={processingId === daycare.id}
                      className="bg-gray-500 hover:bg-gray-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors disabled:opacity-50 border-none cursor-pointer"
                    >
                      Pause
                    </button>
                  )}
                  {daycare.status === 'paused' && (
                    <button
                      onClick={() => handleUpdateStatus(daycare.id, 'approved')}
                      disabled={processingId === daycare.id}
                      className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors disabled:opacity-50 border-none cursor-pointer"
                    >
                      Re-Activate
                    </button>
                  )}
                  {daycare.status !== 'rejected' && (
                    <button
                      onClick={() => { setRejectingId(daycare.id); setRejectionReason(''); }}
                      disabled={processingId === daycare.id}
                      className="bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold px-4 py-2 rounded-lg transition-colors disabled:opacity-50 border-none cursor-pointer"
                    >
                      ✕ Reject
                    </button>
                  )}
                  <button
                    onClick={async () => {
                      if (!window.confirm(`PERMANENT DELETION WARNING:\n\nAre you sure you want to permanently delete "${daycare.business_name}"?\n\nThis will permanently delete their daycare account, availability schedule, and inquiries.`)) return;
                      setProcessingId(daycare.id);
                      try {
                        const res = await fetch(`/api/admin/daycares?id=${daycare.id}`, {
                          method: 'DELETE',
                          headers: { 'x-admin-key': adminKey }
                        });
                        if (res.ok) {
                          setDaycares(prev => prev.filter(d => d.id !== daycare.id));
                        } else {
                          const errData = await res.json().catch(() => ({}));
                          alert(errData.error || 'Failed to delete daycare account.');
                        }
                      } catch (e) {
                        alert('Failed to delete daycare account.');
                      } finally {
                        setProcessingId(null);
                      }
                    }}
                    disabled={processingId === daycare.id}
                    className="bg-gray-100 hover:bg-red-100 text-red-600 font-bold text-xs px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer border-none"
                    title="Delete Daycare Account & All Data"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>

              {/* Rejection reason form */}
              {rejectingId === daycare.id && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                  <p className="text-sm font-semibold text-[#4A3E3D]">Rejection reason (optional)</p>
                  <textarea
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                    placeholder="e.g. Could not verify business license"
                    rows={2}
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-red-300"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateStatus(daycare.id, 'rejected', rejectionReason || undefined)}
                      disabled={processingId === daycare.id}
                      className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors border-none cursor-pointer"
                    >
                      Confirm Rejection
                    </button>
                    <button
                      onClick={() => setRejectingId(null)}
                      className="text-xs text-gray-500 hover:text-gray-700 px-4 py-2 border-none bg-transparent cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
