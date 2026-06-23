import { describe, expect, it } from "vitest";
import {
  attentionSubtitle,
  dashboardGreeting,
  dashboardSuggestions,
  formatDashboardDate,
} from "@/lib/creator/dashboard-copy";

describe("dashboard-copy", () => {
  it("formats date in pt-BR with capital letter", () => {
    const label = formatDashboardDate(new Date(2026, 5, 19));
    expect(label).toMatch(/^[A-ZÁÉÍÓÚ]/);
    expect(label).toContain("19");
    expect(label).toContain("junho");
  });

  it("varies greeting and suggestions by attention state", () => {
    expect(dashboardGreeting("Marina", "empty")).toContain("Assim que seus alunos");
    expect(dashboardGreeting("Marina", "positive")).toContain("Ninguém no vermelho");
    expect(dashboardSuggestions("empty")).toContain("Como convido alunos?");
    expect(dashboardSuggestions("alerts")).toContain("Quem vai desistir essa semana?");
    expect(attentionSubtitle("alerts")).toContain("gravidade");
  });
});
