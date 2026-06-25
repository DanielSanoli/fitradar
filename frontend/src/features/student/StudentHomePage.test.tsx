import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ToastProvider } from "@/components/ui/toast";
import { StudentHomePage } from "@/features/student/StudentHomePage";
import { AuthContext, type AuthContextValue } from "@/features/auth/AuthProvider";
import { memberApi } from "@/lib/api/member-api";
import { StudentSpaceProvider } from "@/hooks/useStudentSpace";
import { SpaceVocabularyProvider } from "@/hooks/useSpaceVocabulary";
import { localDateKey } from "@/lib/student/date-utils";

vi.mock("@/lib/api/member-api", () => ({
  memberApi: {
    myProgress: vi.fn(),
    myWorkouts: vi.fn(),
    myCheckIns: vi.fn(),
    mySpace: vi.fn(),
    myPrograms: vi.fn(),
    createCheckIn: vi.fn(),
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

const workoutProgress = {
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
};

const workoutList = [
  {
    id: "w1",
    programId: "p1",
    title: "Lower Body A",
    description: "Foco em pernas",
    contentMarkdown: "- Agachamento 4x10\n- Leg press 3x12",
    dayIndex: 1,
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "w2",
    programId: "p1",
    title: "Upper Body",
    description: null,
    contentMarkdown: "- Supino 3x8",
    dayIndex: 2,
    createdAt: "2024-01-01T00:00:00Z",
  },
];

function renderHome() {
  return render(
    <ToastProvider>
      <AuthContext.Provider value={authValue}>
        <MemoryRouter initialEntries={["/student"]}>
          <SpaceVocabularyProvider>
            <StudentSpaceProvider>
              <StudentHomePage />
            </StudentSpaceProvider>
          </SpaceVocabularyProvider>
        </MemoryRouter>
      </AuthContext.Provider>
    </ToastProvider>,
  );
}

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
      category: "OTHER",
      createdAt: "2024-01-01T00:00:00Z",
    });
    vi.mocked(memberApi.myPrograms).mockResolvedValue([]);
    vi.mocked(memberApi.createCheckIn).mockResolvedValue({
      id: "ci1",
      studentId: "1",
      workoutId: "w1",
      date: localDateKey(),
      status: "DONE",
      feeling: null,
      notes: null,
    });
  });

  it("shows no-program state when not enrolled", async () => {
    vi.mocked(memberApi.myProgress).mockResolvedValue({
      ...workoutProgress,
      enrolled: false,
      nextWorkoutId: null,
      nextWorkoutTitle: null,
      message: "Peça matrícula ao treinador.",
    });
    vi.mocked(memberApi.myWorkouts).mockResolvedValue([]);

    renderHome();

    await waitFor(() => {
      expect(screen.getByText("Nenhum programa ainda")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /ver programas disponíveis/i })).toHaveAttribute(
        "href",
        "/student/programs",
      );
    });
  });

  it("shows full exercise list for today's workout", async () => {
    vi.mocked(memberApi.myProgress).mockResolvedValue(workoutProgress);
    vi.mocked(memberApi.myWorkouts).mockResolvedValue(workoutList);
    vi.mocked(memberApi.myPrograms).mockResolvedValue([
      {
        id: "p1",
        title: "Base de Força",
        description: null,
        price: null,
        paid: false,
        enrolled: true,
        purchasePending: false,
      },
    ]);

    renderHome();

    await waitFor(() => {
      expect(screen.getByText("Agachamento")).toBeInTheDocument();
      expect(screen.getByText("Leg press")).toBeInTheDocument();
      expect(screen.getByText("4 × 10")).toBeInTheDocument();
    });
  });

  it("quick check-in in one tap", async () => {
    const doneCheckIn = {
      id: "ci1",
      studentId: "1",
      workoutId: "w1",
      date: localDateKey(),
      status: "DONE" as const,
      feeling: null,
      notes: null,
    };
    vi.mocked(memberApi.myProgress).mockResolvedValue(workoutProgress);
    vi.mocked(memberApi.myWorkouts).mockResolvedValue(workoutList);
    vi.mocked(memberApi.createCheckIn).mockResolvedValue(doneCheckIn);
    vi.mocked(memberApi.myCheckIns)
      .mockResolvedValueOnce({
        content: [],
        page: 0,
        size: 100,
        totalElements: 0,
        totalPages: 0,
      })
      .mockResolvedValue({
        content: [doneCheckIn],
        page: 0,
        size: 100,
        totalElements: 1,
        totalPages: 1,
      });

    const user = userEvent.setup();
    renderHome();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /treino feito!/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /treino feito!/i }));

    await waitFor(() => {
      expect(memberApi.createCheckIn).toHaveBeenCalledWith({
        workoutId: "w1",
        skipped: false,
        feeling: null,
        notes: null,
      });
      expect(screen.getByRole("button", { name: /treino concluído hoje/i })).toBeDisabled();
      expect(screen.getByText("Concluído")).toBeInTheDocument();
    });
  });

  it("opens optional check-in sheet with feeling", async () => {
    vi.mocked(memberApi.myProgress).mockResolvedValue(workoutProgress);
    vi.mocked(memberApi.myWorkouts).mockResolvedValue(workoutList);

    const user = userEvent.setup();
    renderHome();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /como me senti/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /como me senti/i }));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Como foi o treino?")).toBeInTheDocument();
  });

  it("shows rest day state", async () => {
    vi.mocked(memberApi.myProgress).mockResolvedValue({
      ...workoutProgress,
      nextWorkoutId: null,
      nextWorkoutTitle: null,
      message: "Descanse hoje.",
    });
    vi.mocked(memberApi.myWorkouts).mockResolvedValue(workoutList);

    renderHome();

    await waitFor(() => {
      expect(screen.getByText("Dia de descanso")).toBeInTheDocument();
    });
  });

  it("does not render dev preview toggle", async () => {
    vi.mocked(memberApi.myProgress).mockResolvedValue(workoutProgress);
    vi.mocked(memberApi.myWorkouts).mockResolvedValue(workoutList);

    renderHome();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /treino feito!/i })).toBeInTheDocument();
    });

    expect(screen.queryByText(/pré-visualizar/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Descanso" })).not.toBeInTheDocument();
  });
});
