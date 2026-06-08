'use client';

import React, { useState, useEffect } from 'react';

export default function AccountManagement({ adminKey, onUnauthorized }: { adminKey: string, onUnauthorized: () => void }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`Are you sure you want to permanently delete the account for ${email}? This action cannot be undone.`)) {
      return;
    }

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
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete user');
      }

      setUsers(users.filter(u => u.id !== id));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeletingId(null);
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
              <th className="px-4 py-3">PRO Status</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3 rounded-tr-lg text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">No accounts found matching "{search}"</td>
              </tr>
            ) : (
              filteredUsers.map(user => (
                <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-[#191919]">{user.email}</td>
                  <td className="px-4 py-3">
                    {user.is_pro ? (
                      <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-600 text-xs font-bold">PRO</span>
                    ) : (
                      <span className="px-2 py-1 rounded bg-gray-100 text-gray-500 text-xs font-medium">Free</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{new Date(user.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(user.id, user.email)}
                      disabled={deletingId === user.id}
                      className="text-red-600 hover:text-red-300 font-medium disabled:opacity-50 transition-colors"
                    >
                      {deletingId === user.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
