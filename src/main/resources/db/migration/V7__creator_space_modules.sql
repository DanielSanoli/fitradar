CREATE TABLE creator_space_modules (
    space_id UUID         NOT NULL REFERENCES creator_spaces (id) ON DELETE CASCADE,
    module   VARCHAR(24)  NOT NULL,
    PRIMARY KEY (space_id, module),
    CONSTRAINT chk_creator_space_module CHECK (module IN ('TRAINING', 'NUTRITION'))
);

INSERT INTO creator_space_modules (space_id, module)
SELECT id, 'NUTRITION'
FROM creator_spaces
WHERE category = 'NUTRITION';

INSERT INTO creator_space_modules (space_id, module)
SELECT id, 'TRAINING'
FROM creator_spaces
WHERE category <> 'NUTRITION';
