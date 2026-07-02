import { describe, expect, it, vi, beforeEach } from "vitest";
import type { CSSProperties, ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { StudentSpaceHero } from "@/components/student/StudentSpaceHero";
import { StudentSpaceProvider } from "@/hooks/useStudentSpace";
import { StudentHomePage } from "@/features/student/StudentHomePage";
import { StudentProgramsPage } from "@/features/student/StudentProgramsPage";
import { AuthContext, type AuthContextValue } from "@/features/auth/AuthProvider";
import { ToastProvider } from "@/components/ui/toast";
import { PageTitleProvider } from "@/hooks/usePageTitle";
import { SpaceVocabularyProvider } from "@/hooks/useSpaceVocabulary";
import { memberApi } from "@/lib/api/member-api";
import type { CreatorSpaceResponse } from "@/lib/api/domain-types";
import { buildStudentThemeCssVars } from "@/lib/creator/space-theme";

vi.mock("@/lib/api/member-api", () => ({
  memberApi: {
    mySpace: vi.fn(),
    myProgress: vi.fn(),
    myWorkouts: vi.fn(),
    myCheckIns: vi.fn(),
    myPrograms: vi.fn(),
    createCheckIn: vi.fn(),
    enrollProgram: vi.fn(),
  },
}));

const blueSpace: CreatorSpaceResponse = {
  id: "1",
  creatorId: "c1",
  name: "Blue Coaching",
  slug: "blue",
  logoUrl: "https://cdn.example/logo.png",
  primaryColor: "#5b8cff",
  bio: "Nutrição esportiva personalizada para seus objetivos.",
  category: "NUTRITION" as const,
  modules: ["NUTRITION"],
  createdAt: "2024-01-01T00:00:00Z",
};

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

function renderStudent(ui: ReactNode, path = "/student") {
  return render(
    <ToastProvider>
      <PageTitleProvider>
        <AuthContext.Provider value={authValue}>
          <MemoryRouter initialEntries={[path]}>
            <SpaceVocabularyProvider>
              <StudentSpaceProvider>{ui}</StudentSpaceProvider>
            </SpaceVocabularyProvider>
          </MemoryRouter>
        </AuthContext.Provider>
      </PageTitleProvider>
    </ToastProvider>,
  );
}

describe("student white-label", () => {
  beforeEach(() => {
    vi.mocked(memberApi.mySpace).mockResolvedValue(blueSpace);
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

  it("applies blue theme css vars from creator primaryColor", () => {
    const vars = buildStudentThemeCssVars("#5b8cff");
    const { container } = render(
      <div className="student-branded" style={vars as CSSProperties}>
        <span>themed</span>
      </div>,
    );
    const shell = container.firstElementChild as HTMLElement;
    expect(shell.style.getPropertyValue("--primary")).toMatch(/^2\d{2} /);
    expect(vars["--primary-foreground"]).toMatch(/\d+ \d+% \d+%/);
  });

  it("renders space hero with logo, name, category and bio", () => {
    render(<StudentSpaceHero space={blueSpace} />);

    expect(screen.getByRole("heading", { name: "Blue Coaching" })).toBeInTheDocument();
    expect(screen.getByText("Nutrição")).toBeInTheDocument();
    expect(screen.getByText(/nutrição esportiva personalizada/i)).toBeInTheDocument();
  });

  it("shows branded hero on student home and programs", async () => {
    const { unmount } = renderStudent(<StudentHomePage />, "/student");

    await waitFor(() => {
      expect(screen.getByText("Blue Coaching")).toBeInTheDocument();
      expect(screen.getByText(/nutrição esportiva personalizada/i)).toBeInTheDocument();
    });

    unmount();
    renderStudent(<StudentProgramsPage />, "/student/programs");

    await waitFor(() => {
      expect(screen.getByText("Blue Coaching")).toBeInTheDocument();
      expect(screen.getByText(/nutrição esportiva personalizada/i)).toBeInTheDocument();
    });
  });
});
