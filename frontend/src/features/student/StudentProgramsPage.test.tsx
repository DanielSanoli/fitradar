import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ToastProvider } from "@/components/ui/toast";
import { StudentProgramsPage } from "@/features/student/StudentProgramsPage";
import { AuthContext, type AuthContextValue } from "@/features/auth/AuthProvider";
import { StudentSpaceProvider } from "@/hooks/useStudentSpace";
import { SpaceVocabularyProvider } from "@/hooks/useSpaceVocabulary";
import { memberApi } from "@/lib/api/member-api";

const navigateMock = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("@/lib/api/member-api", () => ({
  memberApi: {
    myPrograms: vi.fn(),
    mySpace: vi.fn(),
    myWorkouts: vi.fn(),
    enrollProgram: vi.fn(),
  },
}));

vi.mock("@/lib/billing/start-program-checkout", () => ({
  startProgramCheckout: vi.fn(),
}));

import { startProgramCheckout } from "@/lib/billing/start-program-checkout";

const authValue: AuthContextValue = {
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

function renderPage() {
  return render(
    <ToastProvider>
      <AuthContext.Provider value={authValue}>
        <MemoryRouter initialEntries={["/student/programs"]}>
          <SpaceVocabularyProvider>
            <StudentSpaceProvider>
              <StudentProgramsPage />
            </StudentSpaceProvider>
          </SpaceVocabularyProvider>
        </MemoryRouter>
      </AuthContext.Provider>
    </ToastProvider>,
  );
}

describe("StudentProgramsPage", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    vi.mocked(memberApi.mySpace).mockResolvedValue({
      id: "1",
      creatorId: "c1",
      name: "Studio Fit",
      slug: "studio",
      logoUrl: null,
      primaryColor: null,
      bio: null,
      category: "OTHER",
      modules: ["TRAINING"],
      createdAt: "2024-01-01T00:00:00Z",
    });
    vi.mocked(memberApi.myWorkouts).mockResolvedValue([]);
  });

  it("lists programs from the catalog API", async () => {
    vi.mocked(memberApi.myPrograms).mockResolvedValue([
      {
        id: "p1",
        title: "Força Base",
        description: "Introdução ao treino",
        price: null,
        paid: false,
        enrolled: false,
        purchasePending: false,
        nutritionStructured: false,
      },
      {
        id: "p2",
        title: "Premium",
        description: null,
        price: "99.00",
        paid: true,
        enrolled: false,
        purchasePending: false,
        nutritionStructured: false,
      },
    ]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Força Base")).toBeInTheDocument();
      expect(screen.getByText("Premium")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /matricular grátis/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /comprar/i })).toBeInTheDocument();
    });
  });

  it("enrolls in a free program and navigates to home", async () => {
    vi.mocked(memberApi.myPrograms).mockResolvedValue([
      {
        id: "p1",
        title: "Força Base",
        description: null,
        price: null,
        paid: false,
        enrolled: false,
        purchasePending: false,
        nutritionStructured: false,
      },
    ]);
    vi.mocked(memberApi.enrollProgram).mockResolvedValue({
      id: "e1",
      studentId: "s1",
      programId: "p1",
      programTitle: "Força Base",
      startDate: "2026-06-19",
      active: true,
    });

    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /matricular grátis/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /matricular grátis/i }));

    await waitFor(() => {
      expect(memberApi.enrollProgram).toHaveBeenCalledWith("p1");
      expect(navigateMock).toHaveBeenCalledWith("/student");
    });
  });

  it("starts checkout for paid programs", async () => {
    vi.mocked(memberApi.myPrograms).mockResolvedValue([
      {
        id: "p2",
        title: "Premium",
        description: null,
        price: "99.00",
        paid: true,
        enrolled: false,
        purchasePending: false,
        nutritionStructured: false,
      },
    ]);
    vi.mocked(startProgramCheckout).mockResolvedValue({ ok: true, redirected: true });

    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /comprar/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /comprar/i }));

    await waitFor(() => {
      expect(startProgramCheckout).toHaveBeenCalledWith("p2");
    });
  });

  it("expands workouts inline for enrolled programs", async () => {
    vi.mocked(memberApi.myPrograms).mockResolvedValue([
      {
        id: "p1",
        title: "Força Base",
        description: null,
        price: null,
        paid: false,
        enrolled: true,
        purchasePending: false,
        nutritionStructured: false,
      },
    ]);
    vi.mocked(memberApi.myWorkouts).mockResolvedValue([
      {
        id: "w1",
        programId: "p1",
        title: "Lower Body A",
        description: "Foco em pernas",
        contentMarkdown: "- Agachamento 4x10",
        dayIndex: 0,
        createdAt: "2024-01-01T00:00:00Z",
      },
    ]);

    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Matriculado")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /ver treinos/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /ver treinos/i }));

    await waitFor(() => {
      expect(screen.getByText("Lower Body A")).toBeInTheDocument();
      expect(screen.getByText("Agachamento")).toBeInTheDocument();
      expect(screen.getByText(/check-in do treino do dia na aba/i)).toBeInTheDocument();
    });
  });
});
