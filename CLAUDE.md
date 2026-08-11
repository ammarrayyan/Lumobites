# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # start Next.js dev server
npm run build    # production build, then runs scripts/postbuild-fix-availability.js
npm start        # serve production build
npm run lint     # eslint (flat config, eslint-config-next)
```

There is no test suite/framework configured in this repo (no jest/vitest/playwright, no `test` script).

## What this is

"Lumo Bites" (`net.lumobites.app`) — a Next.js App Router web app that is also shipped as a native iOS/Android app via Capacitor. It started as a pet-food recommender and has grown into a multi-vertical marketplace: food recommender/scanner, vet boarding, pet daycare, pet sitting, shelter adoption, lost pets, city board, and an affiliate program — all in one codebase.

Important: `capacitor.config.ts` points the native apps at the **live deployed site** (`server.url: https://lumobites.net`), not a locally bundled `out/`. So native-app behavior is effectively "whatever is currently deployed," not what's on disk.

## Architecture

**Routing**: `app/` is the Next.js App Router. Each vertical has its own top-level route (`app/vet-boarding`, `app/pet-daycare`, `app/petsitting`, `app/adoption`, `app/lost-pets`, `app/affiliate`, `app/city-board`, etc.), each usually paired with a `dashboard` sub-route for the partner/provider side. `app/api/*` mirrors this by feature area rather than by REST resource — look for the matching subfolder under `app/api/` before creating a new one.

**Auth is not Supabase Auth** — there's no real user table with passwords. Two parallel identity mechanisms exist:
- Client-side "who's signed in" is resolved by [lib/authHelper.ts](lib/authHelper.ts) `getSignedInUserEmail()`, which reads role-scoped keys from `localStorage` in priority order (`lumo_pro_email` → `lumo_sitter_email` → `lumo_shelter_email`). Do not merge or overwrite across these keys — that's a deliberate invariant, not an oversight.
- Server-side account sessions use an HMAC-signed cookie (`lumo_account_session`) minted/verified in [lib/accountAuth.ts](lib/accountAuth.ts) (`createAccountSessionToken` / `getVerifiedSessionEmail`), with revocation checked against `emails.session_invalidated_at`. It fails closed on any DB error.
- Admin API routes check a static header instead: `x-admin-key` (or `Authorization: Bearer`) must equal `process.env.ADMIN_API_KEY`, verified via [lib/adminAuth.ts](lib/adminAuth.ts) `isAuthorizedAdmin()`. This is a server-only env var — never prefix it `NEXT_PUBLIC_`, and never hardcode a fallback value in a route file (both of those were real, since-fixed incidents: the key used to be `NEXT_PUBLIC_ADMIN_BYPASS_KEY`, shipped in the client JS bundle, and several routes separately hardcoded a stale literal password that didn't even track key rotation). `app/admin/page.tsx` is the human-facing login (password typed once, held in `sessionStorage`, sent as a header on each request) — don't reintroduce a client-side comparison against the admin key for anything.

**Data access**: [lib/supabase.ts](lib/supabase.ts) exports two clients — `supabase` (anon key) and `supabaseAdmin` (service-role key, bypasses RLS, falls back to the anon key if the service key isn't set). Server routes/lib code that need to read/write across users use `supabaseAdmin`.

**Entitlements / "Pro" status**: [lib/aiLimiter.ts](lib/aiLimiter.ts) `getUserProStatusDetails()` is the single source of truth for whether an email is "Pro," and it fans out across several unrelated tables/products: a hardcoded unlimited-admin allowlist, partner subscriptions (`vet_clinics` $40/mo, `pet_daycares` $30/mo, `shelters` $20/mo, each with its own `status`/`subscription_status`/`trial_end` fields), and the direct AI membership (`emails.is_pro` at $4.99/mo). `checkAndTrackAiUsage()` layers per-user daily/lifetime AI-call caps plus a shared global monthly cost cap (`SHARED_MONTHLY_GLOBAL_CAP`) on top of that, logging every call to `ai_usage_logs`. When adding a new AI-gated feature, add it to `AiFeatureKey`/`AI_LIMIT_CONFIG` rather than inventing a separate limiter.

**Recommendation engine**: [lib/recommender.ts](lib/recommender.ts) scores `Product` rows against a `PetProfile` (species, life stage, health tags, budget, food type) using [lib/ingredients.ts](lib/ingredients.ts) (ingredient database) and [lib/brand-matcher.ts](lib/brand-matcher.ts); [lib/parser.ts](lib/parser.ts) derives structured pet info (life stage, etc.) from free text for the chat-based intake flow. Shared domain types live in [lib/types.ts](lib/types.ts).

**Billing**: Stripe is used per-vertical (scanner/AI membership, sitter pro, vet/daycare/shelter partner plans). `app/api/stripe/webhook` differentiates subscription products via Stripe metadata and updates the corresponding partner table's `is_pro`/`subscription_status`. Partner billing/dunning cron logic lives under `app/api/cron/*`, scheduled by `vercel.json` (`crons`: backup, reviews, cleanup-notifications, cleanup-twin, partner-billing).

**Push/notifications**: Firebase (`lib/firebase.ts` client, `lib/firebase-admin.ts` server) + Capacitor push plugins handle native push; `lib/push.ts` and `app/api/push/*`, `app/api/notifications/*` handle web/server-side dispatch.

**Path alias**: `@/*` maps to the repo root (see `tsconfig.json`).

## Repo conventions

- `scratch/` holds one-off scripts (migrations, audits, manual test scripts, debugging) that are not part of the app — expect it to be messy and not necessarily current; don't treat files there as documentation of the live schema.
- Supabase schema changes are applied manually by the user via the Supabase SQL editor (see e.g. `implementation_plan.md`) — there is no migration runner in this repo. If a feature needs new tables/columns, surface the SQL for the user to run rather than assuming it can be applied programmatically.
