import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { CreatorDashboardPage } from "@/features/creator/CreatorDashboardPage";
import { AuthContext, type AuthContextValue } from "@/features/auth/AuthProvider";
import { retentionApi } from "@/lib/api/retention-api";

vi.mock("@/lib/api/retention-api", () => ({
  retentionApi: {
    overview: vi.fn(),
    studentsAtRisk: vi.fn(),
  },
}));

vi.mock("@/lib/api/copilot-api", () => ({
  copilotApi: {
    ask: vi.fn(),
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
      <MemoryRouter>
        <CreatorDashboardPage />
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe("CreatorDashboardPage", () => {
  beforeEach(() => {
    vi.mocked(retentionApi.studentsAtRisk).mockResolvedValue([]);
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
      expect(screen.getByText("Nenhum aluno ainda")).toBeInTheDocument();
    });
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
      expect(screen.getByText("Comunidade saudável")).toBeInTheDocument();
    });
  });

  it("shows alerts attention state when students are at risk", async () => {
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

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("João Silva")).toBeInTheDocument();
      expect(screen.getAllByText("Risco alto").length).toBeGreaterThan(0);
    });
  });
});
