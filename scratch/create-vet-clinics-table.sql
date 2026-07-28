-- ============================================================
-- Lumo Bites: Veterinary Boarding tables
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Main clinic registry
create table if not exists vet_clinics (
  id                    uuid primary key default gen_random_uuid(),
  clinic_name           text not null,
  license_number        text,
  email                 text not null unique,
  phone                 text,
  address               text,
  city                  text not null,
  state                 text,
  zip                   text,
  website               text,
  org_photo_url         text,
  description           text,
  services              text[] default '{}',
  -- status: pending | approved | rejected | paused
  status                text not null default 'pending',
  rejection_reason      text,
  -- Stripe subscription scaffold (not enforced yet)
  stripe_customer_id    text,
  stripe_subscription_id text,
  subscription_status   text default 'inactive',
  -- Geo coords for distance filtering (optional, can be populated later)
  lat                   numeric,
  lng                   numeric,
  created_at            timestamptz default now()
);

-- 2. Inquiry threads (owner → clinic)
create table if not exists vet_inquiries (
  id           uuid primary key default gen_random_uuid(),
  clinic_id    uuid references vet_clinics(id) on delete cascade,
  owner_email  text not null,
  status       text not null default 'pending',
  created_at   timestamptz default now()
);

-- Indexes
create index if not exists vet_clinics_email_idx  on vet_clinics(email);
create index if not exists vet_clinics_status_idx on vet_clinics(status);
create index if not exists vet_inquiries_clinic_idx on vet_inquiries(clinic_id);
create index if not exists vet_inquiries_owner_idx  on vet_inquiries(owner_email);
