import { Trade, Execution } from "@/types/trade";
import { Timestamp } from "firebase/firestore";

/**
 * 🧮 CORE CALCULATION ENGINE
 * Pure functions only. No side effects.
 * "Industry Grade" financial precision.
 */

// --- Helpers ---

const toMillis = (t: any): number => {
  if (!t) return 0;
  if (typeof t.toMillis === 'function') return t.toMillis();
  if (t instanceof Date) return t.getTime();
  return new Date(t).getTime();
};

const safeNum = (val: any): number => {
  const n = parseFloat(val);
  return isFinite(n) ? n : 0;
};

// --- 1. Aggregates & Quantities ---
export const calculateAggregates = (
  current: Trade,
  newExec: Execution
) => {
  let netQuantity = safeNum(current.netQuantity);
  let initialQuantity = safeNum(current.initialQuantity); // 🆕 Track Max Size
  let avgEntryPrice = safeNum(current.avgEntryPrice);
  let investedAmount = safeNum(current.investedAmount);
  
  const price = safeNum(newExec.price);
  const quantity = safeNum(newExec.quantity);
  const side = newExec.side;

  // Determine Entry vs Exit
  // Long: Buy = Entry, Sell = Exit
  // Short: Sell = Entry, Buy = Exit
  const isEntry = 
    (current.direction === "LONG" && side === "BUY") || 
    (current.direction === "SHORT" && side === "SELL");

  if (isEntry) {
    // --- ENTRY LOGIC (Scaling In) ---
    
    // 1. Update Weighted Avg Entry Price
    // Formula: ((OldQty * OldAvg) + (NewQty * NewPrice)) / TotalQty
    const totalValue = (netQuantity * avgEntryPrice) + (quantity * price);
    const newTotalQty = netQuantity + quantity;
    
    avgEntryPrice = newTotalQty > 0 ? totalValue / newTotalQty : price;
    
    // 2. Update Quantities
    netQuantity += quantity;
    initialQuantity += quantity; // 🔒 Accumulate planned size
    
    // 3. Update Cost Basis
    investedAmount += (price * quantity);
    
  } else {
    // --- EXIT LOGIC (Scaling Out) ---
    // We reduce netQuantity, but NEVER initialQuantity or avgEntryPrice
    netQuantity -= quantity;
    
    // Clamp to 0 to avoid floating point ghosts (e.g., -0.0000001)
    if (netQuantity < 0.000001) netQuantity = 0;
  }

  return { 
    netQuantity, 
    initialQuantity, 
    avgEntryPrice, 
    investedAmount 
  };
};

// --- 2. PnL (Realized & Fees) ---
export const calculatePnL = (
  current: Trade,
  newExec: Execution,
  // We need the "before" entry price to calculate PnL correctly on exit
  currentAvgEntryPrice: number 
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

  // 1. Fees always accumulate
  totalFees += fees;

  // 2. Realize PnL ONLY on Exits
  if (!isEntry) {
    let realizedPnl = 0;
    
    if (current.direction === "LONG") {
      // Long Exit: (Exit Price - Entry Price) * Qty
      realizedPnl = (price - currentAvgEntryPrice) * quantity;
    } else {
      // Short Exit: (Entry Price - Exit Price) * Qty
      realizedPnl = (currentAvgEntryPrice - price) * quantity;
    }
    
    grossPnl += realizedPnl;
  }

  // 3. Net PnL = Gross - Fees
  const netPnl = grossPnl - totalFees;
  
  return { grossPnl, totalFees, netPnl };
};

// --- 3. Risk Metrics (The Fix) ---
export const calculateRiskMetrics = (
  current: Trade,
  netPnl: number,
  initialQuantity: number, // 🆕 Use Initial Qty for Risk Calc
  avgEntryPrice: number
) => {
  const initialStopLoss = safeNum(current.initialStopLoss);
  const takeProfitTarget = safeNum(current.takeProfitTarget);
  
  // Default to existing values to prevent overwriting with 0 if data missing
  let riskAmount = safeNum(current.riskAmount);
  let plannedRR = safeNum(current.plannedRR);
  let riskMultiple = 0;

  // A. Calculate Risk Amount (R)
  // Formula: abs(AvgEntry - StopLoss) * InitialQuantity
  // We use initialQuantity because Risk is based on the PLANNED size, not remaining size.
  if (initialStopLoss > 0 && avgEntryPrice > 0 && initialQuantity > 0) {
     const priceDist = Math.abs(avgEntryPrice - initialStopLoss);
     riskAmount = priceDist * initialQuantity;
  }

  // B. Calculate Planned R:R
  // Formula: abs(Target - AvgEntry) / abs(AvgEntry - StopLoss)
  if (initialStopLoss > 0 && takeProfitTarget > 0 && avgEntryPrice > 0) {
      const riskDist = Math.abs(avgEntryPrice - initialStopLoss);
      const rewardDist = Math.abs(takeProfitTarget - avgEntryPrice);
      
      if (riskDist > 0) {
        plannedRR = rewardDist / riskDist;
      }
  }

  // C. Calculate Realized R-Multiple
  // Formula: NetPnL / RiskAmount
  if (riskAmount > 0) {
      riskMultiple = netPnl / riskAmount;
  }

  return { 
    riskAmount: Number(riskAmount.toFixed(2)), 
    plannedRR: Number(plannedRR.toFixed(2)), 
    riskMultiple: Number(riskMultiple.toFixed(2)) 
  };
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
  // If this execution is earlier than current start, update start
  if (entryTime === 0 || (execTime < entryTime && execTime > 0)) {
      entryDate = newExec.date;
  }

  // Update exit date to latest execution
  let exitDate = current.exitDate || newExec.date;
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

/**
 * 🚀 MASTER FUNCTION
 * Orchestrates all calculations to produce the next Trade state.
 */
export const runTradeCalculations = (
  currentTrade: Trade,
  newExec: Execution
): Partial<Trade> => {
  
  // 1. Calculate Aggregates (Qty, Prices)
  const agg = calculateAggregates(currentTrade, newExec);
  
  // 2. Determine Status
  const status: "OPEN" | "CLOSED" = agg.netQuantity <= 0.000001 ? "CLOSED" : "OPEN";
  
  // 3. Calculate PnL
  // IMPORTANT: We pass currentTrade.avgEntryPrice (before this exec changed it) 
  // because realized PnL is based on the entry price *at the time of exit*.
  const financials = calculatePnL(
      currentTrade, 
      newExec,
      currentTrade.avgEntryPrice || agg.avgEntryPrice // Fallback for first trade
  );

  // 4. Calculate Risk
  // We use the NEW netPnl, but the INITIAL Quantity
  const risk = calculateRiskMetrics(
      { ...currentTrade, ...agg }, 
      financials.netPnl,
      agg.initialQuantity,
      agg.avgEntryPrice
  );

  // 5. Calculate Time
  const time = calculateTimeMetrics(currentTrade, newExec, status === "CLOSED");

  // 6. Return Clean Updates
  return {
      ...agg,
      ...financials,
      ...risk,
      ...time,
      status,
      totalExecutions: (safeNum(currentTrade.totalExecutions) + 1),
      updatedAt: Timestamp.now()
  };
};