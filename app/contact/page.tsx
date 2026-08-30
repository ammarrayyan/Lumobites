'use client';

import { useRouter } from 'next/navigation';
import { Mail, Clock, ArrowLeft, Send } from 'lucide-react';
import { useSwipeBack } from '@/lib/useSwipeBack';

export default function ContactPage() {
  const router = useRouter();
  
  // Edge-swipe-right-to-go-back gesture
  useSwipeBack({ fallbackUrl: '/' });

  return (
    <div className="min-h-screen bg-[#F7F3EE] font-sans flex flex-col items-center py-16 px-4">
      <div className="max-w-[600px] w-full">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[#8B5E3C] hover:text-[#6B4A2E] mb-6 cursor-pointer border-0 bg-transparent p-0 font-bold text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-[#2E2419] mb-2">Contact Us</h1>
          <p className="text-gray-500 font-medium">We&apos;d love to hear from you!</p>
        </div>

        <div 
          style={{ boxShadow: '0 4px 20px rgba(139, 94, 60, 0.05), 0 1px 3px rgba(0, 0, 0, 0.03)' }}
          className="bg-white rounded-3xl border border-[#DFD3C7] overflow-hidden"
        >
          <div className="bg-[#FAF5EE] px-6 py-4 border-b border-[#EADBCE] flex items-center justify-between">
            <h2 className="font-extrabold text-sm text-[#2E2419] flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-[#F0E6DA] text-[#8B5E3C] flex items-center justify-center text-sm">
                <Mail className="w-4 h-4" />
              </span>
              Get in Touch
            </h2>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Fast Response
            </span>
          </div>

          <div className="p-6 md:p-8 space-y-6">
            <div className="bg-[#FAF6F2] border border-[#E2D5C8] rounded-2xl p-5 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Direct Email</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                For general inquiries, veterinary/boarding partnerships, or pet parent support:
              </p>
              <a 
                href="mailto:info@lumobitespet.com" 
                className="inline-block text-[#8B5E3C] hover:text-[#734A2E] font-extrabold text-base underline decoration-[#8B5E3C]/30 hover:decoration-[#8B5E3C] transition-colors pt-1"
              >
                info@lumobitespet.com
              </a>
            </div>

            <div className="bg-[#FAF6F2] border border-[#E2D5C8] rounded-2xl p-5 space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#8B5E3C]" />
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Response Time</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed font-medium">
                Our support team typically responds within <strong>24-48 hours</strong>, Monday through Saturday.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}