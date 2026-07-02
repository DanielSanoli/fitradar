import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
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
  spaceApi: { get: vi.fn(), update: vi.fn(), uploadLogo: vi.fn() },
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
    expect(screen.getByRole("link", { name: /^Voltar$/i })).toHaveAttribute("href", "/app");
    expect(screen.getByRole("link", { name: /FitRadar — voltar ao painel/i })).toHaveAttribute(
      "href",
      "/app",
    );
    expect(screen.getByText("Pré-visualização ao vivo")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: /Passos do construtor/i })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: /Área do espaço/i })).toBeInTheDocument();
  });

  it("persists selected area when saving draft", async () => {
    const user = userEvent.setup();
    renderBuilder();

    await waitFor(() => {
      expect(screen.getByLabelText(/Nome do espaço/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/Nome do espaço/i), "Studio Nutri");
    const areaGroup = screen.getByRole("group", { name: "Área do espaço" });
    await user.click(within(areaGroup).getByRole("button", { name: "Nutrição" }));
    await user.click(screen.getByRole("button", { name: /Salvar rascunho/i }));

    await waitFor(() => {
      expect(spaceApi.update).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Studio Nutri",
          category: "NUTRITION",
          modules: ["NUTRITION"],
        }),
      );
    });
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

  it("keeps full slug in sync while typing space name", async () => {
    const user = userEvent.setup();
    renderBuilder();

    await waitFor(() => {
      expect(screen.getByLabelText(/Nome do espaço/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/Nome do espaço/i), "teste");

    expect(screen.getByLabelText(/Endereço do link/i)).toHaveValue("teste");
    expect(screen.getByText(/Link completo:/i).textContent).toContain("/c/teste");
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
      category: "OTHER",
      modules: ["TRAINING"],
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
      category: "OTHER",
      modules: ["TRAINING"],
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
    expect(screen.getByLabelText(/Nome do aluno/i)).toBeInTheDocument();
  });

  it("requires student name before sending invite from onboarding", async () => {
    const user = userEvent.setup();
    vi.mocked(spaceApi.get).mockResolvedValue({
      id: "s1",
      creatorId: "c1",
      name: "Studio",
      slug: "studio",
      logoUrl: null,
      primaryColor: "#1ed7a6",
      bio: "Bio",
      category: "OTHER",
      modules: ["TRAINING"],
      createdAt: "2026-01-01",
    });
    vi.mocked(studentsApi.invite).mockResolvedValue({
      studentId: "st1",
      name: "Lucas Ferreira",
      email: "lucas@test.com",
      temporaryPassword: "temp123",
      emailSent: true,
    });

    renderBuilder();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Convidar aluno/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: /Convidar aluno/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/Nome do aluno/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/E-mail/i), "lucas@test.com");
    await user.click(screen.getByRole("button", { name: /Enviar convite/i }));

    await waitFor(() => {
      expect(screen.getByText("Informe o nome do aluno.")).toBeInTheDocument();
    });
    expect(studentsApi.invite).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText(/Nome do aluno/i), "Lucas Ferreira");
    await user.click(screen.getByRole("button", { name: /Enviar convite/i }));

    await waitFor(() => {
      expect(studentsApi.invite).toHaveBeenCalledWith({
        name: "Lucas Ferreira",
        email: "lucas@test.com",
      });
    });
    expect(screen.getByLabelText(/Nome do aluno/i)).toHaveValue("");
    expect(screen.getByLabelText(/E-mail/i)).toHaveValue("");
  });

  it("uploads logo file and persists returned url on save", async () => {
    const user = userEvent.setup();
    vi.mocked(spaceApi.uploadLogo).mockResolvedValue({
      logoUrl: "/uploads/logos/c1/logo.png",
    });

    renderBuilder();

    await waitFor(() => {
      expect(screen.getByLabelText(/Nome do espaço/i)).toBeInTheDocument();
    });

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["png"], "logo.png", { type: "image/png" });
    await user.upload(input, file);

    await waitFor(() => {
      expect(spaceApi.uploadLogo).toHaveBeenCalled();
    });

    await user.type(screen.getByLabelText(/Nome do espaço/i), "Studio Logo");
    await user.click(screen.getByRole("button", { name: /Salvar rascunho/i }));

    await waitFor(() => {
      expect(spaceApi.update).toHaveBeenCalledWith(
        expect.objectContaining({
          logoUrl: "/uploads/logos/c1/logo.png",
        }),
      );
    });
  });
});
