'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Copy, Plus, Users, DollarSign, Activity, XCircle, CheckCircle, ChevronDown, ChevronUp, QrCode, Download, Share2, Trash2 } from 'lucide-react';
import QRCode from 'qrcode';

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
  const [qrModalReferrer, setQrModalReferrer] = useState<any>(null);
  const [deleteModalReferrer, setDeleteModalReferrer] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (qrModalReferrer && qrCanvasRef.current) {
      const url = `https://lumobites.net?ref=${qrModalReferrer.code}`;
      QRCode.toCanvas(qrCanvasRef.current, url, {
        width: 250,
        margin: 2,
        color: {
          dark: '#3B2410',
          light: '#FFF9F2' // Cream color
        }
      }, (error) => {
        if (error) console.error(error);
        const canvas = qrCanvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          const img = new window.Image();
          // We can use the existing logo
          img.src = '/Logo.png'; 
          img.onload = () => {
            const size = 60;
            const x = (canvas.width - size) / 2;
            const y = (canvas.height - size) / 2;
            
            // Draw white background circle for the logo
            ctx.fillStyle = '#FFF9F2';
            ctx.beginPath();
            ctx.arc(canvas.width/2, canvas.height/2, size/1.8, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.drawImage(img, x, y, size, size);
          };
        }
      });
    }
  }, [qrModalReferrer]);

  const handleDownloadQR = () => {
    if (!qrCanvasRef.current || !qrModalReferrer) return;
    const url = qrCanvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `LumoBites-QR-${qrModalReferrer.name.replace(/\s+/g, '-')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

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

  const handleDeleteReferrer = async () => {
    if (!deleteModalReferrer) return;
    setIsDeleting(true);
    try {
      const res = await fetch('/api/admin/referrals/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminKey}`
        },
        body: JSON.stringify({ id: deleteModalReferrer.id })
      });
      if (res.status === 401) return onUnauthorized();
      if (res.ok) {
        setDeleteModalReferrer(null);
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const copyToClipboard = (code: string) => {
    const url = `https://lumobites.net?ref=${code}`;
    navigator.clipboard.writeText(url);
    alert('Copied to clipboard: ' + url);
  };

  if (loading) return <div className="text-gray-500 text-center py-12">Loading referrals data...</div>;
  if (!data) return <div className="text-red-600 text-center py-12">Error loading data.</div>;

  const { stats, referrers } = data;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Activity size={48} />
          </div>
          <p className="text-sm text-gray-500 mb-1">Total Link Clicks</p>
          <p className="text-3xl font-bold text-[#191919]">{stats.totalClicks}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Users size={48} />
          </div>
          <p className="text-sm text-gray-500 mb-1">Total Subscribers</p>
          <p className="text-3xl font-bold text-emerald-700">{stats.totalSubscribers}</p>
          <p className="text-xs text-gray-500 mt-1">{stats.totalActive} active</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <DollarSign size={48} />
          </div>
          <p className="text-sm text-gray-500 mb-1">Monthly Revenue</p>
          <p className="text-3xl font-bold text-blue-600">${stats.totalMonthlyRevenue.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">From active referrals</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <XCircle size={48} />
          </div>
          <p className="text-sm text-gray-500 mb-1">Total Cancelled</p>
          <p className="text-3xl font-bold text-red-600">{stats.totalCancelled}</p>
        </div>
      </div>

      {/* Create Referrer */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200">
        <h3 className="text-lg font-bold text-[#191919] mb-4">Create New Referrer</h3>
        <form onSubmit={handleCreateReferrer} className="flex gap-4">
          <input
            type="text"
            value={newReferrerName}
            onChange={(e) => setNewReferrerName(e.target.value)}
            placeholder="e.g. Omar"
            className="flex-1 bg-white border border-gray-200 rounded-xl p-3 text-[#191919] focus:outline-none focus:border-[#c2e59c]"
            disabled={creating}
          />
          <button
            type="submit"
            disabled={creating || !newReferrerName.trim()}
            className="bg-[#8B5E3C] hover:bg-[#734A2E] text-white font-bold py-3 px-6 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            <Plus size={18} />
            {creating ? 'Creating...' : 'Create Link'}
          </button>
        </form>
      </div>

      {/* Referrers Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-[#191919]">Referrers Directory</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#555555]">
            <thead className="bg-gray-100 text-gray-500">
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
                  <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors group">
                    <td className="p-4">
                      <div className="font-bold text-[#191919] mb-1">{referrer.name}</div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-blue-600 truncate max-w-[200px]">lumobites.net?ref={referrer.code}</span>
                        <button onClick={() => copyToClipboard(referrer.code)} className="text-gray-500 hover:text-[#191919] transition-colors" title="Copy Link">
                          <Copy size={14} />
                        </button>
                        <button onClick={() => setQrModalReferrer(referrer)} className="bg-[#3B2410] text-[#FFF9F2] px-2 py-1 rounded-md text-[10px] flex items-center gap-1 hover:bg-[#4a2e15] transition-colors" title="Show QR Code">
                          <QrCode size={12} /> QR
                        </button>
                        <button onClick={() => setDeleteModalReferrer(referrer)} className="text-red-600 hover:text-red-300 transition-colors ml-1" title="Delete Referrer">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                    <td className="p-4 text-center">{referrer.stats.clicks}</td>
                    <td className="p-4 text-center font-medium text-emerald-700">{referrer.stats.subscribersCount}</td>
                    <td className="p-4 text-center">{referrer.stats.activeCount}</td>
                    <td className="p-4 text-center text-red-600">{referrer.stats.cancelledCount}</td>
                    <td className="p-4 font-bold text-[#191919]">
                      ${referrer.stats.totalValue.toFixed(2)}/mo
                      <div className="text-[10px] text-gray-500 font-normal mt-1">
                        {referrer.stats.breakdown.proOwners.count} PRO, {referrer.stats.breakdown.sitterPro.count} Sitter
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setExpandedRow(expandedRow === referrer.id ? null : referrer.id)}
                        className="text-gray-500 hover:text-[#191919] transition-colors"
                      >
                        {expandedRow === referrer.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                    </td>
                  </tr>
                  
                  {/* Expanded Row Details */}
                  {expandedRow === referrer.id && (
                    <tr>
                      <td colSpan={7} className="p-0 border-b border-gray-200">
                        <div className="bg-white/30 p-6">
                          <h4 className="text-[#191919] font-medium mb-4 flex items-center gap-2">
                            <Users size={16} className="text-emerald-700" />
                            Referred Users for {referrer.name}
                          </h4>
                          {referrer.users.filter((u:any) => u.subscribed).length === 0 ? (
                            <p className="text-gray-500 text-sm">No active or cancelled subscribers yet. ({referrer.stats.clicks} clicks only)</p>
                          ) : (
                            <div className="bg-[#FDFAF7] rounded-xl border border-gray-200 overflow-hidden">
                              <table className="w-full text-left text-sm text-[#555555]">
                                <thead className="bg-gray-50 text-gray-500 text-xs">
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
                                    <tr key={user.id} className="border-t border-gray-200">
                                      <td className="p-3 text-[#191919]">{user.referred_email}</td>
                                      <td className="p-3">
                                        {user.subscription_type === 'pro_sitter' ? (
                                          <span className="bg-[#64b3f4]/20 text-blue-600 px-2 py-1 rounded text-xs">Sitter Pro</span>
                                        ) : (
                                          <span className="bg-[#c2e59c]/20 text-emerald-700 px-2 py-1 rounded text-xs">PRO Owner ($2.99)</span>
                                        )}
                                      </td>
                                      <td className="p-3">{new Date(user.subscription_date).toLocaleDateString()}</td>
                                      <td className="p-3 text-center">{user.active_months}</td>
                                      <td className="p-3">
                                        {user.cancelled ? (
                                          <div className="flex items-center gap-1 text-red-600">
                                            <XCircle size={14} />
                                            <span className="text-xs">Cancelled {new Date(user.cancelled_date).toLocaleDateString()}</span>
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-1 text-emerald-700">
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
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    No referrers created yet. Create one above to get started!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Code Modal */}
      {qrModalReferrer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#FFF9F2] p-8 rounded-3xl max-w-sm w-full flex flex-col items-center relative text-[#3B2410] shadow-2xl">
            <button 
              onClick={() => setQrModalReferrer(null)}
              className="absolute top-4 right-4 text-[#3B2410]/50 hover:text-[#3B2410]"
            >
              <XCircle size={24} />
            </button>
            
            <h3 className="text-xl font-bold mb-6 text-center">Referral QR Code</h3>
            
            <div className="bg-white p-4 rounded-2xl shadow-sm mb-4 border border-[#3B2410]/10">
              <canvas ref={qrCanvasRef} className="rounded-xl w-[250px] h-[250px] mx-auto"></canvas>
            </div>
            
            <p className="font-bold text-lg mb-1">{qrModalReferrer.name}</p>
            <p className="text-sm opacity-70 mb-8 font-medium">lumobites.net?ref={qrModalReferrer.code}</p>
            
            <div className="w-full flex gap-3">
              <button
                onClick={handleDownloadQR}
                className="flex-1 bg-[#3B2410] text-[#FFF9F2] py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#4a2e15] transition-colors shadow-md"
              >
                <Download size={18} /> Download
              </button>
              <button
                onClick={() => copyToClipboard(qrModalReferrer.code)}
                className="flex-1 bg-white border-2 border-[#3B2410] text-[#3B2410] py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#f5ece1] transition-colors shadow-md"
              >
                <Share2 size={18} /> Copy Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalReferrer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white p-8 rounded-3xl max-w-sm w-full flex flex-col relative text-[#191919] shadow-2xl border border-red-500/20">
            <div className="flex items-center gap-3 mb-4 text-red-600">
              <Trash2 size={28} />
              <h3 className="text-xl font-bold">Delete Referrer</h3>
            </div>
            
            <p className="text-[#555555] mb-8 leading-relaxed">
              Are you sure you want to delete <strong className="text-[#191919]">{deleteModalReferrer.name}</strong>'s referral link? This will also permanently delete all their referral tracking data.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModalReferrer(null)}
                className="flex-1 bg-gray-100 text-[#191919] py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteReferrer}
                disabled={isDeleting}
                className="flex-1 bg-red-500/20 text-red-600 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-500/30 transition-colors border border-red-500/50 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
