import { Timestamp } from "firebase/firestore";

// --- Enums & Union Types for Type Safety ---
export type TradeDirection = "LONG" | "SHORT";
export type TradeStatus = "OPEN" | "CLOSED" | "CANCELED";
export type AssetClass = "STOCK" | "CRYPTO" | "FOREX" | "FUTURES";
export type ExecutionSide = "BUY" | "SELL";
export type TradeEmotion = "CONFIDENT" | "NEUTRAL" | "FEARFUL" | "GREEDY" | "REVENGING" | "FOMO";

// --- 🏗️ CHILD: Execution (The Raw Log) ---
// Stored in sub-collection: /users/{userId}/trades/{tradeId}/executions/{executionId}
export interface Execution {
  id: string;
  tradeId: string;
  userId: string;
  
  // Core Data
  date: Timestamp;      // When the fill happened
  side: ExecutionSide;
  price: number;
  quantity: number;
  fees: number;         // Commission + Swap + SEC fees
  
  // Meta
  brokerOrderId?: string; // Link to external broker ID
  notes?: string;
  metadata?: Record<string, any>; // Flexible JSON bag for broker-specific data
}

// --- 🏛️ PARENT: Trade (The Aggregate) ---
// Stored in root collection: /users/{userId}/trades/{tradeId}
// This document is optimized for reading Lists and Dashboards (Read Heavy)
export interface Trade {
  id: string;
  userId: string;
  
  // 1. Identification
  symbol: string;
  direction: TradeDirection;
  assetClass: AssetClass;
  strategyId?: string; // Link to Strategy ID
  accountId: string;   // Link to Broker Account ID
  
  // 2. Lifecycle
  status: TradeStatus;
  openDate: Timestamp;
  closeDate?: Timestamp; // Undefined if OPEN
  durationSeconds?: number; // Calculated on close

  // 3. Live Aggregates (Updated via Transaction)
  // These allow the dashboard to render instantly without fetching executions
  netQuantity: number;    // Remaining open position size. If 0, trade is usually CLOSED.
  avgEntryPrice: number;  // Weighted Average Price of entry executions
  avgExitPrice?: number;  // Weighted Average Price of exit executions
  
  // 4. Financials
  grossPnl: number;       // Raw PnL from price movement
  totalFees: number;      // Sum of all execution fees
  netPnl: number;         // grossPnl - totalFees
  returnPercent?: number; // ROI percentage
  
  // 5. Risk Management
  initialStopLoss?: number;
  takeProfitTarget?: number;
  riskMultiple?: number; // R-Multiple (e.g., 2.5R)
  maxDrawdown?: number;  // MAE (Maximum Adverse Excursion) - lowest point during trade
  maxRunup?: number;     // MFE (Maximum Favorable Excursion) - highest point during trade
  
  // 6. Psychology & Review
  tags: string[];
  notes?: string;        // HTML or Markdown content. Images stored as <img> tags.
  screenshots: string[]; // Array of Firebase Storage URLs
  emotion?: TradeEmotion;
  mistakes?: string[];   // Array of specific mistake tags (e.g., "Chased Entry")
  
  // 7. System & Metadata
  source: "MANUAL" | "IMPORT" | "API";
  importBatchId?: string; // If imported via CSV/Broker Sync
  createdAt: Timestamp;
  updatedAt: Timestamp;
}