import { describe, expect, it } from "vitest";
import {
  CREATOR_RADAR_CONFIG,
  STUDENT_RADAR_CONFIG,
  radarConfigForUser,
  radarCopilotRole,
} from "@/lib/radar/copilot-config";
import type { User } from "@/lib/api/types";

const baseUser: User = {
  id: "1",
  name: "João Silva",
  email: "j@test.com",
  role: "CREATOR",
  creatorId: null,
  plan: "PRO",
  subscriptionStatus: "ACTIVE",
  trialEndsAt: null,
  subscriptionEndsAt: null,
  emailVerified: true,
  accessAllowed: true,
  accessMessage: null,
  trialDaysRemaining: 0,
};

describe("copilot-config", () => {
  it("returns creator config for creators and admins", () => {
    expect(radarConfigForUser(baseUser)).toBe(CREATOR_RADAR_CONFIG);
    expect(radarConfigForUser({ ...baseUser, role: "ADMIN" })).toBe(CREATOR_RADAR_CONFIG);
    expect(radarCopilotRole(baseUser)).toBe("creator");
  });

  it("returns student config for students", () => {
    const student = { ...baseUser, role: "STUDENT" as const, creatorId: "c1" };
    expect(radarConfigForUser(student)).toBe(STUDENT_RADAR_CONFIG);
    expect(radarCopilotRole(student)).toBe("student");
    expect(STUDENT_RADAR_CONFIG.greeting("Maria")).toMatch(/Maria/);
  });
});
