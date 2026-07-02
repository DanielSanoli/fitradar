CREATE TABLE progress_photo_consents (
    student_id UUID PRIMARY KEY,
    consented_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE progress_photos (
    id UUID PRIMARY KEY,
    student_id UUID NOT NULL,
    creator_id UUID NOT NULL,
    photo_date DATE NOT NULL,
    storage_path VARCHAR(512) NOT NULL,
    note TEXT,
    weight NUMERIC(6, 2),
    shared_with_coach BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_progress_photos_student_date ON progress_photos (student_id, photo_date DESC);
