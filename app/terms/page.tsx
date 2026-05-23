import Navbar from '@/components/Navbar';

export default function TermsPage() {
    return (
      <div className="min-h-screen bg-[#FDFAF7] font-sans text-[#555555]">
        <Navbar />
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 24px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '8px', color: '#191919' }}>Terms of Service</h1>
          <p style={{ color: '#888', marginBottom: '40px' }}>Last updated: May 23, 2026</p>
          
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>1. Acceptance of Terms</h2>
          <p className="mt-2">By signing up or using Lumo Bites, you agree to abide by these Terms of Service.</p>
          
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>2. Platform Connection Disclaimer</h2>
          <p className="mt-2">Lumo Bites serves strictly as a connection platform to facilitate introductions between pet sitters and pet owners. We are not a party to any agreement or transaction between sitters and owners. Lumo Bites is not liable for any incidents, damages, injuries, or losses that may occur between sitters and pet owners.</p>
          
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>3. No Background Checks</h2>
          <p className="mt-2">We do not perform background checks, reference checks, or verifications on pet sitters or pet owners. Sitters and owners interact entirely at their own risk. It is the responsibility of both parties to vet each other appropriately.</p>

          <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>4. Membership Fees & Refunds</h2>
          <p className="mt-2">Membership and subscription fees (including Lumo Bites PRO and Lumo Sitter Pro) are non-refundable after 7 days from the initial charge date.</p>

          <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>5. Account Removal</h2>
          <p className="mt-2">We reserve the right to suspend or permanently remove any profile or account that violates our standards, engages in fraudulent activity, or demonstrates unsafe behavior, at our sole discretion.</p>

          <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>6. Veterinary Disclaimer</h2>
          <p className="mt-2">Our food recommendations are for informational purposes only and do not constitute veterinary advice. Always consult your veterinarian before making significant changes to your pet's diet.</p>

          <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>7. Governing Law</h2>
          <p className="mt-2">These Terms of Service and any separate agreements whereby we provide you services shall be governed by and construed in accordance with the laws of the state of Kentucky, United States.</p>

          <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>8. User Conduct</h2>
          <p className="mt-2">Users must not post false or misleading information, harass other users, use the platform for illegal purposes, or attempt to bypass the membership system. Violations may result in immediate account removal without refund.</p>

          <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>9. Age Requirement</h2>
          <p className="mt-2">You must be at least 18 years old to use Lumo Bites. By using this platform you confirm you are 18 or older.</p>

          <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>10. Sitter Independence</h2>
          <p className="mt-2">Sitters are independent individuals and not employees, agents, or contractors of Lumo Bites. Lumo Bites does not endorse, recommend, or guarantee any sitter listed on the platform.</p>

          <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>11. Pet Owner Responsibility</h2>
          <p className="mt-2">Pet owners are solely responsible for the behavior of their pets. Any damage, injury, or loss caused by a pet during a sitting arrangement is the sole responsibility of the pet owner.</p>

          <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>12. Insurance</h2>
          <p className="mt-2">Lumo Bites does not provide insurance for any pet sitting arrangements. Both sitters and pet owners are strongly encouraged to obtain appropriate insurance coverage before engaging in any arrangement.</p>

          <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>13. Limitation of Liability</h2>
          <p className="mt-2">To the fullest extent permitted by law, Lumo Bites shall not be liable for any direct, indirect, incidental, or consequential damages arising from use of the platform including but not limited to pet injury, death, property damage, or personal injury.</p>

          <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>14. Indemnification</h2>
          <p className="mt-2">You agree to indemnify and hold harmless Lumo Bites from any claims, damages, or expenses arising from your use of the platform, your interactions with other users, or your violation of these Terms.</p>

          <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>15. Termination</h2>
          <p className="mt-2">Users may delete their account at any time. Lumo Bites reserves the right to terminate any account without notice for violations of these Terms. Outstanding subscription fees are non-refundable upon termination.</p>

          <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>16. Dispute Resolution</h2>
          <p className="mt-2">Any disputes between sitters and pet owners are solely between those parties. Lumo Bites is not responsible for resolving user disputes. For disputes with Lumo Bites directly contact <a href="mailto:info@lumobitespet.com" style={{ color: '#8B5E3C', fontWeight: 'bold' }}>info@lumobitespet.com</a>.</p>

          <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '32px', color: '#191919' }}>17. Changes to Terms</h2>
          <p className="mt-2">We reserve the right to update these Terms at any time. Users will be notified of significant changes via email. Continued use after changes constitutes acceptance.</p>
        </div>
      </div>
    );
  }
