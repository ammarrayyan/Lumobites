export default function TermsPage() {
  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-[#FDFAF7] font-sans text-[#555555]">
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 24px' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '8px', color: '#191919' }}>Terms of Service</h1>
        <p style={{ color: '#888', marginBottom: '40px' }}>Effective Date: July 24, 2026<br/>Last Updated: {currentDate}</p>

        <p className="mb-8">Lumo Bites is operated by Premier Pet Nutrition LLC ("Lumo Bites," "we," "us," or "our").</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>1. Acceptance of Terms</h2>
        <p className="mt-2">By signing up or using Lumo Bites, you agree to abide by these Terms of Service.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>2. Marketplace & Connection Disclaimer</h2>
        <p className="mt-2">Lumo Bites is a platform that facilitates connections and information coordination between pet owners, pet sitters, veterinary boarding facilities, pet daycares, adopters, and animal shelters/rescues. We are not a party to any agreement or transaction between users. Lumo Bites does not inspect homes, facilities, pets, shelters, or sitters, and does not guarantee the behavior, reliability, quality, or outcome of any interaction between users. Users engage with one another at their own risk.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>3. Identity & Organization Verification</h2>
        <p className="mt-2">While Lumo Bites may verify certain identity or organizational information for select account types, we do not perform criminal background checks, background screenings, or reference checks. It is the responsibility of all parties to exercise appropriate judgment and vet one another as they see fit.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>4. Membership Fees & Subscriptions</h2>
        <p className="mt-2">Membership and subscription fees are non-refundable, though members retain access to paid features through the end of their current billing period upon cancellation. Subscription renewals continue automatically until canceled. Users may cancel at any time through their App Store, Google Play, or Stripe billing settings, as applicable. Certain features may currently be offered free of charge; Lumo Bites reserves the right to introduce or change fees, or booking/marketplace charges, for any feature in the future, with reasonable advance notice where required.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>5. Payments Between Users</h2>
        <p className="mt-2">Where Lumo Bites facilitates payments between users (such as pet sitting bookings) through a third-party payment processor, Lumo Bites is not responsible for disputes between users regarding those payments, beyond facilitating the technical transaction.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>6. Account Removal & Content Moderation</h2>
        <p className="mt-2">We enforce a zero-tolerance policy for objectionable content or abusive behavior. We reserve the right to remove any post, message, or review, and to suspend or terminate any account that violates our safety standards or these Terms. Reports are reviewed and addressed within a reasonable time.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>7. Feature-Specific Disclaimers</h2>
        <p className="mt-2">Certain features are provided for informational, coordination, or entertainment purposes and do not constitute professional advice (including but not limited to veterinary, nutritional, or legal advice). This includes features such as ingredient and food analysis, breed/appearance matching, recall alerts, lost pet reunification tools, adoption matching, and user-generated pet profile records or emergency QR passports. Lumo Bites does not guarantee the accuracy of user-submitted care notes or any particular outcome from platform features.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>8. AI-Powered Features & Usage Limits</h2>
        <p className="mt-2">Lumo Bites uses artificial intelligence to power certain features (including ingredient safety analysis, photo food scanner, pet twin matcher, lost pet photo search, sitter search, and adoption matcher). Standard free accounts (pet owners and sitters without an active subscription or partner plan) receive 2 total lifetime complimentary AI uses across all interactive AI tools. Lumo Bites Membership ($4.99/month recurring) and active Partner Subscriptions (Veterinary Boarding, Pet Daycare, and Animal Shelters) automatically include 5 AI uses per 24-hour rolling period. AI-generated results are provided for informational purposes only, may not always be accurate, and should not replace independent judgment or professional advice.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>9. Beta & Experimental Features; No Guarantee of Availability</h2>
        <p className="mt-2">Certain features may be offered on an experimental or beta basis. Features may be modified, suspended, or discontinued at any time without liability.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>10. Organization Accounts</h2>
        <p className="mt-2">Organizations registering an account (such as a Shelter/Rescue partner, Veterinary Clinic, or Pet Daycare) represent that they are a legitimate organization and that the information provided is accurate. Individuals registering on behalf of an organization represent that they are authorized to do so and are at least 18 years old. Lumo Bites reserves the right to approve, reject, or revoke any organization account at its sole discretion.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>11. Governing Law & Venue</h2>
        <p className="mt-2">These Terms are governed by the laws of the State of Kentucky, United States. Any legal action arising under these Terms shall be brought exclusively in the state or federal courts located in Jefferson County, Kentucky, unless otherwise required by applicable law.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>12. User Conduct</h2>
        <p className="mt-2">Users must not post false or misleading information, harass others, post objectionable content, use the platform for unlawful purposes, post fraudulent listings, or attempt to circumvent the platform's systems or membership requirements. We reserve the right to remove content and take action against accounts that violate these rules.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>13. User-Generated Content License</h2>
        <p className="mt-2">By posting any photo, text, or other content on Lumo Bites &mdash; including lost/found pet posts, adoption listings, reviews, community board posts, and profile images &mdash; you grant Lumo Bites a non-exclusive, royalty-free license to use, display, reproduce, and distribute that content solely for the purpose of operating, improving, and promoting the platform, including in marketing and social media. You represent that you own or have the right to share any content you post.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>14. Copyright Complaints</h2>
        <p className="mt-2">If you believe content on Lumo Bites infringes your copyright, please contact us with a description of the material and your ownership claim. We will review and remove infringing content as appropriate.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>15. Reverse Engineering & Automated Access</h2>
        <p className="mt-2">Users may not scrape, reverse engineer, copy, automate access to, interfere with, or attempt to bypass the security of the platform.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>16. Account Security</h2>
        <p className="mt-2">You are responsible for maintaining the confidentiality of your login credentials and for all activity occurring under your account.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>17. Age Requirement</h2>
        <p className="mt-2">You must be at least 18 years old to use Lumo Bites.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>18. Independent Parties</h2>
        <p className="mt-2">Sitters, care providers, adopters, shelters, rescues, and all other users interacting through the platform are independent parties. They are not employees or agents of Lumo Bites, and Lumo Bites does not endorse, recommend, or guarantee any user or organization listed on the platform.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>19. Responsibility for Pets, Care Notes & Property</h2>
        <p className="mt-2">Pet owners are solely responsible for the health, behavior, and care of their pets, and for ensuring that all care instructions, dietary requirements, medications, and emergency contacts submitted to the platform are accurate, complete, and up-to-date. Any damage, injury, or loss occurring during an arrangement facilitated through the platform is the sole responsibility of the relevant parties involved.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>20. Insurance</h2>
        <p className="mt-2">Lumo Bites does not provide insurance for any arrangement facilitated through the platform. Users are encouraged to obtain appropriate insurance coverage independently.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>21. Location Data</h2>
        <p className="mt-2">Certain features require access to your device's location to function. Declining location permission may limit certain functionality.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>22. Limitation of Liability</h2>
        <p className="mt-2">To the fullest extent permitted by law, Lumo Bites is not liable for any direct, indirect, incidental, or consequential damages arising from use of the platform or interactions between users.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>23. Platform Provided As-Is; Availability</h2>
        <p className="mt-2">Lumo Bites is provided "as-is" and "as available," without warranties of any kind. We do not guarantee uninterrupted or error-free service.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>24. Class Action Waiver</h2>
        <p className="mt-2">To the extent permitted by law, you waive your right to participate in a class action, class-wide arbitration, or representative proceeding against Lumo Bites.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>25. Indemnification</h2>
        <p className="mt-2">You agree to indemnify and hold harmless Lumo Bites from claims, damages, or expenses arising from your use of the platform or violation of these Terms.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>26. Termination</h2>
        <p className="mt-2">You may delete your account at any time. Lumo Bites reserves the right to terminate any account for violation of these Terms. Outstanding fees are non-refundable upon termination.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>27. Dispute Resolution</h2>
        <p className="mt-2">Disputes between users are solely between those parties. For disputes with Lumo Bites directly, contact us using the information below.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>28. Electronic Communications</h2>
        <p className="mt-2">By using the platform, you agree to receive electronic communications from us, including emails, in-app notifications, and SMS messages you have opted into. You agree that these communications satisfy any legal requirement that such communication be in writing.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>29. SMS Messaging Program</h2>
        <p className="mt-2">By opting in to receive SMS messages from Lumo Bites, you agree to receive text messages related to lost/found pet match alerts, pet sitting booking confirmations, and account notifications. Message frequency varies and may be up to several messages per week depending on your activity and preferences. Message and data rates may apply. Reply <strong>STOP</strong> at any time to cancel; you will receive one final message confirming your opt-out. Reply <strong>HELP</strong> for help, or contact us at info@lumobitespet.com. Carriers are not liable for delayed or undelivered messages.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>30. Taxes</h2>
        <p className="mt-2">Users who receive payment through the platform (such as pet sitters) are solely responsible for reporting and paying any applicable taxes on their earnings.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>31. Intellectual Property</h2>
        <p className="mt-2">Lumo Bites owns all trademarks, logos, software, branding, code, and platform content. Users may not copy, reproduce, or redistribute this material without permission.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>32. Force Majeure</h2>
        <p className="mt-2">Lumo Bites is not liable for any failure or delay in performance resulting from causes beyond our reasonable control, including outages of third-party service providers, natural disasters, or other events beyond our control.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>33. App Store Disclaimer</h2>
        <p className="mt-2">Apple, Google, and their respective app stores are not responsible for the operation, maintenance, or support of Lumo Bites.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>34. Export Compliance</h2>
        <p className="mt-2">You may not use the platform where prohibited by applicable law or export control regulations.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>35. Third-Party Services</h2>
        <p className="mt-2">Lumo Bites integrates with a variety of third-party services to operate the platform, which may include payment processing, SMS delivery, notification services, database hosting, email delivery, affiliate programs, AI service providers, and pet listing data providers. Your use of these integrated services is subject to their respective terms and privacy policies. Lumo Bites is not responsible for the practices of these third parties.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>36. Feature Evolution & Terms Updates</h2>
        <p className="mt-2">We may update these Terms from time to time as new features, services, or regulatory requirements are introduced. Users will be notified of significant changes. Continued use of Lumo Bites after changes are posted constitutes acceptance of the updated Terms.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>37. Entire Agreement</h2>
        <p className="mt-2">These Terms constitute the entire agreement between you and Lumo Bites regarding your use of the platform.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>38. Severability</h2>
        <p className="mt-2">If any provision of these Terms is found invalid or unenforceable, the remaining provisions will remain in full force and effect.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>39. Waiver</h2>
        <p className="mt-2">Failure to enforce any provision of these Terms does not constitute a waiver of that provision or any other.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>40. Assignment</h2>
        <p className="mt-2">Lumo Bites may assign these Terms in connection with a merger, acquisition, or sale of assets.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>41. Survival</h2>
        <p className="mt-2">Provisions relating to liability, intellectual property, and indemnification survive termination of your account or these Terms.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>42. Related Documents</h2>
        <p className="mt-2">Please review our <a href="/privacy" style={{ color: '#8B5E3C', fontWeight: 'bold' }}>Privacy Policy</a> to understand how we collect and use your information.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>43. Legal Notice & Disclaimer</h2>
        <p className="mt-2">These Terms are provided for operational clarity and transparency regarding platform rules and do not substitute for formal legal advice. Platform operators and stakeholders should consult qualified legal counsel for binding legal advice.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>44. Contact Information</h2>
        <div className="mt-2">
          <p>Premier Pet Nutrition LLC</p>
          <p>Louisville, Kentucky, USA</p>
          <p className="font-bold text-[#191919] mt-2">Email: <a href="mailto:info@lumobitespet.com" style={{ color: '#8B5E3C' }}>info@lumobitespet.com</a></p>
        </div>
      </div>
    </div>
  );
}
