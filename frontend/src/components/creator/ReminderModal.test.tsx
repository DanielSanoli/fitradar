import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReminderModal } from "@/components/creator/ReminderModal";

describe("ReminderModal", () => {
  const onSend = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    onSend.mockResolvedValue({
      deliveryId: "d1",
      studentId: "s1",
      emailSent: true,
      pushSent: false,
      emailDetail: "E-mail enviado",
      pushDetail: "Aluno sem push",
      summary: "Lembrete enviado por e-mail.",
    });
  });

  it("shows real delivery status after send", async () => {
    const user = userEvent.setup();
    render(
      <ReminderModal
        open
        studentName="Maria"
        initialText="Oi Maria!"
        onClose={vi.fn()}
        onSend={onSend}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Enviar lembrete/i }));

    await waitFor(() => {
      expect(onSend).toHaveBeenCalledWith("Oi Maria!");
      expect(screen.getByText(/Lembrete enviado por e-mail/i)).toBeInTheDocument();
      expect(screen.getByText(/Push: não enviado/i)).toBeInTheDocument();
    });
  });

  it("shows error when send fails", async () => {
    onSend.mockRejectedValue(new Error("Não foi possível entregar o lembrete."));
    const user = userEvent.setup();
    render(
      <ReminderModal
        open
        studentName="Maria"
        initialText="Oi!"
        onClose={vi.fn()}
        onSend={onSend}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Enviar lembrete/i }));

    expect(await screen.findByText(/Não foi possível entregar/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Enviado$/i })).not.toBeInTheDocument();
  });
});
