import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { LoginPage } from "@/features/auth/LoginPage";
import { AuthContext, type AuthContextValue } from "@/features/auth/AuthProvider";

function renderLogin() {
  const login = vi.fn().mockResolvedValue(undefined);
  const value: AuthContextValue = {
    user: null,
    isLoading: false,
    isAuthenticated: false,
    login,
    register: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
  };

  render(
    <AuthContext.Provider value={value}>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </AuthContext.Provider>,
  );

  return { login };
}

describe("LoginPage", () => {
  it("renders accessible form fields", () => {
    renderLogin();
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /entrar/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Esqueci minha senha/i })).toHaveAttribute(
      "href",
      "/forgot-password",
    );
  });

  it("submits credentials", async () => {
    const user = userEvent.setup();
    const { login } = renderLogin();
    await user.type(screen.getByLabelText(/e-mail/i), "a@test.com");
    await user.type(screen.getByLabelText(/senha/i), "secret123");
    await user.click(screen.getByRole("button", { name: /entrar/i }));
    expect(login).toHaveBeenCalledWith({ email: "a@test.com", password: "secret123" });
  });
});
