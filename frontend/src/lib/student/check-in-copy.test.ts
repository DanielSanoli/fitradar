import { describe, expect, it } from "vitest";
import {
  checkInStatusLabel,
  feelingLabel,
  formatCheckInDate,
} from "@/lib/student/check-in-copy";

describe("check-in-copy", () => {
  it("formats feeling labels from DTO values", () => {
    expect(feelingLabel(1)).toBe("Esgotante");
    expect(feelingLabel(5)).toBe("Ótimo!");
    expect(feelingLabel(null)).toBeNull();
  });

  it("formats check-in status", () => {
    expect(checkInStatusLabel("DONE")).toBe("Concluído");
    expect(checkInStatusLabel("SKIPPED")).toBe("Pulado");
  });

  it("formats local date keys for display", () => {
    expect(formatCheckInDate("2026-06-19")).toMatch(/19/);
    expect(formatCheckInDate("2026-06-19")).toMatch(/2026/);
  });
});
