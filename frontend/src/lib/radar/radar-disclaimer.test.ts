import { describe, expect, it } from "vitest";
import { RADAR_DISCLAIMER, stripRadarDisclaimer } from "@/lib/radar/radar-disclaimer";

describe("stripRadarDisclaimer", () => {
  it("removes trailing disclaimer from API answers", () => {
    expect(stripRadarDisclaimer(`Resposta.\n\n${RADAR_DISCLAIMER}`)).toBe("Resposta.");
  });

  it("leaves text unchanged when disclaimer is absent", () => {
    expect(stripRadarDisclaimer("Apenas a resposta.")).toBe("Apenas a resposta.");
  });
});
