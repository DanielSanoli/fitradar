package com.sanoli.fitradar.dto;

import com.sanoli.fitradar.domain.Meal;
import com.sanoli.fitradar.nutrition.engine.NutrientTotals;

import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

public record MealResponse(
        UUID id,
        String nome,
        LocalTime horario,
        int ordem,
        List<MealItemResponse> items,
        NutrientTotalsResponse totals
) {
    public static MealResponse of(Meal meal, List<MealItemResponse> items, NutrientTotals totals) {
        return new MealResponse(
                meal.getId(),
                meal.getNome(),
                meal.getHorario(),
                meal.getOrdem(),
                items,
                NutrientTotalsResponse.from(totals)
        );
    }
}
