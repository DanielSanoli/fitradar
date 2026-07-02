package com.sanoli.fitradar.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "anamneses", indexes = {
        @Index(name = "idx_anamneses_creator_id", columnList = "creator_id")
})
public class Anamnese {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "student_id", nullable = false, unique = true)
    private UUID studentId;

    @Column(name = "creator_id", nullable = false)
    private UUID creatorId;

    @Enumerated(EnumType.STRING)
    @Column(name = "objetivo_principal", nullable = false, length = 32)
    private ObjetivoPrincipal objetivoPrincipal;

    @Enumerated(EnumType.STRING)
    @Column(name = "experiencia_treino", nullable = false, length = 32)
    private ExperienciaTreino experienciaTreino;

    @Column(name = "dias_disponiveis_semana", nullable = false)
    private int diasDisponiveisSemana;

    @Enumerated(EnumType.STRING)
    @Column(name = "nivel_atividade_rotina", nullable = false, length = 32)
    private NivelAtividadeRotina nivelAtividadeRotina;

    @Column(name = "altura_cm", nullable = false)
    private int alturaCm;

    @Column(name = "peso_atual_kg", nullable = false, precision = 6, scale = 2)
    private BigDecimal pesoAtualKg;

    @Column(name = "peso_objetivo_kg", precision = 6, scale = 2)
    private BigDecimal pesoObjetivoKg;

    @Column(name = "historico_lesoes", columnDefinition = "TEXT")
    private String historicoLesoes;

    @Column(name = "condicoes_saude", columnDefinition = "TEXT")
    private String condicoesSaude;

    @Column(columnDefinition = "TEXT")
    private String medicacoes;

    @Column(name = "restricoes_alimentares", columnDefinition = "TEXT")
    private String restricoesAlimentares;

    @Column(columnDefinition = "TEXT")
    private String observacoes;

    @Column(name = "consentimento_dados_saude", nullable = false)
    private boolean consentimentoDadosSaude;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getStudentId() {
        return studentId;
    }

    public void setStudentId(UUID studentId) {
        this.studentId = studentId;
    }

    public UUID getCreatorId() {
        return creatorId;
    }

    public void setCreatorId(UUID creatorId) {
        this.creatorId = creatorId;
    }

    public ObjetivoPrincipal getObjetivoPrincipal() {
        return objetivoPrincipal;
    }

    public void setObjetivoPrincipal(ObjetivoPrincipal objetivoPrincipal) {
        this.objetivoPrincipal = objetivoPrincipal;
    }

    public ExperienciaTreino getExperienciaTreino() {
        return experienciaTreino;
    }

    public void setExperienciaTreino(ExperienciaTreino experienciaTreino) {
        this.experienciaTreino = experienciaTreino;
    }

    public int getDiasDisponiveisSemana() {
        return diasDisponiveisSemana;
    }

    public void setDiasDisponiveisSemana(int diasDisponiveisSemana) {
        this.diasDisponiveisSemana = diasDisponiveisSemana;
    }

    public NivelAtividadeRotina getNivelAtividadeRotina() {
        return nivelAtividadeRotina;
    }

    public void setNivelAtividadeRotina(NivelAtividadeRotina nivelAtividadeRotina) {
        this.nivelAtividadeRotina = nivelAtividadeRotina;
    }

    public int getAlturaCm() {
        return alturaCm;
    }

    public void setAlturaCm(int alturaCm) {
        this.alturaCm = alturaCm;
    }

    public BigDecimal getPesoAtualKg() {
        return pesoAtualKg;
    }

    public void setPesoAtualKg(BigDecimal pesoAtualKg) {
        this.pesoAtualKg = pesoAtualKg;
    }

    public BigDecimal getPesoObjetivoKg() {
        return pesoObjetivoKg;
    }

    public void setPesoObjetivoKg(BigDecimal pesoObjetivoKg) {
        this.pesoObjetivoKg = pesoObjetivoKg;
    }

    public String getHistoricoLesoes() {
        return historicoLesoes;
    }

    public void setHistoricoLesoes(String historicoLesoes) {
        this.historicoLesoes = historicoLesoes;
    }

    public String getCondicoesSaude() {
        return condicoesSaude;
    }

    public void setCondicoesSaude(String condicoesSaude) {
        this.condicoesSaude = condicoesSaude;
    }

    public String getMedicacoes() {
        return medicacoes;
    }

    public void setMedicacoes(String medicacoes) {
        this.medicacoes = medicacoes;
    }

    public String getRestricoesAlimentares() {
        return restricoesAlimentares;
    }

    public void setRestricoesAlimentares(String restricoesAlimentares) {
        this.restricoesAlimentares = restricoesAlimentares;
    }

    public String getObservacoes() {
        return observacoes;
    }

    public void setObservacoes(String observacoes) {
        this.observacoes = observacoes;
    }

    public boolean isConsentimentoDadosSaude() {
        return consentimentoDadosSaude;
    }

    public void setConsentimentoDadosSaude(boolean consentimentoDadosSaude) {
        this.consentimentoDadosSaude = consentimentoDadosSaude;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
