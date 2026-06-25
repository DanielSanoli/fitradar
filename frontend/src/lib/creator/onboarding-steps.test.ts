import { describe, expect, it } from "vitest";
import {
  CREATOR_ONBOARDING_STEPS,
  nextOnboardingStep,
  onboardingProgressCount,
} from "@/lib/creator/onboarding-steps";
import type { OnboardingStatusResponse } from "@/lib/api/domain-types";

const fresh: OnboardingStatusResponse = {
  hasSpace: false,
  hasProgram: false,
  hasStudent: false,
  demoSeedAvailable: true,
  onboardingComplete: false,
};

describe("onboardingProgressCount", () => {
  it("counts completed steps from API flags", () => {
    expect(onboardingProgressCount(fresh)).toBe(0);
    expect(onboardingProgressCount({ ...fresh, hasSpace: true, hasProgram: true })).toBe(2);
    expect(
      onboardingProgressCount({
        ...fresh,
        hasSpace: true,
        hasProgram: true,
        hasStudent: true,
        onboardingComplete: true,
      }),
    ).toBe(3);
  });
});

describe("nextOnboardingStep", () => {
  it("returns first incomplete step in order", () => {
    expect(nextOnboardingStep(fresh)?.id).toBe("space");
    expect(nextOnboardingStep({ ...fresh, hasSpace: true })?.id).toBe("program");
    expect(nextOnboardingStep({ ...fresh, hasSpace: true, hasProgram: true })?.id).toBe("student");
    expect(nextOnboardingStep({ ...fresh, hasSpace: true, hasProgram: true, hasStudent: true })).toBeNull();
  });
});

describe("CREATOR_ONBOARDING_STEPS", () => {
  it("maps to creator routes", () => {
    expect(CREATOR_ONBOARDING_STEPS.map((s) => s.to)).toEqual([
      "/app/space",
      "/app/programs/new",
      "/app/students",
    ]);
  });
});
