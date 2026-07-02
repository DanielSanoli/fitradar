import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { InsightCard } from "@/components/radar/InsightCard";

describe("InsightCard", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query: string) => ({
        matches: query.includes("prefers-reduced-motion"),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );
  });

  it("renders label, value and unit", async () => {
    render(<InsightCard label="Alunos ativos" value={128} unit="" />);
    expect(screen.getByText("Alunos ativos")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("128")).toBeInTheDocument();
    });
  });

  it("renders delta with trend arrow", () => {
    render(
      <InsightCard label="Aderência" value="78" unit="%" delta="+6%" trend="up" />,
    );
    expect(screen.getByText(/↑/)).toBeInTheDocument();
    expect(screen.getByText(/\+6%/)).toBeInTheDocument();
  });

  it("renders risk badge when riskLevel is set", () => {
    render(
      <InsightCard label="Em risco" value={3} riskLevel="alto" riskLabel="Risco alto" />,
    );
    expect(screen.getByText("Risco alto")).toBeInTheDocument();
  });

  it("renders sparkline path when spark has data", () => {
    const { container } = render(
      <InsightCard label="Check-ins" value={12} spark={[1, 3, 2, 5, 4]} />,
    );
    expect(container.querySelector("svg path")).toBeTruthy();
  });
});
