import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SpaceAreaSelector } from "@/components/creator/space/SpaceAreaSelector";

describe("SpaceAreaSelector", () => {
  it("renders options and toggles selection with aria-pressed", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<SpaceAreaSelector value="OTHER" onChange={onChange} />);

    const gym = screen.getByRole("button", { name: /Academia/i });
    expect(screen.getByRole("button", { name: /Outro/i })).toHaveAttribute("aria-pressed", "true");
    expect(gym).toHaveAttribute("aria-pressed", "false");

    await user.click(gym);
    expect(onChange).toHaveBeenCalledWith("GYM");
  });
});
