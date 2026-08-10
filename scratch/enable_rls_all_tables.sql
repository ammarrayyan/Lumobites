-- ============================================================
-- SUPABASE SECURITY HARDENING: ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================

-- 1. User & Account Credentials
ALTER TABLE IF EXISTS public.emails ENABLE ROW LEVEL SECURITY;

-- 2. Pet Sitters & Reviews
ALTER TABLE IF EXISTS public.sitters ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sitter_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sitter_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sitting_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sitter_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sitter_availability ENABLE ROW LEVEL SECURITY;

-- 3. Veterinary Clinics & Inquiries
ALTER TABLE IF EXISTS public.vet_clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.vet_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.vet_clinic_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.vet_availability ENABLE ROW LEVEL SECURITY;

-- 4. Pet Daycares & Inquiries
ALTER TABLE IF EXISTS public.pet_daycares ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.daycare_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pet_daycare_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.daycare_availability ENABLE ROW LEVEL SECURITY;

-- 5. Shelters & Adoption
ALTER TABLE IF EXISTS public.shelters ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.adoption_pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.adoption_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.shelter_pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.shelter_inquiries ENABLE ROW LEVEL SECURITY;

-- 6. Lost Pets & Community
ALTER TABLE IF EXISTS public.lost_pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.lost_pet_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.lost_pet_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.city_board_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.city_board_replies ENABLE ROW LEVEL SECURITY;

-- 7. Affiliates, Referrals & Moderation
ALTER TABLE IF EXISTS public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.referrers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.referred_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.banned_cookies ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.outreach_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.partner_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.twin_match_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.owner_pets ENABLE ROW LEVEL SECURITY;

-- Service Role Key Access is automatically granted full bypass privileges by Supabase.
