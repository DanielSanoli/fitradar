import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StaggerItem } from "@/components/motion/StaggerList";

describe("StaggerItem", () => {
  it("stays visible when prefers-reduced-motion is enabled", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query: string) => ({
        matches: query.includes("prefers-reduced-motion"),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );

    render(
      <StaggerItem index={0}>
        <p>Programa visível</p>
      </StaggerItem>,
    );

    const wrapper = screen.getByText("Programa visível").parentElement;
    expect(wrapper).not.toHaveClass("opacity-0");
    expect(wrapper?.className).toContain("motion-reduce:opacity-100");
  });
});
