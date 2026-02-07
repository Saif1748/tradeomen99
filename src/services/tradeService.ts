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
  limit,
  getDoc,
  setDoc,
  deleteDoc,
  writeBatch,
  increment // ✅ Added for atomic balance updates
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Trade, Execution, TradeDirection, ExecutionSide, TradeStatus } from "@/types/trade";
import { AccountTransaction } from "@/types/account"; // ✅ Updated to match your new types

// --- 🧠 CORE LOGIC: The P&L Calculator ---
const calculateTradeStats = (
  currentTrade: Trade, 
  newExec: Execution
): Partial<Trade> => {
  const isEntry = (currentTrade.direction === "LONG" && newExec.side === "BUY") ||
                  (currentTrade.direction === "SHORT" && newExec.side === "SELL");

  let netQty = currentTrade.netQuantity;
  let avgEntry = currentTrade.avgEntryPrice;
  let realizedPnl = currentTrade.grossPnl;
  
  // 1. Accumulate Fees
  const totalFees = currentTrade.totalFees + (newExec.fees || 0);

  if (isEntry) {
    // --- ENTRY LOGIC (Weighted Average) ---
    const totalValue = (netQty * avgEntry) + (newExec.quantity * newExec.price);
    netQty += newExec.quantity;
    // Avoid division by zero
    avgEntry = netQty > 0 ? totalValue / netQty : 0;
  } else {
    // --- EXIT LOGIC (Realized PnL) ---
    const priceDiff = currentTrade.direction === "LONG" 
      ? newExec.price - avgEntry 
      : avgEntry - newExec.price;
      
    realizedPnl += priceDiff * newExec.quantity;
    netQty -= newExec.quantity;
    
    // Safety clamp
    if (netQty < 0) netQty = 0; 
  }

  // 2. Determine Status
  const status: TradeStatus = netQty <= 0 ? "CLOSED" : "OPEN";
  const closeDate = netQty <= 0 ? newExec.date : undefined;

  // 3. Return Updates
  return {
    netQuantity: netQty,
    avgEntryPrice: avgEntry,
    grossPnl: realizedPnl,
    totalFees: totalFees,
    netPnl: realizedPnl - totalFees,
    status,
    closeDate,
    updatedAt: Timestamp.now()
  };
};

// --- 🔌 PUBLIC API ---

/**
 * Creates a new empty Trade.
 * ⚠️ ARCHITECTURE UPDATE: Trades are now stored under the User's ID for this version,
 * but logically linked to an accountId.
 */
export const createTrade = async (userId: string, tradeData: Partial<Trade>) => {
  // Use the user's subcollection (Legacy/Simple Mode)
  // If you want full team sharing, this should change to `accounts/${accountId}/trades`
  const tradeRef = doc(collection(db, "users", userId, "trades"));
  
  const newTrade: Trade = {
    id: tradeRef.id,
    userId,
    // Defaults
    symbol: tradeData.symbol?.toUpperCase() || "UNKNOWN",
    direction: tradeData.direction || "LONG",
    assetClass: tradeData.assetClass || "STOCK",
    accountId: tradeData.accountId || "DEFAULT",
    status: "OPEN",
    openDate: tradeData.openDate || Timestamp.now(),
    
    // Initial Stats
    netQuantity: 0,
    avgEntryPrice: 0,
    grossPnl: 0,
    totalFees: 0,
    netPnl: 0,
    
    // Meta
    tags: [],
    screenshots: [],
    source: "MANUAL",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    ...tradeData
  };

  await setDoc(tradeRef, newTrade);
  return newTrade;
};

/**
 * The Engine: Adds an execution and updates the Trade parent.
 * USES TRANSACTIONS: If one fails, all fail. 100% Data Integrity.
 * ✅ UPDATE: Now syncs with Account Balance & Ledger
 */
export const addExecution = async (userId: string, tradeId: string, execData: Partial<Execution>) => {
  const tradeRef = doc(db, "users", userId, "trades", tradeId);
  const execRef = doc(collection(tradeRef, "executions"));

  await runTransaction(db, async (transaction) => {
    // 1. Read Parent Trade
    const tradeSnap = await transaction.get(tradeRef);
    if (!tradeSnap.exists()) throw new Error("Trade not found");

    const currentTrade = tradeSnap.data() as Trade;
    const accountId = currentTrade.accountId;
    
    // 2. Prepare New Execution
    const newExec: Execution = {
      id: execRef.id,
      tradeId,
      userId,
      date: execData.date || Timestamp.now(),
      side: execData.side || "BUY",
      price: Number(execData.price) || 0,
      quantity: Number(execData.quantity) || 0,
      fees: Number(execData.fees) || 0,
      notes: execData.notes || "",
      ...execData
    };

    // 3. Calculate New Parent State
    const updates = calculateTradeStats(currentTrade, newExec);

    // 4. Commit Trade & Execution Changes
    transaction.set(execRef, newExec);
    transaction.update(tradeRef, updates);

    // --- 5. 💰 ACCOUNT SYNC LOGIC ---
    if (accountId && accountId !== "DEFAULT") {
        const oldGrossPnl = currentTrade.grossPnl || 0;
        const newGrossPnl = updates.grossPnl || 0;
        
        // Calculate the PnL realized strictly by THIS execution
        const pnlDelta = newGrossPnl - oldGrossPnl;
        const feesPaid = newExec.fees || 0;
        
        // Net impact on account cash (PnL - Fees)
        const balanceChange = pnlDelta - feesPaid;

        if (balanceChange !== 0) {
            const accountRef = doc(db, "accounts", accountId);
            const ledgerRef = doc(collection(db, "accounts", accountId, "ledger"));

            // A. Update Balance Atomically
            transaction.update(accountRef, {
                balance: increment(balanceChange),
                updatedAt: Timestamp.now()
            });

            // B. Create Ledger Entry
            // Determine semantic type: PROFIT or LOSS
            const type = balanceChange > 0 ? "PROFIT" : "LOSS";

            const ledgerEntry: AccountTransaction = {
                id: ledgerRef.id,
                accountId,
                userId,
                type: type, 
                amount: Math.abs(balanceChange),
                description: `Trade ${currentTrade.symbol} ${newExec.side} @ ${newExec.price}`,
                date: Timestamp.now()
            };

            transaction.set(ledgerRef, ledgerEntry);
        }
    }
  });
};

/**
 * Fetches the most recent trades for the Dashboard.
 */
export const getRecentTrades = async (userId: string, count = 50) => {
  const tradesRef = collection(db, "users", userId, "trades");
  const q = query(tradesRef, orderBy("openDate", "desc"), limit(count));
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as Trade);
};

/**
 * Fetches a single trade.
 */
export const getTradeById = async (userId: string, tradeId: string) => {
  const tradeRef = doc(db, "users", userId, "trades", tradeId);
  const snap = await getDoc(tradeRef);
  return snap.exists() ? (snap.data() as Trade) : null;
};

/**
 * Fetches all executions for a specific trade.
 */
export const getTradeExecutions = async (userId: string, tradeId: string) => {
  const execsRef = collection(db, "users", userId, "trades", tradeId, "executions");
  const q = query(execsRef, orderBy("date", "asc"));
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as Execution);
};

/**
 * Deletes a trade and all its executions.
 */
export const deleteTrade = async (userId: string, tradeId: string) => {
  const execs = await getTradeExecutions(userId, tradeId);
  const batch = writeBatch(db);
  
  execs.forEach(exec => {
    const ref = doc(db, "users", userId, "trades", tradeId, "executions", exec.id);
    batch.delete(ref);
  });
  
  const tradeRef = doc(db, "users", userId, "trades", tradeId);
  batch.delete(tradeRef);
  
  await batch.commit();
};