import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { WorkoutExerciseList } from "@/components/student/WorkoutExerciseList";
import { getSpaceVocabulary } from "@/lib/space/vocabulary";

vi.mock("@/hooks/useSpaceVocabulary", () => ({
  useSpaceVocabulary: vi.fn(),
}));

import { useSpaceVocabulary } from "@/hooks/useSpaceVocabulary";

function mockVocabulary(category: "GYM" | "NUTRITION") {
  vi.mocked(useSpaceVocabulary).mockReturnValue({
    category,
    vocabulary: getSpaceVocabulary(category),
  });
}

describe("WorkoutExerciseList", () => {
  it("renders fitness fields from markdown safely", () => {
    mockVocabulary("GYM");
    render(
      <WorkoutExerciseList
        contentMarkdown={`- Agachamento 4x10 · 90s
- Leg press 3x12
- Stiff 3x10`}
      />,
    );

    expect(screen.getByText("Agachamento")).toBeInTheDocument();
    expect(screen.getByText("Leg press")).toBeInTheDocument();
    expect(screen.getByText("Stiff")).toBeInTheDocument();
    expect(screen.getByText("4 × 10 · 90s")).toBeInTheDocument();
  });

  it("renders nutrition fields from markdown", () => {
    mockVocabulary("NUTRITION");
    render(
      <WorkoutExerciseList
        contentMarkdown={`- Arroz integral · 150g · Cozido
- Frango grelhado · 120g · Grelhado sem óleo`}
      />,
    );

    expect(screen.getByText("Arroz integral")).toBeInTheDocument();
    expect(screen.getByText("150g · Cozido")).toBeInTheDocument();
    expect(screen.getByText("120g · Grelhado sem óleo")).toBeInTheDocument();
    expect(screen.queryByText(/Séries/i)).not.toBeInTheDocument();
  });

  it("returns null when empty", () => {
    mockVocabulary("GYM");
    const { container } = render(<WorkoutExerciseList contentMarkdown="" />);
    expect(container.firstChild).toBeNull();
  });
});
