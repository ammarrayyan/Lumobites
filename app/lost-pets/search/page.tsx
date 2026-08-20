import { redirect } from 'next/navigation';

export default function LostPetsSearchRedirectPage() {
  redirect('/lost-pets?tab=ai');
}
