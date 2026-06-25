import { API_PREFIX } from "@/lib/auth/constants";
import { api } from "@/lib/api/client";
import type {
  MarketplaceStatusResponse,
  ProgramPurchaseResponse,
} from "@/lib/api/domain-types";

export type MarketplaceConnectRequest = {
  walletId: string;
};

export const marketplaceApi = {
  status: () => api.get<MarketplaceStatusResponse>(`${API_PREFIX}/billing/marketplace/status`),

  connect: (body: MarketplaceConnectRequest) =>
    api.post<MarketplaceStatusResponse>(`${API_PREFIX}/billing/marketplace/connect`, body),

  sales: () => api.get<ProgramPurchaseResponse[]>(`${API_PREFIX}/billing/marketplace/sales`),
};
