-- ============================================================
-- Lumo Bites: Veterinary Boarding Availability Table
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================

create table if not exists vet_clinic_availability (
  id         uuid primary key default gen_random_uuid(),
  clinic_id  uuid not null references vet_clinics(id) on delete cascade,
  date       date not null,
  status     text not null default 'full', -- 'full' or 'available'
  created_at timestamptz default now(),
  unique (clinic_id, date)
);

create index if not exists vca_clinic_idx on vet_clinic_availability(clinic_id);
create index if not exists vca_date_idx   on vet_clinic_availability(date);
