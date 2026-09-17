PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL COLLATE NOCASE UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner','admin','finance','support','content','influencer','customer')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','pending','suspended','disabled')),
  email_verified_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  csrf_token TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ip_hash TEXT,
  user_agent TEXT
);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS invitations (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id),
  slug TEXT UNIQUE,
  state TEXT NOT NULL DEFAULT 'draft' CHECK (state IN ('draft','published','paused','expired')),
  published_revision_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invitation_revisions (
  id TEXT PRIMARY KEY,
  invitation_id TEXT NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
  revision_number INTEGER NOT NULL,
  data_json TEXT NOT NULL,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(invitation_id, revision_number)
);

CREATE TABLE IF NOT EXISTS coupon_campaigns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','paused','expired')),
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage','fixed')),
  discount_value INTEGER NOT NULL CHECK (discount_value > 0),
  max_discount_cents INTEGER,
  min_subtotal_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  starts_at TEXT,
  ends_at TEXT,
  global_limit INTEGER,
  per_customer_limit INTEGER NOT NULL DEFAULT 1,
  first_purchase_only INTEGER NOT NULL DEFAULT 0 CHECK (first_purchase_only IN (0,1)),
  stackable INTEGER NOT NULL DEFAULT 0 CHECK (stackable IN (0,1)),
  scope_json TEXT NOT NULL DEFAULT '{}',
  commission_bps INTEGER NOT NULL DEFAULT 0 CHECK (commission_bps BETWEEN 0 AND 10000),
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS influencer_profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','suspended')),
  bio TEXT NOT NULL DEFAULT '',
  channels_json TEXT NOT NULL DEFAULT '[]',
  audience_size INTEGER,
  payout_name TEXT,
  payout_upi TEXT,
  tax_id TEXT,
  payout_hold INTEGER NOT NULL DEFAULT 0 CHECK (payout_hold IN (0,1)),
  reviewed_by TEXT REFERENCES users(id),
  reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS coupon_codes (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES coupon_campaigns(id) ON DELETE CASCADE,
  code TEXT NOT NULL COLLATE NOCASE UNIQUE,
  batch_id TEXT,
  influencer_id TEXT REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','revoked')),
  max_redemptions INTEGER,
  reserved_count INTEGER NOT NULL DEFAULT 0 CHECK (reserved_count >= 0),
  redeemed_count INTEGER NOT NULL DEFAULT 0 CHECK (redeemed_count >= 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS coupon_codes_campaign_idx ON coupon_codes(campaign_id);
CREATE INDEX IF NOT EXISTS coupon_codes_influencer_idx ON coupon_codes(influencer_id);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  invitation_id TEXT REFERENCES invitations(id),
  state TEXT NOT NULL DEFAULT 'pending' CHECK (state IN ('pending','awaiting_payment','paid','failed','cancelled','partially_refunded','refunded')),
  currency TEXT NOT NULL DEFAULT 'INR',
  subtotal_cents INTEGER NOT NULL,
  discount_cents INTEGER NOT NULL DEFAULT 0,
  tax_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL,
  coupon_code_id TEXT REFERENCES coupon_codes(id),
  influencer_id TEXT REFERENCES users(id),
  commission_bps INTEGER NOT NULL DEFAULT 0,
  provider_order_id TEXT UNIQUE,
  provider_payment_id TEXT UNIQUE,
  price_snapshot_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  paid_at TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS orders_user_idx ON orders(user_id);
CREATE INDEX IF NOT EXISTS orders_influencer_idx ON orders(influencer_id);
CREATE INDEX IF NOT EXISTS orders_state_idx ON orders(state);

CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id TEXT PRIMARY KEY,
  coupon_code_id TEXT NOT NULL REFERENCES coupon_codes(id),
  campaign_id TEXT NOT NULL REFERENCES coupon_campaigns(id),
  order_id TEXT NOT NULL REFERENCES orders(id) UNIQUE,
  user_id TEXT NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved','used','released','reversed')),
  discount_cents INTEGER NOT NULL,
  reserved_until TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS redemptions_code_idx ON coupon_redemptions(coupon_code_id, status);
CREATE INDEX IF NOT EXISTS redemptions_user_idx ON coupon_redemptions(user_id, campaign_id, status);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id),
  provider TEXT NOT NULL DEFAULT 'razorpay',
  provider_order_id TEXT,
  provider_payment_id TEXT,
  amount_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created','authorized','captured','failed','refunded','partially_refunded')),
  raw_status TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(provider, provider_payment_id)
);

CREATE TABLE IF NOT EXISTS webhook_events (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  provider_event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  processed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(provider, provider_event_id)
);

CREATE TABLE IF NOT EXISTS commission_ledger (
  id TEXT PRIMARY KEY,
  influencer_id TEXT NOT NULL REFERENCES users(id),
  order_id TEXT NOT NULL REFERENCES orders(id),
  entry_type TEXT NOT NULL CHECK (entry_type IN ('earned','reversal','adjustment','paid')),
  basis_cents INTEGER NOT NULL,
  rate_bps INTEGER NOT NULL,
  amount_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','available','approved','paid','held','reversed')),
  available_at TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  created_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS commission_earned_order_idx ON commission_ledger(order_id) WHERE entry_type = 'earned';
CREATE INDEX IF NOT EXISTS commission_influencer_idx ON commission_ledger(influencer_id, status, available_at);

CREATE TABLE IF NOT EXISTS payouts (
  id TEXT PRIMARY KEY,
  influencer_id TEXT NOT NULL REFERENCES users(id),
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','processing','paid','failed','cancelled')),
  provider_reference TEXT,
  period_start TEXT,
  period_end TEXT,
  approved_by TEXT REFERENCES users(id),
  paid_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payout_items (
  payout_id TEXT NOT NULL REFERENCES payouts(id) ON DELETE CASCADE,
  ledger_id TEXT NOT NULL REFERENCES commission_ledger(id),
  amount_cents INTEGER NOT NULL,
  PRIMARY KEY (payout_id, ledger_id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  actor_id TEXT REFERENCES users(id),
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  before_json TEXT,
  after_json TEXT,
  reason TEXT,
  ip_hash TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS audit_created_idx ON audit_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_by TEXT REFERENCES users(id),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO app_settings(key, value_json) VALUES
  ('commerce', '{"basePriceCents":149900,"currency":"INR","taxBps":0,"commissionHoldDays":14,"minimumPayoutCents":100000}');

