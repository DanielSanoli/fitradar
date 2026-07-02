-- Pre-launch: invalidate existing plaintext tokens; store only SHA-256 hex at rest.
TRUNCATE refresh_tokens;
TRUNCATE user_action_tokens;

ALTER TABLE refresh_tokens RENAME COLUMN token TO token_hash;
ALTER TABLE refresh_tokens ALTER COLUMN token_hash TYPE VARCHAR(64);

ALTER TABLE user_action_tokens RENAME COLUMN token TO token_hash;
ALTER TABLE user_action_tokens ALTER COLUMN token_hash TYPE VARCHAR(64);
