import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider } from "@/components/ui/toast";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { changePassword } from "@/lib/api/auth-api";

vi.mock("@/lib/api/auth-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/auth-api")>();
  return {
    ...actual,
    changePassword: vi.fn(),
  };
});

describe("ChangePasswordForm", () => {
  beforeEach(() => {
    vi.mocked(changePassword).mockResolvedValue({ message: "Senha atualizada com sucesso." });
  });

  it("submits new password with current password", async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <ChangePasswordForm />
      </ToastProvider>,
    );

    await user.type(screen.getByLabelText(/senha atual/i), "senha12345");
    await user.type(screen.getByLabelText(/^nova senha$/i), "novaSenha123");
    await user.type(screen.getByLabelText(/confirmar nova senha/i), "novaSenha123");
    await user.click(screen.getByRole("button", { name: /atualizar senha/i }));

    await waitFor(() => {
      expect(changePassword).toHaveBeenCalledWith({
        currentPassword: "senha12345",
        newPassword: "novaSenha123",
      });
    });
  });

  it("skips current password when not required", async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <ChangePasswordForm requireCurrentPassword={false} submitLabel="Continuar" />
      </ToastProvider>,
    );

    expect(screen.queryByLabelText(/senha atual/i)).not.toBeInTheDocument();

    await user.type(screen.getByLabelText(/^nova senha$/i), "novaSenha123");
    await user.type(screen.getByLabelText(/confirmar nova senha/i), "novaSenha123");
    await user.click(screen.getByRole("button", { name: /continuar/i }));

    await waitFor(() => {
      expect(changePassword).toHaveBeenCalledWith({
        currentPassword: null,
        newPassword: "novaSenha123",
      });
    });
  });
});
