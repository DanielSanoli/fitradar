import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { ProgramsListPage } from "@/features/creator/ProgramsPage";
import { onboardingApi } from "@/lib/api/onboarding-api";
import { programsApi } from "@/lib/api/programs-api";
import { studentsApi } from "@/lib/api/students-api";

vi.mock("@/lib/api/programs-api");
vi.mock("@/lib/api/students-api");
vi.mock("@/lib/api/onboarding-api", () => ({
  onboardingApi: {
    status: vi.fn(),
  },
}));

describe("ProgramsListPage space guard", () => {
  beforeEach(() => {
    vi.mocked(onboardingApi.status).mockResolvedValue({
      hasSpace: false,
      hasProgram: false,
      hasStudent: false,
      demoAvailable: false,
      onboardingComplete: false,
    });
    vi.mocked(programsApi.list).mockResolvedValue([]);
    vi.mocked(studentsApi.list).mockResolvedValue({
      content: [],
      page: 0,
      size: 200,
      totalElements: 0,
      totalPages: 0,
    });
  });

  it("shows space-first prompt instead of create actions when creator has no space", async () => {
    render(
      <MemoryRouter>
        <ProgramsListPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Crie seu espaço primeiro")).toBeInTheDocument();
    });

    expect(screen.getAllByRole("link", { name: /Space Builder/i })[0]).toHaveAttribute("href", "/app/space");
    expect(screen.queryByRole("button", { name: /Criar programa/i })).toBeDisabled();
  });
});
