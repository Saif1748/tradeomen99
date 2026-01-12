// src/services/api/types.ts

// ------------------------------------------------------------------
// Enums (Matches app/schemas/common_schemas.py)
// ------------------------------------------------------------------
export type PlanTier = "FREE" | "PRO" | "PREMIUM"; // Note: Backend may still use FOUNDER in DB, but config maps to PREMIUM
export type InstrumentType = "STOCK" | "CRYPTO" | "FOREX" | "FUTURES";
export type TradeSide = "LONG" | "SHORT";
export type TradeStatus = "OPEN" | "CLOSED";

// ------------------------------------------------------------------
// User & Auth (CRITICAL FOR DASHBOARD)
// ------------------------------------------------------------------
export interface UserProfile {
  id: string;
  email?: string;
  full_name?: string;
  username?: string;
  avatar_url?: string;
  plan_tier: PlanTier;
  
  // Usage Stats (from user_profiles table)
  daily_chat_count: number;
  monthly_ai_tokens_used: number;
  monthly_import_count: number;
  
  // Reset Timestamps
  last_chat_reset_at?: string;
  quota_reset_at?: string;
  
  created_at: string;
}

export interface UserUsageReport {
  plan: PlanTier;
  chat: {
    used: number;
    limit: number;
  };
  imports: {
    used: number;
    limit: number;
  };
  trades: {
    used: number;
    limit: number | null; // null = Unlimited
  };
  ai_cost_tokens: number;
}

// ------------------------------------------------------------------
// Trades (Matches app/schemas/trade_schemas.py)
// ------------------------------------------------------------------
export interface Trade {
  id: string;
  user_id: string;
  symbol: string;
  instrument_type: InstrumentType;
  direction: TradeSide;
  status: TradeStatus;
  entry_price: number;
  quantity: number;
  exit_price?: number | null;
  stop_loss?: number | null;
  target?: number | null;
  fees: number;
  pnl?: number | null;
  entry_time: string;
  exit_time?: string | null;
  created_at: string;

  // Metadata
  notes?: string | null;
  encrypted_notes?: string | null; // DB Column
  tags?: string[];
  
  // Screenshots
  screenshots?: string[] | string | null; 
  encrypted_screenshots?: string[] | string | null; // DB Column
  
  strategy_id?: string | null;
  strategies?: {
    name: string;
    emoji?: string;
  } | null;
  
  metadata?: Record<string, any>;
}

export interface CreateTradeInput {
  symbol: string;
  instrument_type: InstrumentType;
  direction: TradeSide;
  status: TradeStatus;
  entry_price: number;
  quantity: number;
  entry_time: string;
  
  // Optional
  exit_price?: number;
  exit_time?: string;
  stop_loss?: number;
  target?: number;
  fees?: number;
  notes?: string;
  tags?: string[];
  strategy_id?: string;
  metadata?: Record<string, any>;
  screenshots?: string[]; // Base64 strings (for upload)
}

export interface UpdateTradeInput extends Partial<CreateTradeInput> {}

export interface PaginatedTradesResponse {
  data: Trade[];
  total: number;
  page: number;
  size: number;
}

// ------------------------------------------------------------------
// Strategies (Matches app/schemas/strategy_schemas.py)
// ------------------------------------------------------------------
export interface Strategy {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  emoji: string;
  color_hex: string;
  style?: string | null;
  
  instrument_types: InstrumentType[];
  rules: Record<string, string[]>;
  track_missed_trades: boolean;
  
  created_at: string;
  updated_at?: string | null;
}

export interface CreateStrategyInput {
  name: string;
  description?: string;
  emoji?: string;
  color_hex?: string;
  style?: string;
  instrument_types?: InstrumentType[];
  rules?: Record<string, string[]>;
  track_missed_trades?: boolean;
}

// ------------------------------------------------------------------
// AI Chat (Matches app/schemas/chat_schemas.py)
// ------------------------------------------------------------------
export interface ChatSession {
  id: string;
  topic: string;
  created_at: string;
}

export interface ChatMessage {
  id?: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at?: string;
}

export interface ChatRequest {
  message: string;
  session_id?: string;
  model?: string; // e.g., "gemini-1.5-flash"
  provider?: string;
}

export interface ChatUsage {
  total_tokens: number;
  prompt_tokens: number;
  completion_tokens: number;
  search_context_size?: number | string; 
  cost?: number | Record<string, number>; 
}

export interface ToolCallData {
  type: string; // e.g. "import-confirmation"
  data: Record<string, any>;
}

export interface ChatResponse {
  response: string;
  session_id: string;
  usage?: ChatUsage;
  tool_call?: ToolCallData;
}

// ------------------------------------------------------------------
// Utilities / Uploads
// ------------------------------------------------------------------
export interface UploadResponse {
  type: string;
  file_path: string;
  filename: string;
  mapping: Record<string, string>;
  detected_headers: string[];
  preview: Record<string, any>[];
  message: string;
}

export interface ScreenshotUploadResponse {
  files: { filename: string; url: string }[];
  uploaded_to_trade: boolean;
  count: number;
}

export interface TradeScreenshot {
  url: string;
  name?: string;
  uploaded_at?: string;
}

export interface BrokerAccount {
  id: string;
  broker_name: string;
  api_key_last_digits: string;
  last_sync_time?: string;
  is_active: boolean;
  created_at: string;
}

export interface NewsResult {
  answer: string;
  sources: { title: string; url: string; snippet?: string }[];
  related_questions: string[];
}