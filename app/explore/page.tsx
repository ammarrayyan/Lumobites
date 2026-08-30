import { Metadata } from 'next';
import ExploreClient from './ExploreClient';

export const metadata: Metadata = {
  title: 'Explore Community — Pet Twin, Lost Pets & Sitters 🐾',
  description: 'Explore the Lumo Bites community. Real pet twin matches, neighborhood lost & found alerts, local pet sitters, and city discussion board activity.',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function ExplorePage() {
  return <ExploreClient />;
}
