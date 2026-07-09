-- ALTER existing reports table to add new UGC moderation columns
ALTER TABLE reports ADD COLUMN IF NOT EXISTS reported_by_email text;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS post_id text;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS post_type text;

-- CREATE banned_cookies table to block anonymous users on City Board
CREATE TABLE IF NOT EXISTS banned_cookies (
  cookie text PRIMARY KEY,
  created_at timestamptz DEFAULT now()
);
