import { request, API_BASE_URL, ApiError } from "../core";
import { supabase } from "@/integrations/supabase/client";
import type { 
  Trade, 
  ScreenshotUploadResponse, 
  TradeScreenshot 
} from "../types";

export const tradesApi = {
  /**
   * Fetch a single trade by ID.
   * Hits the FastAPI backend to retrieve sensitive decrypted data (notes/screenshots).
   */
  getOne: (id: string) => request<Trade>(`/trades/${id}`),

  /**
   * Create a new trade.
   */
  create: (data: Partial<Trade>) =>
    request<Trade>("/trades/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  /**
   * Update an existing trade.
   */
  update: (id: string, data: Partial<Trade>) =>
    request<Trade>(`/trades/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  /**
   * Delete a trade.
   */
  delete: (id: string) =>
    request<void>(`/trades/${id}`, { method: "DELETE" }),

  /**
   * Export trades to CSV.
   * Authentication is manually handled via Supabase session token.
   */
  export: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    
    if (!token) throw new Error("Authentication required for export");

    const response = await fetch(`${API_BASE_URL}/trades/export/csv`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      if (response.status === 403) {
         throw new ApiError("Export is a PRO feature. Please upgrade.", 403);
      }
      throw new ApiError("Failed to export trades", response.status);
    }
    
    return response.blob();
  },

  /**
   * Upload screenshots.
   * Supports atomic linking to a trade if tradeId is provided.
   */
  uploadScreenshots: (files: File[], tradeId?: string) => {
    const form = new FormData();
    files.forEach((file) => form.append("files", file));
    
    // Append query param for atomic update
    const q = tradeId ? `?trade_id=${encodeURIComponent(tradeId)}` : "";
    
    return request<ScreenshotUploadResponse>(`/trades/uploads/trade-screenshots${q}`, {
      method: "POST",
      body: form,
      // Note: Do not set Content-Type header manually; the browser sets it with the boundary for FormData
    });
  },

  /**
   * Fetch signed URLs for a specific trade.
   * Matches Backend: GET /trades/{id}/screenshots
   */
  getScreenshots: (id: string) =>
    request<TradeScreenshot[]>(`/trades/${id}/screenshots`),
};