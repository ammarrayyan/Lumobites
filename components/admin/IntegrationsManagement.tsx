'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2, XCircle, AlertCircle, AlertTriangle } from 'lucide-react';

interface IntegrationsManagementProps {
  adminKey: string;
  onUnauthorized?: () => void;
}

interface IntegrationStatus {
  configured: boolean;
  status: 'Connected' | 'Not Configured' | 'Error';
  error: string | null;
  lastChecked: string;
}

interface RecallsStatus {
  status: 'Connected' | 'Error' | 'Loading' | 'Idle';
  liveCount: number;
  totalAnimalVet?: number;
  lastChecked: string | null;
  error?: string;
}

interface IntegrationsResponse {
  rescuegroups: IntegrationStatus;
  amazon: IntegrationStatus;
  error?: string;
}

export default function IntegrationsManagement({ adminKey, onUnauthorized }: IntegrationsManagementProps) {
  const [statuses, setStatuses] = useState<IntegrationsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Recalls status is fetched independently so it can be refreshed on its own
  const [recalls, setRecalls] = useState<RecallsStatus>({
    status: 'Idle',
    liveCount: 0,
    lastChecked: null,
  });
  const [recallsLoading, setRecallsLoading] = useState(false);

  const fetchStatuses = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/integrations-status', {
        headers: { 'x-admin-key': adminKey }
      });
      if (res.status === 401 && onUnauthorized) {
        onUnauthorized();
        return;
      }
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setStatuses(data as IntegrationsResponse);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch integration statuses');
    }
    setLoading(false);
  };

  const fetchRecallsStatus = async () => {
    setRecallsLoading(true);
    try {
      const res = await fetch('/api/admin/recalls-status', {
        headers: { 'x-admin-key': adminKey }
      });
      if (res.status === 401 && onUnauthorized) {
        onUnauthorized();
        return;
      }
      const data = await res.json();
      setRecalls({
        status: data.status ?? 'Error',
        liveCount: data.liveCount ?? 0,
        totalAnimalVet: data.totalAnimalVet,
        lastChecked: data.lastChecked ?? new Date().toISOString(),
        error: data.error,
      });
    } catch (err: any) {
      setRecalls(prev => ({
        ...prev,
        status: 'Error',
        lastChecked: new Date().toISOString(),
        error: err.message || 'Failed to reach recalls-status endpoint',
      }));
    }
    setRecallsLoading(false);
  };

  const handleRefreshAll = async () => {
    await Promise.all([fetchStatuses(), fetchRecallsStatus()]);
  };

  useEffect(() => {
    fetchStatuses();
    fetchRecallsStatus();
  }, [adminKey]);

  const getStatusIcon = (status: string) => {
    if (status === 'Connected') return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    if (status === 'Error') return <XCircle className="w-5 h-5 text-red-500" />;
    return <AlertCircle className="w-5 h-5 text-yellow-500" />;
  };

  const getStatusColor = (status: string) => {
    if (status === 'Connected') return 'text-green-600 bg-green-50';
    if (status === 'Error') return 'text-red-600 bg-red-50';
    return 'text-yellow-600 bg-yellow-50';
  };

  const formatLastChecked = (iso: string | null) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return iso;
    }
  };

  const isGlobalLoading = loading || recallsLoading;
  const isFallingBack = recalls.status === 'Connected' && recalls.liveCount === 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-[#4A3E3D]">Integrations Status</h2>
          <p className="text-sm text-gray-500">Monitor live connections to third-party APIs</p>
        </div>
        <button
          onClick={handleRefreshAll}
          disabled={isGlobalLoading}
          className="flex items-center gap-2 px-4 py-2 bg-[#FAF6F4] text-[#8B5E3C] border border-[#E8DDD4] rounded-lg font-medium hover:bg-white transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isGlobalLoading ? 'animate-spin' : ''}`} />
          Refresh Status
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-100">
          {error}
        </div>
      )}

      {loading && !statuses ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B5E3C]"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

          {/* RescueGroups */}
          {statuses && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">RescueGroups API</h3>
                {getStatusIcon(statuses.rescuegroups.status)}
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Configured:</span>
                  <span className="font-medium">{statuses.rescuegroups.configured ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Status:</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(statuses.rescuegroups.status)}`}>
                    {statuses.rescuegroups.status}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Last checked:</span>
                  <span className="font-medium text-xs text-gray-400">{formatLastChecked(statuses.rescuegroups.lastChecked)}</span>
                </div>
                {statuses.rescuegroups.error && (
                  <div className="mt-4 p-3 bg-red-50 rounded text-xs text-red-600 break-words">
                    <span className="font-bold block mb-1">Error Details:</span>
                    {statuses.rescuegroups.error}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Amazon Associates */}
          {statuses && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Amazon Associates</h3>
                {getStatusIcon(statuses.amazon.status)}
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Configured:</span>
                  <span className="font-medium">{statuses.amazon.configured ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Status:</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(statuses.amazon.status)}`}>
                    {statuses.amazon.status}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Last checked:</span>
                  <span className="font-medium text-xs text-gray-400">{formatLastChecked(statuses.amazon.lastChecked)}</span>
                </div>
                {statuses.amazon.error && (
                  <div className="mt-4 p-3 bg-red-50 rounded text-xs text-red-600 break-words">
                    <span className="font-bold block mb-1">Error Details:</span>
                    {statuses.amazon.error}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* FDA Recalls (openFDA) */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-900">FDA Recalls</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">openFDA Enforcement API</p>
              </div>
              <div className="flex items-center gap-2">
                {recalls.status !== 'Idle' && getStatusIcon(recalls.status === 'Loading' ? 'Not Configured' : recalls.status)}
              </div>
            </div>

            <div className="space-y-3 flex-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Status:</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  recalls.status === 'Idle' || recalls.status === 'Loading'
                    ? 'text-gray-500 bg-gray-100'
                    : getStatusColor(recalls.status)
                }`}>
                  {recalls.status === 'Idle' ? 'Not checked yet' : recalls.status}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Pet food recalls (live):</span>
                <span className="font-bold text-gray-900">
                  {recalls.status === 'Connected' ? recalls.liveCount : '—'}
                </span>
              </div>

              {recalls.totalAnimalVet !== undefined && recalls.status === 'Connected' && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Animal &amp; Vet total:</span>
                  <span className="font-medium text-gray-600">{recalls.totalAnimalVet}</span>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Last checked:</span>
                <span className="font-medium text-xs text-gray-400">{formatLastChecked(recalls.lastChecked)}</span>
              </div>

              {/* Fallback warning: connected but 0 pet food matches → seed data in use */}
              {isFallingBack && (
                <div className="mt-2 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 font-medium">
                    FDA returned 0 pet food matches — the public recalls page is currently showing <strong>historical seed data</strong> as a fallback.
                  </p>
                </div>
              )}

              {recalls.error && (
                <div className="mt-2 p-3 bg-red-50 rounded text-xs text-red-600 break-words">
                  <span className="font-bold block mb-1">Error Details:</span>
                  {recalls.error}
                </div>
              )}
            </div>

            {/* Per-card Refresh button */}
            <button
              onClick={fetchRecallsStatus}
              disabled={recallsLoading}
              className="mt-5 w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#FAF6F4] text-[#8B5E3C] border border-[#E8DDD4] rounded-lg text-sm font-medium hover:bg-white transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${recallsLoading ? 'animate-spin' : ''}`} />
              {recallsLoading ? 'Checking FDA…' : 'Refresh Now'}
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
