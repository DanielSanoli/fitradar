import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { WorkoutExerciseList } from "@/components/student/WorkoutExerciseList";

describe("WorkoutExerciseList", () => {
  it("renders all exercises from markdown safely", () => {
    render(
      <WorkoutExerciseList
        contentMarkdown={`- Agachamento 4x10
- Leg press 3x12
- Stiff 3x10`}
      />,
    );

    expect(screen.getByText("Agachamento")).toBeInTheDocument();
    expect(screen.getByText("Leg press")).toBeInTheDocument();
    expect(screen.getByText("Stiff")).toBeInTheDocument();
    expect(screen.getByText("4 × 10")).toBeInTheDocument();
  });

  it("returns null when empty", () => {
    const { container } = render(<WorkoutExerciseList contentMarkdown="" />);
    expect(container.firstChild).toBeNull();
  });
});
