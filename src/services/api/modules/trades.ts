import { request, API_BASE_URL, ApiError } from "../core";
import { supabase } from "@/integrations/supabase/client";
import type { 
  Trade, 
  ScreenshotUploadResponse, 
  TradeScreenshot 
} from "../types";

export const tradesApi = {
  /**
   * NOTE: getAll() is removed from this service.
   * Paginated reads are performed directly via Supabase in the use-trades hook
   * to satisfy the "Read Fast" requirement and leverage RLS.
   */


  /**
   * Fetch a single trade by ID.
   * Used by the Backend to provide sensitive data (notes/screenshots) 
   * that are excluded from the general Supabase list.
   */
  getOne: (id: string) => request<Trade>(`/trades/${id}`),


  /**
   * Create a new trade.
   * Scoped to FastAPI to handle ownership validation and plan limits.
   */
  create: (data: Partial<Trade>) =>
    request<Trade>("/trades/", {
      method: "POST",
      body: JSON.stringify(data),
    }),


  /**
   * Update an existing trade.
   * Backend handles PnL recalculations and ownership checks.
   */
  update: (id: string, data: Partial<Trade>) =>
    request<Trade>(`/trades/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),


  /**
   * Delete a trade.
   * Ensures clean removal of linked files and metadata via Backend.
   */
  delete: (id: string) =>
    request<void>(`/trades/${id}`, { method: "DELETE" }),


  /**
   * Export trades to CSV.
   * Backend verifies PRO/PREMIUM status before generation.
   */
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


  /**
   * Upload screenshots for a trade.
   * Backend manages storage bucket security and antivirus scanning.
   */
  uploadScreenshots: (files: File[], tradeId?: string) => {
    const form = new FormData();
    files.forEach((file) => form.append("files", file));
    const q = tradeId ? `?trade_id=${tradeId}` : "";
    return request<ScreenshotUploadResponse>(`/trades/uploads/trade-screenshots${q}`, {
      method: "POST",
      body: form,
    });
  },


  /**
   * Fetch screenshot metadata for a specific trade.
   */
  getScreenshots: (id: string) =>
    request<{ files: TradeScreenshot[] }>(`/trades/${id}/screenshots`),
};