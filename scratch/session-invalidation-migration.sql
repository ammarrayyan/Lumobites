ALTER TABLE emails ADD COLUMN IF NOT EXISTS session_invalidated_at timestamptz;
ALTER TABLE sitters ADD COLUMN IF NOT EXISTS session_invalidated_at timestamptz;
