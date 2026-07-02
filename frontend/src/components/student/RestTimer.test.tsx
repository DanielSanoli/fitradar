import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { RestTimer } from "@/components/student/RestTimer";

describe("RestTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
    vi.stubGlobal("navigator", {
      ...navigator,
      vibrate: vi.fn(),
    });
    vi.stubGlobal(
      "AudioContext",
      vi.fn().mockImplementation(() => ({
        createOscillator: () => ({ connect: vi.fn(), start: vi.fn(), stop: vi.fn(), frequency: {} }),
        createGain: () => ({ connect: vi.fn(), gain: {} }),
        destination: {},
        currentTime: 0,
        close: vi.fn(),
      })),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("starts 30s preset countdown", () => {
    render(<RestTimer />);
    fireEvent.click(screen.getByRole("button", { name: "30s" }));
    expect(screen.getByText("0:30")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(30_000);
    });

    expect(screen.getByRole("button", { name: "30s" })).toBeInTheDocument();
    expect(navigator.vibrate).toHaveBeenCalled();
  });

  it("shows custom seconds input", () => {
    render(<RestTimer />);
    fireEvent.change(screen.getByLabelText(/segundos personalizados/i), { target: { value: "45" } });
    fireEvent.click(screen.getByRole("button", { name: "Ir" }));
    expect(screen.getByText("0:45")).toBeInTheDocument();
  });

  it("toggles sound preference", () => {
    render(<RestTimer />);
    fireEvent.click(screen.getByRole("button", { name: /desativar som/i }));
    expect(sessionStorage.getItem("fitradar-rest-timer-sound")).toBe("off");
    expect(screen.getByRole("button", { name: /ativar som/i })).toBeInTheDocument();
  });
});
