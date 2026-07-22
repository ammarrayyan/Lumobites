'use client';

import React, { useState, useEffect } from 'react';
import { Building2, CheckCircle2, XCircle, Clock, Globe, Phone, Mail, MapPin, Search } from 'lucide-react';

interface Shelter {
  id: string;
  org_name: string;
  tax_id?: string;
  email: string;
  phone?: string;
  address?: string;
  city: string;
  state?: string;
  zip?: string;
  website?: string;
  org_photo_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export default function ShelterManagement({ adminKey }: { adminKey: string }) {
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [tableError, setTableError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const fetchShelters = async () => {
    setLoading(true);
    setTableError(null);
    try {
      const res = await fetch('/api/admin/shelters', {
        headers: { 'x-admin-key': adminKey }
      });
      if (res.ok) {
        const data = await res.json();
        setShelters(data.shelters || []);
      } else {
        const errData = await res.json().catch(() => ({}));
        if (errData.error && errData.error.includes('schema cache')) {
          setTableError("Database table 'shelters' does not exist in Supabase yet. Please execute the SQL migration script in your Supabase Dashboard SQL Editor.");
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch shelters:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShelters();
  }, [adminKey]);

  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
    setProcessingId(id);
    try {
      const res = await fetch('/api/admin/shelters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey
        },
        body: JSON.stringify({ id, status })
      });
      if (res.ok) {
        setShelters(prev => prev.map(s => s.id === id ? { ...s, status } : s));
      }
    } catch (err) {
      alert('Failed to update status');
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = shelters.filter(s => {
    const matchesSearch = s.org_name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase()) || s.city.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = shelters.filter(s => s.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-[#E8DDD4] shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-[#191919] flex items-center gap-2">
            <Building2 className="w-6 h-6 text-[#8B5E3C]" /> Shelter & Rescue Applications
          </h2>
          <p className="text-xs text-gray-500 mt-1">Review organization registration submissions and approve shelter accounts</p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {(['pending', 'approved', 'rejected', 'all'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer capitalize border ${
                statusFilter === st
                  ? 'bg-[#8B5E3C] text-white border-[#8B5E3C]'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {st} {st === 'pending' && pendingCount > 0 && `(${pendingCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* SQL Migration Needed Banner */}
      {tableError && (
        <div className="bg-amber-50 border border-amber-300 p-5 rounded-2xl space-y-3 text-amber-900 text-xs">
          <div className="flex items-center justify-between gap-2 font-bold text-sm text-amber-900">
            <span>⚠️ Database Table Setup Required</span>
            <button
              onClick={fetchShelters}
              className="bg-[#8B5E3C] hover:bg-[#734A2E] text-white font-bold py-1.5 px-3 rounded-xl text-xs cursor-pointer border-none"
            >
              Re-check Status
            </button>
          </div>
          <p className="leading-relaxed">
            The <strong>shelters</strong>, <strong>adoption_pets</strong>, and <strong>adoption_messages</strong> tables do not exist in your live Supabase database yet. Please copy the script below and run it in your <strong>Supabase Dashboard &rarr; SQL Editor</strong>.
          </p>

          <div className="relative bg-gray-900 text-amber-300 p-4 rounded-xl font-mono text-[11px] overflow-x-auto">
            <button
              onClick={() => {
                const sqlText = `CREATE TABLE IF NOT EXISTS shelters (\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  org_name TEXT NOT NULL,\n  tax_id TEXT,\n  email TEXT UNIQUE NOT NULL,\n  phone TEXT,\n  address TEXT,\n  city TEXT NOT NULL,\n  state TEXT,\n  zip TEXT,\n  website TEXT,\n  status TEXT DEFAULT 'pending',\n  created_at TIMESTAMPTZ DEFAULT NOW()\n);\n\nCREATE TABLE IF NOT EXISTS adoption_pets (\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  shelter_id UUID REFERENCES shelters(id) ON DELETE CASCADE,\n  name TEXT NOT NULL,\n  species TEXT NOT NULL DEFAULT 'dog',\n  breed TEXT,\n  age TEXT NOT NULL DEFAULT 'adult',\n  size TEXT NOT NULL DEFAULT 'medium',\n  sex TEXT NOT NULL DEFAULT 'male',\n  spayed_neutered BOOLEAN DEFAULT TRUE,\n  temperament TEXT,\n  description TEXT,\n  adoption_fee TEXT,\n  adoption_process TEXT,\n  photo_urls TEXT[] DEFAULT '{}',\n  status TEXT DEFAULT 'available',\n  city TEXT NOT NULL,\n  state TEXT,\n  zip TEXT,\n  created_at TIMESTAMPTZ DEFAULT NOW()\n);\n\nCREATE TABLE IF NOT EXISTS adoption_messages (\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  pet_id UUID REFERENCES adoption_pets(id) ON DELETE CASCADE,\n  shelter_id UUID REFERENCES shelters(id) ON DELETE CASCADE,\n  sender_email TEXT NOT NULL,\n  receiver_email TEXT NOT NULL,\n  message TEXT NOT NULL,\n  read BOOLEAN DEFAULT FALSE,\n  created_at TIMESTAMPTZ DEFAULT NOW()\n);`;
                navigator.clipboard.writeText(sqlText);
                setCopySuccess(true);
                setTimeout(() => setCopySuccess(false), 3000);
              }}
              className="absolute right-3 top-3 bg-amber-600 hover:bg-amber-700 text-white font-sans text-xs font-bold py-1 px-3 rounded-lg border-none cursor-pointer"
            >
              {copySuccess ? '✓ Copied to Clipboard!' : 'Copy SQL Script'}
            </button>
            <pre className="whitespace-pre leading-relaxed">
{`CREATE TABLE IF NOT EXISTS shelters (...);
CREATE TABLE IF NOT EXISTS adoption_pets (...);
CREATE TABLE IF NOT EXISTS adoption_messages (...);`}
            </pre>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Search shelters by name, email, or city…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-white border border-[#E8DDD4] rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#8B5E3C]"
        />
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="text-center py-12 text-xs text-gray-400 font-medium">Loading shelter applications…</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-[#E8DDD4] text-center space-y-2">
          <p className="font-bold text-gray-700 text-sm">No shelter applications found</p>
          <p className="text-xs text-gray-400">Applications matching your filter will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(shelter => (
            <div key={shelter.id} className="bg-white rounded-2xl border border-[#E8DDD4] p-5 shadow-xs flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
              <div className="flex items-start md:items-center gap-4 min-w-0 flex-1">
                {shelter.org_photo_url ? (
                  <img src={shelter.org_photo_url} alt={shelter.org_name} className="w-12 h-12 rounded-xl object-cover border border-gray-200 shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800 shrink-0 font-bold">
                    <Building2 className="w-6 h-6" />
                  </div>
                )}
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-base text-gray-900">{shelter.org_name}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${
                      shelter.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : shelter.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {shelter.status}
                    </span>
                    {shelter.tax_id && (
                      <span className="bg-gray-100 text-gray-700 text-[11px] font-bold px-2 py-0.5 rounded-md">
                        EIN/ID: {shelter.tax_id}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs text-gray-600">
                    <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" /> {shelter.email}</div>
                    {shelter.phone && <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" /> {shelter.phone}</div>}
                    <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" /> {shelter.city}{shelter.state ? `, ${shelter.state}` : ''} {shelter.zip}</div>
                    {shelter.website && (
                      <div className="flex items-center gap-1.5 sm:col-span-2">
                        <Globe className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <a href={shelter.website.startsWith('http') ? shelter.website : `https://${shelter.website}`} target="_blank" rel="noreferrer" className="text-blue-600 underline font-medium truncate">
                          {shelter.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {shelter.status !== 'approved' && (
                  <button
                    onClick={() => handleUpdateStatus(shelter.id, 'approved')}
                    disabled={processingId === shelter.id}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-4 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer border-none"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Approve
                  </button>
                )}
                {shelter.status !== 'rejected' && (
                  <button
                    onClick={() => handleUpdateStatus(shelter.id, 'rejected')}
                    disabled={processingId === shelter.id}
                    className="bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs py-2 px-4 rounded-xl transition-all border border-red-200 flex items-center gap-1.5 cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
