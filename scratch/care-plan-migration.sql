-- Migration: Add care_plan column to sitting_requests table
ALTER TABLE sitting_requests ADD COLUMN IF NOT EXISTS care_plan text;
