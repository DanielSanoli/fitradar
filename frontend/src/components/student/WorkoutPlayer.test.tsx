import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WorkoutPlayer } from "@/components/student/WorkoutPlayer";
import {
  sessionStorageKey,
} from "@/lib/student/workout-player-session";
import {
  parseWorkoutMarkdownToSteps,
  resetWorkoutPlayerParserIds,
} from "@/lib/student/workout-player-parser";

vi.mock("@/hooks/useScreenWakeLock", () => ({
  useScreenWakeLock: vi.fn(),
}));

describe("WorkoutPlayer", () => {
  const onFinish = vi.fn();
  const onClose = vi.fn();
  const markdown = `- Agachamento 4x10
- Leg press 3x12`;

  beforeEach(() => {
    sessionStorage.clear();
    resetWorkoutPlayerParserIds();
    onFinish.mockReset();
    onClose.mockReset();
  });

  it("marks items and finishes workout", async () => {
    const user = userEvent.setup();
    render(
      <WorkoutPlayer
        workoutId="w-mark"
        workoutTitle="Leg Day"
        contentMarkdown={markdown}
        onFinish={onFinish}
        onClose={onClose}
      />,
    );

    expect(screen.getByRole("dialog", { name: /modo treino/i })).toBeInTheDocument();
    expect(screen.getByText("Agachamento")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /marcar como feito/i }));
    await user.click(screen.getByRole("button", { name: /marcar como feito/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /finalizar treino/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /finalizar treino/i }));
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it("confirms abandon and closes", async () => {
    const user = userEvent.setup();
    render(
      <WorkoutPlayer
        workoutId="w-abandon"
        workoutTitle="Leg Day"
        contentMarkdown="- Agachamento 4x10"
        onFinish={onFinish}
        onClose={onClose}
      />,
    );

    await user.click(screen.getByLabelText(/abandonar treino/i));
    expect(await screen.findByText(/abandonar treino\?/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^abandonar$/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("restores session from sessionStorage after refresh", () => {
    resetWorkoutPlayerParserIds();
    const md = `- A
- B`;
    const parsed = parseWorkoutMarkdownToSteps(md);
    const firstId = parsed.items[0]?.id ?? "";

    sessionStorage.setItem(
      sessionStorageKey("w-restore"),
      JSON.stringify({
        workoutId: "w-restore",
        workoutTitle: "Leg Day",
        contentMarkdown: md,
        startedAt: new Date().toISOString(),
        currentItemIndex: 1,
        completedItemIds: [firstId],
      }),
    );

    render(
      <WorkoutPlayer
        workoutId="w-restore"
        workoutTitle="Leg Day"
        contentMarkdown={md}
        onFinish={onFinish}
        onClose={onClose}
      />,
    );

    expect(screen.getByText(/exercício 2 de 2/i)).toBeInTheDocument();
    expect(screen.getByText(/1 de 2 concluídos/i)).toBeInTheDocument();
  });
});
