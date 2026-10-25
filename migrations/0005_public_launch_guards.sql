-- Database-enforced caps survive concurrent requests and apply to every writer.
CREATE INDEX IF NOT EXISTS members_user ON room_members(user_id);
CREATE INDEX IF NOT EXISTS sessions_user_created ON sessions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ideas_author ON ideas(author_id);
CREATE INDEX IF NOT EXISTS votes_user ON votes(user_id);
CREATE INDEX IF NOT EXISTS comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS feedback_user ON feedback(user_id);
CREATE INDEX IF NOT EXISTS rooms_status_end ON rooms(status, ends_at);

CREATE TRIGGER users_capacity BEFORE INSERT ON users
WHEN (SELECT COUNT(*) FROM users) >= 5000
BEGIN SELECT RAISE(ABORT, 'APP_CAPACITY'); END;

CREATE TRIGGER rooms_capacity BEFORE INSERT ON rooms
WHEN (SELECT COUNT(*) FROM rooms) >= 2000 OR (SELECT COUNT(*) FROM rooms WHERE host_id=NEW.host_id) >= 20
BEGIN SELECT RAISE(ABORT, 'APP_CAPACITY'); END;

CREATE TRIGGER members_capacity BEFORE INSERT ON room_members
WHEN NOT EXISTS (SELECT 1 FROM room_members WHERE room_id=NEW.room_id AND user_id=NEW.user_id)
AND ((SELECT COUNT(*) FROM room_members WHERE user_id=NEW.user_id) >= 50 OR (SELECT COUNT(*) FROM room_members WHERE room_id=NEW.room_id) >= 100)
BEGIN SELECT RAISE(ABORT, 'APP_CAPACITY'); END;

CREATE TRIGGER members_ban BEFORE INSERT ON room_members
WHEN EXISTS (SELECT 1 FROM room_bans WHERE room_id=NEW.room_id AND user_id=NEW.user_id)
BEGIN SELECT RAISE(ABORT, 'APP_MEMBERSHIP'); END;

CREATE TRIGGER ideas_capacity BEFORE INSERT ON ideas
WHEN (SELECT COUNT(*) FROM ideas WHERE room_id=NEW.room_id) >= 100
BEGIN SELECT RAISE(ABORT, 'APP_CAPACITY'); END;

CREATE TRIGGER ideas_authorization BEFORE INSERT ON ideas
WHEN NOT EXISTS (SELECT 1 FROM room_members WHERE room_id=NEW.room_id AND user_id=NEW.author_id)
OR NOT EXISTS (SELECT 1 FROM rooms WHERE id=NEW.room_id AND status='open' AND ends_at>unixepoch('now')*1000)
BEGIN SELECT RAISE(ABORT, 'APP_VOTING_CLOSED_OR_MEMBERSHIP'); END;

CREATE TRIGGER votes_insert_authorization BEFORE INSERT ON votes
WHEN NOT EXISTS (SELECT 1 FROM ideas i JOIN rooms r ON r.id=i.room_id JOIN room_members m ON m.room_id=r.id
  WHERE i.id=NEW.idea_id AND m.user_id=NEW.user_id AND i.author_id<>NEW.user_id AND r.status='open' AND r.ends_at>unixepoch('now')*1000)
BEGIN SELECT RAISE(ABORT, 'APP_VOTING_CLOSED_OR_MEMBERSHIP'); END;

CREATE TRIGGER votes_update_authorization BEFORE UPDATE ON votes
WHEN NOT EXISTS (SELECT 1 FROM ideas i JOIN rooms r ON r.id=i.room_id JOIN room_members m ON m.room_id=r.id
  WHERE i.id=NEW.idea_id AND m.user_id=NEW.user_id AND i.author_id<>NEW.user_id AND r.status='open' AND r.ends_at>unixepoch('now')*1000)
BEGIN SELECT RAISE(ABORT, 'APP_VOTING_CLOSED_OR_MEMBERSHIP'); END;

CREATE TRIGGER comments_capacity BEFORE INSERT ON comments
WHEN (SELECT COUNT(*) FROM comments c JOIN ideas i ON i.id=c.idea_id WHERE i.room_id=(SELECT room_id FROM ideas WHERE id=NEW.idea_id)) >= 500
BEGIN SELECT RAISE(ABORT, 'APP_CAPACITY'); END;

CREATE TRIGGER comments_authorization BEFORE INSERT ON comments
WHEN NOT EXISTS (SELECT 1 FROM ideas i JOIN room_members m ON m.room_id=i.room_id WHERE i.id=NEW.idea_id AND m.user_id=NEW.user_id)
BEGIN SELECT RAISE(ABORT, 'APP_MEMBERSHIP'); END;

CREATE TRIGGER feedback_capacity BEFORE INSERT ON feedback
WHEN (SELECT COUNT(*) FROM feedback WHERE user_id=NEW.user_id) >= 20 OR (SELECT COUNT(*) FROM feedback) >= 20000
BEGIN SELECT RAISE(ABORT, 'APP_CAPACITY'); END;

-- New sessions evict the oldest, rather than locking a user out at the cap.
CREATE TRIGGER sessions_capacity AFTER INSERT ON sessions
BEGIN
  DELETE FROM sessions WHERE user_id=NEW.user_id AND id_hash NOT IN
    (SELECT id_hash FROM sessions WHERE user_id=NEW.user_id ORDER BY created_at DESC,rowid DESC LIMIT 5);
END;
