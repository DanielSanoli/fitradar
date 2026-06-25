import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ToastProvider } from "@/components/ui/toast";
import { StudentProgressPage } from "@/features/student/StudentProgressPage";
import { memberApi } from "@/lib/api/member-api";

const askMock = vi.fn();
const openWidgetMock = vi.fn();

vi.mock("@/features/radar/RadarCopilotProvider", () => ({
  useRadarCopilot: () => ({
    openWidget: openWidgetMock,
    ask: askMock,
    suggestions: ["Como estou indo?", "Qual meu streak?", "Como está minha aderência?"],
  }),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "student-1", name: "Lucas" } }),
}));

vi.mock("@/lib/api/member-api", () => ({
  memberApi: {
    myProgress: vi.fn(),
    myGamification: vi.fn(),
    myCheckIns: vi.fn(),
    myPrograms: vi.fn(),
    myWorkouts: vi.fn(),
    myLeaderboard: vi.fn(),
  },
}));

vi.mock("@/lib/api/copilot-api", () => ({
  copilotApi: { ask: vi.fn() },
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <StudentProgressPage />
      </ToastProvider>
    </MemoryRouter>,
  );
}

describe("StudentProgressPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(memberApi.myCheckIns).mockResolvedValue({
      content: [],
      page: 0,
      size: 100,
      totalElements: 0,
      totalPages: 0,
    });
    vi.mocked(memberApi.myPrograms).mockResolvedValue([]);
    vi.mocked(memberApi.myWorkouts).mockResolvedValue([]);
    vi.mocked(memberApi.myLeaderboard).mockResolvedValue([]);
  });

  it("renders active progress with adherence ring and weekly chart", async () => {
    vi.mocked(memberApi.myProgress).mockResolvedValue({
      studentId: "1",
      studentName: "Lucas",
      enrolled: true,
      adherence: "80.00",
      currentStreak: 7,
      weeklyDone: 3,
      nextWorkoutId: "w1",
      nextWorkoutTitle: "Upper Body A",
      message: null,
      assumptions: [],
    });
    vi.mocked(memberApi.myGamification).mockResolvedValue({
      studentId: "1",
      currentStreak: 7,
      longestStreak: 10,
      totalCheckInsDone: 12,
      badges: [{ type: "FIRST", label: "Primeiro check-in", earnedAt: "2024-01-01" }],
      rank: 1,
    });
    vi.mocked(memberApi.myPrograms).mockResolvedValue([
      {
        id: "p1",
        title: "Base de Força",
        description: null,
        enrolled: true,
        price: null,
        paid: false,
        purchasePending: false,
      },
    ]);
    vi.mocked(memberApi.myWorkouts).mockResolvedValue([
      {
        id: "w1",
        programId: "p1",
        title: "Upper Body A",
        description: null,
        contentMarkdown: "- Supino 3x8",
        dayIndex: 1,
        createdAt: "2024-01-01T00:00:00Z",
      },
    ]);
    vi.mocked(memberApi.myLeaderboard).mockResolvedValue([
      {
        rank: 1,
        studentId: "1",
        studentName: "Lucas",
        currentStreak: 7,
        totalCheckInsDone: 12,
      },
    ]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Boa semana, Lucas!/i)).toBeInTheDocument();
      expect(screen.getByText("Esta semana")).toBeInTheDocument();
      expect(screen.getByText("Aderência")).toBeInTheDocument();
      expect(screen.getByText("3 treinos esta semana")).toBeInTheDocument();
      expect(screen.getByText("Programa atual")).toBeInTheDocument();
      expect(screen.getByText("Ranking da comunidade")).toBeInTheDocument();
      expect(screen.getByText("#1")).toBeInTheDocument();
    });
  });

  it("renders early journey without weekly chart", async () => {
    vi.mocked(memberApi.myProgress).mockResolvedValue({
      studentId: "1",
      studentName: "Lucas",
      enrolled: true,
      adherence: null,
      currentStreak: 2,
      weeklyDone: 1,
      nextWorkoutId: "w1",
      nextWorkoutTitle: "Lower Body A",
      message: null,
      assumptions: [],
    });
    vi.mocked(memberApi.myGamification).mockResolvedValue({
      studentId: "1",
      currentStreak: 2,
      longestStreak: 2,
      totalCheckInsDone: 2,
      badges: [],
      rank: 1,
    });
    vi.mocked(memberApi.myWorkouts).mockResolvedValue([
      {
        id: "w1",
        programId: "p1",
        title: "Lower Body A",
        description: null,
        contentMarkdown: "- Agachamento 4x10",
        dayIndex: 1,
        createdAt: "2024-01-01T00:00:00Z",
      },
    ]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Você está começando!")).toBeInTheDocument();
      expect(screen.getByText("Seus próximos marcos")).toBeInTheDocument();
      expect(screen.queryByText("Esta semana")).not.toBeInTheDocument();
    });
  });

  it("keeps progress visible when gamification fails", async () => {
    vi.mocked(memberApi.myProgress).mockResolvedValue({
      studentId: "1",
      studentName: "Lucas",
      enrolled: true,
      adherence: "75.00",
      currentStreak: 4,
      weeklyDone: 2,
      nextWorkoutId: null,
      nextWorkoutTitle: null,
      message: null,
      assumptions: [],
    });
    vi.mocked(memberApi.myGamification).mockRejectedValue(new Error("offline"));

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Boa semana, Lucas!/i)).toBeInTheDocument();
      expect(screen.getByText(/Conquistas temporariamente indisponíveis/i)).toBeInTheDocument();
      expect(screen.getByText("Aderência")).toBeInTheDocument();
    });
  });

  it("opens radar and asks when suggestion is tapped", async () => {
    vi.mocked(memberApi.myProgress).mockResolvedValue({
      studentId: "1",
      studentName: "Lucas",
      enrolled: true,
      adherence: "80.00",
      currentStreak: 3,
      weeklyDone: 2,
      nextWorkoutId: null,
      nextWorkoutTitle: null,
      message: null,
      assumptions: [],
    });
    vi.mocked(memberApi.myGamification).mockResolvedValue({
      studentId: "1",
      currentStreak: 3,
      longestStreak: 5,
      totalCheckInsDone: 12,
      badges: [],
      rank: 1,
    });

    renderPage();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText("Pergunte ao Radar")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Como estou indo?" }));

    expect(openWidgetMock).toHaveBeenCalled();
    expect(askMock).toHaveBeenCalledWith("Como estou indo?");
  });

  it("shows early journey layout from progress data", async () => {
    vi.mocked(memberApi.myProgress).mockResolvedValue({
      studentId: "1",
      studentName: "Lucas",
      enrolled: true,
      adherence: null,
      currentStreak: 1,
      weeklyDone: 1,
      nextWorkoutId: "w1",
      nextWorkoutTitle: "Upper Body A",
      message: null,
      assumptions: [],
    });
    vi.mocked(memberApi.myGamification).mockResolvedValue({
      studentId: "1",
      currentStreak: 1,
      longestStreak: 1,
      totalCheckInsDone: 2,
      badges: [],
      rank: 1,
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Você está começando!")).toBeInTheDocument();
      expect(screen.getByText("Seus próximos marcos")).toBeInTheDocument();
      expect(screen.queryByText("Esta semana")).not.toBeInTheDocument();
    });
  });
});
