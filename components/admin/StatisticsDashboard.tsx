'use client';

import React, { useState, useEffect } from 'react';
import { DollarSign, Star, Building2 } from 'lucide-react';

interface Stats {
  totalSitters: number;
  pendingSitters: number;
  approvedSitters: number;
  rejectedSitters: number;
  proOwners: number;
  proSitters: number;
  proMembersCount: number;
  partnerVetCount: number;
  partnerDaycareCount: number;
  partnerShelterCount: number;
  totalPartnersCount: number;
  unlimitedAdminCount: number;
  monthlyAiMemberRevenue: number;
  monthlyPartnerRevenue: number;
  totalMonthlyRevenue: number;
  newSignups: number;
  totalLostPets: number;
  activeLostPets: number;
  resolvedLostPets: number;
  weeklyLostPets: number;
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
    return <div className="text-gray-500 animate-pulse text-center py-12">Loading statistics...</div>;
  }

  if (!stats) {
    return <div className="text-red-600 text-center py-12">Error loading statistics.</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-6 text-[#191919] border-b border-gray-200 pb-4">
          Revenue & Subscription Overview
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/20 p-6 rounded-2xl border border-emerald-200 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-emerald-800 text-xs font-bold uppercase tracking-wider">Total Monthly MRR</span>
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-3xl font-extrabold text-emerald-700">
              ${(stats.totalMonthlyRevenue || 0).toFixed(2)}<span className="text-sm font-normal text-emerald-600">/mo</span>
            </div>
            <p className="text-xs text-emerald-700/80 mt-2">Combined partner subscriptions + AI memberships</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/20 p-6 rounded-2xl border border-purple-200 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-purple-800 text-xs font-bold uppercase tracking-wider">AI Membership MRR</span>
              <Star className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-3xl font-extrabold text-purple-700">
              ${(stats.monthlyAiMemberRevenue || 0).toFixed(2)}<span className="text-sm font-normal text-purple-600">/mo</span>
            </div>
            <p className="text-xs text-purple-700/80 mt-2">
              {stats.proMembersCount} active members ($4.99/mo)
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/20 p-6 rounded-2xl border border-blue-200 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-blue-800 text-xs font-bold uppercase tracking-wider">Partner Subscription MRR</span>
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-3xl font-extrabold text-blue-700">
              ${(stats.monthlyPartnerRevenue || 0).toFixed(2)}<span className="text-sm font-normal text-blue-600">/mo</span>
            </div>
            <p className="text-xs text-blue-700/80 mt-2">
              {stats.totalPartnersCount} active partners (Vet/Daycare/Shelter)
            </p>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-8">
          <h3 className="text-sm font-bold text-[#191919] uppercase tracking-wider mb-4">
            Pro Status Breakdown by Source
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200 text-center">
              <span className="text-xs text-gray-500 block mb-1">AI Members</span>
              <span className="text-2xl font-bold text-purple-600">{stats.proMembersCount}</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 text-center">
              <span className="text-xs text-gray-500 block mb-1">Vet Boarding ($40/mo)</span>
              <span className="text-2xl font-bold text-blue-600">{stats.partnerVetCount}</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 text-center">
              <span className="text-xs text-gray-500 block mb-1">Daycare ($30/mo)</span>
              <span className="text-2xl font-bold text-amber-600">{stats.partnerDaycareCount}</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 text-center">
              <span className="text-xs text-gray-500 block mb-1">Shelters ($20/mo)</span>
              <span className="text-2xl font-bold text-emerald-600">{stats.partnerShelterCount}</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 text-center">
              <span className="text-xs text-gray-500 block mb-1">Admin Unlimited</span>
              <span className="text-2xl font-bold text-gray-700">{stats.unlimitedAdminCount}</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-6 text-[#191919] border-b border-gray-200 pb-4">
          General Platform Statistics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 p-6 rounded-2xl border border-gray-200">
            <span className="text-gray-500 text-sm font-medium mb-2 block">Total Sitters</span>
            <span className="text-4xl font-bold text-blue-600">{stats.totalSitters}</span>
          </div>
          <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 p-6 rounded-2xl border border-gray-200">
            <span className="text-gray-500 text-sm font-medium mb-2 block">Pending Approval</span>
            <span className="text-4xl font-bold text-yellow-600">{stats.pendingSitters}</span>
          </div>
          <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 p-6 rounded-2xl border border-gray-200">
            <span className="text-gray-500 text-sm font-medium mb-2 block">Approved Sitters</span>
            <span className="text-4xl font-bold text-green-600">{stats.approvedSitters}</span>
          </div>
          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 p-6 rounded-2xl border border-gray-200">
            <span className="text-gray-500 text-sm font-medium mb-2 block">Active Pro Owners</span>
            <span className="text-4xl font-bold text-purple-600">{stats.proOwners}</span>
          </div>
          <div className="bg-gradient-to-br from-pink-500/10 to-pink-600/10 p-6 rounded-2xl border border-gray-200">
            <span className="text-gray-500 text-sm font-medium mb-2 block">Active Pro Sitters</span>
            <span className="text-4xl font-bold text-pink-600">{stats.proSitters}</span>
          </div>
          <div className="bg-gradient-to-br from-[#c2e59c]/20 to-[#64b3f4]/20 p-6 rounded-2xl border border-gray-200">
            <span className="text-gray-500 text-sm font-medium mb-2 block">New Signups (7d)</span>
            <span className="text-4xl font-bold text-emerald-700">{stats.newSignups}</span>
          </div>
          <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 p-6 rounded-2xl border border-gray-200">
            <span className="text-gray-500 text-sm font-medium mb-2 block">Total Lost Pets</span>
            <span className="text-4xl font-bold text-orange-600">{stats.totalLostPets}</span>
          </div>
          <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 p-6 rounded-2xl border border-gray-200">
            <span className="text-gray-500 text-sm font-medium mb-2 block">Active Lost Pets</span>
            <span className="text-4xl font-bold text-red-600">{stats.activeLostPets}</span>
          </div>
          <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 p-6 rounded-2xl border border-gray-200">
            <span className="text-gray-500 text-sm font-medium mb-2 block">Resolved Pets</span>
            <span className="text-4xl font-bold text-emerald-600">{stats.resolvedLostPets}</span>
          </div>
          <div className="bg-gradient-to-br from-indigo-500/10 to-indigo-600/10 p-6 rounded-2xl border border-gray-200">
            <span className="text-gray-500 text-sm font-medium mb-2 block">Lost Pets (7d)</span>
            <span className="text-4xl font-bold text-indigo-600">{stats.weeklyLostPets}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
