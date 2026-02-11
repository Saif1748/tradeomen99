import { Timestamp } from "firebase/firestore";

// --- Enums & Union Types ---
export type TradeDirection = "LONG" | "SHORT";
export type TradeStatus = "OPEN" | "CLOSED"; 
export type AssetClass = "STOCK" | "CRYPTO" | "FOREX" | "FUTURES" | "OPTIONS" | "INDEX";
export type ExecutionSide = "BUY" | "SELL";
export type TradeEmotion = "CONFIDENT" | "NEUTRAL" | "FEARFUL" | "GREEDY" | "REVENGING" | "FOMO" | "HESITANT";

// --- 🏗️ CHILD: Execution (The Immutable Ledger) ---
// Stored in sub-collection: /trades/{tradeId}/executions/{executionId}
export interface Execution {
  id: string;
  tradeId: string;
  accountId: string; 
  userId: string;
  
  // Core Data
  date: Timestamp;       // Exact fill time
  side: ExecutionSide;
  price: number;
  quantity: number;      // Always positive
  fees: number;          // Commission + Swap + SEC fees (Always positive)
  
  // Execution Quality (New)
  expectedPrice?: number; // The Limit/Stop price (used to calc slippage)

  // Meta
  brokerOrderId?: string; // External Broker ID (e.g., "IB-12345")
  notes?: string;
  metadata?: Record<string, any>; // Flexible JSON bag for broker specifics
}

// --- 🏛️ PARENT: Trade (The Aggregate) ---
// Stored in ROOT collection: /trades/{tradeId}
export interface Trade {
  id: string;
  
  // --- 1. Identity & Access ---
  accountId: string;   // 🔒 CRITICAL: Workspace Isolation Key
  userId: string;      // 👤 Owner of the trade record
  strategyId?: string; // 🔗 Link to Strategy ID
  
  // ✅ AUDIT TRAIL
  createdBy?: string;  
  updatedBy?: string;  

  // --- 2. Core Trade Info ---
  symbol: string;      // Normalized (e.g., "BTCUSD", "AAPL")
  direction: TradeDirection;
  assetClass: AssetClass;
  status: TradeStatus;
  
  // --- 3. Live Aggregates (The "State") ---
  // Updated atomically via Transaction. Allows O(1) reads.
  netQuantity: number;     // Remaining open size. (Decreases on sell. 0 = Closed)
  
  // 🆕 THE FIX: "High Water Mark" for position size
  // Accumulates all ENTRY quantities. Never decreases on Exit.
  // CRITICAL for accurate Risk Amount (R) calculation when scaling out.
  initialQuantity: number; 

  avgEntryPrice: number;   // Weighted Average Price of ALL entry fills
  avgExitPrice?: number;   // Weighted Average Price of ALL exit fills
  totalExecutions: number; // Count of child docs
  investedAmount: number;  // Cost Basis (Total $ currently invested)

  // --- 4. Financials (The "Result") ---
  grossPnl: number;        // Raw PnL from price action only
  totalFees: number;       // Sum of all execution fees
  netPnl: number;          // grossPnl - totalFees
  returnPercent?: number;  // ROI % (netPnl / investedAmount)
  
  // --- 5. Risk Management (The "Plan") ---
  initialStopLoss?: number;
  takeProfitTarget?: number;
  
  // Calculated using: abs(AvgEntry - SL) * initialQuantity
  riskAmount?: number;     
  plannedRR?: number;      // Planned Risk:Reward Ratio
  riskMultiple?: number;   // Realized R-Multiple (Net PnL / Risk Amount)
  
  // --- 6. Advanced Performance (MAE/MFE) ---
  mae?: number;            // Max Adverse Excursion (Lowest price against you)
  mfe?: number;            // Max Favorable Excursion (Highest price for you)
  profitCapture?: number;  // Efficiency: Net PnL / MFE
  
  // --- 7. Execution Quality ---
  totalSlippage?: number;  // Sum of |Fill Price - Expected Price|
  executionScore?: number; // 0-1 Score based on slippage vs profit
  
  // --- 8. Psychology & Review ---
  tags: string[];          
  notes?: string;          
  screenshots: string[];   
  emotion?: TradeEmotion;
  mistakes?: string[];     
  disciplineScore?: number; // 0-1 Score based on plan adherence
  
  // --- 9. Time Metrics ---
  entryDate: Timestamp;    // Date of FIRST execution
  exitDate?: Timestamp;    // Date of LAST execution (if closed)
  durationSeconds?: number; // Calculated on close
  timeToMFE?: number;       // Seconds from entry until peak profit point
  
  // --- 10. Metadata ---
  source: "MANUAL" | "IMPORT" | "API";
  importBatchId?: string;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}