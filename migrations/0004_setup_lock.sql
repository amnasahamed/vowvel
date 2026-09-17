CREATE TABLE IF NOT EXISTS setup_state (
  key TEXT PRIMARY KEY,
  completed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO setup_state(key)
SELECT 'owner_bootstrap' WHERE EXISTS (SELECT 1 FROM users WHERE role='owner');

