import Navbar from '@/components/Navbar';

export default function PrivacyPage() {
    return (
      <div className="min-h-screen bg-[#FDFAF7] font-sans text-[#555555]">
        <Navbar />
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 24px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '8px', color: '#191919' }}>Privacy Policy</h1>
          <p style={{ color: '#888', marginBottom: '40px' }}>Last updated: May 23, 2026</p>
          
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>1. Information We Collect</h2>
          <p className="mt-2">We collect the information you provide to us, including your name, email address, location (city/zip code), and pet information (such as type, age, weight, and health needs). This includes data provided when creating a Pet Sitter profile or making a request.</p>

          <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>2. Information We Do Not Collect</h2>
          <p className="mt-2">We do not collect social security numbers, government IDs, medical records, or financial account numbers.</p>
          
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>3. How We Use Information</h2>
          <p className="mt-2">We use your data to connect pet sitters and pet owners, generate personalized food recommendations, and facilitate platform communication. We use Resend to send platform emails and notifications, and Stripe to securely process payments and subscriptions.</p>
          
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>4. AI & Automated Decision-Making</h2>
          <p className="mt-2">We use Anthropic Claude AI to generate pet food recommendations and breed detection. No personal data is permanently stored by the AI.</p>
          
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>5. Data Sharing & Sales</h2>
          <p className="mt-2"><strong>We never sell your personal data.</strong> Your information is only shared as necessary to operate the platform (for example, showing a sitter's profile to local owners).</p>
          
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>6. Payment Security</h2>
          <p className="mt-2">All payment and subscription data is securely handled by Stripe. We never store or directly process your credit card information on our servers.</p>
          
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>7. Data Storage & Breach Notification</h2>
          <p className="mt-2">Your user data and profiles are securely stored using Supabase, which employs industry-standard encryption and security protocols. In the event of a data breach affecting your personal information we will notify affected users via email as soon as reasonably possible.</p>

          <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>8. Governing Law</h2>
          <p className="mt-2">This Privacy Policy is governed by the laws of the State of Kentucky, United States.</p>

          <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>9. Data Deletion Requests</h2>
          <p className="mt-2">You have the right to request the deletion of your account and all associated personal data. To request data deletion, please email us at <a href="mailto:info@lumobitespet.com" style={{ color: '#8B5E3C', fontWeight: 'bold' }}>info@lumobitespet.com</a>.</p>
        </div>
      </div>
    );
  }
