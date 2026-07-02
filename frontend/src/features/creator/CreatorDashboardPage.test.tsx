import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ToastProvider } from "@/components/ui/toast";
import { CreatorDashboardPage } from "@/features/creator/CreatorDashboardPage";
import { AuthContext, type AuthContextValue } from "@/features/auth/AuthProvider";
import { RadarCopilotProvider } from "@/features/radar/RadarCopilotProvider";
import { RadarFloatingWidget } from "@/components/radar/RadarFloatingWidget";
import { retentionApi } from "@/lib/api/retention-api";
import { spaceApi } from "@/lib/api/space-api";
import { copilotApi } from "@/lib/api/copilot-api";
import { onboardingApi } from "@/lib/api/onboarding-api";

vi.mock("@/lib/api/onboarding-api", () => ({
  onboardingApi: {
    status: vi.fn(),
    seedDemo: vi.fn(),
  },
}));

vi.mock("@/lib/api/retention-api", () => ({
  retentionApi: {
    overview: vi.fn(),
    studentsAtRisk: vi.fn(),
  },
}));

vi.mock("@/lib/api/space-api", () => ({
  spaceApi: {
    get: vi.fn(),
  },
}));

vi.mock("@/lib/api/copilot-api", () => ({
  copilotApi: {
    ask: vi.fn(),
    nudge: vi.fn(),
  },
}));

const authValue: AuthContextValue = {
  user: {
    id: "1",
    name: "Marina Duarte",
    email: "m@test.com",
    role: "CREATOR",
    creatorId: null,
    plan: "PRO",
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

function renderDashboard() {
  return render(
    <AuthContext.Provider value={authValue}>
      <ToastProvider>
        <MemoryRouter>
          <RadarCopilotProvider>
            <CreatorDashboardPage />
            <RadarFloatingWidget />
          </RadarCopilotProvider>
        </MemoryRouter>
      </ToastProvider>
    </AuthContext.Provider>,
  );
}

describe("CreatorDashboardPage", () => {
  beforeEach(() => {
    vi.mocked(onboardingApi.status).mockResolvedValue({
      hasSpace: true,
      hasProgram: true,
      hasStudent: true,
      demoSeedAvailable: false,
      onboardingComplete: true,
    });
    vi.mocked(retentionApi.studentsAtRisk).mockResolvedValue([]);
    vi.mocked(spaceApi.get).mockResolvedValue({
      id: "s1",
      creatorId: "c1",
      name: "Comunidade",
      slug: "marina-duarte",
      logoUrl: null,
      primaryColor: null,
      bio: null,
      category: "OTHER",
      modules: ["TRAINING"],
      createdAt: "2026-01-01",
    });
  });

  it("shows empty attention state when no active students", async () => {
    vi.mocked(retentionApi.overview).mockResolvedValue({
      activeStudents: 0,
      avgAdherence: null,
      atRiskCount: 0,
      checkInsThisWeek: 0,
      newStudentsThisWeek: 0,
      assumptions: [],
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("Você ainda não tem alunos")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /Convidar primeiro aluno/i })).toBeInTheDocument();
  });

  it("shows positive attention state when students exist but none at risk", async () => {
    vi.mocked(retentionApi.overview).mockResolvedValue({
      activeStudents: 5,
      avgAdherence: "78.00",
      atRiskCount: 0,
      checkInsThisWeek: 12,
      newStudentsThisWeek: 1,
      assumptions: [],
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("Ninguém em risco hoje")).toBeInTheDocument();
    });
    expect(screen.getByText("Tudo em dia")).toBeInTheDocument();
  });

  it("shows alerts attention state with reminder action", async () => {
    vi.mocked(retentionApi.overview).mockResolvedValue({
      activeStudents: 10,
      avgAdherence: "65.00",
      atRiskCount: 2,
      checkInsThisWeek: 8,
      newStudentsThisWeek: 0,
      assumptions: [],
    });
    vi.mocked(retentionApi.studentsAtRisk).mockResolvedValue([
      {
        studentId: "s1",
        studentName: "João Silva",
        score: 72,
        level: "HIGH",
        assumptions: ["Sem check-in há 9 dias"],
      },
    ]);
    vi.mocked(copilotApi.nudge).mockResolvedValue({
      studentId: "s1",
      studentName: "João Silva",
      message: "Oi João, sentimos sua falta!",
      assumptions: [],
    });

    const user = userEvent.setup();
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("João Silva")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /Enviar lembrete/i }));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  it("shows onboarding checklist for new creators", async () => {
    vi.mocked(onboardingApi.status).mockResolvedValue({
      hasSpace: false,
      hasProgram: false,
      hasStudent: false,
      demoSeedAvailable: true,
      onboardingComplete: false,
    });
    vi.mocked(retentionApi.overview).mockResolvedValue({
      activeStudents: 0,
      avgAdherence: null,
      atRiskCount: 0,
      checkInsThisWeek: 0,
      newStudentsThisWeek: 0,
      assumptions: [],
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("Primeiros passos")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /criar programa/i })).toHaveAttribute(
        "href",
        "/app/programs/new",
      );
    });
  });

  it("renders embedded radar chat with suggestions", async () => {
    vi.mocked(retentionApi.overview).mockResolvedValue({
      activeStudents: 5,
      avgAdherence: "78.00",
      atRiskCount: 0,
      checkInsThisWeek: 12,
      newStudentsThisWeek: 1,
      assumptions: [],
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("Pergunte ao Radar")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Quem merece um parabéns?" })).toBeInTheDocument();
    });
  });
});
