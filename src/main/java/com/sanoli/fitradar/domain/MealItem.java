package com.sanoli.fitradar.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "meal_items", indexes = {
        @Index(name = "idx_meal_items_meal_id", columnList = "meal_id"),
        @Index(name = "idx_meal_items_food_id", columnList = "food_id")
})
public class MealItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "meal_id", nullable = false)
    private UUID mealId;

    @Column(name = "food_id", nullable = false)
    private UUID foodId;

    @Column(name = "quantidade_g", nullable = false, precision = 10, scale = 2)
    private BigDecimal quantidadeG;

    @Column(nullable = false)
    private int ordem;

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

    public UUID getMealId() {
        return mealId;
    }

    public void setMealId(UUID mealId) {
        this.mealId = mealId;
    }

    public UUID getFoodId() {
        return foodId;
    }

    public void setFoodId(UUID foodId) {
        this.foodId = foodId;
    }

    public BigDecimal getQuantidadeG() {
        return quantidadeG;
    }

    public void setQuantidadeG(BigDecimal quantidadeG) {
        this.quantidadeG = quantidadeG;
    }

    public int getOrdem() {
        return ordem;
    }

    public void setOrdem(int ordem) {
        this.ordem = ordem;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
