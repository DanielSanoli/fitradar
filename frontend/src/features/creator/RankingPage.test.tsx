import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ToastProvider } from "@/components/ui/toast";
import { RankingPage } from "@/features/creator/RankingPage";
import { retentionApi } from "@/lib/api/retention-api";

vi.mock("@/lib/api/retention-api", () => ({
  retentionApi: {
    ranking: vi.fn(),
  },
}));

vi.mock("@/lib/api/space-api", () => ({
  spaceApi: {
    get: vi.fn().mockResolvedValue({ slug: "ana" }),
  },
}));

const sampleRanking = {
  metric: "ADHERENCE" as const,
  period: "WEEK" as const,
  entries: [
    { rank: 1, studentId: "s1", studentName: "Maria Silva", value: "92.50" },
    { rank: 2, studentId: "s2", studentName: "João Costa", value: "78.00" },
    { rank: 3, studentId: "s3", studentName: "Ana Lima", value: "65.00" },
    { rank: 4, studentId: "s4", studentName: "Pedro Souza", value: "50.00" },
  ],
  assumptions: ["Ranking por aderência"],
};

function renderPage() {
  return render(
    <ToastProvider>
      <MemoryRouter>
        <RankingPage />
      </MemoryRouter>
    </ToastProvider>,
  );
}

describe("RankingPage", () => {
  beforeEach(() => {
    vi.mocked(retentionApi.ranking).mockResolvedValue(sampleRanking);
  });

  it("renders podium and ranked list", async () => {
    renderPage();

    expect(await screen.findByRole("heading", { name: /Ranking/i })).toBeInTheDocument();
    expect(screen.getByText("Maria Silva")).toBeInTheDocument();
    expect(screen.getByText("Pedro Souza")).toBeInTheDocument();
    expect(screen.getByLabelText(/Pódio do ranking/i)).toBeInTheDocument();
  });

  it("switches metric to streak", async () => {
    renderPage();
    await screen.findByText("Maria Silva");

    vi.mocked(retentionApi.ranking).mockResolvedValue({
      ...sampleRanking,
      metric: "STREAK",
      entries: [{ rank: 1, studentId: "s1", studentName: "Maria Silva", value: "7" }],
    });

    await userEvent.click(screen.getByRole("button", { name: /Streak/i }));

    await waitFor(() => {
      expect(retentionApi.ranking).toHaveBeenCalledWith("STREAK", "WEEK");
    });
  });

  it("shows empty state without students", async () => {
    vi.mocked(retentionApi.ranking).mockResolvedValue({
      metric: "ADHERENCE",
      period: "WEEK",
      entries: [],
      assumptions: [],
    });

    renderPage();

    expect(await screen.findByText(/Ainda não há ranking/i)).toBeInTheDocument();
  });
});
