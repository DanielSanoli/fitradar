import { describe, expect, it } from "vitest";
import {
  buildStudentThemeCssVars,
  foregroundOnAccent,
  hexToHslComponents,
  slugifySpaceName,
  spaceInitials,
} from "@/lib/creator/space-theme";

describe("space-theme", () => {
  it("slugifies space names", () => {
    expect(slugifySpaceName("Studio Corpo & Movimento")).toBe("studio-corpo-e-movimento");
  });

  it("builds initials", () => {
    expect(spaceInitials("Studio Corpo")).toBe("SC");
    expect(spaceInitials("")).toBe("FR");
  });

  it("picks readable foreground on accent", () => {
    expect(foregroundOnAccent("#1ed7a6")).toBe("#0b1712");
    expect(foregroundOnAccent("#ffffff")).toBe("#0b1712");
    expect(foregroundOnAccent("#5b8cff")).toBe("#ffffff");
  });

  it("converts hex to hsl components for CSS vars", () => {
    expect(hexToHslComponents("#5b8cff")).toMatch(/^2\d{2} /);
    expect(hexToHslComponents("#1ed7a6")).toMatch(/^1\d{2} /);
  });

  it("builds student theme vars from creator accent", () => {
    const blue = buildStudentThemeCssVars("#5b8cff");
    expect(blue["--primary"]).toMatch(/^2\d{2} /);
    expect(blue["--primary-foreground"]).toBeTruthy();
    expect(blue["--student-glow"]).toMatch(/^2\d{2} /);

    const mint = buildStudentThemeCssVars(null);
    expect(mint["--primary"]).toMatch(/^1\d{2} /);
  });
});
