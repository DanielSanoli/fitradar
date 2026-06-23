import { describe, expect, it } from "vitest";
import { exercisesToMarkdown, markdownToExercises } from "@/lib/creator/workout-exercises";

describe("workout-exercises", () => {
  it("round-trips structured exercises to markdown", () => {
    const md = exercisesToMarkdown([
      { id: "1", name: "Agachamento", sets: "4", reps: "10", rest: "90s" },
      { id: "2", name: "Leg press", sets: "3", reps: "12", rest: "60s" },
    ]);
    expect(md).toContain("Agachamento 4x10 · 90s");
    const back = markdownToExercises(md);
    expect(back).toHaveLength(2);
    expect(back[0].name).toBe("Agachamento");
    expect(back[0].sets).toBe("4");
    expect(back[0].reps).toBe("10");
    expect(back[0].rest).toBe("90s");
  });
});
