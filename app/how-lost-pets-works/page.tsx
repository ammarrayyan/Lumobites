import type { Metadata } from 'next';
import LostPetsScrollStory from '@/components/LostPetsScrollStory';

export const metadata: Metadata = {
  title: 'How Lost Pets Works — Lumo Bites',
  description:
    'See how Lumo Bites helps you post lost and found pet reports and search community reports by photo.',
};

export default function HowLostPetsWorksPage() {
  return (
    <main className="w-full min-h-screen bg-[#F7F3EE]">
      <LostPetsScrollStory />
    </main>
  );
}
