-- Migration: Add rejection_reason column to pet_daycares table
ALTER TABLE public.pet_daycares ADD COLUMN IF NOT EXISTS rejection_reason text DEFAULT '';
