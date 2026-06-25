import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ToastProvider } from "@/components/ui/toast";
import { CreatorSettingsPage } from "@/features/creator/CreatorSettingsPage";
import { AuthContext, type AuthContextValue } from "@/features/auth/AuthProvider";
import { billingApi } from "@/lib/api/billing-api";
import { userSettingsApi } from "@/lib/api/user-settings-api";
import { resendVerificationEmail } from "@/lib/api/auth-api";

vi.mock("@/lib/api/user-settings-api", () => ({
  userSettingsApi: {
    get: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@/lib/api/billing-api", () => ({
  billingApi: {
    subscriptionDetails: vi.fn(),
    subscriptionInvoices: vi.fn(),
    cancelSubscription: vi.fn(),
    checkoutPro: vi.fn(),
    reactivateSubscription: vi.fn(),
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
    resendVerificationEmail: vi.fn().mockResolvedValue({
      message: "Enviamos um novo link de verificação para seu e-mail.",
    }),
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
    vi.mocked(billingApi.subscriptionDetails).mockResolvedValue({
      plan: "FREE",
      status: "TRIALING",
      subscriptionEndsAt: null,
      trialEndsAt: null,
      trialDaysRemaining: 12,
      asaasConfigured: true,
      canCancel: false,
      canReactivate: true,
      message: null,
    });
    vi.mocked(billingApi.subscriptionInvoices).mockResolvedValue([]);
  });

  it("renders account section by default", async () => {
    renderSettings();
    await waitFor(() => {
      expect(screen.getByDisplayValue("Ana Costa")).toBeInTheDocument();
    });
    expect(screen.getByDisplayValue("ana@test.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /atualizar senha/i })).toBeInTheDocument();
    expect(screen.getByText("Verificado")).toBeInTheDocument();
  });

  it("shows resend verification when email is pending", async () => {
    const pendingAuth: AuthContextValue = {
      ...authValue,
      user: authValue.user ? { ...authValue.user, emailVerified: false } : null,
    };
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <AuthContext.Provider value={pendingAuth}>
          <MemoryRouter>
            <CreatorSettingsPage />
          </MemoryRouter>
        </AuthContext.Provider>
      </ToastProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Pendente")).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: /Reenviar verificação/i }));
    await waitFor(() => {
      expect(resendVerificationEmail).toHaveBeenCalled();
    });
  });

  it("shows billing section with trial days", async () => {
    const user = userEvent.setup();
    renderSettings();
    await user.click(screen.getByRole("button", { name: "Assinatura" }));
    await waitFor(() => {
      expect(billingApi.subscriptionDetails).toHaveBeenCalled();
      expect(screen.getByText("12 dias")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /Assinar Pro/i })).toBeInTheDocument();
  });

  it("shows cancel button for active Pro subscription", async () => {
    vi.mocked(billingApi.subscriptionDetails).mockResolvedValue({
      plan: "PRO",
      status: "ACTIVE",
      subscriptionEndsAt: "2026-07-19T12:00:00",
      trialEndsAt: null,
      trialDaysRemaining: 0,
      asaasConfigured: true,
      canCancel: true,
      canReactivate: false,
      message: "Cancelamento via Asaas — o acesso Pro encerra conforme o ciclo da assinatura.",
    });
    vi.mocked(billingApi.subscriptionInvoices).mockResolvedValue([
      {
        id: "pay_1",
        status: "CONFIRMED",
        value: "97.00",
        dueDate: "2026-06-19",
        paymentDate: "2026-06-19",
        invoiceUrl: "https://sandbox.asaas.com/i/pay_1",
      },
    ]);

    const user = userEvent.setup();
    renderSettings();
    await user.click(screen.getByRole("button", { name: "Assinatura" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Cancelar assinatura/i })).toBeInTheDocument();
      expect(screen.getByText("Faturas recentes")).toBeInTheDocument();
      expect(screen.getByText("R$ 97,00")).toBeInTheDocument();
    });
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
