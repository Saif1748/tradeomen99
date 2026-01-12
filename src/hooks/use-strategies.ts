import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { strategiesApi } from "@/services/api/modules/strategies";
import { Strategy as ApiStrategy } from "@/services/api/types";
import { toast } from "sonner";

// ✅ UIStrategy: The shape your UI components expect (CamelCase)
// Includes real stats from the backend SQL function
export interface UIStrategy {
  id: string;
  name: string;
  description: string;
  emoji: string;
  color: string;          // Mapped from color_hex
  style: string;
  instrumentTypes: string[]; // Mapped from instrument_types
  rules: Record<string, string[]>;
  trackMissed: boolean;   // Mapped from track_missed_trades
  createdAt: Date;        // Mapped from created_at
  
  // Stats Object (Read-Only from Backend)
  stats: {
    totalTrades: number;
    winRate: number;
    netPL: number;
    profitFactor: number;
    avgWinner: number;
    avgLoser: number;
  };
}

export function useStrategies() {
  const queryClient = useQueryClient();

  // --- Mapper: API (Snake) -> UI (Camel) ---
  const mapApiToUi = (s: ApiStrategy): UIStrategy => ({
    id: s.id,
    name: s.name,
    description: s.description || "",
    emoji: s.emoji || "♟️",
    color: s.color_hex || "#FFFFFF",
    style: s.style || "General",
    instrumentTypes: s.instrument_types || [],
    rules: s.rules || {},
    trackMissed: s.track_missed_trades,
    createdAt: new Date(s.created_at),
    
    // Map Stats (with safe defaults)
    stats: {
      totalTrades: s.stats?.totalTrades || 0,
      winRate: s.stats?.winRate || 0,
      netPL: s.stats?.netPL || 0,
      profitFactor: s.stats?.profitFactor || 0,
      avgWinner: s.stats?.avgWinner || 0,
      avgLoser: s.stats?.avgLoser || 0,
    }
  });

  // --- Mapper: UI (Camel) -> API (Snake) ---
  const mapUiToApi = (s: Partial<UIStrategy>): Partial<ApiStrategy> => {
    const payload: any = { ...s };
    
    if (s.color) payload.color_hex = s.color;
    if (s.instrumentTypes) payload.instrument_types = s.instrumentTypes;
    if (s.trackMissed !== undefined) payload.track_missed_trades = s.trackMissed;
    
    // Remove read-only fields before sending to backend
    delete payload.stats;
    delete payload.createdAt;
    
    return payload;
  };

  // --- Query (Read) ---
  const query = useQuery({
    queryKey: ["strategies"],
    queryFn: async () => {
      const data = await strategiesApi.getAll();
      return data.map(mapApiToUi);
    },
  });

  // --- Mutations (Write) ---

  const createMutation = useMutation({
    mutationFn: (newStrategy: Partial<UIStrategy>) => 
      strategiesApi.create(mapUiToApi(newStrategy)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strategies"] });
      toast.success("Strategy created successfully");
    },
    onError: (err: any) => {
      toast.error(err.detail || "Failed to create strategy");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<UIStrategy> }) => 
      strategiesApi.update(id, mapUiToApi(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strategies"] });
      toast.success("Strategy updated");
    },
    onError: (err: any) => {
      toast.error(err.detail || "Failed to update strategy");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => strategiesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strategies"] });
      toast.success("Strategy deleted");
    },
    onError: (err: any) => {
      toast.error(err.detail || "Failed to delete strategy");
    },
  });

  return {
    // Data
    strategies: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    
    // Actions
    createStrategy: createMutation.mutate,
    updateStrategy: updateMutation.mutate,
    deleteStrategy: deleteMutation.mutate,
    
    // Statuses
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}