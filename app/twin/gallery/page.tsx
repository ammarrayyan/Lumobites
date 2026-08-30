import { Metadata } from 'next';
import GalleryClient from './GalleryClient';

export const metadata: Metadata = {
  title: 'Pet Twin Gallery — See What Breed You Are 🐾',
  description: 'Explore the Pet Twin Gallery to see amazing matches from our community. Find out what dog or cat breed matches your personality and facial features!',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function PetTwinGalleryPage() {
  return <GalleryClient />;
}
