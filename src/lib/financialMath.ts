import { Trade, Execution, TradeStatus } from "@/types/trade";
import { Timestamp } from "firebase/firestore";

/**
 * 🧮 CORE CALCULATION ENGINE
 * Pure functions only. No side effects.
 */

// --- Helpers ---

// Robust date converter (handles Firestore Timestamps, JS Dates, strings, or nulls)
const toMillis = (t: any): number => {
  if (!t) return 0;
  if (typeof t.toMillis === 'function') return t.toMillis();
  if (t instanceof Date) return t.getTime();
  return new Date(t).getTime();
};

// 🛡️ NaN Protection: Ensure value is a number, default to 0
const safeNum = (val: any): number => {
  const n = parseFloat(val);
  return isFinite(n) ? n : 0;
};

// --- 1. Aggregates (Entry/Exit/Qty) ---
export const calculateAggregates = (
  current: Trade,
  newExec: Execution
) => {
  // Ensure inputs are numbers
  let netQuantity = safeNum(current.netQuantity);
  let avgEntryPrice = safeNum(current.avgEntryPrice);
  let avgExitPrice = safeNum(current.avgExitPrice);
  let investedAmount = safeNum(current.investedAmount);
  
  const price = safeNum(newExec.price);
  const quantity = safeNum(newExec.quantity);
  const side = newExec.side;

  // Determine if adding to position (Entry) or reducing (Exit)
  const isEntry = 
    (current.direction === "LONG" && side === "BUY") ||
    (current.direction === "SHORT" && side === "SELL");

  if (isEntry) {
    // --- ENTRY LOGIC ---
    // Weighted Average Price = (OldValue + NewValue) / TotalQty
    const totalValue = (netQuantity * avgEntryPrice) + (price * quantity);
    const newQty = netQuantity + quantity;
    
    avgEntryPrice = newQty > 0 ? totalValue / newQty : price;
    netQuantity = newQty;
    
    // Update total invested amount (Cost Basis)
    investedAmount += (price * quantity);
  } else {
    // --- EXIT LOGIC ---
    // When closing, we reduce quantity but DO NOT change Avg Entry Price.
    
    // Update Avg Exit Price (Iterative weighted average approximation)
    if (avgExitPrice === 0) {
        avgExitPrice = price;
    } else {
        // Simple rolling average for V1 to prevent complexity without totalExitQty
        avgExitPrice = (avgExitPrice + price) / 2; 
    }

    netQuantity -= quantity;
    if (netQuantity < 0.000001) netQuantity = 0; // Floating point clamp
  }

  return { netQuantity, avgEntryPrice, avgExitPrice, investedAmount };
};

// --- 2. PnL (Realized) ---
export const calculatePnL = (
  current: Trade,
  newExec: Execution,
  currentAggregates: { netQuantity: number; avgEntryPrice: number }
) => {
  let grossPnl = safeNum(current.grossPnl);
  let totalFees = safeNum(current.totalFees);
  
  const price = safeNum(newExec.price);
  const quantity = safeNum(newExec.quantity);
  const fees = safeNum(newExec.fees);
  const side = newExec.side;

  const isEntry = 
    (current.direction === "LONG" && side === "BUY") ||
    (current.direction === "SHORT" && side === "SELL");

  // Fees always accumulate
  totalFees += fees;

  if (!isEntry) {
    // --- REALIZING PnL ---
    let pnlDelta = 0;
    
    // Use safeNum for entry price (it shouldn't change during exit)
    const entryPrice = safeNum(current.avgEntryPrice);

    if (current.direction === "LONG") {
      pnlDelta = (price - entryPrice) * quantity;
    } else {
      // Short: Sell High (Entry) - Buy Low (Exit)
      pnlDelta = (entryPrice - price) * quantity;
    }
    
    grossPnl += pnlDelta;
  }

  const netPnl = grossPnl - totalFees;
  
  // Metric #4: Return % (Net PnL / Total Invested Amount)
  const invested = safeNum(current.investedAmount) || (price * quantity);
  const returnPercent = invested > 0 ? (netPnl / invested) * 100 : 0;

  return { grossPnl, totalFees, netPnl, returnPercent };
};

// --- 3. Risk Metrics ---
export const calculateRiskMetrics = (
  current: Trade,
  netPnl: number,
  netQuantity: number
) => {
  const initialStopLoss = safeNum(current.initialStopLoss);
  const avgEntryPrice = safeNum(current.avgEntryPrice);
  const takeProfitTarget = safeNum(current.takeProfitTarget);
  
  let riskAmount = safeNum(current.riskAmount);
  let plannedRR = safeNum(current.plannedRR);
  let riskMultiple = 0;

  // Metric #5: Risk Amount ($) 
  if (initialStopLoss > 0 && avgEntryPrice > 0) {
     const priceDist = Math.abs(avgEntryPrice - initialStopLoss);
     // Risk based on current open size
     riskAmount = priceDist * netQuantity;
  }

  // Metric #6: Planned R:R
  if (initialStopLoss > 0 && takeProfitTarget > 0 && avgEntryPrice > 0) {
      const risk = Math.abs(avgEntryPrice - initialStopLoss);
      const reward = Math.abs(takeProfitTarget - avgEntryPrice);
      if (risk > 0) plannedRR = reward / risk;
  }

  // Metric #7: Realized R-Multiple
  if (riskAmount > 0) {
      riskMultiple = netPnl / riskAmount;
  }

  return { riskAmount, plannedRR, riskMultiple };
};

// --- 4. Time Metrics ---
export const calculateTimeMetrics = (
  current: Trade,
  newExec: Execution,
  isClosed: boolean
) => {
  const entryTime = toMillis(current.entryDate);
  const execTime = toMillis(newExec.date);
  
  let entryDate = current.entryDate;
  // Fix entry date if this execution is earlier than current record
  if (entryTime === 0 || (execTime < entryTime && execTime > 0)) {
      entryDate = newExec.date;
  }

  let exitDate = current.exitDate;
  if (execTime > toMillis(exitDate)) {
      exitDate = newExec.date;
  }

  let durationSeconds = 0;
  if (isClosed) {
      const start = toMillis(entryDate);
      const end = toMillis(exitDate);
      if (start > 0 && end > 0) {
          durationSeconds = (end - start) / 1000;
      }
  }

  return { entryDate, exitDate, durationSeconds };
};

// --- 5. Quality (Slippage) ---
export const calculateExecutionQuality = (
  current: Trade,
  newExec: Execution
) => {
  let totalSlippage = safeNum(current.totalSlippage);
  const expectedPrice = safeNum(newExec.expectedPrice);
  const price = safeNum(newExec.price);
  const quantity = safeNum(newExec.quantity);

  // Metric #11: Total Slippage Cost
  if (expectedPrice > 0) {
      const slippagePerUnit = Math.abs(price - expectedPrice);
      totalSlippage += (slippagePerUnit * quantity);
  }

  return { totalSlippage };
};

/**
 * 🚀 MASTER FUNCTION
 * Orchestrates all calculations to produce the next Trade state.
 */
export const runTradeCalculations = (
  currentTrade: Trade,
  newExec: Execution
): Partial<Trade> => {
  
  // 1. Aggregates
  const agg = calculateAggregates(currentTrade, newExec);
  
  // 2. Status
  const status: TradeStatus = agg.netQuantity <= 0.000001 ? "CLOSED" : "OPEN";
  
  // 3. Financials
  // Pass UPDATED aggregates (like new invested amount) for accurate returns
  const financials = calculatePnL(
      { ...currentTrade, ...agg }, 
      newExec,
      agg
  );

  // 4. Risk
  const risk = calculateRiskMetrics(
      { ...currentTrade, ...agg }, 
      financials.netPnl,
      agg.netQuantity
  );

  // 5. Time
  const time = calculateTimeMetrics(currentTrade, newExec, status === "CLOSED");

  // 6. Quality
  const quality = calculateExecutionQuality(currentTrade, newExec);

  return {
      ...agg,
      ...financials,
      ...risk,
      ...time,
      ...quality,
      status,
      // Count executions safely
      totalExecutions: (safeNum(currentTrade.totalExecutions) + 1),
      updatedAt: Timestamp.now()
  };
};