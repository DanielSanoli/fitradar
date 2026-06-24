import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ToastProvider } from "@/components/ui/toast";
import { RetentionPage } from "@/features/creator/RetentionPage";
import { retentionApi } from "@/lib/api/retention-api";
import { gamificationApi } from "@/lib/api/gamification-api";

vi.mock("@/lib/api/retention-api", () => ({
  retentionApi: {
    overview: vi.fn(),
    adherenceTrend: vi.fn(),
    studentsAtRisk: vi.fn(),
    studentProgress: vi.fn(),
  },
}));

vi.mock("@/lib/api/gamification-api", () => ({
  gamificationApi: {
    leaderboard: vi.fn(),
  },
}));

vi.mock("@/lib/api/space-api", () => ({
  spaceApi: {
    get: vi.fn().mockResolvedValue({ slug: "ana" }),
  },
}));

vi.mock("@/lib/api/copilot-api", () => ({
  copilotApi: {
    nudge: vi.fn(),
  },
}));

const overviewBase = {
  activeStudents: 3,
  avgAdherence: "72.50",
  atRiskCount: 2,
  checkInsThisWeek: 8,
  newStudentsThisWeek: 1,
  assumptions: [],
};

const trendBase = {
  currentPeriodAdherence: "72.50",
  previousPeriodAdherence: "68.00",
  changePoints: "4.50",
  weeklySeries: [
    { weekStart: "2026-04-28", avgAdherence: "65.00" },
    { weekStart: "2026-05-05", avgAdherence: "70.00" },
    { weekStart: "2026-05-12", avgAdherence: "72.50" },
  ],
  assumptions: ["Aderência média da comunidade"],
};

const atRiskSample = [
  {
    studentId: "s1",
    studentName: "Maria Silva",
    score: 85,
    level: "HIGH" as const,
    assumptions: ["Inativo há 12 dias"],
  },
  {
    studentId: "s2",
    studentName: "João Costa",
    score: 55,
    level: "MEDIUM" as const,
    assumptions: ["Queda de aderência recente"],
  },
];

function renderPage() {
  return render(
    <ToastProvider>
      <MemoryRouter>
        <RetentionPage />
      </MemoryRouter>
    </ToastProvider>,
  );
}

describe("RetentionPage", () => {
  beforeEach(() => {
    vi.mocked(retentionApi.overview).mockResolvedValue(overviewBase);
    vi.mocked(retentionApi.adherenceTrend).mockResolvedValue(trendBase);
    vi.mocked(retentionApi.studentsAtRisk).mockResolvedValue(atRiskSample);
    vi.mocked(gamificationApi.leaderboard).mockResolvedValue([
      {
        studentId: "s1",
        studentName: "Maria Silva",
        totalCheckInsDone: 10,
        currentStreak: 0,
        rank: 1,
      },
    ]);
    vi.mocked(retentionApi.studentProgress).mockImplementation(async (id) => ({
      studentId: id,
      studentName: id === "s1" ? "Maria Silva" : "João Costa",
      enrolled: true,
      adherence: "45.00",
      currentStreak: 0,
      weeklyDone: 0,
      nextWorkoutId: null,
      nextWorkoutTitle: null,
      message: null,
      assumptions: [],
    }));
  });

  it("renders summary and full at-risk list", async () => {
    renderPage();

    expect(await screen.findByRole("heading", { name: /Central de retenção/i })).toBeInTheDocument();
    expect(await screen.findByText("Maria Silva")).toBeInTheDocument();
    expect(screen.getByText("João Costa")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Alunos em risco/i })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { name: /Tendência de aderência/i }).length).toBeGreaterThan(0);
  });

  it("filters by risk level", async () => {
    renderPage();
    await screen.findByText("Maria Silva");

    await userEvent.click(screen.getByRole("button", { name: "Alto" }));
    expect(screen.getByText("Maria Silva")).toBeInTheDocument();
    expect(screen.queryByText("João Costa")).not.toBeInTheDocument();
  });

  it("shows positive state when no one at risk", async () => {
    vi.mocked(retentionApi.overview).mockResolvedValue({
      ...overviewBase,
      atRiskCount: 0,
    });
    vi.mocked(retentionApi.studentsAtRisk).mockResolvedValue([]);

    renderPage();

    expect(await screen.findByText(/Ninguém em risco/i)).toBeInTheDocument();
  });

  it("shows empty state without students", async () => {
    vi.mocked(retentionApi.overview).mockResolvedValue({
      ...overviewBase,
      activeStudents: 0,
      atRiskCount: 0,
    });
    vi.mocked(retentionApi.studentsAtRisk).mockResolvedValue([]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Você ainda não tem alunos/i)).toBeInTheDocument();
    });
  });
});
