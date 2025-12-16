CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  host_id TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'Sprint Retrospective',
  stage TEXT NOT NULL DEFAULT 'setup',
  settings TEXT NOT NULL,
  timer_end_at INTEGER,
  ice_breakers_revealed INTEGER NOT NULL DEFAULT 0,
  votes_revealed INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Migration: Add votes_revealed column if it doesn't exist
-- SQLite doesn't have IF NOT EXISTS for ALTER TABLE, so we need to check
ALTER TABLE sessions ADD COLUMN votes_revealed INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  is_host INTEGER NOT NULL DEFAULT 0,
  color TEXT NOT NULL,
  cursor_position TEXT,
  joined_at INTEGER NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cards (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  column_name TEXT NOT NULL,
  content TEXT NOT NULL,
  position TEXT NOT NULL,
  cluster_id TEXT,
  is_revealed INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (cluster_id) REFERENCES clusters(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS clusters (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'Cluster',
  card_ids TEXT NOT NULL,
  column_name TEXT NOT NULL,
  position TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS votes (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK(target_type IN ('card', 'cluster')),
  created_at INTEGER NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS action_items (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  owner TEXT NOT NULL,
  task TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ice_breakers (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('gif', 'drawing', 'text')),
  created_at INTEGER NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_users_session ON users(session_id);
CREATE INDEX IF NOT EXISTS idx_cards_session ON cards(session_id);
CREATE INDEX IF NOT EXISTS idx_cards_cluster ON cards(cluster_id);
CREATE INDEX IF NOT EXISTS idx_clusters_session ON clusters(session_id);
CREATE INDEX IF NOT EXISTS idx_votes_session ON votes(session_id);
CREATE INDEX IF NOT EXISTS idx_votes_user ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_action_items_session ON action_items(session_id);
CREATE INDEX IF NOT EXISTS idx_ice_breakers_session ON ice_breakers(session_id);
