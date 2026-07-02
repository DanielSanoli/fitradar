package com.sanoli.fitradar.nutrition.engine;

import com.sanoli.fitradar.domain.Food;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Collection;

/**
 * Motor determinístico de nutrientes (kcal + macros). Valores sempre BigDecimal HALF_EVEN, 2 casas.
 * A IA nunca calcula — apenas interpreta DTOs produzidos aqui.
 */
@Service
public class NutritionCalculationService {

    private static final int SCALE = 2;
    private static final RoundingMode ROUNDING = RoundingMode.HALF_EVEN;
    private static final BigDecimal HUNDRED = new BigDecimal("100");
    private static final BigDecimal WEEK_DAYS = new BigDecimal("7");

    public NutrientTotals calculateForQuantity(BigDecimal valuePer100g, BigDecimal quantityG) {
        if (valuePer100g == null || quantityG == null) {
            return NutrientTotals.zero();
        }
        BigDecimal factor = quantityG.divide(HUNDRED, SCALE + 4, ROUNDING);
        return new NutrientTotals(
                valuePer100g.multiply(factor),
                valuePer100g.multiply(factor),
                valuePer100g.multiply(factor),
                valuePer100g.multiply(factor)
        );
    }

    public NutrientTotals calculateItem(Food food, BigDecimal quantityG) {
        if (food == null || quantityG == null) {
            return NutrientTotals.zero();
        }
        BigDecimal factor = quantityG.divide(HUNDRED, SCALE + 4, ROUNDING);
        return new NutrientTotals(
                food.getKcalPor100g().multiply(factor),
                food.getProteinaPor100g().multiply(factor),
                food.getCarboPor100g().multiply(factor),
                food.getGorduraPor100g().multiply(factor)
        );
    }

    public NutrientTotals sum(Collection<NutrientTotals> totals) {
        return totals.stream().reduce(NutrientTotals.zero(), NutrientTotals::add);
    }

    public NutrientTotals weeklyProjection(NutrientTotals dailyTotals) {
        if (dailyTotals == null) {
            return NutrientTotals.zero();
        }
        return new NutrientTotals(
                dailyTotals.kcal().multiply(WEEK_DAYS),
                dailyTotals.proteinaG().multiply(WEEK_DAYS),
                dailyTotals.carboG().multiply(WEEK_DAYS),
                dailyTotals.gorduraG().multiply(WEEK_DAYS)
        );
    }
}
