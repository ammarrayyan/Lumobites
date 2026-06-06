-- Migration: Add time_slot column to sitting_requests table
ALTER TABLE sitting_requests ADD COLUMN IF NOT EXISTS time_slot text;
