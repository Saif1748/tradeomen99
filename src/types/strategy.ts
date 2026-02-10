import { Timestamp } from "firebase/firestore";
import { AssetClass } from "./trade"; 

// Enums
export type TradingStyle = "SCALP" | "DAY_TRADE" | "SWING" | "POSITION" | "INVESTMENT";
export type StrategyStatus = "active" | "archived" | "developing";

// ✅ DYNAMIC RULES ENGINE
// Allows users to create custom checklists like "Psychology Check", "Macro conditions", etc.
export interface StrategyRuleGroup {
  id: string;       // e.g. "entry", "risk", "mental-state"
  name: string;     // e.g. "Entry Triggers", "Pre-Trade Routine"
  items: string[];  // Checkbox items
}

// ✅ DENORMALIZED METRICS
// We update these on every trade save. This allows the UI to render 
// dashboards instantly without calculating 1000s of trades on the fly.
export interface StrategyMetrics {
  totalTrades: number;
  winRate: number;      // 0 to 100
  profitFactor: number; // > 1.0 is good
  totalPnl: number;     // Net PnL
  lastTradeDate?: Timestamp;
  bestTradePnl?: number;
  worstTradePnl?: number;
}

export interface Strategy {
  // --- Identity & Access ---
  id: string;
  accountId: string; // 🔒 Scoped to Workspace (Industry Grade Isolation)
  userId: string;    // 👤 Creator/Owner ID (Legacy/Owner)
  
  // ✅ AUDIT TRAIL (New Fields)
  // Optional (?) to support legacy data that doesn't have these fields yet
  createdBy?: string;  // UID of the user who created this strategy
  updatedBy?: string;  // UID of the last user who edited this strategy
  
  // --- Core Info ---
  name: string;
  description?: string;
  status: StrategyStatus; // Lifecycle management
  
  // --- Visuals ---
  emoji?: string;        
  color: string;         // Hex code for charts
  
  // --- Classification ---
  style?: TradingStyle;
  assetClasses: AssetClass[]; 
  trackMissedTrades: boolean; // Feature flag for "Ghost Trades"

  // --- The Playbook (Structured Rules) ---
  rules: StrategyRuleGroup[]; 

  // --- ⚡ Performance Aggregates ---
  metrics: StrategyMetrics;

  // --- Timestamps ---
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// --- Defaults & Constants ---

export const DEFAULT_RULE_GROUPS: StrategyRuleGroup[] = [
  { id: "entry", name: "Entry Conditions", items: [] },
  { id: "exit", name: "Exit Conditions", items: [] },
  { id: "risk", name: "Risk Management", items: [] }
];

export const INITIAL_METRICS: StrategyMetrics = {
  totalTrades: 0,
  winRate: 0,
  profitFactor: 0,
  totalPnl: 0,
  bestTradePnl: 0,
  worstTradePnl: 0
};