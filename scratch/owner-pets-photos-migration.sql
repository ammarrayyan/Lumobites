-- Migration: Add photo_urls column to owner_pets table
-- Execute this script in your Supabase SQL Editor

ALTER TABLE owner_pets ADD COLUMN IF NOT EXISTS photo_urls jsonb DEFAULT '[]';
