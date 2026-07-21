import React, { useState } from 'react';
import { Send, Users, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface BroadcastManagementProps {
  adminKey: string;
  onUnauthorized: () => void;
}

export default function BroadcastManagement({ adminKey, onUnauthorized }: BroadcastManagementProps) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [link, setLink] = useState('');
  const [audience, setAudience] = useState<'all' | 'pro' | 'sitters' | 'owners'>('all');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState('');

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setError('Title and Message are required');
      return;
    }

    const audienceLabels = {
      all: 'All Users',
      pro: 'Pro Users',
      sitters: 'Sitters',
      owners: 'Pet Owners',
    };

    const confirmSend = window.confirm(
      `⚠️ WARNING: You are about to send a BROADCAST notification to ${audienceLabels[audience]}. Are you sure you want to proceed?`
    );
    if (!confirmSend) return;

    setLoading(true);
    setResults(null);
    setError('');

    try {
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey,
        },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          link: link.trim() || undefined,
          audience,
        }),
      });

      if (res.status === 401) {
        onUnauthorized();
        return;
      }

      const data = await res.json();
      if (res.ok) {
        setResults(data);
        setTitle('');
        setMessage('');
        setLink('');
      } else {
        setError(data.error || 'Failed to send broadcast');
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to connect to broadcast server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#4A3E3D] flex items-center gap-2">
          <Send className="w-5 h-5 text-blue-600" />
          Admin Broadcast Notifications
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Compose and send push notifications and in-app system notifications to targeted segments.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Composition Form */}
        <div className="lg:col-span-2 bg-white border border-[#E8DDD4] rounded-xl p-6 space-y-4 shadow-sm">
          <form onSubmit={handleSend} className="space-y-4">
            {/* Target Audience */}
            <div>
              <label className="text-sm font-semibold text-[#4A3E3D] flex items-center gap-1.5 mb-1">
                <Users className="w-4 h-4 text-gray-500" />
                Target Audience
              </label>
              <select
                value={audience}
                onChange={(e: any) => setAudience(e.target.value)}
                className="w-full border border-[#E8DDD4] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#8B5E3C] bg-white text-[#191919]"
              >
                <option value="all">All Users (Complete Mailing List)</option>
                <option value="pro">Pro Users Only</option>
                <option value="sitters">Pet Sitters Only</option>
                <option value="owners">Pet Owners Only</option>
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="text-sm font-semibold text-[#4A3E3D] block mb-1">
                Notification Title (max 100 chars)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Lumo Bites Update 🐾"
                maxLength={100}
                required
                className="w-full border border-[#E8DDD4] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#8B5E3C] text-[#191919] bg-white"
              />
            </div>

            {/* Link (Optional) */}
            <div>
              <label className="text-sm font-semibold text-[#4A3E3D] block mb-1">
                Redirect Link Path (optional)
              </label>
              <input
                type="text"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="e.g. /petsitting or /lost-pets"
                className="w-full border border-[#E8DDD4] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#8B5E3C] text-[#191919] bg-white font-mono"
              />
              <p className="text-xs text-gray-400 mt-1">
                If tapped, redirects the user's app/browser window to this page. Defaults to <code>/petsitting</code>.
              </p>
            </div>

            {/* Message Body */}
            <div>
              <label className="text-sm font-semibold text-[#4A3E3D] block mb-1">
                Notification Message Body
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                required
                placeholder="Write your broadcast notification contents here..."
                className="w-full border border-[#E8DDD4] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#8B5E3C] text-[#191919] bg-white"
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 text-sm p-4 rounded-xl border border-red-200 flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="bg-[#8B5E3C] hover:bg-[#7A5234] text-white px-6 py-3.5 rounded-xl font-medium w-full shadow-sm disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Sending Broadcast...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Broadcast Notification
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results / Information Panel */}
        <div className="space-y-4">
          <div className="bg-[#FDFAF7] border border-[#F5EDE4] rounded-xl p-6 space-y-3">
            <h3 className="font-bold text-[#4A3E3D] text-sm flex items-center gap-1.5">
              <Info className="w-4 h-4 text-[#8B5E3C]" />
              System Behavior
            </h3>
            <ul className="text-xs text-gray-600 space-y-2 list-disc list-inside">
              <li>Inserts row notification for each target user in the database.</li>
              <li>Retrieves associated FCM registration tokens from device registrations.</li>
              <li>Batches FCM calls in groups of 500 to satisfy APNs limits.</li>
              <li>Stale or unregistered tokens are automatically pruned.</li>
            </ul>
          </div>

          {results && (
            <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-6 space-y-3">
              <h3 className="font-bold text-sm flex items-center gap-1.5 text-green-900">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Broadcast Successful!
              </h3>
              <div className="text-xs space-y-1">
                <p><strong>DB Notifications:</strong> {results.dbCount} rows created</p>
                <p><strong>Registered Devices:</strong> {results.pushCount} devices found</p>
                <p><strong>Push Delivered:</strong> {results.pushSuccess} succeeded</p>
                {results.pushFailed > 0 && <p className="text-amber-700"><strong>Push Failed:</strong> {results.pushFailed} invalid/stale</p>}
                {results.staleCleaned > 0 && <p className="text-green-700"><strong>Pruned Tokens:</strong> {results.staleCleaned} deleted</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
