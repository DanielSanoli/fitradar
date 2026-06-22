import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { ToastProvider } from "@/components/ui/toast";
import { StudentProgressPage } from "@/features/student/StudentProgressPage";
import { memberApi } from "@/lib/api/member-api";
import { ApiError } from "@/lib/api/types";

vi.mock("@/lib/api/member-api", () => ({
  memberApi: {
    myProgress: vi.fn(),
    myGamification: vi.fn(),
    myCheckIns: vi.fn(),
  },
}));

describe("StudentProgressPage", () => {
  beforeEach(() => {
    vi.mocked(memberApi.myCheckIns).mockResolvedValue({
      content: [],
      page: 0,
      size: 100,
      totalElements: 0,
      totalPages: 0,
    });
  });

  it("renders progress when gamification fails", async () => {
    vi.mocked(memberApi.myProgress).mockResolvedValue({
      studentId: "1",
      studentName: "Lucas",
      enrolled: true,
      adherence: "80.00",
      currentStreak: 3,
      weeklyDone: 2,
      nextWorkoutId: null,
      nextWorkoutTitle: null,
      message: null,
      assumptions: [],
    });
    vi.mocked(memberApi.myGamification).mockRejectedValue(
      new ApiError(503, "Gamificação indisponível"),
    );

    render(
      <ToastProvider>
        <StudentProgressPage />
      </ToastProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Meu progresso")).toBeInTheDocument();
      expect(screen.getByText(/Conquistas temporariamente indisponíveis/i)).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
    });
  });
});
