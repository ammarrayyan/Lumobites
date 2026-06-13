-- Migration: Create owner_pets table and update sitting_requests
-- Execute this script in your Supabase SQL Editor

-- 1. Create owner_pets table
CREATE TABLE IF NOT EXISTS owner_pets (
  id uuid primary key default gen_random_uuid(),
  owner_email text not null,
  pet_name text not null,
  pet_type text not null, -- 'dog', 'cat', 'other'
  breed text,
  age text,
  weight text,
  gender text,
  spayed_neutered boolean default false,
  feeding_schedule text,
  medication text,
  behavior_notes text,
  vet_name text,
  vet_phone text,
  photo_url text,
  created_at timestamptz default now()
);

-- 2. Enable row level security and add policies
ALTER TABLE owner_pets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON owner_pets FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow public insert/select" ON owner_pets FOR ALL USING (true) WITH CHECK (true);

-- 3. Add pet_id and pet_details to sitting_requests table
ALTER TABLE sitting_requests ADD COLUMN IF NOT EXISTS pet_id uuid;
ALTER TABLE sitting_requests ADD COLUMN IF NOT EXISTS pet_details jsonb;
