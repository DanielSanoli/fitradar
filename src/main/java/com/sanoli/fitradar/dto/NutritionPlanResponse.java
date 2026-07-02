package com.sanoli.fitradar.dto;

import com.sanoli.fitradar.nutrition.engine.NutrientTotals;

import java.util.List;
import java.util.UUID;

public record NutritionPlanResponse(
        UUID programId,
        boolean structured,
        List<MealResponse> meals,
        NutrientTotalsResponse dailyTotals,
        NutrientTotalsResponse weeklyProjection,
        String weeklyProjectionLabel
) {
    public static NutritionPlanResponse of(
            UUID programId,
            boolean structured,
            List<MealResponse> meals,
            NutrientTotals dailyTotals,
            NutrientTotals weeklyProjection
    ) {
        return new NutritionPlanResponse(
                programId,
                structured,
                meals,
                NutrientTotalsResponse.from(dailyTotals),
                NutrientTotalsResponse.from(weeklyProjection),
                "Projeção semanal (7× total diário — plano diário repetido)"
        );
    }
}
