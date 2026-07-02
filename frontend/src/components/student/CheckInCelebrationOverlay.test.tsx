import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { CheckInCelebrationOverlay } from "@/components/student/CheckInCelebrationOverlay";
import * as reducedMotion from "@/hooks/usePrefersReducedMotion";

vi.mock("@/components/student/CheckInConfettiCanvas", () => ({
  CheckInConfettiCanvas: () => <div data-testid="confetti-canvas" />,
}));

describe("CheckInCelebrationOverlay", () => {
  beforeEach(() => {
    vi.spyOn(reducedMotion, "usePrefersReducedMotion").mockReturnValue(false);
  });

  it("renders milestone copy", () => {
    render(
      <CheckInCelebrationOverlay
        show
        streak={10}
        headline="10º treino registrado!"
        subtitle="Marco histórico na sua jornada."
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("10º treino registrado!")).toBeInTheDocument();
    expect(screen.getByText("Marco histórico na sua jornada.")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByTestId("confetti-canvas")).toBeInTheDocument();
  });

  it("renders streak record copy", () => {
    render(
      <CheckInCelebrationOverlay
        show
        streak={12}
        headline="Novo recorde: 12 dias!"
        subtitle="Sua maior sequência até aqui."
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText("Novo recorde: 12 dias!")).toBeInTheDocument();
  });

  it("hides when not shown", () => {
    render(
      <CheckInCelebrationOverlay
        show={false}
        streak={5}
        headline="Treino registrado!"
        subtitle="Bom trabalho."
        onClose={vi.fn()}
      />,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("omits confetti when prefers-reduced-motion", () => {
    vi.spyOn(reducedMotion, "usePrefersReducedMotion").mockReturnValue(true);

    render(
      <CheckInCelebrationOverlay
        show
        streak={5}
        headline="Treino registrado!"
        subtitle="Bom trabalho."
        onClose={vi.fn()}
      />,
    );

    expect(screen.queryByTestId("confetti-canvas")).not.toBeInTheDocument();
    expect(screen.getByText("Treino registrado!")).toBeInTheDocument();
  });
});
