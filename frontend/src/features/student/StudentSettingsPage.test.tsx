import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ToastProvider } from "@/components/ui/toast";
import { StudentSettingsPage } from "@/features/student/StudentSettingsPage";
import { AuthContext, type AuthContextValue } from "@/features/auth/AuthProvider";
import { pushApi } from "@/lib/api/push-api";
import { pwaStorage } from "@/lib/pwa/push-utils";

vi.mock("@/lib/api/auth-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/auth-api")>();
  return {
    ...actual,
    updateProfile: vi.fn(),
    changePassword: vi.fn(),
    resendVerificationEmail: vi.fn().mockResolvedValue({
      message: "Enviamos um novo link de verificação para seu e-mail.",
    }),
  };
});

vi.mock("@/lib/api/push-api", () => ({
  pushApi: {
    config: vi.fn(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    test: vi.fn(),
  },
}));

vi.mock("@/lib/pwa/push-utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/pwa/push-utils")>();
  return {
    ...actual,
    subscribeToPush: vi.fn(),
    unsubscribePushLocally: vi.fn(),
    pwaStorage: {
      ...actual.pwaStorage,
      isPushEnabled: vi.fn(),
      setPushEnabled: vi.fn(),
    },
  };
});

const logout = vi.fn();
const refreshUser = vi.fn().mockResolvedValue(undefined);

const authValue: AuthContextValue = {
  user: {
    id: "s1",
    name: "Lucas Alves",
    email: "lucas@test.com",
    role: "STUDENT",
    creatorId: "c1",
    plan: "FREE",
    subscriptionStatus: "ACTIVE",
    trialEndsAt: null,
    subscriptionEndsAt: null,
    emailVerified: true,
    accessAllowed: true,
    accessMessage: null,
    trialDaysRemaining: 0,
    mustChangePassword: false,
  },
  isLoading: false,
  isAuthenticated: true,
  login: vi.fn(),
  register: vi.fn(),
  logout,
  refreshUser,
};

function renderSettings() {
  return render(
    <ToastProvider>
      <AuthContext.Provider value={authValue}>
        <MemoryRouter>
          <StudentSettingsPage />
        </MemoryRouter>
      </AuthContext.Provider>
    </ToastProvider>,
  );
}

describe("StudentSettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(pwaStorage.isPushEnabled).mockReturnValue(false);
    vi.mocked(pushApi.config).mockResolvedValue({ enabled: true, publicKey: "test-key" });
    vi.mocked(pushApi.subscribe).mockResolvedValue({ message: "ok" });
    vi.mocked(pushApi.unsubscribe).mockResolvedValue({ message: "ok" });
    vi.stubGlobal("Notification", {
      permission: "granted",
      requestPermission: vi.fn().mockResolvedValue("granted"),
    });
  });

  it("renders account, notifications, logout and privacy sections", async () => {
    renderSettings();

    await waitFor(() => {
      expect(screen.getByDisplayValue("Lucas Alves")).toBeInTheDocument();
    });
    expect(screen.getByRole("heading", { name: "Conta" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Notificações" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Sessão" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Privacidade e dados" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Exportar meus dados/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Termos de Uso/i })).toHaveAttribute("href", "/terms.html");
    expect(screen.getByRole("link", { name: /Política de Privacidade/i })).toHaveAttribute(
      "href",
      "/privacy.html",
    );
    expect(screen.getByRole("button", { name: /salvar perfil/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /atualizar senha/i })).toBeInTheDocument();
    expect(screen.getByText("Verificado")).toBeInTheDocument();
  });

  it("calls subscribe when push switch is turned on", async () => {
    const { subscribeToPush } = await import("@/lib/pwa/push-utils");
    vi.mocked(subscribeToPush).mockResolvedValue({
      endpoint: "https://push.example",
      toJSON: () => ({ endpoint: "https://push.example", keys: { p256dh: "a", auth: "b" } }),
    } as unknown as PushSubscription);

    const user = userEvent.setup();
    renderSettings();

    await waitFor(() => {
      expect(screen.getByDisplayValue("Lucas Alves")).toBeInTheDocument();
    });
    expect(screen.getByRole("heading", { name: "Conta" })).toBeInTheDocument();

    await user.click(screen.getByRole("switch", { name: /Lembretes de treino/i }));

    await waitFor(() => {
      expect(pushApi.subscribe).toHaveBeenCalled();
      expect(pwaStorage.setPushEnabled).toHaveBeenCalledWith(true);
    });
  });

  it("calls unsubscribe when push switch is turned off", async () => {
    vi.mocked(pwaStorage.isPushEnabled).mockReturnValue(true);
    const { unsubscribePushLocally } = await import("@/lib/pwa/push-utils");

    const user = userEvent.setup();
    renderSettings();

    await waitFor(() => {
      expect(screen.getByDisplayValue("Lucas Alves")).toBeInTheDocument();
    });
    expect(screen.getByRole("heading", { name: "Conta" })).toBeInTheDocument();

    await user.click(screen.getByRole("switch", { name: /Lembretes de treino/i }));

    await waitFor(() => {
      expect(pushApi.unsubscribe).toHaveBeenCalled();
      expect(unsubscribePushLocally).toHaveBeenCalled();
      expect(pwaStorage.setPushEnabled).toHaveBeenCalledWith(false);
    });
  });

  it("logs out when Sair is clicked", async () => {
    const user = userEvent.setup();
    renderSettings();

    await waitFor(() => {
      expect(screen.getByDisplayValue("Lucas Alves")).toBeInTheDocument();
    });
    expect(screen.getByRole("heading", { name: "Conta" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^Sair$/i }));
    expect(logout).toHaveBeenCalled();
  });

  it("shows profile edit fields for the logged-in user", async () => {
    renderSettings();

    await waitFor(() => {
      expect(screen.getByLabelText(/^nome$/i)).toHaveValue("Lucas Alves");
      expect(screen.getByLabelText(/^e-mail$/i)).toHaveValue("lucas@test.com");
    });
  });
});
