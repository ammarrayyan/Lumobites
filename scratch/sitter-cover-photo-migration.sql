-- Migration: Add cover_photo_url column to sitters table
ALTER TABLE sitters ADD COLUMN IF NOT EXISTS cover_photo_url text;
