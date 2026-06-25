import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ForceChangePasswordPage } from "@/features/auth/ForceChangePasswordPage";
import { AuthContext, type AuthContextValue } from "@/features/auth/AuthProvider";

vi.mock("@/components/auth/ChangePasswordForm", () => ({
  ChangePasswordForm: ({ submitLabel }: { submitLabel?: string }) => (
    <div data-testid="change-password-form">{submitLabel}</div>
  ),
}));

const refreshUser = vi.fn().mockResolvedValue(undefined);

const authValue: AuthContextValue = {
  user: {
    id: "s1",
    name: "Ana",
    email: "ana@test.com",
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
    mustChangePassword: true,
  },
  isLoading: false,
  isAuthenticated: true,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  refreshUser,
};

describe("ForceChangePasswordPage", () => {
  it("shows forced password change copy", () => {
    render(
      <AuthContext.Provider value={authValue}>
        <MemoryRouter>
          <ForceChangePasswordPage />
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    expect(screen.getByText(/senha temporária/i)).toBeInTheDocument();
    expect(screen.getByTestId("change-password-form")).toHaveTextContent("Continuar");
  });
});
