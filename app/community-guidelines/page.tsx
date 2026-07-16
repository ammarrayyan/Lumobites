import React from 'react';
import Link from 'next/link';
import { ShieldCheck, MessageSquare, AlertOctagon, HelpCircle } from 'lucide-react';

export default function CommunityGuidelinesPage() {
  return (
    <div 
      className="min-h-screen bg-[#FDFAF7] text-[#555555] font-sans"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top) + 64px)'
      }}
    >
      <main className="max-w-[800px] mx-auto px-6 py-16">
        <div className="text-center mb-12 flex flex-col items-center">
          <ShieldCheck className="w-12 h-12 text-[#8B5E3C] mb-4" />
          <h1 className="text-4xl font-extrabold text-[#191919] tracking-tight mb-3">
            Community Guidelines
          </h1>
          <p className="text-sm text-[#8B7E7D] max-w-lg leading-relaxed">
            Welcome to Lumo Bites! We are dedicated to maintaining a safe, respectful, and helpful environment for pet owners, pet sitters, and the neighborhood.
          </p>
        </div>

        <div className="bg-white border border-[#E8DDD4] rounded-3xl p-8 shadow-sm space-y-8 text-left">
          
          {/* Section 1 */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-[#191919] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#8B5E3C]" />
              1. Zero Tolerance for Abusive &amp; Objectionable Content
            </h2>
            <p className="text-sm leading-relaxed pl-4">
              Lumo Bites strictly prohibits any content that is offensive, harmful, or abusive. We have a **zero-tolerance policy** for:
            </p>
            <ul className="list-disc pl-9 space-y-2 text-xs font-semibold text-gray-600">
              <li>Harassment, bullying, or personal attacks.</li>
              <li>Hate speech or discriminatory language targeting individuals or groups.</li>
              <li>Sexually explicit, violent, or otherwise objectionable content.</li>
              <li>Promotion of illegal activities or animal abuse.</li>
            </ul>
            <p className="text-sm leading-relaxed pl-4">
              Any post, comment, review, or message containing such content will be removed immediately.
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-[#191919] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#8B5E3C]" />
              2. Respectful Interactions
            </h2>
            <p className="text-sm leading-relaxed pl-4">
              Please treat all members of the Lumo Bites community with courtesy and respect. Healthy disagreements and discussions are welcome on the City Board, but threats, intimidation, or aggressive behavior will result in immediate suspension.
            </p>
          </div>

          {/* Section 3 */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-[#191919] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#8B5E3C]" />
              3. No Impersonation or Fraud
            </h2>
            <p className="text-sm leading-relaxed pl-4">
              Do not use a false identity, misrepresent your qualifications as a pet sitter, or post false lost/found pet reports. Transparency is key to maintaining trust in our network.
            </p>
          </div>

          {/* Section 4 */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-[#191919] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#8B5E3C]" />
              4. Moderation &amp; 24-Hour Review
            </h2>
            <p className="text-sm leading-relaxed pl-4">
              All reported posts and users are flagged for review by administrators. We review and take action on all reports **within 24 hours**. 
            </p>
            <p className="text-sm leading-relaxed pl-4">
              If content or accounts are found to be in violation of these guidelines, we reserve the right to:
            </p>
            <ul className="list-disc pl-9 space-y-2 text-xs font-semibold text-gray-600">
              <li>Delete the offending content immediately.</li>
              <li>Suspend or permanently terminate the user&apos;s account.</li>
              <li>Report illegal activity to appropriate law enforcement authorities.</li>
            </ul>
          </div>

          {/* Section 5 */}
          <div className="bg-[#FAF6F4] border border-[#E8DDD4] rounded-2xl p-5 flex items-start gap-3 mt-4">
            <AlertOctagon className="w-5 h-5 text-[#8B5E3C] shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-extrabold text-[#4A3E3D] uppercase tracking-wide">Reporting Violations</p>
              <p className="leading-relaxed">
                If you encounter objectionable content or abusive users, please click the <strong>Flag</strong> or <strong>Block</strong> buttons on the respective post, or contact us immediately.
              </p>
            </div>
          </div>

          {/* Contact Section */}
          <div className="border-t border-[#E8DDD4] pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <HelpCircle className="w-5 h-5 text-[#8B5E3C]" />
              <span className="text-xs font-bold text-gray-500">Need help or want to appeal a moderation decision?</span>
            </div>
            <a 
              href="mailto:info@lumobitespet.com"
              className="bg-[#8B5E3C] hover:bg-[#734A2E] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all hover:scale-[1.01]"
              style={{ textDecoration: 'none' }}
            >
              Contact Support
            </a>
          </div>

        </div>
      </main>
    </div>
  );
}
