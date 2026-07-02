import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { SpaceVocabularyProvider } from "@/hooks/useSpaceVocabulary";
import { StudentHomePage } from "@/features/student/StudentHomePage";
import { ProgramsListPage } from "@/features/creator/ProgramsPage";
import { AuthContext, type AuthContextValue } from "@/features/auth/AuthProvider";
import { ToastProvider } from "@/components/ui/toast";
import { PageTitleProvider } from "@/hooks/usePageTitle";
import { memberApi } from "@/lib/api/member-api";
import { spaceApi } from "@/lib/api/space-api";

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

vi.mock("@/lib/api/space-api", () => ({
  spaceApi: { get: vi.fn() },
}));

vi.mock("@/lib/api/programs-api", () => ({
  programsApi: { list: vi.fn().mockResolvedValue([]) },
}));

vi.mock("@/lib/api/students-api", () => ({
  studentsApi: {
    list: vi.fn().mockResolvedValue({ content: [], page: 0, size: 200, totalElements: 0, totalPages: 0 }),
  },
}));

const studentAuth: AuthContextValue = {
  user: {
    id: "1",
    name: "Ana",
    email: "a@test.com",
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

const creatorAuth: AuthContextValue = {
  ...studentAuth,
  user: { ...studentAuth.user!, role: "CREATOR" },
};

function renderWithVocabulary(ui: ReactNode, path: string) {
  return render(
    <ToastProvider>
      <PageTitleProvider>
        <AuthContext.Provider value={studentAuth}>
          <MemoryRouter initialEntries={[path]}>
            <SpaceVocabularyProvider>{ui}</SpaceVocabularyProvider>
          </MemoryRouter>
        </AuthContext.Provider>
      </PageTitleProvider>
    </ToastProvider>,
  );
}

describe("space vocabulary UI", () => {
  beforeEach(() => {
    vi.mocked(memberApi.myCheckIns).mockResolvedValue({
      content: [],
      page: 0,
      size: 100,
      totalElements: 0,
      totalPages: 0,
    });
    vi.mocked(memberApi.myPrograms).mockResolvedValue([]);
    vi.mocked(memberApi.myWorkouts).mockResolvedValue([]);
    vi.mocked(memberApi.myProgress).mockResolvedValue({
      studentId: "1",
      studentName: "Ana",
      enrolled: false,
      adherence: "0.00",
      currentStreak: 0,
      weeklyDone: 0,
      nextWorkoutId: null,
      nextWorkoutTitle: null,
      message: "Escolha um plano.",
      assumptions: [],
    });
  });

  it("shows nutrition labels for student home", async () => {
    vi.mocked(memberApi.mySpace).mockResolvedValue({
      id: "1",
      creatorId: "c1",
      name: "Nutri Studio",
      slug: "nutri",
      logoUrl: null,
      primaryColor: null,
      bio: null,
      category: "NUTRITION",
      modules: ["NUTRITION"],
      createdAt: "2024-01-01T00:00:00Z",
    });

    renderWithVocabulary(<StudentHomePage />, "/student");

    await waitFor(() => {
      expect(screen.getByText("Nenhum plano alimentar ainda")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /ver planos alimentares disponíveis/i })).toBeInTheDocument();
    });
  });

  it("shows fitness labels for student home", async () => {
    vi.mocked(memberApi.mySpace).mockResolvedValue({
      id: "1",
      creatorId: "c1",
      name: "Gym Studio",
      slug: "gym",
      logoUrl: null,
      primaryColor: null,
      bio: null,
      category: "GYM",
      modules: ["TRAINING"],
      createdAt: "2024-01-01T00:00:00Z",
    });

    renderWithVocabulary(<StudentHomePage />, "/student");

    await waitFor(() => {
      expect(screen.getByText("Nenhum programa ainda")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /ver programas disponíveis/i })).toBeInTheDocument();
    });
  });

  it("shows nutrition labels on creator programs page", async () => {
    vi.mocked(spaceApi.get).mockResolvedValue({
      id: "1",
      creatorId: "c1",
      name: "Nutri Studio",
      slug: "nutri",
      logoUrl: null,
      primaryColor: null,
      bio: null,
      category: "NUTRITION",
      modules: ["NUTRITION"],
      createdAt: "2024-01-01T00:00:00Z",
    });

    render(
      <ToastProvider>
        <PageTitleProvider>
          <AuthContext.Provider value={creatorAuth}>
            <MemoryRouter initialEntries={["/app/programs"]}>
              <SpaceVocabularyProvider>
                <ProgramsListPage />
              </SpaceVocabularyProvider>
            </MemoryRouter>
          </AuthContext.Provider>
        </PageTitleProvider>
      </ToastProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Planos alimentares & Refeições")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /criar plano alimentar/i })).toBeInTheDocument();
    });
  });
});
