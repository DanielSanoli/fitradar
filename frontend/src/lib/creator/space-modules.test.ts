import { describe, expect, it } from "vitest";
import {
  defaultModulesForCategory,
  hasNutritionModule,
  hasTrainingModule,
  isHybridSpace,
  normalizeSpaceModules,
  spaceModulesSummary,
} from "@/lib/creator/space-modules";

describe("space-modules", () => {
  it("defaults category NUTRITION to nutrition module", () => {
    expect(defaultModulesForCategory("NUTRITION")).toEqual(["NUTRITION"]);
    expect(defaultModulesForCategory("GYM")).toEqual(["TRAINING"]);
  });

  it("detects hybrid spaces", () => {
    expect(isHybridSpace(["TRAINING", "NUTRITION"])).toBe(true);
    expect(hasTrainingModule(["TRAINING"])).toBe(true);
    expect(hasNutritionModule(["NUTRITION"])).toBe(true);
  });

  it("summarizes modules for public display", () => {
    expect(spaceModulesSummary(["TRAINING", "NUTRITION"])).toBe("Treino e Nutrição");
    expect(normalizeSpaceModules([])).toEqual(["TRAINING"]);
  });
});
