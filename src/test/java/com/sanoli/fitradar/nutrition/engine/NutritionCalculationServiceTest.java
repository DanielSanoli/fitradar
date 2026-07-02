package com.sanoli.fitradar.nutrition.engine;

import com.sanoli.fitradar.domain.Food;
import com.sanoli.fitradar.domain.FoodSource;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class NutritionCalculationServiceTest {

    private NutritionCalculationService service;

    @BeforeEach
    void setUp() {
        service = new NutritionCalculationService();
    }

    @Test
    void calculateItem_scalesPer100gWithHalfEven() {
        Food food = food("Arroz", "100", "2.50", "25.00", "1.00");

        NutrientTotals totals = service.calculateItem(food, new BigDecimal("150.00"));

        assertThat(totals.kcal()).isEqualByComparingTo("150.00");
        assertThat(totals.proteinaG()).isEqualByComparingTo("3.75");
        assertThat(totals.carboG()).isEqualByComparingTo("37.50");
        assertThat(totals.gorduraG()).isEqualByComparingTo("1.50");
    }

    @Test
    void calculateItem_returnsZeroWhenQuantityMissing() {
        Food food = food("Arroz", "100", "2.50", "25.00", "1.00");

        NutrientTotals totals = service.calculateItem(food, null);

        assertThat(totals).isEqualTo(NutrientTotals.zero());
    }

    @Test
    void sum_mealTotals() {
        NutrientTotals a = new NutrientTotals(
                new BigDecimal("100.00"),
                new BigDecimal("10.00"),
                new BigDecimal("20.00"),
                new BigDecimal("5.00")
        );
        NutrientTotals b = new NutrientTotals(
                new BigDecimal("50.25"),
                new BigDecimal("3.33"),
                new BigDecimal("4.44"),
                new BigDecimal("1.11")
        );

        NutrientTotals sum = service.sum(java.util.List.of(a, b));

        assertThat(sum.kcal()).isEqualByComparingTo("150.25");
        assertThat(sum.proteinaG()).isEqualByComparingTo("13.33");
    }

    @Test
    void weeklyProjection_multipliesDailyBySeven() {
        NutrientTotals daily = new NutrientTotals(
                new BigDecimal("200.00"),
                new BigDecimal("120.00"),
                new BigDecimal("180.00"),
                new BigDecimal("60.00")
        );

        NutrientTotals weekly = service.weeklyProjection(daily);

        assertThat(weekly.kcal()).isEqualByComparingTo("1400.00");
        assertThat(weekly.proteinaG()).isEqualByComparingTo("840.00");
    }

    @Test
    void calculateItem_handlesSmallPortionWithoutDouble() {
        Food food = food("Frango", "165.33", "31.50", "0.00", "3.20");

        NutrientTotals totals = service.calculateItem(food, new BigDecimal("50.00"));

        assertThat(totals.kcal()).isEqualByComparingTo("82.66");
        assertThat(totals.proteinaG()).isEqualByComparingTo("15.75");
    }

    private Food food(String nome, String kcal, String protein, String carbs, String fat) {
        Food food = new Food();
        food.setNome(nome);
        food.setFonte(FoodSource.TACO);
        food.setKcalPor100g(new BigDecimal(kcal));
        food.setProteinaPor100g(new BigDecimal(protein));
        food.setCarboPor100g(new BigDecimal(carbs));
        food.setGorduraPor100g(new BigDecimal(fat));
        return food;
    }
}
