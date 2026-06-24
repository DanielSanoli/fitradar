import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildCreatorSpaceUrl,
  formatCreatorSpaceLinkDisplay,
  getPublicBaseUrl,
} from "@/lib/app/public-url";

describe("public-url", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses VITE_PUBLIC_BASE_URL when configured", () => {
    vi.stubEnv("VITE_PUBLIC_BASE_URL", "https://fitradar.app/");
    expect(getPublicBaseUrl()).toBe("https://fitradar.app");
    expect(buildCreatorSpaceUrl("marina-duarte")).toBe("https://fitradar.app/c/marina-duarte");
  });

  it("falls back to window origin when env is unset", () => {
    vi.stubEnv("VITE_PUBLIC_BASE_URL", "");
    expect(getPublicBaseUrl()).toBe(window.location.origin);
    expect(buildCreatorSpaceUrl("studio")).toBe(`${window.location.origin}/c/studio`);
  });

  it("formats display link without protocol", () => {
    expect(formatCreatorSpaceLinkDisplay("https://fitradar.app/c/studio")).toBe(
      "fitradar.app/c/studio",
    );
  });
});
