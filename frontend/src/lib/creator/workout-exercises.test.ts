import { describe, expect, it } from "vitest";
import { exercisesToMarkdown, markdownToExercises } from "@/lib/creator/workout-exercises";

describe("workout-exercises", () => {
  it("round-trips structured exercises to markdown for fitness spaces", () => {
    const md = exercisesToMarkdown(
      [
        {
          id: "1",
          name: "Agachamento",
          fields: { sets: "4", reps: "10", rest: "90s" },
        },
        {
          id: "2",
          name: "Leg press",
          fields: { sets: "3", reps: "12", rest: "60s" },
        },
      ],
      "GYM",
    );
    expect(md).toContain("Agachamento 4x10 · 90s");
    const back = markdownToExercises(md, "GYM");
    expect(back).toHaveLength(2);
    expect(back[0].name).toBe("Agachamento");
    expect(back[0].fields.sets).toBe("4");
    expect(back[0].fields.reps).toBe("10");
    expect(back[0].fields.rest).toBe("90s");
  });

  it("round-trips nutrition rows when category is NUTRITION", () => {
    const md = exercisesToMarkdown(
      [
        {
          id: "1",
          name: "Aveia",
          fields: { quantity: "40g", preparation: "Com leite" },
        },
      ],
      "NUTRITION",
    );
    expect(md).toBe("- Aveia · 40g · Com leite");
    const back = markdownToExercises(md, "NUTRITION");
    expect(back[0].fields.quantity).toBe("40g");
    expect(back[0].fields.preparation).toBe("Com leite");
  });
});
