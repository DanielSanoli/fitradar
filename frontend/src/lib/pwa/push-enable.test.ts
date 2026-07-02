import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  PUSH_ENABLE_TIMEOUT_MS,
  PUSH_MESSAGES,
  PushEnableTimeoutError,
  isPushPermissionDenied,
  isPushServerAvailable,
  runPushEnableFlow,
  withPushTimeout,
} from "@/lib/pwa/push-enable";

describe("push-enable", () => {
  beforeEach(() => {
    vi.stubGlobal("Notification", {
      permission: "default",
      requestPermission: vi.fn().mockResolvedValue("granted"),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("detects server unavailable when push is disabled", () => {
    expect(isPushServerAvailable({ enabled: false, publicKey: "key" })).toBe(false);
    expect(isPushServerAvailable({ enabled: true, publicKey: null })).toBe(false);
    expect(isPushServerAvailable({ enabled: true, publicKey: "key" })).toBe(true);
  });

  it("returns server disabled message when config is off", async () => {
    const result = await runPushEnableFlow(
      { enabled: false, publicKey: null },
      {
        requestPermission: vi.fn(),
        subscribeToPush: vi.fn(),
        registerSubscription: vi.fn(),
        subscriptionToPayload: vi.fn(),
      },
    );

    expect(result).toEqual({ ok: false, message: PUSH_MESSAGES.serverDisabled });
  });

  it("skips requestPermission when browser permission is denied", async () => {
    vi.stubGlobal("Notification", {
      permission: "denied",
      requestPermission: vi.fn(),
    });

    expect(isPushPermissionDenied()).toBe(true);

    const requestPermission = vi.fn();
    const result = await runPushEnableFlow(
      { enabled: true, publicKey: "key" },
      {
        requestPermission,
        subscribeToPush: vi.fn(),
        registerSubscription: vi.fn(),
        subscriptionToPayload: vi.fn(),
      },
    );

    expect(result).toEqual({ ok: false, message: PUSH_MESSAGES.permissionDeniedBrowser });
    expect(requestPermission).not.toHaveBeenCalled();
  });

  it("returns permission denied when request is not granted", async () => {
    const requestPermission = vi.fn().mockResolvedValue("denied");
    const result = await runPushEnableFlow(
      { enabled: true, publicKey: "key" },
      {
        requestPermission,
        subscribeToPush: vi.fn(),
        registerSubscription: vi.fn(),
        subscriptionToPayload: vi.fn(),
      },
    );

    expect(result).toEqual({ ok: false, message: PUSH_MESSAGES.permissionDenied });
  });

  it("returns unsupported message when subscription fails", async () => {
    const result = await runPushEnableFlow(
      { enabled: true, publicKey: "key" },
      {
        requestPermission: vi.fn().mockResolvedValue("granted"),
        subscribeToPush: vi.fn().mockResolvedValue(null),
        registerSubscription: vi.fn(),
        subscriptionToPayload: vi.fn(),
      },
    );

    expect(result).toEqual({ ok: false, message: PUSH_MESSAGES.subscribeUnsupported });
  });

  it("rejects with timeout error when operation hangs", async () => {
    vi.useFakeTimers();

    const promise = withPushTimeout(
      () => new Promise<string>(() => {}),
      PUSH_ENABLE_TIMEOUT_MS,
    );
    const assertion = expect(promise).rejects.toBeInstanceOf(PushEnableTimeoutError);

    await vi.advanceTimersByTimeAsync(PUSH_ENABLE_TIMEOUT_MS);
    await assertion;
    vi.useRealTimers();
  });
});
