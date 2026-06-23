import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ToastProvider } from "@/components/ui/toast";
import { CreatorSettingsPage } from "@/features/creator/CreatorSettingsPage";
import { AuthContext, type AuthContextValue } from "@/features/auth/AuthProvider";
import { userSettingsApi } from "@/lib/api/user-settings-api";

vi.mock("@/lib/api/user-settings-api", () => ({
  userSettingsApi: {
    get: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@/lib/billing/start-pro-checkout", () => ({
  startProCheckout: vi.fn(),
}));

vi.mock("@/lib/api/auth-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/auth-api")>();
  return {
    ...actual,
    requestPasswordReset: vi.fn().mockResolvedValue({ message: "Se o email existir, enviaremos instruções." }),
  };
});

const authValue: AuthContextValue = {
  user: {
    id: "c1",
    name: "Ana Costa",
    email: "ana@test.com",
    role: "CREATOR",
    creatorId: null,
    plan: "FREE",
    subscriptionStatus: "TRIALING",
    trialEndsAt: null,
    subscriptionEndsAt: null,
    emailVerified: true,
    accessAllowed: true,
    accessMessage: null,
    trialDaysRemaining: 12,
  },
  isLoading: false,
  isAuthenticated: true,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  refreshUser: vi.fn().mockResolvedValue(undefined),
};

function renderSettings() {
  return render(
    <ToastProvider>
      <AuthContext.Provider value={authValue}>
        <MemoryRouter>
          <CreatorSettingsPage />
        </MemoryRouter>
      </AuthContext.Provider>
    </ToastProvider>,
  );
}

describe("CreatorSettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(userSettingsApi.get).mockResolvedValue({
      userId: "c1",
      digestFrequency: "WEEKLY",
    });
  });

  it("renders account section by default", async () => {
    renderSettings();
    await waitFor(() => {
      expect(screen.getByText("Ana Costa")).toBeInTheDocument();
    });
    expect(screen.getAllByText("ana@test.com").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("button", { name: /Enviar link por e-mail/i })).toBeInTheDocument();
  });

  it("shows billing section with trial days", async () => {
    const user = userEvent.setup();
    renderSettings();
    await user.click(screen.getByRole("button", { name: "Assinatura" }));
    expect(screen.getByText("12 dias")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Assinar \/ gerenciar Pro/i })).toBeInTheDocument();
  });

  it("loads digest settings in notifications section", async () => {
    const user = userEvent.setup();
    renderSettings();
    await user.click(screen.getByRole("button", { name: "Notificações" }));
    await waitFor(() => {
      expect(userSettingsApi.get).toHaveBeenCalled();
      expect(screen.getByText("Semanal")).toBeInTheDocument();
    });
  });

  it("links to space builder", async () => {
    const user = userEvent.setup();
    renderSettings();
    await user.click(screen.getByRole("button", { name: "Meu espaço" }));
    expect(screen.getByRole("link", { name: /Construtor do Espaço/i })).toHaveAttribute(
      "href",
      "/app/space",
    );
  });
});
