PRAGMA foreign_keys = OFF;

CREATE TABLE otp_challenges_next (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL COLLATE NOCASE,
  purpose TEXT NOT NULL CHECK (purpose IN ('admin','partner','customer')),
  code_hash TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT NOT NULL,
  consumed_at TEXT,
  ip_hash TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO otp_challenges_next SELECT * FROM otp_challenges;
DROP TABLE otp_challenges;
ALTER TABLE otp_challenges_next RENAME TO otp_challenges;
CREATE INDEX otp_challenges_lookup_idx ON otp_challenges(email, purpose, created_at DESC);

ALTER TABLE invitations ADD COLUMN custom_subdomain TEXT COLLATE NOCASE;
CREATE UNIQUE INDEX invitations_custom_subdomain_idx ON invitations(custom_subdomain) WHERE custom_subdomain IS NOT NULL;

PRAGMA foreign_keys = ON;
