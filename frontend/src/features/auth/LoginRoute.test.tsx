import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { LoginRoute } from "@/features/auth/LoginRoute";
import { AuthContext, type AuthContextValue } from "@/features/auth/AuthProvider";

const authValue: AuthContextValue = {
  user: null,
  isLoading: false,
  isAuthenticated: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  refreshUser: vi.fn(),
};

function renderLoginRoute(initialEntry = "/login") {
  return render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/login" element={<LoginRoute />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe("LoginRoute", () => {
  it("shows forgot password link on login", () => {
    renderLoginRoute();
    expect(screen.getByRole("link", { name: /Esqueci minha senha/i })).toHaveAttribute(
      "href",
      "/forgot-password",
    );
  });

  it("shows reset form when reset query param is present", () => {
    renderLoginRoute("/login?reset=token-xyz");
    expect(screen.getByRole("heading", { name: /Nova senha/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Nova senha$/i)).toBeInTheDocument();
  });
});
