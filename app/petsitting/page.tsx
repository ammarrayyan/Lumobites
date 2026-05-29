'use client';

import React, { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import SitterMap from '@/components/SitterMap';
import { loadStripe } from '@stripe/stripe-js';

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
  
  // Request Form State
  const [reqEmail, setReqEmail] = useState('');
  const [reqPetName, setReqPetName] = useState('');
  const [reqPetType, setReqPetType] = useState('Dog');
  const [reqStartDate, setReqStartDate] = useState('');
  const [reqEndDate, setReqEndDate] = useState('');
  const [reqNotes, setReqNotes] = useState('');
  const [reqLoading, setReqLoading] = useState(false);
  const [reqError, setReqError] = useState('');
  const [reqSuccess, setReqSuccess] = useState(false);

  // Become Sitter State
  const [sitterEmail, setSitterEmail] = useState('');
  const [sitterFirstName, setSitterFirstName] = useState('');
  const [sitterLastName, setSitterLastName] = useState('');
  const sitterName = `${sitterFirstName} ${sitterLastName}`.trim();
  const [sitterPhoto, setSitterPhoto] = useState('');
  const [sitterIdPhoto, setSitterIdPhoto] = useState('');
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

  // Zip Code Validation State
  const [zipGeocoding, setZipGeocoding] = useState(false);
  const [zipError, setZipError] = useState('');

  useEffect(() => {
    const cachedEmail = localStorage.getItem('lumo_pro_email');
    if (cachedEmail && cachedEmail !== 'undefined') {
      setReqEmail(cachedEmail);
      fetchSitters(cachedEmail);
    } else {
      fetchSitters();
    }

    // Set activeTab from URL search params or hash
    const params = new URLSearchParams(window.location.search);
    if (params.get('tab') === 'become' || window.location.hash === '#become') {
      setActiveTab('become');
    }
  }, []);

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

  const loadSitterProfile = async (email: string) => {
    setProfileLoading(true);
    try {
      const res = await fetch(`/api/petsitting/profile?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        if (data) {
          const nameParts = (data.name || '').trim().split(/\s+/);
          setSitterFirstName(nameParts[0] || '');
          setSitterLastName(nameParts.slice(1).join(' ') || '');
          setSitterPhoto(data.photo_url || '');
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
          setSitterAvailable(data.availability);
          setSitterAvailableDays(data.available_days || []);
          setSitterAvailableTimes(data.available_times || []);
          setSitterServiceTypes(data.service_types || []);
          setSitterApprovalStatus(data.approval_status || 'pending');
          
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
      // Check if profile exists
      const res = await fetch(`/api/petsitting/profile?email=${encodeURIComponent(sitterEmail)}`);
      const profileData = await res.json();
      
      if (res.ok && profileData && profileData.id) {
        // Returning user, send OTP
        const otpRes = await fetch('/api/petsitting/auth/send-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: sitterEmail })
        });
        if (otpRes.ok) {
          setSitterAuthMode('otp');
        } else {
          setSitterAuthError('Failed to send verification code.');
        }
      } else {
        // New user, go straight to signup form
        // Pre-fill email, clear the rest
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
        setSitterRate('');
        setSitterAuthMode('form');
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
        await loadSitterProfile(sitterEmail);
        setSitterAuthMode('form');
        setProfilePreviewMode(true);
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
    if (!sitterIdPhoto) errors['id_photo'] = 'A photo of your ID is required for verification';
    if (!sitterRate || parseInt(sitterRate) <= 0) errors['rate'] = 'Please enter a valid rate';
    if (!sitterBio.trim()) errors['bio'] = 'Please add a short bio';
    
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
          id_photo_url: sitterIdPhoto,
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
          gender: sitterGender
        })
      });

      if (res.ok) {
        const updatedData = await res.json();
        setSitterApprovalStatus(updatedData.approval_status || 'pending');
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
      const startFmt = reqStartDate ? new Date(reqStartDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
      const endFmt = reqEndDate ? new Date(reqEndDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
      const finalDates = startFmt && endFmt ? `${startFmt} → ${endFmt}` : '';

      const res = await fetch('/api/petsitting/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sitter_id: selectedSitter?.id,
          owner_email: reqEmail,
          pet_name: reqPetName,
          pet_type: reqPetType,
          dates: finalDates,
          special_notes: reqNotes
        })
      });

      const data = await res.json();
      if (res.ok) {
        setReqSuccess(true);
        setTimeout(() => {
          setRequestModalOpen(false);
          setReqSuccess(false);
        }, 3000);
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
  const isFormValid = sitterEmail.trim() && sitterFirstName.trim() && sitterLastName.trim() && sitterPhoto && sitterIdPhoto && sitterLocationInput.trim() && sitterLocationVerified && sitterRate && sitterBio.trim();

  // Auto-set isProSitter to true on load/save to bypass sitter paywall UI.
  useEffect(() => {
    setIsProSitter(true);
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFAF7] font-sans">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        {/* FREE LAUNCH BANNER */}
        <div className="bg-gradient-to-r from-[#8B5E3C] to-[#C17D3C] text-white p-4 rounded-2xl mb-8 flex items-center justify-center shadow-lg transform hover:scale-[1.01] transition-transform">
          <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></svg>
          <span className="font-bold text-lg tracking-wide">🎉 Now Live! Join as a founding sitter — free to join, be part of our community from day one!</span>
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
                  <span className="text-4xl">👑</span>
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
                <span className="text-4xl mb-4 block">🐾</span>
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
                {/* Sitters List (Bottom on mobile, Left on desktop) */}
                <div className="flex-1 order-2 lg:order-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                    {filteredSitters.map(sitter => (
                      <div key={sitter.id} onClick={() => handleViewReviews(sitter)} className="bg-white rounded-3xl p-6 border border-[#E8DDD4] shadow-sm hover:shadow-md transition-shadow relative cursor-pointer">
                        {sitter.approval_status === 'approved' && (
                          <div className="absolute top-4 right-4 bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                            ✅ Identity Verified
                          </div>
                        )}
                        
                        <div className="flex items-center gap-4 mb-4">
                          {sitter.photo_url ? (
                            <img src={sitter.photo_url} alt={sitter.name} className="w-16 h-16 rounded-full object-cover border-2 border-[#FAF6F4]" />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-[#E8DDD4] flex items-center justify-center text-[#8B5E3C] font-bold text-xl">
                              {sitter.name.charAt(0)}
                            </div>
                          )}
                          <div>
                             <div className="flex items-center gap-2 flex-wrap">
                               <h3 className="text-xl font-bold text-[#4A3E3D]">{sitter.name}</h3>
                               {sitter.gender && (
                                 <span className="text-[#8B7E7D] text-xs font-semibold px-2 py-0.5 bg-[#FAF6F4] rounded border border-[#E8DDD4]">
                                   {sitter.gender}
                                 </span>
                               )}
                             </div>
                             <div className="text-sm mt-0.5 mb-1">
                               {sitter.review_count ? (
                                 <span className="text-[#D97706] font-bold">⭐ {sitter.avg_rating} <span className="text-[#8B7E7D] font-normal">({sitter.review_count} {sitter.review_count === 1 ? 'review' : 'reviews'})</span></span>
                               ) : (
                                 <span className="text-[#8B7E7D]">No reviews yet</span>
                               )}
                             </div>
                            <p className="text-[#8B7E7D] text-sm flex items-center gap-1">
                              📍 {sitter.city ? (
                                (sitter.country && (
                                  sitter.city.toLowerCase().includes(sitter.country.toLowerCase()) ||
                                  (sitter.country.toLowerCase() === 'united states' && (sitter.city.toLowerCase().includes('usa') || sitter.city.toLowerCase().includes('u.s.a.'))) ||
                                  (sitter.country.toLowerCase() === 'united kingdom' && (sitter.city.toLowerCase().includes('uk') || sitter.city.toLowerCase().includes('u.k.')))
                                )) ? sitter.city : `${sitter.city}${sitter.country ? `, ${sitter.country}` : ''}`
                              ) : ''}
                            </p>
                            {sitter.phone_number && (
                              <p className="text-[#8B7E7D] text-sm flex items-center gap-1 mt-1">
                                📞 <span className={sitter.phone_number.includes('***') ? 'blur-[3px] select-none text-[#555555]' : 'font-semibold text-[#4A3E3D]'}>{sitter.phone_number}</span>
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
                            <p className="text-xs text-[#8B7E7D]">
                              📅 <span className="font-semibold text-[#4A3E3D]">Available:</span> {sitter.available_days?.length === 7 ? 'All Week' : sitter.available_days?.includes('Saturday') && sitter.available_days?.includes('Sunday') && sitter.available_days?.length === 2 ? 'Weekends Only' : sitter.available_days?.join(', ')}
                            </p>
                          )}
                          {(sitter.service_types?.length || 0) > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {sitter.service_types?.map(st => (
                                <span key={st} className="text-[10px] font-bold uppercase tracking-wider text-[#8B5E3C] bg-[#FAF6F4] px-2 py-0.5 rounded border border-[#E8DDD4]">
                                  {st === 'Home visits' ? '🏠 Drop-in' : st === 'Overnight stays' ? '🌙 Overnight' : st === 'Dog walking' ? '🚶 Walking' : '🏡 Boarding'}
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
                          {!isOwnerPro && <span className="text-xs">🔒</span>}
                          <span>{isOwnerPro ? 'Request Sitter' : 'Unlock & Request'}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Map (Top on mobile, Right on desktop) */}
                <div className="w-full lg:w-[45%] lg:sticky lg:top-24 h-[400px] lg:h-[calc(100vh-140px)] order-1 lg:order-2 rounded-3xl overflow-hidden shadow-sm border border-[#E8DDD4]">
                  <SitterMap 
                    sitters={filteredSitters}
                    searchCoords={searchCoords}
                    onSelectSitter={(sitter) => {
                      if (!isOwnerPro) {
                        setUnlockModalOpen(true);
                      } else {
                        setSelectedSitter(sitter);
                        setRequestModalOpen(true);
                      }
                    }}
                  />
                </div>
              </div>
            )}
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
                    <h2 className="text-3xl font-black text-[#4A3E3D] mb-2">Profile Submitted for Review</h2>
                    <p className="text-[#8B7E7D] mb-8 max-w-md mx-auto">
                      Your profile has been submitted for review. We will notify you by email within 24 hours once approved.
                    </p>
                  </>
                )}
                {sitterApprovalStatus === 'rejected' && (
                  <>
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-red-100 text-red-600">
                      <span className="text-3xl">❌</span>
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
                        <span className="text-3xl">⚠️</span>
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
                  <span className="text-3xl mb-2 block">🔐</span>
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
                    <span className="text-xl">⚠️</span>
                    <div>
                      <h4 className="font-bold text-red-800 text-sm">Profile Inactive & Hidden</h4>
                      <p className="text-red-700 text-xs mt-1">Your sitter profile is hidden from search results. Subscribe for $9.99/mo to go live.</p>
                    </div>
                  </div>
                )}

            <form onSubmit={handleProfileSubmit} className="space-y-6" noValidate>
              <div className="mb-6">
                <label className="block text-sm font-bold text-[#4A3E3D] mb-2">Email Address <span title="Locked after signup">🔒</span></label>
                <div className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-500 font-medium">
                  {sitterEmail}
                </div>
                <p className="text-xs text-gray-500 mt-2">Email cannot be changed. Contact <a href="mailto:info@lumobitespet.com" className="text-[#8B5E3C] hover:underline">info@lumobitespet.com</a> for help.</p>
              </div>

              {sitterApprovalStatus === 'approved' && (
                <div className="bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl p-4 mb-6 flex gap-3 text-sm text-[#666666]">
                  <span className="text-[#8B5E3C] text-lg leading-none mt-0.5">🔒</span>
                  <p>Some profile information is locked after verification to maintain trust and security. Contact support at <a href="mailto:info@lumobitespet.com" className="text-[#8B5E3C] font-bold hover:underline">info@lumobitespet.com</a> if you need to make changes.</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-[#4A3E3D] mb-2">First Name {sitterApprovalStatus === 'approved' && <span title="Locked after verification">🔒</span>}</label>
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
                  <label className="block text-sm font-bold text-[#4A3E3D] mb-2">Last Name {sitterApprovalStatus === 'approved' && <span title="Locked after verification">🔒</span>}</label>
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
                  <label className="block text-sm font-bold text-[#4A3E3D] mb-2">
                    Take a selfie or upload a recent photo of yourself 
                    {sitterApprovalStatus === 'approved' ? (
                      <span className="ml-2" title="Locked after verification">🔒</span>
                    ) : (
                      <span className="text-red-500 ml-1">— required for verification</span>
                    )}
                  </label>
                  {formErrors['photo'] && <p className="text-red-500 text-sm mb-1">{formErrors['photo']}</p>}
                  <div className="flex items-center gap-4 p-2 rounded-xl">
                    {sitterPhoto ? (
                      <img src={sitterPhoto} alt="Profile" className="w-16 h-16 rounded-full object-cover border-2 border-[#E8DDD4]" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-[#E8DDD4] flex items-center justify-center text-gray-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </div>
                    )}
                    {sitterApprovalStatus === 'approved' ? (
                      <div className="flex-1 text-sm text-gray-500 italic">Photo is verified and locked</div>
                    ) : (
                      <div className="flex-1 flex flex-col gap-2">
                        <input 
                          type="file" 
                          accept="image/*" 
                          capture="user"
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
                                    if (width > MAX_WIDTH) {
                                      height *= MAX_WIDTH / width;
                                      width = MAX_WIDTH;
                                    }
                                  } else {
                                    if (height > MAX_HEIGHT) {
                                      width *= MAX_HEIGHT / height;
                                      height = MAX_HEIGHT;
                                    }
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
                          className="block w-full text-sm text-[#666666] file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-[#FAF6F4] file:text-[#8B5E3C] hover:file:bg-[#F0E6DD] transition-colors cursor-pointer focus:outline-none" 
                        />
                        <button 
                          type="button" 
                          onClick={() => startCamera('selfie')}
                          className="w-fit text-xs font-bold text-[#8B5E3C] bg-[#FAF6F4] border border-[#E8DDD4] hover:bg-[#F0E6DD] px-3.5 py-1.5 rounded-full transition-colors flex items-center gap-1.5 shadow-sm"
                        >
                          📷 Take Photo with Webcam
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-[#4A3E3D] mb-2">
                    Upload a photo of your ID (passport, driver's license) 
                    {sitterApprovalStatus === 'approved' ? (
                      <span className="ml-2" title="Locked after verification">🔒</span>
                    ) : (
                      <>
                        <span className="text-red-500 font-bold ml-1">*Required</span> 
                        <span className="text-gray-400 font-normal text-xs ml-1">— used for verification only, never shown publicly</span>
                      </>
                    )}
                  </label>
                  {formErrors['id_photo'] && <p className="text-red-500 text-sm mb-1">{formErrors['id_photo']}</p>}
                  <div className="flex items-center gap-4 p-2 rounded-xl bg-white border border-[#E8DDD4]">
                    {sitterIdPhoto ? (
                      <div className="w-16 h-12 rounded bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs border border-green-200">
                        Uploaded
                      </div>
                    ) : (
                      <div className="w-16 h-12 rounded bg-[#E8DDD4] flex items-center justify-center text-gray-400">
                        🪪
                      </div>
                    )}
                    {sitterApprovalStatus === 'approved' ? (
                      <div className="flex-1 text-sm text-gray-500 italic">ID photo is verified and securely stored</div>
                    ) : (
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
                                  const MAX_WIDTH = 1200; // slightly larger for ID text clarity
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
                    )}
                  </div>
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
                  <label className="block text-sm font-bold text-[#4A3E3D] mb-2">Gender (Optional) {sitterApprovalStatus === 'approved' && <span title="Locked after verification">🔒</span>}</label>
                  {sitterApprovalStatus === 'approved' ? (
                    <div className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-500 font-medium">
                      {sitterGender || 'Not specified'}
                    </div>
                  ) : (
                    <select value={sitterGender} onChange={e => setSitterGender(e.target.value)} className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]">
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Non-binary">Non-binary</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  )}
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

              <div className="flex items-center gap-3 bg-[#FAF6F4] p-4 rounded-xl border border-[#E8DDD4]">
                <input type="checkbox" id="avail" checked={sitterAvailable} onChange={e => setSitterAvailable(e.target.checked)} className="w-5 h-5 accent-[#8B5E3C]" />
                <label htmlFor="avail" className="text-[#4A3E3D] font-bold cursor-pointer">I am currently accepting new requests</label>
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
                <p className="text-gray-600">Keep an eye on your email inbox for a reply from {selectedSitter.name}.</p>
              </div>
            ) : (
              <form onSubmit={submitRequest} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#4A3E3D] mb-1">Your Email</label>
                  <input required type="email" value={reqEmail} onChange={e => setReqEmail(e.target.value)} className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-lg px-3 py-2 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#4A3E3D] mb-1">Pet Name</label>
                    <input required type="text" value={reqPetName} onChange={e => setReqPetName(e.target.value)} className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-lg px-3 py-2 text-[#4A3E3D]" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#4A3E3D] mb-1">Pet Type</label>
                    <select value={reqPetType} onChange={e => setReqPetType(e.target.value)} className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-lg px-3 py-2 text-[#4A3E3D]">
                      <option value="dog">Dog</option>
                      <option value="cat">Cat</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#4A3E3D] mb-1">Dates Needed</label>
                  <div className="flex space-x-2">
                    <input required type="date" value={reqStartDate} onChange={e => setReqStartDate(e.target.value)} className="w-1/2 bg-[#FAF6F4] border border-[#E8DDD4] rounded-lg px-3 py-2 text-[#4A3E3D]" />
                    <input required type="date" value={reqEndDate} onChange={e => setReqEndDate(e.target.value)} className="w-1/2 bg-[#FAF6F4] border border-[#E8DDD4] rounded-lg px-3 py-2 text-[#4A3E3D]" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#4A3E3D] mb-1">Special Notes (Optional)</label>
                  <textarea rows={3} value={reqNotes} onChange={e => setReqNotes(e.target.value)} className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-lg px-3 py-2 text-[#4A3E3D]"></textarea>
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
      {reviewsModalOpen && selectedSitterForReviews && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in" onClick={() => setReviewsModalOpen(false)}>
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-[#E8DDD4] flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                {selectedSitterForReviews.photo_url ? (
                  <img src={selectedSitterForReviews.photo_url} alt={selectedSitterForReviews.name} className="w-12 h-12 rounded-full object-cover border-2 border-[#FAF6F4]" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#E8DDD4] flex items-center justify-center text-[#8B5E3C] font-bold text-lg">
                    {selectedSitterForReviews.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-black text-[#4A3E3D]">{selectedSitterForReviews.name}</h3>
                  <div className="text-sm mt-0.5">
                    {selectedSitterForReviews.review_count ? (
                      <span className="text-[#D97706] font-bold">⭐ {selectedSitterForReviews.avg_rating} <span className="text-[#8B7E7D] font-normal">({selectedSitterForReviews.review_count} {selectedSitterForReviews.review_count === 1 ? 'review' : 'reviews'})</span></span>
                    ) : (
                      <span className="text-[#8B7E7D]">No reviews yet</span>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={() => setReviewsModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#FAF6F4] hover:bg-[#E8DDD4] text-[#4A3E3D] transition-colors cursor-pointer">
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-[#FDFAF7]">
              {loadingReviews ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B5E3C] mb-4"></div>
                  <p className="text-[#8B7E7D] text-sm">Loading reviews...</p>
                </div>
              ) : sitterReviews.length === 0 ? (
                <div className="text-center py-12">
                  <span className="text-4xl mb-4 block">🐾</span>
                  <p className="text-[#8B7E7D] font-medium">No reviews yet for {selectedSitterForReviews.name}.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {sitterReviews.map(review => (
                    <div key={review.id} className="bg-white p-5 rounded-2xl border border-[#E8DDD4] shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-[#4A3E3D]">{review.owner_name}</span>
                        <span className="text-xs text-[#8B7E7D]">{new Date(review.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex text-[#D97706] text-sm mb-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i}>{i < review.rating ? '★' : '☆'}</span>
                        ))}
                      </div>
                      <p className="text-[#555555] text-sm leading-relaxed">{review.review_text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-[#E8DDD4] bg-white sticky bottom-0">
               <button 
                onClick={() => setReviewsModalOpen(false)} 
                className="w-full bg-[#FAF6F4] hover:bg-[#E8DDD4] text-[#4A3E3D] font-bold py-3 rounded-xl transition-colors shadow-sm cursor-pointer"
              >
                Close
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
