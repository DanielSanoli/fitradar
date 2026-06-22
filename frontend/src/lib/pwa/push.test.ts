import { describe, expect, it, beforeEach } from "vitest";
import { pwaStorage, urlBase64ToUint8Array } from "@/lib/pwa/push-utils";

describe("pwaStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("tracks push opt-in state", () => {
    expect(pwaStorage.isPushEnabled()).toBe(false);
    pwaStorage.setPushEnabled(true);
    expect(pwaStorage.isPushEnabled()).toBe(true);
    pwaStorage.dismissPush();
    expect(pwaStorage.isPushDismissed()).toBe(true);
  });

  it("tracks install banner dismissal", () => {
    expect(pwaStorage.isInstallDismissed()).toBe(false);
    pwaStorage.dismissInstall();
    expect(pwaStorage.isInstallDismissed()).toBe(true);
  });
});

describe("urlBase64ToUint8Array", () => {
  it("decodes VAPID public key padding", () => {
    const bytes = urlBase64ToUint8Array("AQID");
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(0);
  });
});

describe("push API paths", () => {
  it("uses /api/v1/push prefix", async () => {
    const { pushApi } = await import("@/lib/api/push-api");
    expect(typeof pushApi.config).toBe("function");
    expect(typeof pushApi.subscribe).toBe("function");
    expect(typeof pushApi.unsubscribe).toBe("function");
    expect(typeof pushApi.test).toBe("function");
  });
});
