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
  writeBatch
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Trade, Execution, TradeDirection, ExecutionSide, TradeStatus } from "@/types/trade";

// --- 🧠 CORE LOGIC: The P&L Calculator ---
// This runs inside the transaction to ensure math never drifts.
// It keeps the Parent Trade in sync with its Child Executions.
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
    // Formula: ((OldQty * OldAvg) + (NewQty * NewPrice)) / TotalQty
    const totalValue = (netQty * avgEntry) + (newExec.quantity * newExec.price);
    netQty += newExec.quantity;
    // Avoid division by zero
    avgEntry = netQty > 0 ? totalValue / netQty : 0;
  } else {
    // --- EXIT LOGIC (Realized PnL) ---
    // FIFO approximation: PnL = (ExitPrice - EntryPrice) * Qty
    const priceDiff = currentTrade.direction === "LONG" 
      ? newExec.price - avgEntry 
      : avgEntry - newExec.price;
      
    realizedPnl += priceDiff * newExec.quantity;
    netQty -= newExec.quantity;
    
    // Safety clamp: Quantity shouldn't go negative unless flipping position
    // (For this version, we assume simple open/close logic)
    if (netQty < 0) netQty = 0; 
  }

  // 2. Determine Status
  // If net quantity hits 0, the trade is effectively closed
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
 * Call this when the user clicks "New Trade" or "Import".
 */
export const createTrade = async (userId: string, tradeData: Partial<Trade>) => {
  // Auto-generate ID so we can return it immediately
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
    
    // Initial Stats (Zeroed out)
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
    ...tradeData // Override with any passed data
  };

  await setDoc(tradeRef, newTrade);
  return newTrade;
};

/**
 * The Engine: Adds an execution and updates the Trade parent.
 * USES TRANSACTIONS: If one fails, all fail. 100% Data Integrity.
 */
export const addExecution = async (userId: string, tradeId: string, execData: Partial<Execution>) => {
  const tradeRef = doc(db, "users", userId, "trades", tradeId);
  const execRef = doc(collection(tradeRef, "executions"));

  await runTransaction(db, async (transaction) => {
    // 1. Read Parent Trade (Must be inside transaction for safety)
    const tradeSnap = await transaction.get(tradeRef);
    if (!tradeSnap.exists()) throw new Error("Trade not found");

    const currentTrade = tradeSnap.data() as Trade;
    
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

    // 4. Commit All Changes Atomically
    transaction.set(execRef, newExec);
    transaction.update(tradeRef, updates);
  });
};

/**
 * Fetches the most recent trades for the Dashboard.
 * Optimized for speed (Limit 50).
 */
export const getRecentTrades = async (userId: string, count = 50) => {
  const tradesRef = collection(db, "users", userId, "trades");
  // Index required: openDate DESC
  const q = query(tradesRef, orderBy("openDate", "desc"), limit(count));
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as Trade);
};

/**
 * Fetches a single trade with all its details.
 */
export const getTradeById = async (userId: string, tradeId: string) => {
  const tradeRef = doc(db, "users", userId, "trades", tradeId);
  const snap = await getDoc(tradeRef);
  return snap.exists() ? (snap.data() as Trade) : null;
};

/**
 * Fetches all executions for a specific trade.
 * Used when viewing the "Trade Details" page (Deep Dive).
 */
export const getTradeExecutions = async (userId: string, tradeId: string) => {
  const execsRef = collection(db, "users", userId, "trades", tradeId, "executions");
  const q = query(execsRef, orderBy("date", "asc"));
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as Execution);
};

/**
 * Deletes a trade and all its executions (Batch Delete).
 * Firestore doesn't cascade delete automatically, so we handle it here.
 */
export const deleteTrade = async (userId: string, tradeId: string) => {
  // 1. Get all executions first
  const execs = await getTradeExecutions(userId, tradeId);
  
  const batch = writeBatch(db);
  
  // 2. Queue execution deletions
  execs.forEach(exec => {
    const ref = doc(db, "users", userId, "trades", tradeId, "executions", exec.id);
    batch.delete(ref);
  });
  
  // 3. Queue parent trade deletion
  const tradeRef = doc(db, "users", userId, "trades", tradeId);
  batch.delete(tradeRef);
  
  // 4. Commit batch
  await batch.commit();
};