import Navbar from '@/components/Navbar';

export default function TermsPage() {
    return (
      <div className="min-h-screen bg-[#FDFAF7] font-sans text-[#555555]">
        <Navbar />
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 24px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '8px', color: '#191919' }}>Terms of Service</h1>
          <p style={{ color: '#888', marginBottom: '40px' }}>Last updated: May 2026</p>
          
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
        </div>
      </div>
    );
  }
