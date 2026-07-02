CREATE TABLE webhook_events (
    id           UUID PRIMARY KEY,
    event_id     VARCHAR(64)  NOT NULL,
    event_type   VARCHAR(64)  NOT NULL,
    payload_hash VARCHAR(64),
    status       VARCHAR(16)  NOT NULL,
    received_at  TIMESTAMP    NOT NULL,
    processed_at TIMESTAMP
);

CREATE UNIQUE INDEX idx_webhook_events_event_id ON webhook_events (event_id);
