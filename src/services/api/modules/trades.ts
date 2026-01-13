import { request, API_BASE_URL, ApiError } from "../core";
import { supabase } from "@/integrations/supabase/client";
import type { 
  Trade, 
  PaginatedTradesResponse, 
  ScreenshotUploadResponse, 
  TradeScreenshot 
} from "../types";

export const tradesApi = {
  /**
   * Get paginated trades.
   * supports optional date range filtering for calendar views.
   */
  getAll: (page = 1, limit = 35, filters?: { startDate?: string; endDate?: string }) => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    // Add date filters if present
    if (filters?.startDate) params.append("start_date", filters.startDate);
    if (filters?.endDate) params.append("end_date", filters.endDate);

    return request<PaginatedTradesResponse>(`/trades/?${params.toString()}`);
  },

  // ... keep other existing methods (getOne, create, update, delete, etc.) ...
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
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    
    const response = await fetch(`${API_BASE_URL}/trades/export/csv`, {
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