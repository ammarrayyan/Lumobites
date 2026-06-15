-- Migration to support early access free accounts
ALTER TABLE emails ADD COLUMN IF NOT EXISTS source text DEFAULT 'unknown';
