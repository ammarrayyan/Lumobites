import Navbar from '@/components/Navbar';

export default function PrivacyPage() {
    return (
      <div className="min-h-screen bg-[#FDFAF7] font-sans text-[#555555]">
        <Navbar />
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 24px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '8px', color: '#191919' }}>Privacy Policy</h1>
          <p style={{ color: '#888', marginBottom: '40px' }}>Last updated: June 1, 2026</p>
          
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>1. Information We Collect</h2>
          <p className="mt-2">We collect the information you provide to us, including your name, email address, location (city/zip code), and pet information (such as type, age, weight, and health needs). This includes data provided when creating a Pet Sitter profile or making a request. For pet sitters, we also collect government-issued ID documents for identity verification purposes.</p>

          <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>2. Information We Do Not Collect</h2>
          <p className="mt-2">We do not collect social security numbers, medical records, or credit card numbers directly on our servers.</p>
          
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>3. Government ID Verification & Storage</h2>
          <p className="mt-2">We collect government-issued ID from pet sitters for identity verification purposes only. IDs are stored securely in encrypted private storage and are only accessible to Lumo Bites administrators. We do not share IDs with third parties. Sitter ID documents are retained for as long as the sitter maintains an active profile. Sitters may request deletion of their profile and documents by contacting <a href="mailto:info@lumobitespet.com" style={{ color: '#8B5E3C', fontWeight: 'bold' }}>info@lumobitespet.com</a>.</p>

          <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>4. How We Use Information</h2>
          <p className="mt-2">We use your data to connect pet sitters and pet owners, generate personalized food recommendations, and facilitate platform communication. We use Resend to send platform emails and notifications, and Stripe to securely process payments and subscriptions.</p>
          
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>5. AI & Automated Decision-Making</h2>
          <p className="mt-2">We use Anthropic Claude AI to generate pet food recommendations and breed detection. No personal data is permanently stored by the AI.</p>
          
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>6. Data Sharing & Sales</h2>
          <p className="mt-2"><strong>We never sell your personal data.</strong> Your information is only shared as necessary to operate the platform (for example, showing a sitter's profile to local owners).</p>
          
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>7. Payment Security</h2>
          <p className="mt-2">All payment and subscription data is securely handled by Stripe. We never store or directly process your credit card information on our servers.</p>
          
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>8. Data Storage & Breach Notification</h2>
          <p className="mt-2">Your user data and profiles are securely stored using Supabase, which employs industry-standard encryption and security protocols. All ID documents are stored in encrypted private storage accessible only to authorized administrators. In the event of a data breach affecting your personal information we will notify affected users via email as soon as reasonably possible.</p>

          <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>9. Governing Law</h2>
          <p className="mt-2">This Privacy Policy is governed by the laws of the State of Kentucky, United States.</p>

          <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>10. Data Deletion Requests</h2>
          <p className="mt-2">You have the right to request the deletion of your account and all associated personal data. To request data deletion, please email us at <a href="mailto:info@lumobitespet.com" style={{ color: '#8B5E3C', fontWeight: 'bold' }}>info@lumobitespet.com</a>.</p>

          <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>11. Cookies & Local Storage</h2>
          <p className="mt-2">Lumo Bites uses browser cookies and local storage to maintain your session, remember your preferences, and track referral links. We do not use cookies for advertising or tracking across third party websites. You can clear cookies and local storage at any time through your browser settings.</p>
        </div>
      </div>
    );
  }
