import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { ProgramsListPage } from "@/features/creator/ProgramsPage";
import { programsApi } from "@/lib/api/programs-api";
import { studentsApi } from "@/lib/api/students-api";

vi.mock("@/lib/api/programs-api");
vi.mock("@/lib/api/students-api");

describe("ProgramsListPage", () => {
  beforeEach(() => {
    vi.mocked(programsApi.list).mockResolvedValue([
      {
        id: "p1",
        creatorId: "c1",
        title: "Base de Força",
        description: "Programa introdutório",
        active: true,
        price: null,
        paid: false,
        workoutCount: 3,
        createdAt: "2026-01-01",
      },
    ]);
    vi.mocked(studentsApi.list).mockResolvedValue({
      content: [{ id: "s1", name: "Ana", email: "a@test.com", emailVerified: true, mustChangePassword: false, createdAt: "2026-01-01" }],
      page: 0,
      size: 200,
      totalElements: 1,
      totalPages: 1,
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
  });

  it("renders program cards with workout and enrollment counts", async () => {
    render(
      <MemoryRouter>
        <ProgramsListPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Base de Força")).toBeInTheDocument();
    });

    expect(screen.getByText("3 treinos")).toBeInTheDocument();
    expect(screen.getByText("1 alunos")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Abrir" })).toHaveAttribute("href", "/app/programs/p1");
  });

  it("shows empty library state", async () => {
    vi.mocked(programsApi.list).mockResolvedValue([]);

    render(
      <MemoryRouter>
        <ProgramsListPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Crie seu primeiro programa")).toBeInTheDocument();
    });
  });
});
