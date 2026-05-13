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
    <section className="w-full bg-white py-12 border-b border-[#EEEEEE] overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-6 mb-8 text-center">
        <p className="text-[12px] font-bold tracking-[0.14em] uppercase text-[#BBBBBB]">Brands we cover</p>
      </div>

      <div className="relative w-full flex flex-col gap-6">
        {/* Row 1 - Left to Right */}
        <div className="marquee-container relative w-full overflow-hidden flex">
          <div className="marquee-content-right flex items-center whitespace-nowrap">
            {[...brandsRow1, ...brandsRow1].map((brand, i) => (
              <Link 
                key={`r1-${i}`} 
                href={`/chat?brand=${slugify(brand)}`}
                className="mx-6 text-[18px] md:text-[22px] font-[800] tracking-tight text-[#E5E5E5] hover:text-[#8B5E3C] transition-colors cursor-pointer no-underline select-none"
                style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.01em' }}
              >
                {brand}
              </Link>
            ))}
          </div>
        </div>

        {/* Row 2 - Right to Left */}
        <div className="marquee-container relative w-full overflow-hidden flex">
          <div className="marquee-content-left flex items-center whitespace-nowrap">
            {[...brandsRow2, ...brandsRow2].map((brand, i) => (
              <Link 
                key={`r2-${i}`} 
                href={`/chat?brand=${slugify(brand)}`}
                className="mx-6 text-[18px] md:text-[22px] font-[800] tracking-tight text-[#E5E5E5] hover:text-[#8B5E3C] transition-colors cursor-pointer no-underline select-none"
                style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.01em' }}
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
          animation: scrollRight 40s linear infinite;
          /* Negative margin trick if needed to hide gap, but padding handles it */
        }

        .marquee-content-left {
          animation: scrollLeft 40s linear infinite;
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
