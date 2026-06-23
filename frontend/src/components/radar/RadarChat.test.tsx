import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RadarChat } from "@/components/radar/RadarChat";
import { RADAR_DISCLAIMER } from "@/lib/radar/radar-disclaimer";

describe("RadarChat", () => {
  it("shows greeting and a single footer disclaimer", () => {
    render(<RadarChat greeting="Oi, teste!" suggestions={[]} />);
    expect(screen.getByText("Oi, teste!")).toBeInTheDocument();
    expect(screen.getByText(RADAR_DISCLAIMER)).toBeInTheDocument();
    expect(screen.getAllByText(RADAR_DISCLAIMER)).toHaveLength(1);
  });

  it("renders suggestion chips and calls onAsk", async () => {
    const user = userEvent.setup();
    const onAsk = vi.fn();
    render(
      <RadarChat
        suggestions={["Como está a aderência?"]}
        onAsk={onAsk}
        messages={[{ id: "1", role: "radar", text: "Olá" }]}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Como está a aderência?" }));
    expect(onAsk).toHaveBeenCalledWith("Como está a aderência?");
  });

  it("strips duplicate disclaimer from bot message body", () => {
    render(
      <RadarChat
        suggestions={[]}
        messages={[
          {
            id: "1",
            role: "radar",
            text: `Resposta do motor.\n\n${RADAR_DISCLAIMER}`,
          },
        ]}
      />,
    );
    expect(screen.getByText(/Resposta do motor/i)).toBeInTheDocument();
    expect(screen.getAllByText(RADAR_DISCLAIMER)).toHaveLength(1);
  });
});
