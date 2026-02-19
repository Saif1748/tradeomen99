import { 
  collection, 
  doc, 
  runTransaction, 
  serverTimestamp, 
  Timestamp, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  getDoc, 
  increment,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  getCountFromServer,
  getAggregateFromServer, // ✅ Aggregation Import
  sum,                    // ✅ Aggregation Import
  count                   // ✅ Aggregation Import
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Trade, Execution } from "@/types/trade";
import { AccountTransaction } from "@/types/account";
import { runTradeCalculations, calculateRiskMetrics } from "@/lib/financialMath";
import { logActivityInTransaction } from "./auditService";

const ROOT_COLLECTION = "trades";

// ✅ Pagination Interface
export interface PaginatedTrades {
  data: Trade[];
  lastDoc: QueryDocumentSnapshot | null;
  totalCount: number;
}

/**
 * 🛡️ Industry-Grade Sanitization
 * Removes all 'undefined' keys from an object recursively to prevent Firebase crashes.
 */
const sanitize = (obj: any): any => {
  if (Array.isArray(obj)) return obj.map(sanitize);
  if (obj !== null && typeof obj === "object" && !(obj instanceof Timestamp) && !(obj instanceof Date)) {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, sanitize(v)])
    );
  }
  return obj;
};

const toTimestamp = (date: any): Timestamp => {
  if (!date) return Timestamp.now();
  if (date instanceof Timestamp) return date;
  if (date instanceof Date) return Timestamp.fromDate(date);
  return Timestamp.now();
};

/**
 * 🟢 Create Trade
 * Atomic initialization. Infers direction from first execution.
 */
export const createTrade = async (accountId: string, userId: string, tradeData: any) => {
  if (!accountId) throw new Error("Workspace context missing.");

  const collectionRef = collection(db, ROOT_COLLECTION);
  const tradeRef = doc(collectionRef);
  const tradeId = tradeRef.id;

  // 1. Initialize Industry-Grade Base State (Cycle-Aware)
  let newTrade: Trade = {
    id: tradeId,
    accountId,
    userId,
    createdBy: userId,
    updatedBy: userId,
    
    symbol: tradeData.symbol?.toUpperCase() || "UNKNOWN",
    direction: tradeData.direction || "LONG", 
    assetClass: tradeData.assetClass || "STOCK",
    status: "OPEN",
    
    // 📦 Position State
    netQuantity: 0,
    plannedQuantity: 0, 
    peakQuantity: 0,
    avgEntryPrice: 0,
    avgExitPrice: 0,
    totalExitQuantity: 0,
    totalExitValue: 0,
    investedAmount: 0,
    peakInvested: 0,
    
    // 💰 Financials
    totalBuyValue: 0,
    totalSellValue: 0,
    grossPnl: 0,
    realizedPnl: 0,
    totalFees: 0,
    netPnl: 0,
    returnPercent: 0,
    totalExecutions: 0,
    
    // 🎯 Risk Plan
    initialStopLoss: tradeData.initialStopLoss ? Number(tradeData.initialStopLoss) : undefined,
    originalStopLoss: tradeData.initialStopLoss ? Number(tradeData.initialStopLoss) : undefined,
    takeProfitTarget: tradeData.takeProfitTarget ? Number(tradeData.takeProfitTarget) : undefined,
    riskAmount: 0,
    riskMultiple: 0,
    strategyId: tradeData.strategyId || null,

    // Meta
    tags: tradeData.tags || [],
    screenshots: tradeData.screenshots || [],
    notes: tradeData.notes || "",
    source: "MANUAL",
    entryDate: toTimestamp(tradeData.entryDate),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  // 2. ⚡ PROCESS INITIAL EXECUTIONS
  const initialExecutions: Execution[] = [];
  
  if (tradeData.executions && Array.isArray(tradeData.executions)) {
      tradeData.executions.forEach((execData: any) => {
          const execRef = doc(collection(db, "temp")); 
          const exec: Execution = {
              id: execRef.id, 
              tradeId,
              userId,
              accountId,
              date: toTimestamp(execData.date),
              side: execData.side,
              price: Number(execData.price) || 0,
              quantity: Number(execData.quantity) || 0,
              fees: Number(execData.fees) || 0,
              expectedPrice: execData.expectedPrice ? Number(execData.expectedPrice) : undefined,
              notes: execData.notes || ""
          };
          
          initialExecutions.push(exec);

          // 🧮 Iteratively run calculations to build state
          const updates = runTradeCalculations(newTrade, exec);
          newTrade = { ...newTrade, ...updates } as Trade;
      });
  }

  // 3. Atomic Write
  try {
    await runTransaction(db, async (transaction) => {
      // Set Trade with sanitization
      transaction.set(tradeRef, sanitize(newTrade));

      // Set Executions with sanitization
      initialExecutions.forEach(exec => {
          const eRef = doc(collection(db, ROOT_COLLECTION, tradeId, "executions"), exec.id);
          transaction.set(eRef, sanitize(exec));
      });
      
      const cashImpact = newTrade.netPnl; 

      if (Math.abs(cashImpact) > 0.001) {
          const accountRef = doc(db, "accounts", accountId);
          const ledgerRef = doc(collection(db, "accounts", accountId, "ledger"));
          
          transaction.update(accountRef, {
              balance: increment(cashImpact),
              updatedAt: serverTimestamp()
          });

          transaction.set(ledgerRef, sanitize({
              id: ledgerRef.id,
              accountId,
              userId,
              type: cashImpact > 0 ? "PROFIT" : "LOSS",
              amount: Math.abs(cashImpact),
              description: `Initial Fill: ${newTrade.symbol}`,
              date: Timestamp.now()
          }));
      }

      logActivityInTransaction(
        transaction, accountId, userId, "CREATE", "TRADE", tradeId, 
        `Trade Opened: ${newTrade.symbol} (${newTrade.direction})`,
        { symbol: newTrade.symbol, netPnl: newTrade.netPnl }
      );
    });
    return newTrade;
  } catch (error) {
    console.error("Create trade failed:", error);
    throw error;
  }
};

/**
 * ⚡ Add Execution
 */
export const addExecution = async (tradeId: string, userId: string, execData: Partial<Execution>) => {
  const tradeRef = doc(db, ROOT_COLLECTION, tradeId);
  const execRef = doc(collection(tradeRef, "executions"));

  await runTransaction(db, async (transaction) => {
    const tradeSnap = await transaction.get(tradeRef);
    if (!tradeSnap.exists()) throw new Error("Trade not found");
    const currentTrade = tradeSnap.data() as Trade;
    const accountId = currentTrade.accountId;

    const newExec: Execution = sanitize({
      id: execRef.id,
      tradeId,
      userId,
      accountId,
      date: toTimestamp(execData.date),
      side: execData.side || "BUY",
      price: Number(execData.price) || 0,
      quantity: Number(execData.quantity) || 0,
      fees: Number(execData.fees) || 0,
      expectedPrice: execData.expectedPrice ? Number(execData.expectedPrice) : undefined,
      notes: execData.notes || "",
    });

    const updates = runTradeCalculations(currentTrade, newExec);

    transaction.set(execRef, newExec);
    transaction.update(tradeRef, sanitize({
        ...updates,
        updatedBy: userId,
        updatedAt: serverTimestamp()
    }));

    const balanceImpact = (updates.netPnl || 0) - (currentTrade.netPnl || 0);

    if (Math.abs(balanceImpact) > 0.001 && accountId) {
        const accountRef = doc(db, "accounts", accountId);
        const ledgerRef = doc(collection(db, "accounts", accountId, "ledger"));

        transaction.update(accountRef, { balance: increment(balanceImpact), updatedAt: serverTimestamp() });

        transaction.set(ledgerRef, sanitize({
            id: ledgerRef.id,
            accountId,
            userId,
            type: balanceImpact > 0 ? "PROFIT" : "LOSS",
            amount: Math.abs(balanceImpact),
            description: `Execution Added: ${currentTrade.symbol}`,
            date: Timestamp.now()
        }));
    }

    logActivityInTransaction(transaction, accountId, userId, "CREATE", "EXECUTION", newExec.id, 
        `Filled ${newExec.quantity} @ ${newExec.price} on ${currentTrade.symbol}`,
        { price: newExec.price, qty: newExec.quantity }
    );
  });
};

/**
 * 🟡 Update Trade Plan
 * Recalculates metrics based on frozen risk model.
 */
export const updateTrade = async (
  tradeId: string, 
  accountId: string, 
  userId: string, 
  oldTrade: Trade, 
  updates: Partial<Trade>
) => {
  const ref = doc(db, ROOT_COLLECTION, tradeId);
  
  let riskUpdates = {};
  if (updates.initialStopLoss || updates.takeProfitTarget) {
      const mergedTrade = { ...oldTrade, ...updates };
      
      // 🛡️ Ensure originalStopLoss is captured if this is the first edit
      if (!mergedTrade.originalStopLoss && mergedTrade.initialStopLoss) {
        mergedTrade.originalStopLoss = mergedTrade.initialStopLoss;
      }

      riskUpdates = calculateRiskMetrics(
        mergedTrade, 
        mergedTrade.netPnl || 0, 
        mergedTrade.plannedQuantity || 0,
        mergedTrade.avgEntryPrice || 0,
        mergedTrade.peakInvested || 0
      );
  }

  const finalUpdates = sanitize({
      ...updates,
      ...riskUpdates,
      updatedBy: userId, 
      updatedAt: serverTimestamp() 
  });

  await runTransaction(db, async (t) => {
      t.update(ref, finalUpdates);
      logActivityInTransaction(t, accountId, userId, "UPDATE", "TRADE", tradeId, 
        `Plan Revised: ${oldTrade.symbol}`, updates
      );
  });
};

/**
 * 🔴 Delete Trade
 */
export const deleteTrade = async (trade: Trade, userId: string) => {
  const tradeRef = doc(db, ROOT_COLLECTION, trade.id);
  const accountId = trade.accountId;
  const execsRef = collection(db, ROOT_COLLECTION, trade.id, "executions");
  const execsSnap = await getDocs(execsRef);

  await runTransaction(db, async (transaction) => {
    transaction.delete(tradeRef);
    execsSnap.docs.forEach(doc => transaction.delete(doc.ref));

    const reverseAmount = (trade.netPnl || 0) * -1; 
    
    if (Math.abs(reverseAmount) > 0.001) {
       const accountRef = doc(db, "accounts", accountId);
       const ledgerRef = doc(collection(db, "accounts", accountId, "ledger"));
       
       transaction.update(accountRef, { balance: increment(reverseAmount), updatedAt: serverTimestamp() });
       
       transaction.set(ledgerRef, sanitize({
           id: ledgerRef.id, accountId, userId,
           type: reverseAmount > 0 ? "PROFIT" : "LOSS",
           amount: Math.abs(reverseAmount),
           description: `Trade Deletion Reversal: ${trade.symbol}`,
           date: Timestamp.now()
       }));
    }

    logActivityInTransaction(transaction, accountId, userId, "DELETE", "TRADE", trade.id, `Trade Deleted: ${trade.symbol}`);
  });
};

/**
 * 📖 GET TRADES (PAGINATED)
 */
export const getTrades = async (
  accountId: string, 
  pageSize: number = 50, 
  lastDoc: QueryDocumentSnapshot | null = null
): Promise<PaginatedTrades> => {
  if (!accountId) return { data: [], lastDoc: null, totalCount: 0 };

  const tradesRef = collection(db, ROOT_COLLECTION);
  
  // 1. Base Query: Only this account, Sorted by Date
  let q = query(
    tradesRef, 
    where("accountId", "==", accountId), 
    orderBy("entryDate", "desc"),
    limit(pageSize)
  );

  // 2. Apply Cursor if fetching next page
  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }

  // 3. Fetch Data Page
  const snapshot = await getDocs(q);
  const trades = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Trade));

  // 4. Fetch Total Count (Ideally cached, but fetching here for MVP correctness)
  const countQuery = query(tradesRef, where("accountId", "==", accountId));
  const countSnapshot = await getCountFromServer(countQuery);
  const totalCount = countSnapshot.data().count;

  return {
    data: trades,
    lastDoc: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null,
    totalCount
  };
};

// ------------------------------------------------------------------
// 📊 DASHBOARD ANALYTICS SERVICES (NEW)
// ------------------------------------------------------------------

/**
 * 1. Fetch Trades in a Date Range (for 1M, 3M, YTD views)
 */
export const getTradesInRange = async (
  accountId: string, 
  startDate: Date, 
  endDate: Date,
  filters?: { strategyId?: string; assetClass?: string; tags?: string[] }
) => {
  const tradesRef = collection(db, ROOT_COLLECTION);
  
  let q = query(
    tradesRef,
    where("accountId", "==", accountId),
    where("entryDate", ">=", Timestamp.fromDate(startDate)),
    where("entryDate", "<=", Timestamp.fromDate(endDate))
  );

  if (filters?.strategyId && filters.strategyId !== "all") {
    q = query(q, where("strategyId", "==", filters.strategyId));
  }
  if (filters?.assetClass && filters.assetClass !== "all") {
    q = query(q, where("assetClass", "==", filters.assetClass));
  }
  if (filters?.tags && filters.tags.length > 0 && !filters.tags.includes("all")) {
    q = query(q, where("tags", "array-contains-any", filters.tags));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Trade));
};

/**
 * 2. Server-Side Aggregation for ALL TIME (Robust Fallback for Dev Mode)
 * Tries aggressive server aggregation first. If index missing, falls back to memory.
 */
export const getAggregatedStatsALL = async (
  accountId: string,
  filters?: { strategyId?: string; assetClass?: string; tags?: string[] }
) => {
  const tradesRef = collection(db, ROOT_COLLECTION);
  
  const buildQuery = (extraConstraints: any[] = []) => {
    let q = query(tradesRef, where("accountId", "==", accountId), ...extraConstraints);
    
    if (filters?.strategyId && filters.strategyId !== "all") {
      q = query(q, where("strategyId", "==", filters.strategyId));
    }
    if (filters?.assetClass && filters.assetClass !== "all") {
      q = query(q, where("assetClass", "==", filters.assetClass));
    }
    if (filters?.tags && filters.tags.length > 0 && !filters.tags.includes("all")) {
        q = query(q, where("tags", "array-contains-any", filters.tags));
    }
    return q;
  };

  try {
    // Attempt 1: Server-Side Aggregation (Fast, Cheap)
    // This WILL fail if indexes are missing (standard in dev mode until deployed)
    const winnersQuery = buildQuery([where("netPnl", ">", 0)]);
    const losersQuery = buildQuery([where("netPnl", "<", 0)]);
    const breakevenQuery = buildQuery([where("netPnl", "==", 0)]);

    const [winSnap, lossSnap, breakSnap] = await Promise.all([
      getAggregateFromServer(winnersQuery, {
        totalPnl: sum("netPnl"),
        count: count()
      }),
      getAggregateFromServer(losersQuery, {
        totalPnl: sum("netPnl"),
        count: count()
      }),
      getAggregateFromServer(breakevenQuery, {
        count: count()
      })
    ]);

    return {
      grossProfit: winSnap.data().totalPnl || 0,
      grossLoss: Math.abs(lossSnap.data().totalPnl || 0),
      winningTrades: winSnap.data().count || 0,
      losingTrades: lossSnap.data().count || 0,
      breakEvenTrades: breakSnap.data().count || 0
    };

  } catch (error: any) {
    // ⚠️ FALLBACK: Client-Side Aggregation (Safe for Dev Mode)
    // If index is missing, we fetch all trades (up to reasonable limit) and sum locally.
    // This ensures the UI works immediately while you configure indexes.
    console.warn("Aggregation Index Missing - Falling back to Client Calc:", error.message);
    
    // We limit to 2000 to prevent browser crash if account is huge
    const fallbackQ = buildQuery([limit(2000)]); 
    const snapshot = await getDocs(fallbackQ);
    
    let grossProfit = 0;
    let grossLoss = 0;
    let winningTrades = 0;
    let losingTrades = 0;
    let breakEvenTrades = 0;

    snapshot.docs.forEach(doc => {
      const pnl = doc.data().netPnl || 0;
      if (pnl > 0) {
        grossProfit += pnl;
        winningTrades++;
      } else if (pnl < 0) {
        grossLoss += Math.abs(pnl);
        losingTrades++;
      } else {
        breakEvenTrades++;
      }
    });

    return { grossProfit, grossLoss, winningTrades, losingTrades, breakEvenTrades };
  }
};

export const getTradeById = async (tradeId: string) => {
  const snap = await getDoc(doc(db, ROOT_COLLECTION, tradeId));
  return snap.exists() ? (snap.data() as Trade) : null;
};

export const getTradeExecutions = async (tradeId: string) => {
  const q = query(collection(db, ROOT_COLLECTION, tradeId, "executions"), orderBy("date", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Execution);
};