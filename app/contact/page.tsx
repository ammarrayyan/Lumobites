export default function ContactPage() {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '60px 24px', fontFamily: 'sans-serif', color: '#191919' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '8px' }}>Contact Us</h1>
        <p style={{ color: '#888', marginBottom: '40px' }}>We'd love to hear from you!</p>
  
        <div style={{ backgroundColor: '#FDFAF7', borderRadius: '24px', padding: '32px', border: '1px solid #E8DDD4' }}>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>📧 Email</h2>
            <p style={{ color: '#555' }}>For general inquiries, product suggestions, or feedback:</p>
            <a href="mailto:hello@lumobites.net" style={{ color: '#8B5E3C', fontWeight: 600 }}>hello@lumobites.net</a>
          </div>
  
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>🐾 Report a Product Issue</h2>
            <p style={{ color: '#555' }}>Found incorrect product information or a recall we missed? Let us know and we'll fix it immediately.</p>
            <a href="mailto:hello@lumobites.net?subject=Product Issue" style={{ color: '#8B5E3C', fontWeight: 600 }}>Report an issue →</a>
          </div>
  
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>⏱️ Response Time</h2>
            <p style={{ color: '#555' }}>We typically respond within 24-48 hours.</p>
          </div>
        </div>
      </div>
    );
  }
  