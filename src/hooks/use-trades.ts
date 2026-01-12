import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tradesApi } from "@/services/api/modules/trades";
import { Trade as ApiTrade } from "@/services/api/types";
import { toast } from "sonner";

// ✅ UITrade: Fully defined interface matching UI components (CamelCase)
// This fixes the "Property 'strategy' does not exist" error.
export interface UITrade {
  id: string;
  // Core Fields
  symbol: string;
  date: Date;           // Mapped from entry_time
  type: string;         // Mapped from instrument_type
  side: string;         // Mapped from direction
  status: string;
  quantity: number;
  
  // Financials (CamelCase for UI)
  entryPrice: number;   // Mapped from entry_price
  exitPrice?: number;   // Mapped from exit_price
  stopLoss?: number;    // Mapped from stop_loss
  target?: number;
  pnl?: number;
  fees: number;
  
  // Metadata
  notes: string;
  tags: string[];
  strategy: string;     // ✅ Explicitly added (Mapped from strategies.name)
  rMultiple: number;    // Calculated on frontend
  
  // Backend Reference (Optional)
  user_id: string;
  screenshots?: string[];
  metadata?: Record<string, any>;
}

interface UseTradesOptions {
  page: number;
  limit: number;
}

export function useTrades({ page, limit }: UseTradesOptions) {
  const queryClient = useQueryClient();

  // --- Mapper: API (Snake) -> UI (Camel) ---
  const mapApiToUi = (t: ApiTrade): UITrade => ({
    id: t.id,
    user_id: t.user_id,
    symbol: t.symbol,
    date: new Date(t.entry_time),
    type: t.instrument_type,
    side: t.direction,
    status: t.status,
    quantity: t.quantity,
    entryPrice: t.entry_price,
    exitPrice: t.exit_price ?? undefined,
    stopLoss: t.stop_loss ?? undefined,
    target: t.target ?? undefined,
    pnl: t.pnl ?? undefined,
    fees: t.fees,
    notes: t.notes || "",
    tags: t.tags || [],
    // ✅ Flatten strategy object to a simple string name
    strategy: t.strategies?.name || "No Strategy",
    rMultiple: (t.stop_loss && t.entry_price && t.pnl)
      ? Math.abs(t.pnl / ((t.entry_price - t.stop_loss) * t.quantity))
      : 0,
    screenshots: typeof t.screenshots === 'string' 
      ? JSON.parse(t.screenshots) 
      : (t.screenshots || []),
    metadata: t.metadata
  });

  // --- Mapper: UI (Camel) -> API (Snake) ---
  const mapUiToApi = (t: Partial<UITrade>): any => {
    const payload: any = { ...t };
    
    // Explicit mappings for mutation
    if (t.entryPrice !== undefined) payload.entry_price = t.entryPrice;
    if (t.exitPrice !== undefined) payload.exit_price = t.exitPrice;
    if (t.stopLoss !== undefined) payload.stop_loss = t.stopLoss;
    if (t.type) payload.instrument_type = t.type;
    if (t.side) payload.direction = t.side;
    if (t.date) payload.entry_time = t.date.toISOString();
    
    return payload;
  };

  // --- Query ---
  const query = useQuery({
    queryKey: ["trades", page, limit],
    queryFn: async () => {
      const response = await tradesApi.getAll(page, limit);
      return {
        data: response.data.map(mapApiToUi), // Transform API data to UI data
        total: response.total,
        totalPages: Math.ceil(response.total / limit),
      };
    },
    placeholderData: (prev) => prev,
  });

  // --- Mutations ---
  const createMutation = useMutation({
    mutationFn: (newTrade: Partial<UITrade>) => {
      const payload = mapUiToApi(newTrade);
      if (!payload.entry_time) payload.entry_time = new Date().toISOString();
      return tradesApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      toast.success("Trade logged");
    },
    onError: (err: any) => toast.error(err.detail || "Failed to create trade"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<UITrade> }) => 
      tradesApi.update(id, mapUiToApi(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      toast.success("Trade updated");
    },
    onError: (err: any) => toast.error(err.detail || "Failed to update trade"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tradesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      toast.success("Trade deleted");
    },
    onError: (err: any) => toast.error(err.detail || "Failed to delete trade"),
  });

  return {
    trades: query.data?.data || [],
    totalTrades: query.data?.total || 0,
    totalPages: query.data?.totalPages || 1,
    isLoading: query.isLoading,
    isError: query.isError,
    isPlaceholderData: query.isPlaceholderData,
    createTrade: createMutation.mutate,
    updateTrade: updateMutation.mutate,
    deleteTrade: deleteMutation.mutate,
  };
}