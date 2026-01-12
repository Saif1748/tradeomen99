import { request } from "../core";
import type { Strategy } from "../types";

export const strategiesApi = {
  /**
   * Fetch all strategies for the current user.
   * Returns metadata + aggregated stats.
   */
  getAll: () => {
    return request<Strategy[]>("/strategies/");
  },

  /**
   * Get a specific strategy by ID.
   */
  getOne: (id: string) => {
    return request<Strategy>(`/strategies/${id}`);
  },

  /**
   * Create a new strategy.
   */
  create: (data: Partial<Strategy>) => {
    return request<Strategy>("/strategies/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * Update an existing strategy.
   * Uses PATCH for partial updates.
   */
  update: (id: string, data: Partial<Strategy>) => {
    return request<Strategy>(`/strategies/${id}`, {
      method: "PATCH", 
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete a strategy.
   */
  delete: (id: string) => {
    return request<void>(`/strategies/${id}`, {
      method: "DELETE",
    });
  },
};