package com.sanoli.fitradar.dto;

public record OnboardingStatusResponse(
        boolean hasSpace,
        boolean hasProgram,
        boolean hasStudent,
        boolean demoSeedAvailable,
        boolean onboardingComplete
) {
}
