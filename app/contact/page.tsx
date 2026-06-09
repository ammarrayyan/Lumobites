import { Mail, Clock } from 'lucide-react';

export default function ContactPage() {
  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '60px 24px' }}>
      <h1 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '8px' }}>Contact Us</h1>
      <p style={{ color: '#888', marginBottom: '40px' }}>We'd love to hear from you!</p>
      <div style={{ backgroundColor: '#FDFAF7', borderRadius: '24px', padding: '32px', border: '1px solid #E8DDD4' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Mail style={{ width: '20px', height: '20px', color: '#8B5E3C' }} /> Email
        </h2>
        <p style={{ color: '#555' }}>For general inquiries, product suggestions, or feedback:</p>
        <a href="mailto:info@lumobitespet.com" style={{ color: '#8B5E3C', fontWeight: 600 }}>info@lumobitespet.com</a>
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginTop: '24px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock style={{ width: '20px', height: '20px', color: '#8B5E3C' }} /> Response Time
        </h2>
        <p style={{ color: '#555' }}>We typically respond within 24-48 hours.</p>
      </div>
    </div>
  );
}