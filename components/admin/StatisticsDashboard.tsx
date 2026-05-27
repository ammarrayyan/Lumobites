'use client';

import React, { useState, useEffect } from 'react';

interface Stats {
  totalSitters: number;
  pendingSitters: number;
  approvedSitters: number;
  rejectedSitters: number;
  proOwners: number;
  proSitters: number;
  newSignups: number;
}

export default function StatisticsDashboard({ adminKey, onUnauthorized }: { adminKey: string, onUnauthorized: () => void }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { 'x-admin-key': adminKey }
      });
      if (res.status === 401) {
        onUnauthorized();
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch stats');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-white/60 animate-pulse text-center py-12">Loading statistics...</div>;
  }

  if (!stats) {
    return <div className="text-red-400 text-center py-12">Error loading statistics.</div>;
  }

  const statCards = [
    { label: 'Total Sitters', value: stats.totalSitters, color: 'from-blue-500/20 to-blue-600/20 text-blue-400' },
    { label: 'Pending Approval', value: stats.pendingSitters, color: 'from-yellow-500/20 to-yellow-600/20 text-yellow-400' },
    { label: 'Approved', value: stats.approvedSitters, color: 'from-green-500/20 to-green-600/20 text-green-400' },
    { label: 'Rejected', value: stats.rejectedSitters, color: 'from-red-500/20 to-red-600/20 text-red-400' },
    { label: 'PRO Owners', value: stats.proOwners, color: 'from-purple-500/20 to-purple-600/20 text-purple-400' },
    { label: 'PRO Sitters', value: stats.proSitters, color: 'from-pink-500/20 to-pink-600/20 text-pink-400' },
    { label: 'New Signups (7d)', value: stats.newSignups, color: 'from-[#c2e59c]/20 to-[#64b3f4]/20 text-[#c2e59c]' },
  ];

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6 text-white border-b border-white/10 pb-4">Platform Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {statCards.map((card, idx) => (
          <div key={idx} className={`bg-gradient-to-br ${card.color.split(' ').slice(0, 2).join(' ')} p-6 rounded-2xl border border-white/5 flex flex-col items-start justify-center`}>
            <span className="text-white/60 text-sm font-medium mb-2">{card.label}</span>
            <span className={`text-4xl font-bold ${card.color.split(' ').pop()}`}>{card.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
