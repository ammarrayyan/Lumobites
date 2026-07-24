export default function TermsPage() {
  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-[#FDFAF7] font-sans text-[#555555]">
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 24px' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '8px', color: '#191919' }}>Terms of Service</h1>
        <p style={{ color: '#888', marginBottom: '40px' }}>Last updated: {currentDate}</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>1. Acceptance of Terms</h2>
        <p className="mt-2">By signing up or using Lumo Bites, you agree to abide by these Terms of Service.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>2. Platform Connection Disclaimer</h2>
        <p className="mt-2">Lumo Bites serves strictly as a connection platform to facilitate introductions between pet sitters and pet owners. We are not a party to any agreement or transaction between sitters and owners. Lumo Bites is a marketplace platform that connects pet owners with independent pet sitters. Lumo Bites verifies sitter identity but does not conduct criminal background checks and does not guarantee the behavior, reliability or quality of any sitter. Users engage with sitters at their own risk.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>3. Identity Verification & No Background Checks</h2>
        <p className="mt-2">While Lumo Bites conducts basic government-issued ID verification for pet sitters, we do not perform criminal background checks, background screenings, or reference checks on pet sitters or pet owners. Sitters and owners interact entirely at their own risk. It is the responsibility of both parties to vet each other appropriately.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>4. Membership Fees & Refunds</h2>
        <p className="mt-2">Membership and subscription fees (including Lumo Bites PRO and Lumo Sitter Pro) are non-refundable. However, upon cancellation, members retain full access to all PRO features until the end of their current billing period. No partial refunds are issued for unused days within a billing cycle. Shelter/Rescue accounts and Adoption features are currently offered free of charge; Lumo Bites reserves the right to introduce fees for these or any other features in the future, with advance notice to affected users.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>5. Account Removal & Zero Tolerance Policy</h2>
        <p className="mt-2">We enforce a strict zero-tolerance policy for objectionable content or abusive users. We reserve the right to remove any post, message, or review, and to immediately suspend or permanently ban any user account that violates our safety standards, engages in harassment, or demonstrates abusive behavior. Reported violations are moderated and acted upon within 24 hours.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>6. Veterinary Disclaimer</h2>
        <p className="mt-2">Our food recommendations are for informational purposes only and do not constitute veterinary advice. Always consult your veterinarian before making significant changes to your pet's diet.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>6b. FDA Recall Information Disclaimer</h2>
        <p className="mt-2">FDA recall information displayed on Lumo Bites is sourced from the FDA's public enforcement database. While we strive to keep this information current, Lumo Bites does not guarantee the completeness, accuracy, or timeliness of recall information. Users should always verify recall information directly at fda.gov. This information is provided for informational purposes only.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>6c. Pet Twin Disclaimer</h2>
        <p className="mt-2">The Pet Twin feature uses artificial intelligence to generate breed matches for entertainment purposes only. Results are not scientifically validated and do not constitute any professional assessment. Lumo Bites makes no claims about the accuracy of Pet Twin results.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>6d. Lost Pets Disclaimer</h2>
        <p className="mt-2">Lumo Bites provides a community platform for posting lost and found pet information. We do not guarantee the reunification of lost pets, the accuracy of posted information, or any specific outcome. Users post and respond to listings at their own discretion and risk.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>6e. City Board Disclaimer</h2>
        <p className="mt-2">Content posted on the City Board is user-generated and not verified by Lumo Bites. We are not responsible for the accuracy, completeness, or appropriateness of community posts. Do not rely on community advice as a substitute for professional veterinary or legal advice.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>6f. Adoption Disclaimer</h2>
        <p className="mt-2">Lumo Bites provides a platform connecting prospective adopters with local shelters/rescues and third-party listing services (including Petfinder and RescueGroups.org). Lumo Bites does not own, operate, or control any shelter or rescue organization, and is not a party to any adoption transaction. We do not guarantee the accuracy of pet listings, the outcome of any adoption, or the conduct of any shelter, rescue, or adopter. Users engage with shelters, rescues, and other users at their own discretion and risk.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>6g. Shelter/Rescue Accounts</h2>
        <p className="mt-2">Organizations registering as a Shelter/Rescue partner represent that they are a legitimate animal shelter or rescue organization and that all information provided during registration is accurate. Individuals registering a Shelter/Rescue account represent that they are at least 18 years of age and are authorized to act on behalf of the organization they represent. Lumo Bites reserves the right to approve, reject, or revoke shelter/rescue account access at its sole discretion. Shelters and rescues are solely responsible for the accuracy of their pet listings and for their own adoption processes, fees, and requirements.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>6h. AI Matching Features Disclaimer</h2>
        <p className="mt-2">The AI Lifestyle Matcher and AI Photo Visual Matcher use artificial intelligence to suggest potentially compatible pets based on user-provided preferences or photos. These matches are suggestions only, are not guaranteed to be accurate, and do not constitute professional advice regarding pet compatibility, temperament, or suitability. Users should independently verify all pet information and meet any pet in person before making an adoption decision.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>7. Governing Law</h2>
        <p className="mt-2">These Terms of Service and any separate agreements whereby we provide you services shall be governed by and construed in accordance with the laws of the state of Kentucky, United States.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>8. User Conduct & Content Moderation</h2>
        <p className="mt-2">Users must not post false or misleading information, harass other users, post objectionable or abusive content, use the platform for illegal purposes, post fraudulent adoption listings or shelter registrations, or attempt to bypass the membership system. Lumo Bites actively moderates community content, and we reserve the absolute right to remove content and ban users violating these conduct rules within 24 hours of a report.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>9. Age Requirement</h2>
        <p className="mt-2">You must be at least 18 years old to use Lumo Bites. By using this platform you confirm you are 18 or older.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>10. Sitter Independence</h2>
        <p className="mt-2">All sitters on Lumo Bites are independent contractors and not employees or agents of Lumo Bites. Sitters are independent individuals, and Lumo Bites does not endorse, recommend, or guarantee any sitter listed on the platform.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>11. Pet Owner Responsibility</h2>
        <p className="mt-2">Pet owners are solely responsible for the behavior of their pets. Any damage, injury, or loss caused by a pet during a sitting arrangement is the sole responsibility of the pet owner.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>12. Insurance</h2>
        <p className="mt-2">Lumo Bites does not provide insurance for any pet sitting arrangements. Both sitters and pet owners are strongly encouraged to obtain appropriate insurance coverage before engaging in any arrangement.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>13. Limitation of Liability</h2>
        <p className="mt-2">To the fullest extent permitted by law, Lumo Bites shall not be liable for any direct, indirect, incidental, or consequential damages arising from use of the platform including but not limited to pet injury, death, property damage, or personal injury. Lumo Bites is not liable for any damage, injury, loss or harm caused by or resulting from interactions between pet owners, sitters, adopters, and shelters/rescues.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>13b. Platform Provided As-Is</h2>
        <p className="mt-2">Lumo Bites is provided 'as-is' and 'as available' without warranties of any kind, either express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, or non-infringement.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>13c. Class Action Waiver</h2>
        <p className="mt-2">To the extent permitted by applicable law, you waive your right to participate as a plaintiff or class member in any purported class action lawsuit, class-wide arbitration, or any other representative proceeding against Lumo Bites.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>14. Indemnification</h2>
        <p className="mt-2">You agree to indemnify and hold harmless Lumo Bites from any claims, damages, or expenses arising from your use of the platform, your interactions with other users, or your violation of these Terms.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>15. Termination</h2>
        <p className="mt-2">Users may delete their account at any time. Lumo Bites reserves the right to terminate any account without notice for violations of these Terms. Outstanding subscription fees are non-refundable upon termination.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>16. Dispute Resolution</h2>
        <p className="mt-2">Any disputes between sitters, pet owners, adopters, and shelters/rescues are solely between those parties. Lumo Bites is not responsible for resolving user disputes. For disputes with Lumo Bites directly contact <a href="mailto:info@lumobitespet.com" style={{ color: '#8B5E3C', fontWeight: 'bold' }}>info@lumobitespet.com</a>.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>17. Changes to Terms</h2>
        <p className="mt-2">We reserve the right to update these Terms at any time. Users will be notified of significant changes via email. Continued use after changes constitutes acceptance. By continuing to use Lumo Bites after any changes to these Terms, you acknowledge and agree to be bound by the updated Terms.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>18. Data Collection & Cookies</h2>
        <p className="mt-2">Lumo Bites collects personal information including email addresses and government-issued ID documents as described in our Privacy Policy. By using the platform you consent to this data collection. For full details visit <a href="/privacy" style={{ color: '#8B5E3C', fontWeight: 'bold' }}>lumobites.net/privacy</a>.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>19. SMS Communications</h2>
        <p className="mt-2">By providing your phone number for identity verification, you consent to receiving SMS messages from Lumo Bites via our SMS service provider (Twilio) for account security purposes. Standard carrier message and data rates may apply.</p>
        <p className="mt-2">Separately, users who post a lost or found pet report may optionally provide their phone number and opt in to receive SMS alerts when a possible match (70%+ similarity, within 10 miles) is found for their reported pet, limited to a maximum of 3 alerts per day. This opt-in is entirely voluntary and is not required to submit a lost or found pet report. Users may reply STOP at any time to unsubscribe from these alerts. Phone numbers collected for either purpose will not be used for marketing without explicit separate consent.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>20. Third Party Services</h2>
        <p className="mt-2">Lumo Bites integrates with third-party services including but not limited to Stripe (payments), Twilio (SMS), Firebase (notifications), Amazon (product recommendations), Petfinder and RescueGroups.org (adoptable pet listings), and Anthropic (AI-powered matching and content features). Your use of these services is subject to their respective terms of service and privacy policies. Lumo Bites is not responsible for the practices of these third-party providers.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>21. User-Generated Content License</h2>
        <p className="mt-2">By posting any photo, text, or other content on Lumo Bites (including lost/found pet posts, Pet Twin images, adoption listings, reviews, and City Board posts), you grant Lumo Bites a non-exclusive, royalty-free, worldwide license to display, reproduce, and distribute that content within the platform for the purpose of operating our services. You represent that you own or have the right to share any content you post.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>22. Amazon Affiliate Disclosure</h2>
        <p className="mt-2">Lumo Bites participates in the Amazon Associates affiliate program. Some product links on the platform may earn Lumo Bites a commission on qualifying purchases, at no additional cost to you. Product recommendations are provided for informational purposes and do not constitute an endorsement or guarantee of any product's quality or safety.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>23. Copyright Complaints</h2>
        <p className="mt-2">If you believe content on Lumo Bites infringes your copyright, please contact <a href="mailto:info@lumobitespet.com" style={{ color: '#8B5E3C', fontWeight: 'bold' }}>info@lumobitespet.com</a> with a description of the material and your ownership claim. We will review and remove infringing content as appropriate.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>24. Location Data</h2>
        <p className="mt-2">Certain features (including Lost Pets, Pet Sitting, and Adoption search) may request access to your device's location to provide location-based results. Location access is optional and can be declined; declining may limit certain search functionality.</p>
      </div>
    </div>
  );
}
