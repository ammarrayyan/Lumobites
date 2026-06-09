'use client';

import React, { useState, useEffect } from 'react';
import { Trash2, Footprints } from 'lucide-react';

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
  status?: string; // 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled'
  review_sent?: boolean;
  created_at: string;
  accepted_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  cancelled_by?: string;
  updated_at?: string;
  no_show_at?: string;
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

  const handleDismissNoShow = async (id: string) => {
    if (!confirm('Are you sure you want to dismiss this no-show report? This will set the booking status back to accepted and decrement the sitter\'s no-show count.')) {
      return;
    }
    try {
      const res = await fetch('/api/admin/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey
        },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        alert('No-show report dismissed successfully!');
        fetchRequests();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to dismiss no-show report.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred.');
    }
  };

  const handleDeleteRequest = async (id: string) => {
    if (!confirm('Are you sure? This cannot be undone.')) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/requests?id=${id}`, {
        method: 'DELETE',
        headers: {
          'x-admin-key': adminKey
        }
      });
      if (res.ok) {
        alert('Booking deleted successfully!');
        fetchRequests();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete booking.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while deleting the booking.');
    }
  };

  const handleClearAllBookings = async () => {
    if (!confirm('Are you sure? This cannot be undone.')) {
      return;
    }
    try {
      const res = await fetch('/api/admin/requests?all=true', {
        method: 'DELETE',
        headers: {
          'x-admin-key': adminKey
        }
      });
      if (res.ok) {
        alert('All bookings cleared successfully!');
        fetchRequests();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to clear bookings.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred.');
    }
  };

  const handleClearAllMessages = async () => {
    if (!confirm('Are you sure? This cannot be undone.')) {
      return;
    }
    try {
      const res = await fetch('/api/admin/messages?all=true', {
        method: 'DELETE',
        headers: {
          'x-admin-key': adminKey
        }
      });
      if (res.ok) {
        alert('All messages cleared successfully!');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to clear messages.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred.');
    }
  };

  const handleClearAllNotifications = async () => {
    if (!confirm('Are you sure? This cannot be undone.')) {
      return;
    }
    try {
      const res = await fetch('/api/admin/notifications?all=true', {
        method: 'DELETE',
        headers: {
          'x-admin-key': adminKey
        }
      });
      if (res.ok) {
        alert('All notifications cleared successfully!');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to clear notifications.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred.');
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [adminKey]);

  // Calculations for stats
  const totalRequests = requests.length;
  const pendingCount = requests.filter(r => !r.status || r.status.toLowerCase() === 'pending').length;
  const acceptedCount = requests.filter(r => r.status && r.status.toLowerCase() === 'accepted').length;
  const completedCount = requests.filter(r => r.status && r.status.toLowerCase() === 'completed').length;
  const declinedCount = requests.filter(r => r.status && r.status.toLowerCase() === 'declined').length;
  const cancelledCount = requests.filter(r => r.status && r.status.toLowerCase() === 'cancelled').length;
  const noShowCount = requests.filter(r => r.status && r.status.toLowerCase() === 'no_show').length;
  const reviewEmailsCount = requests.filter(r => r.review_sent).length;

  // Filter and search logic
  const filteredRequests = requests.filter(request => {
    const status = request.status || 'pending';
    
    // Status Filter
    if (statusFilter !== 'All') {
      if (statusFilter.toLowerCase() === 'pending' && status.toLowerCase() !== 'pending') return false;
      if (statusFilter.toLowerCase() === 'accepted' && status.toLowerCase() !== 'accepted') return false;
      if (statusFilter.toLowerCase() === 'completed' && status.toLowerCase() !== 'completed') return false;
      if (statusFilter.toLowerCase() === 'declined' && status.toLowerCase() !== 'declined') return false;
      if (statusFilter.toLowerCase() === 'cancelled' && status.toLowerCase() !== 'cancelled') return false;
      if (statusFilter.toLowerCase() === 'no_show' && status.toLowerCase() !== 'no_show') return false;
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
    return <div className="text-center py-12 text-[#555555] animate-pulse">Loading sitting requests...</div>;
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
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <h2 className="text-xl font-semibold text-[#191919]">
          Sitting Requests Management
        </h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleClearAllBookings}
            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear All Bookings
          </button>
          <button
            onClick={handleClearAllMessages}
            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear All Messages
          </button>
          <button
            onClick={handleClearAllNotifications}
            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear All Notifications
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-8 gap-4">
        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 p-5 rounded-2xl border border-gray-200 flex flex-col">
          <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Total Requests</span>
          <span className="text-3xl font-black text-purple-600">{totalRequests}</span>
        </div>
        <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 p-5 rounded-2xl border border-gray-200 flex flex-col">
          <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Pending</span>
          <span className="text-3xl font-black text-yellow-400">{pendingCount}</span>
        </div>
        <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 p-5 rounded-2xl border border-gray-200 flex flex-col">
          <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Accepted</span>
          <span className="text-3xl font-black text-green-600">{acceptedCount}</span>
        </div>
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 p-5 rounded-2xl border border-gray-200 flex flex-col">
          <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Completed</span>
          <span className="text-3xl font-black text-blue-600">{completedCount}</span>
        </div>
        <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 p-5 rounded-2xl border border-gray-200 flex flex-col">
          <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Declined</span>
          <span className="text-3xl font-black text-red-600">{declinedCount}</span>
        </div>
        <div className="bg-gradient-to-br from-gray-500/10 to-gray-600/10 p-5 rounded-2xl border border-gray-200 flex flex-col">
          <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Cancelled</span>
          <span className="text-3xl font-black text-gray-400">{cancelledCount}</span>
        </div>
        <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 p-5 rounded-2xl border border-gray-200 flex flex-col">
          <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">No Shows</span>
          <span className="text-3xl font-black text-orange-600">{noShowCount}</span>
        </div>
        <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/10 p-5 rounded-2xl border border-gray-200 flex flex-col">
          <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Review Sent</span>
          <span className="text-3xl font-black text-cyan-400">{reviewEmailsCount}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wider">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-[#191919] focus:outline-none focus:border-[#c2e59c]"
            >
              <option className="bg-white text-[#191919]" value="All">All Requests</option>
              <option className="bg-white text-[#191919]" value="Pending">Pending</option>
              <option className="bg-white text-[#191919]" value="Accepted">Accepted</option>
              <option className="bg-white text-[#191919]" value="Completed">Completed</option>
              <option className="bg-white text-[#191919]" value="Declined">Declined</option>
              <option className="bg-white text-[#191919]" value="Cancelled">Cancelled</option>
              <option className="bg-white text-[#191919]" value="No_Show">No Show</option>
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="flex flex-col w-full md:w-96">
          <label className="text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wider">Search</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by owner, sitter, pet or dates..."
            className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-[#191919] focus:outline-none focus:border-[#c2e59c] w-full"
          />
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white/40 border border-gray-200 rounded-2xl overflow-hidden">
        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center">
            <Footprints className="w-10 h-10 text-gray-400 mb-4" />
            <p>No sitting requests match the current filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-4 text-xs font-bold text-[#555555] uppercase tracking-wider">Submitted</th>
                  <th className="p-4 text-xs font-bold text-[#555555] uppercase tracking-wider">Owner Email</th>
                  <th className="p-4 text-xs font-bold text-[#555555] uppercase tracking-wider">Sitter</th>
                  <th className="p-4 text-xs font-bold text-[#555555] uppercase tracking-wider">Pet</th>
                  <th className="p-4 text-xs font-bold text-[#555555] uppercase tracking-wider">Dates</th>
                  <th className="p-4 text-xs font-bold text-[#555555] uppercase tracking-wider">Status</th>
                  <th className="p-4 text-xs font-bold text-[#555555] uppercase tracking-wider">Action Date</th>
                  <th className="p-4 text-xs font-bold text-[#555555] uppercase tracking-wider text-center">Review Sent</th>
                  <th className="p-4 text-xs font-bold text-[#555555] uppercase tracking-wider text-center">Actions</th>
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
                        className={`hover:bg-gray-50 transition-colors cursor-pointer ${isExpanded ? 'bg-gray-50' : ''}`}
                      >
                        {/* Submitted Date */}
                        <td className="p-4 text-sm text-[#555555] whitespace-nowrap">
                          {new Date(request.created_at).toLocaleDateString()}
                        </td>

                        {/* Owner Email & Booking # */}
                        <td className="p-4 text-sm font-semibold text-[#191919]">
                          <div>{request.owner_email}</div>
                          <div className="text-xs text-gray-500 font-normal">{request.booking_number || 'No Booking #'}</div>
                        </td>

                        {/* Sitter Name & Email */}
                        <td className="p-4 text-sm">
                          <div className="font-semibold text-[#191919]">{request.sitter_name}</div>
                          <div className="text-xs text-gray-500">{request.sitter_email}</div>
                        </td>

                        {/* Pet Name & Type */}
                        <td className="p-4 text-sm">
                          <span className="font-semibold text-[#191919]">{request.pet_name}</span>
                          <span className="ml-1.5 text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-200 uppercase font-bold tracking-wider">
                            {request.pet_type === 'both' ? '🐱 & 🐶' : request.pet_type === 'dog' ? '🐶 Dog' : '🐱 Cat'}
                          </span>
                        </td>

                        {/* Requested Dates */}
                        <td className="p-4 text-sm text-[#555555] max-w-[200px] truncate" title={request.dates}>
                          <div>{request.dates}</div>
                          {request.time_slot && (
                            <div className="text-[10px] font-semibold text-orange-600 bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded uppercase mt-1 inline-block">
                              ⏰ {request.time_slot}
                            </div>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td className="p-4 whitespace-nowrap">
                          {status.toLowerCase() === 'accepted' ? (
                            <span className="bg-green-500/20 text-green-600 border border-green-500/30 font-bold text-xs px-2.5 py-1 rounded-full inline-block">
                              🟢 Accepted
                            </span>
                          ) : status.toLowerCase() === 'completed' ? (
                            <span className="bg-blue-500/20 text-blue-600 border border-blue-500/30 font-bold text-xs px-2.5 py-1 rounded-full inline-block">
                              🔵 Completed
                            </span>
                          ) : status.toLowerCase() === 'declined' ? (
                            <span className="bg-red-500/20 text-red-600 border border-red-500/30 font-bold text-xs px-2.5 py-1 rounded-full inline-block">
                              🔴 Declined
                            </span>
                          ) : status.toLowerCase() === 'cancelled' ? (
                            <span className="bg-gray-100 text-gray-500 border border-gray-300 font-bold text-xs px-2.5 py-1 rounded-full inline-block">
                              ⚪ Cancelled
                            </span>
                          ) : status.toLowerCase() === 'no_show' ? (
                            <span className="bg-orange-500/20 text-orange-600 border border-orange-500/30 font-bold text-xs px-2.5 py-1 rounded-full inline-block">
                              🟠 No Show
                            </span>
                          ) : (
                            <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 font-bold text-xs px-2.5 py-1 rounded-full inline-block animate-pulse">
                              🟡 Pending
                            </span>
                          )}
                        </td>
 
                        {/* Action Date (Accepted/Declined/Completed/Cancelled) */}
                        <td className="p-4 text-sm text-[#555555] whitespace-nowrap">
                          {status.toLowerCase() === 'accepted' && request.accepted_at ? (
                            new Date(request.accepted_at).toLocaleDateString()
                          ) : status.toLowerCase() === 'completed' && request.completed_at ? (
                            new Date(request.completed_at).toLocaleDateString()
                          ) : status.toLowerCase() === 'cancelled' && request.cancelled_at ? (
                            new Date(request.cancelled_at).toLocaleDateString()
                          ) : status.toLowerCase() === 'no_show' && request.no_show_at ? (
                            new Date(request.no_show_at).toLocaleDateString()
                          ) : status.toLowerCase() === 'declined' ? (
                            'N/A'
                          ) : (
                            '—'
                          )}
                        </td>

                        {/* Review Sent Column */}
                        <td className="p-4 text-sm text-center whitespace-nowrap">
                          {request.review_sent ? (
                            <span className="text-green-600 font-semibold bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">Yes</span>
                          ) : (
                            <span className="text-gray-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">No</span>
                          )}
                        </td>

                        {/* Delete Button */}
                        <td className="p-4 text-sm text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRequest(request.id);
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-1.5 px-3 rounded-lg transition-colors cursor-pointer flex items-center gap-1 mx-auto"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Section showing Owner Message/Notes */}
                      {isExpanded && (
                        <tr className="bg-gray-100">
                          <td colSpan={9} className="p-5 border-b border-gray-200">
                            <div className="space-y-3">
                              <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                                Message / Special Notes from Owner:
                              </h4>
                              <p className="text-sm text-[#555555] bg-white/40 p-4 rounded-xl border border-gray-200 whitespace-pre-wrap leading-relaxed">
                                {request.special_notes || 'No message or special notes provided by the owner.'}
                              </p>
                              <div className="flex gap-6 text-xs text-gray-500">
                                <div>
                                  <strong className="text-gray-500">Booking Number:</strong> {request.booking_number || 'N/A'}
                                </div>
                                <div>
                                  <strong className="text-gray-500">Owner Phone:</strong> {request.phone_number || 'N/A'}
                                </div>
                                <div>
                                  <strong className="text-gray-500">Request ID:</strong> {request.id}
                                </div>
                                <div>
                                  <strong className="text-gray-500">Sitter ID:</strong> {request.sitter_id}
                                </div>
                              </div>
                              {status.toLowerCase() === 'no_show' && (
                                <div className="pt-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDismissNoShow(request.id);
                                    }}
                                    className="bg-orange-500 hover:bg-orange-600 text-black font-bold text-xs py-1.5 px-4 rounded-lg transition-colors cursor-pointer"
                                  >
                                    Dismiss No Show Report
                                  </button>
                                </div>
                              )}
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
