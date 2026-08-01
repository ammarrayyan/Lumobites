'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard, Clock, CheckCircle2, AlertTriangle, ShieldAlert,
  Edit3, Save, RefreshCw, Loader2, PauseCircle, PlayCircle, Zap,
  Building2, Stethoscope, Sparkles
} from 'lucide-react';

interface PartnerBillingManagementProps {
  adminKey: string;
}

export default function PartnerBillingManagement({ adminKey }: PartnerBillingManagementProps) {
  const [loading, setLoading] = useState(true);
  const [savingPricing, setSavingPricing] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [pricing, setPricing] = useState<Record<string, any>>({});
  const [partners, setPartners] = useState<any[]>([]);
  const [filterTab, setFilterTab] = useState<'all' | 'trialing' | 'active' | 'past_due' | 'canceled'>('all');
  const [search, setSearch] = useState('');
  const [priceForm, setPriceForm] = useState<Record<string, number>>({
    shelter: 20,
    pet_daycare: 30,
    vet_boarding: 40,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/partner-billing', {
        headers: { 'x-admin-key': adminKey },
      });
      if (res.ok) {
        const data = await res.json();
        setPricing(data.pricing || {});
        setPartners(data.partners || []);
        setPriceForm({
          shelter: data.pricing?.shelter?.monthly_price_usd || 20,
          pet_daycare: data.pricing?.pet_daycare?.monthly_price_usd || 30,
          vet_boarding: data.pricing?.vet_boarding?.monthly_price_usd || 40,
        });
      }
    } catch (err) {
      console.error('Failed to load partner billing data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminKey) fetchData();
  }, [adminKey]);

  // Handle Price Save
  const handleSavePrice = async (serviceType: string) => {
    setSavingPricing(serviceType);
    try {
      const res = await fetch('/api/admin/partner-billing', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey,
        },
        body: JSON.stringify({
          action: 'update_pricing',
          service_type: serviceType,
          monthly_price_usd: priceForm[serviceType],
        }),
      });
      if (res.ok) {
        alert(`Successfully updated monthly price for ${serviceType.replace('_', ' ')} to $${priceForm[serviceType]}/mo!`);
        fetchData();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to update pricing');
      }
    } catch (err) {
      alert('Error updating pricing');
    } finally {
      setSavingPricing(null);
    }
  };

  // Handle Action Mutation (Extend Trial, Test Expiry, Toggle Pause)
  const handlePartnerAction = async (partnerId: string, partnerType: string, actionName: string, payload: any = {}) => {
    setActionLoading(`${partnerId}-${actionName}`);
    try {
      const res = await fetch('/api/admin/partner-billing', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey,
        },
        body: JSON.stringify({
          action: actionName,
          partner_id: partnerId,
          partner_type: partnerType,
          ...payload,
        }),
      });
      if (res.ok) {
        fetchData();
      } else {
        const d = await res.json();
        alert(d.error || 'Action failed');
      }
    } catch (err) {
      alert('Failed to execute action');
    } finally {
      setActionLoading(null);
    }
  };

  // Filter Logic
  const filteredPartners = partners.filter(p => {
    const matchesSearch =
      p.business_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.email?.toLowerCase().includes(search.toLowerCase()) ||
      p.stripe_subscription_id?.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filterTab === 'all') return true;
    if (filterTab === 'trialing') return p.subscription_status === 'trialing';
    if (filterTab === 'active') return p.subscription_status === 'active' && !p.is_paused;
    if (filterTab === 'past_due') return p.subscription_status === 'past_due';
    if (filterTab === 'canceled') return p.subscription_status === 'canceled' || p.is_paused || p.status === 'paused';
    return true;
  });

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#E8DDD4] shadow-xs">
        <div>
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-[#8B5E3C]" /> Partner Billing & Subscriptions
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Manage pricing tiers, track partner subscription statuses, extend free trials, and force-test trial expirations.
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Data
        </button>
      </div>

      {/* PRICING SETTINGS EDITOR */}
      <div className="bg-gradient-to-br from-amber-50/50 to-orange-50/50 rounded-3xl p-6 border border-amber-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" /> Configurable Pricing Tiers
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Price changes take effect immediately for new subscriptions. Existing subscribers remain locked into their active billing cycle.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { key: 'shelter', label: 'Shelter / Adoption', defaultPrice: 20, icon: Building2, color: 'text-amber-700 bg-amber-100' },
            { key: 'pet_daycare', label: 'Pet Daycare', defaultPrice: 30, icon: Sparkles, color: 'text-emerald-700 bg-emerald-100' },
            { key: 'vet_boarding', label: 'Vet Boarding', defaultPrice: 40, icon: Stethoscope, color: 'text-blue-700 bg-blue-100' },
          ].map(tier => {
            const Icon = tier.icon;
            const currentVal = priceForm[tier.key] ?? tier.defaultPrice;
            const isSaving = savingPricing === tier.key;

            return (
              <div key={tier.key} className="bg-white rounded-2xl p-4 border border-amber-100 shadow-xs flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <Icon className="w-4 h-4 text-[#8B5E3C]" /> {tier.label}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${tier.color}`}>
                    ${currentVal}/mo
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">$</span>
                    <input
                      type="number"
                      min="1"
                      value={currentVal}
                      onChange={e => setPriceForm(prev => ({ ...prev, [tier.key]: Number(e.target.value) }))}
                      className="w-full pl-7 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]"
                    />
                  </div>
                  <button
                    onClick={() => handleSavePrice(tier.key)}
                    disabled={isSaving}
                    className="bg-[#8B5E3C] hover:bg-[#724C2F] text-white text-xs font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Save
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PARTNER ACCOUNTS TABLE CONTAINER */}
      <div className="bg-white rounded-3xl border border-[#E8DDD4] shadow-xs overflow-hidden">
        {/* TABLE CONTROLS BAR */}
        <div className="p-5 border-b border-[#E8DDD4] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gray-50/50">
          {/* Filter Tabs */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-gray-200 overflow-x-auto w-full md:w-auto">
            {[
              { id: 'all', label: `All (${partners.length})` },
              { id: 'trialing', label: `Trialing (${partners.filter(p => p.subscription_status === 'trialing').length})` },
              { id: 'active', label: `Active Paid (${partners.filter(p => p.subscription_status === 'active' && !p.is_paused).length})` },
              { id: 'past_due', label: `Past Due (${partners.filter(p => p.subscription_status === 'past_due').length})` },
              { id: 'canceled', label: `Canceled / Paused (${partners.filter(p => p.subscription_status === 'canceled' || p.is_paused).length})` },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border-none ${
                  filterTab === tab.id
                    ? 'bg-[#8B5E3C] text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Search by business name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full md:w-64 px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]"
          />
        </div>

        {/* UNIFIED PARTNER TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100/70 border-b border-[#E8DDD4] text-[11px] font-black text-gray-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Partner Business</th>
                <th className="py-3.5 px-4">Service Type</th>
                <th className="py-3.5 px-4">Subscription Status</th>
                <th className="py-3.5 px-4">Trial / Billing Cycle</th>
                <th className="py-3.5 px-4">Stripe Sub ID</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400 font-bold">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#8B5E3C]" /> Loading partner billing details...
                  </td>
                </tr>
              ) : filteredPartners.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400 font-bold">
                    No partner accounts found matching selected criteria.
                  </td>
                </tr>
              ) : (
                filteredPartners.map(p => {
                  let daysLeft = 0;
                  if (p.trial_end) {
                    const diff = new Date(p.trial_end).getTime() - new Date().getTime();
                    daysLeft = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
                  }

                  const isTrialing = p.subscription_status === 'trialing';
                  const isActivePaid = p.subscription_status === 'active' && !p.is_paused;
                  const isPastDue = p.subscription_status === 'past_due';
                  const isPaused = p.is_paused || p.status === 'paused';

                  return (
                    <tr key={`${p.partner_type}-${p.id}`} className="hover:bg-amber-50/20 transition-colors">
                      {/* 1. Business Name & Email */}
                      <td className="py-4 px-4">
                        <div className="font-extrabold text-gray-900">{p.business_name}</div>
                        <div className="text-[11px] text-gray-500 font-medium">{p.email}</div>
                      </td>

                      {/* 2. Service Type */}
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1 font-bold text-[11px] px-2.5 py-1 rounded-lg uppercase ${
                          p.partner_type === 'shelter' ? 'bg-amber-100 text-amber-800' :
                          p.partner_type === 'pet_daycare' ? 'bg-emerald-100 text-emerald-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {p.partner_type.replace('_', ' ')}
                        </span>
                      </td>

                      {/* 3. Status Badge */}
                      <td className="py-4 px-4">
                        {isActivePaid ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" /> Active Paid
                          </span>
                        ) : isPastDue ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full">
                            <ShieldAlert className="w-3 h-3" /> Past Due
                          </span>
                        ) : isPaused ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full">
                            <AlertTriangle className="w-3 h-3" /> Paused / Expired
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                            <Clock className="w-3 h-3" /> Trialing
                          </span>
                        )}
                      </td>

                      {/* 4. Trial / Billing Cycle */}
                      <td className="py-4 px-4">
                        {isActivePaid ? (
                          <span className="text-gray-700 font-semibold">
                            Renews: {p.current_period_end ? new Date(p.current_period_end).toLocaleDateString() : 'Active'}
                          </span>
                        ) : isTrialing ? (
                          <span className="text-blue-700 font-bold">
                            {daysLeft} Days Left ({p.trial_end ? new Date(p.trial_end).toLocaleDateString() : 'N/A'})
                          </span>
                        ) : (
                          <span className="text-gray-400 font-semibold">Trial Expired</span>
                        )}
                      </td>

                      {/* 5. Stripe Subscription ID */}
                      <td className="py-4 px-4 text-gray-500 font-mono text-[11px]">
                        {p.stripe_subscription_id ? (
                          <span title={p.stripe_subscription_id}>
                            {p.stripe_subscription_id.slice(0, 14)}…
                          </span>
                        ) : (
                          <span className="text-gray-300">No Subscription</span>
                        )}
                      </td>

                      {/* 6. Action Controls */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* Extend Trial Controls */}
                          <select
                            defaultValue=""
                            disabled={actionLoading === `${p.id}-extend_trial`}
                            onChange={e => {
                              if (e.target.value) {
                                handlePartnerAction(p.id, p.partner_type, 'extend_trial', { days_to_add: Number(e.target.value) });
                                e.target.value = '';
                              }
                            }}
                            className="bg-white border border-gray-200 hover:border-gray-300 rounded-lg px-2 py-1 text-[11px] font-bold text-gray-700 cursor-pointer"
                          >
                            <option value="" disabled>+ Extend Trial</option>
                            <option value="7">+7 Days</option>
                            <option value="14">+14 Days</option>
                            <option value="30">+30 Days</option>
                          </select>

                          {/* Test Expiry Button */}
                          <button
                            onClick={() => {
                              if (confirm(`Force test trial expiry now for ${p.business_name}? This will immediately set trial_end to the past and pause the listing.`)) {
                                handlePartnerAction(p.id, p.partner_type, 'test_expiry');
                              }
                            }}
                            disabled={actionLoading === `${p.id}-test_expiry`}
                            className="bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 px-2 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                            title="Force trial expiry immediately for testing"
                          >
                            <Zap className="w-3 h-3" /> Test Expiry
                          </button>

                          {/* Pause / Unpause Toggle */}
                          <button
                            onClick={() => handlePartnerAction(p.id, p.partner_type, 'toggle_pause', { is_paused: !isPaused })}
                            disabled={actionLoading === `${p.id}-toggle_pause`}
                            className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer border ${
                              isPaused
                                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                                : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border-gray-200'
                            }`}
                          >
                            {isPaused ? <PlayCircle className="w-3 h-3" /> : <PauseCircle className="w-3 h-3" />}
                            {isPaused ? 'Unpause' : 'Pause'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
