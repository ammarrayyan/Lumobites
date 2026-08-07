'use client';

import React, { useState, useEffect } from 'react';

export default function AccountManagement({ adminKey, onUnauthorized }: { adminKey: string, onUnauthorized: () => void }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [signingOutEmail, setSigningOutEmail] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users', {
        headers: { 'x-admin-key': adminKey }
      });
      if (res.status === 401) {
        onUnauthorized();
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, email: string, isPro?: boolean, subStatus?: string) => {
    let warningMsg = `Are you sure you want to delete account ${email}?`;
    if (isPro) {
      warningMsg = `⚠️ WARNING: Account ${email} has an active paid subscription (${subStatus || 'Active'}). Deleting this account will IMMEDIATELY cancel their active Stripe subscription and permanently delete all database rows.\n\nAre you sure you want to proceed?`;
    }

    if (!confirm(warningMsg)) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/users?id=${id}&email=${encodeURIComponent(email)}`, {
        method: 'DELETE',
        headers: { 'x-admin-key': adminKey }
      });
      if (res.status === 401) {
        onUnauthorized();
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete user');
      }

      if (data.canceledStripeSubs && data.canceledStripeSubs > 0) {
        alert(`Account ${email} deleted successfully. ${data.canceledStripeSubs} active Stripe subscription(s) were canceled.`);
      }

      setUsers(users.filter(u => u.id !== id));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleForceSignOut = async (email: string) => {
    const confirmed = window.confirm(`Are you sure you want to force sign out all sessions for ${email}?`);
    if (!confirmed) return;

    setSigningOutEmail(email);
    try {
      const res = await fetch('/api/admin/force-signout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey
        },
        body: JSON.stringify({ email, target: 'owner' })
      });

      if (res.status === 401) {
        onUnauthorized();
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to force sign out');
      }

      alert('User has been signed out from all devices.');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSigningOutEmail(null);
    }
  };

  const filteredUsers = users.filter(u => u.email.toLowerCase().includes(search.toLowerCase()));

  if (loading) {
    return <div className="text-gray-500 animate-pulse text-center py-12">Loading accounts...</div>;
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-gray-200 pb-4">
        <h2 className="text-xl font-semibold text-[#191919]">All Accounts ({users.length})</h2>
        <input
          type="text"
          placeholder="Search by email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-64 bg-white border border-gray-200 rounded-lg p-2 text-[#191919] focus:outline-none focus:border-[#64b3f4] transition-colors text-sm"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-[#555555]">
          <thead className="text-xs uppercase bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-3 rounded-tl-lg">Email</th>
              <th className="px-4 py-3">Pro Source</th>
              <th className="px-4 py-3">Subscription Status</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3 rounded-tr-lg text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">No accounts found matching "{search}"</td>
              </tr>
            ) : (
              filteredUsers.map(user => {
                const proSource = user.proSource || (user.is_pro ? 'ai_member' : 'none');
                let badgeLabel = 'Free (2 Lifetime Max)';
                let badgeClass = 'bg-gray-100 text-gray-600';

                if (proSource === 'unlimited') {
                  badgeLabel = '⚡ Unlimited (Admin)';
                  badgeClass = 'bg-purple-100 text-purple-700 font-bold';
                } else if (proSource === 'partner_vet') {
                  badgeLabel = '🏥 Vet Boarding Partner';
                  badgeClass = 'bg-blue-100 text-blue-700 font-bold';
                } else if (proSource === 'partner_daycare') {
                  badgeLabel = '🎾 Daycare Partner';
                  badgeClass = 'bg-amber-100 text-amber-700 font-bold';
                } else if (proSource === 'partner_shelter') {
                  badgeLabel = '🐾 Shelter Partner';
                  badgeClass = 'bg-emerald-100 text-emerald-700 font-bold';
                } else if (proSource === 'ai_member') {
                  badgeLabel = '⭐ Member ($4.99/mo)';
                  badgeClass = 'bg-purple-100 text-purple-700 font-bold';
                }

                return (
                  <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-[#191919]">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs ${badgeClass}`}>
                        {badgeLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {user.rawSubscriptionStatus === 'past_due' ? (
                        <span className="px-2.5 py-1 rounded-full text-xs bg-red-100 text-red-700 font-bold border border-red-300 animate-pulse inline-flex items-center gap-1">
                          {user.subStatus}
                        </span>
                      ) : user.rawSubscriptionStatus === 'active' ? (
                        <span className="px-2.5 py-1 rounded-full text-xs bg-emerald-100 text-emerald-800 font-semibold">
                          {user.subStatus}
                        </span>
                      ) : user.rawSubscriptionStatus === 'trialing' ? (
                        <span className="px-2.5 py-1 rounded-full text-xs bg-blue-100 text-blue-800 font-semibold">
                          {user.subStatus}
                        </span>
                      ) : user.rawSubscriptionStatus === 'canceled' ? (
                        <span className="px-2.5 py-1 rounded-full text-xs bg-gray-100 text-gray-500 font-medium">
                          {user.subStatus}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 font-normal">
                          {user.subStatus || 'N/A'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs">{new Date(user.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleForceSignOut(user.email)}
                        disabled={signingOutEmail === user.email}
                        className="text-amber-600 hover:text-amber-700 font-medium text-xs disabled:opacity-50 transition-colors mr-4"
                      >
                        {signingOutEmail === user.email ? 'Signing Out...' : 'Force Sign Out'}
                      </button>
                      <button
                        onClick={() => handleDelete(user.id, user.email, user.is_pro, user.subStatus)}
                        disabled={deletingId === user.id}
                        className="text-red-600 hover:text-red-700 font-medium text-xs disabled:opacity-50 transition-colors"
                      >
                        {deletingId === user.id ? 'Deleting...' : 'Delete'}
                      </button>
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
