// src/lib/financialMath.ts
import { Trade, Execution } from "@/types/trade";
import { Timestamp } from "firebase/firestore";

/**
 * 🧮 CORE CALCULATION ENGINE
 * Pure functions for Industry-Grade financial precision.
 */

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
 * This is required by tradeService.ts for manual plan updates.
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

  // 1. Frozen Risk Logic: Use originalStopLoss (frozen at entry) falling back to initial
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

  // Slippage Calculation (Weighted)
  if (newExec.expectedPrice && newExec.expectedPrice > 0) {
    totalSlippage += Math.abs(price - newExec.expectedPrice) * qty;
  }

  // --- 3. Position Logic (Flip/Accumulate/Reduce) ---
  const currentSign = Math.sign(netQty); 
  const execSign = side === "BUY" ? 1 : -1;
  const signedExecQty = qty * execSign;
  const nextNetQty = netQty + signedExecQty;

  if (currentSign === 0 || currentSign === execSign) {
    // A. OPENING or ACCUMULATING
    const currentAbs = Math.abs(netQty);
    const newTotal = currentAbs + qty;
    
    if (newTotal > 0) {
      avgEntry = ((currentAbs * avgEntry) + (qty * price)) / newTotal;
    }
    
    netQty = nextNetQty;

    // Update Peak Stats
    const currentInv = Math.abs(netQty) * avgEntry;
    if (Math.abs(netQty) > peakQty) peakQty = Math.abs(netQty);
    if (currentInv > peakInvested) peakInvested = currentInv;

    // Initialize Planned Qty on very first entry
    if (plannedQty === 0) plannedQty = qty;

  } else {
    // B. REDUCING or FLIPPING
    const isFlip = (currentSign === 1 && nextNetQty < 0) || (currentSign === -1 && nextNetQty > 0);

    if (isFlip) {
      // 1. Close old position
      const closingQty = Math.abs(netQty);
      realizedPnl += (currentSign === 1) ? (price - avgEntry) * closingQty : (avgEntry - price) * closingQty;
      
      totalExitQty += closingQty;
      totalExitValue += (price * closingQty);
      avgExit = totalExitValue / totalExitQty;

      // 2. Open new position (the flip remainder)
      avgEntry = price;
      netQty = nextNetQty;
      
      // Reset Peak for new cycle
      peakQty = Math.abs(nextNetQty);
      peakInvested = peakQty * price;

    } else {
      // SCALE OUT
      realizedPnl += (currentSign === 1) ? (price - avgEntry) * qty : (avgEntry - price) * qty;
      
      totalExitQty += qty;
      totalExitValue += (price * qty);
      if (totalExitQty > 0) {
        avgExit = totalExitValue / totalExitQty;
      }
      
      netQty = nextNetQty;
    }
  }

  // Floating point ghost cleanup
  if (Math.abs(netQty) < 0.000001) netQty = 0;

  // --- 4. Final Financial Metrics ---
  const grossPnl = totalSellVal - totalBuyVal; 
  const netPnl = grossPnl - totalFees;

  // Freeze original stop if not set
  if (origStop === 0 && current.initialStopLoss && current.initialStopLoss > 0) {
    origStop = current.initialStopLoss;
  }

  // ROI/Performance PnL (Realized + Unrealized)
  const currentVal = Math.abs(netQty) * price;
  const costBasis = Math.abs(netQty) * avgEntry;
  const unrealized = (Math.sign(netQty) === 1) ? (currentVal - costBasis) : (costBasis - currentVal);
  const totalPerformancePnl = realizedPnl + unrealized - totalFees;

  const riskMetrics = calculateRiskMetrics(
    { ...current, originalStopLoss: origStop }, 
    totalPerformancePnl, 
    plannedQty, 
    avgEntry, 
    peakInvested
  );

  const timeMetrics = calculateTimeMetrics(current, newExec, netQty === 0, totalPerformancePnl);

  return {
    netQuantity: netQty,
    plannedQuantity: plannedQty,
    peakQuantity: peakQty,
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
    grossPnl,
    realizedPnl,
    netPnl,
    returnPercent: riskMetrics.holdingPeriodReturn, // Standard ROI
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