import { redirect } from 'next/navigation';

export default function AiPetSearchRedirectPage() {
  redirect('/lost-pets?tab=ai');
}
