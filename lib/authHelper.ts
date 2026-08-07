/**
 * Shared Session & Auth Resolver for Lumo Bites
 * Resolves the active signed-in email address for the user session.
 * 
 * CRITICAL RULE: This resolver reads role keys in priority order (Owner -> Sitter -> Shelter)
 * WITHOUT modifying, overwriting, or copying values across different role keys in localStorage.
 */

export function getSignedInUserEmail(): string {
  if (typeof window === 'undefined') return '';
  try {
    const proEmail = localStorage.getItem('lumo_pro_email');
    if (proEmail && proEmail !== 'undefined' && proEmail !== 'null' && proEmail.trim() !== '') {
      return proEmail.trim();
    }
    const sitterEmail = localStorage.getItem('lumo_sitter_email');
    if (sitterEmail && sitterEmail !== 'undefined' && sitterEmail !== 'null' && sitterEmail.trim() !== '') {
      return sitterEmail.trim();
    }
    const shelterEmail = localStorage.getItem('lumo_shelter_email');
    if (shelterEmail && shelterEmail !== 'undefined' && shelterEmail !== 'null' && shelterEmail.trim() !== '') {
      return shelterEmail.trim();
    }
  } catch (e) {
    console.error('[getSignedInUserEmail] Error reading localStorage:', e);
  }
  return '';
}
