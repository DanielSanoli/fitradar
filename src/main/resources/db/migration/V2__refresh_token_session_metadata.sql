ALTER TABLE refresh_tokens
    ADD COLUMN user_agent VARCHAR(512),
    ADD COLUMN ip_address VARCHAR(64);

CREATE INDEX idx_refresh_tokens_user_active ON refresh_tokens (user_id, revoked, expires_at);
