-- SQL Migration: Add self-declaration columns to sitters table
ALTER TABLE sitters ADD COLUMN IF NOT EXISTS self_declared boolean DEFAULT false;
ALTER TABLE sitters ADD COLUMN IF NOT EXISTS self_declared_at timestamp with time zone;
