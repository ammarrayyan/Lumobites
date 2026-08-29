'use client';

import React, { useState, useEffect } from 'react';
import { Copy, Users, DollarSign, Activity, XCircle, CheckCircle, Trash2, QrCode, Clipboard, Check, Plus, AlertCircle, ArrowUpRight } from 'lucide-react';

interface AffiliatesManagementProps {
  adminKey: string;
  onUnauthorized: () => void;
}

export default function AffiliatesManagement({ adminKey, onUnauthorized }: AffiliatesManagementProps) {
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals / Action States
  const [rejectModalAffiliate, setRejectModalAffiliate] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  const [payModalAffiliate, setPayModalAffiliate] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isPaying, setIsPaying] = useState(false);

  const [deleteModalAffiliate, setDeleteModalAffiliate] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isApprovingId, setIsApprovingId] = useState<string | null>(null);

  const fetchAffiliates = async () => {
    try {
      const res = await fetch('/api/admin/affiliates', {
        headers: { 'x-admin-key': adminKey }
      });
      if (res.status === 401) return onUnauthorized();
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch affiliates.');
      setAffiliates(data.affiliates || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error loading affiliates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAffiliates();
  }, []);

  const handleApprove = async (id: string) => {
    setIsApprovingId(id);
    try {
      const res = await fetch('/api/admin/affiliates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey
        },
        body: JSON.stringify({ affiliateId: id, action: 'approve' })
      });
      if (res.status === 401) return onUnauthorized();
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to approve affiliate.');
      await fetchAffiliates();
    } catch (err: any) {
      alert(err.message || 'Error approving affiliate.');
    } finally {
      setIsApprovingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModalAffiliate) return;
    setIsRejecting(true);
    try {
      const res = await fetch('/api/admin/affiliates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey
        },
        body: JSON.stringify({
          affiliateId: rejectModalAffiliate.id,
          action: 'reject',
          reason: rejectionReason.trim() || null
        })
      });
      if (res.status === 401) return onUnauthorized();
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reject affiliate.');
      setRejectModalAffiliate(null);
      setRejectionReason('');
      await fetchAffiliates();
    } catch (err: any) {
      alert(err.message || 'Error rejecting affiliate.');
    } finally {
      setIsRejecting(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!payModalAffiliate || !paymentAmount) return;
    const amountNum = Number(paymentAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Please enter a valid positive payment amount.');
      return;
    }
    setIsPaying(true);
    try {
      const res = await fetch('/api/admin/affiliates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey
        },
        body: JSON.stringify({
          affiliateId: payModalAffiliate.id,
          action: 'mark-paid',
          amount: amountNum
        })
      });
      if (res.status === 401) return onUnauthorized();
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record payment.');
      setPayModalAffiliate(null);
      setPaymentAmount('');
      await fetchAffiliates();
    } catch (err: any) {
      alert(err.message || 'Error recording payment.');
    } finally {
      setIsPaying(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModalAffiliate) return;
    setIsDeleting(true);
    try {
      const res = await fetch('/api/admin/affiliates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey
        },
        body: JSON.stringify({
          affiliateId: deleteModalAffiliate.id,
          action: 'delete'
        })
      });
      if (res.status === 401) return onUnauthorized();
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete affiliate.');
      setDeleteModalAffiliate(null);
      await fetchAffiliates();
    } catch (err: any) {
      alert(err.message || 'Error deleting affiliate.');
    } finally {
      setIsDeleting(false);
    }
  };

  const copyToClipboard = (code: string) => {
    const url = `https://lumobites.net?ref=${code}`;
    navigator.clipboard.writeText(url);
    alert('Copied link: ' + url);
  };

  if (loading) return <div className="text-gray-500 text-center py-12">Loading affiliates data...</div>;
  if (error) return <div className="text-red-600 text-center py-12">Error: {error}</div>;

  // Process stats for summary
  const pendingCount = affiliates.filter(a => a.status === 'pending').length;
  const approvedCount = affiliates.filter(a => a.status === 'approved').length;
  const totalClicks = affiliates.reduce((sum, a) => sum + (a.stats?.clicks || 0), 0);
  const totalSubscribers = affiliates.reduce((sum, a) => sum + (a.stats?.activeSubscribers || 0), 0);
  const totalPaidOut = affiliates.reduce((sum, a) => sum + (Number(a.total_paid) || 0), 0);
  const totalOwed = affiliates.reduce((sum, a) => sum + (a.stats?.unpaidBalance || 0), 0);

  return (
    <div className="space-y-8 animate-fade-in text-[#191919]">
      
      {/* Top Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Activity size={48} className="text-blue-600" />
          </div>
          <p className="text-xs text-gray-500 mb-1">Affiliate Link Clicks</p>
          <p className="text-3xl font-bold text-[#191919]">{totalClicks}</p>
          <p className="text-[10px] text-gray-500 mt-1">{pendingCount} pending applications</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Users size={48} className="text-emerald-700" />
          </div>
          <p className="text-xs text-gray-500 mb-1">Active PRO Referrals</p>
          <p className="text-3xl font-bold text-emerald-700">{totalSubscribers}</p>
          <p className="text-[10px] text-gray-500 mt-1">{approvedCount} approved partners</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <DollarSign size={48} className="text-blue-600" />
          </div>
          <p className="text-xs text-gray-500 mb-1">Total Payouts Sent</p>
          <p className="text-3xl font-bold text-blue-600">${totalPaidOut.toFixed(2)}</p>
          <p className="text-[10px] text-gray-500 mt-1">Paid out via PayPal</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <AlertCircle size={48} className="text-amber-500" />
          </div>
          <p className="text-xs text-gray-500 mb-1">Remaining Balance Owed</p>
          <p className="text-3xl font-bold text-amber-600">${totalOwed.toFixed(2)}</p>
          <p className="text-[10px] text-gray-500 mt-1">Owed to all partners</p>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <div>
            <h3 className="text-lg font-bold text-[#191919]">Affiliate Partner Network</h3>
            <p className="text-xs text-gray-500 mt-0.5">Manage partner applications, view recurring clicks/subscribers, and issue PayPal payouts.</p>
          </div>
          {pendingCount > 0 && (
            <span className="bg-amber-500/20 border border-amber-500/30 text-amber-600 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full animate-pulse">
              ⚠️ {pendingCount} Pending Applications
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#555555]">
            <thead className="bg-gray-100 text-gray-500 font-bold uppercase text-[10px] tracking-wider border-b border-gray-200">
              <tr>
                <th className="p-4">Partner Details</th>
                <th className="p-4">Promo Methods / Bio</th>
                <th className="p-4 text-center">Clicks</th>
                <th className="p-4 text-center">Active Subs</th>
                <th className="p-4">Paid Out</th>
                <th className="p-4">Owed Balance</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {affiliates.map((affiliate: any) => (
                <tr key={affiliate.id} className="hover:bg-gray-50 transition-colors">
                  
                  {/* Name & PayPal details */}
                  <td className="p-4">
                    <div className="font-bold text-[#191919] mb-0.5">{affiliate.full_name}</div>
                    <div className="text-xs text-gray-500 font-medium mb-1.5">{affiliate.email}</div>
                    
                    {affiliate.paypal_email && (
                      <div className="text-[10px] bg-blue-500/10 text-blue-600 border border-blue-500/20 px-2 py-0.5 rounded inline-flex items-center gap-1 font-bold">
                        💳 PayPal: {affiliate.paypal_email}
                      </div>
                    )}
                  </td>

                  {/* Promotion details & Bio */}
                  <td className="p-4 max-w-[280px]">
                    {affiliate.promotion_method && (
                      <div className="text-xs text-[#191919] mb-1">
                        <strong className="text-gray-500">Promo:</strong> {affiliate.promotion_method}
                      </div>
                    )}
                    {affiliate.bio ? (
                      <div className="text-[11px] text-gray-500 italic leading-relaxed line-clamp-2">
                        &ldquo;{affiliate.bio}&rdquo;
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-500">No bio provided</span>
                    )}
                  </td>

                  {/* Clicks */}
                  <td className="p-4 text-center font-bold text-[#191919]">
                    {affiliate.status === 'approved' ? (affiliate.stats?.clicks || 0) : '-'}
                  </td>

                  {/* Active Referrals */}
                  <td className="p-4 text-center font-bold text-emerald-700">
                    {affiliate.status === 'approved' ? (affiliate.stats?.activeSubscribers || 0) : '-'}
                  </td>

                  {/* Paid */}
                  <td className="p-4 font-bold text-[#191919]">
                    ${(Number(affiliate.total_paid) || 0).toFixed(2)}
                  </td>

                  {/* Owed */}
                  <td className="p-4 font-bold">
                    {affiliate.status === 'approved' ? (
                      <span className={(affiliate.stats?.unpaidBalance || 0) > 0 ? 'text-amber-600' : 'text-gray-500'}>
                        ${(affiliate.stats?.unpaidBalance || 0).toFixed(2)}
                      </span>
                    ) : '-'}
                  </td>

                  {/* Status Badges */}
                  <td className="p-4">
                    {affiliate.status === 'pending' && (
                      <span className="bg-amber-500/10 border border-amber-500/30 text-amber-600 text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full">
                        Pending
                      </span>
                    )}
                    {affiliate.status === 'approved' && (
                      <div className="flex flex-col items-start gap-1">
                        <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full">
                          Approved
                        </span>
                        <div className="text-[9px] text-blue-600 font-bold flex items-center gap-1 mt-0.5">
                          code: {affiliate.referral_code}
                          <button onClick={() => copyToClipboard(affiliate.referral_code)} className="text-gray-500 hover:text-[#191919] transition-colors" title="Copy Promo Link">
                            <Copy size={10} />
                          </button>
                        </div>
                      </div>
                    )}
                    {affiliate.status === 'rejected' && (
                      <span className="bg-red-500/10 border border-red-500/30 text-red-600 text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full">
                        Rejected
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {affiliate.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(affiliate.id)}
                            disabled={isApprovingId === affiliate.id}
                            className="bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-bold px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 cursor-pointer flex items-center gap-0.5"
                          >
                            {isApprovingId === affiliate.id ? '...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => setRejectModalAffiliate(affiliate)}
                            className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-600 text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      
                      {affiliate.status === 'approved' && (affiliate.stats?.unpaidBalance || 0) >= 50 && (
                        <button
                          onClick={() => {
                            setPayModalAffiliate(affiliate);
                            setPaymentAmount((affiliate.stats?.unpaidBalance || 0).toFixed(2));
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-0.5"
                        >
                          <DollarSign size={12} /> Pay
                        </button>
                      )}

                      <button
                        onClick={() => setDeleteModalAffiliate(affiliate)}
                        className="text-gray-500 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-gray-50 cursor-pointer"
                        title="Delete Account"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {affiliates.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-gray-500">
                    No affiliates have registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Reason Modal */}
      {rejectModalAffiliate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/85 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 max-w-md w-full text-[#191919] shadow-2xl flex flex-col gap-5">
            <div>
              <h3 className="text-lg font-bold text-red-600 flex items-center gap-2">
                ⚠️ Reject Affiliate Application
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Enter a short feedback reason. We will send a polite email explaining the decision.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                Rejection Reason (Feedback for {rejectModalAffiliate.full_name})
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Your website/channel is not pet-focused. We look forward to reviewing you again later."
                rows={3}
                className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm text-[#191919] focus:outline-none focus:border-red-500 resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setRejectModalAffiliate(null);
                  setRejectionReason('');
                }}
                disabled={isRejecting}
                className="flex-1 bg-gray-50 hover:bg-gray-100 text-[#191919] font-bold py-2.5 rounded-xl text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={isRejecting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-[#191919] font-bold py-2.5 rounded-xl text-xs transition-colors disabled:opacity-50"
              >
                {isRejecting ? 'Rejecting...' : 'Reject Application'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pay Commission Modal */}
      {payModalAffiliate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/85 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 max-w-sm w-full text-[#191919] shadow-2xl flex flex-col gap-5">
            <div>
              <h3 className="text-lg font-bold text-emerald-600 flex items-center gap-1.5">
                💰 Issue Payout Record
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Record a PayPal transaction sent to this partner. This will deduct from their unpaid balance.
              </p>
            </div>

            <div className="bg-white/40 border border-gray-200 rounded-xl p-4 space-y-1.5 text-xs text-gray-500">
              <p>👤 <strong className="text-[#191919]">Partner:</strong> {payModalAffiliate.full_name}</p>
              <p>💳 <strong className="text-[#191919]">PayPal Address:</strong> {payModalAffiliate.paypal_email || 'Not provided'}</p>
              <p>⏳ <strong className="text-[#191919]">Current Balance Owed:</strong> <span className="text-amber-600 font-bold">${payModalAffiliate.stats?.unpaidBalance.toFixed(2)}</span></p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                Payment Amount ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder={payModalAffiliate.stats?.unpaidBalance.toFixed(2)}
                className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm text-[#191919] focus:outline-none focus:border-emerald-500 font-mono text-base"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setPayModalAffiliate(null);
                  setPaymentAmount('');
                }}
                disabled={isPaying}
                className="flex-1 bg-gray-50 hover:bg-gray-100 text-[#191919] font-bold py-2.5 rounded-xl text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkPaid}
                disabled={isPaying || !paymentAmount}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-black font-extrabold py-2.5 rounded-xl text-xs transition-colors disabled:opacity-50"
              >
                {isPaying ? 'Recording...' : 'Record Payout'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalAffiliate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/85 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white p-6 rounded-2xl border border-red-500/20 max-w-sm w-full text-[#191919] shadow-2xl flex flex-col gap-5">
            <div className="flex items-center gap-2 text-red-500">
              <Trash2 size={24} />
              <h3 className="text-lg font-bold">Delete Affiliate Account?</h3>
            </div>
            
            <p className="text-xs text-gray-500 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-[#191919]">{deleteModalAffiliate.full_name}</strong>'s affiliate account? 
              <br/><br/>
              If approved, this will also **permanently delete their unique referral code and referrer link stats**! This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModalAffiliate(null)}
                disabled={isDeleting}
                className="flex-1 bg-gray-50 hover:bg-gray-100 text-[#191919] font-bold py-2.5 rounded-xl text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-[#191919] font-bold py-2.5 rounded-xl text-xs transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
