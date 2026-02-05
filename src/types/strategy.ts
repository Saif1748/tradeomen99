import { Timestamp } from "firebase/firestore";
import { AssetClass } from "./trade"; 

// Enums for standardizing "style"
export type TradingStyle = "SCALP" | "DAY_TRADE" | "SWING" | "POSITION" | "INVESTMENT";

// ✅ NEW: Dynamic Rule Group Structure
// This replaces the rigid { entry: [], exit: [] } object
export interface StrategyRuleGroup {
  id: string;       // e.g. "entry", "exit", "risk", "custom-123"
  name: string;     // e.g. "Entry Triggers", "Risk Management"
  items: string[];  // The actual checklist items
}

export interface StrategyMetrics {
  totalTrades: number;
  winRate: number;      // e.g., 55.5
  profitFactor: number; // e.g., 1.5
  totalPnl: number;     // e.g., 1500.00
  lastTradeDate?: Timestamp;
}

export interface Strategy {
  // --- Identity ---
  id: string;
  userId: string;
  
  // --- Core Info ---
  name: string;
  description?: string;
  emoji?: string;       
  color: string;        
  
  // --- Classification ---
  style?: TradingStyle;
  assetClasses: AssetClass[]; 
  trackMissedTrades: boolean;

  // --- The Playbook (Structured Rules) ---
  // Now an array of groups to support infinite customization
  rules: StrategyRuleGroup[]; 

  // --- ⚡ Performance Aggregates ---
  metrics: StrategyMetrics;

  // --- Timestamps ---
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ✅ Default groups for new strategies
export const DEFAULT_RULE_GROUPS: StrategyRuleGroup[] = [
  { id: "entry", name: "Entry Conditions", items: [] },
  { id: "exit", name: "Exit Conditions", items: [] },
  { id: "risk", name: "Risk Management", items: [] }
];

export const INITIAL_METRICS: StrategyMetrics = {
  totalTrades: 0,
  winRate: 0,
  profitFactor: 0,
  totalPnl: 0
};