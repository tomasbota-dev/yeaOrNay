ALTER TABLE rooms ADD COLUMN icon TEXT NOT NULL DEFAULT '🎲';

CREATE TABLE room_bans (
  room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (room_id, user_id)
);

CREATE TABLE feedback (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating TEXT NOT NULL CHECK (rating IN ('good','bad')),
  note TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);
