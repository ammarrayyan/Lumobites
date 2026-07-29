'use client';

import React, { useState, useEffect } from 'react';
import { Building2, CheckCircle2, XCircle, Clock, Globe, Phone, Mail, MapPin, Search, PauseCircle, Trash2 } from 'lucide-react';

interface VetClinic {
  id: string;
  clinic_name: string;
  license_number?: string;
  email: string;
  phone?: string;
  address?: string;
  city: string;
  state?: string;
  zip?: string;
  website?: string;
  org_photo_url?: string;
  description?: string;
  services?: string[];
  rejection_reason?: string;
  status: 'pending' | 'approved' | 'rejected' | 'paused';
  created_at: string;
}

export default function VetClinicManagement({ adminKey }: { adminKey: string }) {
  const [clinics, setClinics] = useState<VetClinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'paused'>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [tableError, setTableError] = useState<string | null>(null);

  const fetchClinics = async () => {
    setLoading(true);
    setTableError(null);
    try {
      const res = await fetch('/api/admin/vet-clinics', {
        headers: { 'x-admin-key': adminKey },
      });
      if (res.ok) {
        const data = await res.json();
        setClinics(data.clinics || []);
      } else {
        const errData = await res.json().catch(() => ({}));
        if (errData.error && errData.error.includes('schema cache')) {
          setTableError("Database table 'vet_clinics' does not exist yet. Please run scratch/create-vet-clinics-table.sql in Supabase SQL Editor.");
        } else {
          setTableError(errData.error || 'Failed to load clinics');
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch vet clinics:', err);
      setTableError('Network error loading clinics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClinics();
  }, [adminKey]);

  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected' | 'paused', reason?: string) => {
    setProcessingId(id);
    try {
      const res = await fetch('/api/admin/vet-clinics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({ id, status, rejection_reason: reason }),
      });
      if (res.ok) {
        setClinics(prev =>
          prev.map(c => c.id === id ? { ...c, status, rejection_reason: reason } : c)
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

  const filtered = clinics.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        c.clinic_name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.city?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const StatusBadge = ({ status }: { status: VetClinic['status'] }) => {
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
    return <div className="text-center py-12 text-[#8B7E7D]">Loading vet clinics…</div>;
  }

  if (tableError) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-amber-800 text-sm space-y-3">
        <p className="font-bold">⚠️ Database Setup Required</p>
        <p>{tableError}</p>
        <p className="text-xs opacity-70">Run <code>scratch/create-vet-clinics-table.sql</code> in your Supabase SQL Editor first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#4A3E3D] flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" /> Veterinary Boarding Clinics
          </h2>
          <p className="text-sm text-[#8B7E7D] mt-1">
            {clinics.filter(c => c.status === 'pending').length} pending review
          </p>
        </div>
        <button
          onClick={fetchClinics}
          className="text-sm text-[#8B5E3C] hover:underline font-medium"
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
            placeholder="Search clinics…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#8B5E3C]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as any)}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#8B5E3C] bg-white"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="paused">Paused</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-[#8B7E7D]">No clinics match your filters.</div>
      ) : (
        <div className="space-y-4">
          {filtered.map(clinic => (
            <div key={clinic.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Logo */}
                <div className="shrink-0">
                  {clinic.org_photo_url ? (
                    <img
                      src={clinic.org_photo_url}
                      alt={clinic.clinic_name}
                      className="w-16 h-16 rounded-xl object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-blue-100 flex items-center justify-center">
                      <Building2 className="w-7 h-7 text-blue-500" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-grow min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-[#4A3E3D]">{clinic.clinic_name}</h3>
                    <StatusBadge status={clinic.status} />
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#8B7E7D]">
                    <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{clinic.email}</span>
                    {clinic.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{clinic.phone}</span>}
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{clinic.city}{clinic.state ? `, ${clinic.state}` : ''}</span>
                    {clinic.website && (
                      <a href={clinic.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-500 hover:underline">
                        <Globe className="w-3.5 h-3.5" />{clinic.website.replace(/^https?:\/\//, '')}
                      </a>
                    )}
                  </div>

                  {clinic.license_number && (
                    <p className="text-xs text-[#8B7E7D]">License: <span className="font-semibold text-[#4A3E3D]">{clinic.license_number}</span></p>
                  )}

                  {clinic.description && (
                    <p className="text-sm text-[#555555] line-clamp-2">{clinic.description}</p>
                  )}

                  {clinic.services && clinic.services.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {clinic.services.map(s => (
                        <span key={s} className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  {clinic.rejection_reason && (
                    <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mt-1">
                      <strong>Rejection reason:</strong> {clinic.rejection_reason}
                    </p>
                  )}

                  <p className="text-[10px] text-gray-400 pt-1">
                    Applied: {new Date(clinic.created_at).toLocaleDateString()}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 shrink-0">
                  {clinic.status !== 'approved' && (
                    <button
                      onClick={() => handleUpdateStatus(clinic.id, 'approved')}
                      disabled={processingId === clinic.id}
                      className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {processingId === clinic.id ? '…' : '✓ Approve'}
                    </button>
                  )}
                  {clinic.status === 'approved' && (
                    <button
                      onClick={() => handleUpdateStatus(clinic.id, 'paused')}
                      disabled={processingId === clinic.id}
                      className="bg-gray-500 hover:bg-gray-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Pause
                    </button>
                  )}
                  {clinic.status === 'paused' && (
                    <button
                      onClick={() => handleUpdateStatus(clinic.id, 'approved')}
                      disabled={processingId === clinic.id}
                      className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Re-Activate
                    </button>
                  )}
                  {clinic.status !== 'rejected' && (
                    <button
                      onClick={() => { setRejectingId(clinic.id); setRejectionReason(''); }}
                      disabled={processingId === clinic.id}
                      className="bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                    >
                      ✕ Reject
                    </button>
                  )}
                  <button
                    onClick={async () => {
                      if (!window.confirm(`PERMANENT DELETION WARNING:\n\nAre you sure you want to permanently delete "${clinic.clinic_name}"?\n\nThis will permanently delete their clinic account, availability schedule, and inquiries.`)) return;
                      setProcessingId(clinic.id);
                      try {
                        const res = await fetch(`/api/admin/vet-clinics?id=${clinic.id}`, {
                          method: 'DELETE',
                          headers: { 'x-admin-key': adminKey }
                        });
                        if (res.ok) {
                          setClinics(prev => prev.filter(c => c.id !== clinic.id));
                        } else {
                          const errData = await res.json().catch(() => ({}));
                          alert(errData.error || 'Failed to delete clinic account.');
                        }
                      } catch (e) {
                        alert('Failed to delete clinic account.');
                      } finally {
                        setProcessingId(null);
                      }
                    }}
                    disabled={processingId === clinic.id}
                    className="bg-gray-100 hover:bg-red-100 text-red-600 font-bold text-xs px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    title="Delete Clinic Account & All Data"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>

              {/* Rejection reason form */}
              {rejectingId === clinic.id && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                  <p className="text-sm font-semibold text-[#4A3E3D]">Rejection reason (optional)</p>
                  <textarea
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                    placeholder="e.g. Could not verify license number"
                    rows={2}
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-red-300"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateStatus(clinic.id, 'rejected', rejectionReason || undefined)}
                      disabled={processingId === clinic.id}
                      className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                    >
                      Confirm Rejection
                    </button>
                    <button
                      onClick={() => setRejectingId(null)}
                      className="text-xs text-gray-500 hover:text-gray-700 px-4 py-2"
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
