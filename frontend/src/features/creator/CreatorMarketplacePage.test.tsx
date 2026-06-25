import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ToastProvider } from "@/components/ui/toast";
import { CreatorMarketplacePage } from "@/features/creator/CreatorMarketplacePage";
import { marketplaceApi } from "@/lib/api/marketplace-api";

vi.mock("@/lib/api/marketplace-api", () => ({
  marketplaceApi: {
    status: vi.fn(),
    connect: vi.fn(),
    sales: vi.fn(),
  },
}));

function renderPage() {
  return render(
    <ToastProvider>
      <MemoryRouter>
        <CreatorMarketplacePage />
      </MemoryRouter>
    </ToastProvider>,
  );
}

describe("CreatorMarketplacePage", () => {
  beforeEach(() => {
    vi.mocked(marketplaceApi.status).mockResolvedValue({
      connected: false,
      walletId: null,
      platformFeePercent: "10.00",
      platformFeePercentFree: "10.00",
      platformFeePercentPro: "0.00",
    });
    vi.mocked(marketplaceApi.sales).mockResolvedValue([]);
  });

  it("loads marketplace status and empty sales", async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Vendas & recebimento")).toBeInTheDocument();
      expect(screen.getByText(/sem conta conectada/i)).toBeInTheDocument();
      expect(screen.getByText(/nenhuma venda registrada ainda/i)).toBeInTheDocument();
    });
  });

  it("connects Asaas wallet", async () => {
    vi.mocked(marketplaceApi.connect).mockResolvedValue({
      connected: true,
      walletId: "wal_test1234567890",
      platformFeePercent: "10.00",
      platformFeePercentFree: "10.00",
      platformFeePercentPro: "0.00",
    });

    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByLabelText(/wallet id/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/wallet id/i), "wal_test1234567890");
    await user.click(screen.getByRole("button", { name: /conectar conta/i }));

    await waitFor(() => {
      expect(marketplaceApi.connect).toHaveBeenCalledWith({ walletId: "wal_test1234567890" });
    });
  });

  it("lists sales from API", async () => {
    vi.mocked(marketplaceApi.status).mockResolvedValue({
      connected: true,
      walletId: "wal_abc",
      platformFeePercent: "10.00",
      platformFeePercentFree: "10.00",
      platformFeePercentPro: "0.00",
    });
    vi.mocked(marketplaceApi.sales).mockResolvedValue([
      {
        id: "sale-1",
        programId: "p1",
        programTitle: "Premium",
        studentId: "s1",
        studentName: "Ana Silva",
        amount: "99.00",
        platformFee: "9.90",
        creatorNet: "89.10",
        status: "CONFIRMED",
        createdAt: "2026-06-01T12:00:00Z",
        confirmedAt: "2026-06-01T12:05:00Z",
      },
    ]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Premium")).toBeInTheDocument();
      expect(screen.getByText("Ana Silva")).toBeInTheDocument();
      expect(screen.getByText("Confirmada")).toBeInTheDocument();
    });
  });
});
