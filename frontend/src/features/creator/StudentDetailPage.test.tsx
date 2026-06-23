import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { StudentDetailPage } from "@/features/creator/StudentDetailPage";
import { copilotApi } from "@/lib/api/copilot-api";
import { gamificationApi } from "@/lib/api/gamification-api";
import { retentionApi } from "@/lib/api/retention-api";
import { studentsApi } from "@/lib/api/students-api";
import { ToastProvider } from "@/components/ui/toast";

vi.mock("@/lib/api/students-api");
vi.mock("@/lib/api/retention-api");
vi.mock("@/lib/api/gamification-api");
vi.mock("@/lib/api/copilot-api");

function renderDetail(id = "s1") {
  return render(
    <ToastProvider>
      <MemoryRouter initialEntries={[`/app/students/${id}`]}>
        <Routes>
          <Route path="/app/students/:id" element={<StudentDetailPage />} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>,
  );
}

describe("StudentDetailPage", () => {
  beforeEach(() => {
    vi.mocked(studentsApi.get).mockResolvedValue({
      id: "s1",
      name: "Marcos Vieira",
      email: "marcos@test.com",
      emailVerified: true,
      createdAt: "2026-04-01T00:00:00Z",
    });
    vi.mocked(retentionApi.studentRisk).mockResolvedValue({
      studentId: "s1",
      studentName: "Marcos Vieira",
      score: 80,
      level: "HIGH",
      assumptions: ["Inativo há 9 dias consecutivos"],
    });
    vi.mocked(retentionApi.studentProgress).mockResolvedValue({
      studentId: "s1",
      studentName: "Marcos Vieira",
      enrolled: true,
      adherence: "38.00",
      currentStreak: 0,
      weeklyDone: 0,
      nextWorkoutId: null,
      nextWorkoutTitle: null,
      message: null,
      assumptions: [],
    });
    vi.mocked(studentsApi.enrollments).mockResolvedValue([
      {
        id: "e1",
        studentId: "s1",
        programId: "p1",
        programTitle: "Base de Força",
        startDate: "2026-01-01",
        active: true,
      },
    ]);
    vi.mocked(gamificationApi.leaderboard).mockResolvedValue([
      {
        rank: 1,
        studentId: "s1",
        studentName: "Marcos Vieira",
        currentStreak: 0,
        totalCheckInsDone: 14,
      },
    ]);
    vi.mocked(copilotApi.nudge).mockResolvedValue({
      studentId: "s1",
      studentName: "Marcos Vieira",
      message: "Oi, Marcos! Notei que faz um tempo sem treinar.",
      assumptions: [],
    });
  });

  it("shows student detail with risk panel and nudge preview", async () => {
    renderDetail();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Marcos Vieira" })).toBeInTheDocument();
    });

    expect(screen.getByText("Motivos do alerta do Radar")).toBeInTheDocument();
    expect(screen.getByText("Inativo há 9 dias consecutivos")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/Oi, Marcos!/)).toBeInTheDocument();
    });
  });

  it("shows empty check-in state for new student", async () => {
    vi.mocked(gamificationApi.leaderboard).mockResolvedValue([
      {
        rank: 1,
        studentId: "s1",
        studentName: "Marcos Vieira",
        currentStreak: 0,
        totalCheckInsDone: 0,
      },
    ]);

    renderDetail();

    await waitFor(() => {
      expect(screen.getByText("Sem check-ins ainda")).toBeInTheDocument();
    });
    expect(screen.getByText("Novo")).toBeInTheDocument();
  });
});
