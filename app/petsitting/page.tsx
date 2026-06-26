'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import ChatModal from '@/components/ChatModal';
import SitterMap from '@/components/SitterMap';
import PetPhotoCarousel from '@/components/PetPhotoCarousel';
import { loadStripe } from '@stripe/stripe-js';
import { Star, MapPin, Phone, Calendar, Home, Moon, Footprints, Lock, Crown, Camera, ShieldCheck, MessageSquare, Key, AlertTriangle, Clipboard, Share2, Upload, RefreshCw, MessageCircle, Sun, BookOpen, Clock, PawPrint, Check, CheckCircle, XCircle, Sparkles, Plus, Info, Dog, Cat, Pencil, Trash2, Search, ChevronDown } from 'lucide-react';

import { supabase } from '@/lib/supabase';



export function formatSitterName(fullName) {
  if (!fullName) return 'Sitter';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
}

export const getCroppedImg = (
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.src = imageSrc;
    image.crossOrigin = 'anonymous'; // Avoid tainted canvas with Supabase URLs
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('No 2d context'));
        return;
      }
      
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        1200,
        400
      );
      
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    image.onerror = (err) => reject(err);
  });
};
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface Sitter {
  id: string;
  name: string;
  photo_url: string;
  cover_photo_url?: string;
  city: string;
  zip: string;
  country?: string;
  lat?: number;
  lng?: number;
  bio: string;
  pet_types: string;
  rate_per_night: number;
  rate_type?: string;
  rate_dropins?: number | null;
  rate_walking?: number | null;
  rate_overnight?: number | null;
  rate_boarding?: number | null;
  rate_daycare?: number | null;
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

const countryCodes = [
  { code: '+1', country: 'US', flag: '🇺🇸', name: 'United States' },
  { code: '+1', country: 'CA', flag: '🇨🇦', name: 'Canada' },
  { code: '+7', country: 'RU', flag: '🇷🇺', name: 'Russia' },
  { code: '+20', country: 'EG', flag: '🇪🇬', name: 'Egypt' },
  { code: '+27', country: 'ZA', flag: '🇿🇦', name: 'South Africa' },
  { code: '+30', country: 'GR', flag: '🇬🇷', name: 'Greece' },
  { code: '+31', country: 'NL', flag: '🇳🇱', name: 'Netherlands' },
  { code: '+32', country: 'BE', flag: '🇧🇪', name: 'Belgium' },
  { code: '+33', country: 'FR', flag: '🇫🇷', name: 'France' },
  { code: '+34', country: 'ES', flag: '🇪🇸', name: 'Spain' },
  { code: '+36', country: 'HU', flag: '🇭🇺', name: 'Hungary' },
  { code: '+39', country: 'IT', flag: '🇮🇹', name: 'Italy' },
  { code: '+40', country: 'RO', flag: '🇷🇴', name: 'Romania' },
  { code: '+41', country: 'CH', flag: '🇨🇭', name: 'Switzerland' },
  { code: '+43', country: 'AT', flag: '🇦🇹', name: 'Austria' },
  { code: '+44', country: 'GB', flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+45', country: 'DK', flag: '🇩🇰', name: 'Denmark' },
  { code: '+46', country: 'SE', flag: '🇸🇪', name: 'Sweden' },
  { code: '+47', country: 'NO', flag: '🇳🇴', name: 'Norway' },
  { code: '+48', country: 'PL', flag: '🇵🇱', name: 'Poland' },
  { code: '+49', country: 'DE', flag: '🇩🇪', name: 'Germany' },
  { code: '+51', country: 'PE', flag: '🇵🇪', name: 'Peru' },
  { code: '+52', country: 'MX', flag: '🇲🇽', name: 'Mexico' },
  { code: '+53', country: 'CU', flag: '🇨🇺', name: 'Cuba' },
  { code: '+54', country: 'AR', flag: '🇦🇷', name: 'Argentina' },
  { code: '+55', country: 'BR', flag: '🇧🇷', name: 'Brazil' },
  { code: '+56', country: 'CL', flag: '🇨🇱', name: 'Chile' },
  { code: '+57', country: 'CO', flag: '🇨🇴', name: 'Colombia' },
  { code: '+58', country: 'VE', flag: '🇻🇪', name: 'Venezuela' },
  { code: '+60', country: 'MY', flag: '🇲🇾', name: 'Malaysia' },
  { code: '+61', country: 'AU', flag: '🇦🇺', name: 'Australia' },
  { code: '+62', country: 'ID', flag: '🇮🇩', name: 'Indonesia' },
  { code: '+63', country: 'PH', flag: '🇵🇭', name: 'Philippines' },
  { code: '+64', country: 'NZ', flag: '🇳🇿', name: 'New Zealand' },
  { code: '+65', country: 'SG', flag: '🇸🇬', name: 'Singapore' },
  { code: '+66', country: 'TH', flag: '🇹🇭', name: 'Thailand' },
  { code: '+81', country: 'JP', flag: '🇯🇵', name: 'Japan' },
  { code: '+82', country: 'KR', flag: '🇰🇷', name: 'South Korea' },
  { code: '+84', country: 'VN', flag: '🇻🇳', name: 'Vietnam' },
  { code: '+86', country: 'CN', flag: '🇨🇳', name: 'China' },
  { code: '+90', country: 'TR', flag: '🇹🇷', name: 'Turkey' },
  { code: '+91', country: 'IN', flag: '🇮🇳', name: 'India' },
  { code: '+92', country: 'PK', flag: '🇵🇰', name: 'Pakistan' },
  { code: '+93', country: 'AF', flag: '🇦🇫', name: 'Afghanistan' },
  { code: '+94', country: 'LK', flag: '🇱🇰', name: 'Sri Lanka' },
  { code: '+95', country: 'MM', flag: '🇲🇲', name: 'Myanmar' },
  { code: '+98', country: 'IR', flag: '🇮🇷', name: 'Iran' },
  { code: '+212', country: 'MA', flag: '🇲🇦', name: 'Morocco' },
  { code: '+213', country: 'DZ', flag: '🇩🇿', name: 'Algeria' },
  { code: '+216', country: 'TN', flag: '🇹🇳', name: 'Tunisia' },
  { code: '+218', country: 'LY', flag: '🇱🇾', name: 'Libya' },
  { code: '+220', country: 'GM', flag: '🇬🇲', name: 'Gambia' },
  { code: '+221', country: 'SN', flag: '🇸🇳', name: 'Senegal' },
  { code: '+224', country: 'GN', flag: '🇬🇳', name: 'Guinea' },
  { code: '+225', country: 'CI', flag: '🇨🇮', name: 'Ivory Coast' },
  { code: '+227', country: 'NE', flag: '🇳🇪', name: 'Niger' },
  { code: '+228', country: 'TG', flag: '🇹🇬', name: 'Togo' },
  { code: '+229', country: 'BJ', flag: '🇧🇯', name: 'Benin' },
  { code: '+230', country: 'MU', flag: '🇲🇺', name: 'Mauritius' },
  { code: '+231', country: 'LR', flag: '🇱🇷', name: 'Liberia' },
  { code: '+232', country: 'SL', flag: '🇸🇱', name: 'Sierra Leone' },
  { code: '+233', country: 'GH', flag: '🇬🇭', name: 'Ghana' },
  { code: '+234', country: 'NG', flag: '🇳🇬', name: 'Nigeria' },
  { code: '+235', country: 'TD', flag: '🇹🇩', name: 'Chad' },
  { code: '+236', country: 'CF', flag: '🇨🇫', name: 'Central African Republic' },
  { code: '+237', country: 'CM', flag: '🇨🇲', name: 'Cameroon' },
  { code: '+238', country: 'CV', flag: '🇨🇻', name: 'Cape Verde' },
  { code: '+239', country: 'ST', flag: '🇸🇹', name: 'Sao Tome and Principe' },
  { code: '+240', country: 'GQ', flag: '🇬🇶', name: 'Equatorial Guinea' },
  { code: '+241', country: 'GA', flag: '🇬🇦', name: 'Gabon' },
  { code: '+242', country: 'CG', flag: '🇨🇬', name: 'Congo' },
  { code: '+243', country: 'CD', flag: '🇨🇩', name: 'DR Congo' },
  { code: '+244', country: 'AO', flag: '🇦🇴', name: 'Angola' },
  { code: '+245', country: 'GW', flag: '🇬🇼', name: 'Guinea-Bissau' },
  { code: '+246', country: 'IO', flag: '🇮🇴', name: 'British Indian Ocean Territory' },
  { code: '+248', country: 'SC', flag: '🇸🇨', name: 'Seychelles' },
  { code: '+249', country: 'SD', flag: '🇸🇩', name: 'Sudan' },
  { code: '+250', country: 'RW', flag: '🇷🇼', name: 'Rwanda' },
  { code: '+251', country: 'ET', flag: '🇪🇹', name: 'Ethiopia' },
  { code: '+252', country: 'SO', flag: '🇸🇴', name: 'Somalia' },
  { code: '+253', country: 'DJ', flag: '🇩🇯', name: 'Djibouti' },
  { code: '+254', country: 'KE', flag: '🇰🇪', name: 'Kenya' },
  { code: '+255', country: 'TZ', flag: '🇹🇿', name: 'Tanzania' },
  { code: '+256', country: 'UG', flag: '🇺🇬', name: 'Uganda' },
  { code: '+257', country: 'BI', flag: '🇧🇮', name: 'Burundi' },
  { code: '+258', country: 'MZ', flag: '🇲🇿', name: 'Mozambique' },
  { code: '+260', country: 'ZM', flag: '🇿🇲', name: 'Zambia' },
  { code: '+261', country: 'MG', flag: '🇲🇬', name: 'Madagascar' },
  { code: '+263', country: 'ZW', flag: '🇿🇼', name: 'Zimbabwe' },
  { code: '+264', country: 'NA', flag: '🇳🇦', name: 'Namibia' },
  { code: '+265', country: 'MW', flag: '🇲🇼', name: 'Malawi' },
  { code: '+266', country: 'LS', flag: '🇱🇸', name: 'Lesotho' },
  { code: '+267', country: 'BW', flag: '🇧🇼', name: 'Botswana' },
  { code: '+268', country: 'SZ', flag: '🇸🇿', name: 'Swaziland' },
  { code: '+269', country: 'KM', flag: '🇰🇲', name: 'Comoros' },
  { code: '+290', country: 'SH', flag: '🇸🇭', name: 'Saint Helena' },
  { code: '+291', country: 'ER', flag: '🇪🇷', name: 'Eritrea' },
  { code: '+297', country: 'AW', flag: '🇦🇼', name: 'Aruba' },
  { code: '+298', country: 'FO', flag: '🇫🇴', name: 'Faroe Islands' },
  { code: '+299', country: 'GL', flag: '🇬🇱', name: 'Greenland' },
  { code: '+350', country: 'GI', flag: '🇬🇮', name: 'Gibraltar' },
  { code: '+351', country: 'PT', flag: '🇵🇹', name: 'Portugal' },
  { code: '+352', country: 'LU', flag: '🇱🇺', name: 'Luxembourg' },
  { code: '+353', country: 'IE', flag: '🇮🇪', name: 'Ireland' },
  { code: '+354', country: 'IS', flag: '🇮🇸', name: 'Iceland' },
  { code: '+355', country: 'AL', flag: '🇦🇱', name: 'Albania' },
  { code: '+356', country: 'MT', flag: '🇲🇹', name: 'Malta' },
  { code: '+357', country: 'CY', flag: '🇨🇾', name: 'Cyprus' },
  { code: '+358', country: 'FI', flag: '🇫🇮', name: 'Finland' },
  { code: '+359', country: 'BG', flag: '🇧🇬', name: 'Bulgaria' },
  { code: '+370', country: 'LT', flag: '🇱🇹', name: 'Lithuania' },
  { code: '+371', country: 'LV', flag: '🇱🇻', name: 'Latvia' },
  { code: '+372', country: 'EE', flag: '🇪🇪', name: 'Estonia' },
  { code: '+373', country: 'MD', flag: '🇲🇩', name: 'Moldova' },
  { code: '+374', country: 'AM', flag: '🇦🇲', name: 'Armenia' },
  { code: '+375', country: 'BY', flag: '🇧🇾', name: 'Belarus' },
  { code: '+376', country: 'AD', flag: '🇦🇩', name: 'Andorra' },
  { code: '+377', country: 'MC', flag: '🇲🇨', name: 'Monaco' },
  { code: '+378', country: 'SM', flag: '🇸🇲', name: 'San Marino' },
  { code: '+380', country: 'UA', flag: '🇺🇦', name: 'Ukraine' },
  { code: '+381', country: 'RS', flag: '🇷🇸', name: 'Serbia' },
  { code: '+382', country: 'ME', flag: '🇲🇪', name: 'Montenegro' },
  { code: '+385', country: 'HR', flag: '🇭🇷', name: 'Croatia' },
  { code: '+386', country: 'SI', flag: '🇸🇮', name: 'Slovenia' },
  { code: '+387', country: 'BA', flag: '🇧🇦', name: 'Bosnia' },
  { code: '+389', country: 'MK', flag: '🇲🇰', name: 'Macedonia' },
  { code: '+420', country: 'CZ', flag: '🇨🇿', name: 'Czech Republic' },
  { code: '+421', country: 'SK', flag: '🇸🇰', name: 'Slovakia' },
  { code: '+423', country: 'LI', flag: '🇱🇮', name: 'Liechtenstein' },
  { code: '+500', country: 'FK', flag: '🇫🇰', name: 'Falkland Islands' },
  { code: '+501', country: 'BZ', flag: '🇧🇿', name: 'Belize' },
  { code: '+502', country: 'GT', flag: '🇬🇹', name: 'Guatemala' },
  { code: '+503', country: 'SV', flag: '🇸🇻', name: 'El Salvador' },
  { code: '+504', country: 'HN', flag: '🇭🇳', name: 'Honduras' },
  { code: '+505', country: 'NI', flag: '🇳🇮', name: 'Nicaragua' },
  { code: '+506', country: 'CR', flag: '🇨🇷', name: 'Costa Rica' },
  { code: '+507', country: 'PA', flag: '🇵🇦', name: 'Panama' },
  { code: '+508', country: 'PM', flag: '🇵🇲', name: 'Saint Pierre and Miquelon' },
  { code: '+509', country: 'HT', flag: '🇭🇹', name: 'Haiti' },
  { code: '+590', country: 'GP', flag: '🇬🇵', name: 'Guadeloupe' },
  { code: '+591', country: 'BO', flag: '🇧🇴', name: 'Bolivia' },
  { code: '+592', country: 'GY', flag: '🇬🇾', name: 'Guyana' },
  { code: '+593', country: 'EC', flag: '🇪🇨', name: 'Ecuador' },
  { code: '+594', country: 'GF', flag: '🇬🇫', name: 'French Guiana' },
  { code: '+595', country: 'PY', flag: '🇵🇾', name: 'Paraguay' },
  { code: '+596', country: 'MQ', flag: '🇲🇶', name: 'Martinique' },
  { code: '+597', country: 'SR', flag: '🇸🇷', name: 'Suriname' },
  { code: '+598', country: 'UY', flag: '🇺🇾', name: 'Uruguay' },
  { code: '+599', country: 'AN', flag: '🇧🇶', name: 'Netherlands Antilles' },
  { code: '+670', country: 'TL', flag: '🇹🇱', name: 'East Timor' },
  { code: '+672', country: 'NF', flag: '🇳🇫', name: 'Norfolk Island' },
  { code: '+673', country: 'BN', flag: '🇧🇳', name: 'Brunei' },
  { code: '+674', country: 'NR', flag: '🇳🇷', name: 'Nauru' },
  { code: '+675', country: 'PG', flag: '🇵🇬', name: 'Papua New Guinea' },
  { code: '+676', country: 'TO', flag: '🇹🇴', name: 'Tonga' },
  { code: '+677', country: 'SB', flag: '🇸🇧', name: 'Solomon Islands' },
  { code: '+678', country: 'VU', flag: '🇻🇺', name: 'Vanuatu' },
  { code: '+679', country: 'FJ', flag: '🇫🇯', name: 'Fiji' },
  { code: '+680', country: 'PW', flag: '🇵🇼', name: 'Palau' },
  { code: '+681', country: 'WF', flag: '🇼🇫', name: 'Wallis and Futuna' },
  { code: '+682', country: 'CK', flag: '🇨🇰', name: 'Cook Islands' },
  { code: '+683', country: 'NU', flag: '🇳🇺', name: 'Niue' },
  { code: '+685', country: 'WS', flag: '🇼🇸', name: 'Samoa' },
  { code: '+686', country: 'KI', flag: '🇰🇮', name: 'Kiribati' },
  { code: '+687', country: 'NC', flag: '🇳🇨', name: 'New Caledonia' },
  { code: '+688', country: 'TV', flag: '🇹🇻', name: 'Tuvalu' },
  { code: '+689', country: 'PF', flag: '🇵🇫', name: 'French Polynesia' },
  { code: '+690', country: 'TK', flag: '🇹🇰', name: 'Tokelau' },
  { code: '+691', country: 'FM', flag: '🇫🇲', name: 'Micronesia' },
  { code: '+692', country: 'MH', flag: '🇲🇭', name: 'Marshall Islands' },
  { code: '+850', country: 'KP', flag: '🇰🇵', name: 'North Korea' },
  { code: '+852', country: 'HK', flag: '🇭🇰', name: 'Hong Kong' },
  { code: '+853', country: 'MO', flag: '🇲🇴', name: 'Macau' },
  { code: '+855', country: 'KH', flag: '🇰🇭', name: 'Cambodia' },
  { code: '+856', country: 'LA', flag: '🇱🇦', name: 'Laos' },
  { code: '+880', country: 'BD', flag: '🇧🇩', name: 'Bangladesh' },
  { code: '+886', country: 'TW', flag: '🇹🇼', name: 'Taiwan' },
  { code: '+960', country: 'MV', flag: '🇲🇻', name: 'Maldives' },
  { code: '+961', country: 'LB', flag: '🇱🇧', name: 'Lebanon' },
  { code: '+962', country: 'JO', flag: '🇯🇴', name: 'Jordan' },
  { code: '+963', country: 'SY', flag: '🇸🇾', name: 'Syria' },
  { code: '+964', country: 'IQ', flag: '🇮🇶', name: 'Iraq' },
  { code: '+965', country: 'KW', flag: '🇰🇼', name: 'Kuwait' },
  { code: '+966', country: 'SA', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: '+967', country: 'YE', flag: '🇾🇪', name: 'Yemen' },
  { code: '+968', country: 'OM', flag: '🇴🇲', name: 'Oman' },
  { code: '+970', country: 'PS', flag: '🇵🇸', name: 'Palestine' },
  { code: '+971', country: 'AE', flag: '🇦🇪', name: 'UAE' },
  { code: '+972', country: 'IL', flag: '🇮🇱', name: 'Israel' },
  { code: '+973', country: 'BH', flag: '🇧🇭', name: 'Bahrain' },
  { code: '+974', country: 'QA', flag: '🇶🇦', name: 'Qatar' },
  { code: '+975', country: 'BT', flag: '🇧🇹', name: 'Bhutan' },
  { code: '+976', country: 'MN', flag: '🇲🇳', name: 'Mongolia' },
  { code: '+977', country: 'NP', flag: '🇳🇵', name: 'Nepal' },
  { code: '+992', country: 'TJ', flag: '🇹🇯', name: 'Tajikistan' },
  { code: '+993', country: 'TM', flag: '🇹🇲', name: 'Turkmenistan' },
  { code: '+994', country: 'AZ', flag: '🇦🇿', name: 'Azerbaijan' },
  { code: '+995', country: 'GE', flag: '🇬🇪', name: 'Georgia' },
  { code: '+996', country: 'KG', flag: '🇰🇬', name: 'Kyrgyzstan' },
  { code: '+998', country: 'UZ', flag: '🇺🇿', name: 'Uzbekistan' },
];

const formatPhoneNumber = (value: string) => {
  const digits = value.replace(/\D/g, '').substring(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0,3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
};

export default function PetSitting() {
  const [activeTab, setActiveTab] = useState<'find' | 'become'>('find');

  // Report Modal State
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportTargetEmail, setReportTargetEmail] = useState('');
  const [reportTargetType, setReportTargetType] = useState<'sitter' | 'user'>('sitter');
  const [reportBookingId, setReportBookingId] = useState<string | null>(null);
  const [reportSitterId, setReportSitterId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('Inappropriate behavior');
  const [reportDetails, setReportDetails] = useState('');
  const [reportLoading, setReportLoading] = useState(false);

  const handleOpenReportModal = (email: string, type: 'sitter' | 'user', bookingId?: string, sitterId?: string) => {
    setReportTargetEmail(email || '');
    setReportTargetType(type);
    setReportBookingId(bookingId || null);
    setReportSitterId(sitterId || null);
    setReportReason('Inappropriate behavior');
    setReportDetails('');
    setReportModalOpen(true);
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setReportLoading(true);
    try {
      const reporter = localStorage.getItem('lumo_pro_email') || localStorage.getItem('lumo_sitter_email') || 'anonymous@lumobites.com';
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reporter_email: reporter,
          reported_email: reportTargetEmail,
          reported_type: reportTargetType,
          booking_id: reportBookingId,
          sitter_id: reportSitterId,
          reason: reportReason,
          details: reportDetails
        })
      });
      if (res.ok) {
        alert('Thank you. Your report has been submitted for admin review.');
        setReportModalOpen(false);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to submit report. Please try again.');
      }
    } catch (err) {
      console.error('[Submit Report] Error:', err);
      alert('An error occurred. Please try again.');
    } finally {
      setReportLoading(false);
    }
  };

  const inviteMessageText = "Hey! I just signed up as a pet sitter on Lumo Bites — a free platform where you can earn money sitting pets in your neighborhood. No commission ever! Check it out and create your profile: lumobites.net/petsitting";

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(inviteMessageText);
    alert('Invitation message copied to clipboard!');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText('https://lumobites.net/petsitting');
    alert('Link copied to clipboard!');
  };

  const handleShareInvite = async () => {
    const shareData = {
      title: 'Lumo Bites Pet Sitting',
      text: inviteMessageText,
      url: 'https://lumobites.net/petsitting'
    };
    if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        console.log('Share canceled or failed:', err);
      }
    }
    
    // Fallback: Copy message to clipboard
    handleCopyMessage();
  };
  
  // Find Sitter State
  const [sitters, setSitters] = useState<Sitter[]>([]);
  const [loadingSitters, setLoadingSitters] = useState(false);
  const [isOwnerPro, setIsOwnerPro] = useState(false);
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [ownerAuthMode, setOwnerAuthMode] = useState<'email' | 'verify'>('email');
  const [ownerAuthCode, setOwnerAuthCode] = useState('');
  const [unlockEmail, setUnlockEmail] = useState('');
  const [unlockLoading, setUnlockLoading] = useState(false);
  const [searchZip, setSearchZip] = useState('');
  const skipGeocodeRef = useRef(false);
  const [searchLocationName, setSearchLocationName] = useState('');
  const [searchLocationError, setSearchLocationError] = useState('');
  const [searchPetType, setSearchPetType] = useState('all');
  const [searchDay, setSearchDay] = useState('all');
  const [searchTimeSlot, setSearchTimeSlot] = useState('');

  const [searchServiceType, setSearchServiceType] = useState('all');
  const [searchRadius, setSearchRadius] = useState('25');
  const [searchCoords, setSearchCoords] = useState<{lat: number, lng: number} | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
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
  const [isSelectingMultipleDays, setIsSelectingMultipleDays] = useState(false);
  const [reqNotes, setReqNotes] = useState('');
  const [reqServiceType, setReqServiceType] = useState('');
  const [reqTimeSlot, setReqTimeSlot] = useState('');
  const [reqLoading, setReqLoading] = useState(false);
  const [reqError, setReqError] = useState('');
  const [reqSuccess, setReqSuccess] = useState(false);
  const [hasSavedInfo, setHasSavedInfo] = useState(false);

  // Phone Verification State
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [verifyPhoneNum, setVerifyPhoneNum] = useState('');
  const [verifyPhoneCountry, setVerifyPhoneCountry] = useState('+1');
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [verifyPhoneCode, setVerifyPhoneCode] = useState('');
  const [verifyPhoneLoading, setVerifyPhoneLoading] = useState(false);
  const [verifyPhoneError, setVerifyPhoneError] = useState('');
  const [verifyConfirmationResult, setVerifyConfirmationResult] = useState<any>(null);


  // My Pets Profile State
  const [ownerPets, setOwnerPets] = useState<any[]>([]);
  const [loadingOwnerPets, setLoadingOwnerPets] = useState(false);
  const [petModalOpen, setPetModalOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<any | null>(null);
  const [petFormName, setPetFormName] = useState('');
  const [petFormType, setPetFormType] = useState('dog');
  const [petFormBreed, setPetFormBreed] = useState('');
  const [petFormAge, setPetFormAge] = useState('');
  const [petFormWeight, setPetFormWeight] = useState('');
  const [petFormGender, setPetFormGender] = useState('');
  const [petFormSpayed, setPetFormSpayed] = useState(false);
  const [petFormFeeding, setPetFormFeeding] = useState('');
  const [petFormMedication, setPetFormMedication] = useState('');
  const [petFormNotes, setPetFormNotes] = useState('');
  const [petFormVetName, setPetFormVetName] = useState('');
  const [petFormVetPhone, setPetFormVetPhone] = useState('');
  const [petFormPhoto, setPetFormPhoto] = useState('');
  const [petFormPhotos, setPetFormPhotos] = useState<string[]>([]);
  const [submittingPet, setSubmittingPet] = useState(false);
  const [selectedRequestPet, setSelectedRequestPet] = useState<any | null>(null);
  const [selectedRequestPets, setSelectedRequestPets] = useState<any[]>([]);

  // Inline Add Pet State
  const [showInlineAddPet, setShowInlineAddPet] = useState(false);
  const [inlinePetName, setInlinePetName] = useState('');
  const [inlinePetType, setInlinePetType] = useState('dog');
  const [inlinePetBreed, setInlinePetBreed] = useState('');
  const [inlinePetAge, setInlinePetAge] = useState('');
  const [inlineSaving, setInlineSaving] = useState(false);

  // Become Sitter State
  const [sitterEmail, setSitterEmail] = useState('');
  const [sitterFirstName, setSitterFirstName] = useState('');
  const [sitterLastName, setSitterLastName] = useState('');
  const sitterName = `${sitterFirstName} ${sitterLastName}`.trim();
  const [sitterPhoto, setSitterPhoto] = useState('');
  const [sitterCoverPhoto, setSitterCoverPhoto] = useState('');
  const [coverPhotoPosition, setCoverPhotoPosition] = useState<'top' | 'center' | 'bottom'>('center');

  // Compress image to max 1600px wide, 0.8 quality — simple, no cropping needed
  const compressCoverPhoto = (src: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        const maxW = 1600;
        const scale = img.naturalWidth > maxW ? maxW / img.naturalWidth : 1;
        const w = Math.round(img.naturalWidth * scale);
        const h = Math.round(img.naturalHeight * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(src); return; }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = () => resolve(src);
      img.src = src;
    });
  };

  const [sitterIdPhoto, setSitterIdPhoto] = useState('');
  const [hasExistingIdPhoto, setHasExistingIdPhoto] = useState(false);
  const [sitterApprovalStatus, setSitterApprovalStatus] = useState('none'); // 'none' = no profile, 'pending' = applied/waiting, 'approved', 'rejected'
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
  const [sitterRateType, setSitterRateType] = useState('night');
  const [sitterRateDropins, setSitterRateDropins] = useState('');
  const [sitterRateWalking, setSitterRateWalking] = useState('');
  const [sitterRateOvernight, setSitterRateOvernight] = useState('');
  const [sitterRateBoarding, setSitterRateBoarding] = useState('');
  const [sitterRateDaycare, setSitterRateDaycare] = useState('');
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
  const [requestFilter, setRequestFilter] = useState('all');
  const [historyFilter, setHistoryFilter] = useState('all');
  const [ownerActiveTab, setOwnerActiveTab] = useState<'bookings' | 'pets'>('bookings');
  const [hasScrolledToSection, setHasScrolledToSection] = useState(false);
  const [ownerRequests, setOwnerRequests] = useState<any[]>([]);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [activeChatBooking, setActiveChatBooking] = useState<any>(null);
  const [activeChatRole, setActiveChatRole] = useState<'owner'|'sitter'>('owner');
  const [sitterLastUpdated, setSitterLastUpdated] = useState<Date | null>(null);
  const [ownerLastUpdated, setOwnerLastUpdated] = useState<Date | null>(null);
  const [loadingOwnerRequests, setLoadingOwnerRequests] = useState(false);
  const [ownerHistoryFetched, setOwnerHistoryFetched] = useState(false);

  // Refresh State
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDownY, setPullDownY] = useState(0);
  const isPullingRef = useRef(false);
  const pullStartYRef = useRef(0);

  const [completedBookings, setCompletedBookings] = useState(0);

  // Calendar Availability States
  const [sitterBlockedDates, setSitterBlockedDates] = useState<string[]>([]);
  const [sitterBookedDates, setSitterBookedDates] = useState<string[]>([]);
  const [sitterBookedSlots, setSitterBookedSlots] = useState<{ [date: string]: string[] }>({});
  const [loadedSitterAvailableTimes, setLoadedSitterAvailableTimes] = useState<string[]>([]);
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
  const [profileSuccessMessage, setProfileSuccessMessage] = useState('');
  const [profilePreviewMode, setProfilePreviewMode] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Sitter Auth State
  const [sitterAuthMode, setSitterAuthMode] = useState<'email' | 'otp' | 'form'>('email');
  const [sitterAuthCode, setSitterAuthCode] = useState('');
  const [sitterAuthLoading, setSitterAuthLoading] = useState(false);
  const [sitterAuthError, setSitterAuthError] = useState('');
  const [sitterConflict, setSitterConflict] = useState(false);
  const [sitterSignupIntent, setSitterSignupIntent] = useState<'new' | 'existing' | null>(null);

  // Delete Profile State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Camera Webcam State
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [cameraTarget, setCameraTarget] = useState<'selfie' | 'id' | 'cover' | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const profilePhotoInputRef = useRef<HTMLInputElement | null>(null);
  const coverPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const coverCameraInputRef = useRef<HTMLInputElement | null>(null);
  const petPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const petCameraInputRef = useRef<HTMLInputElement | null>(null);

  // Zip Code Validation State
  const [zipGeocoding, setZipGeocoding] = useState(false);
  const [zipError, setZipError] = useState('');

  const loadOwnerProfile = async (email: string) => {
    if (!email) return;
    try {
      const res = await fetch(`/api/petsitting/owner-profile?email=${encodeURIComponent(email)}&t=${Date.now()}`);
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
    const syncStatus = () => {
      const cachedEmail = localStorage.getItem('lumo_pro_email');
      if (cachedEmail && cachedEmail !== 'undefined' && cachedEmail.trim() !== '') {
        setReqEmail(cachedEmail);
        fetchSitters(cachedEmail);
        loadOwnerProfile(cachedEmail);

        // Owner session validation check
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
                alert("You have been signed out of all devices for security.");
                window.location.href = "/";
              }
            }
          }
        })
        .catch(err => console.error('[Page Owner Check] error:', err));
      } else {
        setReqEmail('');
        setIsOwnerPro(false);
      }
    };

    syncStatus();
    window.addEventListener('lumo-pro-update', syncStatus);
    window.addEventListener('storage', syncStatus);

    const handleSitterSession = () => {
      const cachedProEmail = localStorage.getItem('lumo_pro_email');

      if (cachedProEmail && cachedProEmail !== 'undefined' && cachedProEmail.trim() !== '') {
        // Logged in as a member. Always use their Pro email for sitter auth.
        setSitterEmail(cachedProEmail);
        setSitterAuthMode('form');

        // Always check their profile status
        fetch(`/api/petsitting/profile?email=${encodeURIComponent(cachedProEmail)}&t=${Date.now()}`)
          .then(res => res.json())
          .then(profileData => {
            if (profileData && profileData.id) {
              loadSitterProfile(cachedProEmail);
              // Only show dashboard automatically if they are approved
              if (profileData.approval_status === 'approved') {
                setProfilePreviewMode(true);
              } else {
                setProfilePreviewMode(false);
              }
            } else {
              // No profile found — member has never applied
              setProfilePreviewMode(false);
              setSitterApprovalStatus('none');
            }
          })
          .catch(err => {
            console.error('Failed to auto-load sitter profile:', err);
            setProfilePreviewMode(false);
          });
      } else {
        // Not signed in
        setSitterAuthMode('email');
        setSitterEmail('');
        setProfilePreviewMode(false);
      }
    };

    handleSitterSession();
    window.addEventListener('lumo-pro-update', handleSitterSession);

    // Set activeTab and filters from URL search params or hash
    const params = new URLSearchParams(window.location.search);
    const section = params.get('section');
    const statusParam = params.get('status');
    if (params.get('tab') === 'become' || window.location.hash === '#become' || section === 'requests') {
      setActiveTab('become');
      if (section === 'requests') {
        setProfilePreviewMode(true);
      }
    } else if (section === 'history') {
      setActiveTab('find');
    }
    if (statusParam) {
      setRequestFilter(statusParam);
      setHistoryFilter(statusParam);
    }

    return () => {
      window.removeEventListener('lumo-pro-update', syncStatus);
      window.removeEventListener('lumo-pro-update', handleSitterSession);
      window.removeEventListener('storage', syncStatus);
    };
  }, []);

  // Automatically fetch owner's booking history and pets whenever their email is authenticated
  useEffect(() => {
    if (reqEmail) {
      fetchOwnerRequests(reqEmail);
      fetchOwnerPets(reqEmail);
    }
  }, [reqEmail]);

  // Automatically open chat modal if 'chat' or 'booking_id' booking ID is present in URL query params
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const chatBookingId = params.get('chat') || (params.get('section') === 'messages' ? params.get('booking_id') : null);
    if (!chatBookingId) return;

    // Find the booking request in either sitterRequests or ownerRequests
    const foundSitterReq = sitterRequests.find(r => r.id === chatBookingId);
    if (foundSitterReq) {
      if (foundSitterReq.status === 'cancelled') {
        // Silently strip the stale chat/booking params — booking is cancelled, nothing to open
        const newUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({ path: newUrl }, '', newUrl);
        return;
      }
      setActiveChatBooking(foundSitterReq);
      setActiveChatRole('sitter');
      setChatModalOpen(true);
      
      // Clean up search param without page reload so we don't reopen it on reload
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({ path: newUrl }, '', newUrl);
      return;
    }

    const foundOwnerReq = ownerRequests.find(r => r.id === chatBookingId);
    if (foundOwnerReq) {
      if (foundOwnerReq.status === 'cancelled') {
        // Silently strip the stale chat/booking params — booking is cancelled, nothing to open
        const newUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({ path: newUrl }, '', newUrl);
        return;
      }
      setActiveChatBooking(foundOwnerReq);
      setActiveChatRole('owner');
      setChatModalOpen(true);
      
      // Clean up search param without page reload
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({ path: newUrl }, '', newUrl);
      return;
    }
  }, [sitterRequests, ownerRequests]);

  // Handle URL section scroll on load
  useEffect(() => {
    if (typeof window === 'undefined' || hasScrolledToSection) return;

    const params = new URLSearchParams(window.location.search);
    const section = params.get('section');

    if (section === 'requests') {
      const el = document.getElementById('sitter-dashboard');
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
        setHasScrolledToSection(true);
      }
    } else if (section === 'history') {
      const el = document.getElementById('owner-history');
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
        setHasScrolledToSection(true);
      }
    }
  }, [sitterRequests, ownerRequests, hasScrolledToSection]);

  // If ownerPets loads and selectedRequestPets is empty, auto-select the first pet if it's the only one
  useEffect(() => {
    if (ownerPets.length === 1 && selectedRequestPets.length === 0) {
      setSelectedRequestPets([ownerPets[0]]);
    }
  }, [ownerPets]);

  const handleClearSavedInfo = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    setReqOwnerName('');
    setReqPetName('');
    setReqPetType('dog');
    setReqPetAge('');
    setReqNotes('');
    setReqPhone('');
    setSelectedRequestPet(null);
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
        if (Array.isArray(data.available_days)) {
          setSitterAvailableDays(data.available_days);
        }
        if (Array.isArray(data.available_times)) {
          setLoadedSitterAvailableTimes(data.available_times);
        } else {
          setLoadedSitterAvailableTimes([]);
        }
        
        // Compile all accepted booking dates into a flat array and a slot-based map
        const booked: string[] = [];
        const bookedSlotsMap: { [date: string]: string[] } = {};
        
        if (Array.isArray(data.accepted_bookings)) {
          data.accepted_bookings.forEach((booking: any) => {
            if (Array.isArray(booking.dates_in_range)) {
              booked.push(...booking.dates_in_range);
              booking.dates_in_range.forEach((dateStr: string) => {
                if (!bookedSlotsMap[dateStr]) {
                  bookedSlotsMap[dateStr] = [];
                }
                bookedSlotsMap[dateStr].push(booking.time_slot || 'all');
              });
            }
          });
        }
        setSitterBookedDates(booked);
        setSitterBookedSlots(bookedSlotsMap);
      }
    } catch (err) {
      console.error('Failed to fetch sitter availability:', err);
    }
  };

  const getSitterActiveSlots = (availableTimes: string[]) => {
    const allTimeSlots = [
      'Morning (8am - 12pm)',
      'Afternoon (12pm - 5pm)',
      'Evening (5pm - 9pm)',
      'Full Day (8am - 9pm)',
      'Overnight (9pm - 8am)'
    ];
    return allTimeSlots.filter(slot => {
      if (availableTimes.includes(slot)) return true;
      // Fallback mapper for legacy database strings
      if (slot.startsWith('Morning') && (availableTimes.includes('Morning') || availableTimes.includes('Morning (6am-12pm)'))) return true;
      if (slot.startsWith('Afternoon') && (availableTimes.includes('Afternoon') || availableTimes.includes('Afternoon (12pm-6pm)'))) return true;
      if (slot.startsWith('Evening') && (availableTimes.includes('Evening') || availableTimes.includes('Evening (6pm-10pm)'))) return true;
      if (slot.startsWith('Overnight') && (availableTimes.includes('Overnight') || availableTimes.includes('Overnight (9pm-8am)'))) return true;
      if (slot.startsWith('Full Day') && (availableTimes.includes('Full Day') || availableTimes.includes('Flexible'))) return true;
      return false;
    });
  };

  const slotsOverlap = (slotA: string | null, slotB: string | null) => {
    if (!slotA || !slotB) return true; // Legacy bookings block everything
    
    const normalize = (slot: string) => {
      const lower = slot.toLowerCase();
      if (lower.includes('morning')) return 'morning';
      if (lower.includes('afternoon')) return 'afternoon';
      if (lower.includes('evening')) return 'evening';
      if (lower.includes('overnight')) return 'overnight';
      if (lower.includes('full day') || lower === 'flexible') return 'full day';
      return lower;
    };

    const nA = normalize(slotA);
    const nB = normalize(slotB);
    if (nA === 'full day' && nB !== 'overnight') return true;
    if (nB === 'full day' && nA !== 'overnight') return true;
    return nA === nB;
  };

  const isSlotBooked = (dateStr: string, slot: string) => {
    const booked = sitterBookedSlots[dateStr] || [];
    if (booked.includes('all')) return true;
    return booked.some(bSlot => slotsOverlap(bSlot, slot));
  };

  const isDateFullyBooked = (dateStr: string, availableTimes: string[]) => {
    if (sitterBlockedDates.includes(dateStr)) return true;
    
    const activeSlots = getSitterActiveSlots(availableTimes);
    if (activeSlots.length === 0) {
      return (sitterBookedSlots[dateStr] || []).length > 0;
    }
    
    return activeSlots.every(slot => isSlotBooked(dateStr, slot));
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
    if (isDateFullyBooked(dateStr, loadedSitterAvailableTimes) || sitterBlockedDates.includes(dateStr)) return;

    if (!isSelectingMultipleDays) {
      setReqStartDate(dateStr);
      setReqEndDate(dateStr);
      return;
    }

    if (!reqStartDate || (reqStartDate && reqEndDate)) {
      setReqStartDate(dateStr);
      setReqEndDate('');
    } else {
      if (dateStr < reqStartDate) {
        setReqStartDate(dateStr);
      } else {
        const intermediate = getDatesBetween(reqStartDate, dateStr);
        const hasOverlap = intermediate.some(d => sitterBlockedDates.includes(d) || isDateFullyBooked(d, loadedSitterAvailableTimes));
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
      setIsSelectingMultipleDays(false);
      setReqServiceType('');
      setReqTimeSlot('');
      setShowPhoneVerification(false);
      setVerifyPhoneNum('');
      setVerifyPhoneCode('');
      setVerifyPhoneError('');
      setVerifyConfirmationResult(null);
      fetchSitterAvailability(selectedSitter.id);
    }
  }, [requestModalOpen, selectedSitter]);

  // Debounced geocoding effect
  useEffect(() => {
    if (skipGeocodeRef.current) {
      skipGeocodeRef.current = false;
      return;
    }

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
            if (sitters.length === 0) fetchSitters();
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

  const handleUseMyLocation = () => {
    if (navigator.geolocation) {
      setIsDetectingLocation(true);
      setIsGeocoding(true);
      setSearchLocationError('');
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          try {
            const res = await fetch(`/api/petsitting/geocode?latlng=${lat},${lng}`);
            const data = await res.json();
            if (res.ok && data.lat && data.lng) {
              const locationName = data.formatted_address || data.city || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
              skipGeocodeRef.current = true;
              setSearchZip(locationName);
              setSearchCoords({ lat: data.lat, lng: data.lng });
              setSearchLocationName(locationName);
              setSearchLocationError('');
              if (sitters.length === 0) {
                await fetchSitters();
              }
            } else {
              setSearchLocationError('Could not determine your location name.');
            }
          } catch (e) {
            console.error('Reverse geocoding error:', e);
            setSearchLocationError('Failed to parse your location name.');
          } finally {
            setIsGeocoding(false);
            setIsDetectingLocation(false);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          setIsGeocoding(false);
          setIsDetectingLocation(false);
          if (error.code === error.PERMISSION_DENIED) {
            alert('Location access is blocked. To enable:\niPhone: Settings → Privacy → Location Services → Safari/Chrome → Allow\nAndroid: Settings → Apps → Browser → Permissions → Location → Allow');
          } else if (error.code === error.TIMEOUT) {
            alert('Location request timed out. Please try again or enter your city manually.');
          } else {
            alert('Unable to get your location. Please enter your city manually.');
          }
          document.getElementById('locationSearchInput')?.focus();
        },
        { 
          timeout: 10000,
          enableHighAccuracy: true,
          maximumAge: 60000 
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  const fetchSitters = async (email?: string, dayOverride?: string, serviceOverride?: string) => {
    setLoadingSitters(true);
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
      const res = await fetch(`/api/petsitting/reviews?sitter_id=${sitter.id}&t=${Date.now()}`);
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
      const res = await fetch(`/api/petsitting/request/sitter?sitter_id=${id}&t=${Date.now()}`);
      const data = await res.json();
      if (res.ok && data.requests) {
        setSitterRequests(data.requests);
        setSitterLastUpdated(new Date());
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
      const res = await fetch(`/api/petsitting/request/owner?email=${encodeURIComponent(email)}&t=${Date.now()}`);
      const data = await res.json();
      if (res.ok && data.requests) {
        setOwnerRequests(data.requests);
        setOwnerHistoryFetched(true);
        setOwnerLastUpdated(new Date());
        localStorage.setItem('lumo_owner_history_email', email);
      }
    } catch (e) {
      console.error('Failed to fetch owner requests');
    } finally {
      setLoadingOwnerRequests(false);
    }
  };

  const fetchOwnerPets = async (email: string) => {
    if (!email) return;
    setLoadingOwnerPets(true);
    try {
      const res = await fetch(`/api/petsitting/pets?email=${encodeURIComponent(email)}&t=${Date.now()}`);
      const data = await res.json();
      if (res.ok && data.pets) {
        setOwnerPets(data.pets);
      }
    } catch (e) {
      console.error('Failed to fetch owner pets:', e);
    } finally {
      setLoadingOwnerPets(false);
    }
  };

  const openPetModal = (pet: any = null) => {
    if (pet) {
      setEditingPet(pet);
      setPetFormName(pet.pet_name || '');
      setPetFormType(pet.pet_type || 'dog');
      setPetFormBreed(pet.breed || '');
      setPetFormAge(pet.age || '');
      setPetFormWeight(pet.weight || '');
      setPetFormGender(pet.gender || '');
      setPetFormSpayed(!!pet.spayed_neutered);
      setPetFormFeeding(pet.feeding_schedule || '');
      setPetFormMedication(pet.medication || '');
      setPetFormNotes(pet.behavior_notes || '');
      setPetFormVetName(pet.vet_name || '');
      setPetFormVetPhone(pet.vet_phone || '');
      setPetFormPhoto(pet.photo_url || '');
      
      const urls = Array.isArray(pet.photo_urls) ? pet.photo_urls.filter(Boolean) : [];
      if (urls.length > 0) {
        setPetFormPhotos(urls);
      } else if (pet.photo_url) {
        setPetFormPhotos([pet.photo_url]);
      } else {
        setPetFormPhotos([]);
      }
    } else {
      setEditingPet(null);
      setPetFormName('');
      setPetFormType('dog');
      setPetFormBreed('');
      setPetFormAge('');
      setPetFormWeight('');
      setPetFormGender('');
      setPetFormSpayed(false);
      setPetFormFeeding('');
      setPetFormMedication('');
      setPetFormNotes('');
      setPetFormVetName('');
      setPetFormVetPhone('');
      setPetFormPhoto('');
      setPetFormPhotos([]);
    }
    setPetModalOpen(true);
  };

  const handlePhotoUpload = (file: File) => {
    if (petFormPhotos.length >= 3) {
      alert("Maximum of 3 photos reached");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
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
        const compressed = canvas.toDataURL('image/jpeg', 0.8);
        setPetFormPhotos(prev => [...prev, compressed].slice(0, 3));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSavePet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!petFormName.trim()) return;
    setSubmittingPet(true);
    try {
      const res = await fetch('/api/petsitting/pets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingPet?.id || null,
          owner_email: reqEmail,
          pet_name: petFormName,
          pet_type: petFormType,
          breed: petFormBreed,
          age: petFormAge,
          weight: petFormWeight,
          gender: petFormGender,
          spayed_neutered: petFormSpayed,
          feeding_schedule: petFormFeeding,
          medication: petFormMedication,
          behavior_notes: petFormNotes,
          vet_name: petFormVetName,
          vet_phone: petFormVetPhone,
          photo_url: petFormPhotos[0] || '',
          photo_urls: petFormPhotos
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(editingPet ? 'Pet profile updated! 🐾' : 'Pet profile added! 🐾');
        setPetModalOpen(false);
        await fetchOwnerPets(reqEmail);
        if (data.pet) {
          setSelectedRequestPet(data.pet);
        }
      } else {
        alert(data.error || 'Failed to save pet profile.');
      }
    } catch (err) {
      console.error('Failed to save pet profile:', err);
    } finally {
      setSubmittingPet(false);
    }
  };

  const handleDeletePet = async (petId: string) => {
    if (!confirm('Are you sure you want to delete this pet profile? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/petsitting/pets?id=${encodeURIComponent(petId)}&email=${encodeURIComponent(reqEmail)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('Pet profile deleted successfully.');
        fetchOwnerPets(reqEmail);
      } else {
        alert(data.error || 'Failed to delete pet profile.');
      }
    } catch (err) {
      console.error('Failed to delete pet:', err);
    }
  };

  const handleSavePetInline = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!inlinePetName.trim()) {
      alert('Pet name is required');
      return;
    }
    setInlineSaving(true);
    try {
      const res = await fetch('/api/petsitting/pets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner_email: reqEmail,
          pet_name: inlinePetName,
          pet_type: inlinePetType,
          breed: inlinePetBreed,
          age: inlinePetAge,
          spayed_neutered: false
        })
      });
      const data = await res.json();
      if (res.ok && data.success && data.pet) {
        await fetchOwnerPets(reqEmail);
        setSelectedRequestPets(prev => [...prev.filter(p => p.id !== data.pet.id), data.pet]);
        setShowInlineAddPet(false);
      } else {
        alert(data.error || 'Failed to save pet profile.');
      }
    } catch (err) {
      console.error('Failed to save pet inline:', err);
    } finally {
      setInlineSaving(false);
    }
  };

  // Toast Notification State
  const [showUpdatedToast, setShowUpdatedToast] = useState(false);

  const triggerUpdatedIndicator = () => {
    setShowUpdatedToast(true);
    setTimeout(() => {
      setShowUpdatedToast(false);
    }, 3000); // Hide after 3 seconds
  };

  // Keep current context for stable refresh function
  const currentContextRef = useRef({ activeTab, ownerActiveTab, reqEmail, sitterId });
  currentContextRef.current = { activeTab, ownerActiveTab, reqEmail, sitterId };

  // Unified refresh function for active UI context
  const refreshActiveData = useCallback(async () => {
    setIsRefreshing(true);
    const ctx = currentContextRef.current;
    try {
      if (ctx.activeTab === 'find') {
        await fetchSitters();
        if (ctx.reqEmail) {
          if (ctx.ownerActiveTab === 'bookings') await fetchOwnerRequests(ctx.reqEmail);
          else await fetchOwnerPets(ctx.reqEmail);
        }
      } else if (ctx.activeTab === 'become') {
        if (ctx.sitterId) await fetchSitterRequests(ctx.sitterId);
      }
    } catch (e) {
      console.error('Refresh error', e);
    } finally {
      setIsRefreshing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh on tab switch
  useEffect(() => {
    refreshActiveData();
  }, [activeTab, ownerActiveTab, refreshActiveData]);

  // Refresh on returning to browser tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshActiveData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refreshActiveData]);

  // Auto-poll every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshActiveData();
    }, 30000);
    return () => clearInterval(interval);
  }, [refreshActiveData]);

  // Pull-to-refresh Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      isPullingRef.current = true;
      pullStartYRef.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPullingRef.current) return;
    const y = e.touches[0].clientY;
    const delta = y - pullStartYRef.current;
    if (delta > 0 && window.scrollY === 0) {
      setPullDownY(Math.min(delta * 0.4, 80));
    } else {
      isPullingRef.current = false;
      setPullDownY(0);
    }
  };

  const handleTouchEnd = () => {
    if (pullDownY > 60 && !isRefreshing) {
      setIsRefreshing(true);
      refreshActiveData().finally(() => {
        setIsRefreshing(false);
        setPullDownY(0);
      });
    } else {
      setPullDownY(0);
    }
    isPullingRef.current = false;
  };

  // Real-time Supabase subscriptions for booking requests
  useEffect(() => {
    if (!supabase) return;

    console.log('[Real-time] Setting up Supabase channel subscription for sitting_requests...');

    const channel = supabase
      .channel('booking-updates')
      .on('postgres_changes', {
        event: '*', // Listen to INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'sitting_requests'
      }, (payload) => {
        console.log('[Real-time] Booking change detected in sitting_requests:', payload);
        
        // Refresh bookings
        if (reqEmail && reqEmail.trim() !== '') {
          console.log('[Real-time] Refreshing owner requests for:', reqEmail);
          fetchOwnerRequests(reqEmail);
        }
        if (sitterId && sitterId.trim() !== '') {
          console.log('[Real-time] Refreshing sitter requests for:', sitterId);
          fetchSitterRequests(sitterId);
        }

        // Show a subtle "Updated" notification/indicator
        triggerUpdatedIndicator();
      })
      .subscribe((status) => {
        console.log('[Real-time] Subscription status:', status);
      });

    return () => {
      console.log('[Real-time] Cleaning up Supabase channel subscription...');
      supabase.removeChannel(channel);
    };
  }, [reqEmail, sitterId]);

  const isBookingDateActive = (datesStr: string): boolean => {
    if (!datesStr) return false;
    try {
      let startDateStr = '';
      let endDateStr = '';
      
      const cleanDates = datesStr.replace(/\s+/g, ' ');
      if (cleanDates.includes('→')) {
        const parts = cleanDates.split('→');
        startDateStr = parts[0].trim();
        endDateStr = parts[1].trim();
      } else if (cleanDates.includes('->')) {
        const parts = cleanDates.split('->');
        startDateStr = parts[0].trim();
        endDateStr = parts[1].trim();
      } else if (cleanDates.includes('-')) {
        const parts = cleanDates.split('-');
        if (parts.length === 2 && parts[0].length > 4) {
          startDateStr = parts[0].trim();
          endDateStr = parts[1].trim();
        } else {
          startDateStr = cleanDates.trim();
          endDateStr = cleanDates.trim();
        }
      } else {
        startDateStr = cleanDates.trim();
        endDateStr = cleanDates.trim();
      }
      
      const startDate = new Date(startDateStr);
      const endDate = new Date(endDateStr);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return false;
      }
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      
      return today >= startDate && today <= endDate;
    } catch (e) {
      return false;
    }
  };

  const getBookingEndDate = (datesStr: string): Date | null => {
    if (!datesStr) return null;
    try {
      let endDateStr = '';
      const cleanDates = datesStr.replace(/\s+/g, ' ');
      if (cleanDates.includes('→')) {
        endDateStr = cleanDates.split('→')[1].trim();
      } else if (cleanDates.includes('->')) {
        endDateStr = cleanDates.split('->')[1].trim();
      } else if (cleanDates.includes('-')) {
        const parts = cleanDates.split('-');
        if (parts.length === 2 && parts[0].length > 4) {
          endDateStr = parts[1].trim();
        } else {
          endDateStr = cleanDates.trim();
        }
      } else {
        endDateStr = cleanDates.trim();
      }
      const endDate = new Date(endDateStr);
      if (isNaN(endDate.getTime())) return null;
      endDate.setHours(0, 0, 0, 0);
      return endDate;
    } catch (e) {
      return null;
    }
  };

  const handleRequestAgain = async (req: any) => {
    // Fill in the details from owner profile
    const emailToUse = req.owner_email || reqEmail;
    let profile = null;
    if (emailToUse) {
      setReqEmail(emailToUse);
      profile = await loadOwnerProfile(emailToUse);
    }
    
    // Fallback to request details if profile load yielded nothing
    if (!profile) {
      if (req.owner_name) setReqOwnerName(req.owner_name);
    }

    // Auto-select the pet if req.pet_id is provided, or if pet_name matches
    if (req.pet_details?.pets) {
      setSelectedRequestPets(req.pet_details.pets);
      setSelectedRequestPet(req.pet_details.pets[0] || null);
    } else if (req.pet_id) {
      const found = ownerPets.find(p => p.id === req.pet_id);
      if (found) {
        setSelectedRequestPet(found);
        setSelectedRequestPets([found]);
      } else if (req.pet_details) {
        setSelectedRequestPet(req.pet_details);
        setSelectedRequestPets([req.pet_details]);
      }
    } else if (req.pet_name) {
      const found = ownerPets.find(p => p.pet_name?.toLowerCase().trim() === req.pet_name?.toLowerCase().trim());
      if (found) {
        setSelectedRequestPet(found);
        setSelectedRequestPets([found]);
      } else if (req.pet_details) {
        setSelectedRequestPet(req.pet_details);
        setSelectedRequestPets([req.pet_details]);
      } else {
        const fallback = {
          pet_name: req.pet_name,
          pet_type: req.pet_type || 'dog',
          age: req.pet_age || ''
        };
        setSelectedRequestPet(fallback);
        setSelectedRequestPets([fallback]);
      }
    }
    
    // Set selected sitter
    const existing = sitters.find(s => s.id === req.sitter_id);
    if (existing) {
      setSelectedSitter(existing);
      setRequestModalOpen(true);
    } else {
      try {
        const res = await fetch(`/api/petsitting/sitters?id=${req.sitter_id}&t=${Date.now()}`);
        const data = await res.json();
        const fetchedSitter = data.sitters?.find((s: any) => s.id === req.sitter_id);
        if (fetchedSitter) {
          setSelectedSitter(fetchedSitter);
        } else {
          const tempSitter: Sitter = {
            id: req.sitter_id,
            name: req.sitter_name,
            photo_url: req.sitter_photo_url || '',
            bio: '',
            pet_types: req.pet_type || 'both',
            rate_per_night: 0,
            available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            available_times: ['Morning (8am - 12pm)', 'Afternoon (12pm - 5pm)', 'Evening (5pm - 9pm)'],
            service_types: ['Home visits', 'Overnight stays']
          };
          setSelectedSitter(tempSitter);
        }
      } catch (e) {
        const tempSitter: Sitter = {
          id: req.sitter_id,
          name: req.sitter_name,
          photo_url: req.sitter_photo_url || '',
          bio: '',
          pet_types: req.pet_type || 'both',
          rate_per_night: 0,
          available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          available_times: ['Morning (8am - 12pm)', 'Afternoon (12pm - 5pm)', 'Evening (5pm - 9pm)'],
          service_types: ['Home visits', 'Overnight stays']
        };
        setSelectedSitter(tempSitter);
      }
      setRequestModalOpen(true);
    }
  };

  const handleViewBooking = async (req: any) => {
    const existing = sitters.find(s => s.id === req.sitter_id);
    if (existing) {
      setSelectedSitterForReviews(existing);
      setReviewsModalOpen(true);
      setLoadingReviews(true);
      try {
        const res = await fetch(`/api/petsitting/reviews?sitter_id=${existing.id}&t=${Date.now()}`);
        const data = await res.json();
        if (res.ok && data.reviews) {
          setSitterReviews(data.reviews);
        } else {
          setSitterReviews([]);
        }
      } catch (e) {
        console.error('Failed to load reviews');
      } finally {
        setLoadingReviews(false);
      }
    } else {
      try {
        const res = await fetch(`/api/petsitting/sitters?id=${req.sitter_id}&t=${Date.now()}`);
        const data = await res.json();
        const fetchedSitter = data.sitters?.find((s: any) => s.id === req.sitter_id);
        if (fetchedSitter) {
          setSelectedSitterForReviews(fetchedSitter);
          setReviewsModalOpen(true);
          setLoadingReviews(true);
          const rRes = await fetch(`/api/petsitting/reviews?sitter_id=${req.sitter_id}&t=${Date.now()}`);
          const rData = await rRes.json();
          if (rRes.ok && rData.reviews) {
            setSitterReviews(rData.reviews);
          } else {
            setSitterReviews([]);
          }
          setLoadingReviews(false);
        } else {
          const tempSitter: Sitter = {
            id: req.sitter_id,
            name: req.sitter_name,
            photo_url: req.sitter_photo_url || '',
            bio: 'Active verified sitter.',
            pet_types: req.pet_type || 'both',
            rate_per_night: 0,
            available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            available_times: ['Morning (8am - 12pm)', 'Afternoon (12pm - 5pm)', 'Evening (5pm - 9pm)'],
            service_types: ['Home visits', 'Overnight stays']
          };
          setSelectedSitterForReviews(tempSitter);
          setReviewsModalOpen(true);
          setSitterReviews([]);
        }
      } catch (e) {
        console.error(e);
      }
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

  const handleCancelRequestByOwner = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this booking request? This will notify the sitter and cannot be undone.')) {
      return;
    }
    try {
      const res = await fetch('/api/petsitting/request/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, by: 'owner', email: reqEmail })
      });
      if (res.ok) {
        alert('Your booking has been cancelled');
        fetchOwnerRequests(reqEmail);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to cancel request.');
      }
    } catch (e) {
      alert('An error occurred.');
    }
  };

  const handleConfirmCompletedByOwner = async (req: any) => {
    if (!confirm('Did your sitter complete the sitting? Confirming will send them a review request.')) {
      return;
    }
    try {
      const res = await fetch('/api/petsitting/request/confirm-completed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: req.id, email: reqEmail })
      });
      if (res.ok) {
        alert('Booking marked as completed! Review request sent. 🎉');
        fetchOwnerRequests(reqEmail);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to confirm booking completion.');
      }
    } catch (e) {
      alert('An error occurred.');
    }
  };

  const handleReportNoShow = async (req: any) => {
    if (!confirm('Are you sure you want to report this sitter as a no show? This will notify our team.')) {
      return;
    }
    try {
      const res = await fetch('/api/petsitting/request/report-no-show', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: req.id, email: reqEmail })
      });
      if (res.ok) {
        alert('No show reported. Our team has been notified.');
        fetchOwnerRequests(reqEmail);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to report no show.');
      }
    } catch (e) {
      alert('An error occurred.');
    }
  };

  const handleCancelBookingBySitter = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this booking? This will notify the owner and might affect your reputation.')) {
      return;
    }
    try {
      const res = await fetch('/api/petsitting/request/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, by: 'sitter', sitter_id: sitterId })
      });
      if (res.ok) {
        alert('Booking cancelled successfully');
        if (sitterId) {
          fetchSitterRequests(sitterId);
        }
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to cancel booking.');
      }
    } catch (e) {
      alert('An error occurred.');
    }
  };


  const loadSitterProfile = async (email: string) => {
    setProfileLoading(true);
    try {
      const res = await fetch(`/api/petsitting/profile?email=${encodeURIComponent(email)}&t=${Date.now()}`);
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
          setSitterCoverPhoto(data.cover_photo_url || '');
          setCoverPhotoPosition((data.cover_photo_position as 'top' | 'center' | 'bottom') || 'center');
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
          setSitterRateType(data.rate_type || 'night');
          setSitterRateDropins(data.rate_dropins?.toString() || '');
          setSitterRateWalking(data.rate_walking?.toString() || '');
          setSitterRateOvernight(data.rate_overnight?.toString() || '');
          setSitterRateBoarding(data.rate_boarding?.toString() || '');
          setSitterRateDaycare(data.rate_daycare?.toString() || '');
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

  const handleSitterEmailSubmit = async (e: React.FormEvent, intent: 'new' | 'existing') => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!sitterEmail.trim() || !emailRegex.test(sitterEmail.trim())) {
      setSitterAuthError('Please enter a valid email address');
      return;
    }
    
    setSitterSignupIntent(intent);
    setSitterAuthLoading(true);
    setSitterAuthError('');
    setSitterConflict(false);
    
    try {
      // Always send OTP — profile check happens after verification
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
        // Code verified! Save persistent sitter session
        const expiry = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
        localStorage.setItem('lumo_sitter_email', sitterEmail);
        localStorage.setItem('lumo_sitter_email_expiry', expiry.toString());
        localStorage.setItem('lumo_session_started_at', new Date().toISOString());

        const profileRes = await fetch(`/api/petsitting/profile?email=${encodeURIComponent(sitterEmail)}&t=${Date.now()}`);
        const profileData = await profileRes.json();

        if (profileRes.ok && profileData && profileData.id) {
          if (sitterSignupIntent === 'new') {
            // Profile exists but intent was new signup -> Error!
            setSitterConflict(true);
            setSitterAuthError('A sitter profile already exists for this email. Please use Sign In to Existing Profile instead.');
          } else {
            // Profile found and intent is 'existing' -> load it
            await loadSitterProfile(sitterEmail);
            setSitterAuthMode('form');
            setProfilePreviewMode(true);
          }
        } else if (sitterSignupIntent === 'existing') {
          // "Sign In" intent but no profile found — show helpful error, go back to email screen
          setSitterAuthMode('email');
          setSitterAuthError('No sitter profile found for this email. If you\'re new here, click "Create New Profile" instead.');
        } else {
          // New signup — clear form and open blank profile creation form
          setSitterId('');
          setSitterFirstName('');
          setSitterLastName('');
          setSitterPhoto('');
          setSitterCoverPhoto('');
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
        alert('Your sitter profile was successfully deleted.');
        // Reset state
        // Clear local storage session
        localStorage.removeItem('lumo_sitter_email');
        localStorage.removeItem('lumo_sitter_email_expiry');

        // Reset all states
        setSitterId('');
        setSitterAuthMode('email');
        setSitterSignupIntent(null);
        setSitterAuthCode('');
        setSitterEmail('');
        setSitterFirstName('');
        setSitterLastName('');
        setSitterPhoto('');
        setSitterCoverPhoto('');
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
        setSitterPetTypes('both');
        setSitterRate('');
        setSitterPhone('');
        setSitterPhoneVisible(false);
        setSelfDeclared(false);
        setIsProSitter(false);
        setProfilePreviewMode(false);
        setDeleteModalOpen(false);
        setActiveTab('find');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete profile. Please try again.');
      }
    } catch (e) {
      alert('An error occurred during deletion.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSitterSignOutAllDevices = async () => {
    const email = sitterEmail || localStorage.getItem('lumo_sitter_email');
    if (email) {
      try {
        await fetch('/api/petsitting/auth/signout-all-devices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim() })
        });
      } catch (err) {
        console.error('[Sitter SignOut All Devices] failed:', err);
      }
    }
    localStorage.removeItem('lumo_sitter_email');
    localStorage.removeItem('lumo_sitter_email_expiry');
    if (typeof window !== 'undefined') {
      localStorage.clear();
      alert('You have been signed out of all devices for security.');
      window.location.href = '/';
    }
  };

  const handleSitterSignOut = () => {
    localStorage.removeItem('lumo_sitter_email');
    localStorage.removeItem('lumo_sitter_email_expiry');
    
    // Reset state
    setSitterId('');
    setSitterAuthMode('email');
    setSitterSignupIntent(null);
    setSitterAuthCode('');
    setSitterEmail('');
    setSitterFirstName('');
    setSitterLastName('');
    setSitterPhoto('');
    setSitterCoverPhoto('');
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
    setSitterRateType('night');
    setSitterRateDropins('');
    setSitterRateWalking('');
    setSitterRateOvernight('');
    setSitterRateBoarding('');
    setSitterRateDaycare('');
    setSitterPhone('');
    setSitterPhoneVisible(false);
    setSelfDeclared(false);
    setIsProSitter(false);
    setProfilePreviewMode(false);
    
    alert('Signed out successfully.');
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
    if (!sitterBio.trim()) errors['bio'] = 'Please add a short bio';
    if (!sitterId && !selfDeclared) errors['self_declared'] = 'You must confirm the self-declaration check before submitting.';
    
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
          cover_photo_url: sitterCoverPhoto,
          cover_photo_position: coverPhotoPosition,
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
          rate_type: sitterRateType,
          rate_dropins: sitterRateDropins,
          rate_walking: sitterRateWalking,
          rate_overnight: sitterRateOvernight,
          rate_boarding: sitterRateBoarding,
          rate_daycare: sitterRateDaycare,
          phone_number: sitterPhone,
          phone_visible: sitterPhoneVisible,
          availability: sitterAvailable,
          available_days: sitterAvailableDays,
          available_times: sitterAvailableTimes,
          service_types: sitterServiceTypes,
          gender: sitterGender,
          self_declared: sitterId ? true : selfDeclared
        })
      });

      if (res.ok) {
        const updatedData = await res.json();
        setSitterId(updatedData.id || '');
        setSitterApprovalStatus(updatedData.approval_status || 'pending');
        setNeedsReapproval(!!updatedData.needs_reapproval);
        
        const isPhotoOrIdNew = (sitterPhoto && sitterPhoto.startsWith('data:image/')) || (sitterIdPhoto && sitterIdPhoto.startsWith('data:image/'));
        if (!isPhotoOrIdNew && updatedData.approval_status === 'approved') {
          setProfileSuccessMessage('Your profile has been updated successfully!');
        } else {
          setProfileSuccessMessage('');
        }
        
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
    if (!sitterSubId) {
      alert("No active Stripe subscription was found for this account (Lifetime / Promo status). No cancellation is needed!");
      return;
    }
    if (!confirm("Are you sure you want to cancel your Lumo Bites Pro subscription? Your profile will remain active until the end of your billing cycle.")) {
      return;
    }
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
        alert('Subscription cancelled successfully. Your Pro access continues until the end of your billing cycle.');
      } else {
        setProfileMessage(data.error || 'Failed to cancel subscription.');
        alert(data.error || 'Failed to cancel subscription.');
      }
    } catch (e) {
      setProfileMessage('Error connecting to subscription service.');
      alert('Error connecting to subscription service.');
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
        // Verify mode
        const res = await fetch('/api/petsitting/auth/verify-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: unlockEmail, code: ownerAuthCode })
        });
        
        if (res.ok) {
          const data = await res.json();
          const sittersRes = await fetch(`/api/petsitting/sitters?owner_email=${encodeURIComponent(unlockEmail)}&t=${Date.now()}`);
          const sittersData = await sittersRes.json();
          
          setSitters(sittersData.sitters || []);
          setIsOwnerPro(true);
          setUnlockModalOpen(false);
          setOwnerAuthMode('email');
          setOwnerAuthCode('');
          localStorage.setItem('lumo_pro_email', unlockEmail);
          setReqEmail(unlockEmail);
          loadOwnerProfile(unlockEmail);

          if (data.existed) {
            alert('Welcome back! ✨');
          } else {
            alert('Account created! 🐾');
          }
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

  const handleSitterUseMyLocation = () => {
    if (navigator.geolocation) {
      setSitterIsLocating(true);
      setSitterLocationVerified(false);
      setSitterSelectedLocation(null);
      setSitterLocationOptions([]);
      setFormErrors(prev => { const newErr = {...prev}; delete newErr.location; return newErr; });
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          try {
            const res = await fetch(`/api/petsitting/geocode?latlng=${lat},${lng}`);
            const data = await res.json();
            if (res.ok && data.lat && data.lng) {
              const locationName = data.formatted_address || data.city || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
              setSitterLocationInput(locationName);
              setSitterCity(locationName);
              setSitterLocationVerified(true);
            }
          } catch (e) {
            console.error('Reverse geocoding error:', e);
          } finally {
            setSitterIsLocating(false);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          setSitterIsLocating(false);
          alert('Unable to get your location. Please enter your city manually.');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
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

  const executeBookingRequest = async () => {
    setReqLoading(true);
    setReqError('');
    setReqSuccess(false);

    try {
      const startFmt = reqStartDate ? new Date(reqStartDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
      const endFmt = reqEndDate ? new Date(reqEndDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
      const finalDates = startFmt && endFmt ? `${startFmt} → ${endFmt}` : '';

      const primaryPet = selectedRequestPets[0];
      const petAgeStr = (primaryPet?.age || '').trim();
      const finalNotes = petAgeStr
        ? `[Pet Age: ${petAgeStr}]${reqNotes ? ' ' + reqNotes : ''}` 
        : reqNotes;

      let rate = selectedSitter?.rate_per_night || 0;
      let unit = 'night';
      if (reqServiceType === 'Home visits') {
        rate = selectedSitter?.rate_dropins || selectedSitter?.rate_per_night || 0;
        unit = 'visit';
      } else if (reqServiceType === 'Dog walking') {
        rate = selectedSitter?.rate_walking || selectedSitter?.rate_per_night || 0;
        unit = 'walk';
      } else if (reqServiceType === 'Overnight stays') {
        rate = selectedSitter?.rate_overnight || selectedSitter?.rate_per_night || 0;
        unit = 'night';
      } else if (reqServiceType === 'Sitter\'s home boarding') {
        rate = selectedSitter?.rate_boarding || selectedSitter?.rate_per_night || 0;
        unit = 'night';
      } else if (reqServiceType === 'Full day sitting') {
        rate = selectedSitter?.rate_daycare || selectedSitter?.rate_per_night || 0;
        unit = 'day';
      }

      const numPets = selectedRequestPets.length;
      const totalCost = rate * numPets;

      const petDetailsPayload = primaryPet ? {
        ...primaryPet,
        pets: selectedRequestPets,
        booking_pricing: {
          service_type: reqServiceType,
          rate: rate,
          unit: unit,
          num_pets: numPets,
          total_cost: totalCost
        }
      } : null;

      const res = await fetch('/api/petsitting/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sitter_id: selectedSitter?.id,
          owner_email: reqEmail,
          owner_name: reqOwnerName,
          pet_name: selectedRequestPets.map(p => p.pet_name).join(', '),
          pet_type: primaryPet?.pet_type || 'dog',
          dates: finalDates,
          special_notes: `${reqServiceType ? `Service Requested: ${reqServiceType}\n\n` : ''}${finalNotes}`,
          phone_number: reqPhone || null,
          time_slot: reqTimeSlot,
          pet_id: primaryPet?.id || null,
          pet_details: petDetailsPayload
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
              pet_name: primaryPet?.pet_name,
              pet_type: primaryPet?.pet_type,
              pet_age: primaryPet?.age || '',
              phone_number: reqPhone || null,
              special_notes: reqNotes || null
            })
          });
          setHasSavedInfo(true);
        } catch (err) {
          console.error('Failed to save owner profile:', err);
        }

        setReqSuccess(true);
        setReqTimeSlot('');
        setSelectedRequestPet(null);
        setSelectedRequestPets([]);
        setTimeout(() => {
          setRequestModalOpen(false);
          setReqSuccess(false);
        }, 3000);
        if (reqEmail) {
          fetchOwnerRequests(reqEmail);
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

  const handleSendPhoneCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    console.log('[Phone Verification SMS] Starting handleSendPhoneCode...');
    setVerifyPhoneLoading(true);
    setVerifyPhoneError('');

    console.log('[Phone Verification SMS] Input verifyPhoneNum:', verifyPhoneNum);
    console.log('[Phone Verification SMS] Input verifyPhoneCountry:', verifyPhoneCountry);

    if (!verifyPhoneNum || verifyPhoneNum.trim() === '') {
      console.warn('[Phone Verification SMS] Empty phone number');
      setVerifyPhoneError('Please enter a valid phone number');
      setVerifyPhoneLoading(false);
      return;
    }

    try {
      // Clean phone number: remove non-digits
      let cleanPhone = verifyPhoneNum.replace(/\D/g, '');
      
      if (cleanPhone.startsWith('0')) {
        console.log('[Phone Verification SMS] Stripping leading zero from clean phone');
        cleanPhone = cleanPhone.substring(1);
      }
      
      const fullPhone = `${verifyPhoneCountry}${cleanPhone}`;
      console.log('[Phone Verification SMS] Formatted fullPhone:', fullPhone);

      console.log('[Phone Verification SMS] Calling Twilio send-code API...');
      const res = await fetch('/api/phone/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone })
      });
      
      if (!res.ok) {
        throw new Error('Failed to send SMS');
      }

      setVerifyConfirmationResult(true as any); // truthy value switches UI to code input
      console.log('[Phone Verification SMS] SMS code sent successfully!');
    } catch (err: any) {
      console.error('[Phone Verification SMS] Error during send-code:', err);
      setVerifyPhoneError(err.message || 'Failed to send verification code. Please check the number and try again.');
    } finally {
      setVerifyPhoneLoading(false);
    }
  };

  const handleVerifyPhoneCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    console.log('[Phone Verification Code] Starting handleVerifyPhoneCode...');
    setVerifyPhoneLoading(true);
    setVerifyPhoneError('');

    console.log('[Phone Verification Code] Input code:', verifyPhoneCode);

    if (!verifyPhoneCode || verifyPhoneCode.trim().length !== 6) {
      console.warn('[Phone Verification Code] Invalid code length');
      setVerifyPhoneError('Please enter a 6-digit verification code');
      setVerifyPhoneLoading(false);
      return;
    }

    try {
      if (!verifyConfirmationResult) {
        console.error('[Phone Verification Code] No verification session');
        throw new Error('No verification session found. Please request a new code.');
      }

      let cleanPhone = verifyPhoneNum.replace(/\D/g, '');
      if (cleanPhone.startsWith('0')) {
        cleanPhone = cleanPhone.substring(1);
      }
      const fullPhone = `${verifyPhoneCountry}${cleanPhone}`;
      console.log('[Phone Verification Code] Confirming code with Twilio API for fullPhone:', fullPhone);
      
      const email = reqEmail || (typeof window !== 'undefined' ? localStorage.getItem('lumo_pro_email') : null) || (typeof window !== 'undefined' ? localStorage.getItem('lumo_sitter_email') : null);

      const verifyRes = await fetch('/api/phone/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: fullPhone,
          code: verifyPhoneCode,
          email: email
        })
      });

      const verifyData = await verifyRes.json();
      console.log('[Phone Verification Code] Twilio verify response:', verifyData);

      if (!verifyData.success) {
        throw new Error(verifyData.error || 'Invalid verification code');
      }

      console.log('[Phone Verification Code] Verification complete! Executing booking request...');
      
      // Clean up verification state
      setShowPhoneVerification(false);
      setVerifyPhoneCode('');
      setVerifyConfirmationResult(null);
      
      // Trigger booking request execution
      await executeBookingRequest();

    } catch (err: any) {
      console.error('[Phone Verification Code] Error during code verification:', err);
      setVerifyPhoneError(err.message || 'Invalid or expired verification code. Please check and try again.');
    } finally {
      setVerifyPhoneLoading(false);
    }
  };

  const handleSendRequestClick = async (e: React.FormEvent) => {
    e.preventDefault();
    // Get email from any available source
    const email = reqEmail || (typeof window !== 'undefined' ? localStorage.getItem('lumo_pro_email') : null) || (typeof window !== 'undefined' ? localStorage.getItem('lumo_sitter_email') : null);
    
    if (!email) {
      alert('Please sign in first');
      return;
    }
    
    // Check phone verification directly from API
    try {
      const res = await fetch(`/api/stripe/status?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      console.log('Phone verification status:', data.phone_verified, 'for email:', email);
      
      if (!data.phone_verified) {
        // Show phone verification modal
        if (reqPhone) {
          setVerifyPhoneNum(formatPhoneNumber(reqPhone));
        }
        setShowPhoneVerification(true);
        return; // Stop here - don't submit yet
      }
    } catch (err) {
      console.error('Phone check error:', err);
    }
    
    // If phone verified - proceed with normal submission
    submitRequest(e);
  };

  const submitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setReqLoading(true);
    setReqError('');
    setReqSuccess(false);

    if (reqEmail && selectedSitter?.email && reqEmail.toLowerCase().trim() === selectedSitter.email.toLowerCase().trim()) {
      setReqError('You cannot request yourself as a sitter');
      setReqLoading(false);
      return;
    }

    if (selectedRequestPets.length === 0) {
      setReqError('Please select at least one pet or add a new one first');
      setReqLoading(false);
      return;
    }

    if (!reqStartDate || !reqEndDate) {
      setReqError('Please select your start and end dates from the availability calendar');
      setReqLoading(false);
      return;
    }

    try {
      if (reqStartDate && reqEndDate) {
        if (new Date(reqEndDate + 'T00:00:00') < new Date(reqStartDate + 'T00:00:00')) {
          setReqError('End date must be after start date');
          setReqLoading(false);
          return;
        }

        const rangeDates = getDatesBetween(reqStartDate, reqEndDate);
        const hasOverlap = rangeDates.some(d => {
          const dateObj = new Date(d + 'T00:00:00');
          const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dateObj.getDay()];
          const isScheduleUnavailable = sitterAvailableDays.length > 0 && !sitterAvailableDays.includes(dayName);
          return sitterBlockedDates.includes(d) || isDateFullyBooked(d, loadedSitterAvailableTimes) || isScheduleUnavailable;
        });
        if (hasOverlap) {
          setReqError('Selected date range overlaps with dates the sitter is unavailable or fully booked');
          setReqLoading(false);
          return;
        }

        if (reqTimeSlot) {
          const slotConflict = rangeDates.some(d => isSlotBooked(d, reqTimeSlot));
          if (slotConflict) {
            setReqError(`The ${reqTimeSlot} slot is already booked on one or more of the selected dates — please choose another slot or adjust your dates`);
            setReqLoading(false);
            return;
          }
        }
      }

      console.log('[submitRequest] Phone is verified, executing booking request...');
      await executeBookingRequest();

    } catch (err: any) {
      console.error('[submitRequest] Error in try block:', err);
      setReqError(err.message || 'An unexpected error occurred.');
      setReqLoading(false);
    }
  };

  let filteredSitters = sitters.filter(s => {
    if (searchPetType !== 'all' && s.pet_types !== 'both' && s.pet_types !== searchPetType) return false;
    if (searchTimeSlot) {
      const normalize = (slot: string) => {
        const lower = slot.toLowerCase();
        if (lower.includes('morning')) return 'morning';
        if (lower.includes('afternoon')) return 'afternoon';
        if (lower.includes('evening')) return 'evening';
        if (lower.includes('overnight')) return 'overnight';
        if (lower.includes('full day') || lower === 'flexible') return 'full day';
        return lower;
      };
      const wantedNorm = normalize(searchTimeSlot);
      const sitterTimes: string[] = s.available_times || [];
      const hasSlot = sitterTimes.some((t: string) => normalize(t) === wantedNorm);
      if (!hasSlot) return false;
    }
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
  const hasAnyRate = sitterRateDropins || sitterRateWalking || sitterRateOvernight || sitterRateBoarding || sitterRateDaycare;
  const isFormValid = sitterEmail.trim() && sitterFirstName.trim() && sitterLastName.trim() && sitterPhoto && (sitterIdPhoto || hasExistingIdPhoto) && sitterLocationInput.trim() && sitterLocationVerified && hasAnyRate && sitterBio.trim();

  // Auto-set isProSitter to true on load/save to bypass sitter paywall UI.
  useEffect(() => {
    setIsProSitter(true);
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFAF7] font-sans selection:bg-[#8B5E3C] selection:text-white flex flex-col relative">
      <Navbar />

      <div 
        className="flex-1 flex flex-col pt-24 pb-12 w-full relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ transform: `translateY(${pullDownY}px)`, transition: isPullingRef.current ? 'none' : 'transform 0.3s ease-out' }}
      >
        {/* Pull to refresh indicator */}
        {pullDownY > 0 && (
          <div className="absolute top-0 left-0 w-full flex justify-center pt-8 z-50">
            <div className="bg-white rounded-full shadow-md p-2.5 flex items-center justify-center border border-[#E8DDD4]">
              {isRefreshing ? (
                <span className="w-5 h-5 border-2 border-[#8B5E3C] border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <RefreshCw className="w-5 h-5 text-[#8B5E3C]" style={{ transform: `rotate(${pullDownY * 3}deg)` }} />
              )}
            </div>
          </div>
        )}

      {/* Toast updated indicator */}
      {showUpdatedToast && (
        <div className="fixed top-24 right-4 bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg z-50 flex items-center gap-1.5 animate-fade-in-up pointer-events-none">
          <Sparkles className="w-4 h-4 text-white" />
          <span>Bookings Updated in Real-time</span>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 py-8 md:py-12">
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
              Become a Pet Sitter
            </button>
          </div>
        </div>

        {/* FIND A SITTER TAB */}
        {activeTab === 'find' && (
          <div className="animate-fade-in">
            {/* Search Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-[#E8DDD4] mb-1 flex flex-col gap-4 relative">
              {/* Row 1: Location & Search Radius */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 flex gap-2">
                  <input
                    id="locationSearchInput"
                    type="text"
                    placeholder="City or Zip Code (e.g. Louisville or 40202)"
                    className="flex-grow bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]"
                    value={searchZip}
                    onChange={(e) => setSearchZip(e.target.value)}
                  />
                  <button
                    onClick={handleUseMyLocation}
                    type="button"
                    disabled={isDetectingLocation}
                    className={`bg-[#FAF6F4] hover:bg-[#E8DDD4] border border-[#E8DDD4] rounded-xl px-4 py-3 text-[#8B5E3C] font-semibold flex items-center gap-2 transition duration-200 shrink-0 shadow-sm ${
                      isDetectingLocation ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                    title="Use my current location"
                  >
                    {isDetectingLocation ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-[#8B5E3C]" />
                        <span className="hidden sm:inline">📍 Detecting location...</span>
                      </>
                    ) : (
                      <>
                        <span>📍</span>
                        <span className="hidden sm:inline">Use My Location</span>
                      </>
                    )}
                  </button>
                </div>
                <select
                  className="bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C] md:w-64 shrink-0"
                  value={searchRadius}
                  onChange={(e) => setSearchRadius(e.target.value)}
                >
                  <option value="10">Within 10 miles</option>
                  <option value="25">Within 25 miles</option>
                  <option value="50">Within 50 miles</option>
                  <option value="100">Within 100 miles</option>
                </select>
              </div>

              {/* Row 2: Detailed Filters in Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <select
                  className="bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C] w-full"
                  value={searchPetType}
                  onChange={(e) => setSearchPetType(e.target.value)}
                >
                  <option value="all">All Pets</option>
                  <option value="dog">Dogs Only</option>
                  <option value="cat">Cats Only</option>
                </select>
                <select
                  className="bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C] w-full"
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
                  className="bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C] w-full"
                  value={searchTimeSlot}
                  onChange={(e) => setSearchTimeSlot(e.target.value)}
                >
                  <option value="">All Time Slots</option>
                  <option value="Morning (8am - 12pm)">Morning (8am - 12pm)</option>
                  <option value="Afternoon (12pm - 5pm)">Afternoon (12pm - 5pm)</option>
                  <option value="Evening (5pm - 9pm)">Evening (5pm - 9pm)</option>
                  <option value="Full Day (8am - 9pm)">Full Day (8am - 9pm)</option>
                  <option value="Overnight (9pm - 8am)">Overnight (9pm - 8am)</option>
                </select>
                <select
                  className="bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C] w-full"
                  value={searchServiceType}
                  onChange={(e) => { setSearchServiceType(e.target.value); fetchSitters(undefined, undefined, e.target.value); }}
                >
                  <option value="all">Any Service</option>
                  <option value="Home visits">Home visits</option>
                  <option value="Overnight stays">Overnight stays</option>
                  <option value="Dog walking">Dog walking</option>
                  <option value="Sitter's home boarding">Sitter's home boarding</option>
                </select>
              </div>
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
                  <span className="text-red-600 text-sm font-semibold flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-red-600" /> {searchLocationError}
                  </span>
                ) : searchLocationName ? (
                  <span className="text-green-700 text-sm font-semibold flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-green-700" /> {searchLocationName}
                  </span>
                ) : null}
              </div>
            )}

            {/* Premium PRO Upgrade Banner */}
            {!isOwnerPro && (
              <div className="bg-[#FAF6F4] border border-[#E8DDD4] rounded-2xl p-6 mb-6 flex flex-col md:flex-row items-center justify-between gap-5 animate-fade-in shadow-xs">
                <div className="text-left flex items-start gap-4">
                  <Crown className="w-8 h-8 text-[#8B5E3C] flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-lg font-extrabold text-[#4A3E3D] tracking-tight">
                      Create a Free Account
                    </h4>
                    <p className="text-sm text-[#8B7E7D] mt-1 leading-relaxed max-w-xl">
                      Unlock full sitter bios, direct messaging, food safety scans, and instant recall alerts.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setUnlockModalOpen(true)}
                  className="bg-[#8B5E3C] hover:bg-[#734A2E] text-white font-bold py-3 px-6 rounded-xl transition-all shadow-xs text-sm whitespace-nowrap cursor-pointer"
                >
                  Create Free Account
                </button>
              </div>
            )}

            {/* Sitters & Map Layout */}
            {loadingSitters || isGeocoding ? (
              <div className="text-center bg-white p-16 rounded-3xl border border-[#E8DDD4] shadow-sm flex flex-col items-center justify-center min-h-[300px]">
                <div className="relative w-16 h-16 mb-4">
                  <div className="absolute inset-0 rounded-full border-4 border-[#8B5E3C]/20"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#8B5E3C] animate-spin"></div>
                </div>
                <h3 className="text-xl font-bold text-[#4A3E3D] mb-1">Finding sitters near you...</h3>
                <p className="text-[#8B7E7D] text-sm">Searching our network of local, loving sitters...</p>
              </div>
            ) : (!searchZip.trim() || !searchCoords) ? (
              <div className="text-center bg-white p-12 rounded-3xl border border-[#E8DDD4] animate-fade-in shadow-sm">
                <div className="w-16 h-16 bg-[#FAF6F4] rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-[#E8DDD4]">
                  <MapPin className="w-8 h-8 text-[#8B5E3C]" />
                </div>
                <h3 className="text-2xl font-black text-[#4A3E3D] mb-2">Enter your city to find trusted pet sitters near you</h3>
                <p className="text-[#8B7E7D] max-w-md mx-auto">
                  Type your city or zip code in the search bar above to see our network of local, loving sitters ready to help.
                </p>
              </div>
            ) : filteredSitters.length === 0 ? (
              <div className="text-center bg-white p-12 rounded-3xl border border-[#E8DDD4]">
                <Footprints className="w-10 h-10 text-[#8B5E3C] mx-auto mb-4" />
                <h3 className="text-xl font-bold text-[#4A3E3D] mb-2">No sitters found in your area yet.</h3>
                <p className="text-[#8B7E7D] mb-4">Try expanding your search distance.</p>
                <button 
                  onClick={() => setActiveTab('become')}
                  className="text-[#8B5E3C] font-bold hover:text-[#7A5234] flex items-center justify-center gap-1 mx-auto"
                >
                  Join free as an early sitter &rarr;
                </button>
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Sitters List (Left on desktop, Below on mobile) */}
                <div className="flex-1 order-2 lg:order-1">
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
                        <div className="flex flex-col gap-4 mb-4">
                          {sitter.photo_url ? (
                            <img src={sitter.photo_url} alt={formatSitterName(sitter.name)} className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-3 border-[#FAF6F4] flex-shrink-0 shadow-md pointer-events-none" />
                          ) : (
                            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-[#E8DDD4] flex items-center justify-center text-[#8B5E3C] font-bold text-4xl flex-shrink-0">
                              {formatSitterName(sitter.name).charAt(0)}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                             <div className="flex items-center gap-2 flex-wrap mb-0.5">
                               <h3 className="text-xl font-bold text-[#4A3E3D]">{formatSitterName(sitter.name)}</h3>
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
                                   <Footprints className="w-3.5 h-3.5 inline mr-1" /> {sitter.completed_bookings} {sitter.completed_bookings === 1 ? 'booking' : 'bookings'} completed
                                 </div>
                               ) : null}
                             </div>
                             {isOwnerPro && (
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
                             )}
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
                          <div className="flex flex-col items-end gap-1 text-sm font-bold text-[#4A3E3D]">
                            {sitter.rate_dropins && <div>Drop-in ${sitter.rate_dropins}<span className="text-[#8B7E7D] text-xs font-medium">/visit</span></div>}
                            {sitter.rate_walking && <div>Walking ${sitter.rate_walking}<span className="text-[#8B7E7D] text-xs font-medium">/walk</span></div>}
                            {sitter.rate_overnight && <div>Overnight ${sitter.rate_overnight}<span className="text-[#8B7E7D] text-xs font-medium">/night</span></div>}
                            {sitter.rate_boarding && <div>Boarding ${sitter.rate_boarding}<span className="text-[#8B7E7D] text-xs font-medium">/night</span></div>}
                            {sitter.rate_daycare && <div>Daycare ${sitter.rate_daycare}<span className="text-[#8B7E7D] text-xs font-medium">/day</span></div>}
                            {!sitter.rate_dropins && !sitter.rate_walking && !sitter.rate_overnight && !sitter.rate_boarding && !sitter.rate_daycare && (
                              <div className="text-lg">
                                {(sitter.service_types?.length || 0) > 1 ? <><span className="text-sm font-medium text-[#8B7E7D] mr-1">From</span>${sitter.rate_per_night}</> : <>${sitter.rate_per_night}<span className="text-sm font-medium text-[#8B7E7D]">/{sitter.rate_type || 'night'}</span></>}
                              </div>
                            )}
                          </div>
                        </div>

                        {(!reqEmail || !sitter.email || reqEmail.toLowerCase().trim() !== sitter.email.toLowerCase().trim()) && (
                          <div className="mt-3 flex flex-col gap-2">
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
                              <span>{isOwnerPro ? 'Request Sitter' : 'Create Free Account'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Map (Right on desktop, Above on mobile) */}
                <div className="w-full lg:w-[45%] lg:sticky lg:top-24 h-[300px] lg:h-[calc(100vh-140px)] order-1 lg:order-2 rounded-3xl overflow-hidden shadow-sm border border-[#E8DDD4] relative z-0" style={{ zIndex: 0 }}>
                  <SitterMap 
                    sitters={filteredSitters}
                    searchCoords={searchCoords}
                    searchRadius={searchRadius}
                    onSelectSitter={handleSelectSitterFromMap}
                    highlightedSitterId={highlightedSitterId}
                  />
                </div>
              </div>
            )}
            {/* Owner Booking History Section */}
            {isOwnerPro && (
              <div id="owner-history" className="mt-12 bg-white rounded-3xl p-8 border border-[#E8DDD4] shadow-sm max-w-4xl mx-auto text-left">
              <div id="messages" />
              <div className="mb-6">
                <h3 className="text-2xl font-black text-[#4A3E3D] flex items-center gap-2">
                  <Clipboard className="w-6 h-6 text-[#8B5E3C]" /> Owner Dashboard
                </h3>
              </div>
              <div className="space-y-6">
                  {/* Tabs Navigation */}
                  <div className="flex gap-6 border-b border-[#E8DDD4]">
                    <button 
                      onClick={() => setOwnerActiveTab('bookings')} 
                      className={`pb-3 font-bold text-sm transition-colors border-b-2 flex items-center gap-2 ${ownerActiveTab === 'bookings' ? 'border-[#8B5E3C] text-[#8B5E3C]' : 'border-transparent text-[#8B7E7D] hover:text-[#4A3E3D]'}`}
                    >
                      📅 My Bookings
                    </button>
                    <button 
                      onClick={() => setOwnerActiveTab('pets')} 
                      className={`pb-3 font-bold text-sm transition-colors border-b-2 flex items-center gap-2 ${ownerActiveTab === 'pets' ? 'border-[#8B5E3C] text-[#8B5E3C]' : 'border-transparent text-[#8B7E7D] hover:text-[#4A3E3D]'}`}
                    >
                      🐾 My Pets
                    </button>
                  </div>
                  
                  {ownerActiveTab === 'pets' && (
                  <div className="pb-8 animate-fade-in">
                    <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
                      <div>
                        <h4 className="text-lg font-black text-[#4A3E3D] flex items-center gap-2">
                          <PawPrint className="w-5 h-5 text-[#8B5E3C]" /> My Pets
                        </h4>
                        <p className="text-xs text-[#8B7E7D] mt-0.5">
                          Manage your pets' profiles to automatically share their care details with sitters.
                        </p>
                      </div>
                      <button
                        onClick={() => openPetModal()}
                        className="bg-[#8B5E3C] hover:bg-[#7A5234] text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer border-none"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add a Pet
                      </button>
                    </div>

                    {loadingOwnerPets && ownerPets.length === 0 ? (
                      <div className="text-center py-12 flex flex-col items-center justify-center gap-3 bg-[#FAF6F4] rounded-2xl border border-dashed border-[#E8DDD4]">
                        <div className="w-8 h-8 border-4 border-[#8B5E3C] border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-xs text-[#8B7E7D]">Loading pet profiles...</p>
                      </div>
                    ) : ownerPets.length === 0 ? (
                      <div className="text-center py-8 text-[#8B7E7D] bg-[#FAF6F4] rounded-2xl border border-dashed border-[#E8DDD4] flex flex-col items-center gap-2">
                        <PawPrint className="w-8 h-8 text-[#8B5E3C] opacity-60" />
                        <p className="text-sm font-semibold text-[#4A3E3D]">No pets added yet</p>
                        <p className="text-xs max-w-xs leading-relaxed px-4">Add your pet's details (breed, feeding, medications) to make booking sitters quick and easy.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {ownerPets.map((pet) => (
                          <div key={pet.id} className="bg-white border border-[#E8DDD4] rounded-2xl p-4 flex gap-4 shadow-sm relative group hover:border-[#8B5E3C] transition-all">
                            {/* Pet Photo / Icon */}
                            <PetPhotoCarousel photoUrls={pet.photo_urls} petType={pet.pet_type} className="w-20 h-20 rounded-xl" />

                            {/* Pet Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h5 className="font-bold text-sm text-[#4A3E3D] truncate">{pet.pet_name}</h5>
                                <span className="text-[10px] bg-[#FAF6F4] text-[#8B5E3C] px-2 py-0.5 rounded-full font-bold border border-[#E8DDD4] uppercase tracking-wide">
                                  {pet.pet_type}
                                </span>
                              </div>
                              <p className="text-xs text-[#8B7E7D] truncate mb-2">
                                {pet.breed && `${pet.breed}`}
                                {pet.gender && ` • ${pet.gender}`}
                                {pet.age && ` • ${pet.age}`}
                                {pet.weight && ` • ${pet.weight}`}
                              </p>

                              {/* Badges/Highlights */}
                              <div className="flex flex-wrap gap-1.5 mb-2">
                                {pet.spayed_neutered && (
                                  <span className="text-[9px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded font-semibold border border-green-200">Spayed/Neutered</span>
                                )}
                                {pet.feeding_schedule && (
                                  <span className="text-[9px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-semibold border border-amber-200 truncate max-w-[120px]" title={`Feeding: ${pet.feeding_schedule}`}>🥣 Feed Schedule</span>
                                )}
                                {pet.medication && (
                                  <span className="text-[9px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded font-semibold border border-red-200 truncate max-w-[120px]" title={`Medications: ${pet.medication}`}>💊 Meds</span>
                                )}
                              </div>

                              {/* Vet details */}
                              {(pet.vet_name || pet.vet_phone) && (
                                <div className="text-[10px] text-[#8B7E7D] bg-[#FAF6F4] px-2.5 py-1 rounded-lg border border-[#E8DDD4] mb-1">
                                  🏥 Vet: {pet.vet_name || 'N/A'} {pet.vet_phone && `(${pet.vet_phone})`}
                                </div>
                              )}

                              {/* Action buttons */}
                              <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-[#FAF6F4]">
                                <button
                                  onClick={() => openPetModal(pet)}
                                  className="text-[11px] font-bold text-[#8B5E3C] hover:underline cursor-pointer border-none bg-none"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeletePet(pet.id)}
                                  className="text-[11px] font-bold text-red-600 hover:underline cursor-pointer border-none bg-none"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  )}

                  {ownerActiveTab === 'bookings' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-black text-[#4A3E3D] flex items-center gap-2">
                        📅 My Bookings
                      </h4>
                      <select
                        value={historyFilter}
                        onChange={(e) => setHistoryFilter(e.target.value)}
                        className="bg-white border-2 border-[#E8DDD4] text-[#8B5E3C] text-sm font-bold rounded-xl px-4 py-2 focus:outline-none focus:border-[#8B5E3C] shadow-sm appearance-none outline-none cursor-pointer"
                      >
                        <option value="all">All Bookings</option>
                        <option value="pending">Pending</option>
                        <option value="accepted">Accepted</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="declined">Declined</option>
                      </select>
                    </div>
                  {!ownerHistoryFetched && ownerRequests.length === 0 ? (
                    <div className="text-center py-12 flex flex-col items-center justify-center gap-3 bg-[#FAF6F4] rounded-2xl border border-dashed border-[#E8DDD4]">
                      <div className="w-8 h-8 border-4 border-[#8B5E3C] border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-xs text-[#8B7E7D]">Loading bookings...</p>
                    </div>
                  ) : ownerRequests.filter(req => historyFilter === 'all' || req.status === historyFilter).length === 0 ? (
                    <div className="text-center py-6 text-gray-500 bg-[#FAF6F4] rounded-2xl border border-dashed border-[#E8DDD4]">
                      {historyFilter === 'all' ? 'No bookings found for this email address.' : `No ${historyFilter} bookings found.`}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {ownerRequests
                        .filter(req => historyFilter === 'all' || req.status === historyFilter)
                        .map((req) => {
                        const sitterDisplayName = formatSitterName(req.sitters?.name || req.sitter_name);
                        const endDate = getBookingEndDate(req.dates);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const isAfterEndDate = endDate ? today > endDate : false;

                        const statusBadge = (() => {
                          switch (req.status) {
                            case 'accepted':  return <span className="bg-green-100 text-green-700 font-bold text-xs px-2.5 py-1 rounded-full border border-green-200 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500 shrink-0" /> Accepted</span>;
                            case 'completed': return <span className="bg-blue-100 text-blue-700 font-bold text-xs px-2.5 py-1 rounded-full border border-blue-200 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" /> Completed</span>;
                            case 'declined':  return <span className="bg-red-100 text-red-700 font-bold text-xs px-2.5 py-1 rounded-full border border-red-200 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500 shrink-0" /> Declined</span>;
                            case 'cancelled': return <span className="bg-gray-100 text-gray-700 font-bold text-xs px-2.5 py-1 rounded-full border border-gray-200 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-400 shrink-0" /> Cancelled</span>;
                            case 'no_show':   return <span className="bg-orange-100 text-orange-700 font-bold text-xs px-2.5 py-1 rounded-full border border-orange-200 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" /> No Show</span>;
                            default:          return <span className="bg-yellow-100 text-yellow-700 font-bold text-xs px-2.5 py-1 rounded-full border border-yellow-200 animate-pulse flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-500 shrink-0" /> Pending</span>;
                          }
                        })();

                        const actionButtons = (() => {
                          if (['completed', 'declined', 'cancelled', 'no_show'].includes(req.status)) {
                            return (
                              <button onClick={() => handleRequestAgain(req)} className="w-full sm:w-auto bg-[#8B5E3C] hover:bg-[#7A5234] text-white text-xs font-bold py-2.5 px-4 rounded-lg transition-colors cursor-pointer">
                                Request Again
                              </button>
                            );
                          }
                          if (req.status === 'accepted' && isAfterEndDate) {
                            return (
                              <div className="flex flex-col sm:flex-row gap-2 w-full">
                                <button onClick={() => handleConfirmCompletedByOwner(req)} className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2.5 px-4 rounded-lg transition-colors cursor-pointer">Confirm Completed</button>
                                <button onClick={() => handleReportNoShow(req)} className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2.5 px-4 rounded-lg transition-colors cursor-pointer">Report No Show</button>
                              </div>
                            );
                          }
                          return (
                            <div className="flex flex-col sm:flex-row gap-2 w-full">
                              <button onClick={() => handleViewBooking(req)} className="w-full sm:w-auto bg-[#FAF6F4] hover:bg-[#E8DDD4] text-[#4A3E3D] border border-[#E8DDD4] text-xs font-bold py-2.5 px-4 rounded-lg transition-colors cursor-pointer">View Booking</button>
                              {!isAfterEndDate && (
                                <button onClick={() => handleCancelRequestByOwner(req.id)} className="w-full sm:w-auto bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold py-2.5 px-4 rounded-lg transition-colors cursor-pointer">Cancel Request</button>
                              )}
                            </div>
                          );
                        })();

                        return (
                          <div key={req.id} className="bg-white border border-[#E8DDD4] rounded-2xl overflow-hidden shadow-sm">
                            {/* Header: booking number + status */}
                            <div className="flex items-center justify-between px-4 py-3 bg-[#FAF6F4] border-b border-[#E8DDD4]">
                              <span className="text-xs font-bold text-[#4A3E3D]">{req.booking_number || `Booking #${req.id.substring(0, 8)}`}</span>
                              {statusBadge}
                            </div>

                            {/* Body: 2-col on mobile, 4-col on sm+ */}
                            <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                              <div>
                                <p className="text-[10px] font-bold text-[#8B7E7D] uppercase tracking-wider mb-1">Sitter</p>
                                <div className="flex items-center gap-2">
                                  {req.sitters?.photo_url || req.sitter_photo_url ? (
                                    <img src={req.sitters?.photo_url || req.sitter_photo_url} alt={sitterDisplayName} className="w-7 h-7 rounded-full object-cover border border-[#E8DDD4] flex-shrink-0 pointer-events-none" />
                                  ) : (
                                    <div className="w-7 h-7 rounded-full bg-[#E8DDD4] flex items-center justify-center text-[#8B5E3C] font-bold text-xs flex-shrink-0">{sitterDisplayName.charAt(0)}</div>
                                  )}
                                  <span className="font-bold text-[#4A3E3D] text-sm leading-tight">{sitterDisplayName}</span>
                                </div>
                              </div>

                              <div>
                                <p className="text-[10px] font-bold text-[#8B7E7D] uppercase tracking-wider mb-1">Pet</p>
                                <div className="flex items-center gap-1.5">
                                  <PawPrint className="w-4 h-4 text-[#8B5E3C] shrink-0" />
                                  <span className="font-semibold text-[#4A3E3D] text-xs sm:text-sm truncate max-w-full" title={req.pet_name}>
                                    {req.pet_details?.pets && req.pet_details.pets.length > 1 
                                      ? `🐾 ${req.pet_details.pets.length} pets: ${req.pet_details.pets.map((p: any) => p.pet_name).join(' & ')}`
                                      : req.pet_name
                                    }
                                  </span>
                                </div>
                              </div>

                              <div>
                                <p className="text-[10px] font-bold text-[#8B7E7D] uppercase tracking-wider mb-1">Dates</p>
                                <p className="text-[#4A3E3D] font-medium text-xs leading-snug">{req.dates}</p>
                                {req.time_slot && (
                                  <span className="text-[10px] font-bold text-[#8B5E3C] bg-[#FAF6F4] border border-[#E8DDD4] px-1.5 py-0.5 rounded uppercase mt-1 inline-flex items-center gap-1"><Clock className="w-3 h-3 text-[#8B5E3C]" /> {req.time_slot}</span>
                                )}
                              </div>

                              <div className="col-span-2 sm:col-span-1 flex items-center">
                                {actionButtons}
                              </div>
                            </div>

                            {req.pet_details?.booking_pricing && (
                              <div className="px-4 pb-3 text-[11px] text-[#8B7E7D] flex justify-between items-center border-t border-gray-50 pt-2.5">
                                <span className="font-medium">Estimated Pricing:</span>
                                <span className="font-bold text-[#4A3E3D]">
                                  ${req.pet_details.booking_pricing.total_cost} 
                                  <span className="text-[#8B7E7D] font-normal text-[10px] ml-1.5">
                                    (${req.pet_details.booking_pricing.rate}/{req.pet_details.booking_pricing.unit} × {req.pet_details.booking_pricing.num_pets} {req.pet_details.booking_pricing.num_pets === 1 ? 'pet' : 'pets'})
                                  </span>
                                </span>
                              </div>
                            )}

                            {/* Message Sitter CTA — full width, only on accepted */}
                            {req.status === 'accepted' && (
                              <div className="px-4 pb-4">
                                <button
                                  onClick={() => { setActiveChatBooking(req); setActiveChatRole('owner'); setChatModalOpen(true); }}
                                  className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-3 px-4 rounded-xl text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
                                >
                                  <MessageSquare className="w-4 h-4 text-white" /> Message Sitter
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  </div>
                  )}
                </div>
              </div>
            )}
            </div>
          )}
        {/* BECOME A SITTER TAB */}
        {activeTab === 'become' && (
          <div className="max-w-2xl mx-auto bg-white rounded-3xl p-8 border border-[#E8DDD4] shadow-sm animate-fade-in">
            {/* Back Button */}
            <div className="mb-6 flex justify-start">
              <button 
                onClick={() => {
                  setActiveTab('find');
                  setProfilePreviewMode(true);
                }} 
                className="flex items-center gap-1.5 text-[#8B5E3C] hover:text-[#7A5234] font-bold text-sm transition-colors cursor-pointer"
              >
                &larr; Back to Find a Sitter
              </button>
            </div>
            {profilePreviewMode ? (
              <div className="animate-fade-in text-center">
                {profileSuccessMessage && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 mb-6 text-sm font-semibold animate-fade-in max-w-sm mx-auto">
                    ✨ {profileSuccessMessage}
                  </div>
                )}
                {sitterApprovalStatus === 'pending' && (
                  <>
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-yellow-100 text-yellow-600">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    {needsReapproval ? (
                      <>
                        <h2 className="text-3xl font-black text-[#4A3E3D] mb-2">Verification Under Review</h2>
                        <p className="text-[#8B7E7D] mb-8 max-w-md mx-auto">
                          Your updated verification has been submitted for review. Your profile remains active while we review.
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
                          onClick={handleShareInvite}
                          className="bg-[#8B5E3C] hover:bg-[#7A5234] text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          <Share2 className="w-4 h-4" /> Share Invite
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
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isProSitter ? (sitterAvailable ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600') : 'bg-red-100 text-red-600'}`}>
                      {isProSitter ? (
                        sitterAvailable ? (
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        ) : (
                          <span className="text-3xl">⏸️</span>
                        )
                      ) : (
                        <AlertTriangle className="w-8 h-8 text-red-600" />
                      )}
                    </div>
                    <h2 className="text-3xl font-black text-[#4A3E3D] mb-2">
                      {isProSitter ? (sitterAvailable ? 'Sitter Profile Active' : 'Profile Hidden') : 'Subscription Inactive'}
                    </h2>
                    <p className="text-[#8B7E7D] mb-8 max-w-md mx-auto">
                      {isProSitter ? (sitterAvailable ? 'Your profile is approved and visible to pet owners in your neighborhood.' : 'You are not currently accepting requests. Your profile is temporarily hidden from search results.') : 'Your subscription is inactive. Your profile is hidden from search results.'}
                    </p>
                  </>
                )}
                
                {/* Profile Preview Card */}
                <div className="bg-[#FAF6F4] border border-[#E8DDD4] rounded-2xl text-left mb-8 shadow-sm max-w-lg mx-auto overflow-hidden">
                   {/* Cover Banner */}
                  <div className="h-40 w-full relative bg-[#E8DDD4] overflow-hidden shrink-0">
                    {sitterCoverPhoto ? (
                      <img
                        src={sitterCoverPhoto}
                        alt="Cover banner"
                        className="w-full h-full pointer-events-none"
                        style={{ objectFit: 'cover', objectPosition: coverPhotoPosition }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-[#FAF6F4] to-[#E8DDD4]" />
                    )}
                    {/* Status badge in top-right */}
                    <div className="absolute top-3 right-3 bg-black/30 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">{sitterApprovalStatus}</div>
                  </div>

                  {/* Profile photo + name row */}
                  <div className="px-4 pb-0">
                    {/* Profile photo overlapping banner */}
                    <div className="relative -mt-14 mb-2 flex items-end gap-3">
                      {sitterPhoto ? (
                        <img src={sitterPhoto} alt={sitterName} className="w-28 h-28 rounded-full object-cover shadow-md border-4 border-[#FAF6F4] flex-shrink-0 pointer-events-none" />
                      ) : (
                        <div className="w-28 h-28 rounded-full bg-[#E8DDD4] flex items-center justify-center text-4xl font-bold text-[#8B7E7D] flex-shrink-0 border-4 border-[#FAF6F4] shadow-md">
                          {sitterName.charAt(0) || '?'}
                        </div>
                      )}
                    </div>

                    {/* Name, bookings badge, location */}
                    <div className="mb-3">
                      <h3 className="font-black text-xl text-[#4A3E3D] leading-tight break-words">{sitterName || 'New Sitter'}</h3>
                      {completedBookings > 0 && (
                        <div className="inline-flex items-center gap-1 bg-[#8B5E3C]/10 text-[#8B5E3C] text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 border border-[#8B5E3C]/20">
                          <Footprints className="w-3 h-3 shrink-0" /> {completedBookings} {completedBookings === 1 ? 'booking' : 'bookings'} completed
                        </div>
                      )}
                      <p className="text-[#8B7E7D] text-xs flex items-center gap-1 mt-1.5">
                        <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/></svg>
                        <span className="break-words">{sitterCity || sitterLocationInput || 'Location'}</span>
                      </p>
                    </div>

                    {/* Bio */}
                    <p className="text-[#555555] text-sm mb-4 line-clamp-3 leading-relaxed">{sitterBio || 'Your bio will appear here...'}</p>

                    {/* Pet type + rates */}
                    <div className="flex flex-wrap items-start justify-between gap-y-2 pb-4 border-t border-[#E8DDD4] pt-3">
                      <div className="text-xs font-bold text-[#8B5E3C] bg-white px-2.5 py-1 rounded-lg border border-[#E8DDD4] self-start">
                        {sitterPetTypes === 'both' ? 'Dogs & Cats' : sitterPetTypes === 'dog' ? 'Dogs Only' : 'Cats Only'}
                      </div>
                      <div className="flex flex-col items-end gap-0.5 text-xs font-bold text-[#4A3E3D]">
                        {sitterRateDropins && <div>Drop-in ${sitterRateDropins}<span className="text-[#8B7E7D] font-medium">/visit</span></div>}
                        {sitterRateWalking && <div>Walking ${sitterRateWalking}<span className="text-[#8B7E7D] font-medium">/walk</span></div>}
                        {sitterRateOvernight && <div>Overnight ${sitterRateOvernight}<span className="text-[#8B7E7D] font-medium">/night</span></div>}
                        {sitterRateBoarding && <div>Boarding ${sitterRateBoarding}<span className="text-[#8B7E7D] font-medium">/night</span></div>}
                        {sitterRateDaycare && <div>Daycare ${sitterRateDaycare}<span className="text-[#8B7E7D] font-medium">/day</span></div>}
                        {!sitterRateDropins && !sitterRateWalking && !sitterRateOvernight && !sitterRateBoarding && !sitterRateDaycare && (
                          <div className="text-base">
                            {sitterServiceTypes.length > 1 ? <><span className="text-xs font-medium text-[#8B7E7D] mr-1">From</span>${sitterRate || '0'}</> : <>${sitterRate || '0'}<span className="text-xs font-medium text-[#8B7E7D]">/{sitterRateType || 'night'}</span></>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>


                {profileMessage && <div className="text-red-600 text-sm font-bold mb-4">{profileMessage}</div>}

                <div className="flex flex-col gap-3 max-w-lg mx-auto">
                  <button onClick={() => { setProfilePreviewMode(false); setProfileSuccessMessage(''); }} className="w-full bg-[#FAF6F4] border border-[#E8DDD4] hover:bg-[#E8DDD4] text-[#4A3E3D] font-bold py-4 rounded-xl transition-all shadow-sm">
                    Edit Profile
                  </button>
                  

                  {sitterApprovalStatus !== 'pending' && (
                    <div className="bg-[#FAF6F4] border border-[#E8DDD4] rounded-3xl p-6 mt-8 max-w-lg mx-auto text-left shadow-sm">
                      <h4 className="text-base font-black text-[#4A3E3D] mb-2 flex items-center gap-2">
                        <Footprints className="w-4 h-4 text-[#8B5E3C]" /> Invite a Friend
                      </h4>
                      <p className="text-xs text-[#8B7E7D] mb-4">Know someone who'd make a great pet sitter? Invite them to join Lumo Bites!</p>
                      
                      <div className="grid grid-cols-1 gap-2">
                        <button
                          type="button"
                          onClick={handleShareInvite}
                          className="bg-[#8B5E3C] hover:bg-[#7A5234] text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          <Share2 className="w-4 h-4" /> Share Invite
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
                    <Calendar className="w-5 h-5 text-[#8B5E3C] shrink-0" /> Manage Your Availability
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

                        const SLOT_ABBRS = [
                          { key: 'Morning (8am - 12pm)',    abbr: 'M' },
                          { key: 'Afternoon (12pm - 5pm)', abbr: 'A' },
                          { key: 'Evening (5pm - 9pm)',     abbr: 'E' },
                          { key: 'Full Day (8am - 9pm)',    abbr: 'F' },
                          { key: 'Overnight (9pm - 8am)',   abbr: 'O' },
                        ];

                        const cells = [];
                        for (let i = 0; i < firstDay; i++) {
                          cells.push(<div key={`empty-${i}`} className="aspect-square" />);
                        }

                        for (let d = 1; d <= totalDays; d++) {
                          const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                          const isBlocked = sitterBlockedDates.includes(dateStr);
                          const isPast = dateStr < todayStr;

                          const dayOfWeek = new Date(calYear, calMonth, d).getDay();
                          const dayOfWeekName = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][dayOfWeek];
                          const isScheduleUnavailable = sitterAvailableDays.length > 0 && !sitterAvailableDays.includes(dayOfWeekName);

                          const activeSlots = getSitterActiveSlots(sitterAvailableTimes);
                          const fullyBooked = !isBlocked && isDateFullyBooked(dateStr, sitterAvailableTimes);

                          let bgClass = "bg-emerald-50 text-emerald-950 hover:bg-emerald-100 border border-emerald-200 cursor-pointer font-bold";
                          if (isPast) {
                            bgClass = "bg-gray-50 text-gray-300 border border-gray-100 cursor-not-allowed";
                          } else if (isBlocked) {
                            bgClass = "bg-amber-100 text-amber-950 border border-amber-300 hover:bg-amber-200 cursor-pointer font-bold";
                          } else if (isScheduleUnavailable) {
                            bgClass = "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed font-medium";
                          } else if (fullyBooked) {
                            bgClass = "bg-rose-100 text-rose-950 border border-rose-300 cursor-not-allowed font-bold";
                          }

                          // Build dot indicators for active slots
                          const dots = activeSlots.length > 0 && !isPast && !isBlocked && !isScheduleUnavailable
                            ? SLOT_ABBRS.filter(s => activeSlots.includes(s.key)).map(s => {
                                const slotBooked = isSlotBooked(dateStr, s.key);
                                return (
                                  <span
                                    key={s.key}
                                    title={`${s.key}: ${slotBooked ? 'Booked' : 'Available'}`}
                                    className={`inline-block rounded-full ${slotBooked ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                    style={{ width: '5px', height: '5px' }}
                                  />
                                );
                              })
                            : null;

                          cells.push(
                            <button
                              key={`day-${d}`}
                              type="button"
                              disabled={isPast || fullyBooked || isScheduleUnavailable}
                              onClick={() => { handleSitterBlockedDateToggle(dateStr); }}
                              className={`aspect-square rounded-xl flex flex-col items-center justify-center text-xs transition-all font-semibold ${bgClass}`}
                            >
                              <span>{d}</span>
                              {dots && dots.length > 0 && (
                                <div className="flex gap-[2px] mt-0.5 flex-wrap justify-center">
                                  {dots}
                                </div>
                              )}
                            </button>
                          );
                        }
                        return cells;
                      })()}
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 mt-4 pt-4 border-t border-[#E8DDD4] text-xs font-bold text-[#4A3E3D]">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-emerald-500 inline-block shadow-sm" /> Available
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-amber-500 inline-block shadow-sm" /> Blocked
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-rose-500 inline-block shadow-sm" /> Slot Booked
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-[#8B7E7D] font-normal">
                        Dots = M A E F O slots
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sitter Booking Tracker Section */}
                <div id="sitter-dashboard" className="border-t border-[#F0E8E0] pt-8 mt-8 text-left w-full">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-black text-[#4A3E3D] flex items-center gap-2">
                            <Clipboard className="w-5 h-5 text-[#8B5E3C]" /> Your Booking Requests
                          </h3>
                        </div>
                      </div>
                      <p className="text-[#8B7E7D] text-xs">
                        Manage requests and track booking statuses submitted by pet owners.
                      </p>
                    </div>
                    
                    <select
                      value={requestFilter}
                      onChange={(e) => setRequestFilter(e.target.value)}
                      className="bg-white border-2 border-[#E8DDD4] text-[#8B5E3C] text-sm font-bold rounded-xl px-4 py-2 focus:outline-none focus:border-[#8B5E3C] shadow-sm appearance-none outline-none cursor-pointer"
                    >
                      <option value="all">All Requests</option>
                      <option value="pending">Pending</option>
                      <option value="accepted">Accepted</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="declined">Declined</option>
                    </select>
                  </div>

                  {loadingSitterRequests ? (
                    <div className="text-center py-6 text-gray-500">Loading your bookings...</div>
                  ) : sitterRequests.length === 0 ? (
                    <div className="text-center py-6 text-[#8B7E7D] bg-[#FAF6F4] rounded-2xl border border-dashed border-[#E8DDD4]">
                      No booking requests received yet.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {sitterRequests
                        .filter(req => requestFilter === 'all' || req.status === requestFilter)
                        .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
                        .map((req) => {
                        const isPending = req.status === 'pending';
                        const isAccepted = req.status === 'accepted';
                        const isCompleted = req.status === 'completed';
                        const isDeclined = req.status === 'declined';
                        const isCancelled = req.status === 'cancelled';
                        
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
                                  <span className="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-green-200 inline-flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Accepted
                                  </span>
                                )}
                                {isCompleted && (
                                  <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-200 inline-flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Completed
                                  </span>
                                )}
                                {isDeclined && (
                                  <span className="bg-red-100 text-red-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-red-200 inline-flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Declined
                                  </span>
                                )}
                                {isCancelled && (
                                  <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-gray-200 inline-flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400" /> Cancelled
                                  </span>
                                )}
                                {isPending && (
                                  <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-yellow-200 animate-pulse inline-flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" /> Pending
                                  </span>
                                )}
                              </div>
                            </div>

                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#8B7E7D]">
                               {req.pet_details?.pets && req.pet_details.pets.length > 1 ? (
                                 <div className="col-span-1 sm:col-span-2">
                                   <strong>Pets:</strong> 🐾 {req.pet_details.pets.length} pets: {req.pet_details.pets.map((p: any) => p.pet_name).join(' & ')}
                                 </div>
                               ) : (
                                 <div><strong>Pet Name:</strong> {req.pet_name} ({req.pet_type})</div>
                               )}
                               <div><strong>Dates:</strong> {req.dates} {req.time_slot ? `(${req.time_slot})` : ''}</div>
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

                                     {req.pet_details?.booking_pricing && (
                                       <div className="col-span-1 sm:col-span-2 mt-1.5 bg-white border border-[#E8DDD4] p-2.5 rounded-xl text-xs text-[#4A3E3D] font-medium flex justify-between items-center">
                                         <span>💰 Booking Rate & Cost:</span>
                                         <span className="font-bold text-[#4A3E3D]">
                                           ${req.pet_details.booking_pricing.total_cost}
                                           <span className="text-[#8B7E7D] font-normal text-[10px] ml-1.5">
                                             (${req.pet_details.booking_pricing.rate}/{req.pet_details.booking_pricing.unit} × {req.pet_details.booking_pricing.num_pets} {req.pet_details.booking_pricing.num_pets === 1 ? 'pet' : 'pets'})
                                           </span>
                                         </span>
                                       </div>
                                     )}

                                     {req.pet_details && (
                                       <div className="col-span-1 sm:col-span-2 mt-2 space-y-2.5">
                                         {(req.pet_details.pets || [req.pet_details]).map((pet: any, idx: number) => (
                                           <div key={pet.id || idx} className="bg-white rounded-xl border border-[#E8DDD4] p-3 text-xs text-[#4A3E3D]">
                                             <div className="font-bold text-[#8B5E3C] mb-2 flex items-center gap-1.5 border-b border-[#FAF6F4] pb-1.5">
                                               <PawPrint className="w-4 h-4 text-[#8B5E3C]" /> Care Profile: {pet.pet_name}
                                             </div>
                                             <div className="flex gap-3 flex-col sm:flex-row text-left">
                                               {(pet.photo_url || (Array.isArray(pet.photo_urls) && pet.photo_urls.filter(Boolean).length > 0)) && (
                                                 <PetPhotoCarousel
                                                   photoUrls={pet.photo_urls || [pet.photo_url]}
                                                   petType={pet.pet_type}
                                                   className="w-20 h-20 rounded-xl"
                                                 />
                                               )}
                                               <div className="flex-1 space-y-1.5 text-[11px]">
                                                 <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                                   {pet.breed && <div><strong>Breed:</strong> {pet.breed}</div>}
                                                   {pet.gender && <div><strong>Gender:</strong> {pet.gender}</div>}
                                                   {pet.weight && <div><strong>Weight:</strong> {pet.weight}</div>}
                                                   {pet.spayed_neutered !== undefined && (
                                                     <div><strong>Spayed/Neutered:</strong> {pet.spayed_neutered ? 'Yes' : 'No'}</div>
                                                   )}
                                                 </div>
                                                 {pet.feeding_schedule && (
                                                   <div><strong>Feeding:</strong> {pet.feeding_schedule}</div>
                                                 )}
                                                 {pet.medication && (
                                                   <div><strong>Medications:</strong> {pet.medication}</div>
                                                 )}
                                                 {pet.behavior_notes && (
                                                   <div><strong>Behavior Notes:</strong> {pet.behavior_notes}</div>
                                                 )}
                                                 {(pet.vet_name || pet.vet_phone) && (
                                                   <div className="text-[10px] text-[#8B7E7D] bg-[#FAF6F4] p-1.5 rounded-lg border border-[#E8DDD4] mt-1 inline-block">
                                                     Vet: {pet.vet_name || 'N/A'} {pet.vet_phone && `(${pet.vet_phone})`}
                                                   </div>
                                                 )}
                                               </div>
                                             </div>
                                           </div>
                                         ))}
                                       </div>
                                     )}
                                   </>
                                 );
                               })()}
                            </div>

                            {/* Messaging */}
                            {isAccepted && (
                              <div className="text-xs bg-white p-3 rounded-xl border border-[#E8DDD4] flex flex-col sm:flex-row justify-between items-center gap-3">
                                <div className="space-y-1">
                                  <div className="font-bold text-[#3B2410] mb-0.5 flex items-center gap-1.5"><MessageSquare className="w-4 h-4 text-[#8B5E3C]" /> Message Owner</div>
                                  <div className="text-[#8B7E7D] text-[10px]">Communicate directly with the owner to coordinate details</div>
                                </div>
                                <button
                                  onClick={() => {
                                    setActiveChatBooking(req);
                                    setActiveChatRole('sitter');
                                    setChatModalOpen(true);
                                  }}
                                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-xs transition-colors whitespace-nowrap shadow-sm w-full sm:w-auto"
                                >
                                  Message Owner
                                </button>
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

                              {isAccepted && (() => {
                                  const endDate = getBookingEndDate(req.dates);
                                  const today = new Date();
                                  today.setHours(0, 0, 0, 0);
                                  const isBeforeEndDate = endDate ? today < endDate : false;
                                  const isAfterEndDate = endDate ? today > endDate : false;

                                  let endDateStr = '';
                                  if (req.dates) {
                                    if (req.dates.includes('→')) {
                                      endDateStr = req.dates.split('→')[1].trim();
                                    } else if (req.dates.includes('->')) {
                                      endDateStr = req.dates.split('->')[1].trim();
                                    } else if (req.dates.includes('-')) {
                                      const parts = req.dates.split('-');
                                      if (parts.length === 2 && parts[0].length > 4) {
                                        endDateStr = parts[1].trim();
                                      } else {
                                        endDateStr = req.dates.trim();
                                      }
                                    } else {
                                      endDateStr = req.dates.trim();
                                    }
                                  }

                                  return (
                                    <div className="flex flex-col gap-2 w-full">
                                      {isAfterEndDate && (
                                        <p className="text-amber-700 text-xs font-semibold bg-amber-50 border border-amber-200 p-2.5 rounded-xl">
                                          ⚠️ Service date has passed — please mark as completed or contact support
                                        </p>
                                      )}
                                      <div className="flex gap-2 flex-wrap items-center">
                                        <button
                                          onClick={() => !isBeforeEndDate && handleMarkAsCompleted(req.id)}
                                          disabled={isBeforeEndDate}
                                          className={`font-bold py-1.5 px-4 rounded-lg text-xs transition-colors ${
                                            isBeforeEndDate 
                                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-80' 
                                              : 'bg-[#3B82F6] hover:bg-[#2563EB] text-white cursor-pointer'
                                          }`}
                                        >
                                          {isBeforeEndDate ? `Available after ${endDateStr}` : 'Mark as Completed'}
                                        </button>
                                        {!isAfterEndDate && (
                                          <button
                                            onClick={() => handleCancelBookingBySitter(req.id)}
                                            className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold py-1.5 px-4 rounded-lg text-xs transition-colors cursor-pointer"
                                          >
                                            Cancel Booking
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })()}


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
                  <h2 className="text-2xl font-black text-[#4A3E3D] mb-2">Join Free as an Early Sitter</h2>
                  <p className="text-[#8B7E7D] mb-4">Receive pet sitting requests in your neighborhood. 100% commission-free!</p>

                </div>

            {sitterAuthMode === 'email' && (
              <div className="text-center space-y-6 animate-fade-in bg-white p-8 rounded-2xl border border-[#E8DDD4] shadow-sm max-w-md mx-auto">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#FAF6F4] mb-2">
                  <Lock className="w-8 h-8 text-[#8B5E3C]" />
                </div>
                <h3 className="text-xl font-black text-[#4A3E3D]">Sign In Required</h3>
                <p className="text-[#8B7E7D] text-sm leading-relaxed">
                  You must be signed in to your free member account to apply or manage your pet sitter profile.
                </p>
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new Event('lumo-open-signin'))}
                  className="w-full bg-[#8B5E3C] hover:bg-[#7A5234] text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Key className="w-4 h-4" /> Sign In to Continue
                </button>
              </div>
            )}

            {sitterAuthMode === 'form' && (
              <div className="animate-fade-in">
                {profileMessage === '' && sitterApprovalStatus === 'pending' && sitterId !== '' && (
                  <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3 items-start">
                    <AlertTriangle className="w-5 h-5 text-blue-500 inline-block mr-1.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-blue-800 text-sm">Profile Under Review</h4>
                      <p className="text-blue-700 text-xs mt-1">Your profile is under review. We'll notify you once approved.</p>
                    </div>
                  </div>
                )}
                {profileMessage === '' && sitterApprovalStatus === 'approved' && (
                  <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex gap-3 items-start">
                    <svg className="w-5 h-5 text-green-500 inline-block mr-1.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    <div>
                      <h4 className="font-bold text-green-800 text-sm">Profile Active</h4>
                      <p className="text-green-700 text-xs mt-1">Your profile is live and visible in search results!</p>
                    </div>
                  </div>
                )}
                {profileMessage === '' && sitterApprovalStatus === 'rejected' && (
                  <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 items-start">
                    <AlertTriangle className="w-5 h-5 text-red-500 inline-block mr-1.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-red-800 text-sm">Profile Not Approved</h4>
                      <p className="text-red-700 text-xs mt-1">Your profile was not approved. Contact info@lumobitespet.com for help.</p>
                    </div>
                  </div>
                )}

            {(sitterId === '' || sitterApprovalStatus !== 'pending') && (
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
                        <img src={sitterPhoto} alt="Profile" className="w-16 h-16 rounded-full object-cover border-2 border-green-300 pointer-events-none" />
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
                    <Camera className="w-4 h-4 text-gray-500" /> Cover Photo / Banner
                    <span className="text-gray-400 font-normal text-xs">— optional</span>
                  </label>
                  {sitterCoverPhoto ? (
                    <div className="flex flex-col gap-2">
                      <div className="relative w-full h-32 rounded-xl overflow-hidden shadow-sm border border-[#E8DDD4]">
                        <img
                          src={sitterCoverPhoto}
                          alt="Cover Banner"
                          className="w-full h-full pointer-events-none"
                          style={{ objectFit: 'cover', objectPosition: coverPhotoPosition }}
                        />
                        <button
                          type="button"
                          onClick={() => { setSitterCoverPhoto(''); setCoverPhotoPosition('center'); }}
                          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-md transition-all cursor-pointer flex items-center justify-center"
                          title="Remove cover photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {/* Position picker */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#8B7E7D] shrink-0">Position:</span>
                        {(['top', 'center', 'bottom'] as const).map((pos) => (
                          <button
                            key={pos}
                            type="button"
                            onClick={() => setCoverPhotoPosition(pos)}
                            className={`capitalize text-xs font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                              coverPhotoPosition === pos
                                ? 'bg-[#8B5E3C] text-white border-[#8B5E3C] shadow-sm'
                                : 'bg-white text-[#4A3E3D] border-[#E8DDD4] hover:bg-[#FAF6F4]'
                            }`}
                          >
                            {pos}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center gap-4 p-3 rounded-xl bg-[#FAF6F4] border border-[#E8DDD4]">
                      <div className="w-20 h-14 rounded-lg bg-[#E8DDD4] flex items-center justify-center text-gray-400 shrink-0">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </div>
                      <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input 
                          type="file" 
                          ref={coverPhotoInputRef}
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 10 * 1024 * 1024) {
                                alert('Your photo is too large. Please use a photo under 10MB');
                                return;
                              }
                              const reader = new FileReader();
                              reader.onloadend = async () => {
                                const compressed = await compressCoverPhoto(reader.result as string);
                                setSitterCoverPhoto(compressed);
                                setCoverPhotoPosition('center');
                              };
                              reader.readAsDataURL(file);
                              e.target.value = '';
                            }
                          }} 
                        />
                        <input 
                          type="file" 
                          ref={coverCameraInputRef}
                          className="hidden"
                          accept="image/*"
                          capture="environment"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 10 * 1024 * 1024) {
                                alert('Your photo is too large. Please use a photo under 10MB');
                                return;
                              }
                              const reader = new FileReader();
                              reader.onloadend = async () => {
                                const compressed = await compressCoverPhoto(reader.result as string);
                                setSitterCoverPhoto(compressed);
                                setCoverPhotoPosition('center');
                              };
                              reader.readAsDataURL(file);
                              e.target.value = '';
                            }
                          }} 
                        />
                        <button 
                          type="button" 
                          onClick={() => coverCameraInputRef.current?.click()}
                          className="flex items-center justify-center gap-2 bg-[#FAF6F4] hover:bg-[#F0E6DD] text-[#8B5E3C] border border-[#E8DDD4] font-bold py-3 px-4 rounded-xl transition-all shadow-sm text-sm cursor-pointer"
                        >
                          <Camera className="w-4 h-4 shrink-0" />
                          <span>Take Photo</span>
                        </button>
                        <button 
                          type="button" 
                          onClick={() => coverPhotoInputRef.current?.click()}
                          className="flex items-center justify-center gap-2 bg-[#FAF6F4] hover:bg-[#F0E6DD] text-[#8B5E3C] border border-[#E8DDD4] font-bold py-3 px-4 rounded-xl transition-all shadow-sm text-sm cursor-pointer"
                        >
                          <Upload className="w-4 h-4 shrink-0" />
                          <span>Upload Banner</span>
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
                  {hasExistingIdPhoto ? (
                    // Already submitted and locked
                    <div className="flex flex-col sm:flex-row items-center gap-4 p-3 rounded-xl bg-green-50 border border-green-200 justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-12 rounded bg-green-100 flex items-center justify-center text-green-700 font-bold text-xl border border-green-200 shrink-0">
                          <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-green-700 flex items-center gap-1"><ShieldCheck className="w-4 h-4" /> Already submitted</p>
                          <p className="text-xs text-green-600 mt-0.5">Your ID is securely on file and cannot be changed. Contact <a href="mailto:info@lumobitespet.com" className="underline font-semibold text-green-700 hover:text-green-800">info@lumobitespet.com</a> if you need to update your ID.</p>
                        </div>
                      </div>
                    </div>
                  ) : sitterIdPhoto ? (
                    // Initial submission - file selected but not yet saved
                    <div className="flex flex-col sm:flex-row items-center gap-4 p-3 rounded-xl bg-green-50 border border-green-200 justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-12 rounded bg-green-100 flex items-center justify-center text-green-700 font-bold text-xl border border-green-200 shrink-0">
                          <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-green-700 flex items-center gap-1"><ShieldCheck className="w-4 h-4" /> Selected</p>
                          <p className="text-xs text-green-600 mt-0.5">ID photo selected successfully.</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSitterIdPhoto('');
                        }}
                        className="w-full sm:w-auto text-xs font-bold text-[#8B5E3C] bg-white border border-[#E8DDD4] hover:bg-[#FAF6F4] px-4 py-2 rounded-xl transition-colors shadow-sm cursor-pointer shrink-0"
                      >
                        Change ID
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
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-bold text-[#4A3E3D]">Location (City or Zip Code)</label>
                    <button 
                      type="button" 
                      onClick={handleSitterUseMyLocation} 
                      disabled={sitterIsLocating}
                      className="text-xs font-bold text-[#8B5E3C] bg-[#FAF6F4] border border-[#E8DDD4] hover:bg-[#F0E6DD] px-3 py-1 rounded-full transition-colors flex items-center gap-1 shadow-sm"
                    >
                      {sitterIsLocating ? '📍 Detecting...' : '📍 Use My Location'}
                    </button>
                  </div>
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
                    {['Morning (8am - 12pm)', 'Afternoon (12pm - 5pm)', 'Evening (5pm - 9pm)', 'Full Day (8am - 9pm)', 'Overnight (9pm - 8am)'].map(time => (
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
                      { val: 'Home visits', label: 'Home visits (drop-in)', icon: <Home className="w-4 h-4 text-[#8B5E3C]" /> },
                      { val: 'Overnight stays', label: 'Overnight stays', icon: <Moon className="w-4 h-4 text-[#8B5E3C]" /> },
                      { val: 'Dog walking', label: 'Dog walking', icon: <Footprints className="w-4 h-4 text-[#8B5E3C]" /> },
                      { val: 'Sitter\'s home boarding', label: 'Sitter\'s home boarding', icon: <Home className="w-4 h-4 text-[#8B5E3C]" /> },
                      { val: 'Full day sitting', label: 'Full day sitting (daycare)', icon: <Sun className="w-4 h-4 text-[#8B5E3C]" /> }
                    ].map(st => (
                      <label key={st.val} className="flex items-center gap-2 text-sm text-[#4A3E3D] cursor-pointer">
                        <input type="checkbox" checked={sitterServiceTypes.includes(st.val)} onChange={e => {
                          if (e.target.checked) setSitterServiceTypes([...sitterServiceTypes, st.val]);
                          else setSitterServiceTypes(sitterServiceTypes.filter(t => t !== st.val));
                        }} className="w-4 h-4 accent-[#8B5E3C]" />
                        <span className="flex items-center gap-1.5">{st.icon} {st.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 space-y-3">
                <label className="block text-sm font-bold text-[#4A3E3D] mb-2">Service Rates ($)</label>
                {sitterServiceTypes.length === 0 && (
                  <p className="text-xs text-[#8B7E7D]">Select services below to set your rates.</p>
                )}
                {sitterServiceTypes.includes('Home visits') && (
                  <div className="flex items-center gap-3 bg-[#FAF6F4] p-3 rounded-xl border border-[#E8DDD4]">
                    <span className="text-sm font-bold w-1/2 text-[#4A3E3D]">Drop-in visit</span>
                    <input type="number" min="0" value={sitterRateDropins} onChange={e => setSitterRateDropins(e.target.value)} className="w-1/2 bg-white border border-[#E8DDD4] rounded-lg px-3 py-2 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]" placeholder="25" />
                    <span className="text-xs text-[#8B7E7D] whitespace-nowrap">/ visit</span>
                  </div>
                )}
                {sitterServiceTypes.includes('Dog walking') && (
                  <div className="flex items-center gap-3 bg-[#FAF6F4] p-3 rounded-xl border border-[#E8DDD4]">
                    <span className="text-sm font-bold w-1/2 text-[#4A3E3D]">Dog walking</span>
                    <input type="number" min="0" value={sitterRateWalking} onChange={e => setSitterRateWalking(e.target.value)} className="w-1/2 bg-white border border-[#E8DDD4] rounded-lg px-3 py-2 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]" placeholder="20" />
                    <span className="text-xs text-[#8B7E7D] whitespace-nowrap">/ walk</span>
                  </div>
                )}
                {sitterServiceTypes.includes('Overnight stays') && (
                  <div className="flex items-center gap-3 bg-[#FAF6F4] p-3 rounded-xl border border-[#E8DDD4]">
                    <span className="text-sm font-bold w-1/2 text-[#4A3E3D]">Overnight stay</span>
                    <input type="number" min="0" value={sitterRateOvernight} onChange={e => setSitterRateOvernight(e.target.value)} className="w-1/2 bg-white border border-[#E8DDD4] rounded-lg px-3 py-2 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]" placeholder="55" />
                    <span className="text-xs text-[#8B7E7D] whitespace-nowrap">/ night</span>
                  </div>
                )}
                {sitterServiceTypes.includes('Sitter\'s home boarding') && (
                  <div className="flex items-center gap-3 bg-[#FAF6F4] p-3 rounded-xl border border-[#E8DDD4]">
                    <span className="text-sm font-bold w-1/2 text-[#4A3E3D]">Home boarding</span>
                    <input type="number" min="0" value={sitterRateBoarding} onChange={e => setSitterRateBoarding(e.target.value)} className="w-1/2 bg-white border border-[#E8DDD4] rounded-lg px-3 py-2 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]" placeholder="50" />
                    <span className="text-xs text-[#8B7E7D] whitespace-nowrap">/ night</span>
                  </div>
                )}
                {sitterServiceTypes.includes('Full day sitting') && (
                  <div className="flex items-center gap-3 bg-[#FAF6F4] p-3 rounded-xl border border-[#E8DDD4]">
                    <span className="text-sm font-bold w-1/2 text-[#4A3E3D]">Full day sitting</span>
                    <input type="number" min="0" value={sitterRateDaycare} onChange={e => setSitterRateDaycare(e.target.value)} className="w-1/2 bg-white border border-[#E8DDD4] rounded-lg px-3 py-2 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]" placeholder="40" />
                    <span className="text-xs text-[#8B7E7D] whitespace-nowrap">/ day</span>
                  </div>
                )}
                {formErrors['rate'] && <p className="text-red-500 text-sm mt-1">{formErrors['rate']}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-[#4A3E3D] mb-2">About You (Bio)</label>
                <textarea required rows={4} value={sitterBio} onChange={e => setSitterBio(e.target.value)} className={`w-full bg-[#FAF6F4] border ${!!formErrors['bio'] ? 'border-red-500 bg-red-50' : 'border-[#E8DDD4]'} rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]`} placeholder="Tell pet owners about your experience..."></textarea>
                {formErrors['bio'] && <p className="text-red-500 text-sm mt-1">{formErrors['bio']}</p>}
              </div>

              <div className="flex flex-col gap-1.5 bg-[#FAF6F4] p-4 rounded-xl border border-[#E8DDD4]">
                <label className="flex items-center gap-3 text-sm text-[#4A3E3D] font-bold cursor-pointer">
                  <input type="checkbox" id="avail" checked={sitterAvailable} onChange={e => setSitterAvailable(e.target.checked)} className="w-5 h-5 accent-[#8B5E3C] shrink-0" />
                  <span>I am currently accepting new booking requests</span>
                </label>
                <p className="text-xs text-gray-500 pl-8">Uncheck to temporarily hide your profile from search results.</p>
              </div>

              {/* Self-Declaration Checkbox & Terms of Service Note */}
              {!sitterId && (
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
              )}

              {profileMessage && (
                <div className="p-4 rounded-xl bg-blue-50 text-blue-800 text-sm font-bold text-center">
                  {profileMessage}
                </div>
              )}

              {/* Profile Status Badge - Only for approved sitters */}
              {sitterApprovalStatus === 'approved' && isProSitter && (
                sitterSubCancelAtPeriodEnd ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 text-center">
                    <span className="text-3xl mb-2 block">⏳</span>
                    <h3 className="text-yellow-800 font-bold text-lg mb-1">Subscription Cancelled</h3>
                    <p className="text-yellow-700 text-sm mb-4">
                      Your subscription has been cancelled. Your profile will remain visible until <strong>{sitterSubEndDate}</strong> — <strong>{sitterSubDaysRemaining} days remaining</strong>. After that your profile will be hidden from search results.
                    </p>
                    <button type="button" onClick={handleReactivateSitterSub} disabled={sitterSubActionLoading} className="w-full bg-yellow-700 hover:bg-yellow-800 text-white font-bold py-2 px-6 rounded-lg transition shadow-sm">
                      {sitterSubActionLoading ? 'Processing...' : 'Reactivate Subscription'}
                    </button>
                  </div>
                ) : sitterAvailable ? (
                  <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
                    <span className="text-3xl mb-2 block">✨</span>
                    <h3 className="text-green-800 font-bold text-lg mb-1">Sitter Profile Active</h3>
                    <p className="text-green-700 text-sm m-0">Your profile is visible in search results.</p>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center">
                    <span className="text-3xl mb-2 block">⏸️</span>
                    <h3 className="text-gray-800 font-bold text-lg mb-1">Profile Hidden</h3>
                    <p className="text-gray-600 text-sm m-0">You are not currently accepting requests. Your profile is temporarily hidden from search.</p>
                  </div>
                )
              )}

              {/* Main Submit Button */}
              <div className="pt-6 pb-28">
                <button 
                  type="submit" 
                  disabled={profileSaving} 
                  className={`w-full text-white font-black py-4 px-6 rounded-xl transition-all shadow-md text-lg ${!isFormValid ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#8B5E3C] hover:bg-[#7A5234]'}`}
                >
                  {profileSaving ? 'Saving...' : (sitterId && sitterApprovalStatus === 'approved' ? 'Update Profile' : 'Submit Application')}
                </button>

                {/* Delete Profile Link */}
                {sitterId && sitterApprovalStatus === 'approved' && (
                  <div className="mt-6 flex justify-center">
                    <button type="button" onClick={() => setDeleteModalOpen(true)} className="text-red-500 hover:text-red-700 text-sm font-bold underline decoration-red-300 underline-offset-4">
                      Remove Sitter Profile
                    </button>
                  </div>
                )}
              </div>

            </form>
            )}
              </div>
            )}
          </>
          )}
          </div>
        )}

      </main>

      {/* REQUEST MODAL */}
      {requestModalOpen && selectedSitter && (
        <div className="modal-overlay fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center sm:p-4 p-0 animate-fade-in" onClick={() => setRequestModalOpen(false)}>
          <div className="bg-white sm:rounded-3xl rounded-none w-full max-w-md sm:max-h-[90vh] h-full sm:h-auto flex flex-col shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-4 sm:p-6 border-b border-[#E8DDD4] relative sticky top-0 bg-white z-10 pr-12">
              <h3 className="text-xl sm:text-2xl font-black text-[#4A3E3D] mb-1">Request {formatSitterName(selectedSitter.name)}</h3>
              <p className="text-[#8B7E7D] text-xs sm:text-sm">You'll be notified instantly when the sitter responds. You can also message them directly through the app.</p>
              <button 
                onClick={() => setRequestModalOpen(false)} 
                className="absolute top-4 right-4 sm:top-6 sm:right-6 text-gray-400 hover:text-gray-600 w-10 h-10 flex items-center justify-center rounded-full bg-[#FAF6F4] hover:bg-[#E8DDD4] z-20"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 p-4 pb-32 sm:p-6 bg-[#FDFAF7]">
              {reqSuccess ? (
                <div className="text-center py-8">
                  <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <h4 className="text-xl font-bold text-green-600 mb-2">Request Sent!</h4>
                  <p className="text-gray-600 mb-6">Keep an eye on your email inbox for a reply from {formatSitterName(selectedSitter.name)}.</p>
                  
                  <button
                    onClick={() => {
                      setRequestModalOpen(false);
                      setReqSuccess(false);
                    }}
                    className="w-full bg-[#8B5E3C] hover:bg-[#7A5234] text-white font-bold py-3 rounded-xl transition-colors shadow-sm cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              ) : showPhoneVerification ? (
                <div className="space-y-4 text-left">
                  <div className="text-center pb-2">
                    <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto mb-3">
                      <Lock className="w-6 h-6" />
                    </div>
                    <h4 className="text-lg font-bold text-[#4A3E3D]">Phone Verification Required</h4>
                    <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">Verify your phone number with a one-time passcode before sending your first request.</p>
                  </div>

                  {!verifyConfirmationResult ? (
                    <form onSubmit={handleSendPhoneCode} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-[#4A3E3D] mb-1">Phone Number</label>
                        <div className="flex gap-2">
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                              className="bg-[#FAF6F4] border border-[#E8DDD4] rounded-lg px-2.5 py-2 text-sm text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C] flex items-center gap-1 h-[38px] min-w-[90px] justify-between"
                            >
                              <span className="flex items-center gap-1.5">
                                <span>{countryCodes.find(c => c.code === verifyPhoneCountry)?.flag || '🇺🇸'}</span>
                                <span className="font-medium">{verifyPhoneCountry}</span>
                              </span>
                              <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                            </button>

                            {isCountryDropdownOpen && (
                              <>
                                <div 
                                  className="fixed inset-0 z-40"
                                  onClick={() => setIsCountryDropdownOpen(false)}
                                />
                                <div className="absolute top-full left-0 mt-1 w-72 max-h-72 overflow-y-auto bg-white border border-[#E8DDD4] rounded-xl shadow-xl z-50 p-2 flex flex-col">
                                  <div className="sticky top-0 bg-white pb-2 z-10">
                                    <div className="relative">
                                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                      <input
                                        type="text"
                                        placeholder="Search countries..."
                                        value={countrySearch}
                                        onChange={(e) => setCountrySearch(e.target.value)}
                                        className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-[#8B5E3C]"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex flex-col gap-0.5 mt-1">
                                    {countryCodes.filter(c => 
                                      c.name.toLowerCase().includes(countrySearch.toLowerCase()) || 
                                      c.code.includes(countrySearch)
                                    ).map((c, i) => (
                                      <button
                                        key={i}
                                        type="button"
                                        onClick={() => {
                                          setVerifyPhoneCountry(c.code);
                                          setIsCountryDropdownOpen(false);
                                          setCountrySearch('');
                                        }}
                                        className="text-left px-3 py-2 hover:bg-[#FAF6F4] rounded-lg text-sm text-[#4A3E3D] flex items-center gap-3 transition-colors"
                                      >
                                        <span className="text-lg w-6 text-center">{c.flag}</span>
                                        <span className="flex-1 truncate font-medium">{c.name}</span>
                                        <span className="text-gray-400 font-mono text-xs">{c.code}</span>
                                      </button>
                                    ))}
                                    {countryCodes.filter(c => 
                                      c.name.toLowerCase().includes(countrySearch.toLowerCase()) || 
                                      c.code.includes(countrySearch)
                                    ).length === 0 && (
                                      <div className="text-center py-4 text-sm text-gray-400">
                                        No countries found.
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                          <input 
                            required 
                            type="tel" 
                            value={verifyPhoneNum} 
                            onChange={e => setVerifyPhoneNum(formatPhoneNumber(e.target.value))} 
                            placeholder="(502) 555-1234" 
                            className="flex-1 bg-[#FAF6F4] border border-[#E8DDD4] rounded-lg px-3 py-2 text-sm text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]" 
                          />
                        </div>
                      </div>

                      {verifyPhoneError && (
                        <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold p-3 rounded-xl animate-fade-in">
                          {verifyPhoneError}
                        </div>
                      )}

                      <div className="flex gap-3 pt-2">
                        <button 
                          type="button" 
                          onClick={() => setShowPhoneVerification(false)}
                          className="w-1/3 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-colors cursor-pointer text-xs"
                        >
                          Back
                        </button>
                        <button 
                          type="submit" 
                          disabled={verifyPhoneLoading}
                          className="flex-1 bg-[#8B5E3C] hover:bg-[#7A5234] text-white font-bold py-3 rounded-xl transition-colors shadow-sm cursor-pointer disabled:opacity-50 text-xs"
                        >
                          {verifyPhoneLoading ? 'Sending...' : 'Send Verification Code'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyPhoneCode} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-[#4A3E3D] mb-1">Enter 6-Digit Code</label>
                        <input 
                          required 
                          type="text" 
                          maxLength={6} 
                          value={verifyPhoneCode} 
                          onChange={e => setVerifyPhoneCode(e.target.value.replace(/\D/g, ''))} 
                          placeholder="123456" 
                          className="w-full tracking-widest text-center text-lg font-bold bg-[#FAF6F4] border border-[#E8DDD4] rounded-lg px-3 py-2.5 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]" 
                        />
                        <p className="text-[10px] text-gray-500 mt-1.5 text-center">
                          Code sent to <strong>{verifyPhoneCountry} {verifyPhoneNum}</strong>.
                        </p>
                      </div>

                      {verifyPhoneError && (
                        <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold p-3 rounded-xl animate-fade-in">
                          {verifyPhoneError}
                        </div>
                      )}

                      <div className="flex gap-3 pt-2">
                        <button 
                          type="button" 
                          onClick={() => {
                            setVerifyConfirmationResult(null);
                            setVerifyPhoneCode('');
                          }}
                          className="w-1/3 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-colors cursor-pointer text-xs"
                        >
                          Edit Phone
                        </button>
                        <button 
                          type="submit" 
                          disabled={verifyPhoneLoading}
                          className="flex-1 bg-[#8B5E3C] hover:bg-[#7A5234] text-white font-bold py-3 rounded-xl transition-colors shadow-sm cursor-pointer disabled:opacity-50 text-xs"
                        >
                          {verifyPhoneLoading ? 'Verifying...' : 'Verify & Continue'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSendRequestClick} className="space-y-4">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#4A3E3D] mb-1">Your Email</label>
                      <input required type="email" value={reqEmail} onChange={e => setReqEmail(e.target.value)} className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-lg px-3 py-2 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#4A3E3D] mb-1">Your Phone Number (Optional)</label>
                      <input type="tel" value={reqPhone} onChange={e => setReqPhone(e.target.value)} placeholder="(555) 555-5555" className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-lg px-3 py-2 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]" />
                    </div>
                  </div>

                  {/* Select Pets (Checkboxes) */}
                  <div className="bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl p-4 mb-4 text-left">
                    <label className="block text-xs font-bold text-[#4A3E3D] mb-2 flex items-center gap-1">
                      <PawPrint className="w-4 h-4 text-[#8B5E3C] inline" /> Select Pets *
                    </label>
                    
                    {ownerPets.length === 0 ? (
                      <p className="text-xs text-[#8B7E7D] italic mb-3">No pets added yet. Click &ldquo;Add New Pet&rdquo; below to add one.</p>
                    ) : (
                      <div className="space-y-2 mb-3 max-h-[160px] overflow-y-auto pr-1">
                        {ownerPets.map(p => {
                          const isChecked = selectedRequestPets.some(sp => sp.id === p.id);
                          return (
                            <label key={p.id} className="flex items-center gap-2.5 p-2.5 bg-white border border-[#E8DDD4] rounded-xl cursor-pointer hover:border-[#8B5E3C] transition-all text-xs text-[#4A3E3D] font-bold">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedRequestPets(prev => [...prev.filter(sp => sp.id !== p.id), p]);
                                  } else {
                                    setSelectedRequestPets(prev => prev.filter(sp => sp.id !== p.id));
                                  }
                                }}
                                className="w-4 h-4 accent-[#8B5E3C] rounded cursor-pointer"
                              />
                              <span className="flex-1 truncate">{p.pet_name}</span>
                              <span className="text-[10px] bg-[#FAF6F4] text-[#8B5E3C] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide border border-[#E8DDD4]">
                                {p.pet_type}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setShowInlineAddPet(prev => !prev);
                        setInlinePetName('');
                        setInlinePetType('dog');
                        setInlinePetBreed('');
                        setInlinePetAge('');
                      }}
                      className="text-[#8B5E3C] hover:text-[#7A5234] font-bold text-xs cursor-pointer border-none bg-transparent flex items-center gap-1 p-0 mt-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> {showInlineAddPet ? 'Cancel Adding Pet' : 'Add New Pet'}
                    </button>

                    {/* Inline Quick Pet Form */}
                    {showInlineAddPet && (
                      <div className="mt-4 bg-white border border-[#E8DDD4] rounded-xl p-4 space-y-3 shadow-sm animate-fade-in text-left">
                        <div className="text-xs font-bold text-[#8B5E3C] flex items-center justify-between border-b border-[#FAF6F4] pb-2 mb-1">
                          <span className="flex items-center gap-1">
                            <PawPrint className="w-3.5 h-3.5 text-[#8B5E3C]" /> Quick Pet Profile
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              // Transition to full pet profile modal
                              setEditingPet(null);
                              setPetFormName(inlinePetName);
                              setPetFormType(inlinePetType);
                              setPetFormBreed(inlinePetBreed);
                              setPetFormAge(inlinePetAge);
                              setPetFormWeight('');
                              setPetFormGender('');
                              setPetFormSpayed(false);
                              setPetFormFeeding('');
                              setPetFormMedication('');
                              setPetFormNotes('');
                              setPetFormVetName('');
                              setPetFormVetPhone('');
                              setPetFormPhoto('');
                              setPetModalOpen(true);
                              setShowInlineAddPet(false);
                            }}
                            className="text-[10px] text-[#8B5E3C] hover:underline cursor-pointer bg-transparent border-none flex items-center gap-1 font-bold"
                          >
                            <Pencil className="w-3 h-3" /> Add more details
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-[#4A3E3D] mb-1">Pet Name *</label>
                            <input
                              type="text"
                              value={inlinePetName}
                              onChange={(e) => setInlinePetName(e.target.value)}
                              placeholder="e.g. Buddy"
                              className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-lg px-2.5 py-1.5 text-xs text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-[#4A3E3D] mb-1">Pet Type *</label>
                            <select
                              value={inlinePetType}
                              onChange={(e) => setInlinePetType(e.target.value)}
                              className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-lg px-2.5 py-1.5 text-xs text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]"
                            >
                              <option value="dog">Dog</option>
                              <option value="cat">Cat</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-[#4A3E3D] mb-1">Breed</label>
                            <input
                              type="text"
                              value={inlinePetBreed}
                              onChange={(e) => setInlinePetBreed(e.target.value)}
                              placeholder="e.g. Golden Retriever"
                              className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-lg px-2.5 py-1.5 text-xs text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-[#4A3E3D] mb-1">Age</label>
                            <input
                              type="text"
                              value={inlinePetAge}
                              onChange={(e) => setInlinePetAge(e.target.value)}
                              placeholder="e.g. 3 yrs"
                              className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-lg px-2.5 py-1.5 text-xs text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]"
                            />
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2 border-t border-[#FAF6F4]">
                          <button
                            type="button"
                            disabled={inlineSaving}
                            onClick={handleSavePetInline}
                            className="bg-[#8B5E3C] hover:bg-[#7A5234] text-white text-[11px] font-bold py-2 px-3 rounded-lg transition-all cursor-pointer border-none disabled:opacity-50 flex items-center gap-1.5"
                          >
                            {inlineSaving ? 'Saving...' : <><Check className="w-3.5 h-3.5" /> Save & Select</>}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowInlineAddPet(false);
                            }}
                            className="bg-white hover:bg-gray-50 text-gray-500 border border-gray-200 text-[11px] font-bold py-2 px-3 rounded-lg transition-all cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#4A3E3D] mb-1">Service Needed</label>
                    <select required value={reqServiceType} onChange={e => setReqServiceType(e.target.value)} className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-lg px-3 py-2 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C] mb-4">
                      <option value="">Select a service</option>
                      {selectedSitter.service_types?.includes('Home visits') && <option value="Home visits">Drop-in visit - ${selectedSitter.rate_dropins || selectedSitter.rate_per_night}/visit</option>}
                      {selectedSitter.service_types?.includes('Dog walking') && <option value="Dog walking">Dog walking - ${selectedSitter.rate_walking || selectedSitter.rate_per_night}/walk</option>}
                      {selectedSitter.service_types?.includes('Overnight stays') && <option value="Overnight stays">Overnight stay - ${selectedSitter.rate_overnight || selectedSitter.rate_per_night}/night</option>}
                      {selectedSitter.service_types?.includes('Sitter\'s home boarding') && <option value="Sitter's home boarding">Home boarding - ${selectedSitter.rate_boarding || selectedSitter.rate_per_night}/night</option>}
                      {selectedSitter.service_types?.includes('Full day sitting') && <option value="Full day sitting">Full day sitting - ${selectedSitter.rate_daycare || selectedSitter.rate_per_night}/day</option>}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#4A3E3D] mb-1">Time Slot Needed</label>
                    <select
                      required
                      value={reqTimeSlot}
                      onChange={e => setReqTimeSlot(e.target.value)}
                      className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-lg px-3 py-2 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]"
                    >
                      <option value="">Select a time slot</option>
                      {(() => {
                        // Get sitter's active slots (using loaded available_times from API)
                        const activeSlots = getSitterActiveSlots(loadedSitterAvailableTimes.length > 0 ? loadedSitterAvailableTimes : (selectedSitter.available_times || []));

                        // Get all dates in the currently selected range
                        const rangeDates = reqStartDate && reqEndDate ? getDatesBetween(reqStartDate, reqEndDate) : (reqStartDate ? [reqStartDate] : []);

                        return activeSlots.map(slot => {
                          // Check if this slot is booked on any date in the selected range
                          const slotConflict = rangeDates.some(d => isSlotBooked(d, slot));
                          return (
                            <option key={slot} value={slot} disabled={slotConflict}>
                              {slot}{slotConflict ? ' — Booked on selected dates' : ''}
                            </option>
                          );
                        });
                      })()}
                    </select>
                    {reqStartDate && reqEndDate && (
                      <p className="text-[10px] text-[#8B7E7D] mt-1">
                        🔴 Slots marked as &ldquo;Booked&rdquo; are unavailable on one or more of your selected dates.
                      </p>
                    )}
                  </div>

                  <div>
                    {/* Availability Calendar */}
                    <div className="bg-[#FAF6F4] border border-[#E8DDD4] rounded-2xl p-3 sm:p-4 mt-3">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <span className="text-xs font-bold text-[#4A3E3D]">Availability Calendar</span>
                          <div className="text-[10px] text-[#8B7E7D] mt-0.5">Click dates to select booking range</div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-[#8B5E3C] font-bold block">
                            Available slots:
                          </span>
                          <span className="text-[10px] text-gray-600 block max-w-[150px] truncate" title={selectedSitter.available_times?.join(', ')}>
                            {selectedSitter.available_times?.map(t => t.split(' ')[0]).join(', ') || 'Flexible'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1.5 font-bold">
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

                          const SLOT_ABBRS = [
                            { key: 'Morning (8am - 12pm)',    abbr: 'M' },
                            { key: 'Afternoon (12pm - 5pm)', abbr: 'A' },
                            { key: 'Evening (5pm - 9pm)',     abbr: 'E' },
                            { key: 'Full Day (8am - 9pm)',    abbr: 'F' },
                            { key: 'Overnight (9pm - 8am)',   abbr: 'O' },
                          ];

                          const cells = [];
                          for (let i = 0; i < firstDay; i++) {
                            cells.push(<div key={`empty-${i}`} className="aspect-square" />);
                          }

                          for (let d = 1; d <= totalDays; d++) {
                            const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                            const isBlocked = sitterBlockedDates.includes(dateStr);
                            const isPast = dateStr < todayStr;
                            const isStart = reqStartDate === dateStr;
                            const isEnd = reqEndDate === dateStr;
                            const inRange = reqStartDate && reqEndDate && dateStr > reqStartDate && dateStr < reqEndDate;

                            const dayOfWeek = new Date(calYear, calMonth, d).getDay();
                            const dayOfWeekName = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][dayOfWeek];
                            const isScheduleUnavailable = sitterAvailableDays.length > 0 && !sitterAvailableDays.includes(dayOfWeekName);

                            const activeSlots = getSitterActiveSlots(loadedSitterAvailableTimes);
                            const fullyBooked = isDateFullyBooked(dateStr, loadedSitterAvailableTimes);
                            const isDisabled = isPast || isBlocked || isScheduleUnavailable || fullyBooked;

                            let bgClass = "bg-emerald-50 text-emerald-950 hover:bg-emerald-100 border border-emerald-200 cursor-pointer font-bold";
                            if (isPast) {
                              bgClass = "bg-gray-50 text-gray-300 border border-gray-100 cursor-not-allowed";
                            } else if (isBlocked) {
                              bgClass = "bg-amber-100 text-amber-950 border border-amber-300 cursor-not-allowed font-bold";
                            } else if (isScheduleUnavailable) {
                              bgClass = "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed font-medium";
                            } else if (fullyBooked) {
                              bgClass = "bg-rose-100 text-rose-950 border border-rose-300 cursor-not-allowed font-bold";
                            } else if (isStart || isEnd) {
                              bgClass = "bg-[#8B5E3C] text-white font-bold border border-[#8B5E3C] cursor-pointer";
                            } else if (inRange) {
                              bgClass = "bg-[#F6EFEA] text-[#8B5E3C] border-y border-[#E4D5CA] font-bold cursor-pointer";
                            }

                            // Build dot indicators for active slots
                            const dots = activeSlots.length > 0 && !isPast && !isBlocked && !isScheduleUnavailable
                              ? SLOT_ABBRS.filter(s => activeSlots.includes(s.key)).map(s => {
                                  const slotBooked = isSlotBooked(dateStr, s.key);
                                  return (
                                    <span
                                      key={s.key}
                                      title={`${s.key}: ${slotBooked ? 'Booked' : 'Available'}`}
                                      className={`inline-block rounded-full ${slotBooked ? 'bg-rose-500' : (isStart || isEnd ? 'bg-white/60' : 'bg-emerald-500')}`}
                                      style={{ width: '4px', height: '4px' }}
                                    />
                                  );
                                })
                              : null;

                            cells.push(
                              <button
                                key={`day-${d}`}
                                type="button"
                                disabled={isDisabled}
                                onClick={() => handleOwnerCalendarDayClick(dateStr)}
                                className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-all ${bgClass}`}
                              >
                                <span>{d}</span>
                                {dots && dots.length > 0 && (
                                  <div className="flex gap-[2px] mt-0.5 flex-wrap justify-center">
                                    {dots}
                                  </div>
                                )}
                              </button>
                            );
                          }
                          return cells;
                        })()}
                      </div>

                      {reqStartDate && !isSelectingMultipleDays && (
                        <div className="flex flex-col items-center">
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: '#F0FAF4',
                            border: '1px solid #8B5E3C',
                            borderRadius: '8px',
                            padding: '12px 16px',
                            marginTop: '8px'
                          }}>
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <span style={{ fontWeight: 600 }}>{new Date(reqStartDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                            <span style={{ color: '#6B7280' }}>(1 day)</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setIsSelectingMultipleDays(true);
                              setReqEndDate('');
                            }}
                            style={{
                              color: '#8B5E3C',
                              fontWeight: 500,
                              textDecoration: 'underline',
                              marginTop: '8px',
                              fontSize: '14px'
                            }}
                          >
                            + Need multiple days? Select end date
                          </button>
                        </div>
                      )}
                      
                      {reqStartDate && isSelectingMultipleDays && (
                        <div className="flex flex-col items-center">
                          {reqEndDate ? (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              background: '#F0FAF4',
                              border: '1px solid #8B5E3C',
                              borderRadius: '8px',
                              padding: '12px 16px',
                              marginTop: '8px'
                            }}>
                              <CheckCircle className="w-5 h-5 text-green-600" />
                              <span style={{ fontWeight: 600 }}>{new Date(reqStartDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: reqEndDate.startsWith(reqStartDate.substring(0, 4)) ? undefined : 'numeric' })} - {new Date(reqEndDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                              <span style={{ color: '#6B7280' }}>({Math.max(1, getDatesBetween(reqStartDate, reqEndDate).length)} days)</span>
                            </div>
                          ) : (
                            <div className="mt-4 p-3 bg-white rounded-xl border border-dashed border-[#E8DDD4] text-center font-bold text-[#8B7E7D] text-sm">
                              Please click an end date on the calendar
                            </div>
                          )}
                          <div className="mt-2">
                            <button
                              type="button"
                              onClick={() => {
                                setReqStartDate('');
                                setReqEndDate('');
                                setIsSelectingMultipleDays(false);
                              }}
                              className="text-xs text-rose-500 font-bold hover:underline"
                            >
                              Clear Selection
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {!reqStartDate && (
                        <div className="mt-4 p-3 bg-white rounded-xl border border-dashed border-[#E8DDD4] text-center font-bold text-[#8B7E7D] text-sm">
                          Please select your dates above
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 mt-3 pt-3 border-t border-[#E8DDD4] text-[10px] font-bold text-[#4A3E3D]">
                        <div className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block shadow-sm" /> Available
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block shadow-sm" /> Slot Booked
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block shadow-sm" /> Sitter Busy
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded bg-[#8B5E3C] inline-block shadow-sm" /> Selected
                        </div>
                        <div className="flex items-center gap-1 font-normal text-[#8B7E7D]">
                          Dots = M A E F O slots
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#4A3E3D] mb-1">Special Notes (Optional)</label>
                    <textarea rows={3} value={reqNotes} onChange={e => setReqNotes(e.target.value)} className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-lg px-3 py-2 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]"></textarea>
                  </div>
 
                  {/* Booking Summary & Pricing Box */}
                  {reqStartDate && reqEndDate && reqServiceType && selectedRequestPets.length > 0 && (
                    <div className="bg-[#FAF6F4] border border-[#E8DDD4] rounded-2xl p-4 mt-4 text-xs space-y-2 text-left">
                      <div className="font-bold text-[#8B5E3C] border-b border-[#E8DDD4] pb-1.5 mb-1.5 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-[#8B5E3C]" /> Booking Summary
                      </div>
                      <div className="flex justify-between text-[#4A3E3D]">
                        <span className="font-bold">Dates:</span>
                        <span>{reqStartDate} to {reqEndDate}</span>
                      </div>
                      <div className="flex justify-between text-[#4A3E3D]">
                        <span className="font-bold">Service:</span>
                        <span>{reqServiceType}</span>
                      </div>
                      {reqTimeSlot && (
                        <div className="flex justify-between text-[#4A3E3D]">
                          <span className="font-bold">Time Slot:</span>
                          <span>{reqTimeSlot}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-[#4A3E3D]">
                        <span className="font-bold">Selected Pets:</span>
                        <span>{selectedRequestPets.length} {selectedRequestPets.length === 1 ? 'pet' : 'pets'} ({selectedRequestPets.map(p => p.pet_name).join(', ')})</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-[#E8DDD4] font-black text-sm text-[#4A3E3D]">
                        <span>Estimated Total:</span>
                        <span className="text-right">
                          {(() => {
                            let rate = selectedSitter.rate_per_night;
                            let unit = 'night';
                            if (reqServiceType === 'Home visits') {
                              rate = selectedSitter.rate_dropins || selectedSitter.rate_per_night;
                              unit = 'visit';
                            } else if (reqServiceType === 'Dog walking') {
                              rate = selectedSitter.rate_walking || selectedSitter.rate_per_night;
                              unit = 'walk';
                            } else if (reqServiceType === 'Overnight stays') {
                              rate = selectedSitter.rate_overnight || selectedSitter.rate_per_night;
                              unit = 'night';
                            } else if (reqServiceType === 'Sitter\'s home boarding') {
                              rate = selectedSitter.rate_boarding || selectedSitter.rate_per_night;
                              unit = 'night';
                            } else if (reqServiceType === 'Full day sitting') {
                              rate = selectedSitter.rate_daycare || selectedSitter.rate_per_night;
                              unit = 'day';
                            }

                            const numPets = selectedRequestPets.length;
                            
                            let numDays = 1;
                            if (reqStartDate && reqEndDate) {
                              const rangeLen = getDatesBetween(reqStartDate, reqEndDate).length;
                              if (reqServiceType === 'Overnight stays' || reqServiceType === "Sitter's home boarding") {
                                numDays = Math.max(1, rangeLen - 1);
                              } else {
                                numDays = rangeLen;
                              }
                            }
                            
                            const total = rate * numPets * numDays;
                            return (
                              <span className="flex flex-col items-end">
                                <span className="text-sm font-black">${total}</span>
                                <span className="text-[10px] text-[#8B7E7D] font-normal mt-0.5">
                                  ${rate}/{unit} × {numPets} {numPets === 1 ? 'pet' : 'pets'} × {numDays} {reqServiceType === 'Overnight stays' || reqServiceType === "Sitter's home boarding" ? (numDays === 1 ? 'night' : 'nights') : (numDays === 1 ? 'day' : 'days')}
                                </span>
                              </span>
                            );
                          })()}
                        </span>
                      </div>
                    </div>
                  )}

                  {reqError && <div className="text-red-600 text-sm font-bold mt-2">{reqError}</div>}
 
                  <button disabled={reqLoading} type="submit" className="w-full bg-[#8B5E3C] hover:bg-[#7A5234] text-white font-bold py-3 rounded-xl transition-colors mt-6 shadow-sm cursor-pointer">
                    {reqLoading ? 'Sending...' : 'Send Request'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CAMERA CAPTURE MODAL */}
      {cameraModalOpen && (
        <div className="modal-overlay fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-[#FAF6F4] rounded-3xl p-6 pb-32 sm:pb-6 max-w-lg w-full shadow-2xl relative border border-[#E8DDD4] text-center animate-fade-in">
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
        <div className="modal-overlay fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 pb-32 sm:pb-8 max-w-lg w-full shadow-2xl relative border border-[#E8DDD4] text-center animate-fade-in">
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
            
            <h3 className="text-3xl font-black text-[#4A3E3D] mb-3 leading-tight">See Full Sitter Profiles</h3>
            <p className="text-[#8B7E7D] text-sm mb-6 max-w-sm mx-auto">
              Free account — view bios, message sitters, book instantly.
            </p>

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
                    placeholder="Enter your email" 
                  />
                  <p className="text-[11px] text-[#8B7E7D] mt-2 leading-relaxed">
                    We'll email you a quick code — no password needed.
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
                    inputMode="numeric"
                    maxLength={6}
                    value={ownerAuthCode} 
                    onChange={e => setOwnerAuthCode(e.target.value)} 
                    className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C] text-center font-mono text-xl tracking-widest"
                    placeholder="••••••" 
                  />
                  <div className="bg-stone-50 border border-stone-200/60 text-stone-600 rounded-xl p-3 text-xs leading-relaxed text-center font-medium mt-3 mb-2 animate-fade-in">
                    📧 Code sent! Check your inbox — and don't forget to check your spam/junk folder if you don't see it within a minute.
                  </div>
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
                className="w-full bg-[#8B5E3C] hover:bg-[#734A2E] text-white font-bold py-4 rounded-xl transition-all shadow-xs mt-4 flex items-center justify-center gap-2 cursor-pointer"
              >
                {unlockLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>{ownerAuthMode === 'email' ? 'Create Free Account' : 'Verify & Access Sitters'}</span>
                  </>
                )}
              </button>
            </form>
            
            {ownerAuthMode === 'email' && (
              <button
                type="button"
                onClick={() => {
                  setUnlockModalOpen(false);
                  window.dispatchEvent(new Event('lumo-open-signin'));
                }}
                className="w-full bg-white border-2 border-[#E8DDD4] hover:border-[#8B5E3C] text-[#8B5E3C] py-3.5 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs mt-3"
              >
                Already have an account? Sign in →
              </button>
            )}
          </div>
        </div>
      )}

      {/* REVIEWS MODAL */}
      {reviewsModalOpen && selectedSitterForReviews && (
        <div className="modal-overlay fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center sm:p-4 p-0 animate-fade-in" onClick={() => setReviewsModalOpen(false)}>
          <div className="bg-white sm:rounded-3xl rounded-none w-full max-w-xl sm:max-h-[90vh] h-full sm:h-auto flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Cover Banner */}
            <div className="h-32 sm:h-64 w-full relative bg-[#E8DDD4] overflow-hidden shrink-0">
              {isOwnerPro && selectedSitterForReviews.cover_photo_url ? (
                <img
                  src={selectedSitterForReviews.cover_photo_url}
                  alt="Cover banner"
                  className="w-full h-full pointer-events-none"
                  style={{
                    objectFit: 'cover',
                    objectPosition: (selectedSitterForReviews as any).cover_photo_position || 'center'
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-[#FAF6F4] to-[#E8DDD4] opacity-75" />
              )}
            </div>

            <div className="px-4 sm:px-6 pb-4 sm:pb-6 border-b border-[#E8DDD4] relative bg-white z-10 pt-0">
              <div className="relative z-10 flex items-start gap-3 sm:gap-4 pr-10 sm:pr-12">
                <div className="-mt-12 sm:-mt-18 flex-shrink-0">
                  {selectedSitterForReviews.photo_url ? (
                    <img src={selectedSitterForReviews.photo_url} alt={formatSitterName(selectedSitterForReviews.name)} className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl sm:rounded-3xl object-cover border-4 border-white shadow-md pointer-events-none" />
                  ) : (
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl sm:rounded-3xl bg-[#E8DDD4] flex items-center justify-center text-[#8B5E3C] font-black text-3xl sm:text-5xl shadow-md border-4 border-white">
                      {formatSitterName(selectedSitterForReviews.name).charAt(0)}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 pt-2 sm:pt-4 pb-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-xl sm:text-2xl font-black text-[#4A3E3D] break-words">{formatSitterName(selectedSitterForReviews.name)}</h3>
                    {selectedSitterForReviews.gender && (
                      <span className="text-[#8B7E7D] text-xs font-semibold px-2.5 py-0.5 bg-[#FAF6F4] rounded-full border border-[#E8DDD4] whitespace-nowrap">
                        {selectedSitterForReviews.gender}
                      </span>
                    )}
                    {ownerRequests.some(req => ['accepted', 'completed', 'no_show'].includes(req.status) && (req.sitter_id === selectedSitterForReviews.id || (selectedSitterForReviews.email && req.sitter_email?.toLowerCase().trim() === selectedSitterForReviews.email.toLowerCase().trim()))) && (
                      <button
                        onClick={() => handleOpenReportModal(selectedSitterForReviews.email || '', 'sitter', undefined, selectedSitterForReviews.id)}
                        className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 transition-colors cursor-pointer text-sm"
                        title="Report this sitter"
                      >
                        ⚠️
                      </button>
                    )}
                  </div>
                  
                  {selectedSitterForReviews.approval_status === 'approved' && (
                    <div className="inline-flex items-center gap-1 bg-[#D1FAE5] text-[#065F46] text-xs font-bold px-2.5 py-1 rounded-full border border-[#A7F3D0] mb-2 whitespace-nowrap">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#065F46] shrink-0" /> ID Verified
                    </div>
                  )}
 
                  <div className="text-sm">
                    {!isOwnerPro ? (
                      <span className="text-[#8B7E7D] text-xs font-semibold select-none">
                        🔒 Reviews locked
                      </span>
                    ) : selectedSitterForReviews.review_count ? (
                      <span className="text-[#D97706] font-bold whitespace-nowrap">
                        ⭐ {selectedSitterForReviews.avg_rating} <span className="text-[#8B7E7D] font-normal">({selectedSitterForReviews.review_count} {selectedSitterForReviews.review_count === 1 ? 'review' : 'reviews'})</span>
                      </span>
                    ) : (
                      <span className="text-[#8B7E7D] whitespace-nowrap">No reviews yet</span>
                    )}
                  </div>
 
                  <p className="text-[#8B7E7D] text-xs sm:text-sm flex flex-wrap items-center gap-1 mt-1">
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
              <button 
                onClick={() => setReviewsModalOpen(false)} 
                className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 flex items-center justify-center rounded-full bg-[#FAF6F4] hover:bg-[#E8DDD4] text-[#4A3E3D] transition-colors cursor-pointer text-lg font-bold z-20"
              >
                ✕
              </button>
            </div>
            
            <div className="p-4 pb-32 sm:p-6 overflow-y-auto flex-1 bg-[#FDFAF7] space-y-6">
              {/* Bio Section */}
              <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#E8DDD4] shadow-sm">
                <h4 className="text-sm font-bold text-[#8B5E3C] uppercase tracking-wider mb-3">About Me</h4>
                <p className="text-[#4A3E3D] text-lg sm:text-base leading-relaxed whitespace-pre-wrap">{selectedSitterForReviews.bio}</p>
              </div>

              {/* Service & Rate Details Section */}
              <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#E8DDD4] shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-bold text-[#8B7E7D] uppercase tracking-wider mb-2">Service Rates</h4>
                  <div className="flex flex-col gap-1.5">
                    {selectedSitterForReviews.rate_dropins && <div className="flex justify-between items-center text-sm font-bold text-[#4A3E3D]"><span>Drop-in visit</span><span>${selectedSitterForReviews.rate_dropins}<span className="font-medium text-[#8B7E7D] text-xs">/visit</span></span></div>}
                    {selectedSitterForReviews.rate_walking && <div className="flex justify-between items-center text-sm font-bold text-[#4A3E3D]"><span>Dog walking</span><span>${selectedSitterForReviews.rate_walking}<span className="font-medium text-[#8B7E7D] text-xs">/walk</span></span></div>}
                    {selectedSitterForReviews.rate_overnight && <div className="flex justify-between items-center text-sm font-bold text-[#4A3E3D]"><span>Overnight stay</span><span>${selectedSitterForReviews.rate_overnight}<span className="font-medium text-[#8B7E7D] text-xs">/night</span></span></div>}
                    {selectedSitterForReviews.rate_boarding && <div className="flex justify-between items-center text-sm font-bold text-[#4A3E3D]"><span>Home boarding</span><span>${selectedSitterForReviews.rate_boarding}<span className="font-medium text-[#8B7E7D] text-xs">/night</span></span></div>}
                    {selectedSitterForReviews.rate_daycare && <div className="flex justify-between items-center text-sm font-bold text-[#4A3E3D]"><span>Full day sitting</span><span>${selectedSitterForReviews.rate_daycare}<span className="font-medium text-[#8B7E7D] text-xs">/day</span></span></div>}
                    {!selectedSitterForReviews.rate_dropins && !selectedSitterForReviews.rate_walking && !selectedSitterForReviews.rate_overnight && !selectedSitterForReviews.rate_boarding && !selectedSitterForReviews.rate_daycare && (
                      <p className="text-lg font-black text-[#4A3E3D]">{(selectedSitterForReviews.service_types?.length || 0) > 1 ? <><span className="text-sm font-medium text-[#8B7E7D] mr-1">From</span>${selectedSitterForReviews.rate_per_night}</> : <>${selectedSitterForReviews.rate_per_night}<span className="text-sm font-medium text-[#8B7E7D]">/{selectedSitterForReviews.rate_type || 'night'}</span></>}</p>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#8B7E7D] uppercase tracking-wider mb-1">Pets Allowed</h4>
                  <p className="text-sm font-semibold text-[#8B5E3C] bg-[#FAF6F4] px-2.5 py-1 rounded-lg inline-block">
                    {selectedSitterForReviews.pet_types === 'both' ? '🐶 Dogs & 🐱 Cats' : selectedSitterForReviews.pet_types === 'dog' ? '🐶 Dogs Only' : '🐱 Cats Only'}
                  </p>
                </div>
              </div>

              {/* Services & Availability Details */}
              <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#E8DDD4] shadow-sm space-y-4">
                {/* Service Types */}
                {(selectedSitterForReviews.service_types?.length || 0) > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-[#8B7E7D] uppercase tracking-wider mb-2">Offered Services</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedSitterForReviews.service_types?.map(st => {
                        const icon = st === 'Home visits' ? <Home className="w-3.5 h-3.5 shrink-0" /> : st === 'Overnight stays' ? <Moon className="w-3.5 h-3.5 shrink-0" /> : st === 'Dog walking' ? <Footprints className="w-3.5 h-3.5 shrink-0" /> : <Home className="w-3.5 h-3.5 shrink-0" />;
                        const label = st === 'Home visits' ? 'Drop-in visits' : st === 'Overnight stays' ? 'Overnight stays' : st === 'Dog walking' ? 'Dog walking' : 'Boarding';
                        return (
                          <span key={st} className="text-xs font-bold uppercase tracking-wider text-[#8B5E3C] bg-[#FAF6F4] px-3 py-1 rounded-xl border border-[#E8DDD4] flex items-center gap-1.5">
                            {icon} {label}
                          </span>
                        );
                      })}
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
                
                {!isOwnerPro ? (
                  <div className="bg-[#FAF6F4] border border-[#E8DDD4] rounded-3xl p-6 text-center shadow-xs">
                    <Lock className="w-8 h-8 text-[#8B5E3C] mx-auto mb-3" />
                    <h5 className="font-extrabold text-[#4A3E3D] mb-1">Create Free Account to see reviews</h5>
                    <p className="text-xs text-[#8B7E7D] max-w-sm mx-auto">
                      Reviews may contain sitter names or identifying details.
                    </p>
                  </div>
                ) : loadingReviews ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B5E3C] mb-4"></div>
                    <p className="text-[#8B7E7D] text-xs">Loading reviews...</p>
                  </div>
                ) : sitterReviews.length === 0 ? (
                  <div className="bg-white p-6 rounded-3xl border border-[#E8DDD4] text-center shadow-sm flex flex-col items-center justify-center">
                    <Footprints className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-[#8B7E7D] text-sm font-medium">No reviews yet for {formatSitterName(selectedSitterForReviews.name)}.</p>
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
            
            <div className="p-4 pb-28 sm:pb-4 border-t border-[#E8DDD4] bg-white sticky bottom-0 flex flex-col-reverse sm:flex-row gap-3">
              <button 
                onClick={() => setReviewsModalOpen(false)} 
                className="w-full sm:w-auto bg-[#FAF6F4] hover:bg-[#E8DDD4] text-[#4A3E3D] font-bold px-5 py-3 rounded-xl transition-colors shadow-sm cursor-pointer text-center"
              >
                Close
              </button>
              {(() => {
                const isSelf = !!(reqEmail && selectedSitterForReviews?.email && reqEmail.toLowerCase().trim() === selectedSitterForReviews.email.toLowerCase().trim());
                return (
                  <button
                    disabled={isSelf}
                    onClick={() => {
                      setReviewsModalOpen(false);
                      if (!isOwnerPro) {
                        setUnlockModalOpen(true);
                      } else {
                        setSelectedSitter(selectedSitterForReviews);
                        setRequestModalOpen(true);
                      }
                    }}
                    className={`w-full sm:flex-1 bg-[#8B5E3C] hover:bg-[#7A5234] text-white font-bold py-3 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-1.5 text-center ${isSelf ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <span>{isOwnerPro ? 'Request Sitter' : 'Create Free Account'}</span>
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteModalOpen && (
        <div className="modal-overlay fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 pb-32 sm:pb-8 max-w-sm w-full shadow-2xl relative animate-fade-in text-center">
            <span className="text-5xl mb-4 block">😢</span>
            <h3 className="text-2xl font-black text-[#4A3E3D] mb-2">Are you sure?</h3>
            <p className="text-[#8B7E7D] text-sm mb-6">Are you sure you want to remove your sitter profile? Your Lumo Bites member account will remain active — you just won't appear in sitter search results. This cannot be undone.</p>

            <div className="flex flex-col gap-3">
              <button 
                onClick={handleDeleteProfile} 
                disabled={deleteLoading} 
                className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-3 rounded-xl transition-all shadow-md"
              >
                {deleteLoading ? 'Removing...' : 'Yes, Remove Profile'}
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

      {/* Chat Modal */}
      {chatModalOpen && activeChatBooking && (
        <ChatModal
          bookingId={activeChatBooking.id}
          bookingDetails={`${activeChatBooking.pet_name || 'Pet'} • ${activeChatBooking.dates || 'Dates TBA'}`}
          isOpen={chatModalOpen}
          onClose={() => {
            setChatModalOpen(false);
            setActiveChatBooking(null);
          }}
          currentUserEmail={activeChatRole === 'owner' ? (activeChatBooking.owner_email || reqEmail) : (sitterEmail || activeChatBooking.sitters?.email || activeChatBooking.sitter_email || localStorage.getItem('lumo_sitter_email') || '')}
          otherUserName={activeChatRole === 'owner' ? formatSitterName(activeChatBooking.sitters?.name || activeChatBooking.sitter_name) : (activeChatBooking.owner_name || 'Owner')}
          otherUserEmail={activeChatRole === 'owner' ? (activeChatBooking.sitters?.email || activeChatBooking.sitter_email || '') : (activeChatBooking.owner_email || '')}
          otherUserType={activeChatRole === 'owner' ? 'sitter' : 'user'}
          onReport={(email, type) => {
            setChatModalOpen(false);
            handleOpenReportModal(email, type, activeChatBooking.id);
          }}
          petDetails={activeChatBooking.pet_details}
        />
      )}

      {/* Report Modal */}
      {reportModalOpen && (
        <div className="modal-overlay fixed inset-0 z-[1050] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl p-6 pb-32 md:p-8 w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => setReportModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-250 text-gray-500 transition-colors border-none cursor-pointer"
            >
              <XCircle className="w-5 h-5 text-gray-500" />
            </button>

            <h2 className="text-2xl font-bold text-[#3B2410] mb-2 text-center flex items-center justify-center gap-2">
              <span>⚠️ Report {reportTargetType === 'sitter' ? 'Sitter' : 'User'}</span>
            </h2>
            <p className="text-center text-[#8B7E7D] text-xs mb-6 truncate font-medium">
              Target: {reportTargetEmail}
            </p>

            <form onSubmit={handleSubmitReport} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-[#4A3E3D] uppercase mb-1.5">Reason for Report</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl p-3 text-sm focus:outline-none focus:border-[#8B5E3C] text-gray-800 font-medium"
                >
                  <option value="Inappropriate behavior">Inappropriate behavior</option>
                  <option value="No-show">No-show</option>
                  <option value="Unsafe">Unsafe</option>
                  <option value="Harassment">Harassment</option>
                  <option value="Spam/abuse">Spam/abuse</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[#4A3E3D] text-xs font-bold uppercase mb-1.5">Optional Details</label>
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Provide any additional details or context..."
                  className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl p-3 text-sm h-28 resize-none focus:outline-none focus:border-[#8B5E3C] text-gray-800"
                />
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  type="submit"
                  disabled={reportLoading}
                  className="w-full bg-red-650 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors shadow-sm disabled:opacity-50 cursor-pointer border-none"
                >
                  {reportLoading ? 'Submitting...' : 'Submit Report'}
                </button>
                <button
                  type="button"
                  onClick={() => setReportModalOpen(false)}
                  className="w-full bg-[#FAF6F4] hover:bg-[#F0E6DD] text-[#4A3E3D] font-bold py-3 rounded-xl transition-colors border border-[#E8DDD4]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pet Profile Modal */}
      {petModalOpen && (
        <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/45 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 pb-32 md:p-8 w-full max-w-lg shadow-2xl relative my-8 text-left border border-[#E8DDD4] max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setPetModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors border-none cursor-pointer"
            >
              <XCircle className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-[#4A3E3D] mb-4 flex items-center gap-2">
              <PawPrint className="w-5 h-5 text-[#8B5E3C]" /> {editingPet ? 'Edit Pet Profile' : 'Add a Pet'}
            </h3>

            <form onSubmit={handleSavePet} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#4A3E3D] mb-1">Pet Name *</label>
                  <input
                    required
                    type="text"
                    value={petFormName}
                    onChange={(e) => setPetFormName(e.target.value)}
                    placeholder="e.g. Buddy"
                    className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-3.5 py-2.5 text-[#4A3E3D] text-sm focus:outline-none focus:border-[#8B5E3C]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#4A3E3D] mb-1">Pet Type *</label>
                  <select
                    value={petFormType}
                    onChange={(e) => setPetFormType(e.target.value)}
                    className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-3.5 py-2.5 text-[#4A3E3D] text-sm focus:outline-none focus:border-[#8B5E3C]"
                  >
                    <option value="dog">Dog</option>
                    <option value="cat">Cat</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-[#4A3E3D] mb-1">Breed</label>
                  <input
                    type="text"
                    value={petFormBreed}
                    onChange={(e) => setPetFormBreed(e.target.value)}
                    placeholder="e.g. Golden Retriever"
                    className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-3 py-2.5 text-[#4A3E3D] text-sm focus:outline-none focus:border-[#8B5E3C]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#4A3E3D] mb-1">Age</label>
                  <input
                    type="text"
                    value={petFormAge}
                    onChange={(e) => setPetFormAge(e.target.value)}
                    placeholder="e.g. 3 yrs"
                    className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-3 py-2.5 text-[#4A3E3D] text-sm focus:outline-none focus:border-[#8B5E3C]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#4A3E3D] mb-1">Weight</label>
                  <input
                    type="text"
                    value={petFormWeight}
                    onChange={(e) => setPetFormWeight(e.target.value)}
                    placeholder="e.g. 50 lbs"
                    className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-3 py-2.5 text-[#4A3E3D] text-sm focus:outline-none focus:border-[#8B5E3C]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#4A3E3D] mb-1">Gender</label>
                  <select
                    value={petFormGender}
                    onChange={(e) => setPetFormGender(e.target.value)}
                    className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-3.5 py-2.5 text-[#4A3E3D] text-sm focus:outline-none focus:border-[#8B5E3C]"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 text-xs font-bold text-[#4A3E3D] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={petFormSpayed}
                      onChange={(e) => setPetFormSpayed(e.target.checked)}
                      className="rounded text-[#8B5E3C] focus:ring-[#8B5E3C] w-4 h-4 border-[#E8DDD4]"
                    />
                    Spayed / Neutered
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A3E3D] mb-1">Feeding Schedule</label>
                <input
                  type="text"
                  value={petFormFeeding}
                  onChange={(e) => setPetFormFeeding(e.target.value)}
                  placeholder="e.g. 2 cups at 8 AM and 6 PM"
                  className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-3.5 py-2.5 text-[#4A3E3D] text-sm focus:outline-none focus:border-[#8B5E3C]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A3E3D] mb-1">Medications (Optional)</label>
                <input
                  type="text"
                  value={petFormMedication}
                  onChange={(e) => setPetFormMedication(e.target.value)}
                  placeholder="e.g. None, or specific medicines and doses"
                  className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-3.5 py-2.5 text-[#4A3E3D] text-sm focus:outline-none focus:border-[#8B5E3C]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A3E3D] mb-1">Behavior Notes</label>
                <textarea
                  value={petFormNotes}
                  onChange={(e) => setPetFormNotes(e.target.value)}
                  placeholder="e.g. Friendly with kids, anxious around vacuums, loves belly rubs"
                  className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl p-3 text-sm h-20 resize-none focus:outline-none focus:border-[#8B5E3C] text-gray-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#4A3E3D] mb-1">Primary Vet Name</label>
                  <input
                    type="text"
                    value={petFormVetName}
                    onChange={(e) => setPetFormVetName(e.target.value)}
                    placeholder="e.g. Dr. Walker"
                    className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-3.5 py-2.5 text-[#4A3E3D] text-sm focus:outline-none focus:border-[#8B5E3C]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#4A3E3D] mb-1">Primary Vet Phone</label>
                  <input
                    type="text"
                    value={petFormVetPhone}
                    onChange={(e) => setPetFormVetPhone(e.target.value)}
                    placeholder="e.g. (555) 123-4567"
                    className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-3.5 py-2.5 text-[#4A3E3D] text-sm focus:outline-none focus:border-[#8B5E3C]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A3E3D] mb-1.5">Pet Photos (Up to 3)</label>
                
                {/* Photo Previews Grid */}
                <div className="flex flex-wrap gap-3 mb-3">
                  {petFormPhotos.map((url, index) => (
                    <div key={index} className="w-20 h-20 rounded-xl overflow-hidden bg-[#FAF6F4] border border-[#E8DDD4] relative group">
                      <img src={url} alt={`Preview ${index + 1}`} className="w-full h-full object-cover pointer-events-none" />
                      <button
                        type="button"
                        onClick={() => {
                          setPetFormPhotos(prev => prev.filter((_, idx) => idx !== index));
                        }}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-650/80 hover:bg-red-650 text-white rounded-full flex items-center justify-center text-xs font-bold cursor-pointer border-none shadow-sm transition-all"
                        title="Remove Photo"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                  {petFormPhotos.length === 0 && (
                    <div className="w-20 h-20 rounded-xl bg-[#FAF6F4] border border-[#E8DDD4] flex items-center justify-center">
                      <PawPrint className="w-8 h-8 text-[#8B5E3C] opacity-60" />
                    </div>
                  )}
                </div>

                {petFormPhotos.length < 3 ? (
                  <div className="flex gap-2 items-center">
                    <button
                      type="button"
                      onClick={() => petPhotoInputRef.current?.click()}
                      className="bg-[#FAF6F4] hover:bg-[#F0E6DD] text-[#8B5E3C] border border-[#E8DDD4] font-bold py-2 px-3 rounded-xl transition-all shadow-sm text-xs cursor-pointer flex items-center gap-1.5"
                    >
                      📁 Choose from Gallery
                    </button>
                    <button
                      type="button"
                      onClick={() => petCameraInputRef.current?.click()}
                      className="bg-[#FAF6F4] hover:bg-[#F0E6DD] text-[#8B5E3C] border border-[#E8DDD4] font-bold py-2 px-3 rounded-xl transition-all shadow-sm text-xs cursor-pointer flex items-center gap-1.5"
                    >
                      📷 Take Photo
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] text-[#8B7E7D] font-medium italic">Maximum of 3 photos added.</p>
                )}

                {/* Hidden File Inputs */}
                <input
                  type="file"
                  ref={petPhotoInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handlePhotoUpload(file);
                      e.target.value = '';
                    }
                  }}
                />
                <input
                  type="file"
                  ref={petCameraInputRef}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handlePhotoUpload(file);
                      e.target.value = '';
                    }
                  }}
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-[#F0E8E0]">
                <button
                  type="submit"
                  disabled={submittingPet}
                  className="w-full bg-[#8B5E3C] hover:bg-[#7A5234] text-white font-bold py-3 rounded-xl transition-colors shadow-sm disabled:opacity-50 cursor-pointer border-none"
                >
                  {submittingPet ? 'Saving...' : 'Save Pet Profile'}
                </button>
                <button
                  type="button"
                  onClick={() => setPetModalOpen(false)}
                  className="w-full bg-[#FAF6F4] hover:bg-[#F0E6DD] text-[#4A3E3D] font-bold py-3 rounded-xl transition-colors border border-[#E8DDD4] cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      </div>
    </div>
  );
}
