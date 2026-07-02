package com.sanoli.fitradar.dto;

import com.sanoli.fitradar.domain.Food;
import com.sanoli.fitradar.domain.FoodSource;

import java.math.BigDecimal;
import java.util.UUID;

public record FoodResponse(
        UUID id,
        String nome,
        FoodSource fonte,
        BigDecimal kcalPor100g,
        BigDecimal proteinaPor100g,
        BigDecimal carboPor100g,
        BigDecimal gorduraPor100g
) {
    public static FoodResponse fromEntity(Food food) {
        return new FoodResponse(
                food.getId(),
                food.getNome(),
                food.getFonte(),
                food.getKcalPor100g(),
                food.getProteinaPor100g(),
                food.getCarboPor100g(),
                food.getGorduraPor100g()
        );
    }
}
