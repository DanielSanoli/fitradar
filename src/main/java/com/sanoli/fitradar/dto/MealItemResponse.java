package com.sanoli.fitradar.dto;

import com.sanoli.fitradar.domain.MealItem;
import com.sanoli.fitradar.nutrition.engine.NutrientTotals;

import java.math.BigDecimal;
import java.util.UUID;

public record MealItemResponse(
        UUID id,
        UUID foodId,
        String foodNome,
        String foodFonte,
        BigDecimal quantidadeG,
        int ordem,
        NutrientTotalsResponse totals
) {
    public static MealItemResponse of(MealItem item, String foodNome, String foodFonte, NutrientTotals totals) {
        return new MealItemResponse(
                item.getId(),
                item.getFoodId(),
                foodNome,
                foodFonte,
                item.getQuantidadeG(),
                item.getOrdem(),
                NutrientTotalsResponse.from(totals)
        );
    }
}
