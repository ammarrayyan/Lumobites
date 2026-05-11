import Link from 'next/link';
import AnimatedPets from '@/components/AnimatedPets';
import BrandMarquee from '@/components/BrandMarquee';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col font-sans text-[#555555] bg-[#FDFAF7]">

      {/* TOP ANNOUNCEMENT BAR */}
      <div className="w-full bg-[#C17D3C] h-[48px] flex items-center justify-center px-6">
        <p className="text-white text-[14px] font-medium text-center">
          🐾 New: Food Recall Alerts Coming Soon &mdash; Save your pet&apos;s food to get notified
        </p>
      </div>

      {/* NAVBAR */}
      <nav className="bg-white border-b border-[#EEEEEE] px-6 md:px-[48px] flex items-center" style={{ height: '72px' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center' }}>
          <img src="/Logo.png" alt="Lumo Bites" style={{ height: '70px', width: 'auto', display: 'block', objectFit: 'contain', transform: 'scale(1.4)', transformOrigin: 'left center' }} />
        </Link>
      </nav>

      {/* HERO SECTION */}
      <section className="w-full flex flex-col items-center text-center px-6 bg-[#FDFAF7] pt-[48px] pb-16">
        <div className="max-w-[680px] mx-auto flex flex-col items-center">
          
          <AnimatedPets />

          <div className="border border-[#C17D3C] text-[#8B5E3C] bg-transparent text-[12px] font-bold tracking-[0.1em] uppercase px-[18px] py-[7px] rounded-[100px] mb-8 relative z-10">
            Free &middot; No Sign-up Required
          </div>
          <h1 className="font-[800] leading-[1.1] mb-6 tracking-[-0.02em] w-full relative z-10" style={{ fontSize: 'clamp(44px, 6.5vw, 76px)' }}>
            <span className="text-[#191919]">Find the best food</span>
            <br />
            <span className="text-[#C17D3C]">for your pet.</span>
          </h1>
          <p className="text-[19px] text-[#666666] mb-10 leading-[1.65] max-w-[460px] mx-auto relative z-10">
            Tell us your pet&apos;s age, breed and health needs. We&apos;ll find the perfect food that fits your budget.
          </p>
          <style>{`
            @keyframes heartbeat {
              0% { transform: scale(1); }
              14% { transform: scale(1.05); box-shadow: 0 10px 25px rgba(139, 94, 60, 0.4); }
              28% { transform: scale(1); box-shadow: 0 4px 15px rgba(139, 94, 60, 0.2); }
              42% { transform: scale(1.05); box-shadow: 0 10px 25px rgba(139, 94, 60, 0.4); }
              70% { transform: scale(1); box-shadow: 0 4px 15px rgba(139, 94, 60, 0.2); }
            }
            .btn-heartbeat {
              animation: heartbeat 2.5s infinite cubic-bezier(0.25, 0.8, 0.25, 1);
              box-shadow: 0 4px 15px rgba(139, 94, 60, 0.2);
              transition: all 0.3s ease;
            }
            .btn-heartbeat:hover {
              animation: none;
              transform: scale(1.03) translateY(-2px);
              box-shadow: 0 15px 30px rgba(139, 94, 60, 0.4);
            }
          `}</style>
          <div className="flex flex-col items-center gap-4">
            <Link href="/chat" className="btn-heartbeat" style={{ fontSize: '18px', padding: '18px 52px', textDecoration: 'none', color: '#FFFFFF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#8B5E3C', borderRadius: '100px', fontWeight: '600' }}>
              Find Your Pet&apos;s Food &rarr;
            </Link>
            <Link href="/scan" className="hover:bg-gray-50 transition-colors" style={{ fontSize: '14px', padding: '10px 24px', textDecoration: 'none', color: '#8B5E3C', border: '1px solid #E8DDD4', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderRadius: '100px', fontWeight: '600' }}>
              <span style={{ marginRight: '8px' }}>📷</span> Scan Food Label
            </Link>
          </div>
          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', color: '#999', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#8B5E3C', fontWeight: 700 }}>&#10003;</span> No sign-up
            </span>
            <span style={{ color: '#DDD', fontSize: '16px' }}>&#183;</span>
            <span style={{ fontSize: '13px', color: '#999', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#8B5E3C', fontWeight: 700 }}>&#10003;</span> 100% free
            </span>
            <span style={{ color: '#DDD', fontSize: '16px' }}>&#183;</span>
            <span style={{ fontSize: '13px', color: '#999', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#8B5E3C', fontWeight: 700 }}>&#10003;</span> Results in seconds
            </span>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="w-full bg-[#F5EDE4] border-y border-[#E8D5C0] py-5">
        <div className="max-w-[900px] mx-auto flex flex-wrap items-center justify-center gap-6 md:gap-12 text-center">
          <div className="flex flex-col items-center">
            <span className="text-[22px] font-[800] text-[#8B5E3C] tracking-tight">10,000+</span>
            <span className="text-[13px] text-[#9A7760] font-medium uppercase tracking-[0.08em] mt-0.5">Pets Matched</span>
          </div>
          <div className="hidden md:block w-px h-8 bg-[#D9C0A8]"></div>
          <div className="flex flex-col items-center">
            <span className="text-[22px] font-[800] text-[#8B5E3C] tracking-tight">50+</span>
            <span className="text-[13px] text-[#9A7760] font-medium uppercase tracking-[0.08em] mt-0.5">Brands Covered</span>
          </div>
          <div className="hidden md:block w-px h-8 bg-[#D9C0A8]"></div>
          <div className="flex flex-col items-center">
            <span className="text-[22px] font-[800] text-[#8B5E3C] tracking-tight">100%</span>
            <span className="text-[13px] text-[#9A7760] font-medium uppercase tracking-[0.08em] mt-0.5">Free Forever</span>
          </div>
          <div className="hidden md:block w-px h-8 bg-[#D9C0A8]"></div>
          <div className="flex flex-col items-center">
            <span className="text-[22px] font-[800] text-[#8B5E3C] tracking-tight">4.9 ★</span>
            <span className="text-[13px] text-[#9A7760] font-medium uppercase tracking-[0.08em] mt-0.5">Avg. Rating</span>
          </div>
        </div>
      </section>

      {/* BRAND LOGOS STRIP */}
      <BrandMarquee />

      {/* HOW IT WORKS */}
      <section id="how" className="w-full bg-[#FDFAF7] px-6 py-[80px]">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-[#8B5E3C] text-[13px] font-bold tracking-[0.1em] uppercase mb-3">How it works</h3>
            <h2 className="font-[800] text-[#191919] tracking-[-0.02em] leading-tight max-w-[600px] mx-auto" style={{ fontSize: 'clamp(24px, 3vw, 36px)' }}>
              Personalized recommendations, not generic lists.
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }} className="max-sm:grid-cols-1">
            <div className="bg-white rounded-[16px] p-8 shadow-[0_2px_16px_rgba(0,0,0,0.06)] flex flex-col items-center text-center hover:-translate-y-1 transition-transform">
              <span style={{ fontSize: '36px', lineHeight: 1, marginBottom: '20px', display: 'block' }}>🐾</span>
              <h3 className="text-[#191919] font-bold text-xl mb-2">Matched to your pet</h3>
              <p className="text-[#666666] text-base leading-[1.6]">We analyze age, breed, health issues and activity level to find their exact nutritional match.</p>
            </div>
            <div className="bg-white rounded-[16px] p-8 shadow-[0_2px_16px_rgba(0,0,0,0.06)] flex flex-col items-center text-center hover:-translate-y-1 transition-transform">
              <span style={{ fontSize: '36px', lineHeight: 1, marginBottom: '20px', display: 'block' }}>💰</span>
              <h3 className="text-[#191919] font-bold text-xl mb-2">Within your budget</h3>
              <p className="text-[#666666] text-base leading-[1.6]">Set your monthly limit. We only show foods you can afford, maximizing quality per dollar.</p>
            </div>
            <div className="bg-white rounded-[16px] p-8 shadow-[0_2px_16px_rgba(0,0,0,0.06)] flex flex-col items-center text-center hover:-translate-y-1 transition-transform">
              <span style={{ fontSize: '36px', lineHeight: 1, marginBottom: '20px', display: 'block' }}>🏪</span>
              <h3 className="text-[#191919] font-bold text-xl mb-2">Find it nearby</h3>
              <p className="text-[#666666] text-base leading-[1.6]">See exactly where to buy — online delivery or at a local pet store near you.</p>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="w-full bg-[#FDFAF7] px-6 py-[80px]">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-[#8B5E3C] text-[13px] font-bold tracking-[0.1em] uppercase mb-3">What pet owners say</h3>
            <h2 className="font-[800] text-[#191919] tracking-[-0.02em] leading-tight max-w-[500px] mx-auto" style={{ fontSize: 'clamp(22px, 3vw, 34px)' }}>
              Real results for real pets.
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }} className="max-sm:grid-cols-1">

            <div className="bg-white rounded-[20px] p-8 shadow-[0_2px_20px_rgba(0,0,0,0.06)] flex flex-col gap-4 hover:-translate-y-1 transition-transform">
              <div className="flex gap-1 text-[#C17D3C] text-lg">{'★★★★★'}</div>
              <p className="text-[#444444] text-base leading-[1.7] flex-1">&ldquo;My golden retriever was struggling with joint issues and I had no idea what to feed her. Lumo Bites matched her to a food with glucosamine in seconds. She&apos;s been on it two months and is noticeably more active!&rdquo;</p>
              <div className="flex items-center gap-3 pt-2 border-t border-[#F0E8E0]">
                <div className="w-9 h-9 rounded-full bg-[#F5EDE4] flex items-center justify-center text-lg">🐕</div>
                <div>
                  <p className="font-bold text-[#191919] text-sm">Sarah M.</p>
                  <p className="text-[#999] text-xs">Golden Retriever owner, Texas</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[20px] p-8 shadow-[0_2px_20px_rgba(0,0,0,0.06)] flex flex-col gap-4 hover:-translate-y-1 transition-transform">
              <div className="flex gap-1 text-[#C17D3C] text-lg">{'★★★★★'}</div>
              <p className="text-[#444444] text-base leading-[1.7] flex-1">&ldquo;I have two cats with completely different needs. Lumo Bites recommended a high-protein wet food for my older cat and a different formula for my kitten. Both are obsessed with their food now. Worth every second.&rdquo;</p>
              <div className="flex items-center gap-3 pt-2 border-t border-[#F0E8E0]">
                <div className="w-9 h-9 rounded-full bg-[#F5EDE4] flex items-center justify-center text-lg">🐈</div>
                <div>
                  <p className="font-bold text-[#191919] text-sm">James L.</p>
                  <p className="text-[#999] text-xs">Multi-cat household, California</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[20px] p-8 shadow-[0_2px_20px_rgba(0,0,0,0.06)] flex flex-col gap-4 hover:-translate-y-1 transition-transform">
              <div className="flex gap-1 text-[#C17D3C] text-lg">{'★★★★★'}</div>
              <p className="text-[#444444] text-base leading-[1.7] flex-1">&ldquo;As a student, budget is everything. I told Lumo Bites my limit was $35/month and it found the highest-rated options in that range. I didn&apos;t have to compromise on quality at all. My pug is thriving.&rdquo;</p>
              <div className="flex items-center gap-3 pt-2 border-t border-[#F0E8E0]">
                <div className="w-9 h-9 rounded-full bg-[#F5EDE4] flex items-center justify-center text-lg">🐶</div>
                <div>
                  <p className="font-bold text-[#191919] text-sm">Priya K.</p>
                  <p className="text-[#999] text-xs">Pug owner, New York</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="w-full px-6 py-[80px] text-center" style={{ backgroundColor: '#8B5E3C' }}>
        <div className="max-w-[700px] mx-auto">
          <h2 className="font-[800] tracking-[-0.02em] leading-tight mb-4" style={{ fontSize: 'clamp(28px, 4vw, 44px)', color: '#FFFFFF' }}>
            Ready to find the perfect food?
          </h2>
          <p className="text-[18px] mb-10 max-w-[480px] mx-auto" style={{ color: 'rgba(255,255,255,0.85)' }}>
            Join thousands of pet owners who found their pet&apos;s favorite food.
          </p>
          <Link href="/chat" style={{ fontSize: '18px', padding: '16px 48px', textDecoration: 'none', color: '#8B5E3C', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderRadius: '100px', fontWeight: '700', boxShadow: '0 4px 14px rgba(0,0,0,0.1)' }}>
            Get Started &rarr;
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full px-6 md:px-[48px] py-16" style={{ backgroundColor: '#191919', color: '#FFFFFF' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '48px', maxWidth: '1200px', margin: '0 auto', marginBottom: '48px' }}>
          <div style={{ flex: '2 1 300px' }}>
            <Link href="/" className="mb-4 inline-block">
              <img src="/Logo.png" alt="Lumo Bites" style={{ height: '80px', width: 'auto', filter: 'brightness(0) invert(1)' }} />
            </Link>
            <p className="text-sm max-w-sm leading-relaxed mt-2" style={{ color: '#AAAAAA' }}>
              Every pet deserves optimal nutrition without the marketing fluff.
            </p>
          </div>
          <div style={{ flex: '1 1 150px' }}>
            <h4 className="font-bold mb-4" style={{ color: '#FFFFFF' }}>Product</h4>
            <ul className="space-y-3 text-sm" style={{ color: '#AAAAAA', listStyle: 'none', padding: 0, margin: 0 }}>
              <li><a href="#how" style={{ color: '#AAAAAA', textDecoration: 'none' }}>How it works</a></li>
              <li><Link href="/chat" style={{ color: '#AAAAAA', textDecoration: 'none' }}>Compare Foods</Link></li>
              <li><Link href="/scan" style={{ color: '#AAAAAA', textDecoration: 'none' }}>Recall Checker</Link></li>
              <li><Link href="/recalls" style={{ color: '#EF4444', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '6px', height: '6px', backgroundColor: '#EF4444', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite' }}></span>Recall Alerts</Link></li>
            </ul>
          </div>
          <div style={{ flex: '1 1 150px' }}>
            <h4 className="font-bold mb-4" style={{ color: '#FFFFFF' }}>Support</h4>
            <ul className="space-y-3 text-sm" style={{ color: '#AAAAAA', listStyle: 'none', padding: 0, margin: 0 }}>
              <li><Link href="/contact" style={{ color: '#AAAAAA', textDecoration: 'none' }}>Help Center</Link></li>
              <li><Link href="/contact" style={{ color: '#AAAAAA', textDecoration: 'none' }}>Contact Us</Link></li>
            </ul>
          </div>
          <div style={{ flex: '1 1 150px' }}>
            <h4 className="font-bold mb-4" style={{ color: '#FFFFFF' }}>Legal</h4>
            <ul className="space-y-3 text-sm" style={{ color: '#AAAAAA', listStyle: 'none', padding: 0, margin: 0 }}>
              <li><Link href="/privacy" style={{ color: '#AAAAAA', textDecoration: 'none' }}>Privacy Policy</Link></li>
              <li><Link href="/terms" style={{ color: '#AAAAAA', textDecoration: 'none' }}>Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-[1200px] mx-auto pt-8 border-t border-gray-800 text-[#AAAAAA] text-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div>&copy; {new Date().getFullYear()} Lumo Bites. All rights reserved.</div>
          <div className="flex items-center gap-4 text-base">
            <a href="#" className="hover:text-[#C17D3C] transition-colors">𝕏</a>
            <a href="#" className="hover:text-[#C17D3C] transition-colors">📷</a>
            <a href="#" className="hover:text-[#C17D3C] transition-colors">📘</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
