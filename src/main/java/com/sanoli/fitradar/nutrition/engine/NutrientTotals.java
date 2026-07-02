package com.sanoli.fitradar.nutrition.engine;

import java.math.BigDecimal;
import java.math.RoundingMode;

public record NutrientTotals(
        BigDecimal kcal,
        BigDecimal proteinaG,
        BigDecimal carboG,
        BigDecimal gorduraG
) {
    private static final int SCALE = 2;
    private static final RoundingMode ROUNDING = RoundingMode.HALF_EVEN;

    public NutrientTotals {
        kcal = normalize(kcal);
        proteinaG = normalize(proteinaG);
        carboG = normalize(carboG);
        gorduraG = normalize(gorduraG);
    }

    public static NutrientTotals zero() {
        return new NutrientTotals(BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO);
    }

    public NutrientTotals add(NutrientTotals other) {
        if (other == null) {
            return this;
        }
        return new NutrientTotals(
                kcal.add(other.kcal),
                proteinaG.add(other.proteinaG),
                carboG.add(other.carboG),
                gorduraG.add(other.gorduraG)
        );
    }

    private static BigDecimal normalize(BigDecimal value) {
        if (value == null) {
            return BigDecimal.ZERO.setScale(SCALE, ROUNDING);
        }
        return value.setScale(SCALE, ROUNDING);
    }
}
