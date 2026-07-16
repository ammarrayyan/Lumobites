'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import NotificationBell from './NotificationBell';
import ShareButton from './ShareButton';
import { Footprints, MessageSquare, Settings, LogOut, Sparkles, Utensils, Bell, Check, Globe, Menu, X } from 'lucide-react';
import { app, getToken, getMessaging } from '@/lib/firebase';

const getInitialProEmail = () => {
  try {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('lumo_pro_email') || '';
    }
  } catch (e) {}
  return '';
};

const getInitialSitterEmail = () => {
  try {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('lumo_sitter_email') || '';
    }
  } catch (e) {}
  return '';
};

const getInitialIsSignedIn = () => {
  try {
    if (typeof window !== 'undefined') {
      const email = localStorage.getItem('lumo_pro_email');
      const isAdminBypass = localStorage.getItem('lumo_admin_bypass') === 'true';
      const isOwnerEmail = email?.toLowerCase().trim() === 'premierpetnutritionllc@gmail.com' || email?.toLowerCase().trim() === 'reviewer@lumobites.net';
      return !!(isAdminBypass || isOwnerEmail || (email && email !== 'undefined' && email !== 'null' && email.trim() !== ''));
    }
  } catch (e) {}
  return false;
};

const getInitialIsPro = () => {
  try {
    if (typeof window !== 'undefined') {
      const email = localStorage.getItem('lumo_pro_email');
      const isAdminBypass = localStorage.getItem('lumo_admin_bypass') === 'true';
      const isOwnerEmail = email?.toLowerCase().trim() === 'premierpetnutritionllc@gmail.com' || email?.toLowerCase().trim() === 'reviewer@lumobites.net';
      return !!(isAdminBypass || isOwnerEmail);
    }
  } catch (e) {}
  return false;
};

interface NavbarProps {
  initialEmail?: string;
}

export default function Navbar({ initialEmail = '' }: NavbarProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [showPushBanner, setShowPushBanner] = useState(false);
  const [isPro, setIsPro] = useState(() => {
    if (initialEmail) {
      const isOwnerEmail = initialEmail.toLowerCase().trim() === 'premierpetnutritionllc@gmail.com' || initialEmail.toLowerCase().trim() === 'reviewer@lumobites.net';
      if (isOwnerEmail) return true;
    }
    return getInitialIsPro();
  });
  const [isSignedIn, setIsSignedIn] = useState(() => {
    if (initialEmail) return true;
    return getInitialIsSignedIn();
  });
  const [proEmail, setProEmail] = useState(() => {
    if (initialEmail) return initialEmail;
    return getInitialProEmail();
  });
  const [sitterEmail, setSitterEmail] = useState(getInitialSitterEmail);
  const [showProMenu, setShowProMenu] = useState(false);
  const [showUpgradeMenu, setShowUpgradeMenu] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [signInStep, setSignInStep] = useState<'email' | 'code'>('email');
  const [signInEmail, setSignInEmail] = useState('');
  const [signInCode, setSignInCode] = useState('');
  const [signInError, setSignInError] = useState('');
  const [signInLoading, setSignInLoading] = useState(false);
  const [alreadyProMsg, setAlreadyProMsg] = useState(false);
  const [currentLang, setCurrentLang] = useState('en');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [hasTermsAccepted, setHasTermsAccepted] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const accepted = localStorage.getItem('lumo_terms_accepted') === 'true';
      setHasTermsAccepted(accepted);
    }
  }, [showSignInModal]);

  const syncStatus = () => {
    if (typeof window === 'undefined') return;
    const cachedEmail = localStorage.getItem('lumo_pro_email');
    const cachedSitter = localStorage.getItem('lumo_sitter_email');
    setSitterEmail(cachedSitter || '');
    
    const isAdminBypass = localStorage.getItem('lumo_admin_bypass') === 'true';
    const isOwnerEmail = cachedEmail?.toLowerCase().trim() === 'premierpetnutritionllc@gmail.com' || cachedEmail?.toLowerCase().trim() === 'reviewer@lumobites.net';
    
    if (isAdminBypass || isOwnerEmail) {
      setIsPro(true);
      setIsSignedIn(true);
      setProEmail(cachedEmail || 'admin@lumobites.com');
    } else if (cachedEmail && cachedEmail !== 'undefined' && cachedEmail !== 'null' && cachedEmail.trim() !== '') {
      setIsSignedIn(true);
      setProEmail(cachedEmail);
      // isPro state will be handled by the API call in useEffect
    } else {
      setIsPro(false);
      setIsSignedIn(false);
      setProEmail('');
    }
  };

  useEffect(() => {
    syncStatus();
    
    if (typeof window !== 'undefined' && window.location.search.includes('signin=true')) {
      setShowSignInModal(true);
      setSignInStep('email');
      setSignInError('');
    }
    
    const match = document.cookie.match(/(?:^|;)\s*googtrans=([^;]*)/);
    if (match) {
      const parts = match[1].split('/');
      if (parts.length > 2) {
        const langCode = parts[2];
        setCurrentLang(langCode);
        document.documentElement.dir = langCode === 'ar' ? 'rtl' : 'ltr';
      }
    }
    
    // Add listeners for custom state synchronization
    window.addEventListener('lumo-pro-update', syncStatus);
    window.addEventListener('storage', syncStatus);

    // Dynamic database check if cached email exists
    const cachedEmail = localStorage.getItem('lumo_pro_email');
    const isAdminBypass = localStorage.getItem('lumo_admin_bypass') === 'true';
    const isOwnerEmail = cachedEmail?.toLowerCase().trim() === 'premierpetnutritionllc@gmail.com' || cachedEmail?.toLowerCase().trim() === 'reviewer@lumobites.net';

    if (cachedEmail && !isAdminBypass && !isOwnerEmail && cachedEmail !== 'undefined' && cachedEmail !== 'null' && cachedEmail.trim() !== '') {
      fetch('/api/stripe/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cachedEmail })
      })
      .then(res => res.json())
      .then(data => {
        if (data && data.session_invalidated_at) {
          const sessionStarted = localStorage.getItem('lumo_session_started_at');
          if (sessionStarted) {
            const startedDate = new Date(sessionStarted);
            const invalidatedDate = new Date(data.session_invalidated_at);
            if (invalidatedDate > startedDate) {
              localStorage.clear();
              document.cookie = 'lumo_pro_email=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
              alert("You have been signed out of all devices for security.");
              window.location.href = "/";
              return;
            }
          }
        }
        if (data.isPro) {
          setIsPro(true);
        } else {
          setIsPro(false);
          // Do NOT remove lumo_pro_email because they could be a free sitter signed in
          window.dispatchEvent(new Event('lumo-pro-update'));
        }
      })
      .catch((err) => {
        console.error('[Lumo Subscription] Failed to sync status with Supabase:', err);
      });
    }

    const cachedSitter = localStorage.getItem('lumo_sitter_email');
    if (cachedSitter && cachedSitter !== 'undefined' && cachedSitter !== 'null' && cachedSitter.trim() !== '') {
      fetch(`/api/petsitting/profile?email=${encodeURIComponent(cachedSitter)}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.session_invalidated_at) {
          const sessionStarted = localStorage.getItem('lumo_session_started_at');
          if (sessionStarted) {
            const startedDate = new Date(sessionStarted);
            const invalidatedDate = new Date(data.session_invalidated_at);
            if (invalidatedDate > startedDate) {
              localStorage.clear();
              document.cookie = 'lumo_pro_email=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
              alert("You have been signed out of all devices for security.");
              window.location.href = "/";
            }
          }
        }
      })
      .catch(err => {
        console.error('[Navbar Sitter Check] Failed to check status:', err);
      });
    }

    const handleOpenSignIn = () => {
      setShowSignInModal(true);
      setSignInStep('email');
      setSignInError('');
    };
    window.addEventListener('lumo-open-signin', handleOpenSignIn);

    return () => {
      window.removeEventListener('lumo-pro-update', syncStatus);
      window.removeEventListener('storage', syncStatus);
      window.removeEventListener('lumo-open-signin', handleOpenSignIn);
    };
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const email = proEmail || sitterEmail || localStorage.getItem('lumo_pro_email') || localStorage.getItem('lumo_sitter_email');
      const dismissed = localStorage.getItem('lumo_push_banner_dismissed') === 'true';
      const supportsPush = 'Notification' in window && 'serviceWorker' in navigator;
      
      if (email && !dismissed && supportsPush && Notification.permission === 'default') {
        setShowPushBanner(true);
      } else {
        setShowPushBanner(false);
      }
    }
  }, [isSignedIn, proEmail, sitterEmail]);

  const handleEnableNotifications = async () => {
    try {
      if (!('Notification' in window)) return;
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const messaging = getMessaging(app);
        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
        });
        
        if (token) {
          const email = proEmail || sitterEmail || localStorage.getItem('lumo_pro_email') || localStorage.getItem('lumo_sitter_email');
          if (email) {
            await fetch('/api/push/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, token, device: navigator.userAgent })
            });
            console.log('[Navbar] Registered token for:', email);
          }
        }
        setShowPushBanner(false);
      } else {
        localStorage.setItem('lumo_push_banner_dismissed', 'true');
        setShowPushBanner(false);
      }
    } catch (err) {
      console.error('[Navbar] Error enabling notifications:', err);
      setShowPushBanner(false);
    }
  };

  const handleSignOut = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('lumo_pro_email');
      localStorage.removeItem('lumo_sitter_email');
      localStorage.removeItem('lumo_sitter_id');
      localStorage.removeItem('lumo_admin_bypass');
      document.cookie = 'lumo_pro_email=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      
      // Clear all reaction data on sign out
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('reacted_') || key === 'lumo_device_id') {
          localStorage.removeItem(key);
        }
      });
    }
    setIsPro(false);
    setIsSignedIn(false);
    setProEmail('');
    setShowProMenu(false);
    
    // Broadcast auth change
    window.dispatchEvent(new Event('lumo-pro-update'));
    
    // Force clean page refresh
    window.location.reload();
  };

  const handleUpgradeCheckout = async (prefilledEmail?: string) => {
    if (prefilledEmail) {
      setSignInEmail(prefilledEmail.trim());
    }
    setSignInStep('email');
    setSignInError('');
    setAlreadyProMsg(false);
    setShowSignInModal(true);
  };

  const handleSignInSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInLoading(true);
    setSignInError('');
    try {
      // Try PRO table first
      let res = await fetch('/api/stripe/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: signInEmail })
      });
      
      let isNotPro = false;
      let stripeErr = '';
      if (!res.ok) {
        const data = await res.json();
        if (data.error === 'not_pro') {
          isNotPro = true;
        }
        stripeErr = data.message || data.error || 'Failed to send code';
        
        // If not PRO, try Sitters table
        const sitterRes = await fetch('/api/petsitting/auth/send-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: signInEmail }) // checks sitters
        });
        
        if (sitterRes.ok) {
          setSignInStep('code');
          return;
        }
        
        if (isNotPro) {
          setSignInError('not_pro');
          return;
        }
        
        throw new Error(stripeErr || 'Account not found. Please ensure you are a PRO member or have a Sitter profile.');
      } else {
        setSignInStep('code');
      }
    } catch(err: any) {
      setSignInError(err.message);
    } finally {
      setSignInLoading(false);
    }
  };

  const handleSignInVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInLoading(true);
    setSignInError('');
    try {
      const res = await fetch('/api/stripe/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: signInEmail, code: signInCode })
      });
      
      const verifyData = await res.json();
      if (!res.ok) {
        throw new Error(verifyData.error || 'Invalid or expired verification code.');
      }

      localStorage.setItem('lumo_pro_email', signInEmail);
      localStorage.setItem('lumo_terms_accepted', 'true');
      document.cookie = `lumo_pro_email=${signInEmail}; path=/; max-age=2592000`; // 30 days
      if (verifyData.isSitter) {
        localStorage.setItem('lumo_sitter_email', signInEmail);
        localStorage.setItem('lumo_sitter_id', verifyData.sitterId);
      }
      localStorage.setItem('lumo_session_started_at', new Date().toISOString());
      syncStatus();
      setShowSignInModal(false);
      setSignInStep('email');
      setSignInCode('');
      setSignInEmail('');

      if (verifyData.existed) {
        alert('Welcome back! ✨');
      } else {
        alert('Account created! 🐾');
      }
      
      // Force status re-check
      const statusRes = await fetch('/api/stripe/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: signInEmail })
      });
      const data = await statusRes.json();
      if (data.isPro) {
        setIsPro(true);
      } else {
        setIsPro(false);
      }
      setIsSignedIn(true);
      setProEmail(signInEmail);
      window.dispatchEvent(new Event('lumo-pro-update'));
      
      const redirect = localStorage.getItem('lumo_redirect_after_login');
      if (redirect) {
        localStorage.removeItem('lumo_redirect_after_login');
        router.push(redirect);
      }
      
    } catch(err: any) {
      setSignInError(err.message);
    } finally {
      setSignInLoading(false);
    }
  };

  return (
    <>
    <nav 
      className="fixed top-0 left-0 right-0 z-50 border-b border-[#EEEEEE]"
      style={{ 
        paddingTop: 'max(env(safe-area-inset-top), 44px)',
        backgroundColor: 'white',
        boxShadow: '0 1px 10px rgba(0,0,0,0.08)'
      }}
    >
      {/* Make sure X button is clearly visible when menu is open */}
      {isOpen && (
        <button
          onClick={() => setIsOpen(false)}
          className="p-2 rounded-full bg-gray-100 text-[#4A3E3D] border-none cursor-pointer flex items-center justify-center"
          style={{
            position: 'absolute',
            top: 'calc(env(safe-area-inset-top) + 60px)',
            left: '16px',
            zIndex: 9999,
          }}
        >
          <X className="w-6 h-6" />
        </button>
      )}
      {/* Desktop & Mobile Header Container */}
      <div className="px-4 md:px-6 xl:px-[48px] h-[72px] flex items-center justify-between">
        <div className="flex items-center">
          {/* Hamburger Menu Toggle */}
          <button 
            className="xl:hidden mr-3 text-[#8B5E3C] p-2 hover:bg-[#FDF9F5] rounded-lg transition-colors cursor-pointer border-none bg-transparent flex items-center justify-center"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          
          {/* Left: Logo */}
          <Link href="/" className="flex items-center" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', transform: 'scale(1.4)', transformOrigin: 'left center', margin: '-15px 0' }} className="origin-left">
              <img src="/Logo.png" alt="Lumo Bites" className="h-[40px] w-auto block object-contain" />
              <sup style={{ fontSize: '10px', color: '#8B5A2B', fontWeight: 'bold', alignSelf: 'flex-start', marginTop: '5px', marginLeft: '2px', fontFamily: 'sans-serif', userSelect: 'none' }}>™</sup>
            </div>
          </Link>
        </div>

        {/* Right: Desktop Links & Share */}
        <div className="hidden xl:flex items-center gap-2 lg:gap-4 xl:gap-6 ml-auto">

          {/* Pet Sitting */}
          <Link href="/petsitting" className="text-[#666666] font-medium hover:text-[#8B5E3C] transition-colors flex items-center nav-link whitespace-nowrap" style={{ fontSize: 'var(--text-nav)' }}>
            <svg className="w-4 h-4 inline-block mr-1.5 align-middle text-[#8B5E3C]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Pet Sitting
          </Link>

          {/* Safety Check */}
          <Link href="/scan" className="text-[#666666] font-medium hover:text-[#8B5E3C] transition-colors flex items-center nav-link whitespace-nowrap" style={{ fontSize: 'var(--text-nav)' }}>
            <svg className="w-4 h-4 inline-block mr-1.5 align-middle" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Safety Check
          </Link>

          {/* Find Food */}
          <Link href="/chat" className="text-[#666666] font-medium hover:text-[#8B5E3C] transition-colors flex items-center nav-link whitespace-nowrap" style={{ fontSize: 'var(--text-nav)' }}>
            <Utensils className="w-4 h-4 inline-block mr-1.5 align-middle text-[#8B5E3C]" strokeWidth={2.5} />
            Find Food
          </Link>

          {/* Lost Pets */}
          <Link href="/lost-pets" className="text-[#666666] font-medium hover:text-[#8B5E3C] transition-colors flex items-center nav-link whitespace-nowrap" style={{ fontSize: 'var(--text-nav)' }}>
            <Footprints className="w-4 h-4 inline-block mr-1.5 align-middle text-[#8B5E3C]" strokeWidth={2.5} />
            Lost Pets
          </Link>

          {/* City Board */}
          <Link href="/city-board" className="text-[#666666] font-medium hover:text-[#8B5E3C] transition-colors flex items-center nav-link whitespace-nowrap" style={{ fontSize: 'var(--text-nav)' }}>
            <MessageSquare className="w-4 h-4 inline-block mr-1.5 align-middle text-[#8B5E3C]" strokeWidth={2.5} />
            City Board
          </Link>

          {/* Recalls */}
          <Link href="/recalls" className="text-[#666666] font-medium hover:text-[#8B5E3C] transition-colors flex items-center nav-link whitespace-nowrap" style={{ fontSize: 'var(--text-nav)' }}>
            <svg className="w-4 h-4 inline-block mr-1.5 align-middle text-[#D97706]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Recalls
          </Link>

          {/* Pet Supplies */}
          <Link href="/supplies" className="text-[#666666] font-medium hover:text-[#8B5E3C] transition-colors flex items-center nav-link whitespace-nowrap" style={{ fontSize: 'var(--text-nav)' }}>
            <svg className="w-4 h-4 inline-block mr-1.5 align-middle text-[#666666] hover:text-[#8B5E3C]" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="4.5" cy="11.5" r="2.5" />
              <circle cx="9.5" cy="7.5" r="2.5" />
              <circle cx="14.5" cy="7.5" r="2.5" />
              <circle cx="19.5" cy="11.5" r="2.5" />
              <path d="M12 21.5c-3 0-5.5-2.5-5.5-5.5s2.5-4.5 5.5-4.5 5.5 1.5 5.5 4.5-2.5 5.5-5.5 5.5z" />
            </svg>
            Pet Supplies
          </Link>

          {/* Pet Twin */}
          <Link href="/twin" className="text-[#8B5E3C] font-bold hover:underline transition-all flex items-center nav-link whitespace-nowrap" style={{ fontSize: 'var(--text-nav)' }}>
            <svg className="w-4 h-4 inline-block mr-1.5 align-middle text-[#8B5E3C]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l-.813-5.096L3 15l5.096-.813L9 9l.813 5.096L15 15l-5.096.813zM19.071 4.929l-.244 1.533-.244-1.533L17.05 4.685l1.533-.244.244-1.533.244 1.533 1.533.244-1.533.244z" />
            </svg>
            Pet Twin
          </Link>

          {/* Explore */}
          <Link href="/explore" className="text-[#666666] font-medium hover:text-[#8B5E3C] transition-colors flex items-center nav-link whitespace-nowrap" style={{ fontSize: 'var(--text-nav)' }}>
            <Globe className="w-4 h-4 inline-block mr-1.5 align-middle text-[#8B5E3C]" strokeWidth={2.5} />
            Explore
          </Link>

          <div className="pl-2 lg:pl-4 border-l border-[#EEEEEE] flex items-center gap-2 lg:gap-4" suppressHydrationWarning={true}>
            <ShareButton />
            {proEmail && <NotificationBell email={proEmail} />}
            
            {!isPro && (
              <>
                {/* Desktop only - simplified */}
                <div className="hidden md:flex flex-col items-center relative group">
                  <button 
                    onClick={() => { setShowSignInModal(true); setSignInStep('email'); setSignInError(''); }}
                    className="bg-[#8B5E3C] hover:bg-[#734A2E] text-white px-6 py-2 rounded-xl font-medium transition-colors shadow-sm"
                  >
                    Sign In
                  </button>
                  {/* Tooltip to avoid breaking navbar layout */}
                  <div className="absolute top-[120%] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-white border border-[#E8DDD4] shadow-md rounded-lg p-3 w-[250px] right-0 z-50 text-center">
                    <p className="text-xs text-gray-500">
                      New or returning? Use the same button — enter your email to continue.
                    </p>
                  </div>
                </div>

                {/* Mobile - keep exactly as is */}
                <div className="md:hidden relative">
                  <button
                    onClick={() => setShowUpgradeMenu(!showUpgradeMenu)}
                    className="bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-sm transition-colors flex items-center gap-1"
                  >
                    Create Free Account <Sparkles className="w-3 h-3" />
                  </button>
                  {showUpgradeMenu && (
                    <>
                      <div className="fixed inset-0 z-40 bg-transparent cursor-default" onClick={() => setShowUpgradeMenu(false)} />
                      <div className="absolute right-0 mt-2.5 w-64 bg-white border border-[#D97706]/30 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] p-2 z-50 flex flex-col gap-1 animate-fade-in text-left">
                        <button 
                          onClick={() => { setShowUpgradeMenu(false); handleUpgradeCheckout(); }} 
                          className="w-full text-left bg-[#FFFBF5] hover:bg-[#F5EDE4] border border-[#E8D5C0] rounded-xl p-3 transition-colors cursor-pointer"
                        >
                          <span className="block text-[#8B5E3C] font-bold text-sm mb-1">🌟 Create Your Free Account</span>
                          <span className="block text-[#666666] text-[11px] mb-1.5 leading-tight">Verified sitters + email recalls + unlimited scans</span>
                        </button>
                        <div className="flex items-center my-2 px-3">
                          <div className="flex-grow border-t border-gray-150"></div>
                          <span className="flex-shrink mx-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider">or</span>
                          <div className="flex-grow border-t border-gray-150"></div>
                        </div>
                        <div className="px-3 pb-2 pt-1 text-center flex flex-col gap-1.5">
                          <span className="text-[11px] text-gray-500 font-bold leading-tight">Already have an account?</span>
                          <button
                            onClick={() => { setShowUpgradeMenu(false); setShowSignInModal(true); setSignInStep('email'); setSignInError(''); }}
                            className="w-full bg-[#8B5E3C] hover:bg-[#734A2E] text-white text-[11px] font-bold py-2.5 px-4 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                            style={{
                              marginBottom: 'env(safe-area-inset-bottom, 20px)'
                            }}
                          >
                            Sign in to access your account →
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}

            {isSignedIn && (
              <div className="relative">
                <button
                  onClick={() => setShowProMenu(!showProMenu)}
                  className="w-8 h-8 rounded-full bg-[#C17D3C] hover:bg-[#B06D2B] text-white font-[800] flex items-center justify-center text-[13px] shadow-[0_2px_8px_rgba(193,125,60,0.25)] cursor-pointer border-none transition-colors select-none"
                  title={proEmail || sitterEmail || 'Account'}
                >
                  {proEmail || sitterEmail ? (proEmail || sitterEmail).charAt(0).toUpperCase() : 'U'}
                </button>

                {showProMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-40 bg-transparent cursor-default" 
                      onClick={() => setShowProMenu(false)}
                    />
                    
                    <div className="absolute right-0 mt-2.5 w-52 bg-white border border-[#E8DDD4] rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.08)] p-2 z-50 flex flex-col gap-1 animate-fade-in text-left">
                      <div className="px-3 py-2 border-b border-gray-150 text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate select-none">
                        {proEmail || "User Account"}
                      </div>
                      <Link 
                        href="/account"
                        onClick={() => setShowProMenu(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs text-[#555555] hover:text-[#8B5E3C] font-semibold hover:bg-[#FAF6F4] rounded-xl transition-all"
                        style={{ textDecoration: 'none' }}
                      >
                        <Settings className="w-3.5 h-3.5 text-[#8B5E3C]" /> Manage Account
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 font-semibold hover:bg-red-50 rounded-xl transition-all text-left bg-transparent border-none cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5 text-red-600" /> Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex xl:hidden items-center gap-2 ml-auto" suppressHydrationWarning={true}>
          <ShareButton />
          {proEmail && <NotificationBell email={proEmail} />}

          {!isSignedIn ? (
            <button
              onClick={() => { setShowSignInModal(true); setSignInStep('email'); setSignInError(''); }}
              className="bg-[#C17D3C] hover:bg-[#B06D2B] text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-sm transition-colors cursor-pointer border-none"
              style={{
                marginBottom: 'env(safe-area-inset-bottom, 20px)'
              }}
            >
              Sign In
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowProMenu(!showProMenu)}
                className="w-8 h-8 rounded-full bg-[#C17D3C] hover:bg-[#B06D2B] text-white font-[800] flex items-center justify-center text-[13px] shadow-[0_2px_8px_rgba(193,125,60,0.25)] cursor-pointer border-none transition-colors select-none"
                title={proEmail || sitterEmail || 'Account'}
              >
                {proEmail || sitterEmail ? (proEmail || sitterEmail).charAt(0).toUpperCase() : 'U'}
              </button>

              {showProMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40 bg-transparent cursor-default" 
                    onClick={() => setShowProMenu(false)}
                  />
                  
                  <div className="absolute right-0 mt-2.5 w-52 bg-white border border-[#E8DDD4] rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.08)] p-2 z-50 flex flex-col gap-1 animate-fade-in text-left">
                    <div className="px-3 py-2 border-b border-gray-150 text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate select-none">
                      {proEmail || sitterEmail || "User Account"}
                    </div>
                    <Link 
                      href="/account"
                      onClick={() => setShowProMenu(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs text-[#555555] hover:text-[#8B5E3C] font-semibold hover:bg-[#FAF6F4] rounded-xl transition-all"
                      style={{ textDecoration: 'none' }}
                    >
                      <Settings className="w-3.5 h-3.5 text-[#8B5E3C]" /> Manage Account
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 font-semibold hover:bg-red-50 rounded-xl transition-all text-left bg-transparent border-none cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5 text-red-600" /> Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div 
          className="xl:hidden absolute top-[72px] left-0 w-full bg-white border-b border-[#EEEEEE] shadow-lg z-50 animate-fade-in"
          style={{
            paddingBottom: 'env(safe-area-inset-bottom, 20px)'
          }}
        >
          <div className="flex flex-col p-4 gap-2">

            {/* Pet Sitting (mobile) */}
            <Link href="/petsitting" onClick={() => setIsOpen(false)} className="px-4 py-3 text-[#666666] font-medium hover:bg-[#FDF9F5] hover:text-[#8B5E3C] rounded-xl transition-colors flex items-center gap-2 text-decoration-none">
              <svg className="w-4 h-4 inline-block align-middle text-[#8B5E3C]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Pet Sitting
            </Link>

            <Link 
              href="/scan" 
              className="px-4 py-3 text-[#666666] font-medium hover:bg-[#FDF9F5] hover:text-[#8B5E3C] rounded-xl transition-colors flex items-center animate-fade-in text-decoration-none"
              onClick={() => setIsOpen(false)}
            >
              <svg className="w-4 h-4 inline-block mr-2.5 align-middle" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Safety Check
            </Link>

            {/* Find Food */}
            <Link 
              href="/chat" 
              className="px-4 py-3 text-[#666666] font-medium hover:bg-[#FDF9F5] hover:text-[#8B5E3C] rounded-xl transition-colors flex items-center animate-fade-in text-decoration-none"
              onClick={() => setIsOpen(false)}
            >
              <Utensils className="w-4 h-4 inline-block mr-2.5 align-middle text-[#8B5E3C]" strokeWidth={2.5} />
              Find Food
            </Link>

            {/* Lost Pets */}
            <Link href="/lost-pets" onClick={() => setIsOpen(false)} className="px-4 py-3 text-[#666666] font-medium hover:bg-[#FDF9F5] hover:text-[#8B5E3C] transition-colors flex items-center gap-2 rounded-xl text-decoration-none">
              <Footprints className="w-4 h-4 text-[#8B5E3C]" strokeWidth={2.5} />
              Lost Pets
            </Link>

            {/* City Board */}
            <Link href="/city-board" onClick={() => setIsOpen(false)} className="px-4 py-3 text-[#666666] font-medium hover:bg-[#FDF9F5] hover:text-[#8B5E3C] transition-colors flex items-center gap-2 rounded-xl text-decoration-none">
              <MessageSquare className="w-4 h-4 text-[#8B5E3C]" strokeWidth={2.5} />
              City Board
            </Link>

            <Link 
              href="/recalls" 
              className="px-4 py-3 text-[#666666] font-medium hover:bg-[#FDF9F5] hover:text-[#8B5E3C] rounded-xl transition-colors flex items-center animate-fade-in text-decoration-none"
              onClick={() => setIsOpen(false)}
            >
              <svg className="w-4 h-4 inline-block mr-2.5 align-middle text-[#D97706]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Recalls
            </Link>
            <Link 
              href="/supplies" 
              className="px-4 py-3 text-[#666666] font-medium hover:bg-[#FDF9F5] hover:text-[#8B5E3C] rounded-xl transition-colors flex items-center animate-fade-in text-decoration-none"
              onClick={() => setIsOpen(false)}
            >
              <svg className="w-4 h-4 inline-block mr-2.5 align-middle" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="4.5" cy="11.5" r="2.5" />
                <circle cx="9.5" cy="7.5" r="2.5" />
                <circle cx="14.5" cy="7.5" r="2.5" />
                <circle cx="19.5" cy="11.5" r="2.5" />
                <path d="M12 21.5c-3 0-5.5-2.5-5.5-5.5s2.5-4.5 5.5-4.5 5.5 1.5 5.5 4.5-2.5 5.5-5.5 5.5z" />
              </svg>
              Pet Supplies
            </Link>
            <Link 
              href="/twin" 
              className="px-4 py-3 text-[#8B5E3C] font-bold hover:bg-[#FDF9F5] rounded-xl transition-colors flex items-center animate-fade-in text-decoration-none"
              onClick={() => setIsOpen(false)}
            >
              <svg className="w-4 h-4 inline-block mr-2.5 align-middle text-[#8B5E3C]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l-.813-5.096L3 15l5.096-.813L9 9l.813 5.096L15 15l-5.096.813zM19.071 4.929l-.244 1.533-.244-1.533L17.05 4.685l1.533-.244.244-1.533.244 1.533 1.533.244-1.533.244z" />
              </svg>
              Pet Twin
            </Link>

            {/* Explore (mobile) */}
            <Link 
              href="/explore" 
              className="px-4 py-3 text-[#666666] font-medium hover:bg-[#FDF9F5] hover:text-[#8B5E3C] rounded-xl transition-colors flex items-center animate-fade-in text-decoration-none"
              onClick={() => setIsOpen(false)}
            >
              <Globe className="w-4 h-4 inline-block mr-2.5 align-middle text-[#8B5E3C]" strokeWidth={2.5} />
              Explore Community
            </Link>

            
            {isPro && (
              <div className="mt-2 pt-2 border-t border-gray-100 flex flex-col gap-1 animate-fade-in">
                <div className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate select-none">
                  {proEmail || "Pro Member"}
                </div>
                <Link 
                  href="/account"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-3 text-[#555555] font-bold hover:bg-[#FDF9F5] hover:text-[#8B5E3C] rounded-xl transition-colors flex items-center animate-fade-in gap-2"
                  style={{ textDecoration: 'none' }}
                >
                  <Settings className="w-4 h-4 text-[#8B5E3C]" /> Manage Subscription
                </Link>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    handleSignOut();
                  }}
                  className="w-full px-4 py-3 text-left text-red-600 font-bold hover:bg-red-50 rounded-xl transition-colors flex items-center bg-transparent border-none cursor-pointer animate-fade-in gap-2"
                >
                  <LogOut className="w-4 h-4 text-red-600" /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
    {showPushBanner && (
      <div className="bg-gradient-to-r from-[#FFFBF5] to-[#FAF6F4] border-b border-[#E8D5C0] px-4 py-2 text-center flex items-center justify-center gap-3 animate-fade-in relative z-40">
        <span className="text-xs text-[#8B5E3C] font-bold flex items-center gap-1.5">
          <Bell className="w-4 h-4 text-[#8B5E3C] shrink-0" /> Enable notifications to get instant updates
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleEnableNotifications}
            className="bg-[#8B5E3C] hover:bg-[#7A5234] text-white text-[11px] font-bold px-3 py-1 rounded-lg transition-colors cursor-pointer"
          >
            Enable
          </button>
          <button
            onClick={() => {
              localStorage.setItem('lumo_push_banner_dismissed', 'true');
              setShowPushBanner(false);
            }}
            className="text-[#8B7E7D] hover:text-[#4A3E3D] text-[11px] font-bold px-2 py-1 transition-colors cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </div>
    )}
      {showSignInModal && (
        <div 
          className="modal-overlay fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in px-4 overflow-y-auto"
          style={{
            paddingBottom: 'env(safe-area-inset-bottom, 20px)',
            paddingTop: 'env(safe-area-inset-top, 20px)',
            minHeight: '100dvh'
          }}
        >
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl relative my-auto">
            <button 
              onClick={() => { setShowSignInModal(false); setSignInStep('email'); setSignInError(''); setAlreadyProMsg(false); }}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>

            <h2 className="text-2xl font-black text-[#3B2410] mb-2 text-center">
              {signInStep === 'email' ? 'Sign In' : 'Verify Code'}
            </h2>
            <p className="text-center text-[#666666] text-sm mb-6">
              {signInStep === 'email' ? 'Enter your email to access your account.' : `We sent a code to ${signInEmail}`}
            </p>

            {alreadyProMsg && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl text-center">
                <p className="text-green-700 font-bold text-sm mb-1 flex items-center justify-center gap-1">
                  <Check className="w-4 h-4 text-green-700 stroke-[3]" /> You are already a PRO member!
                </p>
                <p className="text-green-600 text-xs">Sign in below to access your account.</p>
              </div>
            )}

            {signInError === 'not_pro' ? (
              <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-2xl flex flex-col items-center gap-3 text-center w-full">
                <p className="text-red-600 font-bold text-sm leading-relaxed">
                  No PRO subscription found for this email. Please upgrade to PRO first.
                </p>
                <button
                  type="button"
                  onClick={() => handleUpgradeCheckout(signInEmail)}
                  className="w-full py-3.5 rounded-xl bg-[#8B5E3C] hover:bg-[#7A5234] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  Upgrade to PRO →
                </button>
                <button
                  type="button"
                  onClick={() => { setSignInStep('email'); setSignInCode(''); setSignInError(''); }}
                  className="text-xs text-gray-400 hover:text-gray-600 hover:underline font-bold"
                >
                  Try another email
                </button>
              </div>
            ) : (
              <>
                {signInError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm text-center flex flex-col items-center gap-1">
                    <span>{signInError}</span>
                    {signInError.includes('Code expired') && (
                      <button
                        type="button"
                        onClick={() => handleSignInSendCode({ preventDefault: () => {} } as React.FormEvent)}
                        className="text-xs font-bold text-[#8B5E3C] hover:underline mt-1 cursor-pointer bg-transparent border-none"
                      >
                        Still nothing? Resend Code
                      </button>
                    )}
                  </div>
                )}

                {signInStep === 'email' ? (
                  <form onSubmit={handleSignInSendCode} className="flex flex-col gap-4">
                    <input
                      type="email"
                      value={signInEmail}
                      onChange={e => setSignInEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full px-4 py-3 rounded-xl border-2 border-[#E8D5C0] focus:border-[#8B5E3C] focus:ring-0 transition-colors outline-none"
                      required
                    />
                    {!hasTermsAccepted && (
                      <label className="flex items-start gap-2.5 my-1 cursor-pointer select-none text-left">
                        <input
                          type="checkbox"
                          checked={termsAccepted}
                          onChange={(e) => setTermsAccepted(e.target.checked)}
                          className="mt-0.5 w-4 h-4 text-[#8B5E3C] border-[#E8D5C0] rounded-sm focus:ring-[#8B5E3C]"
                        />
                        <span className="text-[11px] text-[#666666] leading-normal font-medium">
                          I agree to the{' '}
                          <Link href="/terms" className="text-[#8B5E3C] font-bold hover:underline" target="_blank" onClick={(e) => e.stopPropagation()}>
                            Terms of Service
                          </Link>
                          ,{' '}
                          <Link href="/privacy" className="text-[#8B5E3C] font-bold hover:underline" target="_blank" onClick={(e) => e.stopPropagation()}>
                            Privacy Policy
                          </Link>{' '}
                          and{' '}
                          <Link href="/community-guidelines" className="text-[#8B5E3C] font-bold hover:underline" target="_blank" onClick={(e) => e.stopPropagation()}>
                            Community Guidelines
                          </Link>
                          .
                        </span>
                      </label>
                    )}
                    <button
                      type="submit"
                      disabled={signInLoading || (!hasTermsAccepted && !termsAccepted)}
                      className="w-full py-3.5 rounded-xl bg-[#8B5E3C] hover:bg-[#7A5234] text-white font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {signInLoading ? 'Sending...' : 'Send Code'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleSignInVerify} className="flex flex-col gap-4">
                    <div className="bg-[#FAF6F4] border border-[#E8DDD4] text-[#8B5E3C] rounded-xl p-3 text-xs leading-relaxed text-center font-medium mt-1 mb-1 animate-fade-in">
                      📧 Code sent! Check your inbox — and don't forget to check your spam/junk folder if you don't see it within a minute.
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={signInCode}
                      onChange={e => setSignInCode(e.target.value)}
                      placeholder="••••••"
                      className="w-full px-4 py-3 rounded-xl border-2 border-[#E8D5C0] focus:border-[#8B5E3C] focus:ring-0 transition-colors outline-none text-center text-lg tracking-[0.2em] font-bold"
                      maxLength={6}
                      required
                    />
                    <button
                      type="submit"
                      disabled={signInLoading}
                      className="w-full py-3.5 rounded-xl bg-[#8B5E3C] hover:bg-[#7A5234] text-white font-bold transition-colors disabled:opacity-70"
                    >
                      {signInLoading ? 'Verifying...' : 'Verify & Sign In'}
                    </button>

                    <div className="mt-2 flex flex-col gap-2 border-t border-[#E8D5C0] pt-4">
                      <div className="text-center text-xs text-[#8B7E7D]">
                        Didn't receive the code? Check your spam or junk folder.
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSignInSendCode({ preventDefault: () => {} } as React.FormEvent)}
                        className="text-sm font-bold text-[#8B5E3C] hover:underline text-center"
                      >
                        Still nothing? Resend Code
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => { setSignInStep('email'); setSignInCode(''); setSignInError(''); }}
                      className="text-sm font-bold text-gray-500 hover:text-gray-700 hover:underline text-center mt-2"
                    >
                      Use a different email
                    </button>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
