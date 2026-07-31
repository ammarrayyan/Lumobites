export default function PrivacyPage() {
  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-[#FDFAF7] font-sans text-[#555555]">
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 24px' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '8px', color: '#191919' }}>Privacy Policy</h1>
        <p style={{ color: '#888', marginBottom: '40px' }}>Effective Date: July 24, 2026<br/>Last Updated: {currentDate}</p>

        <p className="mb-8">Lumo Bites is operated by Premier Pet Nutrition LLC ("Lumo Bites," "we," "us," or "our").</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>1. Information We Collect</h2>
        <p className="mt-2">We collect information you provide directly, including your name, email address, location (city/zip code), and pet information. This includes information provided when creating a Pet Sitter profile, a Shelter/Rescue partner account, or submitting a request or listing. For pet sitters, we also collect government-issued ID for identity verification. For Shelter/Rescue accounts, we collect organization details necessary to verify legitimacy. We collect phone numbers for identity verification and for optional SMS notification features you choose to opt into. We collect location data when you use location-based features. We collect photos you choose to upload across the platform's various features.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>2. Information We Do Not Collect</h2>
        <p className="mt-2">We do not collect social security numbers, medical records, or credit card numbers directly on our servers.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>3. Analytics Data</h2>
        <p className="mt-2">We collect anonymous usage data to understand feature usage and improve our platform. This data cannot be used to identify you personally.</p>
        
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>4. Identity & Organization Verification</h2>
        <p className="mt-2">Government ID and organization verification documents are used solely to confirm identity or legitimacy before granting certain account types. These documents are stored securely and are only accessible to authorized administrators. We do not share this information with third parties. Verification documents are retained only as long as reasonably necessary to provide the service or comply with legal obligations. You may request deletion of your verification documents by contacting us.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>5. How We Use Information</h2>
        <p className="mt-2">We use your information to operate our marketplace and community features, including connecting pet sitters with owners, connecting adopters with shelters and rescues, facilitating platform communication, and providing personalized recommendations.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>6. SMS Communications</h2>
        <p className="mt-2">We may send SMS messages for identity verification or for features you voluntarily opt into. SMS opt-in is always optional and is never required to use the core features of the platform. We may limit the number or frequency of messages sent. You may opt out at any time by following the instructions included in the message. We do not share your phone number with third parties for marketing purposes. Your phone number is used solely to deliver the SMS notifications you have opted into and for identity verification.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>7. Push Notifications</h2>
        <p className="mt-2">We use third-party notification services to deliver push notifications to your device. You may disable push notifications at any time through your device settings.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>8. Affiliate Programs</h2>
        <p className="mt-2">Lumo Bites may participate in affiliate programs, including the Amazon Associates Program. Affiliate links may appear throughout the platform. Clicking on affiliate links may result in Lumo Bites earning a commission on qualifying purchases, at no additional cost to you. Affiliate partners may collect data according to their own privacy policies.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>9. Third-Party Listings</h2>
        <p className="mt-2">Certain features display information sourced from third-party services, such as pet adoption listing providers. We do not control and are not responsible for the data practices of these third parties.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>10. AI-Powered Features</h2>
        <p className="mt-2">Lumo Bites uses artificial intelligence, including third-party AI service providers, to power certain features such as recommendations, matching, and content generation. AI-generated results are provided for informational purposes only, may not always be accurate, and should not replace independent judgment or professional advice. We work with AI service providers under agreements designed to protect user information. We do not intentionally permit AI providers to retain personal information beyond what is necessary to provide the requested service, except as described in their applicable policies.</p>
        
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>11. Data Sharing & Disclosure</h2>
        <p className="mt-2">We never sell your personal data. Information is shared only as necessary to operate the platform &mdash; for example, sharing relevant profile information between users engaging in a transaction or conversation. We may also disclose information if required by law, or to protect our legal rights, our users, or the public.</p>
        
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>12. Payment Security</h2>
        <p className="mt-2">Payment and subscription data is securely handled by our third-party payment processor. We do not store or directly process your payment card information on our servers.</p>
        
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>13. Data Storage & Security</h2>
        <p className="mt-2">Your data is stored using industry-standard encryption and security protocols. While we use reasonable safeguards to protect your information, no method of electronic storage or transmission is completely secure, and we cannot guarantee absolute security. In the event of a data breach affecting your personal information, we will notify affected users as required by applicable law.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>14. Data Retention</h2>
        <p className="mt-2">We retain personal information only as long as reasonably necessary to provide our services, comply with legal obligations, resolve disputes, and enforce our agreements.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>15. Governing Law</h2>
        <p className="mt-2">This Privacy Policy is governed by the laws of the State of Kentucky, United States.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>16. Data Deletion Requests</h2>
        <p className="mt-2">You have the right to request deletion of your account and associated personal data at any time by contacting us. Certain information may be retained where required by law or for legitimate business purposes, such as fraud prevention or resolving disputes.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>17. Cookies & Local Storage</h2>
        <p className="mt-2">We use cookies and local storage to maintain your session, remember preferences, and track referrals. We do not use cookies for cross-site advertising or tracking. You may clear cookies through your browser settings at any time.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>18. Your Privacy Rights</h2>
        <p className="mt-2">Depending on your location, you may have rights to access, correct, delete, restrict processing of, port, or object to the processing of your personal data. Residents of certain jurisdictions, including California, and users in regions covered by GDPR or similar frameworks, may have additional rights under applicable local law. To exercise any of these rights, contact us using the information below.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>19. Children's Privacy</h2>
        <p className="mt-2">Lumo Bites is not intended for use by anyone under 18. We do not knowingly collect personal information from minors. If you believe a minor has provided personal information to us, please contact us immediately so we can delete it.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>20. International Users</h2>
        <p className="mt-2">Lumo Bites is operated from the United States. If you access our platform from outside the United States, your information may be transferred to, stored, and processed in the United States.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>21. Automated Decision-Making</h2>
        <p className="mt-2">Certain features use automated systems, including AI, to generate suggestions or recommendations. These results should not be solely relied upon and do not constitute professional advice.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>22. Third-Party Services</h2>
        <p className="mt-2">We use a variety of trusted third-party services to operate the platform, which may include:</p>
        <ul className="list-disc ml-5 mt-2 space-y-1">
          <li>Stripe (payments)</li>
          <li>Twilio (SMS)</li>
          <li>Firebase (push notifications)</li>
          <li>Supabase (hosting/database)</li>
          <li>Resend (email)</li>
          <li>Amazon Associates (affiliate program)</li>
          <li>AI service providers</li>
          <li>Pet listing data providers</li>
          <li>Mapping/location providers</li>
        </ul>
        <p className="mt-2">Each of these providers maintains their own privacy policy governing their handling of data.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>23. Changes to This Privacy Policy</h2>
        <p className="mt-2">We may update this Privacy Policy from time to time. Continued use of Lumo Bites after updates constitutes acceptance of the revised policy.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>24. Related Documents</h2>
        <p className="mt-2">Your use of Lumo Bites is also governed by our <a href="/terms" style={{ color: '#8B5E3C', fontWeight: 'bold' }}>Terms of Service</a>.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>25. Contact Information</h2>
        <div className="mt-2">
          <p>Premier Pet Nutrition LLC</p>
          <p>Louisville, Kentucky, USA</p>
          <p className="font-bold text-[#191919] mt-2">Email: <a href="mailto:info@lumobitespet.com" style={{ color: '#8B5E3C' }}>info@lumobitespet.com</a></p>
        </div>
      </div>
    </div>
  );
}
