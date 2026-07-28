-- ==============================================================================
-- Migration: Pet Daycare Schema
-- Description: Creates pet_daycares, daycare_inquiries, and daycare_availability tables.
-- ==============================================================================

-- 1. Create pet_daycares table
CREATE TABLE IF NOT EXISTS public.pet_daycares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL,
  license_number TEXT DEFAULT '',
  email TEXT UNIQUE NOT NULL,
  phone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  city TEXT NOT NULL,
  state TEXT DEFAULT '',
  zip TEXT DEFAULT '',
  website TEXT DEFAULT '',
  description TEXT DEFAULT '',
  services TEXT[] DEFAULT '{}',
  logo_url TEXT DEFAULT '',
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  is_paused BOOLEAN DEFAULT false,
  stripe_customer_id TEXT DEFAULT '',
  stripe_subscription_id TEXT DEFAULT '',
  subscription_status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for fast lookup on approved daycares by city/email/status
CREATE INDEX IF NOT EXISTS idx_pet_daycares_status ON public.pet_daycares(status);
CREATE INDEX IF NOT EXISTS idx_pet_daycares_email ON public.pet_daycares(email);
CREATE INDEX IF NOT EXISTS idx_pet_daycares_city ON public.pet_daycares(city);

-- Disable RLS or grant full access to service role / public for simple querying
ALTER TABLE public.pet_daycares DISABLE ROW LEVEL SECURITY;


-- 2. Create daycare_inquiries table (Messaging threads between pet owners and daycares)
CREATE TABLE IF NOT EXISTS public.daycare_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daycare_id UUID NOT NULL REFERENCES public.pet_daycares(id) ON DELETE CASCADE,
  owner_email TEXT NOT NULL,
  message TEXT DEFAULT '',
  status TEXT DEFAULT 'pending', -- 'pending', 'responded', 'closed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_daycare_owner_inquiry UNIQUE (daycare_id, owner_email)
);

CREATE INDEX IF NOT EXISTS idx_daycare_inquiries_daycare ON public.daycare_inquiries(daycare_id);
CREATE INDEX IF NOT EXISTS idx_daycare_inquiries_owner ON public.daycare_inquiries(owner_email);

ALTER TABLE public.daycare_inquiries DISABLE ROW LEVEL SECURITY;


-- 3. Create daycare_availability table (Date overrides for Full / Blocked days)
CREATE TABLE IF NOT EXISTS public.daycare_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daycare_id UUID NOT NULL REFERENCES public.pet_daycares(id) ON DELETE CASCADE,
  date DATE NOT NULL, -- YYYY-MM-DD
  status TEXT DEFAULT 'full', -- 'full'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_daycare_date UNIQUE (daycare_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daycare_availability_daycare_date ON public.daycare_availability(daycare_id, date);

ALTER TABLE public.daycare_availability DISABLE ROW LEVEL SECURITY;
