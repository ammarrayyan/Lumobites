import dynamic from 'next/dynamic';

const ENABLED = process.env.NEXT_PUBLIC_PETSITTING_ENABLED === 'true';

// Dynamically import so neither page is bundled unless needed
const RealPage = dynamic(() => import('./page-real'));
const ComingSoonPage = dynamic(() => import('./coming-soon'));

export default function PetSittingPage() {
  if (ENABLED) {
    return <RealPage />;
  }
  return <ComingSoonPage />;
}
