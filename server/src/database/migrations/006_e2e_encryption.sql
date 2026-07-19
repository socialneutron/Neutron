-- ── E2E Encryption Support ──────────────────────────────

-- Add public key columns to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS public_key TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS fingerprint VARCHAR(63) DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS key_uploaded_at TIMESTAMPTZ;

-- Add encryption columns to messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN DEFAULT FALSE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS encrypted_envelope JSONB;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS nonce BYTEA;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS mac BYTEA;

-- Index for key lookups
CREATE INDEX IF NOT EXISTS idx_users_fingerprint ON users(fingerprint);
CREATE INDEX IF NOT EXISTS idx_users_public_key ON users(public_key);
