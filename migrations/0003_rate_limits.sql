CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT NOT NULL,
  bucket_start INTEGER NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (key, bucket_start)
);
CREATE INDEX IF NOT EXISTS rate_limits_bucket_idx ON rate_limits(bucket_start);

