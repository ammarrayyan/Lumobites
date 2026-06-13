'use client';

import { useRouter } from 'next/navigation';
import { Mail, Clock, ArrowLeft } from 'lucide-react';

export default function ContactPage() {
  const router = useRouter();

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '60px 24px' }}>
      <button 
        onClick={() => router.back()}
        className="flex items-center gap-2 text-[#8B5E3C] hover:text-[#6B4A2E] mb-6 cursor-pointer border-0 bg-transparent p-0 font-semibold"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <h1 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '8px' }}>Contact Us</h1>
      <p style={{ color: '#888', marginBottom: '40px' }}>We&apos;d love to hear from you!</p>
      <div style={{ backgroundColor: '#FDFAF7', borderRadius: '24px', padding: '32px', border: '1px solid #E8DDD4' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Mail style={{ width: '20px', height: '20px', color: '#8B5E3C' }} /> Email
        </h2>
        <p style={{ color: '#555' }}>For general inquiries, product suggestions, or feedback:</p>
        <a href="mailto:info@lumobitespet.com" style={{ color: '#8B5E3C', fontWeight: 600 }}>info@lumobitespet.com</a>
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginTop: '24px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock style={{ width: '20px', height: '20px', color: '#8B5E3C' }} /> Response Time
        </h2>
        <p style={{ color: '#555' }}>We typically respond within 24-48 hours.</p>
      </div>
    </div>
  );
}