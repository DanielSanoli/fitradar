import { describe, expect, it } from "vitest";
import { alertTypeLabel } from "@/lib/creator/alert-copy";

describe("alertTypeLabel", () => {
  it("maps backend alert types to pt-BR labels", () => {
    expect(alertTypeLabel("CHURN_RISK_HIGH")).toBe("Risco de churn");
    expect(alertTypeLabel("POSITIVE_STREAK")).toBe("Sequência positiva");
  });
});
