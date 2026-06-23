import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { StreakFlame } from "@/components/fitness/StreakFlame";

describe("StreakFlame", () => {
  it("renders streak count from backend", () => {
    render(<StreakFlame streak={7} subtitle="Semana completa!" />);
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("dias seguidos")).toBeInTheDocument();
    expect(screen.getByText("Semana completa!")).toBeInTheDocument();
  });

  it("renders inline variant with accessible structure", () => {
    render(<StreakFlame streak={3} variant="inline" label="Streak" />);
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("Streak")).toBeInTheDocument();
  });

  it("marks decorative flame as aria-hidden in prominent mode", () => {
    const { container } = render(<StreakFlame streak={5} />);
    const flames = container.querySelectorAll("svg.lucide-flame");
    flames.forEach((el) => {
      expect(el.getAttribute("aria-hidden")).toBe("true");
    });
  });
});
