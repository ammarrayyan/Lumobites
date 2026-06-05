'use client';

import React, { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import SitterMap from '@/components/SitterMap';
import { loadStripe } from '@stripe/stripe-js';
import { Star, MapPin, Phone, Calendar, Home, Moon, Footprints, Lock, Crown, Camera, ShieldCheck, MessageSquare, Key, AlertTriangle, Clipboard, Share2, Upload } from 'lucide-react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface Sitter {
  id: string;
  name: string;
  photo_url: string;
  city: string;
  zip: string;
  country?: string;
  lat?: number;
  lng?: number;
  bio: string;
  pet_types: string;
  rate_per_night: number;
  phone_number?: string;
  phone_visible?: boolean;
  distance?: number;
  avg_rating?: number;
  review_count?: number;
  available_days?: string[];
  available_times?: string[];
  service_types?: string[];
  completed_bookings?: number;
}

// Haversine formula to calculate distance between two coordinates in miles
function getDistanceInMiles(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 3958.8; // Radius of the earth in miles
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c;
}

export default function PetSitting() {
  const [activeTab, setActiveTab] = useState<'find' | 'become'>('find');

  const inviteMessageText = "Hey! I just signed up as a pet sitter on Lumo Bites — a free platform where you can earn money sitting pets in your neighborhood. No commission ever! Check it out and create your profile: lumobites.net/petsitting";

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(inviteMessageText);
    alert('Invitation message copied to clipboard!');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText('lumobites.net/petsitting');
    alert('Link copied to clipboard!');
  };
  
  // Find Sitter State
  const [sitters, setSitters] = useState<Sitter[]>([]);
  const [loadingSitters, setLoadingSitters] = useState(true);
  const [isOwnerPro, setIsOwnerPro] = useState(false);
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [ownerAuthMode, setOwnerAuthMode] = useState<'email' | 'verify'>('email');
  const [ownerAuthCode, setOwnerAuthCode] = useState('');
  const [unlockEmail, setUnlockEmail] = useState('');
  const [unlockLoading, setUnlockLoading] = useState(false);
  const [searchZip, setSearchZip] = useState('');
  const [searchLocationName, setSearchLocationName] = useState('');
  const [searchLocationError, setSearchLocationError] = useState('');
  const [searchPetType, setSearchPetType] = useState('all');
  const [searchDay, setSearchDay] = useState('all');
  const [searchServiceType, setSearchServiceType] = useState('all');
  const [searchRadius, setSearchRadius] = useState('25');
  const [searchCoords, setSearchCoords] = useState<{lat: number, lng: number} | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [selectedSitter, setSelectedSitter] = useState<Sitter | null>(null);

  // Reviews State
  const [reviewsModalOpen, setReviewsModalOpen] = useState(false);
  const [selectedSitterForReviews, setSelectedSitterForReviews] = useState<Sitter | null>(null);
  const [sitterReviews, setSitterReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [highlightedSitterId, setHighlightedSitterId] = useState<string | null>(null);
  
  // Request Form State
  const [reqEmail, setReqEmail] = useState('');
  const [reqOwnerName, setReqOwnerName] = useState('');
  const [reqPetName, setReqPetName] = useState('');
  const [reqPetType, setReqPetType] = useState('dog');
  const [reqPetAge, setReqPetAge] = useState('');
  const [reqStartDate, setReqStartDate] = useState('');
  const [reqEndDate, setReqEndDate] = useState('');
  const [reqNotes, setReqNotes] = useState('');
  const [reqLoading, setReqLoading] = useState(false);
  const [reqError, setReqError] = useState('');
  const [reqSuccess, setReqSuccess] = useState(false);
  const [hasSavedInfo, setHasSavedInfo] = useState(false);

  // Become Sitter State
  const [sitterEmail, setSitterEmail] = useState('');
  const [sitterFirstName, setSitterFirstName] = useState('');
  const [sitterLastName, setSitterLastName] = useState('');
  const sitterName = `${sitterFirstName} ${sitterLastName}`.trim();
  const [sitterPhoto, setSitterPhoto] = useState('');
  const [sitterIdPhoto, setSitterIdPhoto] = useState('');
  const [hasExistingIdPhoto, setHasExistingIdPhoto] = useState(false);
  const [sitterApprovalStatus, setSitterApprovalStatus] = useState('pending');
  const [sitterCity, setSitterCity] = useState('');
  const [sitterLocationInput, setSitterLocationInput] = useState('');
  const [sitterLocationVerified, setSitterLocationVerified] = useState(false);
  const [sitterLocationOptions, setSitterLocationOptions] = useState<any[]>([]);
  const [sitterSelectedLocation, setSitterSelectedLocation] = useState<any>(null);
  const [sitterIsLocating, setSitterIsLocating] = useState(false);
  const [sitterBio, setSitterBio] = useState('');
  const [sitterPetTypes, setSitterPetTypes] = useState('both');
  const [sitterAvailableDays, setSitterAvailableDays] = useState<string[]>([]);
  const [sitterAvailableTimes, setSitterAvailableTimes] = useState<string[]>([]);
  const [sitterServiceTypes, setSitterServiceTypes] = useState<string[]>([]);
  const [sitterRate, setSitterRate] = useState('');
  const [sitterPhone, setSitterPhone] = useState('');
  const [sitterPhoneVisible, setSitterPhoneVisible] = useState(false);
  const [sitterAvailable, setSitterAvailable] = useState(true);
  const [sitterGender, setSitterGender] = useState('');
  const [isProSitter, setIsProSitter] = useState(false);
  const [selfDeclared, setSelfDeclared] = useState(false);
  const [needsReapproval, setNeedsReapproval] = useState(false);

  // Bookings Flow State
  const [reqPhone, setReqPhone] = useState('');
  const [sitterId, setSitterId] = useState('');
  const [sitterRequests, setSitterRequests] = useState<any[]>([]);
  const [loadingSitterRequests, setLoadingSitterRequests] = useState(false);
  const [ownerRequests, setOwnerRequests] = useState<any[]>([]);
  const [loadingOwnerRequests, setLoadingOwnerRequests] = useState(false);
  const [ownerHistoryEmail, setOwnerHistoryEmail] = useState('');
  const [ownerHistoryFetched, setOwnerHistoryFetched] = useState(false);

  const [completedBookings, setCompletedBookings] = useState(0);

  // Calendar Availability States
  const [sitterBlockedDates, setSitterBlockedDates] = useState<string[]>([]);
  const [sitterBookedDates, setSitterBookedDates] = useState<string[]>([]);
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());

  // Sitter Sub Details
  const [sitterSubCancelAtPeriodEnd, setSitterSubCancelAtPeriodEnd] = useState(false);
  const [sitterSubDaysRemaining, setSitterSubDaysRemaining] = useState(0);
  const [sitterSubEndDate, setSitterSubEndDate] = useState('');
  const [sitterSubId, setSitterSubId] = useState('');
  const [sitterSubActionLoading, setSitterSubActionLoading] = useState(false);
  
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [profilePreviewMode, setProfilePreviewMode] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Sitter Auth State
  const [sitterAuthMode, setSitterAuthMode] = useState<'email' | 'otp' | 'form'>('email');
  const [sitterAuthCode, setSitterAuthCode] = useState('');
  const [sitterAuthLoading, setSitterAuthLoading] = useState(false);
  const [sitterAuthError, setSitterAuthError] = useState('');

  // Delete Profile State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Camera Webcam State
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [cameraTarget, setCameraTarget] = useState<'selfie' | 'id' | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const profilePhotoInputRef = useRef<HTMLInputElement | null>(null);

  // Zip Code Validation State
  const [zipGeocoding, setZipGeocoding] = useState(false);
  const [zipError, setZipError] = useState('');

  const loadOwnerProfile = async (email: string) => {
    if (!email) return;
    try {
      const res = await fetch(`/api/petsitting/owner-profile?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (res.ok && data.success && data.profile) {
        const p = data.profile;
        if (p.owner_name) setReqOwnerName(p.owner_name);
        if (p.pet_name) setReqPetName(p.pet_name);
        if (p.pet_type) setReqPetType(p.pet_type);
        if (p.pet_age) setReqPetAge(p.pet_age);
        if (p.special_notes) setReqNotes(p.special_notes);
        if (p.phone_number) setReqPhone(p.phone_number);
        setHasSavedInfo(true);
      }
    } catch (err) {
      console.error('Failed to load owner profile:', err);
    }
  };

  useEffect(() => {
    const cachedEmail = localStorage.getItem('lumo_pro_email');
    if (cachedEmail && cachedEmail !== 'undefined') {
      setReqEmail(cachedEmail);
      fetchSitters(cachedEmail);
      loadOwnerProfile(cachedEmail);
    } else {
      fetchSitters();
    }

    // Restore owner booking history if they tracked it previously
    const cachedHistoryEmail = localStorage.getItem('lumo_owner_history_email') || cachedEmail;
    if (cachedHistoryEmail && cachedHistoryEmail !== 'undefined') {
      setOwnerHistoryEmail(cachedHistoryEmail);
      fetchOwnerRequests(cachedHistoryEmail);
    }

    // Set activeTab from URL search params or hash
    const params = new URLSearchParams(window.location.search);
    if (params.get('tab') === 'become' || window.location.hash === '#become') {
      setActiveTab('become');
    }
  }, []);

  const handleClearSavedInfo = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    setReqOwnerName('');
    setReqPetName('');
    setReqPetType('dog');
    setReqPetAge('');
    setReqNotes('');
    setReqPhone('');
    setHasSavedInfo(false);

    const email = reqEmail || localStorage.getItem('lumo_pro_email');
    if (email) {
      try {
        await fetch(`/api/petsitting/owner-profile?email=${encodeURIComponent(email)}`, {
          method: 'DELETE'
        });
      } catch (err) {
        console.error('Failed to delete owner profile:', err);
      }
    }
  };

  const parseSpecialNotes = (specialNotes: string) => {
    if (!specialNotes) return { petAge: null, cleanNotes: null };
    const match = specialNotes.match(/^\[Pet Age:\s*([^\]]+)\](?:\s*(.*))?$/i);
    if (match) {
      return {
        petAge: match[1].trim(),
        cleanNotes: match[2] ? match[2].trim() : null
      };
    }
    return { petAge: null, cleanNotes: specialNotes };
  };

  const fetchSitterAvailability = async (sitterId: string, email?: string) => {
    if (!sitterId && !email) return;
    try {
      const url = sitterId 
        ? `/api/petsitting/sitter/availability?sitter_id=${encodeURIComponent(sitterId)}`
        : `/api/petsitting/sitter/availability?email=${encodeURIComponent(email || '')}`;
        
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.success) {
        setSitterBlockedDates(data.blocked_dates || []);
        
        // Compile all accepted booking dates into a flat array
        const booked: string[] = [];
        if (Array.isArray(data.accepted_bookings)) {
          data.accepted_bookings.forEach((booking: any) => {
            if (Array.isArray(booking.dates_in_range)) {
              booked.push(...booking.dates_in_range);
            }
          });
        }
        setSitterBookedDates(booked);
      }
    } catch (err) {
      console.error('Failed to fetch sitter availability:', err);
    }
  };

  const handleSitterBlockedDateToggle = async (dateStr: string) => {
    let newBlocked = [...sitterBlockedDates];
    if (newBlocked.includes(dateStr)) {
      newBlocked = newBlocked.filter(d => d !== dateStr);
    } else {
      newBlocked.push(dateStr);
    }
    setSitterBlockedDates(newBlocked);
    try {
      const body: any = { blocked_dates: newBlocked };
      if (sitterId) {
        body.sitter_id = sitterId;
      } else if (sitterEmail) {
        body.email = sitterEmail;
      }
      const res = await fetch('/api/petsitting/sitter/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        fetchSitterAvailability(sitterId, sitterEmail);
      }
    } catch (err) {
      console.error(err);
      fetchSitterAvailability(sitterId, sitterEmail);
    }
  };

  const getDatesBetween = (startStr: string, endStr: string) => {
    const dates: string[] = [];
    if (!startStr || !endStr) return dates;
    const start = new Date(startStr + 'T00:00:00');
    const end = new Date(endStr + 'T00:00:00');
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return dates;
    let current = new Date(start);
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  const handleOwnerCalendarDayClick = (dateStr: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (dateStr < todayStr) return;
    if (sitterBookedDates.includes(dateStr) || sitterBlockedDates.includes(dateStr)) return;

    if (!reqStartDate || (reqStartDate && reqEndDate)) {
      setReqStartDate(dateStr);
      setReqEndDate('');
    } else {
      if (dateStr < reqStartDate) {
        setReqStartDate(dateStr);
      } else {
        const intermediate = getDatesBetween(reqStartDate, dateStr);
        const hasOverlap = intermediate.some(d => sitterBlockedDates.includes(d) || sitterBookedDates.includes(d));
        if (hasOverlap) {
          setReqStartDate(dateStr);
        } else {
          setReqEndDate(dateStr);
        }
      }
    }
  };

  useEffect(() => {
    if (requestModalOpen && selectedSitter?.id) {
      setReqStartDate('');
      setReqEndDate('');
      fetchSitterAvailability(selectedSitter.id);
    }
  }, [requestModalOpen, selectedSitter]);

  // Debounced geocoding effect
  useEffect(() => {
    if (!searchZip.trim()) {
      setSearchCoords(null);
      setSearchLocationName('');
      setSearchLocationError('');
      return;
    }
    
    const timeoutId = setTimeout(async () => {
      setIsGeocoding(true);
      setSearchLocationError('');
      try {
        const res = await fetch(`/api/petsitting/geocode?address=${encodeURIComponent(searchZip)}`);
        const data = await res.json();
        if (res.ok) {
          if (data.lat && data.lng) {
            setSearchCoords({ lat: data.lat, lng: data.lng });
            setSearchLocationName(data.formatted_address || data.city || '');
            setSearchLocationError('');
          } else {
            setSearchCoords(null);
            setSearchLocationName('');
            setSearchLocationError('Location not found — please try a different city or zip code');
          }
        } else {
          setSearchCoords(null);
          setSearchLocationName('');
          setSearchLocationError(data.error || 'Location not found — please try a different city or zip code');
        }
      } catch (e) {
        setSearchCoords(null);
        setSearchLocationName('');
        setSearchLocationError('Location not found — please try a different city or zip code');
      } finally {
        setIsGeocoding(false);
      }
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [searchZip]);



  const fetchSitters = async (email?: string, dayOverride?: string, serviceOverride?: string) => {
    try {
      const qEmail = email !== undefined ? email : reqEmail;
      const qDay = dayOverride !== undefined ? dayOverride : searchDay;
      const qService = serviceOverride !== undefined ? serviceOverride : searchServiceType;

      const params = new URLSearchParams();
      if (qEmail) params.append('owner_email', qEmail);
      if (qDay && qDay !== 'all') params.append('day', qDay);
      if (qService && qService !== 'all') params.append('service_type', qService);

      const url = `/api/petsitting/sitters?${params.toString()}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setSitters(data.sitters);
        setIsOwnerPro(data.isOwnerPro);
      }
    } catch (e) {
      console.error('Failed to fetch sitters');
    } finally {
      setLoadingSitters(false);
    }
  };

  const handleViewReviews = async (sitter: Sitter) => {
    setHighlightedSitterId(sitter.id);
    setSelectedSitterForReviews(sitter);
    setReviewsModalOpen(true);
    setLoadingReviews(true);
    try {
      const res = await fetch(`/api/petsitting/reviews?sitter_id=${sitter.id}`);
      const data = await res.json();
      if (res.ok && data.reviews) {
        setSitterReviews(data.reviews);
      } else {
        setSitterReviews([]);
      }
    } catch (e) {
      console.error('Failed to load reviews');
      setSitterReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleSelectSitterFromMap = (sitter: Sitter) => {
    handleViewReviews(sitter);
    setTimeout(() => {
      const el = document.getElementById(`sitter-card-${sitter.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const fetchSitterRequests = async (id: string) => {
    if (!id) return;
    setLoadingSitterRequests(true);
    try {
      const res = await fetch(`/api/petsitting/request/sitter?sitter_id=${id}`);
      const data = await res.json();
      if (res.ok && data.requests) {
        setSitterRequests(data.requests);
      }
    } catch (e) {
      console.error('Failed to fetch sitter requests');
    } finally {
      setLoadingSitterRequests(false);
    }
  };

  const fetchOwnerRequests = async (email: string) => {
    if (!email) return;
    setLoadingOwnerRequests(true);
    try {
      const res = await fetch(`/api/petsitting/request/owner?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (res.ok && data.requests) {
        setOwnerRequests(data.requests);
        setOwnerHistoryFetched(true);
        localStorage.setItem('lumo_owner_history_email', email);
      }
    } catch (e) {
      console.error('Failed to fetch owner requests');
    } finally {
      setLoadingOwnerRequests(false);
    }
  };

  const handleSitterResponse = async (id: string, action: 'accept' | 'decline', token: string) => {
    window.open(`/api/petsitting/request/${action}?id=${id}&token=${token}`, '_blank');
    setTimeout(() => {
      if (sitterId) {
        fetchSitterRequests(sitterId);
      }
    }, 2000);
  };

  const handleMarkAsCompleted = async (id: string) => {
    if (!confirm('Are you sure you want to mark this booking as completed? This will increase your completed bookings counter.')) {
      return;
    }
    try {
      const res = await fetch('/api/petsitting/request/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, sitter_id: sitterId })
      });
      if (res.ok) {
        alert('Booking marked as completed! Great job! 🎉');
        if (sitterId) {
          fetchSitterRequests(sitterId);
          loadSitterProfile(sitterEmail);
        }
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to complete booking.');
      }
    } catch (e) {
      alert('An error occurred.');
    }
  };

  const loadSitterProfile = async (email: string) => {
    setProfileLoading(true);
    try {
      const res = await fetch(`/api/petsitting/profile?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setSitterId(data.id || '');
          fetchSitterRequests(data.id || '');
          fetchSitterAvailability('', email);
          setCompletedBookings(data.completed_bookings || 0);
          const nameParts = (data.name || '').trim().split(/\s+/);
          setSitterFirstName(nameParts[0] || '');
          setSitterLastName(nameParts.slice(1).join(' ') || '');
          setSitterPhoto(data.photo_url || '');
          setHasExistingIdPhoto(!!data.id_photo_url);
          setSitterCity(data.city || '');
          setSitterLocationInput(data.city || '');
          setSitterLocationVerified(!!data.city);
          if (data.city) {
            setSitterSelectedLocation({
              formatted_address: data.city,
              lat: data.lat,
              lng: data.lng,
              country: data.country || ''
            });
          }
          setSitterBio(data.bio || '');
          setSitterGender(data.gender || '');
          setSitterPetTypes(data.pet_types || 'both');
          setSitterRate(data.rate_per_night?.toString() || '');
          setSitterPhone(data.phone_number || '');
          setSitterPhoneVisible(data.phone_visible || false);
          setSitterAvailable(data.availability === true || data.availability === 'true' || !!data.availability);
          setSitterAvailableDays(data.available_days || []);
          setSitterAvailableTimes(data.available_times || []);
          setSitterServiceTypes(data.service_types || []);
          setSitterApprovalStatus(data.approval_status || 'pending');
          setNeedsReapproval(!!data.needs_reapproval);
          setSelfDeclared(!!data.self_declared);
          
          // FREE LAUNCH: Automatically treat any loaded profile as PRO
          setIsProSitter(true);
          
          if (data.is_pro) {
            try {
              const subRes = await fetch('/api/stripe/subscription-details', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
              });
              const subData = await subRes.json();
              if (subRes.ok && subData.success && !subData.adminBypass) {
                setSitterSubCancelAtPeriodEnd(subData.cancelAtPeriodEnd);
                setSitterSubDaysRemaining(subData.daysRemaining);
                setSitterSubEndDate(subData.nextBillingDate);
                setSitterSubId(subData.subscriptionId);
              }
            } catch (e) {
              console.error('Failed to load sitter subscription details');
            }
          }
        }
      }
    } catch (e) {
      console.error('Failed to load profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSitterEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!sitterEmail.trim() || !emailRegex.test(sitterEmail.trim())) {
      setSitterAuthError('Please enter a valid email address');
      return;
    }
    
    setSitterAuthLoading(true);
    setSitterAuthError('');
    
    try {
      // Send OTP to ANY sitter email
      const otpRes = await fetch('/api/petsitting/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: sitterEmail })
      });
      if (otpRes.ok) {
        setSitterAuthMode('otp');
      } else {
        const data = await otpRes.json();
        setSitterAuthError(data.error || 'Failed to send verification code.');
      }
    } catch (e) {
      setSitterAuthError('An error occurred.');
    } finally {
      setSitterAuthLoading(false);
    }
  };

  const handleSitterOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sitterAuthCode.trim()) return;

    setSitterAuthLoading(true);
    setSitterAuthError('');

    try {
      const res = await fetch('/api/petsitting/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: sitterEmail, code: sitterAuthCode })
      });
      const data = await res.json();

      if (res.ok) {
        // Code verified! Now check if profile exists
        const profileRes = await fetch(`/api/petsitting/profile?email=${encodeURIComponent(sitterEmail)}`);
        const profileData = await profileRes.json();

        if (profileRes.ok && profileData && profileData.id) {
          // Returning user, load their profile
          await loadSitterProfile(sitterEmail);
          setSitterAuthMode('form');
          setProfilePreviewMode(true);
        } else {
          // New user, clear form to create a new profile
          setSitterFirstName('');
          setSitterLastName('');
          setSitterPhoto('');
          setSitterIdPhoto('');
          setHasExistingIdPhoto(false);
          setSitterCity('');
          setSitterLocationInput('');
          setSitterLocationVerified(false);
          setSitterLocationOptions([]);
          setSitterSelectedLocation(null);
          setSitterIsLocating(false);
          setSitterBio('');
          setSitterGender('');
          setSitterRate('');
          setSelfDeclared(false);
          setNeedsReapproval(false);
          
          setSitterAuthMode('form');
          setProfilePreviewMode(false);
        }
      } else {
        setSitterAuthError(data.error || 'Invalid verification code.');
      }
    } catch (e) {
      setSitterAuthError('An error occurred verifying the code.');
    } finally {
      setSitterAuthLoading(false);
    }
  };

  const handleDeleteProfile = async () => {
    setDeleteLoading(true);
    try {
      const res = await fetch('/api/petsitting/profile/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: sitterEmail })
      });
      if (res.ok) {
        // Reset state
        setSitterAuthMode('email');
        setSitterEmail('');
        setSitterFirstName('');
        setSitterLastName('');
        setSitterPhoto('');
        setSitterCity('');
        setSitterLocationInput('');
        setSitterLocationVerified(false);
        setSitterLocationOptions([]);
        setSitterSelectedLocation(null);
        setSitterIsLocating(false);
        setSitterBio('');
        setSitterGender('');
        setSitterPetTypes('both');
        setSitterRate('');
        setSitterPhone('');
        setSitterPhoneVisible(false);
        setSelfDeclared(false);
        setIsProSitter(false);
        setDeleteModalOpen(false);
      } else {
        alert('Failed to delete profile. Please try again.');
      }
    } catch (e) {
      alert('An error occurred during deletion.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage('');
    setFormErrors({});

    // Strict Validation
    const errors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!sitterEmail.trim() || !emailRegex.test(sitterEmail.trim())) errors['email'] = 'Please enter a valid email address';
    if (!sitterFirstName.trim()) errors['firstName'] = 'Please enter your first name';
    if (!sitterLastName.trim()) errors['lastName'] = 'Please enter your last name';
    if (!sitterLocationInput.trim() || !sitterLocationVerified) errors['location'] = 'Please enter and verify your location';
    if (!sitterPhoto) errors['photo'] = 'A profile photo is required';
    if (!sitterIdPhoto && !hasExistingIdPhoto) errors['id_photo'] = 'A photo of your ID is required for verification';
    if (!sitterRate || parseInt(sitterRate) <= 0) errors['rate'] = 'Please enter a valid rate';
    if (!sitterBio.trim()) errors['bio'] = 'Please add a short bio';
    if (!selfDeclared) errors['self_declared'] = 'You must confirm the self-declaration check before submitting.';
    if (!sitterAvailable) errors['availability'] = 'You must confirm that you are currently accepting new requests to save your profile.';
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setProfileMessage('Please fill out all missing fields highlighted in red.');
      return;
    }

    setProfileLoading(true);

    try {
      const res = await fetch('/api/petsitting/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: sitterEmail,
          name: sitterName,
          photo_url: sitterPhoto,
          ...(sitterIdPhoto ? { id_photo_url: sitterIdPhoto } : {}),
          city: sitterCity || sitterLocationInput,
          zip: '',
          country: (() => {
            const addressParts = (sitterCity || sitterLocationInput || '').split(',');
            const parsedCountry = addressParts.length > 0 ? addressParts[addressParts.length - 1].trim() : '';
            return sitterSelectedLocation?.country || parsedCountry || '';
          })(),
          bio: sitterBio,
          pet_types: sitterPetTypes,
          rate_per_night: sitterRate,
          phone_number: sitterPhone,
          phone_visible: sitterPhoneVisible,
          availability: sitterAvailable,
          available_days: sitterAvailableDays,
          available_times: sitterAvailableTimes,
          service_types: sitterServiceTypes,
          gender: sitterGender,
          self_declared: selfDeclared
        })
      });

      if (res.ok) {
        const updatedData = await res.json();
        setSitterApprovalStatus(updatedData.approval_status || 'pending');
        setNeedsReapproval(!!updatedData.needs_reapproval);
        // FREE LAUNCH: Automatically treat saved profile as PRO
        setIsProSitter(true);
        setProfilePreviewMode(true);
      } else {
        const err = await res.json();
        if (err.error === 'location_not_found') {
          setFormErrors({ city: "We couldn't find that location. Please check your city and zip code", zip: "We couldn't find that location. Please check your city and zip code" });
          setProfileMessage('');
        } else {
          setProfileMessage(err.error || 'Something went wrong saving your profile. Please try again or contact support at info@lumobitespet.com');
        }
      }
    } catch (error) {
      setProfileMessage('Connection problem. Please check your internet and try again');
    } finally {
      setProfileSaving(false);
      setProfileLoading(false);
    }
  };

  const handleStripeCheckout = async () => {
    setProfileLoading(true);
    setProfileMessage('');
    try {
      const res = await fetch('/api/stripe/checkout-sitter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: sitterEmail })
      });
      
      let data;
      const text = await res.text();
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error(`Server error: ${text.substring(0, 100)}`);
      }

      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      if (data.sessionId && data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Failed to start checkout: no session ID returned');
      }
    } catch (error: any) {
      console.error('Stripe Checkout Error:', error);
      setProfileMessage(`Error: ${error.message}`);
      setProfileLoading(false);
    }
  };

  const handleCancelSitterSub = async () => {
    if (!sitterSubId) return;
    setSitterSubActionLoading(true);
    setProfileMessage('');
    try {
      const res = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: sitterEmail, subscriptionId: sitterSubId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSitterSubCancelAtPeriodEnd(true);
        if (data.endDate) setSitterSubEndDate(data.endDate);
        if (data.daysRemaining !== undefined) setSitterSubDaysRemaining(data.daysRemaining);
        setProfileMessage('Subscription cancelled successfully.');
      } else {
        setProfileMessage(data.error || 'Failed to cancel subscription.');
      }
    } catch (e) {
      setProfileMessage('Error connecting to subscription service.');
    } finally {
      setSitterSubActionLoading(false);
    }
  };

  const handleReactivateSitterSub = async () => {
    if (!sitterSubId) return;
    setSitterSubActionLoading(true);
    setProfileMessage('');
    try {
      const res = await fetch('/api/stripe/reactivate-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId: sitterSubId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSitterSubCancelAtPeriodEnd(false);
        setProfileMessage('Subscription reactivated successfully!');
      } else {
        setProfileMessage(data.error || 'Failed to reactivate subscription.');
      }
    } catch (e) {
      setProfileMessage('Error connecting to subscription service.');
    } finally {
      setSitterSubActionLoading(false);
    }
  };

  const handleOwnerStripeCheckout = async () => {
    try {
      setReqLoading(true);
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: reqEmail })
      });
      const data = await res.json();
      if (data.sessionId && data.url) {
        window.location.href = data.url;
      } else {
        setReqError(data.error || 'Failed to start checkout');
        setReqLoading(false);
      }
    } catch (error) {
      setReqError('Failed to connect to payment processor.');
      setReqLoading(false);
    }
  };

  const handleUnlockProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnlockLoading(true);
    setReqError('');

    try {
      if (ownerAuthMode === 'email') {
        const res = await fetch(`/api/petsitting/sitters?owner_email=${encodeURIComponent(unlockEmail)}`);
        const data = await res.json();
        
        if (data.isOwnerPro) {
          const otpRes = await fetch('/api/petsitting/auth/send-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: unlockEmail, type: 'owner' })
          });
          if (otpRes.ok) {
            setOwnerAuthMode('verify');
          } else {
            setReqError('Failed to send verification code. Please try again.');
          }
        } else {
          // Not PRO, trigger checkout
          const checkoutRes = await fetch('/api/stripe/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: unlockEmail })
          });
          const checkoutData = await checkoutRes.json();
          if (checkoutData.sessionId && checkoutData.url) {
            window.location.href = checkoutData.url;
          } else {
            setReqError('Failed to start checkout');
          }
        }
      } else {
        // Verify mode
        const res = await fetch('/api/petsitting/auth/verify-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: unlockEmail, code: ownerAuthCode })
        });
        
        if (res.ok) {
          const sittersRes = await fetch(`/api/petsitting/sitters?owner_email=${encodeURIComponent(unlockEmail)}`);
          const sittersData = await sittersRes.json();
          
          setSitters(sittersData.sitters || []);
          setIsOwnerPro(true);
          setUnlockModalOpen(false);
          setOwnerAuthMode('email');
          setOwnerAuthCode('');
          localStorage.setItem('lumo_pro_email', unlockEmail);
          setReqEmail(unlockEmail);
          loadOwnerProfile(unlockEmail);
        } else {
          setReqError('Invalid or expired code.');
        }
      }
    } catch (error) {
      setReqError('An error occurred.');
    } finally {
      setUnlockLoading(false);
    }
  };

  const startCamera = async (target: 'selfie' | 'id', mode?: 'user' | 'environment') => {
    const activeMode = mode || (target === 'selfie' ? 'user' : 'environment');
    setCameraTarget(target);
    setFacingMode(activeMode);
    setCameraModalOpen(true);
    setCameraError('');
    
    // Stop any existing stream first to avoid hardware conflicts
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: activeMode,
          width: target === 'selfie' ? { ideal: 640 } : { ideal: 1280 },
          height: target === 'selfie' ? { ideal: 640 } : { ideal: 720 }
        },
        audio: false
      });
      setCameraStream(stream);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 150);
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError('Unable to access camera. Please make sure you have given camera permissions to this website.');
    }
  };

  const toggleCameraFacing = () => {
    if (cameraTarget) {
      const newMode = facingMode === 'user' ? 'environment' : 'user';
      startCamera(cameraTarget, newMode);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setCameraModalOpen(false);
    setCameraTarget(null);
    setCameraError('');
  };

  const capturePhoto = () => {
    if (videoRef.current && cameraTarget) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      const width = video.videoWidth || 640;
      const height = video.videoHeight || 640;
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        
        if (cameraTarget === 'selfie') {
          setSitterPhoto(dataUrl);
          setFormErrors(prev => { const newErr = {...prev}; delete newErr.photo; return newErr; });
        } else {
          setSitterIdPhoto(dataUrl);
        }
      }
      stopCamera();
    }
  };

  const handleSitterLocationBlur = async () => {
    const input = sitterLocationInput.trim();
    if (!input) {
      setSitterLocationVerified(false);
      setSitterLocationOptions([]);
      setSitterSelectedLocation(null);
      return;
    }
    
    setSitterIsLocating(true);
    setSitterLocationVerified(false);
    setSitterLocationOptions([]);
    setSitterSelectedLocation(null);

    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
         setSitterCity(input);
         setSitterLocationVerified(true);
         return;
      }
      
      const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(input)}&key=${apiKey}`);
      const data = await res.json();
      
      if (data.results && data.results.length > 0) {
        const options = data.results.map((r: any) => {
          const countryComp = r.address_components?.find((c: any) => c.types.includes('country'));
          return {
            formatted_address: r.formatted_address,
            lat: r.geometry.location.lat,
            lng: r.geometry.location.lng,
            place_id: r.place_id,
            country: countryComp ? countryComp.long_name : ''
          };
        });
        
        setSitterLocationOptions(options);
        
        if (options.length === 1) {
          setSitterSelectedLocation(options[0]);
          setSitterCity(options[0].formatted_address);
          setSitterLocationVerified(true);
        }
      } else {
        setSitterCity(input);
        setSitterLocationVerified(true);
      }
    } catch (err) {
      console.error(err);
      setSitterCity(input);
      setSitterLocationVerified(true);
    } finally {
      setSitterIsLocating(false);
    }
  };

  const submitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setReqLoading(true);
    setReqError('');
    setReqSuccess(false);

    try {
      if (reqStartDate && reqEndDate) {
        if (new Date(reqEndDate + 'T00:00:00') < new Date(reqStartDate + 'T00:00:00')) {
          setReqError('End date must be after start date');
          setReqLoading(false);
          return;
        }

        const rangeDates = getDatesBetween(reqStartDate, reqEndDate);
        const hasOverlap = rangeDates.some(d => sitterBlockedDates.includes(d) || sitterBookedDates.includes(d));
        if (hasOverlap) {
          setReqError('Selected date range overlaps with dates the sitter is unavailable or already booked');
          setReqLoading(false);
          return;
        }
      }

      const startFmt = reqStartDate ? new Date(reqStartDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
      const endFmt = reqEndDate ? new Date(reqEndDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
      const finalDates = startFmt && endFmt ? `${startFmt} → ${endFmt}` : '';

      const finalNotes = reqPetAge.trim() 
        ? `[Pet Age: ${reqPetAge.trim()}]${reqNotes ? ' ' + reqNotes : ''}` 
        : reqNotes;

      const res = await fetch('/api/petsitting/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sitter_id: selectedSitter?.id,
          owner_email: reqEmail,
          owner_name: reqOwnerName,
          pet_name: reqPetName,
          pet_type: reqPetType,
          dates: finalDates,
          special_notes: finalNotes,
          phone_number: reqPhone || null
        })
      });

      const data = await res.json();
      if (res.ok) {
        // Save owner profile details to Supabase upon successful request submission
        try {
          await fetch('/api/petsitting/owner-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: reqEmail,
              owner_name: reqOwnerName,
              pet_name: reqPetName,
              pet_type: reqPetType,
              pet_age: reqPetAge,
              phone_number: reqPhone || null,
              special_notes: reqNotes || null
            })
          });
          setHasSavedInfo(true);
        } catch (err) {
          console.error('Failed to save owner profile:', err);
        }

        setReqSuccess(true);
        setTimeout(() => {
          setRequestModalOpen(false);
          setReqSuccess(false);
        }, 3000);
        if (ownerHistoryEmail) {
          fetchOwnerRequests(ownerHistoryEmail);
        }
      } else {
        if (data.error === 'requires_pro') {
          setReqError('requires_pro');
        } else {
          setReqError(data.error || 'Failed to submit request');
        }
      }
    } catch (err) {
      setReqError('An unexpected error occurred.');
    } finally {
      setReqLoading(false);
    }
  };

  let filteredSitters = sitters.filter(s => {
    if (searchPetType !== 'all' && s.pet_types !== 'both' && s.pet_types !== searchPetType) return false;
    return true;
  });

  if (searchZip.trim()) {
    if (isGeocoding || searchLocationError || !searchCoords) {
      // User is typing, or geocoding failed/pending -> wait for verification before showing results
      filteredSitters = [];
    } else {
      // Verified! Filter using haversine if radius applies
      filteredSitters = filteredSitters.map(s => {
        if (s.lat && s.lng) {
          return { ...s, distance: getDistanceInMiles(searchCoords.lat, searchCoords.lng, s.lat, s.lng) };
        }
        return s;
      });

      if (searchRadius !== 'any') {
        const radius = parseFloat(searchRadius);
        filteredSitters = filteredSitters.filter(s => s.distance !== undefined && s.distance <= radius);
      }
      
      // Always sort by distance if available
      filteredSitters.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }
  }
  const isFormValid = sitterEmail.trim() && sitterFirstName.trim() && sitterLastName.trim() && sitterPhoto && (sitterIdPhoto || hasExistingIdPhoto) && sitterLocationInput.trim() && sitterLocationVerified && sitterRate && sitterBio.trim();

  // Auto-set isProSitter to true on load/save to bypass sitter paywall UI.
  useEffect(() => {
    setIsProSitter(true);
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFAF7] font-sans">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        {/* CLASSY LAUNCH BANNER */}
        <div className="bg-white border border-[#E8DDD4] rounded-3xl p-5 md:p-6 mb-10 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all duration-300 hover:shadow-[0_8px_30px_rgba(139,94,60,0.04)] relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#8B5E3C]"></div>
          
          <div className="flex items-center gap-4 text-left">
            <div className="w-12 h-12 rounded-2xl bg-[#FAF6F4] border border-[#E8DDD4] flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform duration-300">
              ✨
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 bg-[#8B5E3C]/5 border border-[#8B5E3C]/10 text-[#8B5E3C] text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-1">
                Founding Sitter Initiative
              </div>
              <h4 className="text-base font-extrabold text-[#4A3E3D] leading-tight">
                Now Live! Be part of our community from day one
              </h4>
              <p className="text-xs text-[#8B7E7D] mt-0.5">
                Join today as a founding sitter — free to join, with no commissions ever.
              </p>
            </div>
          </div>

          {activeTab !== 'become' && (
            <button
              onClick={() => setActiveTab('become')}
              className="bg-[#8B5E3C] hover:bg-[#7A5234] text-white text-xs font-bold px-5 py-3 rounded-xl transition-all shadow-sm shrink-0 flex items-center gap-1 cursor-pointer"
            >
              Join Free <span>&rarr;</span>
            </button>
          )}
        </div>

        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-black text-[#4A3E3D] mb-4">Lumo Bites Pet Sitting</h1>
          <p className="text-[#8B5E3C] font-medium text-lg">Connect with trusted, local pet sitters in your community.</p>
        </div>

        {/* Custom Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white p-1 rounded-full shadow-sm inline-flex border border-[#E8DDD4]">
            <button
              onClick={() => setActiveTab('find')}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'find' ? 'bg-[#8B5E3C] text-white shadow-md' : 'text-[#666666] hover:text-[#8B5E3C]'}`}
            >
              Find a Sitter
            </button>
            <button
              onClick={() => setActiveTab('become')}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'become' ? 'bg-[#8B5E3C] text-white shadow-md' : 'text-[#666666] hover:text-[#8B5E3C]'}`}
            >
              Become a Sitter
            </button>
          </div>
        </div>

        {/* FIND A SITTER TAB */}
        {activeTab === 'find' && (
          <div className="animate-fade-in">
            {/* Search Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-[#E8DDD4] mb-1 flex flex-col md:flex-row gap-4 relative">
              <div className="flex-1 flex flex-col justify-center">
                <input
                  type="text"
                  placeholder="City or Zip Code (e.g. Louisville or 40202)"
                  className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]"
                  value={searchZip}
                  onChange={(e) => setSearchZip(e.target.value)}
                />
              </div>
              <select
                className="bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]"
                value={searchRadius}
                onChange={(e) => setSearchRadius(e.target.value)}
              >
                <option value="10">Within 10 miles</option>
                <option value="25">Within 25 miles</option>
                <option value="50">Within 50 miles</option>
                <option value="100">Within 100 miles</option>
                <option value="any">Any distance</option>
              </select>
              <select
                className="bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]"
                value={searchPetType}
                onChange={(e) => setSearchPetType(e.target.value)}
              >
                <option value="all">All Pets</option>
                <option value="dog">Dogs Only</option>
                <option value="cat">Cats Only</option>
              </select>
              <select
                className="bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]"
                value={searchDay}
                onChange={(e) => { setSearchDay(e.target.value); fetchSitters(undefined, e.target.value, undefined); }}
              >
                <option value="all">Any Day</option>
                <option value="Monday">Monday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
                <option value="Friday">Friday</option>
                <option value="Saturday">Saturday</option>
                <option value="Sunday">Sunday</option>
              </select>
              <select
                className="bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]"
                value={searchServiceType}
                onChange={(e) => { setSearchServiceType(e.target.value); fetchSitters(undefined, undefined, e.target.value); }}
              >
                <option value="all">Any Service</option>
                <option value="Home visits">🏠 Home visits</option>
                <option value="Overnight stays">🌙 Overnight stays</option>
                <option value="Dog walking">🚶 Dog walking</option>
                <option value="Sitter's home boarding">🏡 Sitter's home boarding</option>
              </select>
            </div>

            <p className="text-xs text-[#8B7E7D] mb-4 ml-2">Search by city name or zip code for best results</p>

            {/* Location Verification Status */}
            {searchZip.trim() && (
              <div className="mb-6 px-2 min-h-[24px]">
                {isGeocoding ? (
                  <span className="text-[#8B5E3C] text-sm font-semibold flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-[#8B5E3C]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Locating...
                  </span>
                ) : searchLocationError ? (
                  <span className="text-red-600 text-sm font-semibold">❌ {searchLocationError}</span>
                ) : searchLocationName ? (
                  <span className="text-green-700 text-sm font-semibold">✅ {searchLocationName}</span>
                ) : null}
              </div>
            )}

            {/* Premium PRO Upgrade Banner */}
            {!isOwnerPro && (
              <div className="bg-gradient-to-r from-[#FFB703]/10 to-[#FB8500]/10 border border-[#FB8500]/30 rounded-3xl p-6 mb-6 flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in shadow-sm">
                <div className="text-left flex items-start gap-4">
                  <Crown className="w-10 h-10 text-amber-500 flex-shrink-0" />
                  <div>
                    <h4 className="text-lg font-black text-[#4A3E3D] flex items-center gap-2">
                      Unlock Full Directory Access with Lumo Bites PRO
                    </h4>
                    <p className="text-sm text-[#8B7E7D] mt-1 leading-relaxed">
                      Sitter profiles are currently blurred. Subscribe to PRO to view full bios, phone numbers, contact sitters directly, and enjoy instant lost pet broadcasts, pet scan alerts, and premium care resources!
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setUnlockModalOpen(true)}
                  className="bg-gradient-to-r from-[#FFB703] to-[#FB8500] hover:from-[#F5A623] hover:to-[#E67E22] text-white font-black py-3 px-6 rounded-xl transition-all shadow-md text-sm whitespace-nowrap cursor-pointer"
                >
                  Unlock PRO Features
                </button>
              </div>
            )}

            {/* Sitters & Map Layout */}
            {loadingSitters ? (
              <div className="text-center text-[#8B5E3C] py-12">Loading trusted sitters...</div>
            ) : filteredSitters.length === 0 ? (
              <div className="text-center bg-white p-12 rounded-3xl border border-[#E8DDD4]">
                <Footprints className="w-10 h-10 text-[#8B5E3C] mx-auto mb-4" />
                <h3 className="text-xl font-bold text-[#4A3E3D] mb-2">No active sitters found in this area yet.</h3>
                <p className="text-[#8B7E7D] mb-4">Try expanding your search distance, or be the first to join!</p>
                <button 
                  onClick={() => setActiveTab('become')}
                  className="text-[#8B5E3C] font-bold hover:text-[#7A5234] flex items-center justify-center gap-1 mx-auto"
                >
                  Be the first! &rarr;
                </button>
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Sitters List (Left on desktop, Above on mobile) */}
                <div className="flex-1 order-1 lg:order-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                    {filteredSitters.map(sitter => (
                      <div
                        key={sitter.id}
                        id={`sitter-card-${sitter.id}`}
                        onClick={() => handleViewReviews(sitter)}
                        className={`bg-white rounded-3xl p-6 border transition-all duration-300 cursor-pointer ${
                          highlightedSitterId === sitter.id 
                            ? 'border-[#8B5E3C] ring-4 ring-[#8B5E3C]/20 shadow-md scale-[1.01]' 
                            : 'border-[#E8DDD4] shadow-sm hover:shadow-md'
                        }`}
                      >
                        
                        <div className="flex items-start gap-4 mb-4">
                          {sitter.photo_url ? (
                            <img src={sitter.photo_url} alt={sitter.name} className="w-16 h-16 rounded-full object-cover border-2 border-[#FAF6F4] flex-shrink-0" />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-[#E8DDD4] flex items-center justify-center text-[#8B5E3C] font-bold text-xl flex-shrink-0">
                              {sitter.name.charAt(0)}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                             <div className="flex items-center gap-2 flex-wrap mb-0.5">
                               <h3 className="text-xl font-bold text-[#4A3E3D]">{sitter.name}</h3>
                               {sitter.gender && (
                                 <span className="text-[#8B7E7D] text-xs font-semibold px-2 py-0.5 bg-[#FAF6F4] rounded border border-[#E8DDD4]">
                                   {sitter.gender}
                                 </span>
                               )}
                               {sitter.approval_status === 'approved' && (
                                 <div className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-bold px-2.5 py-0.5 rounded-full mb-1 border border-green-200">
                                   <ShieldCheck className="w-3.5 h-3.5" /> ID Verified
                                 </div>
                               )}
                               {sitter.completed_bookings && sitter.completed_bookings > 0 ? (
                                 <div className="inline-flex items-center gap-1 bg-[#8B5E3C]/10 text-[#8B5E3C] text-xs font-bold px-2.5 py-0.5 rounded-full mb-1 border border-[#8B5E3C]/20">
                                   🐾 {sitter.completed_bookings} {sitter.completed_bookings === 1 ? 'booking' : 'bookings'} completed
                                 </div>
                               ) : null}
                             </div>
                             <div className="text-sm mb-1">
                               {sitter.review_count ? (
                                 <span className="text-[#D97706] font-bold flex items-center gap-1">
                                   <Star className="w-3.5 h-3.5 fill-[#D97706] text-[#D97706]" />
                                   {sitter.avg_rating} <span className="text-[#8B7E7D] font-normal">({sitter.review_count} {sitter.review_count === 1 ? 'review' : 'reviews'})</span>
                                 </span>
                               ) : (
                                 <span className="text-[#8B7E7D]">No reviews yet</span>
                               )}
                             </div>
                            <p className="text-[#8B7E7D] text-sm flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-gray-400" /> {sitter.city ? (
                                (sitter.country && (
                                  sitter.city.toLowerCase().includes(sitter.country.toLowerCase()) ||
                                  (sitter.country.toLowerCase() === 'united states' && (sitter.city.toLowerCase().includes('usa') || sitter.city.toLowerCase().includes('u.s.a.'))) ||
                                  (sitter.country.toLowerCase() === 'united kingdom' && (sitter.city.toLowerCase().includes('uk') || sitter.city.toLowerCase().includes('u.k.')))
                                )) ? sitter.city : `${sitter.city}${sitter.country ? `, ${sitter.country}` : ''}`
                              ) : ''}
                            </p>
                            {sitter.phone_number && (
                              <p className="text-[#8B7E7D] text-sm flex items-center gap-1 mt-1">
                                <Phone className="w-3.5 h-3.5 text-gray-400" /> <span className={sitter.phone_number.includes('***') ? 'blur-[3px] select-none text-[#555555]' : 'font-semibold text-[#4A3E3D]'}>{sitter.phone_number}</span>
                              </p>
                            )}
                            {sitter.distance !== undefined && (
                              <p className="text-[#8B5E3C] text-xs font-bold mt-0.5 ml-5">
                                {sitter.distance.toFixed(1)} miles away
                              </p>
                            )}
                          </div>
                        </div>

                        <p className={`text-[#555555] text-sm mb-4 line-clamp-3 h-[60px] ${!isOwnerPro ? 'blur-[3px] select-none' : ''}`}>{sitter.bio}</p>

                        <div className="flex flex-col gap-2 mb-4">
                          {(sitter.available_days?.length || 0) > 0 && (
                            <p className="text-xs text-[#8B7E7D] flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-gray-400" /> <span className="font-semibold text-[#4A3E3D]">Available:</span> {sitter.available_days?.length === 7 ? 'All Week' : sitter.available_days?.includes('Saturday') && sitter.available_days?.includes('Sunday') && sitter.available_days?.length === 2 ? 'Weekends Only' : sitter.available_days?.join(', ')}
                            </p>
                          )}
                          {(sitter.service_types?.length || 0) > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {sitter.service_types?.map(st => (
                                <span key={st} className="text-[10px] font-bold uppercase tracking-wider text-[#8B5E3C] bg-[#FAF6F4] px-2 py-0.5 rounded border border-[#E8DDD4] inline-flex items-center gap-1">
                                  {st === 'Home visits' ? (
                                    <><Home className="w-3 h-3" /> Drop-in</>
                                  ) : st === 'Overnight stays' ? (
                                    <><Moon className="w-3 h-3" /> Overnight</>
                                  ) : st === 'Dog walking' ? (
                                    <><Footprints className="w-3 h-3" /> Walking</>
                                  ) : (
                                    <><Home className="w-3 h-3" /> Boarding</>
                                  )}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between mb-6">
                          <div className="text-sm font-semibold text-[#8B5E3C] bg-[#FAF6F4] px-3 py-1 rounded-lg">
                            {sitter.pet_types === 'both' ? 'Dogs & Cats' : sitter.pet_types === 'dog' ? 'Dogs Only' : 'Cats Only'}
                          </div>
                          <div className="text-lg font-black text-[#4A3E3D]">
                            ${sitter.rate_per_night}<span className="text-sm font-medium text-[#8B7E7D]">/night</span>
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isOwnerPro) {
                              setUnlockModalOpen(true);
                            } else {
                              setSelectedSitter(sitter);
                              setRequestModalOpen(true);
                            }
                          }}
                          className="w-full bg-[#8B5E3C] hover:bg-[#7A5234] text-white font-bold py-3 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          {!isOwnerPro && <Lock className="w-3.5 h-3.5" />}
                          <span>{isOwnerPro ? 'Request Sitter' : 'Unlock & Request'}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Map (Right on desktop, Below on mobile) */}
                <div className="w-full lg:w-[45%] lg:sticky lg:top-24 h-[400px] lg:h-[calc(100vh-140px)] order-2 lg:order-2 rounded-3xl overflow-hidden shadow-sm border border-[#E8DDD4] relative z-0" style={{ zIndex: 0 }}>
                  <SitterMap 
                    sitters={filteredSitters}
                    searchCoords={searchCoords}
                    onSelectSitter={handleSelectSitterFromMap}
                    highlightedSitterId={highlightedSitterId}
                  />
                </div>
              </div>
            )}
            {/* Owner Booking History Section */}
            <div className="mt-12 bg-white rounded-3xl p-8 border border-[#E8DDD4] shadow-sm max-w-4xl mx-auto text-left">
              <h3 className="text-xl font-black text-[#4A3E3D] mb-2 flex items-center gap-2">
                📋 Your Booking History
              </h3>
              <p className="text-[#8B7E7D] text-sm mb-6">
                Enter your email address to track the status of your requested pet sitting bookings.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-6 max-w-md">
                <input
                  type="email"
                  placeholder="Enter your email address..."
                  value={ownerHistoryEmail}
                  onChange={(e) => setOwnerHistoryEmail(e.target.value)}
                  className="flex-1 bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-4 py-3 text-[#4A3E3D] text-sm focus:outline-none focus:border-[#8B5E3C]"
                />
                <button
                  onClick={() => fetchOwnerRequests(ownerHistoryEmail)}
                  disabled={loadingOwnerRequests}
                  className="bg-[#8B5E3C] hover:bg-[#7A5234] text-white font-bold py-3 px-6 rounded-xl text-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {loadingOwnerRequests ? 'Searching...' : 'Track Bookings'}
                </button>
              </div>

              {ownerHistoryFetched && (
                <div className="space-y-4">
                  {ownerRequests.length === 0 ? (
                    <div className="text-center py-6 text-gray-500 bg-[#FAF6F4] rounded-2xl border border-dashed border-[#E8DDD4]">
                      No bookings found for this email address.
                    </div>
                  ) : (
                    <div className="overflow-hidden border border-[#E8DDD4] rounded-2xl bg-[#FAF6F4]">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-[#E8DDD4]/20 border-b border-[#E8DDD4]">
                              <th className="p-3 text-xs font-bold text-[#4A3E3D] uppercase">Booking #</th>
                              <th className="p-3 text-xs font-bold text-[#4A3E3D] uppercase">Sitter</th>
                              <th className="p-3 text-xs font-bold text-[#4A3E3D] uppercase">Pet</th>
                              <th className="p-3 text-xs font-bold text-[#4A3E3D] uppercase">Dates</th>
                              <th className="p-3 text-xs font-bold text-[#4A3E3D] uppercase">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E8DDD4]/50">
                            {ownerRequests.map((req) => (
                              <React.Fragment key={req.id}>
                                <tr className="hover:bg-white/50 transition-colors">
                                  <td className="p-3 text-sm font-bold text-[#4A3E3D]">{req.booking_number || `Booking #${req.id.substring(0, 4)}`}</td>
                                  <td className="p-3 text-sm">
                                    <div className="font-bold text-[#4A3E3D]">{req.sitter_name}</div>
                                  </td>
                                  <td className="p-3 text-sm">
                                    <span className="font-semibold text-[#4A3E3D]">{req.pet_name}</span>
                                    <span className="ml-1.5 text-[10px] font-bold text-[#8B5E3C] bg-white border border-[#E8DDD4] px-1.5 py-0.5 rounded uppercase">
                                      {req.pet_type === 'dog' ? '🐶' : '🐱'}
                                    </span>
                                  </td>
                                  <td className="p-3 text-sm text-[#8B7E7D]">{req.dates}</td>
                                  <td className="p-3 text-sm">
                                    {req.status === 'accepted' ? (
                                      <span className="bg-green-100 text-green-700 font-bold text-xs px-2.5 py-1 rounded-full border border-green-200">
                                        🟢 Accepted
                                      </span>
                                    ) : req.status === 'completed' ? (
                                      <span className="bg-blue-100 text-blue-700 font-bold text-xs px-2.5 py-1 rounded-full border border-blue-200">
                                        🔵 Completed
                                      </span>
                                    ) : req.status === 'declined' ? (
                                      <span className="bg-red-100 text-red-700 font-bold text-xs px-2.5 py-1 rounded-full border border-red-200">
                                        🔴 Declined
                                      </span>
                                    ) : (
                                      <span className="bg-yellow-100 text-yellow-700 font-bold text-xs px-2.5 py-1 rounded-full border border-yellow-200 animate-pulse">
                                        🟡 Pending
                                      </span>
                                    )}
                                  </td>
                                </tr>
                                {(req.status === 'accepted' || req.status === 'completed') && (
                                  <tr className="bg-green-50/30">
                                    <td colSpan={5} className="p-3 text-xs border-t border-b border-[#E8DDD4]/30">
                                      <div className="bg-white p-3 rounded-xl border border-green-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div>
                                          <p className="font-bold text-[#3B2410] mb-1">🐾 Contact Info Shared</p>
                                          <p className="text-gray-600">Email: <strong>{req.sitter_email}</strong> {req.sitter_phone ? ` | Phone: ` : ''}<strong>{req.sitter_phone}</strong></p>
                                        </div>

                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* BECOME A SITTER TAB */}
        {activeTab === 'become' && (
          <div className="max-w-2xl mx-auto bg-white rounded-3xl p-8 border border-[#E8DDD4] shadow-sm animate-fade-in">
            {profilePreviewMode ? (
              <div className="animate-fade-in text-center">
                {sitterApprovalStatus === 'pending' && (
                  <>
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-yellow-100 text-yellow-600">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    {needsReapproval ? (
                      <>
                        <h2 className="text-3xl font-black text-[#4A3E3D] mb-2">Profile Under Re-Review</h2>
                        <p className="text-[#8B7E7D] mb-8 max-w-md mx-auto">
                          Your updated photo has been submitted for review. Your profile will be temporarily hidden until our team approves it — usually within 24 hours.
                        </p>
                      </>
                    ) : (
                      <>
                        <h2 className="text-3xl font-black text-[#4A3E3D] mb-2">Profile Submitted for Review</h2>
                        <p className="text-[#8B7E7D] mb-8 max-w-md mx-auto">
                          Your profile has been submitted for review. We will notify you by email within 24 hours once approved.
                        </p>
                      </>
                    )}

                    {/* Share & Invite Section */}
                    <div className="bg-[#FAF6F4] border border-[#E8DDD4] rounded-3xl p-6 mb-8 max-w-md mx-auto text-left shadow-sm">
                      <h4 className="text-base font-black text-[#4A3E3D] mb-2 flex items-center gap-2">
                        <Footprints className="w-4 h-4 text-[#8B5E3C]" /> Know someone who'd make a great sitter? Invite them!
                      </h4>
                      <p className="text-xs text-[#8B7E7D] mb-4">Share Lumo Bites with your friends and help them start earning money pet sitting in their neighborhood with no commissions ever!</p>
                      
                      <div className="bg-white border border-[#E8DDD4] rounded-2xl p-4 mb-4 text-xs text-[#4A3E3D] font-medium leading-relaxed select-all">
                        "Hey! I just signed up as a pet sitter on Lumo Bites — a free platform where you can earn money sitting pets in your neighborhood. No commission ever! Check it out and create your profile: lumobites.net/petsitting"
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={handleCopyMessage}
                          className="bg-[#8B5E3C] hover:bg-[#7A5234] text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          <Clipboard className="w-4 h-4" /> Copy Msg
                        </button>
                        <button
                          type="button"
                          onClick={handleCopyLink}
                          className="bg-white border border-[#E8DDD4] text-[#4A3E3D] hover:bg-[#FAF6F4] font-bold py-2.5 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          <Share2 className="w-4 h-4" /> Copy Link
                        </button>
                      </div>
                    </div>
                  </>
                )}
                {sitterApprovalStatus === 'rejected' && (
                  <>
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-red-100 text-red-600">
                      <AlertTriangle className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-3xl font-black text-[#4A3E3D] mb-2">Profile Not Approved</h2>
                    <p className="text-[#8B7E7D] mb-8 max-w-md mx-auto">
                      Please check your email for the reason and update your profile below to resubmit.
                    </p>
                  </>
                )}
                {sitterApprovalStatus === 'approved' && (
                  <>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isProSitter ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {isProSitter ? (
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      ) : (
                        <AlertTriangle className="w-8 h-8 text-red-600" />
                      )}
                    </div>
                    <h2 className="text-3xl font-black text-[#4A3E3D] mb-2">Sitter Profile Active</h2>
                    <p className="text-[#8B7E7D] mb-8 max-w-md mx-auto">
                      Your profile is approved and visible to pet owners in your neighborhood.
                    </p>
                  </>
                )}
                
                {/* Profile Preview Card */}
                <div className="bg-[#FAF6F4] border border-[#E8DDD4] rounded-2xl p-6 text-left mb-8 shadow-sm max-w-sm mx-auto relative overflow-hidden opacity-80">
                  <div className="absolute top-4 right-4 bg-gray-100 text-gray-700 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">{sitterApprovalStatus}</div>
                  <div className="flex items-center gap-4 mb-4 mt-2">
                    {sitterPhoto ? (
                      <img src={sitterPhoto} alt={sitterName} className="w-16 h-16 rounded-full object-cover shadow-sm border-2 border-white" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-[#E8DDD4] flex items-center justify-center text-xl font-bold text-[#8B7E7D]">
                        {sitterName.charAt(0) || '?'}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-lg text-[#4A3E3D] leading-tight pr-12">{sitterName || 'New Sitter'}</h3>
                      {completedBookings > 0 && (
                        <div className="inline-flex items-center gap-1 bg-[#8B5E3C]/10 text-[#8B5E3C] text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 border border-[#8B5E3C]/20">
                          🐾 {completedBookings} {completedBookings === 1 ? 'booking' : 'bookings'} completed
                        </div>
                      )}
                      <p className="text-[#8B7E7D] text-sm flex items-center gap-1 mt-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/></svg>
                        {sitterCity || sitterLocationInput || 'Location'}
                      </p>
                    </div>
                  </div>
                  <p className="text-[#555555] text-sm mb-4 line-clamp-3">{sitterBio || 'Your bio will appear here...'}</p>
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-[#8B5E3C] bg-white px-3 py-1 rounded-lg border border-[#E8DDD4]">
                      {sitterPetTypes === 'both' ? 'Dogs & Cats' : sitterPetTypes === 'dog' ? 'Dogs Only' : 'Cats Only'}
                    </div>
                    <div className="text-lg font-black text-[#4A3E3D]">
                      ${sitterRate || '0'}<span className="text-sm font-medium text-[#8B7E7D]">/night</span>
                    </div>
                  </div>
                </div>

                {profileMessage && <div className="text-red-600 text-sm font-bold mb-4">{profileMessage}</div>}

                <div className="flex flex-col gap-3 max-w-sm mx-auto">
                  <button onClick={() => setProfilePreviewMode(false)} className="w-full bg-[#FAF6F4] border border-[#E8DDD4] hover:bg-[#E8DDD4] text-[#4A3E3D] font-bold py-4 rounded-xl transition-all shadow-sm">
                    Edit Profile
                  </button>
                  
                  {sitterApprovalStatus === 'approved' && isProSitter && (
                    <button type="button" onClick={() => window.location.href = '/account'} className="w-full bg-[#8B5E3C] hover:bg-[#7A5234] text-white font-bold py-4 rounded-xl transition-all shadow-sm">
                      Manage Subscription
                    </button>
                  )}
                  {sitterApprovalStatus === 'approved' && !isProSitter && (
                    <button type="button" onClick={handleStripeCheckout} disabled={profileLoading} className="w-full bg-gradient-to-r from-[#FFB703] to-[#FB8500] hover:from-[#F5A623] hover:to-[#E67E22] text-white font-black py-4 rounded-xl transition-all shadow-md flex justify-center items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      {profileLoading ? 'Redirecting...' : 'Go Live for $9.99/mo'}
                    </button>
                  )}
                  
                  {sitterApprovalStatus !== 'pending' && (
                    <div className="bg-[#FAF6F4] border border-[#E8DDD4] rounded-3xl p-6 mt-8 max-w-sm mx-auto text-left shadow-sm">
                      <h4 className="text-base font-black text-[#4A3E3D] mb-2 flex items-center gap-2">
                        <Footprints className="w-4 h-4 text-[#8B5E3C]" /> Invite a Friend
                      </h4>
                      <p className="text-xs text-[#8B7E7D] mb-4">Know someone who'd make a great pet sitter? Invite them to join Lumo Bites!</p>
                      
                      <div className="grid grid-cols-1 gap-2">
                        <button
                          type="button"
                          onClick={handleCopyMessage}
                          className="bg-[#8B5E3C] hover:bg-[#7A5234] text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          <Clipboard className="w-4 h-4" /> Copy Message
                        </button>
                        <button
                          type="button"
                          onClick={handleCopyLink}
                          className="bg-white border border-[#E8DDD4] text-[#4A3E3D] hover:bg-[#FAF6F4] font-bold py-2.5 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          <Share2 className="w-4 h-4" /> Copy Share Link
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sitter Availability Calendar Section */}
                <div className="border-t border-[#F0E8E0] pt-8 mt-8 text-left w-full">
                  <h3 className="text-xl font-black text-[#4A3E3D] mb-2 flex items-center gap-2">
                    📅 Manage Your Availability
                  </h3>
                  <p className="text-[#8B7E7D] text-xs mb-6">
                    Block out days you are unavailable. Your accepted bookings (shown in red) are automatically marked as busy.
                  </p>

                  <div className="bg-[#FAF6F4] border border-[#E8DDD4] rounded-3xl p-6 shadow-sm max-w-md mx-auto">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-bold text-[#4A3E3D]">
                        {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][calMonth]} {calYear}
                      </h4>
                      <div className="flex space-x-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            if (calMonth === 0) {
                              setCalMonth(11);
                              setCalYear(prev => prev - 1);
                            } else {
                              setCalMonth(calMonth - 1);
                            }
                          }}
                          className="p-1.5 rounded-lg hover:bg-[#F6EFEA] text-[#8B5E3C] transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (calMonth === 11) {
                              setCalMonth(0);
                              setCalYear(prev => prev + 1);
                            } else {
                              setCalMonth(calMonth + 1);
                            }
                          }}
                          className="p-1.5 rounded-lg hover:bg-[#F6EFEA] text-[#8B5E3C] transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M9 5l7 7-7 7" /></svg>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-bold text-[#8B6A50] mb-2 uppercase tracking-wider">
                      <div>Su</div>
                      <div>Mo</div>
                      <div>Tu</div>
                      <div>We</div>
                      <div>Th</div>
                      <div>Fr</div>
                      <div>Sa</div>
                    </div>

                    <div className="grid grid-cols-7 gap-1.5">
                      {(() => {
                        const firstDay = new Date(calYear, calMonth, 1).getDay();
                        const totalDays = new Date(calYear, calMonth + 1, 0).getDate();
                        const todayStr = new Date().toISOString().split('T')[0];
                        
                        const cells = [];
                        for (let i = 0; i < firstDay; i++) {
                          cells.push(<div key={`empty-${i}`} className="aspect-square" />);
                        }
                        
                        for (let d = 1; d <= totalDays; d++) {
                          const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                          const isBooked = sitterBookedDates.includes(dateStr);
                          const isBlocked = sitterBlockedDates.includes(dateStr);
                          const isPast = dateStr < todayStr;
                          
                          let bgClass = "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-100 cursor-pointer";
                          if (isPast) {
                            bgClass = "bg-gray-100/50 text-gray-300 cursor-not-allowed";
                          } else if (isBooked) {
                            bgClass = "bg-red-50 text-red-700 border border-red-100 line-through cursor-not-allowed";
                          } else if (isBlocked) {
                            bgClass = "bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-100 cursor-pointer";
                          }
                          
                          cells.push(
                            <button
                              key={`day-${d}`}
                              type="button"
                              disabled={isPast || isBooked}
                              onClick={() => {
                                handleSitterBlockedDateToggle(dateStr);
                              }}
                              className={`aspect-square rounded-xl flex items-center justify-center text-sm transition-all font-semibold ${bgClass}`}
                            >
                              {d}
                            </button>
                          );
                        }
                        return cells;
                      })()}
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 mt-4 pt-4 border-t border-[#E8DDD4] text-xs font-medium text-[#8B7E7D]">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-emerald-50 border border-emerald-100 inline-block" /> Available
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-orange-50 border border-orange-100 inline-block" /> Blocked
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-red-50 border border-red-100 inline-block" /> Booked
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sitter Booking Tracker Section */}
                <div className="border-t border-[#F0E8E0] pt-8 mt-8 text-left w-full">
                  <h3 className="text-xl font-black text-[#4A3E3D] mb-2 flex items-center gap-2">
                    📋 Your Booking Requests
                  </h3>
                  <p className="text-[#8B7E7D] text-xs mb-6">
                    Manage requests and track booking statuses submitted by pet owners.
                  </p>

                  {loadingSitterRequests ? (
                    <div className="text-center py-6 text-gray-500">Loading your bookings...</div>
                  ) : sitterRequests.length === 0 ? (
                    <div className="text-center py-6 text-[#8B7E7D] bg-[#FAF6F4] rounded-2xl border border-dashed border-[#E8DDD4]">
                      No booking requests received yet.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {sitterRequests.map((req) => {
                        const isPending = req.status === 'pending';
                        const isAccepted = req.status === 'accepted';
                        const isCompleted = req.status === 'completed';
                        const isDeclined = req.status === 'declined';
                        
                        // Check if completed at least 2 hours ago
                        let canSendReminder = false;
                        if (isCompleted && req.completed_at) {
                          const completedTime = new Date(req.completed_at).getTime();
                          const twoHoursInMs = 2 * 60 * 60 * 1000;
                          canSendReminder = Date.now() - completedTime >= twoHoursInMs;
                        }



                        return (
                          <div key={req.id} className="bg-[#FAF6F4] border border-[#E8DDD4] rounded-2xl p-4 space-y-3">
                            <div className="flex justify-between items-center flex-wrap gap-2">
                              <span className="font-bold text-sm text-[#4A3E3D]">
                                {req.booking_number || `Booking #${req.id.substring(0, 4)}`}
                              </span>
                              <div>
                                {isAccepted && (
                                  <span className="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-green-200">
                                    🟢 Accepted
                                  </span>
                                )}
                                {isCompleted && (
                                  <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-200">
                                    🔵 Completed
                                  </span>
                                )}
                                {isDeclined && (
                                  <span className="bg-red-100 text-red-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-red-200">
                                    🔴 Declined
                                  </span>
                                )}
                                {isPending && (
                                  <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-yellow-200 animate-pulse">
                                    🟡 Pending
                                  </span>
                                )}
                              </div>
                            </div>

                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#8B7E7D]">
                              <div><strong>Pet Name:</strong> {req.pet_name} ({req.pet_type})</div>
                              <div><strong>Dates:</strong> {req.dates}</div>
                              {(() => {
                                const { petAge, cleanNotes } = parseSpecialNotes(req.special_notes);
                                return (
                                  <>
                                    {petAge && (
                                      <div><strong>Pet Age:</strong> {petAge}</div>
                                    )}
                                    {req.created_at && (
                                      <div className={petAge ? "" : "col-span-1 sm:col-span-2"}>
                                        <strong>Requested On:</strong> {new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                      </div>
                                    )}
                                    {cleanNotes && (
                                      <div className="col-span-1 sm:col-span-2 mt-1 bg-white p-2.5 rounded-xl border border-[#E8DDD4]">
                                        <strong>Notes:</strong> {cleanNotes}
                                      </div>
                                    )}
                                  </>
                                );
                              })()}
                            </div>

                            {/* Contact Details (Step 5) */}
                            {isAccepted && (
                              <div className="text-xs bg-white p-2.5 rounded-xl border border-[#E8DDD4] space-y-1">
                                <div className="font-bold text-[#3B2410] mb-0.5">Owner Contact Info:</div>
                                {req.owner_name && <div>Name: <strong>{req.owner_name}</strong></div>}
                                <div>Email: <strong>{req.owner_email}</strong></div>
                                {req.phone_number && <div>Phone: <strong>{req.phone_number}</strong></div>}
                              </div>
                            )}

                            {isCompleted && req.owner_name && (
                              <div className="text-xs bg-white p-2.5 rounded-xl border border-[#E8DDD4] space-y-1">
                                <div className="font-bold text-[#3B2410] mb-0.5">Owner Details:</div>
                                <div>Name: <strong>{req.owner_name}</strong></div>
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2 flex-wrap">
                              {isPending && (
                                <>
                                  <button
                                    onClick={() => handleSitterResponse(req.id, 'accept', req.secure_token)}
                                    className="bg-[#10B981] hover:bg-[#059669] text-white font-bold py-1.5 px-3 rounded-lg text-xs transition-colors cursor-pointer"
                                  >
                                    Accept Request
                                  </button>
                                  <button
                                    onClick={() => handleSitterResponse(req.id, 'decline', req.secure_token)}
                                    className="bg-[#EF4444] hover:bg-[#DC2626] text-white font-bold py-1.5 px-3 rounded-lg text-xs transition-colors cursor-pointer"
                                  >
                                    Decline Request
                                  </button>
                                </>
                              )}

                              {isAccepted && (
                                <button
                                  onClick={() => handleMarkAsCompleted(req.id)}
                                  className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold py-1.5 px-4 rounded-lg text-xs transition-colors cursor-pointer"
                                >
                                  Mark as Completed
                                </button>
                              )}


                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-black text-[#4A3E3D] mb-2">Join Lumo Sitters</h2>
                  <p className="text-[#8B7E7D]">Create or manage your profile to receive pet sitting requests in your neighborhood.</p>
                </div>

            {sitterAuthMode === 'email' && (
              <form onSubmit={handleSitterEmailSubmit} className="space-y-4 max-w-sm mx-auto animate-fade-in">
                <div>
                  <label className="block text-sm font-bold text-[#4A3E3D] mb-2">Enter your email</label>
                  <input required type="email" value={sitterEmail} onChange={e => setSitterEmail(e.target.value)} className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C] text-center" placeholder="your@email.com" />
                </div>
                {sitterAuthError && <div className="text-red-600 text-sm font-bold text-center">{sitterAuthError}</div>}
                <button type="submit" disabled={sitterAuthLoading || !sitterEmail} className="w-full bg-[#8B5E3C] hover:bg-[#7A5234] text-white font-bold py-3 rounded-xl transition-all shadow-sm">
                  {sitterAuthLoading ? 'Checking...' : 'Continue'}
                </button>
              </form>
            )}

            {sitterAuthMode === 'otp' && (
              <form onSubmit={handleSitterOtpSubmit} className="space-y-4 max-w-sm mx-auto animate-fade-in">
                <div className="text-center mb-4">
                  <Key className="w-8 h-8 text-[#8B5E3C] mx-auto mb-2" />
                  <p className="text-sm text-[#8B7E7D]">Enter the 6-digit code we sent to <strong>{sitterEmail}</strong></p>
                </div>
                <div>
                  <input required type="text" maxLength={6} value={sitterAuthCode} onChange={e => setSitterAuthCode(e.target.value)} className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-4 py-4 text-center text-2xl tracking-[0.5em] font-bold text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]" placeholder="••••••" />
                  <p className="text-xs text-[#8B7E7D] text-center mt-3">Didn't receive the code? Check your spam or junk folder. Still need help? Email us at <a href="mailto:info@lumobitespet.com" className="text-[#8B5E3C] hover:underline">info@lumobitespet.com</a></p>
                </div>
                {sitterAuthError && <div className="text-red-600 text-sm font-bold text-center">{sitterAuthError}</div>}
                <button type="submit" disabled={sitterAuthLoading || sitterAuthCode.length < 6} className="w-full bg-[#8B5E3C] hover:bg-[#7A5234] text-white font-bold py-3 rounded-xl transition-all shadow-sm">
                  {sitterAuthLoading ? 'Verifying...' : 'Verify & Login'}
                </button>
                <button type="button" onClick={() => setSitterAuthMode('email')} className="w-full text-[#8B7E7D] text-sm font-semibold hover:text-[#8B5E3C] mt-2">
                  &larr; Back
                </button>
              </form>
            )}

            {sitterAuthMode === 'form' && (
              <div className="animate-fade-in">
                {!isProSitter && profileMessage === '' && (
                  <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 items-start">
                    <AlertTriangle className="w-5 h-5 text-red-500 inline-block mr-1.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-red-800 text-sm">Profile Inactive & Hidden</h4>
                      <p className="text-red-700 text-xs mt-1">Your sitter profile is hidden from search results. Subscribe for $9.99/mo to go live.</p>
                    </div>
                  </div>
                )}

            <form onSubmit={handleProfileSubmit} className="space-y-6" noValidate>
              <div className="mb-6">
                <label className="block text-sm font-bold text-[#4A3E3D] mb-2">Email Address <Lock className="w-3.5 h-3.5 text-gray-400 inline ml-1" /></label>
                <div className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-500 font-medium">
                  {sitterEmail}
                </div>
                <p className="text-xs text-gray-500 mt-2">Email cannot be changed. Contact <a href="mailto:info@lumobitespet.com" className="text-[#8B5E3C] hover:underline">info@lumobitespet.com</a> for help.</p>
              </div>

              {sitterApprovalStatus === 'approved' && (
                <div className="bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl p-4 mb-6 flex gap-3 text-sm text-[#666666]">
                  <Lock className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  <p>Some profile information is locked after verification to maintain trust and security. Contact support at <a href="mailto:info@lumobitespet.com" className="text-[#8B5E3C] font-bold hover:underline">info@lumobitespet.com</a> if you need to make changes.</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-[#4A3E3D] mb-2">First Name {sitterApprovalStatus === 'approved' && <Lock className="w-3.5 h-3.5 text-gray-400 inline ml-1" />}</label>
                  {sitterApprovalStatus === 'approved' ? (
                    <div className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-500 font-medium">
                      {sitterFirstName}
                    </div>
                  ) : (
                    <input required type="text" value={sitterFirstName} onChange={e => setSitterFirstName(e.target.value)} className={`w-full bg-[#FAF6F4] border ${!!formErrors['firstName'] ? 'border-red-500 bg-red-50' : 'border-[#E8DDD4]'} rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]`} />
                  )}
                  {formErrors['firstName'] && <p className="text-red-500 text-sm mt-1">{formErrors['firstName']}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#4A3E3D] mb-2">Last Name {sitterApprovalStatus === 'approved' && <Lock className="w-3.5 h-3.5 text-gray-400 inline ml-1" />}</label>
                  {sitterApprovalStatus === 'approved' ? (
                    <div className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-500 font-medium">
                      {sitterLastName}
                    </div>
                  ) : (
                    <input required type="text" value={sitterLastName} onChange={e => setSitterLastName(e.target.value)} className={`w-full bg-[#FAF6F4] border ${!!formErrors['lastName'] ? 'border-red-500 bg-red-50' : 'border-[#E8DDD4]'} rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]`} />
                  )}
                  {formErrors['lastName'] && <p className="text-red-500 text-sm mt-1">{formErrors['lastName']}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-[#4A3E3D] mb-2 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-gray-500" /> Profile Selfie
                    {!sitterPhoto && <span className="text-red-500 ml-1 text-xs font-normal">— required for verification</span>}
                  </label>
                  {formErrors['photo'] && <p className="text-red-500 text-sm mb-1">{formErrors['photo']}</p>}
                  {sitterPhoto ? (
                    // Already has a photo (new upload or loaded from DB)
                    <div className="flex flex-col sm:flex-row items-center gap-4 p-3 rounded-xl bg-green-50 border border-green-200 justify-between">
                      <div className="flex items-center gap-4">
                        <img src={sitterPhoto} alt="Profile" className="w-16 h-16 rounded-full object-cover border-2 border-green-300" />
                        <div className="flex-1">
                          <p className="text-sm font-bold text-green-700 flex items-center gap-1"><ShieldCheck className="w-4 h-4" /> Already verified</p>
                          <p className="text-xs text-green-600 mt-0.5">Your selfie is on file.</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSitterPhoto('')}
                        className="w-full sm:w-auto text-xs font-bold text-[#8B5E3C] bg-white border border-[#E8DDD4] hover:bg-[#FAF6F4] px-4 py-2 rounded-xl transition-colors shadow-sm cursor-pointer shrink-0"
                      >
                        Update Photo
                      </button>
                    </div>
                  ) : (
                    // New sitter — needs to upload
                    <div className="flex flex-col sm:flex-row items-center gap-4 p-2 rounded-xl">
                      <div className="w-16 h-16 rounded-full bg-[#E8DDD4] flex items-center justify-center text-gray-400 shrink-0">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </div>
                      <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input 
                          type="file" 
                          ref={profilePhotoInputRef}
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 4 * 1024 * 1024) {
                                setFormErrors(prev => ({ ...prev, photo: 'Your photo is too large. Please use a photo under 4MB' }));
                                return;
                              } else {
                                setFormErrors(prev => { const newErr = {...prev}; delete newErr.photo; return newErr; });
                              }
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                const img = new window.Image();
                                img.onload = () => {
                                  const canvas = document.createElement('canvas');
                                  let width = img.width;
                                  let height = img.height;
                                  const MAX_WIDTH = 800;
                                  const MAX_HEIGHT = 800;
                                  if (width > height) {
                                    if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                                  } else {
                                    if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
                                  }
                                  canvas.width = width;
                                  canvas.height = height;
                                  const ctx = canvas.getContext('2d');
                                  ctx?.drawImage(img, 0, 0, width, height);
                                  setSitterPhoto(canvas.toDataURL('image/jpeg', 0.7));
                                };
                                img.src = reader.result as string;
                              };
                              reader.readAsDataURL(file);
                            }
                          }} 
                        />
                        <button 
                          type="button" 
                          onClick={() => startCamera('selfie')}
                          className="flex items-center justify-center gap-2 bg-[#FAF6F4] hover:bg-[#F0E6DD] text-[#8B5E3C] border border-[#E8DDD4] font-bold py-3 px-4 rounded-xl transition-all shadow-sm text-sm cursor-pointer"
                        >
                          <Camera className="w-4 h-4 shrink-0" />
                          <span>Take Selfie</span>
                        </button>
                        <button 
                          type="button" 
                          onClick={() => profilePhotoInputRef.current?.click()}
                          className="flex items-center justify-center gap-2 bg-[#FAF6F4] hover:bg-[#F0E6DD] text-[#8B5E3C] border border-[#E8DDD4] font-bold py-3 px-4 rounded-xl transition-all shadow-sm text-sm cursor-pointer"
                        >
                          <Upload className="w-4 h-4 shrink-0" />
                          <span>Upload Photo</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-[#4A3E3D] mb-2 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-gray-500" /> Government ID
                    {!hasExistingIdPhoto && !sitterIdPhoto && (
                      <> <span className="text-red-500 font-bold ml-1 text-xs">*Required</span> <span className="text-gray-400 font-normal text-xs">— used for verification only, never shown publicly</span></>
                    )}
                  </label>
                  {formErrors['id_photo'] && <p className="text-red-500 text-sm mb-1">{formErrors['id_photo']}</p>}
                  {(hasExistingIdPhoto || sitterIdPhoto) ? (
                    // Already submitted
                    <div className="flex flex-col sm:flex-row items-center gap-4 p-3 rounded-xl bg-green-50 border border-green-200 justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-12 rounded bg-green-100 flex items-center justify-center text-green-700 font-bold text-xl border border-green-200 shrink-0">
                          <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-green-700 flex items-center gap-1"><ShieldCheck className="w-4 h-4" /> Already submitted</p>
                          <p className="text-xs text-green-600 mt-0.5">Your ID is securely on file.</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSitterIdPhoto('');
                          setHasExistingIdPhoto(false);
                        }}
                        className="w-full sm:w-auto text-xs font-bold text-[#8B5E3C] bg-white border border-[#E8DDD4] hover:bg-[#FAF6F4] px-4 py-2 rounded-xl transition-colors shadow-sm cursor-pointer shrink-0"
                      >
                        Update ID
                      </button>
                    </div>
                  ) : (
                    // New sitter — needs to upload
                    <div className="flex items-center gap-4 p-2 rounded-xl bg-white border border-[#E8DDD4]">
                      <div className="w-16 h-12 rounded bg-[#E8DDD4] flex items-center justify-center text-gray-400">
                        🪪
                      </div>
                      <div className="flex-1 flex flex-col gap-2">
                        <input 
                          type="file" 
                          accept="image/*" 
                          capture="environment"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 4 * 1024 * 1024) {
                                alert('Your ID photo is too large. Please use a photo under 4MB');
                                return;
                              }
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                const img = new window.Image();
                                img.onload = () => {
                                  const canvas = document.createElement('canvas');
                                  let width = img.width;
                                  let height = img.height;
                                  const MAX_WIDTH = 1200;
                                  const MAX_HEIGHT = 1200;
                                  if (width > height) {
                                    if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                                  } else {
                                    if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
                                  }
                                  canvas.width = width;
                                  canvas.height = height;
                                  const ctx = canvas.getContext('2d');
                                  ctx?.drawImage(img, 0, 0, width, height);
                                  setSitterIdPhoto(canvas.toDataURL('image/jpeg', 0.8));
                                };
                                img.src = reader.result as string;
                              };
                              reader.readAsDataURL(file);
                            }
                          }} 
                          className="block w-full text-sm text-[#666666] file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-[#FAF6F4] file:text-[#8B5E3C] hover:file:bg-[#F0E6DD] transition-colors cursor-pointer focus:outline-none" 
                        />
                        <button 
                          type="button" 
                          onClick={() => startCamera('id')}
                          className="w-fit text-xs font-bold text-[#8B5E3C] bg-[#FAF6F4] border border-[#E8DDD4] hover:bg-[#F0E6DD] px-3.5 py-1.5 rounded-full transition-colors flex items-center gap-1.5 shadow-sm"
                        >
                          📷 Take Photo with Webcam
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-[#4A3E3D] mb-2">Location (City or Zip Code) {sitterApprovalStatus === 'approved' && <span title="Locked after verification">🔒</span>}</label>
                  {sitterApprovalStatus === 'approved' ? (
                    <div className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-500 font-medium flex items-center gap-2">
                      <span>📍</span> {sitterCity || sitterLocationInput}
                    </div>
                  ) : (
                    <>
                      <div className="relative">
                        <input 
                          required 
                          type="text" 
                          value={sitterLocationInput} 
                          onChange={e => {
                            setSitterLocationInput(e.target.value);
                            setSitterLocationVerified(false);
                            setSitterSelectedLocation(null);
                            setSitterLocationOptions([]);
                          }} 
                          onBlur={handleSitterLocationBlur}
                          className={`w-full bg-[#FAF6F4] border ${sitterLocationVerified ? 'border-green-500' : !!formErrors['location'] ? 'border-red-500 bg-red-50' : 'border-[#E8DDD4]'} rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C] pr-12`} 
                          placeholder="Enter city name OR 5-digit zip code..." 
                        />
                        {sitterIsLocating && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-[#8B5E3C] border-t-transparent rounded-full animate-spin"></div>
                        )}
                        {sitterLocationVerified && !sitterIsLocating && sitterSelectedLocation && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                          </div>
                        )}
                      </div>
                      
                      {formErrors['location'] && <p className="text-red-500 text-sm mt-1">{formErrors['location']}</p>}
                      
                      {sitterSelectedLocation && (
                        <p className="mt-2 text-sm font-bold text-green-600 flex items-center gap-1.5 animate-fade-in">
                          ✅ {sitterSelectedLocation.formatted_address}
                        </p>
                      )}
                      
                      {sitterLocationOptions.length > 1 && !sitterSelectedLocation && (
                        <div className="mt-3 p-4 bg-white border border-[#E8DDD4] rounded-xl shadow-sm absolute z-10 w-full left-0 right-0 max-h-60 overflow-y-auto">
                          <p className="text-sm font-bold text-[#4A3E3D] mb-2">Multiple locations found. Please select one:</p>
                          <div className="flex flex-col gap-2">
                            {sitterLocationOptions.map((opt, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => {
                                  setSitterSelectedLocation(opt);
                                  setSitterCity(opt.formatted_address);
                                  setSitterLocationVerified(true);
                                  setSitterLocationInput(opt.formatted_address);
                                }}
                                className="text-left px-4 py-2 hover:bg-[#FAF6F4] rounded-lg border border-transparent hover:border-[#E8DDD4] transition-colors text-[#4A3E3D] text-sm"
                              >
                                📍 {opt.formatted_address}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#4A3E3D] mb-2">Pets Accepted</label>
                  <select value={sitterPetTypes} onChange={e => setSitterPetTypes(e.target.value)} className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]">
                    <option value="both">Dogs & Cats</option>
                    <option value="dog">Dogs Only</option>
                    <option value="cat">Cats Only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#4A3E3D] mb-2">Gender (Optional)</label>
                  <select value={sitterGender} onChange={e => setSitterGender(e.target.value)} className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]">
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-binary">Non-binary</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#4A3E3D] mb-2">Rate per night ($)</label>
                  <input required type="number" min="0" value={sitterRate} onChange={e => setSitterRate(e.target.value)} className={`w-full bg-[#FAF6F4] border ${!!formErrors['rate'] ? 'border-red-500 bg-red-50' : 'border-[#E8DDD4]'} rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]`} placeholder="25" />
                  {formErrors['rate'] && <p className="text-red-500 text-sm mt-1">{formErrors['rate']}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#4A3E3D] mb-2">Phone Number (Optional)</label>
                  <input type="tel" value={sitterPhone} onChange={e => setSitterPhone(e.target.value)} className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C] mb-2" placeholder="(555) 555-5555" />
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="phone_vis" checked={sitterPhoneVisible} onChange={e => setSitterPhoneVisible(e.target.checked)} className="w-4 h-4 accent-[#8B5E3C]" />
                    <label htmlFor="phone_vis" className="text-[#8B7E7D] text-xs font-semibold cursor-pointer">Show my phone number to PRO members</label>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 space-y-6 pt-4 border-t border-[#E8DDD4]">
                <h3 className="text-lg font-black text-[#4A3E3D]">Availability & Services</h3>
                
                <div>
                  <label className="block text-sm font-bold text-[#4A3E3D] mb-3">Days Available</label>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <button type="button" onClick={() => setSitterAvailableDays(['Saturday', 'Sunday'])} className="px-3 py-1.5 text-xs font-bold rounded-lg border border-[#E8DDD4] text-[#666666] hover:bg-[#FAF6F4]">Weekends Only</button>
                    <button type="button" onClick={() => setSitterAvailableDays(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'])} className="px-3 py-1.5 text-xs font-bold rounded-lg border border-[#E8DDD4] text-[#666666] hover:bg-[#FAF6F4]">Weekdays Only</button>
                    <button type="button" onClick={() => setSitterAvailableDays(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])} className="px-3 py-1.5 text-xs font-bold rounded-lg border border-[#E8DDD4] text-[#666666] hover:bg-[#FAF6F4]">All Week</button>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                      <label key={day} className="flex items-center gap-2 text-sm text-[#4A3E3D] cursor-pointer">
                        <input type="checkbox" checked={sitterAvailableDays.includes(day)} onChange={e => {
                          if (e.target.checked) setSitterAvailableDays([...sitterAvailableDays, day]);
                          else setSitterAvailableDays(sitterAvailableDays.filter(d => d !== day));
                        }} className="w-4 h-4 accent-[#8B5E3C]" />
                        {day}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#4A3E3D] mb-3">Times Available</label>
                  <div className="flex flex-wrap gap-3">
                    {['Morning (6am-12pm)', 'Afternoon (12pm-6pm)', 'Evening (6pm-10pm)', 'Overnight', 'Flexible'].map(time => (
                      <label key={time} className="flex items-center gap-2 text-sm text-[#4A3E3D] cursor-pointer">
                        <input type="checkbox" checked={sitterAvailableTimes.includes(time)} onChange={e => {
                          if (e.target.checked) setSitterAvailableTimes([...sitterAvailableTimes, time]);
                          else setSitterAvailableTimes(sitterAvailableTimes.filter(t => t !== time));
                        }} className="w-4 h-4 accent-[#8B5E3C]" />
                        {time}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#4A3E3D] mb-3">Service Types Offered</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { val: 'Home visits', label: '🏠 Home visits (drop-in)' },
                      { val: 'Overnight stays', label: '🌙 Overnight stays' },
                      { val: 'Dog walking', label: '🚶 Dog walking' },
                      { val: 'Sitter\'s home boarding', label: '🏡 Sitter\'s home boarding' }
                    ].map(st => (
                      <label key={st.val} className="flex items-center gap-2 text-sm text-[#4A3E3D] cursor-pointer">
                        <input type="checkbox" checked={sitterServiceTypes.includes(st.val)} onChange={e => {
                          if (e.target.checked) setSitterServiceTypes([...sitterServiceTypes, st.val]);
                          else setSitterServiceTypes(sitterServiceTypes.filter(t => t !== st.val));
                        }} className="w-4 h-4 accent-[#8B5E3C]" />
                        {st.label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-[#4A3E3D] mb-2">About You (Bio)</label>
                <textarea required rows={4} value={sitterBio} onChange={e => setSitterBio(e.target.value)} className={`w-full bg-[#FAF6F4] border ${!!formErrors['bio'] ? 'border-red-500 bg-red-50' : 'border-[#E8DDD4]'} rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]`} placeholder="Tell pet owners about your experience..."></textarea>
                {formErrors['bio'] && <p className="text-red-500 text-sm mt-1">{formErrors['bio']}</p>}
              </div>

              <div className="flex flex-col gap-1.5 bg-[#FAF6F4] p-4 rounded-xl border border-[#E8DDD4]">
                <label className="flex items-center gap-3 text-sm text-[#4A3E3D] font-bold cursor-pointer">
                  <input type="checkbox" id="avail" required checked={sitterAvailable} onChange={e => setSitterAvailable(e.target.checked)} className="w-5 h-5 accent-[#8B5E3C] shrink-0" />
                  <span>I am currently accepting new requests</span>
                </label>
                {formErrors['availability'] && <p className="text-red-500 text-sm mt-1">{formErrors['availability']}</p>}
              </div>

              {/* Self-Declaration Checkbox & Terms of Service Note */}
              <div className="flex flex-col gap-3 bg-[#FAF6F4] p-4 rounded-xl border border-[#E8DDD4]">
                <label className="flex items-start gap-3 text-sm text-[#4A3E3D] font-medium cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={selfDeclared} 
                    onChange={e => setSelfDeclared(e.target.checked)} 
                    className="w-5 h-5 accent-[#8B5E3C] mt-0.5 shrink-0" 
                  />
                  <span>
                    I confirm that I have no criminal convictions or history that would affect my ability to safely and responsibly care for pets. I understand that providing false information may result in immediate removal from the platform.
                  </span>
                </label>
                {formErrors['self_declared'] && (
                  <p className="text-red-500 text-xs font-semibold pl-8 mt-0.5">
                    {formErrors['self_declared']}
                  </p>
                )}
                
                {/* Terms of Service Note */}
                <p className="text-xs text-gray-500 pl-8 leading-relaxed">
                  By submitting this form you agree to our Terms of Service and confirm the above declaration is true and accurate.
                </p>
              </div>

              {profileMessage && (
                <div className="p-4 rounded-xl bg-blue-50 text-blue-800 text-sm font-bold text-center">
                  {profileMessage}
                </div>
              )}

              {isProSitter ? (
                sitterSubCancelAtPeriodEnd ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 text-center">
                    <span className="text-3xl mb-2 block">⏳</span>
                    <h3 className="text-yellow-800 font-bold text-lg mb-1">Subscription Cancelled</h3>
                    <p className="text-yellow-700 text-sm mb-4">
                      Your subscription has been cancelled. Your profile will remain visible until <strong>{sitterSubEndDate}</strong> — <strong>{sitterSubDaysRemaining} days remaining</strong>. After that your profile will be hidden from search results.
                    </p>
                    <div className="flex flex-col gap-3">
                      <button type="submit" disabled={profileSaving} className={`bg-white border-2 border-yellow-700 text-yellow-800 font-bold py-2 px-6 rounded-lg transition ${!isFormValid ? 'opacity-50 cursor-not-allowed' : 'hover:bg-yellow-100'}`}>
                        {profileSaving ? 'Saving...' : 'Update Profile'}
                      </button>
                      <button type="button" onClick={handleReactivateSitterSub} disabled={sitterSubActionLoading} className="bg-yellow-700 hover:bg-yellow-800 text-white font-bold py-2 px-6 rounded-lg transition shadow-sm">
                        {sitterSubActionLoading ? 'Processing...' : 'Reactivate'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
                    <span className="text-3xl mb-2 block">✨</span>
                    <h3 className="text-green-800 font-bold text-lg mb-1">Sitter Profile Active</h3>
                    <p className="text-green-700 text-sm mb-4">Your profile is visible in search results.</p>
                    <button type="submit" disabled={profileSaving} className={`w-full bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition ${!isFormValid ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:bg-green-800'}`}>
                      {profileSaving ? 'Saving...' : 'Update Profile'}
                    </button>
                  </div>
                )
              ) : (
                <button type="submit" disabled={profileSaving} className={`w-full text-white font-black py-4 rounded-xl transition-all shadow-md ${!isFormValid ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#8B5E3C] hover:bg-[#7A5234]'}`}>
                  {profileSaving ? 'Saving...' : 'Save Profile'}
                </button>
              )}

              <div className="pt-8 border-t border-[#E8DDD4] mt-8 flex flex-col items-center gap-4">
                {isProSitter && !sitterSubCancelAtPeriodEnd && (
                  <button type="button" onClick={handleCancelSitterSub} disabled={sitterSubActionLoading} className="text-[#8B5E3C] hover:text-[#724C2F] text-sm font-bold underline underline-offset-4">
                    {sitterSubActionLoading ? 'Processing...' : 'Cancel Subscription'}
                  </button>
                )}
                <button type="button" onClick={() => setDeleteModalOpen(true)} className="text-red-500 hover:text-red-700 text-sm font-bold underline decoration-red-300 underline-offset-4">
                  Delete My Profile
                </button>
              </div>

            </form>
              </div>
            )}
          </>
          )}
          </div>
        )}

      </main>

      {/* REQUEST MODAL */}
      {requestModalOpen && selectedSitter && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative animate-fade-in">
            <button onClick={() => setRequestModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            
            <h3 className="text-2xl font-black text-[#4A3E3D] mb-2">Request {selectedSitter.name}</h3>
            <p className="text-[#8B7E7D] text-sm mb-6">The sitter will reply to you directly via email to coordinate details.</p>

            {reqSuccess ? (
              <div className="text-center py-8">
                <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <h4 className="text-xl font-bold text-green-600 mb-2">Request Sent!</h4>
                <p className="text-gray-600 mb-6">Keep an eye on your email inbox for a reply from {selectedSitter.name}.</p>
                
                <button
                  onClick={() => {
                    setRequestModalOpen(false);
                    setReqSuccess(false);
                  }}
                  className="w-full bg-[#8B5E3C] hover:bg-[#7A5234] text-white font-bold py-3 rounded-xl transition-colors shadow-sm"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={submitRequest} className="space-y-4">
                {hasSavedInfo && (
                  <div className="bg-[#F6EFEA] border border-[#E4D5CA] rounded-2xl p-3.5 flex items-center justify-between text-xs text-[#8B5E3C] shadow-sm animate-fade-in">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span>✨</span> Your pet details were saved — update anytime
                    </span>
                    <button type="button" onClick={handleClearSavedInfo} className="underline font-bold hover:text-[#7A5234] transition-colors ml-2 shrink-0">
                      Clear saved info
                    </button>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-[#4A3E3D] mb-1">Your Name</label>
                  <input required type="text" value={reqOwnerName} onChange={e => setReqOwnerName(e.target.value)} placeholder="Jane Doe" className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-lg px-3 py-2 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#4A3E3D] mb-1">Your Email</label>
                    <input required type="email" value={reqEmail} onChange={e => setReqEmail(e.target.value)} className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-lg px-3 py-2 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#4A3E3D] mb-1">Your Phone Number (Optional)</label>
                    <input type="tel" value={reqPhone} onChange={e => setReqPhone(e.target.value)} placeholder="(555) 555-5555" className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-lg px-3 py-2 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#4A3E3D] mb-1">Pet Name</label>
                    <input required type="text" value={reqPetName} onChange={e => setReqPetName(e.target.value)} className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-lg px-3 py-2 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#4A3E3D] mb-1">Pet Type</label>
                    <select value={reqPetType} onChange={e => setReqPetType(e.target.value)} className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-lg px-3 py-2 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]">
                      <option value="dog">Dog</option>
                      <option value="cat">Cat</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#4A3E3D] mb-1">Pet Age</label>
                    <input type="text" value={reqPetAge} onChange={e => setReqPetAge(e.target.value)} placeholder="e.g. 3 years" className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-lg px-3 py-2 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#4A3E3D] mb-1">Dates Needed</label>
                  <div className="flex space-x-2 mb-2">
                    <input required type="date" min={new Date().toISOString().split('T')[0]} value={reqStartDate} onChange={e => setReqStartDate(e.target.value)} className="w-1/2 bg-[#FAF6F4] border border-[#E8DDD4] rounded-lg px-3 py-2 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]" />
                    <input required type="date" min={reqStartDate || new Date().toISOString().split('T')[0]} value={reqEndDate} onChange={e => setReqEndDate(e.target.value)} className="w-1/2 bg-[#FAF6F4] border border-[#E8DDD4] rounded-lg px-3 py-2 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]" />
                  </div>

                  {/* Availability Calendar */}
                  <div className="bg-[#FAF6F4] border border-[#E8DDD4] rounded-2xl p-4 mt-3">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="text-xs font-bold text-[#4A3E3D]">Availability Calendar</span>
                        <div className="text-[10px] text-[#8B7E7D] mt-0.5">Click dates to select your booking range</div>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            if (calMonth === 0) {
                              setCalMonth(11);
                              setCalYear(prev => prev - 1);
                            } else {
                              setCalMonth(calMonth - 1);
                            }
                          }}
                          className="p-1 rounded-lg hover:bg-[#F6EFEA] text-[#8B5E3C] transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <span className="text-xs font-bold text-[#4A3E3D] min-w-[75px] text-center">
                          {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][calMonth]} {calYear}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (calMonth === 11) {
                              setCalMonth(0);
                              setCalYear(prev => prev + 1);
                            } else {
                              setCalMonth(calMonth + 1);
                            }
                          }}
                          className="p-1 rounded-lg hover:bg-[#F6EFEA] text-[#8B5E3C] transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M9 5l7 7-7 7" /></svg>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-[#8B6A50] mb-1.5 uppercase tracking-wider">
                      <div>Su</div>
                      <div>Mo</div>
                      <div>Tu</div>
                      <div>We</div>
                      <div>Th</div>
                      <div>Fr</div>
                      <div>Sa</div>
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {(() => {
                        const firstDay = new Date(calYear, calMonth, 1).getDay();
                        const totalDays = new Date(calYear, calMonth + 1, 0).getDate();
                        const todayStr = new Date().toISOString().split('T')[0];
                        
                        const cells = [];
                        for (let i = 0; i < firstDay; i++) {
                          cells.push(<div key={`empty-${i}`} className="aspect-square" />);
                        }
                        
                        for (let d = 1; d <= totalDays; d++) {
                          const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                          const isBooked = sitterBookedDates.includes(dateStr);
                          const isBlocked = sitterBlockedDates.includes(dateStr);
                          const isPast = dateStr < todayStr;
                          const isStart = reqStartDate === dateStr;
                          const isEnd = reqEndDate === dateStr;
                          const inRange = reqStartDate && reqEndDate && dateStr > reqStartDate && dateStr < reqEndDate;
                          
                          let bgClass = "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-100 cursor-pointer";
                          if (isPast) {
                            bgClass = "bg-gray-100/50 text-gray-300 cursor-not-allowed";
                          } else if (isBooked) {
                            bgClass = "bg-red-50 text-red-700 border border-red-100 line-through cursor-not-allowed";
                          } else if (isBlocked) {
                            bgClass = "bg-orange-50 text-orange-700 border border-orange-100 line-through cursor-not-allowed";
                          } else if (isStart || isEnd) {
                            bgClass = "bg-[#8B5E3C] text-white font-bold border border-[#8B5E3C] cursor-pointer";
                          } else if (inRange) {
                            bgClass = "bg-[#F4EDE6] text-[#8B5E3C] font-semibold cursor-pointer";
                          }
                          
                          cells.push(
                            <button
                              key={`day-${d}`}
                              type="button"
                              disabled={isPast || isBooked || isBlocked}
                              onClick={() => handleOwnerCalendarDayClick(dateStr)}
                              className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-all ${bgClass}`}
                            >
                              <span>{d}</span>
                            </button>
                          );
                        }
                        return cells;
                      })()}
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 mt-3 pt-3 border-t border-[#E8DDD4] text-[10px] font-medium text-[#8B7E7D]">
                      <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded bg-emerald-50 border border-emerald-100 inline-block" /> Available
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded bg-orange-50 border border-orange-100 inline-block" /> Sitter Busy
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded bg-red-50 border border-red-100 inline-block" /> Booked
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded bg-[#8B5E3C] inline-block" /> Selected
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#4A3E3D] mb-1">Special Notes (Optional)</label>
                  <textarea rows={3} value={reqNotes} onChange={e => setReqNotes(e.target.value)} className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-lg px-3 py-2 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]"></textarea>
                </div>

                {reqError && <div className="text-red-600 text-sm font-bold mt-2">{reqError}</div>}

                <button disabled={reqLoading} type="submit" className="w-full bg-[#8B5E3C] hover:bg-[#7A5234] text-white font-bold py-3 rounded-xl transition-colors mt-6 shadow-sm">
                  {reqLoading ? 'Sending...' : 'Send Request'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* CAMERA CAPTURE MODAL */}
      {cameraModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-[#FAF6F4] rounded-3xl p-6 max-w-lg w-full shadow-2xl relative border border-[#E8DDD4] text-center animate-fade-in">
            <button onClick={stopCamera} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            
            <h3 className="text-xl font-black text-[#4A3E3D] mb-4">
              Take {cameraTarget === 'selfie' ? 'Selfie' : 'ID Photo'}
            </h3>
            
            {cameraError ? (
              <div className="py-12 px-4 text-red-600 text-sm font-semibold">
                <span className="text-3xl mb-2 block">⚠️</span>
                {cameraError}
              </div>
            ) : (
              <div className="relative bg-black rounded-2xl overflow-hidden aspect-video mb-6 max-h-[350px] flex items-center justify-center border border-[#E8DDD4]">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                />
                {cameraTarget === 'selfie' && (
                  <div className="absolute inset-0 border-[3px] border-dashed border-[#8B5E3C]/40 rounded-full max-w-[240px] max-h-[240px] m-auto pointer-events-none" />
                )}
              </div>
            )}
            
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              {!cameraError && (
                <>
                  <button 
                    onClick={capturePhoto} 
                    disabled={!cameraStream}
                    className="bg-[#8B5E3C] hover:bg-[#7A5234] text-white font-black py-3 px-8 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    📸 Capture Photo
                  </button>
                  <button 
                    type="button"
                    onClick={toggleCameraFacing} 
                    disabled={!cameraStream}
                    className="bg-white hover:bg-gray-100 text-[#8B5E3C] font-bold py-3 px-6 rounded-xl transition-all border border-[#E8DDD4] flex items-center justify-center gap-2"
                  >
                    🔄 Switch Camera
                  </button>
                </>
              )}
              <button 
                onClick={stopCamera} 
                className="bg-white hover:bg-gray-100 text-[#4A3E3D] font-bold py-3 px-8 rounded-xl transition-colors border border-[#E8DDD4]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PREMIUM UNLOCK MODAL */}
      {unlockModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative border border-[#E8DDD4] text-center animate-fade-in">
            <button 
              onClick={() => {
                setUnlockModalOpen(false);
                setOwnerAuthMode('email');
                setReqError('');
              }} 
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            
            {/* Premium Gold Header Badge */}
            <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#FFB703]/20 to-[#FB8500]/20 text-[#FB8500] text-xs font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider mb-6 animate-pulse">
              👑 Lumo Bites PRO
            </div>
            
            <h3 className="text-3xl font-black text-[#4A3E3D] mb-3 leading-tight">Unlock Premium Pet Sitters</h3>
            <p className="text-[#8B7E7D] text-sm mb-6 max-w-sm mx-auto">
              Get direct access to trusted local sitters, unblurred biographies, and the ability to send request messages instantly!
            </p>
            
            {/* Other services reminder list */}
            <div className="bg-[#FAF6F4] border border-[#E8DDD4] rounded-2xl p-5 text-left mb-6 space-y-4">
              <p className="text-[#4A3E3D] font-black text-sm uppercase tracking-wider border-b border-[#E8DDD4] pb-2">
                Also Included with PRO Membership:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="flex items-start gap-2.5">
                  <span className="text-lg">🚨</span>
                  <div>
                    <h5 className="font-bold text-xs text-[#4A3E3D]">Lost Pet Alerts</h5>
                    <p className="text-[11px] text-[#8B7E7D] leading-tight">Instant SMS & email neighborhood alerts</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-lg">🔍</span>
                  <div>
                    <h5 className="font-bold text-xs text-[#4A3E3D]">Smart Pet Scanning</h5>
                    <p className="text-[11px] text-[#8B7E7D] leading-tight">Scan tools & interactive pet profiles</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-lg">💬</span>
                  <div>
                    <h5 className="font-bold text-xs text-[#4A3E3D]">Direct Messaging</h5>
                    <p className="text-[11px] text-[#8B7E7D] leading-tight">Chat in real-time with local caretakers</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-lg">📚</span>
                  <div>
                    <h5 className="font-bold text-xs text-[#4A3E3D]">Premium Care Guides</h5>
                    <p className="text-[11px] text-[#8B7E7D] leading-tight">Exclusive pet nutrition & care resources</p>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleUnlockProfile} className="space-y-4">
              {ownerAuthMode === 'email' ? (
                <div className="text-left">
                  <label className="block text-xs font-bold text-[#4A3E3D] mb-1.5 uppercase tracking-wider">Your Email Address</label>
                  <input 
                    required 
                    type="email" 
                    value={unlockEmail} 
                    onChange={e => setUnlockEmail(e.target.value)} 
                    className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]"
                    placeholder="Enter your email to verify or subscribe..." 
                  />
                  <p className="text-[10px] text-[#8B7E7D] mt-2 leading-relaxed">
                    Already a PRO member? We'll send you a verification code to log in. Not a member yet? This will direct you to Stripe checkout.
                  </p>
                </div>
              ) : (
                <div className="text-left animate-fade-in">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-bold text-[#4A3E3D] uppercase tracking-wider">Verification Code</label>
                    <button 
                      type="button" 
                      onClick={() => setOwnerAuthMode('email')} 
                      className="text-xs font-bold text-[#8B5E3C] hover:underline"
                    >
                      Change Email
                    </button>
                  </div>
                  <input 
                    required 
                    type="text" 
                    maxLength={6}
                    value={ownerAuthCode} 
                    onChange={e => setOwnerAuthCode(e.target.value)} 
                    className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C] text-center font-mono text-xl tracking-widest"
                    placeholder="------" 
                  />
                  <p className="text-[10px] text-[#8B7E7D] mt-2 leading-relaxed">
                    Enter the 6-digit code sent to <strong>{unlockEmail}</strong>.
                  </p>
                </div>
              )}

              {reqError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-xl text-center">
                  ⚠️ {reqError}
                </div>
              )}

              <button 
                disabled={unlockLoading} 
                type="submit" 
                className="w-full bg-gradient-to-r from-[#FFB703] to-[#FB8500] hover:from-[#F5A623] hover:to-[#E67E22] text-white font-black py-4 rounded-xl transition-all shadow-md mt-4 flex items-center justify-center gap-2 cursor-pointer"
              >
                {unlockLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>👑 {ownerAuthMode === 'email' ? 'Unlock All Features Now' : 'Verify & Access Sitters'}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* REVIEWS MODAL */}
      {/* REVIEWS MODAL */}
      {reviewsModalOpen && selectedSitterForReviews && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center sm:p-4 p-0 animate-fade-in" onClick={() => setReviewsModalOpen(false)}>
          <div className="bg-white sm:rounded-3xl rounded-none w-full max-w-xl sm:max-h-[90vh] h-full sm:h-auto flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-[#E8DDD4] flex items-start justify-between sticky top-0 bg-white z-10">
              <div className="flex items-start gap-4">
                {selectedSitterForReviews.photo_url ? (
                  <img src={selectedSitterForReviews.photo_url} alt={selectedSitterForReviews.name} className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-4 border-[#FAF6F4] shadow-md flex-shrink-0" />
                ) : (
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-[#E8DDD4] flex items-center justify-center text-[#8B5E3C] font-black text-4xl flex-shrink-0 shadow-md">
                    {selectedSitterForReviews.name.charAt(0)}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-2xl font-black text-[#4A3E3D]">{selectedSitterForReviews.name}</h3>
                    {selectedSitterForReviews.gender && (
                      <span className="text-[#8B7E7D] text-xs font-semibold px-2.5 py-0.5 bg-[#FAF6F4] rounded-full border border-[#E8DDD4]">
                        {selectedSitterForReviews.gender}
                      </span>
                    )}
                  </div>
                  
                  {selectedSitterForReviews.approval_status === 'approved' && (
                    <div className="inline-flex items-center gap-1 bg-[#D1FAE5] text-[#065F46] text-xs font-bold px-2.5 py-1 rounded-full border border-[#A7F3D0] mb-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#065F46] shrink-0" /> ID Verified
                    </div>
                  )}
 
                  <div className="text-sm">
                    {selectedSitterForReviews.review_count ? (
                      <span className="text-[#D97706] font-bold">
                        ⭐ {selectedSitterForReviews.avg_rating} <span className="text-[#8B7E7D] font-normal">({selectedSitterForReviews.review_count} {selectedSitterForReviews.review_count === 1 ? 'review' : 'reviews'})</span>
                      </span>
                    ) : (
                      <span className="text-[#8B7E7D]">No reviews yet</span>
                    )}
                  </div>
 
                  <p className="text-[#8B7E7D] text-sm flex items-center gap-1 mt-1">
                    📍 {selectedSitterForReviews.city ? (
                      (selectedSitterForReviews.country && (
                        selectedSitterForReviews.city.toLowerCase().includes(selectedSitterForReviews.country.toLowerCase()) ||
                        (selectedSitterForReviews.country.toLowerCase() === 'united states' && (selectedSitterForReviews.city.toLowerCase().includes('usa') || selectedSitterForReviews.city.toLowerCase().includes('u.s.a.'))) ||
                        (selectedSitterForReviews.country.toLowerCase() === 'united kingdom' && (selectedSitterForReviews.city.toLowerCase().includes('uk') || selectedSitterForReviews.city.toLowerCase().includes('u.k.')))
                      )) ? selectedSitterForReviews.city : `${selectedSitterForReviews.city}${selectedSitterForReviews.country ? `, ${selectedSitterForReviews.country}` : ''}`
                    ) : ''}
                  </p>
                </div>
              </div>
              <button onClick={() => setReviewsModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-[#FAF6F4] hover:bg-[#E8DDD4] text-[#4A3E3D] transition-colors cursor-pointer flex-shrink-0 text-lg font-bold">
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-[#FDFAF7] space-y-6">
              {/* Bio Section */}
              <div className="bg-white p-5 rounded-3xl border border-[#E8DDD4] shadow-sm">
                <h4 className="text-sm font-bold text-[#8B5E3C] uppercase tracking-wider mb-2">About Me</h4>
                <p className="text-[#555555] text-base leading-relaxed whitespace-pre-wrap">{selectedSitterForReviews.bio}</p>
              </div>

              {/* Service & Rate Details Section */}
              <div className="bg-white p-5 rounded-3xl border border-[#E8DDD4] shadow-sm grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-bold text-[#8B7E7D] uppercase tracking-wider mb-1">Nightly Rate</h4>
                  <p className="text-lg font-black text-[#4A3E3D]">${selectedSitterForReviews.rate_per_night}<span className="text-sm font-medium text-[#8B7E7D]">/night</span></p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#8B7E7D] uppercase tracking-wider mb-1">Pets Allowed</h4>
                  <p className="text-sm font-semibold text-[#8B5E3C] bg-[#FAF6F4] px-2.5 py-1 rounded-lg inline-block">
                    {selectedSitterForReviews.pet_types === 'both' ? '🐶 Dogs & 🐱 Cats' : selectedSitterForReviews.pet_types === 'dog' ? '🐶 Dogs Only' : '🐱 Cats Only'}
                  </p>
                </div>
              </div>

              {/* Services & Availability Details */}
              <div className="bg-white p-5 rounded-3xl border border-[#E8DDD4] shadow-sm space-y-4">
                {/* Service Types */}
                {(selectedSitterForReviews.service_types?.length || 0) > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-[#8B7E7D] uppercase tracking-wider mb-2">Offered Services</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedSitterForReviews.service_types?.map(st => (
                        <span key={st} className="text-xs font-bold uppercase tracking-wider text-[#8B5E3C] bg-[#FAF6F4] px-3 py-1 rounded-xl border border-[#E8DDD4]">
                          {st === 'Home visits' ? '🏠 Drop-in visits' : st === 'Overnight stays' ? '🌙 Overnight stays' : st === 'Dog walking' ? '🚶 Dog walking' : '🏡 Boarding'}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Available Days */}
                {(selectedSitterForReviews.available_days?.length || 0) > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-[#8B7E7D] uppercase tracking-wider mb-1">Available Days</h4>
                    <p className="text-sm text-[#4A3E3D] font-semibold">
                      📅 {selectedSitterForReviews.available_days?.length === 7 ? 'All Week' : selectedSitterForReviews.available_days?.includes('Saturday') && selectedSitterForReviews.available_days?.includes('Sunday') && selectedSitterForReviews.available_days?.length === 2 ? 'Weekends Only' : selectedSitterForReviews.available_days?.join(', ')}
                    </p>
                  </div>
                )}

                {/* Available Times */}
                {(selectedSitterForReviews.available_times?.length || 0) > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-[#8B7E7D] uppercase tracking-wider mb-1">Available Times</h4>
                    <p className="text-sm text-[#4A3E3D] font-semibold">
                      ⏰ {selectedSitterForReviews.available_times?.join(', ')}
                    </p>
                  </div>
                )}
              </div>

              {/* Reviews Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-[#8B5E3C] uppercase tracking-wider px-1">
                  Reviews ({selectedSitterForReviews.review_count || 0})
                </h4>
                
                {loadingReviews ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B5E3C] mb-4"></div>
                    <p className="text-[#8B7E7D] text-xs">Loading reviews...</p>
                  </div>
                ) : sitterReviews.length === 0 ? (
                  <div className="bg-white p-6 rounded-3xl border border-[#E8DDD4] text-center shadow-sm">
                    <span className="text-3xl mb-2 block">🐾</span>
                    <p className="text-[#8B7E7D] text-sm font-medium">No reviews yet for {selectedSitterForReviews.name}.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sitterReviews.map(review => (
                      <div key={review.id} className="bg-white p-5 rounded-2xl border border-[#E8DDD4] shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-[#4A3E3D] text-sm">{review.owner_name}</span>
                          <span className="text-[10px] text-[#8B7E7D]">{new Date(review.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex text-[#D97706] text-xs mb-3">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i}>{i < review.rating ? '★' : '☆'}</span>
                          ))}
                        </div>
                        <p className="text-[#555555] text-xs leading-relaxed">{review.review_text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 border-t border-[#E8DDD4] bg-white sticky bottom-0 flex gap-3">
              <button 
                onClick={() => setReviewsModalOpen(false)} 
                className="bg-[#FAF6F4] hover:bg-[#E8DDD4] text-[#4A3E3D] font-bold px-5 py-3 rounded-xl transition-colors shadow-sm cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setReviewsModalOpen(false);
                  if (!isOwnerPro) {
                    setUnlockModalOpen(true);
                  } else {
                    setSelectedSitter(selectedSitterForReviews);
                    setRequestModalOpen(true);
                  }
                }}
                className="flex-1 bg-[#8B5E3C] hover:bg-[#7A5234] text-white font-bold py-3 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {!isOwnerPro && <span className="text-xs">🔒</span>}
                <span>{isOwnerPro ? 'Request Sitter' : 'Unlock & Request'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative animate-fade-in text-center">
            <span className="text-5xl mb-4 block">⚠️</span>
            <h3 className="text-2xl font-black text-[#4A3E3D] mb-2">Are you sure?</h3>
            <p className="text-[#8B7E7D] text-sm mb-6">This will permanently delete your profile and cancel your subscription. You will no longer appear in search results.</p>

            <div className="flex flex-col gap-3">
              <button 
                onClick={handleDeleteProfile} 
                disabled={deleteLoading} 
                className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-3 rounded-xl transition-all shadow-md"
              >
                {deleteLoading ? 'Deleting...' : 'Yes, Delete Profile'}
              </button>
              <button 
                onClick={() => setDeleteModalOpen(false)} 
                disabled={deleteLoading} 
                className="w-full bg-[#FAF6F4] hover:bg-[#F0E6DD] text-[#4A3E3D] font-bold py-3 rounded-xl transition-colors border border-[#E8DDD4]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
