import { describe, expect, it, beforeEach } from "vitest";
import {
  parseWorkoutMarkdownToSteps,
  resetWorkoutPlayerParserIds,
} from "@/lib/student/workout-player-parser";

describe("parseWorkoutMarkdownToSteps", () => {
  beforeEach(() => {
    resetWorkoutPlayerParserIds();
  });

  it("parses headings as blocks and list items as exercises", () => {
    const md = `## Aquecimento
- Mobilidade 5 min
- Polichinelo 30s

## Principal
- Agachamento 4x10 · 90s
- Leg press 3x12`;

    const { items, unstructuredProse } = parseWorkoutMarkdownToSteps(md);

    expect(unstructuredProse).toBeNull();
    expect(items).toHaveLength(4);
    expect(items[0]).toMatchObject({
      label: "Mobilidade 5 min",
      blockTitle: "Aquecimento",
    });
    expect(items[2]).toMatchObject({
      label: "Agachamento",
      detail: "4x10 · 90s",
      blockTitle: "Principal",
    });
  });

  it("parses nested list items with prefix", () => {
    const md = `- Agachamento 4x10
  - Descer devagar
  - Pausa no fundo`;

    const { items } = parseWorkoutMarkdownToSteps(md);

    expect(items).toHaveLength(3);
    expect(items[1].label).toBe("↳ Descer devagar");
    expect(items[2].label).toBe("↳ Pausa no fundo");
  });

  it("returns single prose step for unstructured markdown", () => {
    const md = "Faça 3 séries de flexão até a falha. Descanse 1 min entre séries.";

    const { items, unstructuredProse } = parseWorkoutMarkdownToSteps(md);

    expect(unstructuredProse).toBe(md);
    expect(items).toHaveLength(1);
    expect(items[0].label).toBe("Treino");
    expect(items[0].detail).toBe(md);
  });

  it("handles empty markdown", () => {
    const { items, unstructuredProse } = parseWorkoutMarkdownToSteps("  \n  ");
    expect(items).toHaveLength(0);
    expect(unstructuredProse).toBeNull();
  });

  it("supports numbered lists", () => {
    const md = `1. Supino 3x8
2. Crucifixo 3x12`;

    const { items } = parseWorkoutMarkdownToSteps(md);
    expect(items).toHaveLength(2);
    expect(items[0].label).toBe("Supino");
    expect(items[0].detail).toBe("3x8");
  });
});
