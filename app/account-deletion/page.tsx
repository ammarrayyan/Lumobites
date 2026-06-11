import Navbar from '@/components/Navbar';

export default function AccountDeletionPage() {
  return (
    <div className="min-h-screen bg-[#FDFAF7] font-sans text-[#555555]">
      <Navbar />
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 24px' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '24px', color: '#8B5E3C' }}>
          Delete Your Lumo Bites Account
        </h1>
        
        <p style={{ fontSize: '16px', lineHeight: '1.6', marginBottom: '24px' }}>
          To request deletion of your Lumo Bites account and associated data, please email{' '}
          <a href="mailto:info@lumobitespet.com" style={{ color: '#8B5E3C', fontWeight: 'bold', textDecoration: 'underline' }}>
            info@lumobitespet.com
          </a>{' '}
          from your registered email address with the subject line <strong>'Account Deletion Request'</strong>.
        </p>

        <div style={{ backgroundColor: '#FFFFFF', padding: '30px', borderRadius: '12px', border: '1px solid #EFEAE4', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#191919', marginBottom: '16px' }}>
            What gets deleted:
          </h2>
          <ul style={{ paddingLeft: '20px', margin: '0 0 24px 0', lineHeight: '1.8' }}>
            <li>Your profile information (name, email, phone)</li>
            <li>Your booking history</li>
            <li>Your messages</li>
            <li>Your sitter profile (if applicable) including ID verification documents</li>
            <li>Your saved pet profiles</li>
          </ul>

          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#191919', marginBottom: '16px' }}>
            What may be retained:
          </h2>
          <ul style={{ paddingLeft: '20px', margin: '0', lineHeight: '1.8' }}>
            <li>Transaction records required for tax/legal compliance (retained for 7 years per US law)</li>
            <li>Anonymized analytics data</li>
          </ul>
        </div>

        <div style={{ borderLeft: '4px solid #8B5E3C', paddingLeft: '16px', fontStyle: 'italic', color: '#666', fontSize: '15px' }}>
          Note: We will process your request within 30 days and send confirmation once completed.
        </div>
      </div>
    </div>
  );
}
