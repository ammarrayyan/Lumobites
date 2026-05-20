import Link from 'next/link';
import AnimatedPets from '@/components/AnimatedPets';
import BrandMarquee from '@/components/BrandMarquee';
import Navbar from '@/components/Navbar';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col font-sans text-[#555555] bg-[#FDFAF7]">


      {/* NAVBAR */}
      <Navbar />


      {/* HERO SECTION */}
      <section className="w-full bg-[#FDFAF7] pt-[48px] pb-16 px-6">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center gap-12">
          
          {/* LEFT COLUMN - 60% */}
          <div className="flex-[1.5] flex flex-col items-center md:items-start text-center md:text-left">
            <AnimatedPets />
            
            <div className="text-[#8B5E3C] text-[12px] font-[700] tracking-[0.15em] uppercase mb-6 relative z-10 select-none">
              Free &middot; No Sign-up Required
            </div>
            
            <h1 className="font-[800] leading-[1.1] mb-6 tracking-[-0.02em] relative z-10" style={{ fontSize: 'clamp(44px, 5.5vw, 68px)' }}>
              <span className="text-[#191919]">Find the best food</span>
              <br />
              <span className="text-[#C17D3C]">for your pet.</span>
            </h1>
            
            <p className="text-[19px] text-[#666666] mb-10 leading-[1.65] max-w-[460px] relative z-10">
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

            <Link href="/chat" className="btn-heartbeat mb-4" style={{ fontSize: '18px', padding: '18px 52px', textDecoration: 'none', color: '#FFFFFF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#8B5E3C', borderRadius: '100px', fontWeight: '600' }}>
              Find Your Pet&apos;s Food &rarr;
            </Link>

            <div style={{ marginBottom: '32px' }}>
              <Link 
                href="/photo" 
                className="text-[#8B5E3C] font-semibold text-[var(--text-btn)] inline-flex items-center gap-2 hover:scale-[1.03] active:scale-[0.98] transition-all" 
                style={{ 
                  textDecoration: 'none',
                  background: 'rgba(139, 94, 60, 0.05)',
                  border: '1.2px solid rgba(139, 94, 60, 0.15)',
                  padding: '7px 18px',
                  borderRadius: '100px',
                  boxShadow: '0 2px 8px rgba(139, 94, 60, 0.03)',
                  letterSpacing: '0.01em'
                }}
              >
                <svg className="w-4 h-4 text-[#8B5E3C]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <circle cx="12" cy="13" r="3.25" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Find Food by Photo of Your Pet</span>
              </Link>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
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

          {/* RIGHT COLUMN - 40% - SERVICE CARDS */}
          <div className="flex-1 w-full max-w-[400px] flex flex-col gap-4">
            
            {/* Card 1 - Safety Check */}
            <div className="bg-[#F5EDE4] border border-[#E8D5C0] rounded-3xl p-6 flex flex-col gap-4 shadow-sm hover:shadow-md transition-all hover:scale-[1.01]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                  <svg className="w-5 h-5 text-[#8B5E3C]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-[#191919] font-bold text-base">Is This Food Safe?</h3>
              </div>
              <p className="text-[var(--text-card-desc)] text-[#666666] leading-relaxed">
                Scan any pet food label to instantly check ingredients for hidden toxins and live FDA recalls.
              </p>
              <Link href="/scan" className="w-full py-2.5 rounded-xl border-2 border-[#8B5E3C] text-[#8B5E3C] font-bold text-[var(--text-btn)] text-center hover:bg-[#8B5E3C] hover:text-white transition-all text-decoration-none" style={{ textDecoration: 'none' }}>
                Scan Now &rarr;
              </Link>
            </div>

            {/* Card 2 - Recall Alerts */}
            <div className="bg-[#F5EDE4] border border-[#E8D5C0] rounded-3xl p-6 flex flex-col gap-4 shadow-sm hover:shadow-md transition-all hover:scale-[1.01]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                  <svg className="w-5 h-5 text-[#D97706]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-[#191919] font-bold text-base">FDA Recall Alerts</h3>
              </div>
              <p className="text-[var(--text-card-desc)] text-[#666666] leading-relaxed">
                Get notified instantly if your pet&apos;s food is recalled by the FDA. Free email alerts.
              </p>
              <Link href="/recalls" className="w-full py-2.5 rounded-xl border-2 border-[#8B5E3C] text-[#8B5E3C] font-bold text-[var(--text-btn)] text-center hover:bg-[#8B5E3C] hover:text-white transition-all text-decoration-none" style={{ textDecoration: 'none' }}>
                Get Alerts &rarr;
              </Link>
            </div>

            {/* Card 3 - Pet Supplies */}
            <div className="bg-[#F5EDE4] border border-[#E8D5C0] rounded-3xl p-6 flex flex-col gap-4 shadow-sm hover:shadow-md transition-all hover:scale-[1.01]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                  <svg className="w-5 h-5 text-[#8B5E3C]" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="4.5" cy="11.5" r="2.5" />
                    <circle cx="9.5" cy="7.5" r="2.5" />
                    <circle cx="14.5" cy="7.5" r="2.5" />
                    <circle cx="19.5" cy="11.5" r="2.5" />
                    <path d="M12 21.5c-3 0-5.5-2.5-5.5-5.5s2.5-4.5 5.5-4.5 5.5 1.5 5.5 4.5-2.5 5.5-5.5 5.5z" />
                  </svg>
                </div>
                <h3 className="text-[#191919] font-bold text-base">Pet Supplies</h3>
              </div>
              <p className="text-[var(--text-card-desc)] text-[#666666] leading-relaxed">
                Find the best toys, litter, and supplements specifically tailored for your pet.
              </p>
              <Link href="/supplies" className="w-full py-2.5 rounded-xl border-2 border-[#8B5E3C] text-[#8B5E3C] font-bold text-[var(--text-btn)] text-center hover:bg-[#8B5E3C] hover:text-white transition-all text-decoration-none" style={{ textDecoration: 'none' }}>
                Find Supplies &rarr;
              </Link>
            </div>

            {/* Card 4 - Pet Twin */}
            <div className="bg-[#F5EDE4] border border-[#E8D5C0] rounded-3xl p-6 flex flex-col gap-4 shadow-sm hover:shadow-md transition-all hover:scale-[1.01]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                  <svg className="w-5 h-5 text-[#8B5E3C]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l-.813-5.096L3 15l5.096-.813L9 9l.813 5.096L15 15l-5.096.813zM19.071 4.929l-.244 1.533-.244-1.533L17.05 4.685l1.533-.244.244-1.533.244 1.533 1.533.244-1.533.244z" />
                  </svg>
                </div>
                <h3 className="text-[#191919] font-bold text-base">Find Your Pet Twin</h3>
              </div>
              <p className="text-[var(--text-card-desc)] text-[#666666] leading-relaxed">
                Upload a selfie to discover which cat or dog breed perfectly matches your unique facial features and personality.
              </p>
              <Link href="/twin" className="w-full py-2.5 rounded-xl border-2 border-[#8B5E3C] text-[#8B5E3C] font-bold text-[var(--text-btn)] text-center hover:bg-[#8B5E3C] hover:text-white transition-all text-decoration-none" style={{ textDecoration: 'none' }}>
                Find Your Twin &rarr;
              </Link>
            </div>

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-[16px] p-8 shadow-[0_2px_16px_rgba(0,0,0,0.06)] flex flex-col items-center text-center hover:-translate-y-1 transition-transform">
              <span style={{ fontSize: '36px', lineHeight: 1, marginBottom: '20px', display: 'block' }}>🎯</span>
              <h3 className="text-[#191919] font-bold text-xl mb-2">Matched to your pet</h3>
              <p className="text-[#666666] text-base leading-[1.6]">We analyze age, breed, health issues and activity level to find their exact nutritional match.</p>
            </div>
            <div className="bg-white rounded-[16px] p-8 shadow-[0_2px_16px_rgba(0,0,0,0.06)] flex flex-col items-center text-center hover:-translate-y-1 transition-transform">
              <span style={{ fontSize: '36px', lineHeight: 1, marginBottom: '20px', display: 'block' }}>🔍</span>
              <h3 className="text-[#191919] font-bold text-xl mb-2">Ingredient Safety Check</h3>
              <p className="text-[#666666] text-base leading-[1.6]">Scan any pet food label to instantly detect dangerous ingredients and hidden toxins — graded A to F.</p>
            </div>
            <div className="bg-white rounded-[16px] p-8 shadow-[0_2px_16px_rgba(0,0,0,0.06)] flex flex-col items-center text-center hover:-translate-y-1 transition-transform">
              <span style={{ fontSize: '36px', lineHeight: 1, marginBottom: '20px', display: 'block' }}>⚠️</span>
              <h3 className="text-[#191919] font-bold text-xl mb-2">FDA Recall Alerts</h3>
              <p className="text-[#666666] text-base leading-[1.6]">Get notified instantly if your pet&apos;s food is recalled by the FDA. Free email alerts, no spam.</p>
            </div>
            <div className="bg-white rounded-[16px] p-8 shadow-[0_2px_16px_rgba(0,0,0,0.06)] flex flex-col items-center text-center hover:-translate-y-1 transition-transform">
              <span style={{ fontSize: '36px', lineHeight: 1, marginBottom: '20px', display: 'block' }}>✨</span>
              <h3 className="text-[#191919] font-bold text-xl mb-2">Find Your Pet Twin</h3>
              <p className="text-[#666666] text-base leading-[1.6]">Upload a selfie to discover which cat or dog breed matches your personality and facial features.</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            <div className="bg-white rounded-[20px] p-8 shadow-[0_2px_20px_rgba(0,0,0,0.06)] flex flex-col gap-4 hover:-translate-y-1 transition-transform">
              <div className="flex gap-1 text-[#C17D3C] text-lg">{'★★★★★'}</div>
              <p className="text-[#444444] text-sm leading-[1.7] flex-1">&ldquo;My golden retriever was struggling with joint issues and I had no idea what to feed her. Lumo Bites matched her to a food with glucosamine in seconds. She&apos;s been on it two months and is noticeably more active!&rdquo;</p>
              <div className="flex items-center gap-3 pt-2 border-t border-[#F0E8E0]">
                <div className="w-9 h-9 rounded-full bg-[#F5EDE4] flex items-center justify-center text-lg">🐕</div>
                <div>
                  <p className="font-bold text-[#191919] text-xs">Sarah M.</p>
                  <p className="text-[#999] text-[11px]">Golden Retriever owner, Texas</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[20px] p-8 shadow-[0_2px_20px_rgba(0,0,0,0.06)] flex flex-col gap-4 hover:-translate-y-1 transition-transform">
              <div className="flex gap-1 text-[#C17D3C] text-lg">{'★★★★★'}</div>
              <p className="text-[#444444] text-sm leading-[1.7] flex-1">&ldquo;I have two cats with completely different needs. Lumo Bites recommended a high-protein wet food for my older cat and a different formula for my kitten. Both are obsessed with their food now. Worth every second.&rdquo;</p>
              <div className="flex items-center gap-3 pt-2 border-t border-[#F0E8E0]">
                <div className="w-9 h-9 rounded-full bg-[#F5EDE4] flex items-center justify-center text-lg">🐈</div>
                <div>
                  <p className="font-bold text-[#191919] text-xs">James L.</p>
                  <p className="text-[#999] text-[11px]">Multi-cat household, California</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[20px] p-8 shadow-[0_2px_20px_rgba(0,0,0,0.06)] flex flex-col gap-4 hover:-translate-y-1 transition-transform">
              <div className="flex gap-1 text-[#C17D3C] text-lg">{'★★★★★'}</div>
              <p className="text-[#444444] text-sm leading-[1.7] flex-1">&ldquo;As a student, budget is everything. I told Lumo Bites my limit was $35/month and it found the highest-rated options in that range. I didn&apos;t have to compromise on quality at all. My pug is thriving.&rdquo;</p>
              <div className="flex items-center gap-3 pt-2 border-t border-[#F0E8E0]">
                <div className="w-9 h-9 rounded-full bg-[#F5EDE4] flex items-center justify-center text-lg">🐶</div>
                <div>
                  <p className="font-bold text-[#191919] text-xs">Priya K.</p>
                  <p className="text-[#999] text-[11px]">Pug owner, New York</p>
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
            <Link href="/" className="mb-4 inline-block" style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                <img src="/Logo.png" alt="Lumo Bites" style={{ height: '80px', width: 'auto', filter: 'brightness(0) invert(1)' }} />
                <sup style={{ fontSize: '16px', color: '#8B5A2B', fontWeight: 'bold', alignSelf: 'flex-start', marginTop: '14px', marginLeft: '2px', fontFamily: 'sans-serif', userSelect: 'none' }}>™</sup>
              </div>
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
              <li><Link href="/scan" style={{ color: '#AAAAAA', textDecoration: 'none' }}>Is My Pet&apos;s Food Safe?</Link></li>
              <li><Link href="/supplies" style={{ color: '#AAAAAA', textDecoration: 'none' }}>Pet Supplies Finder</Link></li>
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
          <div>&copy; {new Date().getFullYear()} Lumo Bites<sup style={{ fontSize: '50%', color: '#8B5A2B', verticalAlign: 'super', marginLeft: '1px' }}>™</sup>. All rights reserved.</div>
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
