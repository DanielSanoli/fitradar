import { describe, expect, it } from "vitest";
import {
  normalizeSpaceCategory,
  spaceCategoryLabel,
  SPACE_CATEGORIES,
} from "@/lib/creator/space-categories";

describe("space-categories", () => {
  it("exposes all areas with labels", () => {
    expect(SPACE_CATEGORIES.map((c) => c.label)).toEqual([
      "Nutrição",
      "Academia",
      "Crossfit",
      "Pilates",
      "Outro",
    ]);
  });

  it("normalizes unknown values to OTHER", () => {
    expect(normalizeSpaceCategory(null)).toBe("OTHER");
    expect(normalizeSpaceCategory("INVALID")).toBe("OTHER");
    expect(normalizeSpaceCategory("GYM")).toBe("GYM");
  });

  it("resolves labels from ids", () => {
    expect(spaceCategoryLabel("PILATES")).toBe("Pilates");
  });
});
