-- URGENT: run this now in the Supabase Dashboard SQL Editor.
-- Confirmed live right now: the anon key can read all rows of both tables,
-- including referred customer emails and subscription/revenue data.
-- Enabling RLS with zero policies is correct here — there is no legitimate
-- reason for the anon or authenticated role to read these tables directly;
-- all real access now goes through supabaseAdmin (service role, which
-- bypasses RLS) via the app's API routes and middleware.ts.

ALTER TABLE IF EXISTS public.referrers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.referred_users ENABLE ROW LEVEL SECURITY;
