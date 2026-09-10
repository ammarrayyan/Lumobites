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

export interface SignOutOptions {
  redirectTo?: string;
  reload?: boolean;
}

/**
 * Centralized Sign Out for Lumo Bites
 * Clears all role-specific and global auth items from localStorage & cookies,
 * dispatches the 'lumo-pro-update' event for reactive UI updates,
 * and performs a clean reload or redirect so all stale in-memory state unmounts.
 */
export function signOutUser(options?: SignOutOptions): void {
  if (typeof window === 'undefined') return;

  try {
    // 1. Clear all auth keys from localStorage
    localStorage.removeItem('lumo_pro_email');
    localStorage.removeItem('lumo_sitter_email');
    localStorage.removeItem('lumo_sitter_id');
    localStorage.removeItem('lumo_sitter_email_expiry');
    localStorage.removeItem('lumo_shelter_email');
    localStorage.removeItem('lumo_account_email');
    localStorage.removeItem('lumo_account_session_token');
    localStorage.removeItem('lumo_admin_bypass');
    localStorage.removeItem('lumo_session_started_at');
    localStorage.removeItem('lumo_redirect_after_login');

    // 2. Clear all auth cookies
    const cookieNames = [
      'lumo_pro_email',
      'lumo_account_session_token',
      'lumo_account_session',
      'lumo_sitter_email',
      'lumo_shelter_email'
    ];
    for (const name of cookieNames) {
      document.cookie = `${name}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }

    // 3. Dispatch global sync events
    window.dispatchEvent(new Event('lumo-pro-update'));
    window.dispatchEvent(new Event('storage'));

    // 4. Handle navigation / reload
    const redirectTo = options?.redirectTo;
    const shouldReload = options?.reload !== false;

    if (redirectTo) {
      const currentUrl = window.location.pathname + window.location.search;
      if (currentUrl === redirectTo) {
        window.location.reload();
      } else {
        window.location.href = redirectTo;
      }
    } else if (shouldReload) {
      window.location.reload();
    }
  } catch (e) {
    console.error('[signOutUser] Error during sign-out:', e);
  }
}
