import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { StudentCheckInHistoryPage } from "@/features/student/StudentCheckInHistoryPage";
import { memberApi } from "@/lib/api/member-api";

vi.mock("@/lib/api/member-api", () => ({
  memberApi: {
    myWorkouts: vi.fn(),
    myCheckIns: vi.fn(),
  },
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <StudentCheckInHistoryPage />
    </MemoryRouter>,
  );
}

describe("StudentCheckInHistoryPage", () => {
  beforeEach(() => {
    vi.mocked(memberApi.myWorkouts).mockResolvedValue([
      {
        id: "w1",
        programId: "p1",
        title: "Upper Body",
        description: null,
        dayIndex: 0,
        contentMarkdown: null,
        createdAt: "2024-01-01T00:00:00Z",
      },
    ]);
  });

  it("lists paginated check-ins with feeling and notes", async () => {
    vi.mocked(memberApi.myCheckIns).mockResolvedValue({
      content: [
        {
          id: "c1",
          studentId: "s1",
          workoutId: "w1",
          date: "2026-06-18",
          status: "DONE",
          feeling: 4,
          notes: "Treino pesado mas bom",
        },
      ],
      page: 0,
      size: 15,
      totalElements: 1,
      totalPages: 1,
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Upper Body")).toBeInTheDocument();
      expect(screen.getByText(/4\/5 · Bem/i)).toBeInTheDocument();
      expect(screen.getByText("Treino pesado mas bom")).toBeInTheDocument();
    });
  });

  it("loads more check-ins on demand", async () => {
    vi.mocked(memberApi.myCheckIns)
      .mockResolvedValueOnce({
        content: [
          {
            id: "c1",
            studentId: "s1",
            workoutId: "w1",
            date: "2026-06-18",
            status: "DONE",
            feeling: null,
            notes: null,
          },
        ],
        page: 0,
        size: 15,
        totalElements: 2,
        totalPages: 2,
      })
      .mockResolvedValueOnce({
        content: [
          {
            id: "c2",
            studentId: "s1",
            workoutId: "w1",
            date: "2026-06-17",
            status: "SKIPPED",
            feeling: null,
            notes: null,
          },
        ],
        page: 1,
        size: 15,
        totalElements: 2,
        totalPages: 2,
      });

    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /carregar mais/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /carregar mais/i }));

    await waitFor(() => {
      expect(memberApi.myCheckIns).toHaveBeenCalledWith(1, 15);
      expect(screen.getByText("Pulado")).toBeInTheDocument();
    });
  });
});
