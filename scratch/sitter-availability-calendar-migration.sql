-- Migration: Add blocked_dates column to sitters table
ALTER TABLE sitters ADD COLUMN IF NOT EXISTS blocked_dates jsonb DEFAULT '[]';
