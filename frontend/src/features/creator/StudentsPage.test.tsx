import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { StudentsPage } from "@/features/creator/StudentsPage";
import { gamificationApi } from "@/lib/api/gamification-api";
import { retentionApi } from "@/lib/api/retention-api";
import { spaceApi } from "@/lib/api/space-api";
import { studentsApi } from "@/lib/api/students-api";
import { ToastProvider } from "@/components/ui/toast";

vi.mock("@/lib/api/students-api");
vi.mock("@/lib/api/retention-api");
vi.mock("@/lib/api/gamification-api");
vi.mock("@/lib/api/space-api");

function renderPage() {
  return render(
    <ToastProvider>
      <MemoryRouter>
        <StudentsPage />
      </MemoryRouter>
    </ToastProvider>,
  );
}

describe("StudentsPage", () => {
  beforeEach(() => {
    vi.mocked(studentsApi.list).mockResolvedValue({
      content: [
        {
          id: "s1",
          name: "Lucas Ferreira",
          email: "lucas@test.com",
          emailVerified: true,
          createdAt: "2026-06-17T00:00:00Z",
        },
      ],
      page: 0,
      size: 50,
      totalElements: 1,
      totalPages: 1,
    });
    vi.mocked(retentionApi.studentsAtRisk).mockResolvedValue([]);
    vi.mocked(retentionApi.studentProgress).mockResolvedValue({
      studentId: "s1",
      studentName: "Lucas Ferreira",
      enrolled: true,
      adherence: "72.00",
      currentStreak: 3,
      weeklyDone: 2,
      nextWorkoutId: null,
      nextWorkoutTitle: null,
      message: null,
      assumptions: [],
    });
    vi.mocked(retentionApi.studentRisk).mockResolvedValue({
      studentId: "s1",
      studentName: "Lucas Ferreira",
      score: 10,
      level: "LOW",
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
        studentName: "Lucas Ferreira",
        currentStreak: 3,
        totalCheckInsDone: 12,
      },
    ]);
    vi.mocked(spaceApi.get).mockResolvedValue({
      id: "sp1",
      creatorId: "c1",
      name: "Studio",
      slug: "studio",
      logoUrl: null,
      primaryColor: "#1ed7a6",
      bio: null,
      category: "OTHER",
      createdAt: "2026-01-01",
    });
  });

  it("renders student list with search and metrics", async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Lucas Ferreira")).toBeInTheDocument();
    });

    expect(screen.getByLabelText("Buscar aluno ou programa")).toBeInTheDocument();
    expect(screen.getByText("Base de Força")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Ver detalhes de Lucas Ferreira/i })).toHaveAttribute(
      "href",
      "/app/students/s1",
    );
  });

  it("shows empty state when no students", async () => {
    vi.mocked(studentsApi.list).mockResolvedValue({
      content: [],
      page: 0,
      size: 50,
      totalElements: 0,
      totalPages: 0,
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Seu espaço está esperando")).toBeInTheDocument();
    });
  });

  it("filters students by search query", async () => {
    vi.mocked(studentsApi.list).mockResolvedValue({
      content: [
        {
          id: "s1",
          name: "Lucas Ferreira",
          email: "l@test.com",
          emailVerified: true,
          createdAt: "2026-06-01T00:00:00Z",
        },
        {
          id: "s2",
          name: "Ana Prado",
          email: "a@test.com",
          emailVerified: true,
          createdAt: "2026-06-01T00:00:00Z",
        },
      ],
      page: 0,
      size: 50,
      totalElements: 2,
      totalPages: 1,
    });
    vi.mocked(studentsApi.enrollments).mockImplementation(async (id) =>
      id === "s1"
        ? [
            {
              id: "e1",
              studentId: "s1",
              programId: "p1",
              programTitle: "Base de Força",
              startDate: null,
              active: true,
            },
          ]
        : [
            {
              id: "e2",
              studentId: "s2",
              programId: "p2",
              programTitle: "Mobilidade",
              startDate: null,
              active: true,
            },
          ],
    );

    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Ana Prado")).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText("Buscar aluno ou programa"), "Ana");

    await waitFor(() => {
      expect(screen.queryByText("Lucas Ferreira")).not.toBeInTheDocument();
      expect(screen.getByText("Ana Prado")).toBeInTheDocument();
    });
  });
});
