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
import BroadcastManagement from '@/components/admin/BroadcastManagement';
import ShelterManagement from '@/components/admin/ShelterManagement';
import AdoptionPetsManagement from '@/components/admin/AdoptionPetsManagement';
import IntegrationsManagement from '@/components/admin/IntegrationsManagement';
import VetClinicManagement from '@/components/admin/VetClinicManagement';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'stats' | 'sitters' | 'shelters' | 'vet-clinics' | 'requests' | 'accounts' | 'lost-pets' | 'adoption-pets' | 'reviews' | 'city-board' | 'twin-gallery' | 'affiliates' | 'reports' | 'pet-matching' | 'outreach' | 'broadcast' | 'integrations'>('stats');

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
          'x-admin-secret': 'Lumo2026@'
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
        headers: { 'x-admin-secret': 'Lumo2026@' }
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
        'x-admin-secret': 'Lumo2026@'
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
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 min-h-[500px]">
          {activeTab === 'stats' && <StatisticsDashboard adminKey={password} onUnauthorized={handleLogout} />}
          {activeTab === 'sitters' && <SitterManagement adminKey={password} onUnauthorized={handleLogout} />}
          {activeTab === 'shelters' && <ShelterManagement adminKey={password} />}
          {activeTab === 'vet-clinics' && <VetClinicManagement adminKey={password} />}
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
        </div>
      </div>
    </div>
  );
}
