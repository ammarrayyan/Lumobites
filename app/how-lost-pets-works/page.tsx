import type { Metadata } from 'next';
import LostPetsScrollStory from '@/components/LostPetsScrollStory';

export const metadata: Metadata = {
  title: 'Every paw has a story | Lumo Bites',
  description:
    "Follow one lost pet's journey home, and explore the Lumo Bites community Lost & Found pet board.",
};

export default function HowLostPetsWorksPage() {
  return (
    <main className="w-full min-h-screen bg-[#F7F3EE]">
      <LostPetsScrollStory />
    </main>
  );
}
