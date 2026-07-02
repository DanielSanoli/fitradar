CREATE TABLE anamneses (
    id                          UUID PRIMARY KEY,
    student_id                  UUID         NOT NULL UNIQUE,
    creator_id                  UUID         NOT NULL,
    objetivo_principal          VARCHAR(32)  NOT NULL,
    experiencia_treino          VARCHAR(32)  NOT NULL,
    dias_disponiveis_semana     INT          NOT NULL,
    nivel_atividade_rotina      VARCHAR(32)  NOT NULL,
    altura_cm                   INT          NOT NULL,
    peso_atual_kg               NUMERIC(6, 2) NOT NULL,
    peso_objetivo_kg            NUMERIC(6, 2),
    historico_lesoes            TEXT,
    condicoes_saude             TEXT,
    medicacoes                  TEXT,
    restricoes_alimentares      TEXT,
    observacoes                 TEXT,
    consentimento_dados_saude   BOOLEAN      NOT NULL,
    created_at                  TIMESTAMP    NOT NULL,
    updated_at                  TIMESTAMP    NOT NULL,
    CONSTRAINT fk_anamneses_student FOREIGN KEY (student_id) REFERENCES users (id),
    CONSTRAINT fk_anamneses_creator FOREIGN KEY (creator_id) REFERENCES users (id)
);

CREATE INDEX idx_anamneses_creator_id ON anamneses (creator_id);
