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
  increment 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Trade, Execution } from "@/types/trade";
import { AccountTransaction } from "@/types/account";
import { runTradeCalculations, calculateRiskMetrics } from "@/lib/financialMath";
import { logActivityInTransaction } from "./auditService";

const ROOT_COLLECTION = "trades";

// 🛡️ Helper: Ensure Date is always Firestore Timestamp
const toTimestamp = (date: any): Timestamp => {
  if (!date) return Timestamp.now();
  if (date instanceof Timestamp) return date;
  if (date instanceof Date) return Timestamp.fromDate(date);
  return Timestamp.now();
};

// --- 🔌 PUBLIC API ---

/**
 * 🟢 Create Trade
 * Handles creating a trade AND processing its initial executions atomically.
 * Ensures metrics are calculated immediately.
 */
export const createTrade = async (accountId: string, userId: string, tradeData: any) => {
  if (!accountId) throw new Error("Workspace context missing.");

  const collectionRef = collection(db, ROOT_COLLECTION);
  const tradeRef = doc(collectionRef);
  const tradeId = tradeRef.id;

  // 1. Initialize Base State (Zeroed)
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
    
    // Financials (Start at 0)
    netQuantity: 0,
    initialQuantity: 0, // ✅ CRITICAL: Start at 0 for risk calc
    avgEntryPrice: 0,
    avgExitPrice: 0,
    totalExecutions: 0,
    investedAmount: 0,
    grossPnl: 0,
    totalFees: 0,
    netPnl: 0,
    returnPercent: 0,
    riskAmount: 0,
    riskMultiple: 0,
    
    // Meta
    tags: tradeData.tags || [],
    screenshots: tradeData.screenshots || [],
    notes: tradeData.notes || "",
    source: "MANUAL",
    entryDate: toTimestamp(tradeData.entryDate),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    
    // Risk Plan
    initialStopLoss: tradeData.initialStopLoss ? Number(tradeData.initialStopLoss) : undefined,
    takeProfitTarget: tradeData.takeProfitTarget ? Number(tradeData.takeProfitTarget) : undefined,
    strategyId: tradeData.strategyId || null,
  };

  // 2. ⚡ PROCESS INITIAL EXECUTIONS
  // We must calculate the state based on the provided executions immediately.
  const initialExecutions: Execution[] = [];
  
  if (tradeData.executions && Array.isArray(tradeData.executions)) {
      tradeData.executions.forEach((execData: any) => {
          // Create Execution Object
          const execRef = doc(collection(db, "temp")); // Generate ID
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
              notes: execData.notes || ""
          };
          
          initialExecutions.push(exec);

          // 🧮 RUN THE MATH ENGINE ITERATIVELY
          // This updates PnL, Avg Price, and initialQuantity
          const updates = runTradeCalculations(newTrade, exec);
          newTrade = { ...newTrade, ...updates };
      });
  }

  // 3. Atomic Write (Trade + Executions + Balance + Ledger + Audit)
  try {
    await runTransaction(db, async (transaction) => {
      // A. Write Trade Doc
      transaction.set(tradeRef, newTrade);

      // B. Write Execution Sub-Docs
      initialExecutions.forEach(exec => {
          const execRef = doc(collection(db, ROOT_COLLECTION, tradeId, "executions"), exec.id);
          transaction.set(execRef, exec);
      });
      
      // C. Update Account Balance (If PnL/Fees exist)
      const cashImpact = (newTrade.netPnl || 0); 

      if (Math.abs(cashImpact) > 0) {
          const accountRef = doc(db, "accounts", accountId);
          const ledgerRef = doc(collection(db, "accounts", accountId, "ledger"));
          
          transaction.update(accountRef, {
              balance: increment(cashImpact),
              updatedAt: serverTimestamp()
          });

          // Create Ledger Entry
          transaction.set(ledgerRef, {
              id: ledgerRef.id,
              accountId,
              userId,
              type: cashImpact > 0 ? "PROFIT" : "LOSS",
              amount: Math.abs(cashImpact),
              description: `Trade ${newTrade.symbol} (Initial)`,
              date: Timestamp.now()
          });
      }

      // D. Audit Log
      logActivityInTransaction(
        transaction, accountId, userId, "CREATE", "TRADE", tradeId, 
        `Opened ${newTrade.symbol} with ${initialExecutions.length} executions`,
        { symbol: newTrade.symbol }
      );
    });
    return newTrade;
  } catch (error) {
    console.error("Create trade failed:", error);
    throw error;
  }
};

/**
 * ⚡ Add Execution (The Core Engine)
 * 1. Writes Execution
 * 2. Recalculates Parent Trade
 * 3. Updates Account Balance
 * 4. Logs Audit
 */
export const addExecution = async (tradeId: string, userId: string, execData: Partial<Execution>) => {
  const tradeRef = doc(db, ROOT_COLLECTION, tradeId);
  const execRef = doc(collection(tradeRef, "executions"));

  await runTransaction(db, async (transaction) => {
    // 1. Fetch Parent Trade
    const tradeSnap = await transaction.get(tradeRef);
    if (!tradeSnap.exists()) throw new Error("Trade not found");
    const currentTrade = tradeSnap.data() as Trade;
    const accountId = currentTrade.accountId;

    // 2. Prepare New Execution
    const newExec: any = {
      id: execRef.id,
      tradeId,
      userId,
      accountId,
      date: toTimestamp(execData.date),
      side: execData.side || "BUY",
      price: Number(execData.price) || 0,
      quantity: Number(execData.quantity) || 0,
      fees: Number(execData.fees) || 0,
      notes: execData.notes || "",
      ...execData
    };

    // 3. 🧮 RUN CALCULATIONS
    const updates = runTradeCalculations(currentTrade, newExec);

    // 4. Write Updates
    transaction.set(execRef, newExec);
    transaction.update(tradeRef, {
        ...updates,
        updatedBy: userId,
        updatedAt: serverTimestamp()
    });

    // 5. 💰 Account Sync Logic
    const oldNetPnl = currentTrade.netPnl || 0;
    const newNetPnl = updates.netPnl || 0;
    const balanceImpact = newNetPnl - oldNetPnl;

    if (Math.abs(balanceImpact) > 0.001 && accountId) {
        const accountRef = doc(db, "accounts", accountId);
        const ledgerRef = doc(collection(db, "accounts", accountId, "ledger"));

        transaction.update(accountRef, {
            balance: increment(balanceImpact),
            updatedAt: serverTimestamp()
        });

        const type = balanceImpact > 0 ? "PROFIT" : "LOSS";
        const ledgerEntry: AccountTransaction = {
            id: ledgerRef.id,
            accountId,
            userId,
            type: type as any,
            amount: Math.abs(balanceImpact),
            description: `Exec: ${currentTrade.symbol} ${newExec.side}`,
            date: Timestamp.now()
        };
        transaction.set(ledgerRef, ledgerEntry);
    }

    // 6. Audit
    logActivityInTransaction(
        transaction, accountId, userId, "CREATE", "EXECUTION", newExec.id, 
        `Filled ${newExec.quantity} @ ${newExec.price} on ${currentTrade.symbol}`,
        { price: newExec.price, qty: newExec.quantity }
    );
  });
};

/**
 * 🔵 Get Trades
 */
export const getTrades = async (accountId: string) => {
  if (!accountId) return [];
  try {
    const q = query(
      collection(db, ROOT_COLLECTION),
      where("accountId", "==", accountId),
      orderBy("entryDate", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Trade));
  } catch (error) {
    console.error("Fetch trades error:", error);
    return [];
  }
};

/**
 * 🟡 Update Trade Metadata
 * 🔥 NOW RECALCULATES RISK METRICS IF PLAN CHANGES
 */
export const updateTrade = async (
  tradeId: string, 
  accountId: string, 
  userId: string, 
  oldTrade: Trade, 
  updates: Partial<Trade>
) => {
  const ref = doc(db, ROOT_COLLECTION, tradeId);
  
  // 🛡️ Recalculate Risk Metrics if SL/TP changes
  let riskUpdates = {};
  if (updates.initialStopLoss || updates.takeProfitTarget) {
     const mergedTrade = { ...oldTrade, ...updates };
     
     // Re-run JUST the risk calc part using existing PnL/Qty
     riskUpdates = calculateRiskMetrics(
       mergedTrade, 
       mergedTrade.netPnl || 0, 
       mergedTrade.initialQuantity || 0, // Use the persisted Max Size
       mergedTrade.avgEntryPrice || 0
     );
  }

  const finalUpdates = {
     ...updates,
     ...riskUpdates,
     updatedBy: userId, 
     updatedAt: serverTimestamp() 
  };

  await runTransaction(db, async (t) => {
     t.update(ref, finalUpdates);
     
     logActivityInTransaction(
       t, accountId, userId, "UPDATE", "TRADE", tradeId, 
       `Updated plan for ${oldTrade.symbol}`, updates
     );
  });
};

/**
 * 🔴 Delete Trade
 * 🔥 NOW REVERSES BALANCE IMPACT
 */
export const deleteTrade = async (trade: Trade, userId: string) => {
  const tradeRef = doc(db, ROOT_COLLECTION, trade.id);
  const accountId = trade.accountId;
  
  // Fetch sub-collections first
  const execsRef = collection(db, ROOT_COLLECTION, trade.id, "executions");
  const execsSnap = await getDocs(execsRef);

  await runTransaction(db, async (transaction) => {
    // 1. Delete Trade & Executions
    transaction.delete(tradeRef);
    execsSnap.docs.forEach(doc => transaction.delete(doc.ref));

    // 2. 💰 REVERSE BALANCE IMPACT
    const reverseAmount = (trade.netPnl || 0) * -1; // Invert PnL
    
    if (Math.abs(reverseAmount) > 0.001) {
       const accountRef = doc(db, "accounts", accountId);
       const ledgerRef = doc(collection(db, "accounts", accountId, "ledger"));
       
       transaction.update(accountRef, {
           balance: increment(reverseAmount),
           updatedAt: serverTimestamp()
       });
       
       // Log Reversal in Ledger
       transaction.set(ledgerRef, {
           id: ledgerRef.id,
           accountId,
           userId,
           type: reverseAmount > 0 ? "PROFIT" : "LOSS", // Logic: if I lost -100, reversal is +100 (Profit)
           amount: Math.abs(reverseAmount),
           description: `Reversal: Trade ${trade.symbol} Deleted`,
           date: Timestamp.now()
       });
    }

    // 3. Audit
    logActivityInTransaction(
        transaction, accountId, userId, "DELETE", "TRADE", trade.id, 
        `Deleted trade ${trade.symbol}`
    );
  });
};

// --- Helpers ---

export const getTradeById = async (tradeId: string) => {
  const snap = await getDoc(doc(db, ROOT_COLLECTION, tradeId));
  return snap.exists() ? (snap.data() as Trade) : null;
};

export const getTradeExecutions = async (tradeId: string) => {
  const q = query(
    collection(db, ROOT_COLLECTION, tradeId, "executions"), 
    orderBy("date", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Execution);
};