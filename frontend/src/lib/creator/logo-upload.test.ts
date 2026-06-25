import { describe, expect, it } from "vitest";
import { isAllowedLogoFile, persistableLogoUrl } from "@/lib/creator/logo-upload";

describe("persistableLogoUrl", () => {
  it("accepts uploaded logo paths", () => {
    expect(persistableLogoUrl("/uploads/logos/c1/logo.png")).toBe("/uploads/logos/c1/logo.png");
  });

  it("accepts external https urls", () => {
    expect(persistableLogoUrl("https://cdn.example.com/logo.png")).toBe(
      "https://cdn.example.com/logo.png",
    );
  });

  it("rejects blob and data urls", () => {
    expect(persistableLogoUrl("blob:http://localhost/x")).toBeNull();
    expect(persistableLogoUrl("data:image/png;base64,abc")).toBeNull();
  });
});

describe("isAllowedLogoFile", () => {
  it("allows common image mime types", () => {
    expect(
      isAllowedLogoFile(new File(["x"], "logo.png", { type: "image/png" })),
    ).toBe(true);
  });
});
