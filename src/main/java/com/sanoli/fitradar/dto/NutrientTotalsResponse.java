package com.sanoli.fitradar.dto;

import com.sanoli.fitradar.nutrition.engine.NutrientTotals;

import java.math.BigDecimal;

public record NutrientTotalsResponse(
        BigDecimal kcal,
        BigDecimal proteinaG,
        BigDecimal carboG,
        BigDecimal gorduraG
) {
    public static NutrientTotalsResponse from(NutrientTotals totals) {
        return new NutrientTotalsResponse(totals.kcal(), totals.proteinaG(), totals.carboG(), totals.gorduraG());
    }
}
