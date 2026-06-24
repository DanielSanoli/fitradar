import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ForgotPasswordPage } from "@/features/auth/ForgotPasswordPage";
import { requestPasswordReset } from "@/lib/api/auth-api";
import { FORGOT_PASSWORD_CONFIRMATION } from "@/lib/auth/password-reset-copy";

vi.mock("@/lib/api/auth-api", () => ({
  requestPasswordReset: vi.fn(),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <ForgotPasswordPage />
    </MemoryRouter>,
  );
}

describe("ForgotPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requestPasswordReset).mockResolvedValue({ message: "ok" });
  });

  it("shows generic confirmation after submit without revealing account existence", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/e-mail/i), "unknown@test.com");
    await user.click(screen.getByRole("button", { name: /enviar link/i }));

    await waitFor(() => {
      expect(requestPasswordReset).toHaveBeenCalledWith("unknown@test.com");
      expect(screen.getByText(FORGOT_PASSWORD_CONFIRMATION)).toBeInTheDocument();
    });
  });
});
