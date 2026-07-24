'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

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

interface IntegrationsResponse {
  rescuegroups: IntegrationStatus;
  amazon: IntegrationStatus;
  error?: string;
}

export default function IntegrationsManagement({ adminKey, onUnauthorized }: IntegrationsManagementProps) {
  const [statuses, setStatuses] = useState<IntegrationsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  useEffect(() => {
    fetchStatuses();
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-[#4A3E3D]">Integrations Status</h2>
          <p className="text-sm text-gray-500">Monitor live connections to third-party APIs</p>
        </div>
        <button
          onClick={fetchStatuses}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-[#FAF6F4] text-[#8B5E3C] border border-[#E8DDD4] rounded-lg font-medium hover:bg-white transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
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
      ) : statuses ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* RescueGroups */}
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
              {statuses.rescuegroups.error && (
                <div className="mt-4 p-3 bg-red-50 rounded text-xs text-red-600 break-words">
                  <span className="font-bold block mb-1">Error Details:</span>
                  {statuses.rescuegroups.error}
                </div>
              )}
            </div>
          </div>

          {/* Amazon Associates */}
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
              {statuses.amazon.error && (
                <div className="mt-4 p-3 bg-red-50 rounded text-xs text-red-600 break-words">
                  <span className="font-bold block mb-1">Error Details:</span>
                  {statuses.amazon.error}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
