import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ToastProvider } from "@/components/ui/toast";
import { RetentionAlertsInbox } from "@/components/creator/RetentionAlertsInbox";
import { retentionApi } from "@/lib/api/retention-api";

vi.mock("@/lib/api/retention-api", () => ({
  retentionApi: {
    alerts: vi.fn(),
    markAlertRead: vi.fn(),
  },
}));

const sampleAlert = {
  id: "a1",
  subjectStudentId: "s1",
  type: "CHURN_RISK_HIGH" as const,
  severity: "CRITICAL" as const,
  message: "João está há 9 dias sem check-in.",
  actionSuggestion: "Envie um lembrete personalizado.",
  dataSnapshot: null,
  createdAt: "2026-06-19T10:00:00Z",
  read: false,
};

function renderInbox() {
  return render(
    <ToastProvider>
      <MemoryRouter>
        <RetentionAlertsInbox />
      </MemoryRouter>
    </ToastProvider>,
  );
}

describe("RetentionAlertsInbox", () => {
  beforeEach(() => {
    vi.mocked(retentionApi.alerts).mockImplementation(async ({ unreadOnly } = {}) => ({
      content: unreadOnly ? [] : [sampleAlert],
      page: 0,
      size: unreadOnly ? 1 : 30,
      totalElements: unreadOnly ? 2 : 1,
      totalPages: 1,
    }));
  });

  it("shows unread badge on bell", async () => {
    renderInbox();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /2 não lidos/i })).toBeInTheDocument();
    });
  });

  it("opens inbox and lists alerts", async () => {
    const user = userEvent.setup();
    renderInbox();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /alertas do radar/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /alertas do radar/i }));

    await waitFor(() => {
      expect(screen.getByRole("dialog", { name: /inbox de alertas/i })).toBeInTheDocument();
      expect(screen.getByText("João está há 9 dias sem check-in.")).toBeInTheDocument();
    });
  });

  it("marks alert as read", async () => {
    vi.mocked(retentionApi.markAlertRead).mockResolvedValue({ ...sampleAlert, read: true });

    const user = userEvent.setup();
    renderInbox();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /alertas do radar/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /alertas do radar/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /marcar como lido/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /marcar como lido/i }));

    await waitFor(() => {
      expect(retentionApi.markAlertRead).toHaveBeenCalledWith("a1");
      expect(screen.getByText("Lido")).toBeInTheDocument();
    });
  });
});
