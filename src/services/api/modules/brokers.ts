import { request } from "../core";
import type { BrokerAccount } from "../types";

export const brokersApi = {
  getAll: () => request<BrokerAccount[]>("/brokers/"),
  add: (data: any) =>
    request<BrokerAccount>("/brokers/", { method: "POST", body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/brokers/${id}`, { method: "DELETE" }),
  sync: (id: string) =>
    request<{ status: string; message: string }>(`/brokers/${id}/sync`, { method: "POST" }),
  getDhanAuthUrl: () => request<{ url: string }>("/brokers/dhan/auth-url"),
  connectDhan: (tokenId: string, state: string) =>
    request<{ status: string; broker_id: string }>("/brokers/dhan/connect", {
      method: "POST",
      body: JSON.stringify({ tokenId, state }),
    }),
};