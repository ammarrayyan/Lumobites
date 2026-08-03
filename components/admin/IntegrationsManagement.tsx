'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw, CheckCircle2, XCircle, AlertCircle, AlertTriangle,
  CreditCard, Mail, Phone, Brain, Database, Map, Flame,
} from 'lucide-react';

interface IntegrationsManagementProps {
  adminKey: string;
  onUnauthorized?: () => void;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface BaseStatus {
  configured: boolean;
  status: 'Connected' | 'Not Configured' | 'Error';
  error?: string | null;
}

interface LegacyResponse {
  rescuegroups: BaseStatus & { lastChecked: string };
  amazon: BaseStatus & { lastChecked: string };
}

interface ExtendedResponse {
  lastChecked: string;
  stripe: BaseStatus & { mode?: string; availableBalance?: string; currency?: string };
  resend: BaseStatus & { domainCount?: number; primaryDomain?: string; primaryVerified?: boolean; sendOnly?: boolean };
  twilio: BaseStatus & { accountName?: string; accountStatus?: string; verifyConfigured?: boolean; verifyActive?: boolean | null; verifyName?: string | null };
  anthropic: BaseStatus & { model?: string; stopReason?: string };
  supabase: BaseStatus & { emailRowCount?: number; latencyMs?: number };
  google: BaseStatus & { keyType?: string; validAIzaKey?: boolean; apiStatus?: string };
  firebase: BaseStatus & { projectId?: string | null; initialized?: boolean; vapidKeySet?: boolean; privateKeySet?: boolean; clientEmailSet?: boolean };
}


interface RecallsStatus {
  status: 'Connected' | 'Error' | 'Loading' | 'Idle';
  liveCount: number;
  totalAnimalVet?: number;
  lastChecked: string | null;
  error?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatusIcon({ status }: { status: string }) {
  if (status === 'Connected') return <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />;
  if (status === 'Error') return <XCircle className="w-5 h-5 text-red-500 shrink-0" />;
  return <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0" />;
}

function StatusBadge({ status }: { status: string }) {
  const color =
    status === 'Connected' ? 'text-green-700 bg-green-50 border-green-200' :
    status === 'Error' ? 'text-red-700 bg-red-50 border-red-200' :
    'text-yellow-700 bg-yellow-50 border-yellow-200';
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${color}`}>
      {status}
    </span>
  );
}

function Row({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex justify-between items-start text-sm gap-2">
      <span className="text-gray-500 shrink-0">{label}:</span>
      <span className={`font-medium text-right ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  );
}

function ErrorBox({ error }: { error: string }) {
  return (
    <div className="mt-3 p-3 bg-red-50 rounded-lg text-xs text-red-600 break-words border border-red-100">
      <span className="font-bold block mb-1">Error:</span>
      {error}
    </div>
  );
}

function ts(iso: string | null | undefined) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }
  catch { return iso ?? '—'; }
}

// ─── Card shell ───────────────────────────────────────────────────────────────

function Card({
  icon: Icon,
  title,
  subtitle,
  status,
  onRefresh,
  refreshing,
  children,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  status?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col gap-0">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-gray-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm leading-tight">{title}</h3>
            {subtitle && <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {status && <StatusIcon status={status} />}
      </div>

      {/* Content */}
      <div className="space-y-2.5 flex-1">
        {children}
      </div>

      {/* Per-card refresh */}
      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="mt-5 w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#FAF6F4] text-[#8B5E3C] border border-[#E8DDD4] rounded-lg text-xs font-bold hover:bg-white transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Checking…' : 'Refresh Now'}
        </button>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function IntegrationsManagement({ adminKey, onUnauthorized }: IntegrationsManagementProps) {
  const [legacy, setLegacy] = useState<LegacyResponse | null>(null);
  const [extended, setExtended] = useState<ExtendedResponse | null>(null);
  const [recalls, setRecalls] = useState<RecallsStatus>({ status: 'Idle', liveCount: 0, lastChecked: null });

  const [loadingLegacy, setLoadingLegacy] = useState(false);
  const [loadingExtended, setLoadingExtended] = useState(false);
  const [loadingRecalls, setLoadingRecalls] = useState(false);
  const [globalError, setGlobalError] = useState('');

  const headers = { 'x-admin-key': adminKey };

  const fetchLegacy = useCallback(async () => {
    setLoadingLegacy(true);
    try {
      const res = await fetch('/api/admin/integrations-status', { headers });
      if (res.status === 401) { onUnauthorized?.(); return; }
      const data = await res.json();
      if (data.error) setGlobalError(data.error);
      else setLegacy(data);
    } catch (e: any) { setGlobalError(e.message); }
    setLoadingLegacy(false);
  }, [adminKey]);

  const fetchExtended = useCallback(async () => {
    setLoadingExtended(true);
    try {
      const res = await fetch('/api/admin/integrations-extended', { headers });
      if (res.status === 401) { onUnauthorized?.(); return; }
      const data = await res.json();
      setExtended(data);
    } catch (e: any) { setGlobalError(e.message); }
    setLoadingExtended(false);
  }, [adminKey]);

  const fetchRecalls = useCallback(async () => {
    setLoadingRecalls(true);
    try {
      const res = await fetch('/api/admin/recalls-status', { headers });
      if (res.status === 401) { onUnauthorized?.(); return; }
      const data = await res.json();
      setRecalls({ status: data.status ?? 'Error', liveCount: data.liveCount ?? 0, totalAnimalVet: data.totalAnimalVet, lastChecked: data.lastChecked ?? new Date().toISOString(), error: data.error });
    } catch (e: any) {
      setRecalls(prev => ({ ...prev, status: 'Error', lastChecked: new Date().toISOString(), error: e.message }));
    }
    setLoadingRecalls(false);
  }, [adminKey]);

  const refreshAll = () => { setGlobalError(''); fetchLegacy(); fetchExtended(); fetchRecalls(); };

  useEffect(() => { fetchLegacy(); fetchExtended(); fetchRecalls(); }, [adminKey]);

  const anyLoading = loadingLegacy || loadingExtended || loadingRecalls;

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-[#4A3E3D]">Integrations Status</h2>
          <p className="text-sm text-gray-500">Live health checks for all third-party API connections</p>
        </div>
        <button
          onClick={refreshAll}
          disabled={anyLoading}
          className="flex items-center gap-2 px-4 py-2 bg-[#FAF6F4] text-[#8B5E3C] border border-[#E8DDD4] rounded-lg font-medium hover:bg-white transition-colors disabled:opacity-50 text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${anyLoading ? 'animate-spin' : ''}`} />
          Refresh All
        </button>
      </div>

      {globalError && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-100 text-sm">{globalError}</div>
      )}

      {/* Loading skeleton on very first load */}
      {anyLoading && !legacy && !extended ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B5E3C]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

          {/* ── 1. Supabase ─────────────────────────────────────────────── */}
          <Card icon={Database} title="Supabase" subtitle="Primary database" status={extended?.supabase.status} onRefresh={fetchExtended} refreshing={loadingExtended}>
            <Row label="Status" value={<StatusBadge status={extended?.supabase.status ?? '…'} />} />
            <Row label="Row count (emails)" value={extended?.supabase.emailRowCount?.toLocaleString() ?? '—'} />
            <Row label="Latency" value={extended?.supabase.latencyMs != null ? `${extended.supabase.latencyMs} ms` : '—'} />
            <Row label="Last checked" value={ts(extended?.lastChecked)} />
            {extended?.supabase.error && <ErrorBox error={extended.supabase.error} />}
          </Card>

          {/* ── 2. Stripe ───────────────────────────────────────────────── */}
          <Card icon={CreditCard} title="Stripe" subtitle="Billing & subscriptions" status={extended?.stripe.status} onRefresh={fetchExtended} refreshing={loadingExtended}>
            <Row label="Status" value={<StatusBadge status={extended?.stripe.status ?? '…'} />} />
            <Row label="Mode" value={
              extended?.stripe.mode === 'live'
                ? <span className="text-green-700 font-bold">🟢 LIVE</span>
                : extended?.stripe.mode === 'test'
                ? <span className="text-amber-700 font-bold">🟡 TEST</span>
                : '—'
            } />
            <Row label="Available balance" value={extended?.stripe.availableBalance ?? '—'} />
            <Row label="Last checked" value={ts(extended?.lastChecked)} />
            {extended?.stripe.error && <ErrorBox error={extended.stripe.error} />}
          </Card>

          {/* ── 3. Resend ───────────────────────────────────────────────── */}
          <Card icon={Mail} title="Resend" subtitle={extended?.resend.sendOnly ? "Transactional email — Send-only key — sending works, domain status cannot be verified" : "Transactional email"} status={extended?.resend.status} onRefresh={fetchExtended} refreshing={loadingExtended}>
            <Row label="Status" value={<StatusBadge status={extended?.resend.status ?? '…'} />} />
            <Row label="Domains configured" value={extended?.resend.domainCount ?? '—'} />
            <Row label="Primary domain" value={extended?.resend.primaryDomain ?? '—'} mono />
            <Row label="Domain verified" value={
              extended?.resend.primaryVerified === true ? <span className="text-green-600 font-bold">✓ Yes</span>
              : extended?.resend.primaryVerified === false ? <span className="text-red-600 font-bold">✗ No</span>
              : '—'
            } />
            <Row label="Last checked" value={ts(extended?.lastChecked)} />
            {extended?.resend.error && <ErrorBox error={extended.resend.error} />}
          </Card>

          {/* ── 4. Twilio ───────────────────────────────────────────────── */}
          <Card icon={Phone} title="Twilio" subtitle="SMS & phone verification" status={extended?.twilio.status} onRefresh={fetchExtended} refreshing={loadingExtended}>
            <Row label="Status" value={<StatusBadge status={extended?.twilio.status ?? '…'} />} />
            <Row label="Account name" value={extended?.twilio.accountName ?? '—'} />
            <Row label="Account status" value={extended?.twilio.accountStatus ?? '—'} />
            <Row label="Verify service" value={
              extended?.twilio.verifyActive === true ? <span className="text-green-600 font-bold">✓ Active</span>
              : extended?.twilio.verifyActive === false ? <span className="text-red-600 font-bold">✗ Inactive</span>
              : extended?.twilio.verifyConfigured === false ? <span className="text-gray-400">Not configured</span>
              : '—'
            } />
            {extended?.twilio.verifyName && <Row label="Verify name" value={extended.twilio.verifyName} />}
            <Row label="Last checked" value={ts(extended?.lastChecked)} />
            {extended?.twilio.error && <ErrorBox error={extended.twilio.error} />}
          </Card>

          {/* ── 5. Anthropic ─────────────────────────────────────────────── */}
          <Card icon={Brain} title="Anthropic (Claude)" subtitle="AI — scans, vision, matching" status={extended?.anthropic.status} onRefresh={fetchExtended} refreshing={loadingExtended}>
            <Row label="Status" value={<StatusBadge status={extended?.anthropic.status ?? '…'} />} />
            <Row label="Model" value={extended?.anthropic.model ?? '—'} mono />
            <Row label="Test response" value={extended?.anthropic.stopReason ?? '—'} />
            <Row label="Last checked" value={ts(extended?.lastChecked)} />
            {extended?.anthropic.error && <ErrorBox error={extended.anthropic.error} />}
          </Card>

          {/* ── 6. Google Cloud ──────────────────────────────────────────── */}
          <Card icon={Map} title="Google Cloud" subtitle="Geocoding, Maps, Vision OCR" status={extended?.google.status} onRefresh={fetchExtended} refreshing={loadingExtended}>
            <Row label="Status" value={<StatusBadge status={extended?.google.status ?? '…'} />} />
            <Row label="Key type" value={extended?.google.keyType ?? '—'} />
            <Row label="Valid AIza key" value={
              extended?.google.validAIzaKey === true ? <span className="text-green-600 font-bold">✓ Yes</span>
              : extended?.google.validAIzaKey === false ? <span className="text-red-600 font-bold">✗ No (wrong key format)</span>
              : '—'
            } />
            <Row label="Geocode result" value={extended?.google.apiStatus ?? '—'} />
            <Row label="Last checked" value={ts(extended?.lastChecked)} />
            {extended?.google.error && <ErrorBox error={extended.google.error} />}
          </Card>

          {/* ── 7. Firebase ──────────────────────────────────────────────── */}
          <Card icon={Flame} title="Firebase" subtitle="Push notifications (FCM)" status={extended?.firebase.status} onRefresh={fetchExtended} refreshing={loadingExtended}>
            <Row label="Status" value={<StatusBadge status={extended?.firebase.status ?? '…'} />} />
            <Row label="Project ID" value={extended?.firebase.projectId ?? '—'} mono />
            <Row label="Admin SDK init" value={
              extended?.firebase.initialized === true ? <span className="text-green-600 font-bold">✓ Initialized</span>
              : extended?.firebase.initialized === false ? <span className="text-red-600 font-bold">✗ Not initialized</span>
              : '—'
            } />
            <Row label="Private key set" value={
              extended?.firebase.privateKeySet === true ? <span className="text-green-600 font-bold">✓ Yes</span>
              : extended?.firebase.privateKeySet === false ? <span className="text-red-600 font-bold">✗ Missing</span>
              : '—'
            } />
            <Row label="VAPID key set" value={
              extended?.firebase.vapidKeySet === true ? <span className="text-green-600 font-bold">✓ Yes</span>
              : extended?.firebase.vapidKeySet === false ? <span className="text-amber-600 font-bold">⚠ Missing</span>
              : '—'
            } />
            <Row label="Last checked" value={ts(extended?.lastChecked)} />
            {extended?.firebase.error && <ErrorBox error={extended.firebase.error} />}
          </Card>

          {/* ── 8. RescueGroups ──────────────────────────────────────────── */}
          {legacy && (
            <Card icon={Database} title="RescueGroups API" subtitle="Shelter / adoptable pets" status={legacy.rescuegroups.status} onRefresh={fetchLegacy} refreshing={loadingLegacy}>
              <Row label="Status" value={<StatusBadge status={legacy.rescuegroups.status} />} />
              <Row label="Configured" value={legacy.rescuegroups.configured ? 'Yes' : 'No'} />
              <Row label="Last checked" value={ts(legacy.rescuegroups.lastChecked)} />
              {legacy.rescuegroups.error && <ErrorBox error={legacy.rescuegroups.error} />}
            </Card>
          )}

          {/* ── 9. Amazon Associates ─────────────────────────────────────── */}
          {legacy && (
            <Card icon={Database} title="Amazon Associates" subtitle="Product recommendations" status={legacy.amazon.status} onRefresh={fetchLegacy} refreshing={loadingLegacy}>
              <Row label="Status" value={<StatusBadge status={legacy.amazon.status} />} />
              <Row label="Configured" value={legacy.amazon.configured ? 'Yes' : 'No'} />
              <Row label="Last checked" value={ts(legacy.amazon.lastChecked)} />
              {legacy.amazon.error && <ErrorBox error={legacy.amazon.error} />}
            </Card>
          )}

          {/* ── 10. FDA Recalls ──────────────────────────────────────────── */}
          <Card icon={AlertTriangle} title="FDA Recalls" subtitle="openFDA Enforcement API" status={recalls.status === 'Idle' ? undefined : recalls.status === 'Loading' ? undefined : recalls.status} onRefresh={fetchRecalls} refreshing={loadingRecalls}>
            <Row label="Status" value={<StatusBadge status={recalls.status === 'Idle' ? 'Not Configured' : recalls.status} />} />
            <Row label="Pet food recalls (live)" value={recalls.status === 'Connected' ? recalls.liveCount : '—'} />
            {recalls.totalAnimalVet !== undefined && recalls.status === 'Connected' && (
              <Row label="Food enforcement total" value={recalls.totalAnimalVet} />
            )}
            <Row label="Last checked" value={ts(recalls.lastChecked)} />
            {recalls.status === 'Connected' && recalls.liveCount === 0 && (
              <div className="mt-2 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 font-medium">
                  0 pet food keyword matches — public page is showing <strong>historical seed data</strong>.
                </p>
              </div>
            )}
            {recalls.error && <ErrorBox error={recalls.error} />}
          </Card>

        </div>
      )}
    </div>
  );
}
