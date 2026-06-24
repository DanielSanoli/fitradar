import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ResetPasswordPage } from "@/features/auth/ResetPasswordPage";
import { resetPassword } from "@/lib/api/auth-api";
import { ApiError } from "@/lib/api/types";

vi.mock("@/lib/api/auth-api", () => ({
  resetPassword: vi.fn(),
}));

describe("ResetPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls reset API with token and new password", async () => {
    vi.mocked(resetPassword).mockResolvedValue({ message: "Senha atualizada com sucesso." });
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <ResetPasswordPage token="abc123" />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(/^Nova senha$/i), "novaSenha123");
    await user.type(screen.getByLabelText(/Confirmar senha/i), "novaSenha123");
    await user.click(screen.getByRole("button", { name: /salvar nova senha/i }));

    await waitFor(() => {
      expect(resetPassword).toHaveBeenCalledWith("abc123", "novaSenha123");
    });
  });

  it("shows error for invalid token", async () => {
    vi.mocked(resetPassword).mockRejectedValue(new ApiError(400, "Token de recuperação inválido"));
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <ResetPasswordPage token="bad-token" />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(/^Nova senha$/i), "novaSenha123");
    await user.type(screen.getByLabelText(/Confirmar senha/i), "novaSenha123");
    await user.click(screen.getByRole("button", { name: /salvar nova senha/i }));

    expect(await screen.findByText(/Token de recuperação inválido/i)).toBeInTheDocument();
  });
});
