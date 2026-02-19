// src/lib/financialMath.ts
import { Trade, Execution } from "@/types/trade";
import { Timestamp } from "firebase/firestore";

/**
 * 🧮 CORE CALCULATION ENGINE
 * Pure functions for Industry-Grade financial precision.
 */

// Small epsilon to handle floating point drift
const EPSILON = 0.0000001;

// --- Helpers ---
const safeNum = (val: any): number => {
  const n = parseFloat(val);
  return isFinite(n) ? n : 0;
};

const toMillis = (t: any): number => {
  if (!t) return 0;
  if (typeof t.toMillis === 'function') return t.toMillis();
  if (t instanceof Date) return t.getTime();
  return new Date(t).getTime();
};

/**
 * ✅ EXPORTED: Risk & Performance Metrics 
 */
export const calculateRiskMetrics = (
  current: Trade,
  netPnl: number,
  plannedQuantity: number,
  avgEntryPrice: number,
  peakInvested: number
) => {
  const initialStopLoss = safeNum(current.initialStopLoss);
  const takeProfitTarget = safeNum(current.takeProfitTarget);
  
  let riskAmount = safeNum(current.riskAmount);
  let plannedRR = safeNum(current.plannedRR);
  let riskMultiple = 0;
  let profitCapture = 0;
  let holdingPeriodReturn = 0;

  // 1. Frozen Risk Logic
  const stopToUse = safeNum(current.originalStopLoss) || initialStopLoss;

  // 2. Risk Amount ($R) = |AvgEntry - Stop| * Planned Size
  if (stopToUse > 0 && avgEntryPrice > 0 && plannedQuantity > 0) {
     riskAmount = Math.abs(avgEntryPrice - stopToUse) * plannedQuantity;
  }

  // 3. Planned Reward & Profit Capture
  if (stopToUse > 0 && takeProfitTarget > 0 && avgEntryPrice > 0) {
      const riskDist = Math.abs(avgEntryPrice - stopToUse);
      const rewardDist = Math.abs(takeProfitTarget - avgEntryPrice);
      
      if (riskDist > 0) {
        plannedRR = rewardDist / riskDist;
      }

      // Frozen Planned Reward = |Target - Entry| * Planned Size
      const plannedRewardAmount = rewardDist * plannedQuantity;
      
      if (plannedRewardAmount > 0) {
        // Fix: Profit Capture = (Net PnL / Planned Potential Profit)
        profitCapture = (netPnl / plannedRewardAmount) * 100;
      }
  }

  // 4. Realized R-Multiple
  if (riskAmount > 0) {
      riskMultiple = netPnl / riskAmount;
  }

  // 5. Capital Efficiency (HPR)
  if (peakInvested > 0) {
    holdingPeriodReturn = (netPnl / peakInvested) * 100;
  }

  return { 
    riskAmount: Number(riskAmount.toFixed(2)), 
    plannedRR: Number(plannedRR.toFixed(2)), 
    riskMultiple: Number(riskMultiple.toFixed(2)),
    profitCapture: Number(profitCapture.toFixed(2)),
    holdingPeriodReturn: Number(holdingPeriodReturn.toFixed(2))
  };
};


/**
 * 🔄 MASTER FUNCTION
 * Calculates the new state of a trade document based on a new execution.
 */
export const runTradeCalculations = (
  current: Trade,
  newExec: Execution
): Partial<Trade> => {
  
  // --- 1. Unpack State ---
  let netQty = safeNum(current.netQuantity);
  let avgEntry = safeNum(current.avgEntryPrice);
  let peakQty = safeNum(current.peakQuantity);
  let peakInvested = safeNum(current.peakInvested);
  
  let avgExit = safeNum(current.avgExitPrice);
  let totalExitQty = safeNum(current.totalExitQuantity);
  let totalExitValue = safeNum(current.totalExitValue);

  let totalBuyVal = safeNum(current.totalBuyValue);
  let totalSellVal = safeNum(current.totalSellValue);
  let realizedPnl = safeNum(current.realizedPnl);
  let totalFees = safeNum(current.totalFees) + safeNum(newExec.fees);
  let totalSlippage = safeNum(current.totalSlippage);

  let plannedQty = safeNum(current.plannedQuantity) || 0;
  let origStop = safeNum(current.originalStopLoss);

  // --- 2. Process Execution Data ---
  const price = safeNum(newExec.price);
  const qty = safeNum(newExec.quantity);
  const side = newExec.side;
  const execValue = price * qty;

  if (side === "BUY") totalBuyVal += execValue;
  else totalSellVal += execValue;

  if (newExec.expectedPrice && newExec.expectedPrice > 0) {
    totalSlippage += Math.abs(price - newExec.expectedPrice) * qty;
  }

  // --- 3. Position Logic (Flip/Accumulate/Reduce) ---
  const currentSign = Math.sign(netQty); 
  const execSign = side === "BUY" ? 1 : -1;
  const currentAbsQty = Math.abs(netQty);

  // A. OPENING or ACCUMULATING (Same Direction or Empty)
  if (currentSign === 0 || currentSign === execSign) {
    const newTotal = currentAbsQty + qty;
    
    if (newTotal > 0) {
      avgEntry = ((currentAbsQty * avgEntry) + (qty * price)) / newTotal;
    }
    
    netQty += (qty * execSign);

    // Initialize Planned Qty on very first entry
    if (plannedQty === 0) plannedQty = qty;

  } else {
    // B. REDUCING or FLIPPING (Opposite Direction)
    const closingQty = Math.min(currentAbsQty, qty);
    const remainderQty = qty - closingQty; // This amount represents the FLIP

    // 1. Process Closing Portion
    if (closingQty > 0) {
      const pnlChunk = (currentSign === 1) 
        ? (price - avgEntry) * closingQty 
        : (avgEntry - price) * closingQty;
      
      realizedPnl += pnlChunk;
      totalExitQty += closingQty;
      totalExitValue += (price * closingQty);
      
      if (totalExitQty > 0) {
        avgExit = totalExitValue / totalExitQty;
      }

      // Reduce Net Qty
      if (currentSign === 1) netQty -= closingQty;
      else netQty += closingQty;
    }

    // 2. Process Flip (Remainder)
    if (remainderQty > EPSILON) {
       // Reset metrics for the new leg
       avgEntry = price;
       netQty = remainderQty * execSign;
       
       // Note: realizedPnl carries over as it tracks the "Trade ID" lifecycle
    }
  }

  // Floating point ghost cleanup
  if (Math.abs(netQty) < EPSILON) netQty = 0;

  // --- 4. Update Peaks (GLOBAL CHECK) ---
  // We check this at the end to ensure we catch ANY high water mark,
  // whether it came from accumulation or a large flip.
  // CRITICAL FIX: We use Math.max to ensure peak never decreases.
  const currentAbs = Math.abs(netQty);
  const currentInv = currentAbs * avgEntry;

  if (currentAbs > peakQty) peakQty = currentAbs;
  if (currentInv > peakInvested) peakInvested = currentInv;

  // --- 5. Final Financial Metrics ---
  const grossPnl = totalSellVal - totalBuyVal; 
  
  // Calculate Unrealized PnL based on current avgEntry
  const currentVal = Math.abs(netQty) * price;
  const costBasis = Math.abs(netQty) * avgEntry;
  const unrealized = (Math.sign(netQty) === 1) ? (currentVal - costBasis) : (costBasis - currentVal);
  
  // Net PnL = Realized + Unrealized - Fees
  const netPnl = realizedPnl + unrealized - totalFees;

  if (origStop === 0 && current.initialStopLoss && current.initialStopLoss > 0) {
    origStop = current.initialStopLoss;
  }

  // ✅ Return %: (Net PnL / Total Buy Value) * 100
  // Fallback to Sell Value for Short-only trades to avoid divide-by-zero
  const investmentBasis = totalBuyVal > 0 ? totalBuyVal : totalSellVal;
  const returnPercent = investmentBasis > 0 ? (netPnl / investmentBasis) * 100 : 0;

  const riskMetrics = calculateRiskMetrics(
    { ...current, originalStopLoss: origStop }, 
    netPnl, 
    plannedQty, 
    avgEntry, 
    peakInvested
  );

  const timeMetrics = calculateTimeMetrics(current, newExec, netQty === 0, netPnl);

  return {
    netQuantity: netQty,
    plannedQuantity: plannedQty,
    peakQuantity: peakQty, // Now monotonic increasing
    avgEntryPrice: avgEntry,
    avgExitPrice: avgExit,
    totalExitQuantity: totalExitQty,
    totalExitValue: totalExitValue,
    peakInvested,
    investedAmount: Math.abs(netQty) * avgEntry,
    totalBuyValue: totalBuyVal,
    totalSellValue: totalSellVal,
    totalFees,
    totalSlippage,
    grossPnl: realizedPnl + unrealized,
    realizedPnl,
    netPnl,
    returnPercent, 
    originalStopLoss: origStop,
    ...riskMetrics,
    ...timeMetrics,
    status: netQty === 0 ? "CLOSED" : "OPEN",
    totalExecutions: (current.totalExecutions || 0) + 1,
    updatedAt: Timestamp.now()
  };
};

/**
 * ⏳ Time Metrics Helper
 */
const calculateTimeMetrics = (
  current: Trade, 
  newExec: Execution, 
  isClosed: boolean, 
  finalPnl: number
) => {
  const entryTime = toMillis(current.entryDate);
  const execTime = toMillis(newExec.date);
  
  let entryDate = current.entryDate;
  if (entryTime === 0 || (execTime < entryTime && execTime > 0)) entryDate = newExec.date;

  let exitDate = current.exitDate || newExec.date;
  if (execTime > toMillis(exitDate)) exitDate = newExec.date;

  let durationSeconds = 0;
  let profitVelocity = 0;

  if (isClosed) {
    const start = toMillis(entryDate);
    const end = toMillis(exitDate);
    if (start > 0 && end > 0) {
      durationSeconds = (end - start) / 1000;
      const hours = durationSeconds / 3600;
      if (hours > 0) profitVelocity = finalPnl / hours;
    }
  }

  return { 
    entryDate, 
    exitDate, 
    durationSeconds, 
    profitVelocity: Number(profitVelocity.toFixed(2)) 
  };
};