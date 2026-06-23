import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FitnessEmptyIcon } from "@/components/fitness/FitnessEmptyIcon";
import { fitnessIconMap } from "@/lib/icons/fitness-icons";

describe("fitness icons", () => {
  it("maps all contexts to lucide components", () => {
    expect(fitnessIconMap.workout).toBeDefined();
    expect(fitnessIconMap.streak).toBeDefined();
    expect(fitnessIconMap.adherence).toBeDefined();
    expect(fitnessIconMap.checkIn).toBeDefined();
    expect(fitnessIconMap.ranking).toBeDefined();
  });

  it("renders empty icon as decorative", () => {
    const { container } = render(<FitnessEmptyIcon context="workout" variant="student" />);
    expect(container.querySelector("[aria-hidden='true']")).toBeTruthy();
  });

  it("uses sr-only for workout thumbnail label", async () => {
    const { WorkoutThumbnail } = await import("@/components/fitness/WorkoutThumbnail");
    render(<WorkoutThumbnail title="Leg day" />);
    expect(screen.getByText("Treino: Leg day")).toHaveClass("sr-only");
  });
});
