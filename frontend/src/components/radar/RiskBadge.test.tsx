import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { RiskBadge } from "@/components/radar/RiskBadge";

describe("RiskBadge", () => {
  it("maps baixo level", () => {
    render(<RiskBadge level="baixo" />);
    expect(screen.getByText("Risco baixo")).toBeInTheDocument();
  });

  it("maps medio level", () => {
    render(<RiskBadge level="medio" />);
    expect(screen.getByText("Risco médio")).toBeInTheDocument();
  });

  it("maps alto level", () => {
    render(<RiskBadge level="alto" />);
    expect(screen.getByText("Risco alto")).toBeInTheDocument();
  });

  it("uses custom label when provided", () => {
    render(<RiskBadge level="baixo" label="LOW" />);
    expect(screen.getByText("LOW")).toBeInTheDocument();
  });
});
