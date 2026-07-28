/**
 * Veterinary Boarding subscription enforcement flag.
 *
 * Set NEXT_PUBLIC_VET_SUBSCRIPTION_ENFORCED=true in your environment variables
 * (Vercel dashboard / .env.local) to start gating vet clinic listings behind payment.
 * No code change required — just flip the env var and redeploy.
 */
export const VET_SUBSCRIPTION_ENFORCED =
  process.env.NEXT_PUBLIC_VET_SUBSCRIPTION_ENFORCED === 'true';
