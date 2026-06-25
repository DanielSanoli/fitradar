import { describe, expect, it } from "vitest";
import { resolvePostLoginRedirect } from "@/lib/auth/post-login-redirect";

describe("resolvePostLoginRedirect", () => {
  it("returns role home when from is missing", () => {
    expect(resolvePostLoginRedirect(undefined, "CREATOR")).toBe("/app");
    expect(resolvePostLoginRedirect(undefined, "STUDENT")).toBe("/student");
  });

  it("respects state.from for matching role", () => {
    expect(resolvePostLoginRedirect("/app/students/s1", "CREATOR")).toBe("/app/students/s1");
    expect(resolvePostLoginRedirect("/student/progress", "STUDENT")).toBe("/student/progress");
  });

  it("rejects cross-role or public redirects", () => {
    expect(resolvePostLoginRedirect("/app", "STUDENT")).toBe("/student");
    expect(resolvePostLoginRedirect("/student", "CREATOR")).toBe("/app");
    expect(resolvePostLoginRedirect("/login", "CREATOR")).toBe("/app");
    expect(resolvePostLoginRedirect("//evil.com", "CREATOR")).toBe("/app");
  });
});
