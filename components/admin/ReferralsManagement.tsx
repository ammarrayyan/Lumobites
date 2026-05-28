'use client';

import React, { useState, useEffect } from 'react';
import { Copy, Plus, Users, DollarSign, Activity, XCircle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface ReferralsManagementProps {
  adminKey: string;
  onUnauthorized: () => void;
}

export default function ReferralsManagement({ adminKey, onUnauthorized }: ReferralsManagementProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newReferrerName, setNewReferrerName] = useState('');
  const [creating, setCreating] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/referrals', {
        headers: { 'Authorization': `Bearer ${adminKey}` }
      });
      if (res.status === 401) return onUnauthorized();
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateReferrer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReferrerName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/admin/referrals/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminKey}`
        },
        body: JSON.stringify({ name: newReferrerName.trim() })
      });
      if (res.status === 401) return onUnauthorized();
      if (res.ok) {
        setNewReferrerName('');
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = (code: string) => {
    const url = `https://lumobites.net?ref=${code}`;
    navigator.clipboard.writeText(url);
    alert('Copied to clipboard: ' + url);
  };

  if (loading) return <div className="text-white/50 text-center py-12">Loading referrals data...</div>;
  if (!data) return <div className="text-red-400 text-center py-12">Error loading data.</div>;

  const { stats, referrers } = data;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#222] p-6 rounded-2xl border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Activity size={48} />
          </div>
          <p className="text-sm text-white/50 mb-1">Total Link Clicks</p>
          <p className="text-3xl font-bold text-white">{stats.totalClicks}</p>
        </div>
        <div className="bg-[#222] p-6 rounded-2xl border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Users size={48} />
          </div>
          <p className="text-sm text-white/50 mb-1">Total Subscribers</p>
          <p className="text-3xl font-bold text-[#c2e59c]">{stats.totalSubscribers}</p>
          <p className="text-xs text-white/40 mt-1">{stats.totalActive} active</p>
        </div>
        <div className="bg-[#222] p-6 rounded-2xl border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <DollarSign size={48} />
          </div>
          <p className="text-sm text-white/50 mb-1">Monthly Revenue</p>
          <p className="text-3xl font-bold text-[#64b3f4]">${stats.totalMonthlyRevenue.toFixed(2)}</p>
          <p className="text-xs text-white/40 mt-1">From active referrals</p>
        </div>
        <div className="bg-[#222] p-6 rounded-2xl border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <XCircle size={48} />
          </div>
          <p className="text-sm text-white/50 mb-1">Total Cancelled</p>
          <p className="text-3xl font-bold text-red-400">{stats.totalCancelled}</p>
        </div>
      </div>

      {/* Create Referrer */}
      <div className="bg-[#222] p-6 rounded-2xl border border-white/5">
        <h3 className="text-lg font-bold text-white mb-4">Create New Referrer</h3>
        <form onSubmit={handleCreateReferrer} className="flex gap-4">
          <input
            type="text"
            value={newReferrerName}
            onChange={(e) => setNewReferrerName(e.target.value)}
            placeholder="Enter referrer name (e.g. Omar)"
            className="flex-1 bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#c2e59c]"
            disabled={creating}
          />
          <button
            type="submit"
            disabled={creating || !newReferrerName.trim()}
            className="bg-gradient-to-r from-[#c2e59c] to-[#64b3f4] text-black font-bold py-3 px-6 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
          >
            <Plus size={18} />
            {creating ? 'Creating...' : 'Create Link'}
          </button>
        </form>
      </div>

      {/* Referrers Table */}
      <div className="bg-[#222] rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h3 className="text-lg font-bold text-white">Referrers Directory</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-white/70">
            <thead className="bg-black/20 text-white/50">
              <tr>
                <th className="p-4 font-medium">Name & Link</th>
                <th className="p-4 font-medium text-center">Clicks</th>
                <th className="p-4 font-medium text-center">Subscribers</th>
                <th className="p-4 font-medium text-center">Active</th>
                <th className="p-4 font-medium text-center">Cancelled</th>
                <th className="p-4 font-medium">Monthly Rev</th>
                <th className="p-4 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {referrers.map((referrer: any) => (
                <React.Fragment key={referrer.id}>
                  <tr className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                    <td className="p-4">
                      <div className="font-bold text-white mb-1">{referrer.name}</div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-[#64b3f4] truncate max-w-[200px]">lumobites.net?ref={referrer.code}</span>
                        <button onClick={() => copyToClipboard(referrer.code)} className="text-white/40 hover:text-white transition-colors" title="Copy Link">
                          <Copy size={14} />
                        </button>
                      </div>
                    </td>
                    <td className="p-4 text-center">{referrer.stats.clicks}</td>
                    <td className="p-4 text-center font-medium text-[#c2e59c]">{referrer.stats.subscribersCount}</td>
                    <td className="p-4 text-center">{referrer.stats.activeCount}</td>
                    <td className="p-4 text-center text-red-400">{referrer.stats.cancelledCount}</td>
                    <td className="p-4 font-bold text-white">
                      ${referrer.stats.totalValue.toFixed(2)}/mo
                      <div className="text-[10px] text-white/40 font-normal mt-1">
                        {referrer.stats.breakdown.proOwners.count} PRO, {referrer.stats.breakdown.sitterPro.count} Sitter
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setExpandedRow(expandedRow === referrer.id ? null : referrer.id)}
                        className="text-white/40 hover:text-white transition-colors"
                      >
                        {expandedRow === referrer.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                    </td>
                  </tr>
                  
                  {/* Expanded Row Details */}
                  {expandedRow === referrer.id && (
                    <tr>
                      <td colSpan={7} className="p-0 border-b border-white/5">
                        <div className="bg-black/30 p-6">
                          <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                            <Users size={16} className="text-[#c2e59c]" />
                            Referred Users for {referrer.name}
                          </h4>
                          {referrer.users.filter((u:any) => u.subscribed).length === 0 ? (
                            <p className="text-white/40 text-sm">No active or cancelled subscribers yet. ({referrer.stats.clicks} clicks only)</p>
                          ) : (
                            <div className="bg-[#111] rounded-xl border border-white/5 overflow-hidden">
                              <table className="w-full text-left text-sm text-white/70">
                                <thead className="bg-white/5 text-white/50 text-xs">
                                  <tr>
                                    <th className="p-3">Email</th>
                                    <th className="p-3">Plan</th>
                                    <th className="p-3">Joined Date</th>
                                    <th className="p-3 text-center">Months Active</th>
                                    <th className="p-3">Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {referrer.users.filter((u:any) => u.subscribed).map((user: any) => (
                                    <tr key={user.id} className="border-t border-white/5">
                                      <td className="p-3 text-white">{user.referred_email}</td>
                                      <td className="p-3">
                                        {user.subscription_type === 'pro_sitter' ? (
                                          <span className="bg-[#64b3f4]/20 text-[#64b3f4] px-2 py-1 rounded text-xs">Sitter Pro ($9.99)</span>
                                        ) : (
                                          <span className="bg-[#c2e59c]/20 text-[#c2e59c] px-2 py-1 rounded text-xs">PRO Owner ($2.99)</span>
                                        )}
                                      </td>
                                      <td className="p-3">{new Date(user.subscription_date).toLocaleDateString()}</td>
                                      <td className="p-3 text-center">{user.active_months}</td>
                                      <td className="p-3">
                                        {user.cancelled ? (
                                          <div className="flex items-center gap-1 text-red-400">
                                            <XCircle size={14} />
                                            <span className="text-xs">Cancelled {new Date(user.cancelled_date).toLocaleDateString()}</span>
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-1 text-[#c2e59c]">
                                            <CheckCircle size={14} />
                                            <span className="text-xs">Active</span>
                                          </div>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {referrers.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-white/40">
                    No referrers created yet. Create one above to get started!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
