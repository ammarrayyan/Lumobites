/**
 * Global Feature Flags configuration for Lumo Bites.
 *
 * HOW TO RE-ENABLE:
 * To restore Veterinary Boarding or Pet Daycare across the app, simply change
 * the corresponding boolean flag below from `false` to `true`:
 *
 * - `vetBoarding: true`  -> Restores Veterinary Boarding in partner selection modals,
 *                           search filter dropdowns, map pins, and public search listings.
 * - `petDaycare: true`   -> Restores Pet Daycare in partner selection modals,
 *                           search filter dropdowns, map pins, and public search listings.
 *
 * NOTE: All backend API routes, database tables, and direct partner dashboard URLs
 * (`/vet-boarding/dashboard`, `/pet-daycare/dashboard`) remain fully active and functional
 * regardless of these visibility flags.
 */
export const FEATURES_ENABLED = {
  vetBoarding: false,
  petDaycare: false,
} as const;

export type FeatureFlagKey = keyof typeof FEATURES_ENABLED;
