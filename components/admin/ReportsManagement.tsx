'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Trash2, Check, ExternalLink, RefreshCw, EyeOff, Ban } from 'lucide-react';

interface Report {
  id: string;
  reporter_email: string;
  reported_by_email?: string;
  reported_email: string;
  reported_type: string;
  booking_id: string | null;
  post_id: string | null;
  post_type: string | null;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
}

export default function ReportsManagement({ adminKey, onUnauthorized }: { adminKey: string, onUnauthorized: () => void }) {
  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'ugc' | 'legacy'>('ugc');

  const fetchData = async () => {
    try {
      setLoading(true);
      // 1. Fetch Reports
      const reportsRes = await fetch('/api/reports', {
        headers: { 'x-admin-key': adminKey }
      });
      if (reportsRes.status === 401) {
        onUnauthorized();
        return;
      }
      const reportsData = await reportsRes.json();
      
      // 2. Fetch Users to show current account_status
      const usersRes = await fetch('/api/admin/users', {
        headers: { 'x-admin-key': adminKey }
      });
      const usersData = await usersRes.json();

      setReports(reportsData.reports || []);
      setUsers(usersData.users || []);
    } catch (err) {
      console.error('Failed to fetch admin report data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateReportStatus = async (id: string, status: string) => {
    setActioningId(id);
    try {
      const res = await fetch('/api/reports', {
        method: 'PUT',
        headers: {
          'x-admin-key': adminKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id, status })
      });
      if (!res.ok) throw new Error('Failed to update report');
      
      setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActioningId(null);
    }
  };

  const handleUpdateAccountStatus = async (email: string, status: string, reportId?: string) => {
    if (reportId) setActioningId(reportId);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'x-admin-key': adminKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, status })
      });
      if (!res.ok) throw new Error('Failed to update account status');

      // Update local users list status
      setUsers(prev => prev.map(u => u.email === email ? { ...u, account_status: status } : u));
      
      // If resolving a report in tandem
      if (reportId) {
        await handleUpdateReportStatus(reportId, 'resolved');
      } else {
        alert(`Account status for ${email} set to ${status}.`);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActioningId(null);
    }
  };

  // NEW ACTIONS FOR CONTENT MODERATION QUEUE
  const handleRemovePost = async (report: Report) => {
    if (!report.post_id || !report.post_type) return;
    if (!confirm(`Are you sure you want to delete this ${report.post_type} post immediately?`)) return;

    setActioningId(report.id);
    try {
      let deleteSuccess = false;

      if (report.post_type === 'lost_pet') {
        const res = await fetch('/api/admin/lost-pets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-key': adminKey
          },
          body: JSON.stringify({ id: report.post_id, action: 'delete' })
        });
        deleteSuccess = res.ok;
      } else if (report.post_type === 'city_board') {
        const res = await fetch('/api/city-board/posts', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-key': adminKey
          },
          body: JSON.stringify({ post_id: report.post_id })
        });
        deleteSuccess = res.ok;
      }

      if (!deleteSuccess) {
        throw new Error('Failed to delete the post from database.');
      }

      // Mark report as resolved
      await handleUpdateReportStatus(report.id, 'resolved');
      alert('Post removed successfully.');
    } catch (err: any) {
      alert(err.message || 'Error occurred while removing post.');
    } finally {
      setActioningId(null);
    }
  };

  const handleBanPostUser = async (report: Report) => {
    if (!report.post_id || !report.post_type) return;
    if (!confirm(`Are you sure you want to BAN the user who created this ${report.post_type} post? This will also remove the post.`)) return;

    setActioningId(report.id);
    try {
      if (report.post_type === 'lost_pet') {
        // 1. Fetch the lost pet details to retrieve contact_email
        const petRes = await fetch(`/api/lost-pets/${report.post_id}`);
        if (!petRes.ok) throw new Error('Could not retrieve lost pet post details.');
        const petData = await petRes.json();
        const contactEmail = petData.pet?.contact_email;

        if (!contactEmail) {
          throw new Error('No contact email associated with this post.');
        }

        // 2. Ban the email account
        const banRes = await fetch('/api/admin/users', {
          method: 'PUT',
          headers: {
            'x-admin-key': adminKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email: contactEmail, status: 'banned' })
        });
        if (!banRes.ok) throw new Error('Failed to ban email account.');

        // 3. Delete the post
        await fetch('/api/admin/lost-pets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-key': adminKey
          },
          body: JSON.stringify({ id: report.post_id, action: 'delete' })
        });

      } else if (report.post_type === 'city_board') {
        // 1. Fetch the city board post details to retrieve device_cookie
        const postsRes = await fetch(`/api/city-board/posts?post_id=${report.post_id}`, {
          headers: { 'x-admin-key': adminKey }
        });
        if (!postsRes.ok) throw new Error('Could not retrieve city board post details.');
        const postsData = await postsRes.json();
        const post = postsData.posts?.find((p: any) => p.post_id === report.post_id);
        const cookie = post?.device_cookie;

        if (!cookie) {
          throw new Error('No device cookie associated with this post.');
        }

        // 2. Ban the device cookie
        const banCookieRes = await fetch('/api/admin/ban-cookie', {
          method: 'POST',
          headers: {
            'x-admin-key': adminKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ cookie })
        });
        if (!banCookieRes.ok) throw new Error('Failed to ban device cookie.');

        // 3. Delete the post
        await fetch('/api/city-board/posts', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-key': adminKey
          },
          body: JSON.stringify({ post_id: report.post_id })
        });
      }

      // Mark report as resolved
      await handleUpdateReportStatus(report.id, 'resolved');
      alert('User banned and post removed successfully.');
    } catch (err: any) {
      alert(err.message || 'Error occurred while banning user.');
    } finally {
      setActioningId(null);
    }
  };

  const getUserStatus = (email: string) => {
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    return user?.account_status || 'active';
  };

  const getPostViewUrl = (report: Report) => {
    if (report.post_type === 'lost_pet') return `/lost-pets/${report.post_id}`;
    if (report.post_type === 'city_board') return `/city-board/${report.post_id}`;
    return '#';
  };

  // Filter reports
  const ugcReports = reports.filter(r => r.post_id !== null);
  const pendingUgcReports = ugcReports.filter(r => r.status === 'pending');
  const legacyReports = reports.filter(r => r.post_id === null);

  if (loading) {
    return <div className="text-gray-500 animate-pulse text-center py-12">Loading reports...</div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-xl font-semibold text-[#191919] flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-red-600" />
            Safety & Moderation Queue
          </h2>
          <p className="text-xs text-gray-500 mt-1">Review reported content and sitter profiles to maintain community safety.</p>
        </div>
        <button
          onClick={fetchData}
          className="self-start sm:self-center text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-1.5 px-3 rounded-lg transition-colors font-medium border border-gray-200 flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Sub tabs */}
      <div className="flex space-x-2 border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveSubTab('ugc')}
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === 'ugc'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-550 hover:text-[#191919]'
          }`}
        >
          Content Moderation Queue ({pendingUgcReports.length} pending)
          {pendingUgcReports.length > 0 && (
            <span className="bg-red-550 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {pendingUgcReports.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveSubTab('legacy')}
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-all ${
            activeSubTab === 'legacy'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-550 hover:text-[#191919]'
          }`}
        >
          Sitter & Booking Reports ({legacyReports.filter(r => r.status === 'pending').length} pending)
        </button>
      </div>

      {/* Sub tab content */}
      <div className="overflow-x-auto">
        {activeSubTab === 'ugc' ? (
          <table className="w-full text-left text-sm text-[#555555]">
            <thead className="text-xs uppercase bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-3 rounded-tl-lg">Reported By</th>
                <th className="px-4 py-3">Post Type</th>
                <th className="px-4 py-3">Post ID</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 rounded-tr-lg text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {ugcReports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">No content reports submitted yet.</td>
                </tr>
              ) : (
                ugcReports.map(report => (
                  <tr key={report.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-[#191919]">{report.reported_by_email || report.reporter_email}</td>
                    <td className="px-4 py-3 capitalize">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        report.post_type === 'lost_pet' ? 'bg-red-50 text-red-750' : 'bg-purple-50 text-purple-750'
                      }`}>
                        {report.post_type === 'lost_pet' ? 'Lost Pet' : 'City Board'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{report.post_id}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-800">{report.reason}</div>
                      {report.details && <div className="text-xs text-gray-400 mt-0.5">{report.details}</div>}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {new Date(report.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {report.status === 'pending' ? (
                        <div className="flex gap-2 justify-end">
                          <a
                            href={getPostViewUrl(report)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800 font-semibold px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 transition-colors flex items-center gap-1"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            View
                          </a>
                          <button
                            onClick={() => handleRemovePost(report)}
                            disabled={actioningId === report.id}
                            className="text-xs text-orange-600 hover:text-orange-850 font-semibold px-2 py-1 rounded bg-orange-50 hover:bg-orange-100 transition-colors flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Remove Post
                          </button>
                          <button
                            onClick={() => handleBanPostUser(report)}
                            disabled={actioningId === report.id}
                            className="text-xs text-red-650 hover:text-red-850 font-semibold px-2 py-1 rounded bg-red-50 hover:bg-red-100 transition-colors flex items-center gap-1"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            Ban User
                          </button>
                          <button
                            onClick={() => handleUpdateReportStatus(report.id, 'dismissed')}
                            disabled={actioningId === report.id}
                            className="text-xs text-gray-550 hover:text-gray-800 font-semibold px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 transition-colors flex items-center gap-1"
                          >
                            <EyeOff className="w-3.5 h-3.5" />
                            Dismiss
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 capitalize font-medium flex items-center justify-end gap-1">
                          <Check className="w-4 h-4 text-green-550" />
                          {report.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left text-sm text-[#555555]">
            <thead className="text-xs uppercase bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-3 rounded-tl-lg">Reported Account</th>
                <th className="px-4 py-3">Reason / Details</th>
                <th className="px-4 py-3">Reporter</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 rounded-tr-lg text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {legacyReports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">No sitter or booking reports submitted yet.</td>
                </tr>
              ) : (
                legacyReports.map(report => {
                  const currentStatus = getUserStatus(report.reported_email);
                  
                  return (
                    <tr key={report.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-[#191919]">
                        <div className="font-semibold">{report.reported_email}</div>
                        <div className="text-xs text-gray-400 capitalize">Type: {report.reported_type}</div>
                        <div className="mt-1">
                          {currentStatus === 'suspended' && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">SUSPENDED</span>
                          )}
                          {currentStatus === 'banned' && (
                            <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-800 text-[10px] font-bold">BANNED</span>
                          )}
                          {currentStatus === 'flagged' && (
                            <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-bold">FLAGGED</span>
                          )}
                          {currentStatus === 'active' && (
                            <span className="px-1.5 py-0.5 rounded bg-green-100 text-green-800 text-[10px] font-bold">ACTIVE</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <div className="font-semibold text-gray-800">{report.reason}</div>
                        {report.details && <div className="text-xs text-gray-550 mt-1 line-clamp-3">{report.details}</div>}
                        {report.booking_id && <div className="text-[10px] text-gray-400 mt-1">Booking: {report.booking_id.substring(0, 8)}...</div>}
                      </td>
                      <td className="px-4 py-3 text-xs">{report.reporter_email}</td>
                      <td className="px-4 py-3">
                        {report.status === 'pending' ? (
                          <span className="px-2 py-1 rounded-full bg-amber-500/20 text-amber-600 text-xs font-bold">Pending</span>
                        ) : report.status === 'resolved' ? (
                          <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-600 text-xs font-medium">Resolved</span>
                        ) : (
                          <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-505 text-xs font-medium">Dismissed</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {new Date(report.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {report.status === 'pending' ? (
                          <div className="flex flex-col gap-1 items-end">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUpdateReportStatus(report.id, 'dismissed')}
                                disabled={actioningId === report.id}
                                className="text-xs text-gray-555 hover:text-gray-855 font-semibold px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
                              >
                                Dismiss
                              </button>
                              <button
                                onClick={() => handleUpdateAccountStatus(report.reported_email, 'suspended', report.id)}
                                disabled={actioningId === report.id}
                                className="text-xs text-amber-600 hover:text-amber-800 font-semibold px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 transition-colors"
                              >
                                Suspend
                              </button>
                              <button
                                onClick={() => handleUpdateAccountStatus(report.reported_email, 'banned', report.id)}
                                disabled={actioningId === report.id}
                                className="text-xs text-red-655 hover:text-red-855 font-semibold px-2 py-1 rounded bg-red-50 hover:bg-red-100 transition-colors"
                              >
                                Ban
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            {currentStatus !== 'active' ? (
                              <button
                                onClick={() => handleUpdateAccountStatus(report.reported_email, 'active')}
                                className="text-xs text-green-705 hover:text-green-900 font-semibold px-2.5 py-1 rounded bg-green-50 hover:bg-green-100 transition-colors"
                              >
                                Reactivate Account
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400">Handled</span>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
