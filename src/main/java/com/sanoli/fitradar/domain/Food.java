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
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "foods", indexes = {
        @Index(name = "idx_foods_nome_lower", columnList = "nome"),
        @Index(name = "idx_foods_creator_id", columnList = "creator_id"),
        @Index(name = "idx_foods_fonte", columnList = "fonte")
})
public class Food {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String nome;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private FoodSource fonte;

    @Column(name = "creator_id")
    private UUID creatorId;

    @Column(name = "kcal_por_100g", nullable = false, precision = 10, scale = 2)
    private BigDecimal kcalPor100g;

    @Column(name = "proteina_por_100g", nullable = false, precision = 10, scale = 2)
    private BigDecimal proteinaPor100g;

    @Column(name = "carbo_por_100g", nullable = false, precision = 10, scale = 2)
    private BigDecimal carboPor100g;

    @Column(name = "gordura_por_100g", nullable = false, precision = 10, scale = 2)
    private BigDecimal gorduraPor100g;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void prePersist() {
        createdAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public FoodSource getFonte() {
        return fonte;
    }

    public void setFonte(FoodSource fonte) {
        this.fonte = fonte;
    }

    public UUID getCreatorId() {
        return creatorId;
    }

    public void setCreatorId(UUID creatorId) {
        this.creatorId = creatorId;
    }

    public BigDecimal getKcalPor100g() {
        return kcalPor100g;
    }

    public void setKcalPor100g(BigDecimal kcalPor100g) {
        this.kcalPor100g = kcalPor100g;
    }

    public BigDecimal getProteinaPor100g() {
        return proteinaPor100g;
    }

    public void setProteinaPor100g(BigDecimal proteinaPor100g) {
        this.proteinaPor100g = proteinaPor100g;
    }

    public BigDecimal getCarboPor100g() {
        return carboPor100g;
    }

    public void setCarboPor100g(BigDecimal carboPor100g) {
        this.carboPor100g = carboPor100g;
    }

    public BigDecimal getGorduraPor100g() {
        return gorduraPor100g;
    }

    public void setGorduraPor100g(BigDecimal gorduraPor100g) {
        this.gorduraPor100g = gorduraPor100g;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
