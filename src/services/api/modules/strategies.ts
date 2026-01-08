import { request } from "../core";
import type { Strategy, CreateStrategyInput } from "../types";

export const strategiesApi = {
  getAll: () => request<Strategy[]>("/strategies/"),
  getOne: (id: string) => request<Strategy>(`/strategies/${id}`),
  create: (data: CreateStrategyInput) =>
    request<Strategy>("/strategies/", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Strategy>) =>
    request<Strategy>(`/strategies/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/strategies/${id}`, { method: "DELETE" }),
};