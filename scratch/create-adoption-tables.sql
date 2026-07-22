-- Migration script for Lumo Bites Adoption Feature

-- 1. Shelters table
CREATE TABLE IF NOT EXISTS shelters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_name TEXT NOT NULL,
  tax_id TEXT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT NOT NULL,
  state TEXT,
  zip TEXT,
  website TEXT,
  org_photo_url TEXT,
  rejection_reason TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Adoption Pets table
CREATE TABLE IF NOT EXISTS adoption_pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shelter_id UUID REFERENCES shelters(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  species TEXT NOT NULL DEFAULT 'dog', -- 'dog', 'cat', 'other'
  breed TEXT,
  age TEXT NOT NULL DEFAULT 'adult', -- 'puppy', 'young', 'adult', 'senior'
  size TEXT NOT NULL DEFAULT 'medium', -- 'small', 'medium', 'large', 'extra_large'
  sex TEXT NOT NULL DEFAULT 'male', -- 'male', 'female'
  spayed_neutered BOOLEAN DEFAULT TRUE,
  temperament TEXT, -- e.g. "good with kids, low energy"
  description TEXT,
  adoption_fee TEXT,
  adoption_process TEXT,
  photo_urls TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'available', -- 'available', 'pending', 'adopted'
  city TEXT NOT NULL,
  state TEXT,
  zip TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Adoption Messages table
CREATE TABLE IF NOT EXISTS adoption_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID REFERENCES adoption_pets(id) ON DELETE CASCADE,
  shelter_id UUID REFERENCES shelters(id) ON DELETE CASCADE,
  sender_email TEXT NOT NULL,
  receiver_email TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
