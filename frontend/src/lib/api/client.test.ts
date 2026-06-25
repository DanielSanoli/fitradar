import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  apiRequest,
  setPaymentRequiredHandler,
  setUnauthorizedHandler,
} from "@/lib/api/client";
import { AUTH_STORAGE } from "@/lib/auth/constants";
import { persistAuth } from "@/lib/auth/storage";
import type { AuthResponse } from "@/lib/api/types";

const authFixture: AuthResponse = {
  token: "access-token",
  refreshToken: "refresh-token",
  tokenType: "Bearer",
  user: {
    id: "u1",
    name: "Creator",
    email: "c@test.com",
    role: "CREATOR",
    creatorId: null,
    plan: "FREE",
    subscriptionStatus: "TRIALING",
    trialEndsAt: null,
    subscriptionEndsAt: null,
    emailVerified: true,
    accessAllowed: true,
    accessMessage: null,
    trialDaysRemaining: 7,
  },
};

describe("api client", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubEnv("VITE_API_URL", "http://api.test");
    setUnauthorizedHandler(null);
    setPaymentRequiredHandler(null);
  });

  it("retries once after 401 when refresh succeeds", async () => {
    persistAuth(authFixture);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ message: "expired" }), { status: 401 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ...authFixture, token: "new-access" }), { status: 200 }),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const data = await apiRequest<{ ok: boolean }>("GET", "/api/v1/auth/me");
    expect(data.ok).toBe(true);
    expect(localStorage.getItem(AUTH_STORAGE.token)).toBe("new-access");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("logs out on 401 when refresh fails", async () => {
    persistAuth(authFixture);
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(new Response("{}", { status: 401 }))
        .mockResolvedValueOnce(new Response("{}", { status: 401 })),
    );

    await expect(apiRequest("GET", "/api/v1/programs")).rejects.toMatchObject({ status: 401 });
    expect(onUnauthorized).toHaveBeenCalledOnce();
    expect(localStorage.getItem(AUTH_STORAGE.token)).toBeNull();
  });

  it("handles 402 payment required", async () => {
    persistAuth(authFixture);
    const onPaymentRequired = vi.fn();
    setPaymentRequiredHandler(onPaymentRequired);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Recurso disponível no plano Pro" }), { status: 402 }),
      ),
    );

    await expect(apiRequest("GET", "/api/v1/copilot/ask")).rejects.toMatchObject({ status: 402 });
    expect(onPaymentRequired).toHaveBeenCalledWith("Recurso disponível no plano Pro");
  });

  it("prompts pro upgrade on free plan limit error", async () => {
    persistAuth(authFixture);
    const onPaymentRequired = vi.fn();
    setPaymentRequiredHandler(onPaymentRequired);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            message:
              "Limite do plano Free atingido — assine o Pro para liberar alunos/programas ilimitados",
          }),
          { status: 400 },
        ),
      ),
    );

    await expect(apiRequest("POST", "/api/v1/students/invite", {})).rejects.toMatchObject({
      status: 400,
    });
    expect(onPaymentRequired).toHaveBeenCalledWith(
      "Limite do plano Free atingido — assine o Pro para liberar alunos/programas ilimitados",
    );
  });
});
