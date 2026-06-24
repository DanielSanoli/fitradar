import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AdherenceTrendPanel } from "@/components/creator/AdherenceTrendPanel";

describe("AdherenceTrendPanel", () => {
  it("applies panel padding when content is loaded", () => {
    const { container } = render(
      <AdherenceTrendPanel
        trend={{
          currentPeriodAdherence: null,
          previousPeriodAdherence: null,
          changePoints: null,
          weeklySeries: [],
          assumptions: ["Aderência média da comunidade"],
        }}
        loadState="content"
        onRetry={vi.fn()}
      />,
    );

    const padded = container.querySelector(".px-5.py-5");
    expect(padded).toBeTruthy();
    expect(screen.getByText(/Últimos 30 dias/i)).toBeInTheDocument();
  });

  it("renders weekly chart with inset plot area", () => {
    const { container } = render(
      <AdherenceTrendPanel
        trend={{
          currentPeriodAdherence: "72.00",
          previousPeriodAdherence: "68.00",
          changePoints: "4.00",
          weeklySeries: [
            { weekStart: "2026-04-28", avgAdherence: "65.00" },
            { weekStart: "2026-05-05", avgAdherence: "70.00" },
            { weekStart: "2026-05-12", avgAdherence: "72.50" },
          ],
          assumptions: [],
        }}
        loadState="content"
        onRetry={vi.fn()}
      />,
    );

    const plot = container.querySelector('[aria-label="Gráfico de aderência semanal da comunidade"]');
    expect(plot).toBeTruthy();
    expect(plot).toHaveClass("px-3");
    expect(plot).toHaveClass("justify-between");
    expect(screen.getByText(/28 de abr\./i)).toBeInTheDocument();
  });
});
