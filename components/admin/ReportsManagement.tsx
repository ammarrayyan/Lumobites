'use client';

import React, { useState, useEffect } from 'react';

interface Report {
  id: string;
  reporter_email: string;
  reported_email: string;
  reported_type: string;
  booking_id: string | null;
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

  const fetchData = async () => {
    try {
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

  const getUserStatus = (email: string) => {
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    return user?.account_status || 'active';
  };

  if (loading) {
    return <div className="text-gray-500 animate-pulse text-center py-12">Loading reports...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
        <h2 className="text-xl font-semibold text-[#191919]">Safety & Abuse Reports ({reports.length})</h2>
        <button
          onClick={fetchData}
          className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-1.5 px-3 rounded-lg transition-colors font-medium border border-gray-200"
        >
          Refresh
        </button>
      </div>

      <div className="overflow-x-auto">
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
            {reports.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">No reports submitted yet.</td>
              </tr>
            ) : (
              reports.map(report => {
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
                      {report.details && <div className="text-xs text-gray-500 mt-1 line-clamp-3">{report.details}</div>}
                      {report.booking_id && <div className="text-[10px] text-gray-400 mt-1">Booking: {report.booking_id.substring(0, 8)}...</div>}
                    </td>
                    <td className="px-4 py-3 text-xs">{report.reporter_email}</td>
                    <td className="px-4 py-3">
                      {report.status === 'pending' ? (
                        <span className="px-2 py-1 rounded-full bg-amber-500/20 text-amber-600 text-xs font-bold">Pending</span>
                      ) : report.status === 'resolved' ? (
                        <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-600 text-xs font-medium">Resolved</span>
                      ) : (
                        <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-medium">Dismissed</span>
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
                              className="text-xs text-gray-500 hover:text-gray-800 font-semibold px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
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
                              className="text-xs text-red-650 hover:text-red-800 font-semibold px-2 py-1 rounded bg-red-50 hover:bg-red-100 transition-colors"
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
                              className="text-xs text-green-700 hover:text-green-900 font-semibold px-2.5 py-1 rounded bg-green-50 hover:bg-green-100 transition-colors"
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
      </div>
    </div>
  );
}
