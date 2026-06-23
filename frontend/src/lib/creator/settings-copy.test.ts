import { describe, expect, it } from "vitest";
import { planLabel, subscriptionStatusLabel } from "@/lib/creator/settings-copy";

describe("settings-copy", () => {
  it("formats plan and status labels", () => {
    expect(planLabel("PRO")).toBe("Pro");
    expect(planLabel("FREE")).toBe("Grátis");
    expect(subscriptionStatusLabel("TRIALING")).toBe("Em trial");
    expect(subscriptionStatusLabel("ACTIVE")).toBe("Ativa");
  });
});
