'use client';

import Link from 'next/link';

const brandsRow1 = [
  "Purina", "Hill's", "Royal Canin", "Iams", "Pedigree", "Whiskas", "Friskies", "Fancy Feast", "9Lives", "Kibbles 'n Bits",
  "Blue Buffalo", "Orijen", "Acana", "Merrick", "Wellness", "Taste of the Wild", "Natural Balance", "Instinct", "Canidae", "Nutro",
  "Ziwi Peak", "Stella & Chewy's", "Primal", "Open Farm", "The Farmer's Dog"
];

const brandsRow2 = [
  "Nom Nom", "Ollie", "Jinx", "Sundays", "Sheba", "Temptations", "Meow Mix", "Purina ONE", "Blue Wilderness", "Rachel Ray Nutrish",
  "Tiki Cat", "Weruva", "Cesar", "Milk-Bone", "Greenies", "Purina Beneful", "Diamond Naturals", "Nulo", "Zignature", "Earthborn Holistic",
  "Fromm", "Halo", "Castor & Pollux", "Organix", "Victor"
];

const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export default function BrandMarquee() {
  return (
    <section className="w-full bg-[#FDFAF7] py-16 border-y border-[#F3EDE2] overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-6 mb-12 text-center">
        <div className="inline-flex items-center gap-3 justify-center">
          <span className="h-[1.5px] w-6 bg-[#EADFCF]"></span>
          <p className="text-[12px] font-[800] tracking-[0.2em] uppercase text-[#8B5E3C]">Brands we cover</p>
          <span className="h-[1.5px] w-6 bg-[#EADFCF]"></span>
        </div>
        <h3 className="text-[24px] md:text-[28px] font-[800] text-[#1D1D1F] mt-2 tracking-tight">
          Analyze ingredients from 50+ premium brands
        </h3>
      </div>

      <div className="relative w-full flex flex-col gap-6">
        {/* Row 1 - Left to Right */}
        <div className="marquee-container relative w-full overflow-hidden flex py-2">
          <div className="marquee-content-right flex items-center whitespace-nowrap gap-4">
            {[...brandsRow1, ...brandsRow1].map((brand, i) => (
              <Link 
                key={`r1-${i}`} 
                href={`/chat?brand=${slugify(brand)}`}
                className="inline-flex items-center justify-center bg-white hover:bg-[#8B5E3C] text-[#555555] hover:text-white border border-[#EADFCF] hover:border-[#8B5E3C] px-6 py-2.5 rounded-full text-[14px] md:text-[15px] font-[600] shadow-[0_4px_10px_rgba(139,94,60,0.03)] hover:shadow-[0_8px_20px_rgba(139,94,60,0.12)] hover:scale-[1.04] transition-all cursor-pointer no-underline select-none"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {brand}
              </Link>
            ))}
          </div>
        </div>

        {/* Row 2 - Right to Left */}
        <div className="marquee-container relative w-full overflow-hidden flex py-2">
          <div className="marquee-content-left flex items-center whitespace-nowrap gap-4">
            {[...brandsRow2, ...brandsRow2].map((brand, i) => (
              <Link 
                key={`r2-${i}`} 
                href={`/chat?brand=${slugify(brand)}`}
                className="inline-flex items-center justify-center bg-white hover:bg-[#8B5E3C] text-[#555555] hover:text-white border border-[#EADFCF] hover:border-[#8B5E3C] px-6 py-2.5 rounded-full text-[14px] md:text-[15px] font-[600] shadow-[0_4px_10px_rgba(139,94,60,0.03)] hover:shadow-[0_8px_20px_rgba(139,94,60,0.12)] hover:scale-[1.04] transition-all cursor-pointer no-underline select-none"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {brand}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .marquee-container {
          mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
          -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
        }

        .marquee-content-right {
          animation: scrollRight 50s linear infinite;
        }

        .marquee-content-left {
          animation: scrollLeft 50s linear infinite;
        }

        /* Hover pauses the animation */
        .marquee-container:hover .marquee-content-right,
        .marquee-container:hover .marquee-content-left {
          animation-play-state: paused;
        }

        @keyframes scrollLeft {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        @keyframes scrollRight {
          0% {
            transform: translateX(-50%);
          }
          100% {
            transform: translateX(0);
          }
        }
      `}</style>
    </section>
  );
}
