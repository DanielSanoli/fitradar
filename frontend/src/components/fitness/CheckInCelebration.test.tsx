import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CheckInCelebration } from "@/components/fitness/CheckInCelebration";

describe("CheckInCelebration", () => {
  it("announces success to screen readers", () => {
    render(<CheckInCelebration show streak={5} />);
    expect(screen.getByRole("status")).toHaveAttribute(
      "aria-label",
      "Check-in registrado com sucesso",
    );
    expect(screen.getByText("Treino registrado!")).toBeInTheDocument();
    expect(screen.getByText(/5 dias de streak/i)).toBeInTheDocument();
  });

  it("does not render when hidden", () => {
    render(<CheckInCelebration show={false} streak={3} />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("calls onComplete after animation window", () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();
    render(<CheckInCelebration show streak={2} onComplete={onComplete} />);
    vi.advanceTimersByTime(2200);
    expect(onComplete).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });
});
