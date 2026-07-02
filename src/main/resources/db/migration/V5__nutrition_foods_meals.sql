-- Structured nutrition: foods (TACO + custom), meals and meal items

CREATE TABLE foods (
    id UUID PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    fonte VARCHAR(16) NOT NULL,
    creator_id UUID NULL REFERENCES users(id) ON DELETE CASCADE,
    kcal_por_100g NUMERIC(10, 2) NOT NULL,
    proteina_por_100g NUMERIC(10, 2) NOT NULL,
    carbo_por_100g NUMERIC(10, 2) NOT NULL,
    gordura_por_100g NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_foods_fonte CHECK (fonte IN ('TACO', 'USDA', 'CUSTOM')),
    CONSTRAINT chk_foods_custom_creator CHECK (
        (fonte = 'CUSTOM' AND creator_id IS NOT NULL)
        OR (fonte <> 'CUSTOM' AND creator_id IS NULL)
    )
);

CREATE INDEX idx_foods_nome_lower ON foods (LOWER(nome));
CREATE INDEX idx_foods_creator_id ON foods (creator_id);
CREATE INDEX idx_foods_fonte ON foods (fonte);

CREATE TABLE meals (
    id UUID PRIMARY KEY,
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    horario TIME NULL,
    ordem INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_meals_program_id ON meals (program_id);
CREATE INDEX idx_meals_creator_id ON meals (creator_id);

CREATE TABLE meal_items (
    id UUID PRIMARY KEY,
    meal_id UUID NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
    food_id UUID NOT NULL REFERENCES foods(id),
    quantidade_g NUMERIC(10, 2) NOT NULL,
    ordem INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_meal_items_quantidade_positive CHECK (quantidade_g > 0)
);

CREATE INDEX idx_meal_items_meal_id ON meal_items (meal_id);
CREATE INDEX idx_meal_items_food_id ON meal_items (food_id);

ALTER TABLE programs ADD COLUMN nutrition_structured BOOLEAN NOT NULL DEFAULT FALSE;
