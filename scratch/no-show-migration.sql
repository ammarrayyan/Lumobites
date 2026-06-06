-- Migration: Add no show columns to sitters and sitting_requests tables
ALTER TABLE sitters ADD COLUMN IF NOT EXISTS no_show_count integer DEFAULT 0;
ALTER TABLE sitting_requests ADD COLUMN IF NOT EXISTS no_show_at timestamp with time zone;
