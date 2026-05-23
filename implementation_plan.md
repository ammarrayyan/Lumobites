# Add Pet Sitting Marketplace

This feature will add a new `/petsitting` marketplace connecting Pet Owners with Sitters. Sitters will pay a $9.99/mo subscription to be listed, and Owners will get 3 free requests or unlimited requests if they have the existing Lumo Bites Pro ($2.99/mo) subscription.

> [!IMPORTANT]
> **User Execution Required: Database Tables**
> We do not have direct administrative access to your Supabase database from the codebase environment. Please run the following SQL script in your Supabase SQL Editor to create the required tables:
>
> ```sql
> -- Create Sitters Table
> CREATE TABLE sitters (
>   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
>   email text UNIQUE NOT NULL,
>   name text NOT NULL,
>   photo_url text,
>   city text,
>   zip text,
>   bio text,
>   pet_types text, -- 'dog', 'cat', 'both'
>   rate_per_night numeric,
>   availability boolean DEFAULT true,
>   is_pro boolean DEFAULT false,
>   created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
> );
>
> -- Create Sitting Requests Table (To track owner quotas)
> CREATE TABLE sitting_requests (
>   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
>   owner_email text NOT NULL,
>   sitter_id uuid REFERENCES sitters(id),
>   pet_name text,
>   pet_type text,
>   dates text,
>   special_notes text,
>   created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
> );
> ```

## Proposed Changes

### Database & Webhooks

#### [NEW] `/app/api/stripe/checkout-sitter/route.ts`
- Creates a new Stripe checkout session for "Lumo Sitter Pro".
- Dynamically creates the $9.99/mo Stripe Product and Price if they don't exist yet (similar to the existing scanner checkout logic).

#### [MODIFY] `/app/api/stripe/webhook/route.ts`
- Intercepts webhook events.
- Differentiates between the $2.99 "scanner-pro" and $9.99 "sitter-pro" subscriptions using Stripe metadata.
- Updates the `sitters.is_pro` status to `true` when a sitter pays.

---

### Backend API

#### [NEW] `/app/api/petsitting/request/route.ts`
- Receives booking requests from Owners.
- **Quota Logic:** Checks the `sitting_requests` table to see how many requests this `owner_email` has made this month.
- **Pro Check:** Checks the `emails` table. If `is_pro` is true (they pay $2.99/mo), they get unlimited requests. If not, they are capped at 3 requests/month.
- **Email:** Uses the existing Resend integration to email the Sitter with the Owner's request details and the Owner's email address (so the sitter can reply directly to them).
- Logs the request to the `sitting_requests` table.

#### [NEW] `/app/api/petsitting/profile/route.ts`
- Handles Sitter profile creation and updates. Accepts `name`, `photo_url`, `zip`, `bio`, `rate_per_night`, etc.

---

### Frontend UI

#### [MODIFY] `/components/Navbar.tsx`
- Add the "Pet Sitting" link to the desktop and mobile navigation menus.

#### [NEW] `/app/petsitting/page.tsx`
- A beautiful, two-tab layout matching the existing Lumo Bites aesthetic (cream `#FDFAF7` background, brown tones, clean cards).
- **Tab 1: Find a Sitter (Owner View)**
  - Search bar (by zip code and pet type).
  - Fetches active sitters (`is_pro=true`, `availability=true`) from Supabase.
  - Displays polished Sitter Cards featuring their photo, rate, and a "Verified" badge.
  - "Request Sitter" button opens a Modal.
- **Tab 2: Become a Sitter (Sitter View)**
  - Form to create/edit their sitter profile.
  - "Upgrade to Lumo Sitter Pro - $9.99/mo" button that redirects to the new Stripe checkout route.
  - Profile status indicator (Hidden vs Active in Search).

## Verification Plan

### Manual Verification
1. Ensure the user has run the SQL script.
2. Sign up as a Sitter, create a profile, and click Upgrade. Verify Stripe checkout works for $9.99.
3. Approve the payment (or use test mode), verify the webhook triggers and sets the Sitter to active.
4. As an Owner, search for the Sitter, submit a request, verify Resend delivers the email, and verify the 3-request quota works correctly.
