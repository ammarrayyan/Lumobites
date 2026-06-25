import Navbar from '@/components/Navbar';

export default function PrivacyPage() {
    return (
      <div className="min-h-screen bg-[#FDFAF7] font-sans text-[#555555]">
        <Navbar />
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 24px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '8px', color: '#191919' }}>Privacy Policy</h1>
          <p style={{ color: '#888', marginBottom: '40px' }}>Last updated: June 24, 2026</p>
          
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>1. Information We Collect</h2>
          <p className="mt-2">We collect the information you provide to us, including your name, email address, location (city/zip code), and pet information (such as type, age, weight, and health needs). This includes data provided when creating a Pet Sitter profile or making a request. For pet sitters, we also collect government-issued ID documents for identity verification purposes. We also collect phone numbers for identity verification purposes via Twilio SMS verification. We collect location data (GPS coordinates) when you use the 'Use My Location' feature. We collect photos you upload including pet photos, profile photos, and sitter cover photos.</p>

          <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>2. Information We Do Not Collect</h2>
          <p className="mt-2">We do not collect social security numbers, medical records, or credit card numbers directly on our servers.</p>

          <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>2b. Analytics Data</h2>
          <p className="mt-2">We collect anonymous usage data including page views, feature usage, and app performance metrics through Google Analytics and Firebase Analytics. This data cannot be used to identify you personally and is used solely to improve our platform.</p>
          
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>3. Government ID Verification & Storage</h2>
          <p className="mt-2">We collect government-issued ID from pet sitters for identity verification purposes only. IDs are stored securely in encrypted private storage and are only accessible to Lumo Bites administrators. We do not share IDs with third parties. Sitter ID documents are retained for as long as the sitter maintains an active profile. Sitters may request deletion of their profile and documents by contacting <a href="mailto:info@lumobitespet.com" style={{ color: '#8B5E3C', fontWeight: 'bold' }}>info@lumobitespet.com</a>.</p>

          <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>4. How We Use Information</h2>
          <p className="mt-2">We use your data to connect pet sitters and pet owners, generate personalized food recommendations, and facilitate platform communication. We use Resend to send platform emails and notifications, and Stripe to securely process payments and subscriptions.</p>

          <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>4b. Phone Verification</h2>
          <p className="mt-2">Phone numbers collected for verification are processed through Twilio, a third-party SMS service provider. Your phone number is used solely for one-time identity verification before making booking requests. We do not use your phone number for marketing purposes without your explicit consent.</p>

          <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>4c. Firebase & Push Notifications</h2>
          <p className="mt-2">We use Firebase (Google) to send push notifications to your device. Device tokens used for push notifications are stored securely and used only to deliver platform notifications. You can disable push notifications at any time through your device settings.</p>

          <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>4d. Amazon Affiliate</h2>
          <p className="mt-2">Lumo Bites participates in the Amazon Associates Program. When you click on Amazon product links and make purchases, Amazon may collect data according to their privacy policy. We receive a small commission on qualifying purchases at no extra cost to you.</p>
          
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

          <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>12. Your Rights</h2>
          <p className="mt-2">Depending on your location, you may have the following rights regarding your personal data:</p>
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li>Right to access your personal data</li>
            <li>Right to correct inaccurate data</li>
            <li>Right to delete your data</li>
            <li>Right to restrict processing</li>
            <li>Right to data portability</li>
            <li>Right to object to processing</li>
          </ul>
          <p className="mt-2">To exercise any of these rights, contact us at <a href="mailto:info@lumobitespet.com" style={{ color: '#8B5E3C', fontWeight: 'bold' }}>info@lumobitespet.com</a>.</p>

          <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>13. Children's Privacy</h2>
          <p className="mt-2">Lumo Bites is not intended for use by anyone under the age of 18. We do not knowingly collect personal information from minors. If you believe a minor has provided us with personal information, please contact us immediately at <a href="mailto:info@lumobitespet.com" style={{ color: '#8B5E3C', fontWeight: 'bold' }}>info@lumobitespet.com</a> and we will delete it.</p>

          <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>14. International Users</h2>
          <p className="mt-2">Lumo Bites is operated from the United States. If you are accessing our platform from outside the United States, please be aware that your information may be transferred to, stored, and processed in the United States where our servers are located.</p>

          <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>15. Third Party Services List</h2>
          <p className="mt-2">We use the following third-party services that may process your data:</p>
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li>Stripe (payment processing) &mdash; stripe.com/privacy</li>
            <li>Twilio (SMS verification) &mdash; twilio.com/legal/privacy</li>
            <li>Firebase/Google (push notifications, analytics) &mdash; policies.google.com/privacy</li>
            <li>Supabase (database) &mdash; supabase.com/privacy</li>
            <li>Resend (email delivery) &mdash; resend.com/privacy</li>
            <li>Amazon Associates (affiliate program) &mdash; amazon.com/privacy</li>
            <li>Anthropic Claude (AI recommendations) &mdash; anthropic.com/privacy</li>
          </ul>

          <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>16. Contact Information</h2>
          <p className="mt-2">For any privacy-related questions or concerns, please contact:</p>
          <p className="mt-2 font-bold text-[#191919]">Email: <a href="mailto:info@lumobitespet.com" style={{ color: '#8B5E3C' }}>info@lumobitespet.com</a></p>
        </div>
      </div>
    );
  }
