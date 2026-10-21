ALTER TABLE users ADD COLUMN last_seen_at INTEGER NOT NULL DEFAULT 0;
UPDATE users SET last_seen_at = unixepoch() * 1000 WHERE last_seen_at = 0;
CREATE INDEX users_last_seen ON users(last_seen_at);
