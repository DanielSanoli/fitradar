import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ToastProvider } from "@/components/ui/toast";
import { StudentHomePage } from "@/features/student/StudentHomePage";
import { AuthContext, type AuthContextValue } from "@/features/auth/AuthProvider";
import { memberApi } from "@/lib/api/member-api";

vi.mock("@/lib/api/member-api", () => ({
  memberApi: {
    myProgress: vi.fn(),
    myWorkouts: vi.fn(),
    myCheckIns: vi.fn(),
    mySpace: vi.fn(),
  },
}));

const authValue: AuthContextValue = {
  user: {
    id: "1",
    name: "Lucas Alves",
    email: "l@test.com",
    role: "STUDENT",
    creatorId: "c1",
    plan: "FREE",
    subscriptionStatus: "ACTIVE",
    trialEndsAt: null,
    subscriptionEndsAt: null,
    emailVerified: true,
    accessAllowed: true,
    accessMessage: null,
    trialDaysRemaining: 0,
  },
  isLoading: false,
  isAuthenticated: true,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  refreshUser: vi.fn(),
};

describe("StudentHomePage", () => {
  beforeEach(() => {
    vi.mocked(memberApi.myCheckIns).mockResolvedValue({
      content: [],
      page: 0,
      size: 100,
      totalElements: 0,
      totalPages: 0,
    });
    vi.mocked(memberApi.mySpace).mockResolvedValue({
      id: "1",
      creatorId: "c1",
      name: "Studio Fit",
      slug: "studio",
      logoUrl: null,
      primaryColor: null,
      bio: null,
      createdAt: "2024-01-01T00:00:00Z",
    });
  });

  it("shows no-program state when not enrolled", async () => {
    vi.mocked(memberApi.myProgress).mockResolvedValue({
      studentId: "1",
      studentName: "Lucas",
      enrolled: false,
      adherence: null,
      currentStreak: 0,
      weeklyDone: 0,
      nextWorkoutId: null,
      nextWorkoutTitle: null,
      message: "Peça matrícula ao treinador.",
      assumptions: [],
    });
    vi.mocked(memberApi.myWorkouts).mockResolvedValue([]);

    render(
      <ToastProvider>
        <AuthContext.Provider value={authValue}>
          <MemoryRouter>
            <StudentHomePage />
          </MemoryRouter>
        </AuthContext.Provider>
      </ToastProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Comece um programa")).toBeInTheDocument();
      expect(screen.getAllByText("Peça matrícula ao treinador.").length).toBeGreaterThan(0);
    });
  });

  it("shows workout state when enrolled with next workout", async () => {
    vi.mocked(memberApi.myProgress).mockResolvedValue({
      studentId: "1",
      studentName: "Lucas",
      enrolled: true,
      adherence: "82.00",
      currentStreak: 5,
      weeklyDone: 3,
      nextWorkoutId: "w1",
      nextWorkoutTitle: "Lower Body A",
      message: "Bora treinar!",
      assumptions: [],
    });
    vi.mocked(memberApi.myWorkouts).mockResolvedValue([
      {
        id: "w1",
        programId: "p1",
        title: "Lower Body A",
        description: "Foco em pernas",
        contentMarkdown: "- Agachamento 4x10\n- Leg press 3x12",
        dayIndex: 1,
        createdAt: "2024-01-01T00:00:00Z",
      },
    ]);

    render(
      <ToastProvider>
        <AuthContext.Provider value={authValue}>
          <MemoryRouter>
            <StudentHomePage />
          </MemoryRouter>
        </AuthContext.Provider>
      </ToastProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Lower Body A")).toBeInTheDocument();
      expect(screen.getByText("Agachamento 4x10")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /marcar treino feito/i })).toBeInTheDocument();
    });
  });

  it("opens accessible check-in dialog", async () => {
    vi.mocked(memberApi.myProgress).mockResolvedValue({
      studentId: "1",
      studentName: "Lucas",
      enrolled: true,
      adherence: "82.00",
      currentStreak: 5,
      weeklyDone: 3,
      nextWorkoutId: "w1",
      nextWorkoutTitle: "Lower Body A",
      message: "Bora treinar!",
      assumptions: [],
    });
    vi.mocked(memberApi.myWorkouts).mockResolvedValue([
      {
        id: "w1",
        programId: "p1",
        title: "Lower Body A",
        description: null,
        contentMarkdown: "- Supino",
        dayIndex: 1,
        createdAt: "2024-01-01T00:00:00Z",
      },
    ]);

    const user = (await import("@testing-library/user-event")).default.setup();
    render(
      <ToastProvider>
        <AuthContext.Provider value={authValue}>
          <MemoryRouter>
            <StudentHomePage />
          </MemoryRouter>
        </AuthContext.Provider>
      </ToastProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /marcar treino feito/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: /marcar treino feito/i }));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText(/como você se sentiu/i)).toBeInTheDocument();
  });
});
