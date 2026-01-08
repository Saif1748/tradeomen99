import { request, API_BASE_URL, ApiError } from "../core";
import { supabase } from "@/integrations/supabase/client"; // Needed for export session fetch
import type { Trade, PaginatedResponse, ScreenshotUploadResponse, TradeScreenshot } from "../types";

export const tradesApi = {
  getAll: (page = 1, limit = 20, symbol?: string) => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (symbol) params.append("symbol", symbol);
    return request<PaginatedResponse<Trade>>(`/trades/?${params.toString()}`);
  },

  getOne: (id: string) => request<Trade>(`/trades/${id}`),

  create: (data: Partial<Trade>) =>
    request<Trade>("/trades/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Trade>) =>
    request<Trade>(`/trades/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<void>(`/trades/${id}`, { method: "DELETE" }),

  export: async () => {
    // We manually fetch here because we return a Blob, not JSON
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    
    const response = await fetch(`${API_BASE_URL}/trades/export`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      if (response.status === 403) {
          throw new ApiError("Export is a PRO feature. Please upgrade.", 403);
      }
      throw new Error("Failed to export trades");
    }
    return response.blob();
  },

  uploadScreenshots: (files: File[], tradeId?: string) => {
    const form = new FormData();
    files.forEach((file) => form.append("files", file));
    const q = tradeId ? `?trade_id=${tradeId}` : "";
    return request<ScreenshotUploadResponse>(`/trades/uploads/trade-screenshots${q}`, {
      method: "POST",
      body: form,
    });
  },

  getScreenshots: (tradeId: string) =>
    request<{ files: TradeScreenshot[] }>(`/trades/${tradeId}/screenshots`),
};