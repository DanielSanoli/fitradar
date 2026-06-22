import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RadarChat } from "@/components/radar/RadarChat";

describe("RadarChat", () => {
  it("shows greeting and disclaimer", () => {
    render(<RadarChat greeting="Oi, teste!" suggestions={[]} />);
    expect(screen.getByText("Oi, teste!")).toBeInTheDocument();
    expect(
      screen.getByText(/As respostas do Radar são sugestões/i),
    ).toBeInTheDocument();
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

  it("shows disclaimer on bot messages with showDisclaimer", () => {
    render(
      <RadarChat
        suggestions={[]}
        messages={[
          {
            id: "1",
            role: "radar",
            text: "Resposta",
            showDisclaimer: true,
          },
        ]}
      />,
    );
    expect(screen.getByText("Sugestão, não orientação médica.")).toBeInTheDocument();
  });
});
