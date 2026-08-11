'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import BroadcastManagement from '@/components/admin/BroadcastManagement';
import ShelterManagement from '@/components/admin/ShelterManagement';
import AdoptionPetsManagement from '@/components/admin/AdoptionPetsManagement';
import IntegrationsManagement from '@/components/admin/IntegrationsManagement';
import VetClinicManagement from '@/components/admin/VetClinicManagement';
import DaycareManagement from '@/components/admin/DaycareManagement';
import PartnerBillingManagement from '@/components/admin/PartnerBillingManagement';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'stats' | 'sitters' | 'shelters' | 'vet-clinics' | 'pet-daycares' | 'partner-billing' | 'requests' | 'accounts' | 'lost-pets' | 'adoption-pets' | 'reviews' | 'city-board' | 'twin-gallery' | 'affiliates' | 'reports' | 'pet-matching' | 'outreach' | 'broadcast' | 'integrations' | 'ai-usage'>('stats');

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
  const [matchHistory, setMatchHistory] = useState<any[]>([])
  const [historyPage, setHistoryPage] = useState(1)
  const [historyTotalPages, setHistoryTotalPages] = useState(1)
  const [historyTotalCount, setHistoryTotalCount] = useState(0)
  const [historyLoading, setHistoryLoading] = useState(false)

  const fetchMatchHistory = useCallback((page = 1) => {
    setHistoryLoading(true);
    fetch(`/api/admin/pet-match-history?page=${page}&limit=20`, {
      headers: { 'x-admin-key': password }
    })
    .then(res => res.json())
    .then(data => {
      if (data.logs) {
        setMatchHistory(data.logs);
        setHistoryPage(data.page || page);
        setHistoryTotalPages(data.totalPages || 1);
        setHistoryTotalCount(data.total || 0);
      }
    })
    .catch(err => console.error('Failed to fetch match history:', err))
    .finally(() => setHistoryLoading(false));
  }, [password]);

  useEffect(() => {
    if (isAuthenticated && activeTab === 'pet-matching') {
      fetch('/api/admin/pet-matches-stats', {
        headers: { 'x-admin-key': password }
      })
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setActiveLostPets(data.activeLostPets);
          setRecentFoundPets(data.recentFoundPets);
          setTotalMatches(data.totalMatches);
        }
      })
      .catch(err => console.error('Failed to fetch pet match stats:', err));

      fetchMatchHistory(1);
    }
  }, [isAuthenticated, activeTab, password, fetchMatchHistory]);

  const [aiUsageStats, setAiUsageStats] = useState<any>(null);
  const [aiUsageLoading, setAiUsageLoading] = useState(false);

  const fetchAiUsageStats = useCallback(() => {
    setAiUsageLoading(true);
    fetch('/api/admin/ai-usage-stats', {
      headers: { 'x-admin-key': password }
    })
    .then(res => res.json())
    .then(data => {
      if (!data.error) {
        setAiUsageStats(data);
      }
    })
    .catch(err => console.error('Failed to fetch AI usage stats:', err))
    .finally(() => setAiUsageLoading(false));
  }, [password]);

  useEffect(() => {
    if (isAuthenticated && activeTab === 'ai-usage') {
      fetchAiUsageStats();
    }
  }, [isAuthenticated, activeTab, password, fetchAiUsageStats]);

  const handleRunMatches = async () => {
    setMatchLoading(true)
    setMatchResults(null)
    try {
      const res = await fetch('/api/admin/run-pet-matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': password
        }
      })
      const data = await res.json()
      setMatchResults(data)
      fetchMatchHistory(1)
    } catch (err) {
      setMatchResults({ error: 'Failed to run match check' })
    }
    setMatchLoading(false)
  }

  const [outreachSubject, setOutreachSubject] = useState('Free lost pet tool — would love your thoughts')
  const [outreachEmails, setOutreachEmails] = useState('')
  const [outreachMessage, setOutreachMessage] = useState('')
  const [outreachLoading, setOutreachLoading] = useState(false)
  const [outreachSentCount, setOutreachSentCount] = useState(0)
  const [outreachResults, setOutreachResults] = useState<any>(null)
  const [outreachHistory, setOutreachHistory] = useState<any[]>([])

  const [smsNumbers, setSmsNumbers] = useState('')
  const [smsMessage, setSmsMessage] = useState('')
  const [smsLoading, setSmsLoading] = useState(false)
  const [smsResults, setSmsResults] = useState<any>(null)

  const handleSendSMS = async () => {
    const numbers = smsNumbers.split('\n').filter(n => n.trim())
    if (!numbers.length || !smsMessage) {
      alert('Please fill in all fields')
      return
    }
    if (!window.confirm(`Send SMS to ${numbers.length} recipients?`)) return
    
    setSmsLoading(true)
    setSmsResults(null)
    
    try {
      const res = await fetch('/api/admin/send-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': password
        },
        body: JSON.stringify({
          numbers,
          message: smsMessage
        })
      })
      
      const data = await res.json()
      setSmsResults(data)
    } catch (err) {
      console.error(err)
      alert('Failed to send SMS')
    }
    setSmsLoading(false)
  }

  // Fetch outreach history
  const fetchOutreachHistory = async () => {
    try {
      const { data } = await fetch('/api/admin/outreach-history', {
        headers: { 'x-admin-key': password }
      }).then(r => r.json())
      setOutreachHistory(data || [])
    } catch (err) {
      console.error('Failed to fetch outreach history:', err)
    }
  }

  useEffect(() => {
    if (activeTab === 'outreach') {
      fetchOutreachHistory()
    }
  }, [activeTab])

  const handleSendOutreach = async () => {
    const emails = outreachEmails.split('\n').filter(e => e.trim())
    if (!emails.length || !outreachSubject || !outreachMessage) {
      alert('Please fill in all fields')
      return
    }
    if (!window.confirm(`Send to ${emails.length} recipients?`)) return
    
    setOutreachLoading(true)
    setOutreachSentCount(0)
    
    const res = await fetch('/api/admin/send-outreach', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': password
      },
      body: JSON.stringify({
        emails,
        subject: outreachSubject,
        message: outreachMessage
      })
    })
    
    const data = await res.json()
    setOutreachResults(data)
    setOutreachLoading(false)
    fetchOutreachHistory()
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
            onClick={() => setActiveTab('shelters')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
              activeTab === 'shelters'
                ? 'bg-gradient-to-r from-[#c2e59c] to-[#64b3f4] text-black shadow-lg'
                : 'text-[#555555] hover:text-[#191919] hover:bg-gray-50'
            }`}
          >
            Shelters & Rescues
          </button>
          <button
            onClick={() => setActiveTab('vet-clinics')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
              activeTab === 'vet-clinics'
                ? 'bg-gradient-to-r from-[#c2e59c] to-[#64b3f4] text-black shadow-lg'
                : 'text-[#555555] hover:text-[#191919] hover:bg-gray-50'
            }`}
          >
            Vet Clinics
          </button>
          <button
            onClick={() => setActiveTab('pet-daycares')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
              activeTab === 'pet-daycares'
                ? 'bg-gradient-to-r from-[#c2e59c] to-[#64b3f4] text-black shadow-lg'
                : 'text-[#555555] hover:text-[#191919] hover:bg-gray-50'
            }`}
          >
            Pet Daycares
          </button>
          <button
            onClick={() => setActiveTab('partner-billing')}
            className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all whitespace-nowrap bg-amber-50 ${
              activeTab === 'partner-billing'
                ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-black shadow-lg'
                : 'text-amber-900 hover:text-black hover:bg-amber-100'
            }`}
          >
            💳 Partner Billing
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
            onClick={() => setActiveTab('adoption-pets')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
              activeTab === 'adoption-pets'
                ? 'bg-gradient-to-r from-[#c2e59c] to-[#64b3f4] text-black shadow-lg'
                : 'text-[#555555] hover:text-[#191919] hover:bg-gray-50'
            }`}
          >
            Adoption Pets
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
          <button
            onClick={() => setActiveTab('outreach')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
              activeTab === 'outreach'
                ? 'bg-gradient-to-r from-[#c2e59c] to-[#64b3f4] text-black shadow-lg'
                : 'text-[#555555] hover:text-[#191919] hover:bg-gray-50'
            }`}
          >
            Outreach
          </button>
          <button
            onClick={() => setActiveTab('broadcast')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
              activeTab === 'broadcast'
                ? 'bg-gradient-to-r from-[#c2e59c] to-[#64b3f4] text-black shadow-lg'
                : 'text-[#555555] hover:text-[#191919] hover:bg-gray-50'
            }`}
          >
            Broadcast
          </button>
          <button
            onClick={() => setActiveTab('integrations')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
              activeTab === 'integrations'
                ? 'bg-gradient-to-r from-[#c2e59c] to-[#64b3f4] text-black shadow-lg'
                : 'text-[#555555] hover:text-[#191919] hover:bg-gray-50'
            }`}
          >
            Integrations
          </button>
          <button
            onClick={() => setActiveTab('ai-usage')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
              activeTab === 'ai-usage'
                ? 'bg-gradient-to-r from-[#c2e59c] to-[#64b3f4] text-black shadow-lg'
                : 'text-[#555555] hover:text-[#191919] hover:bg-gray-50'
            }`}
          >
            🤖 AI Usage & Caps
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 min-h-[500px]">
          {activeTab === 'stats' && <StatisticsDashboard adminKey={password} onUnauthorized={handleLogout} />}
          {activeTab === 'sitters' && <SitterManagement adminKey={password} onUnauthorized={handleLogout} />}
          {activeTab === 'shelters' && <ShelterManagement adminKey={password} />}
          {activeTab === 'vet-clinics' && <VetClinicManagement adminKey={password} />}
          {activeTab === 'pet-daycares' && <DaycareManagement adminKey={password} />}
          {activeTab === 'requests' && <RequestsManagement adminKey={password} onUnauthorized={handleLogout} />}
          {activeTab === 'accounts' && <AccountManagement adminKey={password} onUnauthorized={handleLogout} />}
          {activeTab === 'lost-pets' && <LostPetsManagement adminKey={password} onUnauthorized={handleLogout} />}
          {activeTab === 'adoption-pets' && <AdoptionPetsManagement adminKey={password} onUnauthorized={handleLogout} />}
          {activeTab === 'reviews' && <ReviewsManagement adminKey={password} onUnauthorized={handleLogout} />}
          {activeTab === 'city-board' && <CityBoardManagement adminKey={password} onUnauthorized={handleLogout} />}
          {activeTab === 'twin-gallery' && <TwinGalleryManagement adminKey={password} onUnauthorized={handleLogout} />}
          {activeTab === 'affiliates' && <AffiliatesManagement adminKey={password} onUnauthorized={handleLogout} />}
          {activeTab === 'reports' && <ReportsManagement adminKey={password} onUnauthorized={handleLogout} />}
          {activeTab === 'broadcast' && <BroadcastManagement adminKey={password} onUnauthorized={handleLogout} />}
          {activeTab === 'integrations' && <IntegrationsManagement adminKey={password} onUnauthorized={handleLogout} />}
          {activeTab === 'partner-billing' && <PartnerBillingManagement adminKey={password} />}
          
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
                  <p className="text-xs text-gray-500">Found Pets (7 days)</p>
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
                  Checks all found pets from last 7 days against active lost pets. 
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

              {/* Match History Table */}
              <div className="bg-white border border-[#E8DDD4] rounded-xl p-6 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <h3 className="font-bold text-[#4A3E3D]">Match History Log</h3>
                    <p className="text-xs text-gray-500">Permanent audit log of all matched pet reports and notification delivery statuses.</p>
                  </div>
                  <span className="text-xs font-medium text-gray-500 bg-[#FAF6F4] px-3 py-1 rounded-full border border-[#E8DDD4]">
                    {historyTotalCount} Total Matches Recorded
                  </span>
                </div>

                {historyLoading ? (
                  <div className="py-8 text-center text-sm text-gray-500">Loading match history...</div>
                ) : matchHistory.length === 0 ? (
                  <div className="py-8 text-center text-sm text-gray-500 bg-[#FAF6F4] rounded-xl border border-dashed border-[#E8DDD4]">
                    No match history logs recorded yet. Run a match check above to generate logs.
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#FAF6F4] text-[#4A3E3D] font-bold border-b border-[#E8DDD4]">
                          <tr>
                            <th className="p-3">Lost Pet</th>
                            <th className="p-3">Found Pet</th>
                            <th className="p-3">Score</th>
                            <th className="p-3">Matched At</th>
                            <th className="p-3">Email Status</th>
                            <th className="p-3">SMS Status</th>
                            <th className="p-3">Push Status</th>
                            <th className="p-3">Error Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E8DDD4]">
                          {matchHistory.map((log: any) => (
                            <tr key={log.id} className="hover:bg-gray-50">
                              <td className="p-3 font-medium text-[#4A3E3D]">
                                {log.lost_pet_name || 'Unnamed'}
                                <span className="block text-[10px] text-gray-400 font-mono">{log.lost_pet_id ? `${log.lost_pet_id.slice(0, 8)}...` : 'N/A'}</span>
                              </td>
                              <td className="p-3 font-medium text-[#4A3E3D]">
                                {log.found_pet_name || 'Unnamed'}
                                <span className="block text-[10px] text-gray-400 font-mono">{log.found_pet_id ? `${log.found_pet_id.slice(0, 8)}...` : 'N/A'}</span>
                              </td>
                              <td className="p-3">
                                <span className="font-bold text-[#8B5E3C] bg-[#FAF6F4] px-2 py-0.5 rounded border border-[#E8DDD4]">
                                  {log.score}%
                                </span>
                              </td>
                              <td className="p-3 text-gray-500 whitespace-nowrap">
                                {new Date(log.created_at || log.run_at).toLocaleString()}
                              </td>
                              <td className="p-3">
                                <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded ${log.email_status === 'sent' ? 'bg-green-100 text-green-700' : log.email_status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
                                  {log.email_status === 'sent' ? '✓ Sent' : log.email_status === 'failed' ? '✕ Failed' : 'Skipped'}
                                </span>
                              </td>
                              <td className="p-3">
                                <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded ${log.sms_status === 'sent' ? 'bg-green-100 text-green-700' : log.sms_status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
                                  {log.sms_status === 'sent' ? '✓ Sent' : log.sms_status === 'failed' ? '✕ Failed' : 'Skipped'}
                                </span>
                              </td>
                              <td className="p-3">
                                <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded ${log.push_status === 'sent' ? 'bg-green-100 text-green-700' : log.push_status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
                                  {log.push_status === 'sent' ? '✓ Sent' : log.push_status === 'failed' ? '✕ Failed' : 'Skipped'}
                                </span>
                              </td>
                              <td className="p-3 text-gray-500 max-w-xs truncate" title={log.email_error || log.sms_error || log.push_error || 'None'}>
                                {log.email_error || log.sms_error || log.push_error ? (
                                  <span className="text-red-500 font-mono text-[11px]">
                                    {log.email_error ? `Email: ${log.email_error}` : log.sms_error ? `SMS: ${log.sms_error}` : `Push: ${log.push_error}`}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination controls */}
                    {historyTotalPages > 1 && (
                      <div className="flex justify-between items-center mt-4 pt-4 border-t border-[#E8DDD4] text-xs">
                        <button
                          onClick={() => fetchMatchHistory(historyPage - 1)}
                          disabled={historyPage <= 1}
                          className="px-3 py-1.5 bg-[#FAF6F4] border border-[#E8DDD4] rounded-lg disabled:opacity-40 font-bold text-[#4A3E3D]"
                        >
                          &larr; Previous
                        </button>
                        <span className="text-gray-500 font-medium">
                          Page {historyPage} of {historyTotalPages}
                        </span>
                        <button
                          onClick={() => fetchMatchHistory(historyPage + 1)}
                          disabled={historyPage >= historyTotalPages}
                          className="px-3 py-1.5 bg-[#FAF6F4] border border-[#E8DDD4] rounded-lg disabled:opacity-40 font-bold text-[#4A3E3D]"
                        >
                          Next &rarr;
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === 'outreach' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Email Outreach Block */}
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-[#4A3E3D]">Email Outreach</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Send outreach emails to shelters, rescues, and organizations from info@lumobites.net
                    </p>
                  </div>

                  <div className="bg-white border border-[#E8DDD4] rounded-xl p-6 space-y-4">
                    {/* From */}
                    <div>
                      <label className="text-sm font-medium text-[#4A3E3D]">From</label>
                      <input 
                        type="text" 
                        value="info@lumobites.net" 
                        disabled
                        className="w-full mt-1 border border-[#E8DDD4] rounded-xl px-4 py-3 text-sm bg-gray-100"
                      />
                    </div>

                    {/* Subject */}
                    <div>
                      <label className="text-sm font-medium text-[#4A3E3D]">Subject</label>
                      <input
                        type="text"
                        value={outreachSubject}
                        onChange={(e) => setOutreachSubject(e.target.value)}
                        placeholder="Free lost pet tool — would love your thoughts"
                        className="w-full mt-1 border border-[#E8DDD4] rounded-xl px-4 py-3 text-sm"
                      />
                    </div>

                    {/* Recipients */}
                    <div>
                      <label className="text-sm font-medium text-[#4A3E3D]">
                        Recipients (one email per line)
                      </label>
                      <textarea
                        value={outreachEmails}
                        onChange={(e) => setOutreachEmails(e.target.value)}
                        rows={6}
                        placeholder={`info.hsny@verizon.net\ngivemeshelterproject@gmail.com\ncontact@socialteesnyc.org\ninfo@anjelliclecats.com`}
                        className="w-full mt-1 border border-[#E8DDD4] rounded-xl px-4 py-3 text-sm font-mono"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        {outreachEmails.split('\n').filter(e => e.trim()).length} recipients
                      </p>
                    </div>

                    {/* Message */}
                    <div>
                      <label className="text-sm font-medium text-[#4A3E3D]">Message</label>
                      <textarea
                        value={outreachMessage}
                        onChange={(e) => setOutreachMessage(e.target.value)}
                        rows={6}
                        placeholder="Write your outreach email here..."
                        className="w-full mt-1 border border-[#E8DDD4] rounded-xl px-4 py-3 text-sm"
                      />
                    </div>

                    {/* Send Button */}
                    <button
                      onClick={handleSendOutreach}
                      disabled={outreachLoading}
                      className="bg-[#8B5E3C] text-white px-6 py-3 rounded-xl font-medium w-full shadow-sm hover:bg-[#7A5234] transition-colors"
                    >
                      {outreachLoading ? `Sending... (${outreachSentCount} sent)` : 'Send to All Recipients'}
                    </button>

                    {/* Results */}
                    {outreachResults && (
                      <div className="bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl p-4 text-sm space-y-1">
                        <p><strong>✅ Sent:</strong> {outreachResults.sent}</p>
                        <p><strong>❌ Failed:</strong> {outreachResults.failed}</p>
                        {outreachResults.errors?.length > 0 && (
                          <div>
                            <p className="font-bold mt-2">Failed emails:</p>
                            {outreachResults.errors.map((e: any, i: number) => (
                              <p key={i} className="text-red-500 text-xs">{e.email}: {e.error}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* SMS Outreach Block */}
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-[#4A3E3D]">SMS Outreach</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Send SMS to opted-in users only. $0.0079 per message.
                    </p>
                  </div>

                  <div className="bg-white border border-[#E8DDD4] rounded-xl p-6 space-y-4">
                    <div className="bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl p-4 text-xs space-y-1">
                      <p className="font-medium text-[#4A3E3D]">Twilio Account Stats</p>
                      <p className="text-gray-400">
                        Current balance: $19.83 (~2,500 messages)
                      </p>
                    </div>

                    {/* Phone numbers */}
                    <div>
                      <label className="text-sm font-medium text-[#4A3E3D]">
                        Phone Numbers (one per line, include country code)
                      </label>
                      <textarea
                        value={smsNumbers}
                        onChange={(e) => setSmsNumbers(e.target.value)}
                        rows={6}
                        placeholder={"+15025551234\n+15025555678\n+12125559012"}
                        className="w-full mt-1 border border-[#E8DDD4] rounded-xl px-4 py-3 text-sm font-mono"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        {smsNumbers.split('\n').filter(n => n.trim()).length} recipients
                      </p>
                    </div>

                    {/* Message */}
                    <div>
                      <label className="text-sm font-medium text-[#4A3E3D]">
                        Message (160 chars max per SMS)
                      </label>
                      <textarea
                        value={smsMessage}
                        onChange={(e) => setSmsMessage(e.target.value)}
                        rows={4}
                        maxLength={160}
                        placeholder="Your message here... lumobites.net"
                        className="w-full mt-1 border border-[#E8DDD4] rounded-xl px-4 py-3 text-sm"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        {smsMessage.length}/160 characters
                      </p>
                    </div>

                    {/* Send button */}
                    <button
                      onClick={handleSendSMS}
                      disabled={smsLoading}
                      className="bg-[#8B5E3C] text-white px-6 py-3 rounded-xl font-medium w-full shadow-sm hover:bg-[#7A5234] transition-colors"
                    >
                      {smsLoading ? 'Sending...' : 'Send SMS to All'}
                    </button>

                    {/* Results */}
                    {smsResults && (
                      <div className="bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl p-4 text-sm space-y-1">
                        <p>✅ Sent: <strong>{smsResults.sent ?? 0}</strong></p>
                        <p>❌ Failed: <strong>{smsResults.failed ?? 0}</strong></p>
                        <p>💰 Cost: ~$<strong>{((smsResults.sent ?? 0) * 0.0079).toFixed(4)}</strong></p>
                        {smsResults.errors?.length > 0 && (
                          <div className="mt-2">
                            <p className="font-bold text-red-500">Failed numbers:</p>
                            {smsResults.errors.map((e: any, i: number) => (
                              <p key={i} className="text-red-400 text-xs">{e.number}: {e.error}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Outreach History */}
              <div className="bg-white border border-[#E8DDD4] rounded-xl p-6">
                <h3 className="font-bold text-[#4A3E3D] mb-4">Outreach History</h3>
                
                {outreachHistory.length === 0 ? (
                  <p className="text-sm text-gray-400">No outreach emails sent yet</p>
                ) : (
                  <div className="space-y-3">
                    {outreachHistory.map((log: any) => (
                      <div 
                        key={log.id} 
                        className="bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl p-4"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm text-[#4A3E3D]">{log.subject}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(log.sent_at).toLocaleDateString('en-US', { 
                                month: 'short', day: 'numeric', year: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-green-600 font-medium">✅ {log.total_sent} sent</p>
                            {log.total_failed > 0 && (
                              <p className="text-xs text-red-500">❌ {log.total_failed} failed</p>
                            )}
                          </div>
                        </div>
                        
                        {/* Show recipients collapsed */}
                        <details className="mt-2">
                          <summary className="text-xs text-[#8B5E3C] cursor-pointer">
                            View {log.recipients?.length} recipients
                          </summary>
                          <div className="mt-2 space-y-1">
                            {log.recipients?.map((email: string, i: number) => (
                              <p key={i} className="text-xs text-gray-500">{email}</p>
                            ))}
                          </div>
                        </details>

                        {/* Show message preview */}
                        {log.message && (
                          <details className="mt-2">
                            <summary className="text-xs text-[#8B5E3C] cursor-pointer">
                              View message
                            </summary>
                            <div className="mt-2 bg-white border border-[#E8DDD4] rounded-lg p-3">
                              <p className="text-xs text-gray-600 whitespace-pre-wrap">
                                {log.message}
                              </p>
                            </div>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          {activeTab === 'ai-usage' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold text-[#4A3E3D]">AI Usage & Rate Limit Analytics</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Real-time tracking of AI API calls, per-user daily limits (2/day), global $50/mo feature caps, and blocked attempts.
                  </p>
                </div>
                <button
                  onClick={fetchAiUsageStats}
                  disabled={aiUsageLoading}
                  className="px-4 py-2 bg-[#8B5E3C] text-white rounded-xl text-xs font-bold hover:bg-[#7A5234] transition-all disabled:opacity-50"
                >
                  {aiUsageLoading ? 'Refreshing...' : '🔄 Refresh Analytics'}
                </button>
              </div>

              {aiUsageLoading && !aiUsageStats ? (
                <div className="py-12 text-center text-sm text-gray-500 bg-white border border-[#E8DDD4] rounded-xl">
                  Loading AI usage analytics...
                </div>
              ) : aiUsageStats ? (
                <>
                  {/* Top Metric Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white border border-[#E8DDD4] rounded-xl p-4 text-center shadow-sm">
                      <p className="text-xs text-gray-500 font-medium">Today's Total AI Calls</p>
                      <p className="text-2xl font-black text-[#8B5E3C] mt-1">{aiUsageStats.todayTotalCalls || 0}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Across all 6 AI features</p>
                    </div>
                    <div className="bg-white border border-[#E8DDD4] rounded-xl p-4 text-center shadow-sm">
                      <p className="text-xs text-gray-500 font-medium">This Month's Cost</p>
                      <p className="text-2xl font-black text-[#8B5E3C] mt-1">${aiUsageStats.monthTotalCost?.toFixed(2) || '0.00'}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Total across features</p>
                    </div>
                    <div className="bg-white border border-[#E8DDD4] rounded-xl p-4 text-center shadow-sm">
                      <p className="text-xs text-gray-500 font-medium">Most-Used Feature</p>
                      <p className="text-sm font-bold text-[#4A3E3D] mt-2 truncate" title={aiUsageStats.mostUsedToday}>
                        {aiUsageStats.mostUsedToday}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Highest volume today</p>
                    </div>
                    <div className="bg-white border border-[#E8DDD4] rounded-xl p-4 text-center shadow-sm">
                      <p className="text-xs text-gray-500 font-medium">Shared Monthly Cap</p>
                      <p className="text-2xl font-black text-[#8B5E3C] mt-1">${aiUsageStats.monthTotalCost?.toFixed(2) || '0.00'} / ${aiUsageStats.sharedMonthlyCap || 100}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{aiUsageStats.sharedPercentUsed || 0}% of $100 budget used</p>
                    </div>
                  </div>

                  {/* Shared $100 Monthly Budget Progress Bar */}
                  <div className="bg-white border border-[#E8DDD4] rounded-xl p-6 space-y-4 shadow-sm">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-[#4A3E3D] text-base">Shared Monthly Global AI Budget ($100 / Month)</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Total spent across all 6 features combined in current calendar month</p>
                      </div>
                      <span className="font-mono font-bold text-sm text-[#8B5E3C]">
                        ${aiUsageStats.monthTotalCost?.toFixed(2) || '0.00'} / ${aiUsageStats.sharedMonthlyCap || 100} ({aiUsageStats.sharedPercentUsed || 0}%)
                      </span>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          (aiUsageStats.sharedPercentUsed || 0) >= 80
                            ? 'bg-red-500'
                            : (aiUsageStats.sharedPercentUsed || 0) >= 50
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(aiUsageStats.sharedPercentUsed || 0, 100)}%` }}
                      />
                    </div>

                    {/* Breakdown by Feature */}
                    <div className="pt-4 border-t border-[#E8DDD4]">
                      <h4 className="font-bold text-xs text-[#4A3E3D] uppercase tracking-wider mb-3">Feature Breakdown & Contribution</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {aiUsageStats.featureStats?.map((f: any) => (
                          <div key={f.key} className="bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl p-4 space-y-1.5">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-sm text-[#4A3E3D]">{f.name}</span>
                              <span className="text-xs font-mono font-bold text-[#8B5E3C]">${f.monthCost.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-[11px] text-gray-500">
                              <span>Today: <strong>{f.todayCalls}</strong> calls</span>
                              <span>Month: <strong>{f.monthCalls}</strong> calls ({f.percentOfTotalCost}% of spending)</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 7-Day Usage Trend Table */}
                  <div className="bg-white border border-[#E8DDD4] rounded-xl p-6 space-y-4 shadow-sm">
                    <h3 className="font-bold text-[#4A3E3D] text-base">7-Day Daily Usage Trend</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#FAF6F4] text-[#4A3E3D] font-bold border-b border-[#E8DDD4]">
                          <tr>
                            <th className="p-3">Date</th>
                            <th className="p-3">Successful Calls</th>
                            <th className="p-3">Est. Cost ($)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E8DDD4]">
                          {aiUsageStats.dailyTrend?.map((row: any) => (
                            <tr key={row.date} className="hover:bg-gray-50">
                              <td className="p-3 font-mono font-medium text-[#4A3E3D]">{row.date}</td>
                              <td className="p-3 font-bold text-[#8B5E3C]">{row.calls}</td>
                              <td className="p-3 font-mono font-medium text-gray-600">${row.cost.toFixed(3)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-8 text-center text-sm text-gray-500 bg-white border border-[#E8DDD4] rounded-xl">
                  No AI usage data available yet.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
