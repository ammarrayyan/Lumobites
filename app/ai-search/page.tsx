import { redirect } from 'next/navigation';

export default function AiSearchRedirectPage() {
  redirect('/lost-pets?tab=ai');
}
