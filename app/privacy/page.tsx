export default function PrivacyPage() {
  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-[#FDFAF7] font-sans text-[#555555]">
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 24px' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '8px', color: '#191919' }}>Privacy Policy</h1>
        <p style={{ color: '#888', marginBottom: '40px' }}>Effective Date: July 24, 2026<br/>Last Updated: {currentDate}</p>

        <p className="mb-8">Lumo Bites is operated by Premier Pet Nutrition LLC ("Lumo Bites," "we," "us," or "our").</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>1. Information We Collect</h2>
        <p className="mt-2">We collect information you provide directly or that is generated through your use of the platform. This falls into several general categories:</p>
        <ul className="list-disc ml-5 mt-2 space-y-1">
          <li><strong>Account & Contact Information:</strong> Name, email address, phone number (for verification or SMS alerts), and general location (city/zip code).</li>
          <li><strong>Pet Care & Identification Data:</strong> Pet details including names, species, breeds, physical traits, photos, microchip numbers, dietary instructions, vaccination dates, medication schedules, behavioral notes, and emergency veterinary contacts provided by pet owners.</li>
          <li><strong>Service & Partner Profile Data:</strong> Information submitted by pet sitters, veterinary clinics, pet daycares, and animal shelters/rescues to establish public profiles, service offerings, rates, and availability.</li>
          <li><strong>Verification Documents:</strong> Government-issued ID or organization registration documentation submitted for identity or partner verification.</li>
          <li><strong>Platform Activity & Media:</strong> Messages, community posts, replies, reviews, lost/found pet reports, photos, and AI feature usage logs.</li>
        </ul>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>2. Information We Do Not Collect</h2>
        <p className="mt-2">We do not collect government social security numbers, human medical records, or credit card numbers directly on our servers. All payment processing is handled securely by our third-party payment processor. Pet health, care, and dietary notes stored on the platform are voluntary and managed directly by the user for pet care coordination.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>3. Analytics Data</h2>
        <p className="mt-2">We collect anonymous usage data to understand feature usage and improve our platform. This data cannot be used to identify you personally.</p>
        
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>4. Identity & Organization Verification</h2>
        <p className="mt-2">Government ID and organization verification documents are used solely to confirm identity or legitimacy before granting certain account types. These documents are stored securely and are only accessible to authorized administrators. We do not share this information with third parties. Verification documents are retained only as long as reasonably necessary to provide the service or comply with legal obligations. You may request deletion of your verification documents by contacting us.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>5. How We Use & Share Information</h2>
        <p className="mt-2">We use collected information to operate our marketplace, community, and care coordination features. Information is shared only as necessary to facilitate requested platform interactions:</p>
        <ul className="list-disc ml-5 mt-2 space-y-1">
          <li><strong>Service Bookings & Inquiries:</strong> Connecting pet owners with pet sitters, veterinary boarding facilities, pet daycares, and animal shelters, including sharing necessary pet care notes and emergency contacts with chosen care providers.</li>
          <li><strong>Public Profiles & QR Passports:</strong> Information designated for public sharing (such as Sitter Profile Posters or Pet Emergency QR Cards) is accessible to individuals who view the profile or scan the associated QR code.</li>
          <li><strong>Community & Reunification:</strong> Displaying community board discussions, lost pet alerts, and adoption listings to help connect local pet parents and shelters.</li>
        </ul>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>6. SMS Communications</h2>
        <p className="mt-2">We may send SMS messages for identity verification or for features you voluntarily opt into. SMS opt-in is always optional and is never required to use the core features of the platform. We may limit the number or frequency of messages sent. You may opt out at any time by following the instructions included in the message. We do not share your phone number with third parties for marketing purposes. Your phone number is used solely to deliver the SMS notifications you have opted into and for identity verification.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>7. Push Notifications</h2>
        <p className="mt-2">We use third-party notification services to deliver push notifications to your device. You may disable push notifications at any time through your device settings.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>8. Affiliate Programs</h2>
        <p className="mt-2">Lumo Bites may participate in affiliate programs, including the Amazon Associates Program. Affiliate links may appear throughout the platform. Clicking on affiliate links may result in Lumo Bites earning a commission on qualifying purchases, at no additional cost to you. Affiliate partners may collect data according to their own privacy policies.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>9. Third-Party Listings</h2>
        <p className="mt-2">Certain features display information sourced from third-party services, such as pet adoption listing providers. We do not control and are not responsible for the data practices of these third parties.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>10. AI-Powered Features & Usage Logs</h2>
        <p className="mt-2">Lumo Bites uses artificial intelligence, including third-party AI service providers, to power certain features such as ingredient safety recommendations, pet photo matching, and adoption search. To deliver these features and enforce account tier limits, we record usage logs (including feature type, timestamp, estimated API cost, and your normalized account identifier or IP address). AI-generated results are provided for informational purposes only, may not always be accurate, and should not replace independent judgment or professional advice.</p>
        
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
        <p className="mt-2">You have the right to request deletion of your account and associated personal data at any time by visiting our <a href="/account-deletion" style={{ color: '#8B5E3C', fontWeight: 'bold' }}>Account Deletion page</a> or by contacting us directly. Certain information may be retained where required by law or for legitimate business purposes, such as tax records, fraud prevention, or resolving disputes.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>17. Cookies, Local Storage & Tracking Technologies</h2>
        <p className="mt-2">We use cookies, browser local storage, and standard web tracking technologies to operate the platform and deliver essential features. Specifically:</p>
        <ul className="list-disc ml-5 mt-2 space-y-1">
          <li><strong>Essential & Authentication Storage:</strong> We use first-party browser local storage and session cookies to authenticate users and partners, maintain active sign-in sessions across page reloads, and remember user preferences (such as selected city filters).</li>
          <li><strong>Web Analytics:</strong> We use Google Analytics (via Google Tag Manager) and server-level hosting performance metrics to collect aggregate, non-personally identifiable traffic information (such as pages visited, general device/browser type, session duration, and approximate geographic region). This information is used exclusively to evaluate site performance, diagnose technical errors, and optimize user experience.</li>
          <li><strong>Referral Attribution:</strong> We use local storage identifiers to properly credit affiliate partners and community referral links when a new user registers.</li>
          <li><strong>No Cross-Site Ad Tracking:</strong> We do not sell user data to third-party data brokers or use third-party advertising cookies to track your behavior across unrelated third-party websites.</li>
        </ul>
        <p className="mt-2">You can instruct your browser to block or alert you about cookies, or clear local storage through your browser settings at any time; however, disabling essential storage may affect your ability to stay signed in or use certain interactive platform features.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>18. Your Privacy Rights</h2>
        <p className="mt-2">Depending on your location, you may have rights to access, correct, delete, restrict processing of, port, or object to the processing of your personal data. Residents of certain jurisdictions, including California, and users in regions covered by GDPR or similar frameworks, may have additional rights under applicable local law. To exercise any of these rights, contact us using the information below.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>19. Children's Privacy (COPPA & Minor Protection)</h2>
        <p className="mt-2">Lumo Bites is intended solely for adults and is not directed to children under the age of 13 (or minors under 18). We do not knowingly collect, solicit, or maintain personal information from children under 13. In the event that we learn that a child under 13 has provided personal data to the platform without verified parental consent, we will promptly delete that information from our servers and active databases. If you are a parent or legal guardian and believe that your child has provided us with personal information, please contact us immediately at <a href="mailto:info@lumobitespet.com" style={{ color: '#8B5E3C', fontWeight: 'bold' }}>info@lumobitespet.com</a> so we can take immediate corrective action.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>20. International Users</h2>
        <p className="mt-2">Lumo Bites is operated from the United States. If you access our platform from outside the United States, your information may be transferred to, stored, and processed in the United States.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>21. Automated Decision-Making</h2>
        <p className="mt-2">Certain features use automated systems, including AI, to generate suggestions or recommendations. These results should not be solely relied upon and do not constitute professional advice.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>22. Third-Party Services</h2>
        <p className="mt-2">We use a variety of trusted third-party services to operate the platform, which may include payment processors, SMS providers, notification services, database hosting, email delivery, affiliate programs, AI providers, and mapping providers. Each of these providers maintains their own privacy policy governing their handling of data.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>23. Feature Evolution & Policy Updates</h2>
        <p className="mt-2">As Lumo Bites introduces new features, services, and integrations, our information practices may be updated. We reserve the right to update this Privacy Policy at any time. Continued use of Lumo Bites following any updates constitutes your acknowledgment and acceptance of the revised policy.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>24. Related Documents</h2>
        <p className="mt-2">Your use of Lumo Bites is also governed by our <a href="/terms" style={{ color: '#8B5E3C', fontWeight: 'bold' }}>Terms of Service</a>.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>25. Legal Notice & Disclaimer</h2>
        <p className="mt-2">This document is provided for operational transparency and informational purposes regarding platform practices. It does not constitute formal legal counsel. Users and stakeholders are encouraged to consult qualified legal counsel for binding legal advice.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>26. Contact Information</h2>
        <div className="mt-2">
          <p>Premier Pet Nutrition LLC</p>
          <p>Louisville, Kentucky, USA</p>
          <p className="font-bold text-[#191919] mt-2">Email: <a href="mailto:info@lumobitespet.com" style={{ color: '#8B5E3C' }}>info@lumobitespet.com</a></p>
        </div>
      </div>
    </div>
  );
}
