import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider } from "@/components/ui/toast";
import { EmailVerificationSection } from "@/components/auth/EmailVerificationSection";
import { resendVerificationEmail } from "@/lib/api/auth-api";

vi.mock("@/lib/api/auth-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/auth-api")>();
  return {
    ...actual,
    resendVerificationEmail: vi.fn(),
  };
});

describe("EmailVerificationSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(resendVerificationEmail).mockResolvedValue({
      message: "Enviamos um novo link de verificação para seu e-mail.",
    });
  });

  it("shows verified badge when email is verified", () => {
    render(
      <ToastProvider>
        <EmailVerificationSection emailVerified email="ana@test.com" />
      </ToastProvider>,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Verificado");
    expect(screen.queryByRole("button", { name: /Reenviar verificação/i })).not.toBeInTheDocument();
  });

  it("shows pending badge and resend button", async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <EmailVerificationSection emailVerified={false} email="ana@test.com" />
      </ToastProvider>,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Pendente");
    await user.click(screen.getByRole("button", { name: /Reenviar verificação/i }));

    await waitFor(() => {
      expect(resendVerificationEmail).toHaveBeenCalled();
      expect(screen.getByText(/Enviamos um novo link/i)).toBeInTheDocument();
    });
  });
});
