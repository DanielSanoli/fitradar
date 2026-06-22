import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { InsightCard } from "@/components/radar/InsightCard";

describe("InsightCard", () => {
  it("renders label, value and unit", () => {
    render(<InsightCard label="Alunos ativos" value={128} unit="" />);
    expect(screen.getByText("Alunos ativos")).toBeInTheDocument();
    expect(screen.getByText("128")).toBeInTheDocument();
  });

  it("renders delta with trend arrow", () => {
    render(
      <InsightCard label="Aderência" value="78" unit="%" delta="+6%" trend="up" />,
    );
    expect(screen.getByText(/↑ \+6%/)).toBeInTheDocument();
  });

  it("renders risk badge when riskLevel is set", () => {
    render(
      <InsightCard label="Em risco" value={3} riskLevel="alto" riskLabel="Risco alto" />,
    );
    expect(screen.getByText("Risco alto")).toBeInTheDocument();
  });

  it("renders sparkline svg when spark has data", () => {
    const { container } = render(
      <InsightCard label="Check-ins" value={12} spark={[1, 3, 2, 5, 4]} />,
    );
    expect(container.querySelector("svg polyline")).toBeTruthy();
  });
});
