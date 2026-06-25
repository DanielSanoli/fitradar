import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RegisterPage } from "@/features/auth/RegisterPage";
import { AuthContext, type AuthContextValue } from "@/features/auth/AuthProvider";
import { MemoryRouter } from "react-router-dom";

const register = vi.fn();

const authValue: AuthContextValue = {
  user: null,
  isLoading: false,
  isAuthenticated: false,
  login: vi.fn(),
  register,
  logout: vi.fn(),
  refreshUser: vi.fn(),
};

function renderRegister() {
  return render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe("RegisterPage", () => {
  it("requires terms acceptance before submit", async () => {
    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByLabelText("Nome"), "Ana");
    await user.type(screen.getByLabelText("E-mail"), "ana@test.com");
    await user.type(screen.getByLabelText("Senha"), "senha12345");

    expect(screen.getByRole("button", { name: /Criar conta/i })).toBeDisabled();
    expect(register).not.toHaveBeenCalled();
  });

  it("submits with acceptedTerms when checkbox is checked", async () => {
    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByLabelText("Nome"), "Ana");
    await user.type(screen.getByLabelText("E-mail"), "ana@test.com");
    await user.type(screen.getByLabelText("Senha"), "senha12345");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /Criar conta/i }));

    expect(register).toHaveBeenCalledWith({
      name: "Ana",
      email: "ana@test.com",
      password: "senha12345",
      acceptedTerms: true,
    });
  });
});
