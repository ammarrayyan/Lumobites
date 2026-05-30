'use client';

import React, { useState, useEffect } from 'react';

interface SittingRequest {
  id: string;
  owner_email: string;
  sitter_id: string;
  sitter_name: string;
  sitter_email: string;
  pet_name: string;
  pet_type: string;
  dates: string;
  special_notes?: string;
  status?: string; // 'pending' | 'accepted' | 'declined'
  review_sent?: boolean;
  created_at: string;
  accepted_at?: string;
  updated_at?: string;
}

interface RequestsManagementProps {
  adminKey: string;
  onUnauthorized: () => void;
}

export default function RequestsManagement({ adminKey, onUnauthorized }: RequestsManagementProps) {
  const [requests, setRequests] = useState<SittingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Expanded rows to show special notes
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/requests', {
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
        setRequests(data.requests || []);
      } else {
        setError(data.error || 'Failed to fetch sitting requests');
      }
    } catch (err) {
      console.error(err);
      setError('Connection error occurred while fetching requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [adminKey]);

  // Calculations for stats
  const totalRequests = requests.length;
  const pendingCount = requests.filter(r => !r.status || r.status.toLowerCase() === 'pending').length;
  const acceptedCount = requests.filter(r => r.status && r.status.toLowerCase() === 'accepted').length;
  const declinedCount = requests.filter(r => r.status && r.status.toLowerCase() === 'declined').length;
  const reviewEmailsCount = requests.filter(r => r.review_sent).length;

  // Filter and search logic
  const filteredRequests = requests.filter(request => {
    const status = request.status || 'pending';
    
    // Status Filter
    if (statusFilter !== 'All') {
      if (statusFilter.toLowerCase() === 'pending' && status.toLowerCase() !== 'pending') return false;
      if (statusFilter.toLowerCase() === 'accepted' && status.toLowerCase() !== 'accepted') return false;
      if (statusFilter.toLowerCase() === 'declined' && status.toLowerCase() !== 'declined') return false;
    }
    
    // Search Query (owner_email or sitter_email)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const ownerEmail = (request.owner_email || '').toLowerCase();
      const sitterEmail = (request.sitter_email || '').toLowerCase();
      const sitterName = (request.sitter_name || '').toLowerCase();
      const petName = (request.pet_name || '').toLowerCase();
      
      if (!ownerEmail.includes(query) && 
          !sitterEmail.includes(query) && 
          !sitterName.includes(query) && 
          !petName.includes(query)) {
        return false;
      }
    }
    
    return true;
  });

  const toggleRow = (id: string) => {
    if (expandedRequestId === id) {
      setExpandedRequestId(null);
    } else {
      setExpandedRequestId(id);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-white/70 animate-pulse">Loading sitting requests...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-900/50 border border-red-500/50 text-red-200 p-4 rounded-xl">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <h2 className="text-xl font-semibold text-white border-b border-white/10 pb-4">
        Sitting Requests Management
      </h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 p-5 rounded-2xl border border-white/5 flex flex-col">
          <span className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">Total Requests</span>
          <span className="text-3xl font-black text-purple-400">{totalRequests}</span>
        </div>
        <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 p-5 rounded-2xl border border-white/5 flex flex-col">
          <span className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">Pending</span>
          <span className="text-3xl font-black text-yellow-400">{pendingCount}</span>
        </div>
        <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 p-5 rounded-2xl border border-white/5 flex flex-col">
          <span className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">Accepted</span>
          <span className="text-3xl font-black text-green-400">{acceptedCount}</span>
        </div>
        <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 p-5 rounded-2xl border border-white/5 flex flex-col">
          <span className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">Declined</span>
          <span className="text-3xl font-black text-red-400">{declinedCount}</span>
        </div>
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 p-5 rounded-2xl border border-white/5 flex flex-col">
          <span className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">Review Emails Sent</span>
          <span className="text-3xl font-black text-blue-400">{reviewEmailsCount}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#1a1a1a] p-5 rounded-2xl border border-white/10 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex flex-col">
            <label className="text-xs text-white/50 font-semibold mb-1 uppercase tracking-wider">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c2e59c]"
            >
              <option value="All">All Requests</option>
              <option value="Pending">Pending</option>
              <option value="Accepted">Accepted</option>
              <option value="Declined">Declined</option>
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="flex flex-col w-full md:w-96">
          <label className="text-xs text-white/50 font-semibold mb-1 uppercase tracking-wider">Search</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by owner, sitter, pet or dates..."
            className="bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c2e59c] w-full"
          />
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden">
        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center text-white/50">
            <span className="text-4xl mb-4 block">🐾</span>
            <p>No sitting requests match the current filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="p-4 text-xs font-bold text-white/70 uppercase tracking-wider">Submitted</th>
                  <th className="p-4 text-xs font-bold text-white/70 uppercase tracking-wider">Owner Email</th>
                  <th className="p-4 text-xs font-bold text-white/70 uppercase tracking-wider">Sitter</th>
                  <th className="p-4 text-xs font-bold text-white/70 uppercase tracking-wider">Pet</th>
                  <th className="p-4 text-xs font-bold text-white/70 uppercase tracking-wider">Dates</th>
                  <th className="p-4 text-xs font-bold text-white/70 uppercase tracking-wider">Status</th>
                  <th className="p-4 text-xs font-bold text-white/70 uppercase tracking-wider">Action Date</th>
                  <th className="p-4 text-xs font-bold text-white/70 uppercase tracking-wider text-center">Review Sent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredRequests.map((request) => {
                  const status = request.status || 'pending';
                  const isExpanded = expandedRequestId === request.id;

                  return (
                    <React.Fragment key={request.id}>
                      <tr 
                        onClick={() => toggleRow(request.id)}
                        className={`hover:bg-white/5 transition-colors cursor-pointer ${isExpanded ? 'bg-white/5' : ''}`}
                      >
                        {/* Submitted Date */}
                        <td className="p-4 text-sm text-white/70 whitespace-nowrap">
                          {new Date(request.created_at).toLocaleDateString()}
                        </td>

                        {/* Owner Email */}
                        <td className="p-4 text-sm font-semibold text-white">
                          {request.owner_email}
                        </td>

                        {/* Sitter Name & Email */}
                        <td className="p-4 text-sm">
                          <div className="font-semibold text-white">{request.sitter_name}</div>
                          <div className="text-xs text-white/50">{request.sitter_email}</div>
                        </td>

                        {/* Pet Name & Type */}
                        <td className="p-4 text-sm">
                          <span className="font-semibold text-white">{request.pet_name}</span>
                          <span className="ml-1.5 text-xs text-white/60 bg-white/5 px-2 py-0.5 rounded border border-white/10 uppercase font-bold tracking-wider">
                            {request.pet_type === 'both' ? '🐱 & 🐶' : request.pet_type === 'dog' ? '🐶 Dog' : '🐱 Cat'}
                          </span>
                        </td>

                        {/* Requested Dates */}
                        <td className="p-4 text-sm text-white/80 max-w-[200px] truncate" title={request.dates}>
                          {request.dates}
                        </td>

                        {/* Status Badge */}
                        <td className="p-4 whitespace-nowrap">
                          {status.toLowerCase() === 'accepted' ? (
                            <span className="bg-green-500/20 text-green-400 border border-green-500/30 font-bold text-xs px-2.5 py-1 rounded-full inline-block">
                              🟢 Accepted
                            </span>
                          ) : status.toLowerCase() === 'declined' ? (
                            <span className="bg-red-500/20 text-red-400 border border-red-500/30 font-bold text-xs px-2.5 py-1 rounded-full inline-block">
                              🔴 Declined
                            </span>
                          ) : (
                            <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 font-bold text-xs px-2.5 py-1 rounded-full inline-block animate-pulse">
                              🟡 Pending
                            </span>
                          )}
                        </td>

                        {/* Action Date (Accepted/Declined) */}
                        <td className="p-4 text-sm text-white/70 whitespace-nowrap">
                          {status.toLowerCase() === 'accepted' && request.accepted_at ? (
                            new Date(request.accepted_at).toLocaleDateString()
                          ) : status.toLowerCase() === 'declined' ? (
                            'N/A'
                          ) : (
                            '—'
                          )}
                        </td>

                        {/* Review Sent Column */}
                        <td className="p-4 text-sm text-center whitespace-nowrap">
                          {request.review_sent ? (
                            <span className="text-green-400 font-semibold bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">Yes</span>
                          ) : (
                            <span className="text-white/40 bg-white/5 px-2 py-0.5 rounded border border-white/5">No</span>
                          )}
                        </td>
                      </tr>

                      {/* Expanded Section showing Owner Message/Notes */}
                      {isExpanded && (
                        <tr className="bg-black/20">
                          <td colSpan={8} className="p-5 border-b border-white/10">
                            <div className="space-y-3">
                              <h4 className="text-xs font-bold text-[#c2e59c] uppercase tracking-wider">
                                Message / Special Notes from Owner:
                              </h4>
                              <p className="text-sm text-white/80 bg-black/40 p-4 rounded-xl border border-white/5 whitespace-pre-wrap leading-relaxed">
                                {request.special_notes || 'No message or special notes provided by the owner.'}
                              </p>
                              <div className="flex gap-6 text-xs text-white/40">
                                <div>
                                  <strong className="text-white/60">Request ID:</strong> {request.id}
                                </div>
                                <div>
                                  <strong className="text-white/60">Sitter ID:</strong> {request.sitter_id}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
