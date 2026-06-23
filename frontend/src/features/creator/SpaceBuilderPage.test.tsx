import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ToastProvider } from "@/components/ui/toast";
import { SpaceBuilderPage } from "@/features/creator/SpaceBuilderPage";
import { AuthContext, type AuthContextValue } from "@/features/auth/AuthProvider";
import { spaceApi } from "@/lib/api/space-api";
import { programsApi } from "@/lib/api/programs-api";
import { studentsApi } from "@/lib/api/students-api";
import { ApiError } from "@/lib/api/types";

vi.mock("@/lib/api/space-api", () => ({
  spaceApi: { get: vi.fn(), update: vi.fn() },
}));

vi.mock("@/lib/api/programs-api", () => ({
  programsApi: { list: vi.fn(), create: vi.fn(), update: vi.fn() },
}));

vi.mock("@/lib/api/students-api", () => ({
  studentsApi: { list: vi.fn(), invite: vi.fn() },
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

function renderBuilder() {
  return render(
    <AuthContext.Provider value={authValue}>
      <ToastProvider>
        <MemoryRouter>
          <SpaceBuilderPage />
        </MemoryRouter>
      </ToastProvider>
    </AuthContext.Provider>,
  );
}

describe("SpaceBuilderPage", () => {
  beforeEach(() => {
    vi.mocked(spaceApi.get).mockRejectedValue(new ApiError(404, "Espaço não encontrado"));
    vi.mocked(programsApi.list).mockResolvedValue([]);
    vi.mocked(studentsApi.list).mockResolvedValue({
      content: [],
      page: 0,
      size: 1,
      totalElements: 0,
      totalPages: 0,
    });
  });

  it("renders step 1 identity form and live preview", async () => {
    renderBuilder();

    await waitFor(() => {
      expect(screen.getByText("A identidade do seu espaço")).toBeInTheDocument();
    });
    expect(screen.getByText("Pré-visualização ao vivo")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: /Passos do construtor/i })).toBeInTheDocument();
  });

  it("updates preview when typing space name", async () => {
    const user = userEvent.setup();
    renderBuilder();

    await waitFor(() => {
      expect(screen.getByLabelText(/Nome do espaço/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/Nome do espaço/i), "Studio Teste");

    expect(screen.getAllByText("Studio Teste").length).toBeGreaterThan(0);
  });

  it("shows invite step with copy link", async () => {
    const user = userEvent.setup();
    vi.mocked(spaceApi.get).mockResolvedValue({
      id: "s1",
      creatorId: "c1",
      name: "Studio",
      slug: "studio",
      logoUrl: null,
      primaryColor: "#1ed7a6",
      bio: "Bio",
      createdAt: "2026-01-01",
    });
    vi.mocked(spaceApi.update).mockResolvedValue({
      id: "s1",
      creatorId: "c1",
      name: "Studio",
      slug: "studio",
      logoUrl: null,
      primaryColor: "#1ed7a6",
      bio: "Bio",
      createdAt: "2026-01-01",
    });

    renderBuilder();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Convidar aluno/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /Convidar aluno/i }));

    await waitFor(() => {
      expect(screen.getByText("Convide seu primeiro aluno")).toBeInTheDocument();
    });
    expect(screen.getAllByRole("button", { name: /Copiar link/i }).length).toBeGreaterThanOrEqual(1);
  });
});
