import { describe, expect, it } from "vitest";
import {
  formatFitnessDetail,
  formatNutritionDetail,
  itemContentToMarkdown,
  markdownToItemContent,
  parseItemContentLines,
} from "@/lib/item-content";

describe("item-content fitness", () => {
  it("round-trips sets, reps and rest to markdown", () => {
    const md = itemContentToMarkdown(
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
      "fitness",
    );
    expect(md).toContain("Agachamento 4x10 · 90s");
    const back = markdownToItemContent(md, "fitness");
    expect(back).toHaveLength(2);
    expect(back[0].name).toBe("Agachamento");
    expect(back[0].fields.sets).toBe("4");
    expect(back[0].fields.reps).toBe("10");
    expect(back[0].fields.rest).toBe("90s");
  });

  it("formats fitness detail for student display", () => {
    expect(formatFitnessDetail({ sets: "4", reps: "10", rest: "90s" })).toBe("4 × 10 · 90s");
    expect(formatFitnessDetail({ sets: "4", reps: "10", rest: "" })).toBe("4 × 10");
  });

  it("parses legacy markdown lines", () => {
    const lines = parseItemContentLines(`- Agachamento 4x10\n- Leg press 3x12`, "fitness");
    expect(lines[0].name).toBe("Agachamento");
    expect(lines[0].fields.reps).toBe("10");
  });
});

describe("item-content nutrition", () => {
  it("round-trips quantity and preparation to markdown", () => {
    const md = itemContentToMarkdown(
      [
        {
          id: "1",
          name: "Arroz integral",
          fields: { quantity: "150g", preparation: "Cozido" },
        },
        {
          id: "2",
          name: "Frango grelhado",
          fields: { quantity: "120g", preparation: "Sem óleo" },
        },
      ],
      "nutrition",
    );
    expect(md).toBe(
      "- Arroz integral · 150g · Cozido\n- Frango grelhado · 120g · Sem óleo",
    );
    const back = markdownToItemContent(md, "nutrition");
    expect(back[0].fields.quantity).toBe("150g");
    expect(back[0].fields.preparation).toBe("Cozido");
  });

  it("formats nutrition detail for student display", () => {
    expect(
      formatNutritionDetail({ quantity: "150g", preparation: "Cozido em água" }),
    ).toBe("150g · Cozido em água");
    expect(formatNutritionDetail({ quantity: "1 fatia", preparation: "" })).toBe("1 fatia");
  });

  it("does not interpret nutrition lines as fitness sets", () => {
    const lines = parseItemContentLines("- Aveia · 40g · Com leite", "nutrition");
    expect(lines[0].name).toBe("Aveia");
    expect(lines[0].fields.quantity).toBe("40g");
    expect(lines[0].fields.preparation).toBe("Com leite");
  });
});
