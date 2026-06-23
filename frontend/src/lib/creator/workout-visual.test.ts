import { describe, expect, it } from "vitest";
import { detectWorkoutVisualKind, workoutVisualIcon } from "@/lib/creator/workout-visual";

describe("detectWorkoutVisualKind", () => {
  it("detects nutrition from keywords", () => {
    expect(detectWorkoutVisualKind("Plano alimentar", "Refeições pós-treino")).toBe("nutrition");
    expect(workoutVisualIcon("nutrition")).toBe("healthy");
  });

  it("detects cardio from keywords", () => {
    expect(detectWorkoutVisualKind("HIIT", "Cardio leve")).toBe("cardio");
    expect(workoutVisualIcon("cardio")).toBe("activity");
  });

  it("defaults to strength", () => {
    expect(detectWorkoutVisualKind("Lower Body A", "Força")).toBe("strength");
    expect(workoutVisualIcon("strength")).toBe("workout");
  });
});
