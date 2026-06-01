'use client';

import React, { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import SitterManagement from '@/components/admin/SitterManagement';
import StatisticsDashboard from '@/components/admin/StatisticsDashboard';
import AccountManagement from '@/components/admin/AccountManagement';
import LostPetsManagement from '@/components/admin/LostPetsManagement';
import ReviewsManagement from '@/components/admin/ReviewsManagement';
import ReferralsManagement from '@/components/admin/ReferralsManagement';
import CityBoardManagement from '@/components/admin/CityBoardManagement';
import RequestsManagement from '@/components/admin/RequestsManagement';
import TwinGalleryManagement from '@/components/admin/TwinGalleryManagement';
import AffiliatesManagement from '@/components/admin/AffiliatesManagement';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'stats' | 'sitters' | 'requests' | 'accounts' | 'lost-pets' | 'reviews' | 'referrals' | 'city-board' | 'twin-gallery' | 'affiliates'>('stats');

  useEffect(() => {
    // Check if we have a saved key in session storage
    const savedKey = sessionStorage.getItem('adminKey');
    if (savedKey) {
      setPassword(savedKey);
      setIsAuthenticated(true);
    }
  }, []);

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
      <div className="min-h-screen bg-[#111] flex flex-col items-center justify-center p-4">
        <div className="bg-[#1a1a1a] p-8 rounded-2xl w-full max-w-md border border-white/10 shadow-2xl">
          <h1 className="text-2xl font-bold text-white mb-6 text-center">Admin Access</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">Bypass Key</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#c2e59c] transition-colors"
                placeholder="Enter bypass key..."
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
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
    <div className="min-h-screen bg-[#111] text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Settings className="w-8 h-8 text-[#64b3f4]" />
            Lumo Bites Admin
          </h1>
          <button
            onClick={handleLogout}
            className="text-white/60 hover:text-white transition-colors text-sm font-medium"
          >
            Logout
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-2 bg-[#1a1a1a] p-1 rounded-xl mb-8 border border-white/10 overflow-x-auto">
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
              activeTab === 'stats'
                ? 'bg-gradient-to-r from-[#c2e59c] to-[#64b3f4] text-black shadow-lg'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            Statistics
          </button>
          <button
            onClick={() => setActiveTab('sitters')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
              activeTab === 'sitters'
                ? 'bg-gradient-to-r from-[#c2e59c] to-[#64b3f4] text-black shadow-lg'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            Sitter Management
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
              activeTab === 'requests'
                ? 'bg-gradient-to-r from-[#c2e59c] to-[#64b3f4] text-black shadow-lg'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            Sitting Requests
          </button>
          <button
            onClick={() => setActiveTab('accounts')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
              activeTab === 'accounts'
                ? 'bg-gradient-to-r from-[#c2e59c] to-[#64b3f4] text-black shadow-lg'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            All Accounts
          </button>
          <button
            onClick={() => setActiveTab('lost-pets')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
              activeTab === 'lost-pets'
                ? 'bg-gradient-to-r from-[#c2e59c] to-[#64b3f4] text-black shadow-lg'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            Lost Pets
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
              activeTab === 'reviews'
                ? 'bg-gradient-to-r from-[#c2e59c] to-[#64b3f4] text-black shadow-lg'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            Reviews
          </button>
          <button
            onClick={() => setActiveTab('referrals')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
              activeTab === 'referrals'
                ? 'bg-gradient-to-r from-[#c2e59c] to-[#64b3f4] text-black shadow-lg'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            Referrals
          </button>
          <button
            onClick={() => setActiveTab('city-board')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
              activeTab === 'city-board'
                ? 'bg-gradient-to-r from-[#c2e59c] to-[#64b3f4] text-black shadow-lg'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            City Board
          </button>
          <button
            onClick={() => setActiveTab('twin-gallery')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
              activeTab === 'twin-gallery'
                ? 'bg-gradient-to-r from-[#c2e59c] to-[#64b3f4] text-black shadow-lg'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            Pet Twin Gallery
          </button>
          <button
            onClick={() => setActiveTab('affiliates')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
              activeTab === 'affiliates'
                ? 'bg-gradient-to-r from-[#c2e59c] to-[#64b3f4] text-black shadow-lg'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            Affiliates
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-[#1a1a1a] rounded-2xl border border-white/10 p-6 min-h-[500px]">
          {activeTab === 'stats' && <StatisticsDashboard adminKey={password} onUnauthorized={handleLogout} />}
          {activeTab === 'sitters' && <SitterManagement adminKey={password} onUnauthorized={handleLogout} />}
          {activeTab === 'requests' && <RequestsManagement adminKey={password} onUnauthorized={handleLogout} />}
          {activeTab === 'accounts' && <AccountManagement adminKey={password} onUnauthorized={handleLogout} />}
          {activeTab === 'lost-pets' && <LostPetsManagement adminKey={password} onUnauthorized={handleLogout} />}
          {activeTab === 'reviews' && <ReviewsManagement adminKey={password} onUnauthorized={handleLogout} />}
          {activeTab === 'referrals' && <ReferralsManagement adminKey={password} onUnauthorized={handleLogout} />}
          {activeTab === 'city-board' && <CityBoardManagement adminKey={password} onUnauthorized={handleLogout} />}
          {activeTab === 'twin-gallery' && <TwinGalleryManagement adminKey={password} onUnauthorized={handleLogout} />}
          {activeTab === 'affiliates' && <AffiliatesManagement adminKey={password} onUnauthorized={handleLogout} />}
        </div>
      </div>
    </div>
  );
}
