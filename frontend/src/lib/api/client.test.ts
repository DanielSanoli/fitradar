import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  apiRequest,
  setPaymentRequiredHandler,
  setUnauthorizedHandler,
} from "@/lib/api/client";
import { API_PREFIX } from "@/lib/auth/constants";
import { clearAuthStorage, getAccessToken, persistAuth } from "@/lib/auth/storage";
import type { AuthResponse } from "@/lib/api/types";

const authFixture: AuthResponse = {
  token: "access-token",
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
    clearAuthStorage();
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
    expect(getAccessToken()).toBe("new-access");
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({ credentials: "include" });
  });

  it("deduplicates refresh when concurrent requests get 401", async () => {
    persistAuth(authFixture);
    let refreshCalls = 0;
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      const path = url.replace("http://api.test", "");
      if (path === `${API_PREFIX}/auth/refresh`) {
        refreshCalls += 1;
        await new Promise((resolve) => setTimeout(resolve, 15));
        return new Response(JSON.stringify({ ...authFixture, token: "new-access" }), { status: 200 });
      }
      const headers = init?.headers as Record<string, string> | undefined;
      if (headers?.Authorization === "Bearer access-token") {
        return new Response(JSON.stringify({ message: "expired" }), { status: 401 });
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const [programs, students, me] = await Promise.all([
      apiRequest<{ ok: boolean }>("GET", "/api/v1/programs"),
      apiRequest<{ ok: boolean }>("GET", "/api/v1/students"),
      apiRequest<{ ok: boolean }>("GET", "/api/v1/auth/me"),
    ]);

    expect(refreshCalls).toBe(1);
    expect(programs.ok).toBe(true);
    expect(students.ok).toBe(true);
    expect(me.ok).toBe(true);
    expect(getAccessToken()).toBe("new-access");
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
        .mockResolvedValueOnce(new Response("{}", { status: 400 })),
    );

    await expect(apiRequest("GET", "/api/v1/programs")).rejects.toMatchObject({ status: 401 });
    expect(onUnauthorized).toHaveBeenCalledOnce();
    expect(getAccessToken()).toBeNull();
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
