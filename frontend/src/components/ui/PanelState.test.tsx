import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PanelState } from "@/components/ui/PanelState";

describe("PanelState", () => {
  it("wraps content with className when state is content", () => {
    const { container } = render(
      <PanelState state="content" className="px-5 py-4">
        <p>Conteúdo carregado</p>
      </PanelState>,
    );

    const wrapper = container.firstElementChild;
    expect(wrapper?.tagName).toBe("DIV");
    expect(wrapper).toHaveClass("px-5", "py-4");
    expect(screen.getByText("Conteúdo carregado")).toBeInTheDocument();
  });
});
