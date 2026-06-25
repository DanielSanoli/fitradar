-- FitRadar baseline schema (PostgreSQL). Managed by Flyway — do not use ddl-auto in production.

CREATE TABLE users (
    id                  UUID PRIMARY KEY,
    name                VARCHAR(255) NOT NULL,
    email               VARCHAR(255) NOT NULL UNIQUE,
    password_hash       VARCHAR(255) NOT NULL,
    role                VARCHAR(32)  NOT NULL,
    creator_id          UUID,
    plan                VARCHAR(32)  NOT NULL,
    subscription_status VARCHAR(32)  NOT NULL,
    trial_ends_at       TIMESTAMP    NOT NULL,
    subscription_ends_at TIMESTAMP,
    asaas_customer_id   VARCHAR(64),
    asaas_subscription_id VARCHAR(64),
    asaas_wallet_id     VARCHAR(64),
    email_verified      BOOLEAN      NOT NULL DEFAULT FALSE,
    must_change_password BOOLEAN     NOT NULL DEFAULT FALSE,
    terms_accepted_at   TIMESTAMP,
    terms_version       VARCHAR(16),
    created_at          TIMESTAMP    NOT NULL,
    updated_at          TIMESTAMP    NOT NULL
);

CREATE INDEX idx_users_creator_role ON users (creator_id, role);
CREATE INDEX idx_users_email ON users (email);

CREATE TABLE creator_spaces (
    id            UUID PRIMARY KEY,
    creator_id    UUID         NOT NULL UNIQUE,
    name          VARCHAR(255) NOT NULL,
    slug          VARCHAR(255) NOT NULL UNIQUE,
    logo_url      VARCHAR(500),
    primary_color VARCHAR(16),
    bio           VARCHAR(1000),
    category      VARCHAR(24)  NOT NULL,
    created_at    TIMESTAMP    NOT NULL
);

CREATE TABLE programs (
    id          UUID PRIMARY KEY,
    creator_id  UUID         NOT NULL,
    title       VARCHAR(255) NOT NULL,
    description VARCHAR(2000),
    active      BOOLEAN      NOT NULL DEFAULT TRUE,
    price       NUMERIC(12, 2),
    created_at  TIMESTAMP    NOT NULL
);

CREATE INDEX idx_programs_creator ON programs (creator_id);

CREATE TABLE workouts (
    id               UUID PRIMARY KEY,
    program_id       UUID         NOT NULL,
    title            VARCHAR(255) NOT NULL,
    description      VARCHAR(2000),
    content_markdown TEXT,
    day_index        INTEGER      NOT NULL,
    created_at       TIMESTAMP    NOT NULL
);

CREATE INDEX idx_workouts_program ON workouts (program_id);

CREATE TABLE enrollments (
    id         UUID PRIMARY KEY,
    student_id UUID    NOT NULL,
    program_id UUID    NOT NULL,
    start_date DATE    NOT NULL,
    active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_enrollments_student_active ON enrollments (student_id, active);
CREATE INDEX idx_enrollments_program ON enrollments (program_id);

CREATE TABLE check_ins (
    id         UUID PRIMARY KEY,
    student_id UUID         NOT NULL,
    workout_id UUID         NOT NULL,
    date       DATE         NOT NULL,
    status     VARCHAR(32)  NOT NULL,
    feeling    INTEGER,
    notes      VARCHAR(1000),
    created_at TIMESTAMP    NOT NULL
);

CREATE INDEX idx_check_ins_student_date ON check_ins (student_id, date);
CREATE INDEX idx_check_ins_student_status_date ON check_ins (student_id, status, date);

CREATE TABLE alerts (
    id                  UUID PRIMARY KEY,
    recipient_user_id   UUID         NOT NULL,
    subject_student_id  UUID,
    type                VARCHAR(32)  NOT NULL,
    severity            VARCHAR(32)  NOT NULL,
    message             VARCHAR(500) NOT NULL,
    action_suggestion   VARCHAR(500),
    data_snapshot       TEXT,
    created_at          TIMESTAMP    NOT NULL,
    is_read             BOOLEAN      NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_alerts_recipient_read_created ON alerts (recipient_user_id, is_read, created_at);

CREATE TABLE refresh_tokens (
    id         UUID PRIMARY KEY,
    token      VARCHAR(128) NOT NULL UNIQUE,
    user_id    UUID         NOT NULL REFERENCES users (id),
    expires_at TIMESTAMP    NOT NULL,
    revoked    BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP    NOT NULL
);

CREATE TABLE user_action_tokens (
    id         UUID PRIMARY KEY,
    token      VARCHAR(128) NOT NULL UNIQUE,
    user_id    UUID         NOT NULL REFERENCES users (id),
    purpose    VARCHAR(32)  NOT NULL,
    expires_at TIMESTAMP    NOT NULL,
    used       BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP    NOT NULL
);

CREATE TABLE user_settings (
    user_id           UUID PRIMARY KEY REFERENCES users (id),
    digest_frequency  VARCHAR(32) NOT NULL,
    updated_at        TIMESTAMP   NOT NULL
);

CREATE TABLE student_badges (
    id         UUID PRIMARY KEY,
    student_id UUID        NOT NULL,
    creator_id UUID        NOT NULL,
    badge_type VARCHAR(32) NOT NULL,
    earned_at  TIMESTAMP   NOT NULL,
    CONSTRAINT uk_student_badges_student_type UNIQUE (student_id, badge_type)
);

CREATE TABLE student_gamification_profiles (
    student_id            UUID PRIMARY KEY,
    creator_id            UUID    NOT NULL,
    current_streak        INTEGER NOT NULL,
    longest_streak        INTEGER NOT NULL,
    total_check_ins_done  INTEGER NOT NULL,
    last_activity_date    DATE,
    created_at            TIMESTAMP NOT NULL,
    updated_at            TIMESTAMP NOT NULL
);

CREATE TABLE push_subscriptions (
    id         UUID PRIMARY KEY,
    user_id    UUID         NOT NULL,
    endpoint   VARCHAR(2048) NOT NULL,
    p256dh     VARCHAR(512) NOT NULL,
    auth_key   VARCHAR(512) NOT NULL,
    created_at TIMESTAMP    NOT NULL,
    CONSTRAINT uk_push_subscriptions_endpoint UNIQUE (endpoint)
);

CREATE INDEX idx_push_sub_user ON push_subscriptions (user_id);

CREATE TABLE program_purchases (
    id               UUID PRIMARY KEY,
    creator_id       UUID           NOT NULL,
    student_id       UUID           NOT NULL,
    program_id       UUID           NOT NULL,
    amount           NUMERIC(12, 2) NOT NULL,
    platform_fee     NUMERIC(12, 2) NOT NULL,
    creator_net      NUMERIC(12, 2) NOT NULL,
    asaas_payment_id VARCHAR(64),
    status           VARCHAR(32)    NOT NULL,
    created_at       TIMESTAMP      NOT NULL,
    confirmed_at     TIMESTAMP
);

CREATE TABLE nudge_deliveries (
    id           UUID PRIMARY KEY,
    creator_id   UUID         NOT NULL,
    student_id   UUID         NOT NULL,
    message      TEXT         NOT NULL,
    email_sent   BOOLEAN      NOT NULL,
    push_sent    BOOLEAN      NOT NULL,
    email_detail VARCHAR(500),
    push_detail  VARCHAR(500),
    created_at   TIMESTAMP    NOT NULL
);

CREATE INDEX idx_nudge_deliveries_creator_created ON nudge_deliveries (creator_id, created_at);
CREATE INDEX idx_nudge_deliveries_student_created ON nudge_deliveries (student_id, created_at);
