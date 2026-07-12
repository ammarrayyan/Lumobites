'use client';

import React, { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import SitterManagement from '@/components/admin/SitterManagement';
import StatisticsDashboard from '@/components/admin/StatisticsDashboard';
import AccountManagement from '@/components/admin/AccountManagement';
import LostPetsManagement from '@/components/admin/LostPetsManagement';
import ReviewsManagement from '@/components/admin/ReviewsManagement';
import CityBoardManagement from '@/components/admin/CityBoardManagement';
import RequestsManagement from '@/components/admin/RequestsManagement';
import TwinGalleryManagement from '@/components/admin/TwinGalleryManagement';
import AffiliatesManagement from '@/components/admin/AffiliatesManagement';
import ReportsManagement from '@/components/admin/ReportsManagement';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'stats' | 'sitters' | 'requests' | 'accounts' | 'lost-pets' | 'reviews' | 'city-board' | 'twin-gallery' | 'affiliates' | 'reports' | 'pet-matching'>('stats');

  useEffect(() => {
    // Check if we have a saved key in session storage
    const savedKey = sessionStorage.getItem('adminKey');
    if (savedKey) {
      setPassword(savedKey);
      setIsAuthenticated(true);
    }
  }, []);

  const [pendingReportsCount, setPendingReportsCount] = useState(0);
  const [activeLostPets, setActiveLostPets] = useState<number | string>('-');
  const [recentFoundPets, setRecentFoundPets] = useState<number | string>('-');
  const [totalMatches, setTotalMatches] = useState<number | string>('-');

  useEffect(() => {
    if (isAuthenticated) {
      fetch('/api/reports', {
        headers: { 'x-admin-key': password }
      })
      .then(res => res.json())
      .then(data => {
        if (data.reports) {
          const pending = data.reports.filter((r: any) => r.status === 'pending').length;
          setPendingReportsCount(pending);
        }
      })
      .catch(err => console.error('Failed to fetch reports count:', err));
    }
  }, [isAuthenticated, activeTab, password]);

  const [matchResults, setMatchResults] = useState<any>(null)
  const [matchLoading, setMatchLoading] = useState(false)

  const handleRunMatches = async () => {
    setMatchLoading(true)
    setMatchResults(null)
    try {
      const res = await fetch('/api/admin/run-pet-matches', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-secret': 'Lumo2026@' 
        }
      })
      const data = await res.json()
      setMatchResults(data)
    } catch (err) {
      setMatchResults({ error: 'Failed to run match check' })
    }
    setMatchLoading(false)
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    // We don't know the bypass key on the client directly unless we check via an API or NEXT_PUBLIC variable.
    // For simplicity, we just save it and let the API routes validate it.
    // If the API returns 401, we will log them out.
    sessionStorage.setItem('adminKey', password);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminKey');
    setPassword('');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FDFAF7] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl w-full max-w-md border border-gray-200 shadow-2xl">
          <h1 className="text-2xl font-bold text-[#191919] mb-6 text-center">Admin Access</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[#555555] text-sm font-medium mb-2">Bypass Key</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl p-3 text-[#191919] focus:outline-none focus:border-[#c2e59c] transition-colors"
                placeholder="Enter bypass key..."
              />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#c2e59c] to-[#64b3f4] text-black font-bold py-3 px-4 rounded-xl hover:opacity-90 transition-opacity"
            >
              Access Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFAF7] text-[#191919] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-[#191919] flex items-center gap-2">
            <Settings className="w-8 h-8 text-blue-600" />
            Lumo Bites Admin
          </h1>
          <div className="flex items-center gap-4">
            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-[#191919] transition-colors text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-2 bg-white p-1 rounded-xl mb-8 border border-gray-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
              activeTab === 'stats'
                ? 'bg-gradient-to-r from-[#c2e59c] to-[#64b3f4] text-black shadow-lg'
                : 'text-[#555555] hover:text-[#191919] hover:bg-gray-50'
            }`}
          >
            Statistics
          </button>
          <button
            onClick={() => setActiveTab('sitters')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
              activeTab === 'sitters'
                ? 'bg-gradient-to-r from-[#c2e59c] to-[#64b3f4] text-black shadow-lg'
                : 'text-[#555555] hover:text-[#191919] hover:bg-gray-50'
            }`}
          >
            Sitter Management
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
              activeTab === 'requests'
                ? 'bg-gradient-to-r from-[#c2e59c] to-[#64b3f4] text-black shadow-lg'
                : 'text-[#555555] hover:text-[#191919] hover:bg-gray-50'
            }`}
          >
            Sitting Requests
          </button>
          <button
            onClick={() => setActiveTab('accounts')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
              activeTab === 'accounts'
                ? 'bg-gradient-to-r from-[#c2e59c] to-[#64b3f4] text-black shadow-lg'
                : 'text-[#555555] hover:text-[#191919] hover:bg-gray-50'
            }`}
          >
            All Accounts
          </button>
          <button
            onClick={() => setActiveTab('lost-pets')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
              activeTab === 'lost-pets'
                ? 'bg-gradient-to-r from-[#c2e59c] to-[#64b3f4] text-black shadow-lg'
                : 'text-[#555555] hover:text-[#191919] hover:bg-gray-50'
            }`}
          >
            Lost Pets
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
              activeTab === 'reviews'
                ? 'bg-gradient-to-r from-[#c2e59c] to-[#64b3f4] text-black shadow-lg'
                : 'text-[#555555] hover:text-[#191919] hover:bg-gray-50'
            }`}
          >
            Reviews
          </button>
          <button
            onClick={() => setActiveTab('city-board')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
              activeTab === 'city-board'
                ? 'bg-gradient-to-r from-[#c2e59c] to-[#64b3f4] text-black shadow-lg'
                : 'text-[#555555] hover:text-[#191919] hover:bg-gray-50'
            }`}
          >
            City Board
          </button>
          <button
            onClick={() => setActiveTab('twin-gallery')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
              activeTab === 'twin-gallery'
                ? 'bg-gradient-to-r from-[#c2e59c] to-[#64b3f4] text-black shadow-lg'
                : 'text-[#555555] hover:text-[#191919] hover:bg-gray-50'
            }`}
          >
            Pet Twin Gallery
          </button>
          <button
            onClick={() => setActiveTab('affiliates')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
              activeTab === 'affiliates'
                ? 'bg-gradient-to-r from-[#c2e59c] to-[#64b3f4] text-black shadow-lg'
                : 'text-[#555555] hover:text-[#191919] hover:bg-gray-50'
            }`}
          >
            Affiliates
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex-grow-0 py-2 px-4 rounded-lg font-medium text-sm transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${
              activeTab === 'reports'
                ? 'bg-gradient-to-r from-[#c2e59c] to-[#64b3f4] text-black shadow-lg'
                : 'text-[#555555] hover:text-[#191919] hover:bg-gray-50'
            }`}
          >
            Reports
            {pendingReportsCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {pendingReportsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('pet-matching')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
              activeTab === 'pet-matching'
                ? 'bg-gradient-to-r from-[#c2e59c] to-[#64b3f4] text-black shadow-lg'
                : 'text-[#555555] hover:text-[#191919] hover:bg-gray-50'
            }`}
          >
            Pet Matching
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 min-h-[500px]">
          {activeTab === 'stats' && <StatisticsDashboard adminKey={password} onUnauthorized={handleLogout} />}
          {activeTab === 'sitters' && <SitterManagement adminKey={password} onUnauthorized={handleLogout} />}
          {activeTab === 'requests' && <RequestsManagement adminKey={password} onUnauthorized={handleLogout} />}
          {activeTab === 'accounts' && <AccountManagement adminKey={password} onUnauthorized={handleLogout} />}
          {activeTab === 'lost-pets' && <LostPetsManagement adminKey={password} onUnauthorized={handleLogout} />}
          {activeTab === 'reviews' && <ReviewsManagement adminKey={password} onUnauthorized={handleLogout} />}
          {activeTab === 'city-board' && <CityBoardManagement adminKey={password} onUnauthorized={handleLogout} />}
          {activeTab === 'twin-gallery' && <TwinGalleryManagement adminKey={password} onUnauthorized={handleLogout} />}
          {activeTab === 'affiliates' && <AffiliatesManagement adminKey={password} onUnauthorized={handleLogout} />}
          {activeTab === 'reports' && <ReportsManagement adminKey={password} onUnauthorized={handleLogout} />}
          
          {activeTab === 'pet-matching' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-[#4A3E3D]">AI Pet Match Notifications</h2>
              <p className="text-sm text-gray-500">
                Run daily match check to find potential matches between lost and found pets within 10 miles. 
                Owners with 70%+ matches will be notified by email and push notification.
              </p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-[#8B5E3C]">{activeLostPets}</p>
                  <p className="text-xs text-gray-500">Active Lost Pets</p>
                </div>
                <div className="bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-[#8B5E3C]">{recentFoundPets}</p>
                  <p className="text-xs text-gray-500">Found Pets (24hrs)</p>
                </div>
                <div className="bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-[#8B5E3C]">{totalMatches}</p>
                  <p className="text-xs text-gray-500">Total Matches Sent</p>
                </div>
              </div>

              {/* Run button */}
              <div className="bg-white border border-[#E8DDD4] rounded-xl p-6">
                <h3 className="font-bold text-[#4A3E3D] mb-2">Run Match Check</h3>
                <p className="text-xs text-gray-500 mb-4">
                  Checks all found pets from last 24 hours against active lost pets. 
                  Hard cap: 100 AI calls per run.
                </p>
                <button
                  onClick={handleRunMatches}
                  disabled={matchLoading}
                  className="bg-[#8B5E3C] text-white px-6 py-3 rounded-xl text-sm font-medium"
                >
                  {matchLoading ? 'Running...' : 'Run Daily Pet Match Check'}
                </button>

                {/* Results */}
                {matchResults && (
                  <div className="mt-4 bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl p-4 text-sm space-y-2">
                    <p><strong>Status:</strong> {matchResults.success ? '✅ Complete' : '❌ Failed'}</p>
                    <p><strong>AI calls used:</strong> {matchResults.aiCallsUsed || 0}</p>
                    <p><strong>Matches found:</strong> {matchResults.matchesFound || 0}</p>
                    <p><strong>Message:</strong> {matchResults.message || 'Done'}</p>
                    {matchResults.error && (
                      <p className="text-red-500"><strong>Error:</strong> {matchResults.error}</p>
                    )}
                    {matchResults.results && matchResults.results.length > 0 && (
                      <div className="mt-2">
                        <p className="font-bold mb-1">Match Details:</p>
                        {matchResults.results.map((r: any, i: number) => (
                          <div key={i} className="bg-white border border-[#E8DDD4] rounded-lg p-2 mb-1 text-xs">
                            <p>Match score: <strong>{r.score}%</strong></p>
                            <p>Notified: {r.notified}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
