package com.sanoli.fitradar.dto;

/**
 * Resultado de gamificação aplicado em um check-in DONE (escudos de streak).
 */
public record CheckInGamificationOutcome(
        int streakShields,
        int shieldEarnProgress,
        boolean shieldEarned,
        boolean shieldConsumed
) {
    public static CheckInGamificationOutcome none() {
        return new CheckInGamificationOutcome(0, 0, false, false);
    }
}
