ALTER TABLE student_gamification_profiles
    ADD COLUMN streak_shields INT NOT NULL DEFAULT 0;

ALTER TABLE student_gamification_profiles
    ADD COLUMN shield_earn_progress INT NOT NULL DEFAULT 0;
