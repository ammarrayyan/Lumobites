import Link from 'next/link';
import BrandMarquee from '@/components/BrandMarquee';

export function generateStaticParams() {
  const brands = [
    'purina', 'hills', 'royal-canin', 'iams', 'pedigree', 'blue-buffalo', 
    'orijen', 'acana', 'merrick', 'wellness', 'fancy-feast', 'friskies'
  ];
  return brands.map((slug) => ({ slug }));
}

export default async function BrandPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const brandNames: Record<string, string> = {
    'purina': 'Purina',
    'hills': "Hill's Science Diet",
    'royal-canin': 'Royal Canin',
    'iams': 'Iams',
    'pedigree': 'Pedigree',
    'blue-buffalo': 'Blue Buffalo',
    'orijen': 'Orijen',
    'acana': 'Acana',
    'merrick': 'Merrick',
    'wellness': 'Wellness',
    'fancy-feast': 'Fancy Feast',
    'friskies': 'Friskies'
  };

  const brandName = brandNames[slug] || slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return (
    <div className="min-h-screen bg-[#FDFAF7]">
      {/* NAVBAR */}
      <nav className="bg-white border-b border-[#EEEEEE] px-6 md:px-[48px] flex items-center h-[72px]">
        <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', transform: 'scale(1.4)', transformOrigin: 'left center' }}>
            <img src="/Logo.png" alt="Lumo Bites" style={{ height: '63px', width: 'auto', display: 'block', objectFit: 'contain' }} />
            <sup style={{ fontSize: '10px', color: '#8B5A2B', fontWeight: 'bold', alignSelf: 'flex-start', marginTop: '10px', marginLeft: '2px', fontFamily: 'sans-serif', userSelect: 'none' }}>™</sup>
          </div>
        </Link>
      </nav>

      <main className="max-w-[800px] mx-auto px-6 py-16 text-center">
        <div className="w-24 h-24 bg-[#8B5E3C] rounded-3xl mx-auto mb-8 flex items-center justify-center text-white text-4xl font-black">
          {brandName.charAt(0)}
        </div>
        
        <h1 className="text-4xl md:text-5xl font-black text-[#191919] mb-6 tracking-tight">
          The Best {brandName} Food for Your Pet
        </h1>
        
        <p className="text-xl text-gray-600 mb-10 leading-relaxed max-w-[600px] mx-auto">
          Searching for the perfect {brandName} formula? We analyze your pet&apos;s specific health needs, life stage, and your budget to find the absolute best {brandName} match in seconds.
        </p>

        <div className="flex flex-col items-center gap-6">
          <Link 
            href={`/chat?brand=${slug}`}
            className="bg-[#8B5E3C] text-white px-10 py-5 rounded-full text-xl font-bold hover:scale-105 transition-transform shadow-xl shadow-[#8B5E3C]/20"
          >
            Find {brandName} Matches &rarr;
          </Link>
          
          <p className="text-sm text-gray-400 font-medium italic">
            100% Free &middot; No account required &middot; FDA Recall checked
          </p>
        </div>

        <section className="mt-24 pt-16 border-t border-[#E8DDD4] text-left">
          <h2 className="text-2xl font-bold text-[#191919] mb-6">Why Choose {brandName}?</h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            {brandName} is one of the most trusted names in pet nutrition, offering a wide range of formulas for sensitive stomachs, weight management, and age-specific requirements. Whether you have a growing puppy or a senior cat, there is a {brandName} product designed for their unique biology.
          </p>
          <div className="grid md:grid-cols-2 gap-8 mt-8">
            <div className="bg-white p-6 rounded-2xl border border-[#E8DDD4]">
              <h3 className="font-bold text-[#191919] mb-2">Life Stage Optimized</h3>
              <p className="text-sm text-gray-500">Formulas specifically balanced for the nutritional demands of every age, from kitten to senior.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-[#E8DDD4]">
              <h3 className="font-bold text-[#191919] mb-2">Health Focused</h3>
              <p className="text-sm text-gray-500">Targeted solutions for common issues like allergies, skin sensitivity, and joint health.</p>
            </div>
          </div>
        </section>
      </main>

      <div className="bg-white py-16">
        <div className="max-w-[800px] mx-auto px-6 mb-8">
          <h2 className="text-center text-xl font-bold text-gray-400 uppercase tracking-widest text-sm mb-8">Explore Other Brands</h2>
        </div>
        <BrandMarquee />
      </div>

      {/* FOOTER */}
      <footer className="bg-[#191919] py-16 px-6 text-center text-white">
        <div className="max-w-[800px] mx-auto">
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <img src="/Logo.png" alt="Lumo Bites" className="h-12 invert brightness-0" />
            <sup style={{ fontSize: '10px', color: '#8B5A2B', fontWeight: 'bold', alignSelf: 'flex-start', marginTop: '8px', marginLeft: '2px', fontFamily: 'sans-serif', userSelect: 'none' }}>™</sup>
          </div>
          <p className="text-gray-500 text-sm mt-6">&copy; {new Date().getFullYear()} Lumo Bites<sup style={{ fontSize: '50%', color: '#8B5A2B', verticalAlign: 'super', marginLeft: '1px' }}>™</sup>. Finding the best for your pets.</p>
        </div>
      </footer>
    </div>
  );
}
