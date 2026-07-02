import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider } from "@/components/ui/toast";
import { PushNotificationSwitch } from "@/components/pwa/PushPrompt";
import { pushApi } from "@/lib/api/push-api";
import { pwaStorage } from "@/lib/pwa/push-utils";
import { PUSH_MESSAGES } from "@/lib/pwa/push-enable";

vi.mock("@/lib/api/push-api", () => ({
  pushApi: {
    config: vi.fn(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    test: vi.fn(),
  },
}));

vi.mock("@/lib/pwa/push-utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/pwa/push-utils")>();
  return {
    ...actual,
    subscribeToPush: vi.fn(),
    unsubscribePushLocally: vi.fn(),
    pwaStorage: {
      ...actual.pwaStorage,
      isPushEnabled: vi.fn(() => false),
      setPushEnabled: vi.fn(),
    },
  };
});

function renderSwitch() {
  return render(
    <ToastProvider>
      <PushNotificationSwitch />
    </ToastProvider>,
  );
}

describe("PushNotificationSwitch", () => {
  const requestPermission = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(pwaStorage.isPushEnabled).mockReturnValue(false);
    vi.mocked(pushApi.config).mockResolvedValue({
      enabled: true,
      publicKey: "test-public-key",
    });
    vi.stubGlobal("Notification", {
      permission: "default",
      requestPermission,
    });
  });

  it("shows server unavailable hint when push is disabled on the server", async () => {
    vi.mocked(pushApi.config).mockResolvedValue({
      enabled: false,
      publicKey: null,
    });

    renderSwitch();

    await waitFor(() => {
      expect(screen.getByText(/Indisponível no servidor/i)).toBeInTheDocument();
    });

    expect(screen.getByRole("switch")).toBeDisabled();
    expect(requestPermission).not.toHaveBeenCalled();
  });

  it("does not hang and shows browser blocked message when permission is denied", async () => {
    vi.stubGlobal("Notification", {
      permission: "denied",
      requestPermission,
    });

    const user = userEvent.setup();
    renderSwitch();

    await waitFor(() => {
      expect(pushApi.config).toHaveBeenCalled();
    });

    const toggle = screen.getByRole("switch");
    expect(toggle).not.toHaveAttribute("aria-busy", "true");

    await user.click(toggle);

    await waitFor(() => {
      expect(screen.getByText(PUSH_MESSAGES.permissionDeniedBrowser)).toBeInTheDocument();
    });

    expect(requestPermission).not.toHaveBeenCalled();
    expect(toggle).not.toBeDisabled();
    expect(toggle).not.toHaveAttribute("aria-busy", "true");
  });
});
