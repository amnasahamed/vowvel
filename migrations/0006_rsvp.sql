PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS rsvp_submissions (
  id TEXT PRIMARY KEY,
  invitation_id TEXT NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
  edit_token_hash TEXT NOT NULL UNIQUE,
  guest_name TEXT NOT NULL,
  email TEXT COLLATE NOCASE,
  attendance TEXT NOT NULL CHECK (attendance IN ('yes','no')),
  party_size INTEGER NOT NULL CHECK (party_size BETWEEN 0 AND 20),
  guest_names TEXT NOT NULL DEFAULT '',
  dietary_notes TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS rsvp_invitation_updated_idx
  ON rsvp_submissions(invitation_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS rsvp_event_selections (
  rsvp_id TEXT NOT NULL REFERENCES rsvp_submissions(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL,
  event_name TEXT NOT NULL,
  PRIMARY KEY (rsvp_id, event_id)
);

CREATE INDEX IF NOT EXISTS rsvp_events_rsvp_idx
  ON rsvp_event_selections(rsvp_id);
