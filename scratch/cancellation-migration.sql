-- Migration: Add cancellation columns to sitting_requests table
ALTER TABLE sitting_requests ADD COLUMN IF NOT EXISTS cancelled_at timestamp with time zone;
ALTER TABLE sitting_requests ADD COLUMN IF NOT EXISTS cancelled_by text;
