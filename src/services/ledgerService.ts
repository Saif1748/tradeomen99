import { 
  collection, 
  doc, 
  runTransaction, 
  query, 
  orderBy, 
  getDocs,
  getDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AccountTransaction, TransactionType } from "@/types/account";

// Helper to get references
const getAccountRef = (accountId: string) => doc(db, "accounts", accountId);
const getLedgerCollection = (accountId: string) => collection(db, "accounts", accountId, "ledger");

/**
 * ⚡️ CORE: Record a Deposit, Withdrawal, or Adjustment
 * Uses a Transaction to ensure Ledger and Balance update atomically.
 */
export const recordCashMovement = async (
  accountId: string, 
  userId: string,
  data: { 
    type: "DEPOSIT" | "WITHDRAWAL" | "ADJUSTMENT"; 
    amount: number; 
    description: string 
  }
) => {
  const accountRef = getAccountRef(accountId);
  const ledgerRef = doc(getLedgerCollection(accountId));

  // Ensure positive numbers for magnitude, handle sign logic below
  const absAmount = Math.abs(data.amount);

  return await runTransaction(db, async (transaction) => {
    // 1. Read current account state
    const accountDoc = await transaction.get(accountRef);
    if (!accountDoc.exists()) throw new Error("Account not found");

    const currentData = accountDoc.data();
    const currentBalance = currentData.balance || 0;
    
    // 2. Calculate New Balance
    let newBalance = currentBalance;
    
    // Logic: 
    // - DEPOSIT: Always Add
    // - WITHDRAWAL: Always Subtract
    // - ADJUSTMENT: Add if positive input, Subtract if negative (handled by passed amount sign)
    //   But since we use absAmount, let's stick to explicit type logic:
    
    if (data.type === "DEPOSIT") {
      newBalance += absAmount;
    } else if (data.type === "WITHDRAWAL") {
      newBalance -= absAmount;
    } else if (data.type === "ADJUSTMENT") {
      // For adjustment, we trust the sign of the original input
      newBalance += data.amount; 
    }

    // 3. Create the Ledger Entry
    const transactionRecord: AccountTransaction = {
      id: ledgerRef.id,
      accountId,
      userId,
      type: data.type,
      amount: absAmount,
      description: data.description,
      date: Timestamp.now(),
      // status: 'completed' // implicitly completed
    };

    transaction.set(ledgerRef, transactionRecord);

    // 4. Update the Account Balance
    transaction.update(accountRef, {
      balance: newBalance,
      updatedAt: Timestamp.now()
    });

    return newBalance;
  });
};

/**
 * Fetch the history of money movements
 */
export const getAccountLedger = async (accountId: string) => {
  const q = query(
    getLedgerCollection(accountId), 
    orderBy("date", "desc")
  );
  
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as AccountTransaction);
};

/**
 * Get realtime balance
 */
export const getAccountBalance = async (accountId: string) => {
  const accountRef = getAccountRef(accountId);
  const snap = await getDoc(accountRef);
  
  if (snap.exists()) {
    return snap.data().balance as number;
  }
  return 0;
};