package com.sanoli.fitradar.billing;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Calcula valores do split marketplace (taxa FitRadar + repasse ao criador).
 * Valores em BigDecimal (HALF_EVEN, 2 casas).
 */
public final class MarketplaceSplitCalculator {

    private static final int MONEY_SCALE = 2;
    private static final int PERCENT_SCALE = 4;
    private static final BigDecimal HUNDRED = new BigDecimal("100");

    private MarketplaceSplitCalculator() {
    }

    public record SplitAmounts(
            BigDecimal amount,
            BigDecimal platformFee,
            BigDecimal creatorNet,
            BigDecimal creatorSplitPercent
    ) {
    }

    public static SplitAmounts calculate(BigDecimal amount, BigDecimal platformFeePercent) {
        if (amount == null || amount.signum() <= 0) {
            throw new IllegalArgumentException("amount deve ser positivo");
        }
        if (platformFeePercent == null || platformFeePercent.signum() < 0
                || platformFeePercent.compareTo(HUNDRED) > 0) {
            throw new IllegalArgumentException("platformFeePercent inválido");
        }

        BigDecimal normalizedAmount = amount.setScale(MONEY_SCALE, RoundingMode.HALF_EVEN);
        BigDecimal platformFee = normalizedAmount
                .multiply(platformFeePercent)
                .divide(HUNDRED, MONEY_SCALE, RoundingMode.HALF_EVEN);
        BigDecimal creatorNet = normalizedAmount.subtract(platformFee).setScale(MONEY_SCALE, RoundingMode.HALF_EVEN);
        BigDecimal creatorSplitPercent = HUNDRED.subtract(platformFeePercent)
                .setScale(PERCENT_SCALE, RoundingMode.HALF_EVEN);

        return new SplitAmounts(normalizedAmount, platformFee, creatorNet, creatorSplitPercent);
    }
}
