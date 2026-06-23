import { describe, expect, it } from "vitest";
import {
  foregroundOnAccent,
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
  });
});
