package com.sanoli.fitradar.billing;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class MarketplaceSplitCalculatorTest {

    @Test
    void calculate_splitsAmountWithPlatformFee() {
        MarketplaceSplitCalculator.SplitAmounts split = MarketplaceSplitCalculator.calculate(
                new BigDecimal("100.00"),
                new BigDecimal("10.00")
        );

        assertThat(split.amount()).isEqualByComparingTo("100.00");
        assertThat(split.platformFee()).isEqualByComparingTo("10.00");
        assertThat(split.creatorNet()).isEqualByComparingTo("90.00");
        assertThat(split.creatorSplitPercent()).isEqualByComparingTo("90.0000");
    }

    @Test
    void calculate_rejectsInvalidAmount() {
        assertThatThrownBy(() -> MarketplaceSplitCalculator.calculate(BigDecimal.ZERO, new BigDecimal("10")))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void calculate_usesHalfEvenRounding() {
        MarketplaceSplitCalculator.SplitAmounts split = MarketplaceSplitCalculator.calculate(
                new BigDecimal("99.99"),
                new BigDecimal("10.00")
        );

        assertThat(split.platformFee()).isEqualByComparingTo("10.00");
        assertThat(split.creatorNet()).isEqualByComparingTo("89.99");
    }
}
