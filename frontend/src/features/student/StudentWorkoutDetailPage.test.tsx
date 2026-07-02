import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ToastProvider } from "@/components/ui/toast";
import { StudentWorkoutDetailPage } from "@/features/student/StudentWorkoutDetailPage";
import { memberApi } from "@/lib/api/member-api";

vi.mock("@/lib/api/member-api", () => ({
  memberApi: {
    myWorkouts: vi.fn(),
    myCheckIns: vi.fn(),
    myProgress: vi.fn(),
    myGamification: vi.fn(),
    createCheckIn: vi.fn(),
  },
}));

vi.mock("@/hooks/useScreenWakeLock", () => ({
  useScreenWakeLock: vi.fn(),
}));

function renderPage(workoutId = "w1") {
  return render(
    <ToastProvider>
      <MemoryRouter initialEntries={[`/student/workouts/${workoutId}`]}>
        <Routes>
          <Route path="/student/workouts/:workoutId" element={<StudentWorkoutDetailPage />} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>,
  );
}

describe("StudentWorkoutDetailPage", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.mocked(memberApi.myWorkouts).mockResolvedValue([
      {
        id: "w1",
        programId: "p1",
        title: "Leg Day",
        description: "Foco em pernas",
        dayIndex: 1,
        contentMarkdown: "- Agachamento 4x10",
        createdAt: "2024-01-01T00:00:00Z",
      },
    ]);
    vi.mocked(memberApi.myCheckIns).mockResolvedValue({
      content: [],
      page: 0,
      size: 100,
      totalElements: 0,
      totalPages: 0,
    });
    vi.mocked(memberApi.myProgress).mockResolvedValue({
      studentId: "s1",
      studentName: "Ana",
      enrolled: true,
      adherence: "80.00",
      currentStreak: 3,
      weeklyDone: 2,
      nextWorkoutId: "w2",
      nextWorkoutTitle: "Other",
      message: null,
      assumptions: [],
    });
    vi.mocked(memberApi.myGamification).mockResolvedValue({
      studentId: "s1",
      currentStreak: 3,
      longestStreak: 5,
      totalCheckInsDone: 10,
      streakShields: 0,
      badges: [],
      rank: 1,
    });
  });

  it("shows workout exercises and registers check-in", async () => {
    vi.mocked(memberApi.createCheckIn).mockResolvedValue({
      id: "c1",
      studentId: "s1",
      workoutId: "w1",
      date: "2026-06-19",
      status: "DONE",
      feeling: null,
      notes: null,
    });

    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Leg Day")).toBeInTheDocument();
      expect(screen.getByText(/Agachamento/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /marcar treino como feito/i }));

    await waitFor(() => {
      expect(memberApi.createCheckIn).toHaveBeenCalledWith({
        workoutId: "w1",
        skipped: false,
        feeling: null,
        notes: null,
      });
    });
  });

  it("opens workout player and flows to check-in sheet on finish", async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /iniciar treino/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /iniciar treino/i }));

    expect(screen.getByRole("dialog", { name: /modo treino/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /marcar como feito/i }));
    await user.click(screen.getByRole("button", { name: /finalizar treino/i }));

    expect(await screen.findByText("Como foi o treino?")).toBeInTheDocument();
  });
});
