import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { VerifyEmailPage } from "@/features/auth/VerifyEmailPage";
import { AuthContext, type AuthContextValue } from "@/features/auth/AuthProvider";
import { verifyEmail } from "@/lib/api/auth-api";

vi.mock("@/lib/api/auth-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/auth-api")>();
  return {
    ...actual,
    verifyEmail: vi.fn(),
  };
});

const refreshUser = vi.fn().mockResolvedValue(undefined);

const authValue: AuthContextValue = {
  user: null,
  isLoading: false,
  isAuthenticated: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  refreshUser,
};

function renderVerify(token = "abc123") {
  return render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter>
        <VerifyEmailPage token={token} />
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe("VerifyEmailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls verify endpoint and shows success", async () => {
    vi.mocked(verifyEmail).mockResolvedValue({ message: "Email verificado com sucesso." });
    renderVerify();

    await waitFor(() => {
      expect(verifyEmail).toHaveBeenCalledWith("abc123");
      expect(screen.getByText(/Email verificado com sucesso/i)).toBeInTheDocument();
    });
    expect(screen.getByRole("link", { name: /Ir para o login/i })).toBeInTheDocument();
  });

  it("shows error for invalid token", async () => {
    vi.mocked(verifyEmail).mockRejectedValue(new Error("Token de verificação inválido"));
    renderVerify("bad");

    expect(await screen.findByText(/Token de verificação inválido/i)).toBeInTheDocument();
  });
});
