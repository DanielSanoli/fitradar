import { describe, expect, it } from "vitest";
import { Dumbbell, Salad, UtensilsCrossed } from "lucide-react";
import {
  formatCountLabel,
  formatItemContentCount,
  formatProgramItemSummary,
  getSpaceVocabulary,
} from "@/lib/space/vocabulary";
import { getStudentNavItems } from "@/lib/student/student-nav";

describe("getSpaceVocabulary", () => {
  it("returns fitness vocabulary for gym and other categories", () => {
    const gym = getSpaceVocabulary("GYM");
    expect(gym.program.singular).toBe("programa");
    expect(gym.item.plural).toBe("treinos");
    expect(gym.checkInButton).toBe("Treino feito!");
    expect(gym.mediaLabel).toBe("Execução do exercício");

    const other = getSpaceVocabulary("OTHER");
    expect(other.programsNav).toBe("Programas");
    expect(other.itemContent).toBe("Exercícios");
  });

  it("returns nutrition vocabulary for NUTRITION", () => {
    const nutrition = getSpaceVocabulary("NUTRITION");
    expect(nutrition.program.plural).toBe("planos alimentares");
    expect(nutrition.item.singular).toBe("refeição");
    expect(nutrition.checkInAction).toBe("Registrar refeição");
    expect(nutrition.checkInRegistered).toBe("Refeição registrada!");
    expect(nutrition.mediaLabel).toBe("Preparo do prato");
    expect(nutrition.itemContent).toBe("Alimentos / Modo de preparo");
    expect(nutrition.programIcon).toBe(Salad);
    expect(nutrition.itemIcon).toBe(UtensilsCrossed);
    expect(nutrition.contentSchema).toBe("nutrition");
    expect(nutrition.contentFields.map((field) => field.label)).toEqual([
      "Quantidade / Porção",
      "Modo de preparo",
    ]);
  });

  it("uses fitness icons for gym and other categories", () => {
    expect(getSpaceVocabulary("GYM").programIcon).toBe(Dumbbell);
    expect(getSpaceVocabulary("GYM").itemIcon).toBe(Dumbbell);
    expect(getSpaceVocabulary("GYM").contentSchema).toBe("fitness");
    expect(getSpaceVocabulary("GYM").contentFields.map((field) => field.label)).toEqual([
      "Séries",
      "Repetições",
      "Descanso",
    ]);
    expect(getSpaceVocabulary("OTHER").programIcon).toBe(Dumbbell);
  });

  it("wires program nav icon from vocabulary", () => {
    const fitnessNav = getStudentNavItems(getSpaceVocabulary("GYM"));
    const nutritionNav = getStudentNavItems(getSpaceVocabulary("NUTRITION"));
    expect(fitnessNav.find((item) => item.to === "/student/programs")?.icon).toBe(Dumbbell);
    expect(nutritionNav.find((item) => item.to === "/student/programs")?.icon).toBe(Salad);
  });

  it("falls back to fitness for unknown categories", () => {
    expect(getSpaceVocabulary(null).checkInButton).toBe("Treino feito!");
    expect(getSpaceVocabulary("INVALID").programsAndItems).toBe("Programas & Treinos");
  });
});

describe("vocabulary formatters", () => {
  const fitness = getSpaceVocabulary("GYM");

  it("formats singular and plural counts", () => {
    expect(formatCountLabel(1, "treino", "treinos")).toBe("1 treino");
    expect(formatCountLabel(3, "treino", "treinos")).toBe("3 treinos");
  });

  it("formats program and item summary", () => {
    expect(formatProgramItemSummary(2, 5, fitness)).toBe("2 programas · 5 treinos");
    const nutrition = getSpaceVocabulary("NUTRITION");
    expect(formatProgramItemSummary(1, 4, nutrition)).toBe(
      "1 plano alimentar · 4 refeições",
    );
  });

  it("formats item content count", () => {
    expect(formatItemContentCount(2, fitness)).toBe("2 exercícios");
    expect(formatItemContentCount(1, getSpaceVocabulary("NUTRITION"))).toBe("1 alimento");
  });
});
