import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SessionsPanel } from "@/components/auth/SessionsPanel";
import { ToastProvider } from "@/components/ui/toast";

const logout = vi.fn();
const listSessions = vi.fn();
const revokeSession = vi.fn();

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ logout }),
}));

vi.mock("@/lib/api/auth-api", () => ({
  listSessions: (...args: unknown[]) => listSessions(...args),
  revokeSession: (...args: unknown[]) => revokeSession(...args),
}));

function renderPanel() {
  return render(
    <ToastProvider>
      <SessionsPanel />
    </ToastProvider>,
  );
}

describe("SessionsPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listSessions.mockResolvedValue([
      {
        id: "session-1",
        deviceLabel: "Windows",
        ipAddress: "127.0.0.1",
        createdAt: "2026-06-19T10:00:00",
        expiresAt: "2026-07-19T10:00:00",
        current: true,
      },
      {
        id: "session-2",
        deviceLabel: "Android",
        ipAddress: "10.0.0.2",
        createdAt: "2026-06-18T10:00:00",
        expiresAt: "2026-07-18T10:00:00",
        current: false,
      },
    ]);
  });

  it("lists active sessions", async () => {
    renderPanel();

    expect(await screen.findByText("Windows")).toBeInTheDocument();
    expect(screen.getByText("Android")).toBeInTheDocument();
    expect(screen.getByText("Este dispositivo")).toBeInTheDocument();
    expect(screen.getByText(/2FA/)).toBeInTheDocument();
  });

  it("revokes another device session", async () => {
    const user = userEvent.setup();
    revokeSession.mockResolvedValue({ message: "Sessão encerrada." });
    renderPanel();

    await screen.findByText("Android");
    const buttons = screen.getAllByRole("button", { name: /Encerrar/i });
    await user.click(buttons[1]);

    await waitFor(() => {
      expect(revokeSession).toHaveBeenCalledWith("session-2");
    });
    expect(logout).not.toHaveBeenCalled();
  });

  it("logs out when revoking current session", async () => {
    const user = userEvent.setup();
    revokeSession.mockResolvedValue({ message: "Sessão atual encerrada." });
    renderPanel();

    await screen.findByText("Windows");
    const buttons = screen.getAllByRole("button", { name: /Encerrar/i });
    await user.click(buttons[0]);

    await waitFor(() => {
      expect(revokeSession).toHaveBeenCalledWith("session-1");
      expect(logout).toHaveBeenCalled();
    });
  });
});
