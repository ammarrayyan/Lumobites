-- Migration: Add needs_reapproval column to sitters table
ALTER TABLE sitters ADD COLUMN IF NOT EXISTS needs_reapproval boolean DEFAULT false;
