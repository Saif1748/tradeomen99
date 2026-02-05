import { 
  collection, 
  doc, 
  runTransaction, 
  query, 
  orderBy, 
  getDocs,
  Timestamp,
  addDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CashTransaction } from "@/types/account";

// Helper to get references
const getAccountRef = (accountId: string) => doc(db, "accounts", accountId);
const getLedgerCollection = (accountId: string) => collection(db, "accounts", accountId, "ledger");

/**
 * ⚡️ CORE: Record a Deposit or Withdrawal
 * This uses a Transaction to ensure the Ledger and Account Balance 
 * update at the exact same time. No "glitches".
 */
export const recordCashMovement = async (
  accountId: string, 
  userId: string,
  data: { 
    type: "DEPOSIT" | "WITHDRAWAL"; 
    amount: number; 
    description: string 
  }
) => {
  const accountRef = getAccountRef(accountId);
  const ledgerRef = doc(getLedgerCollection(accountId));

  // Ensure positive numbers for math logic below
  const absAmount = Math.abs(data.amount);

  return await runTransaction(db, async (transaction) => {
    // 1. Read current account state
    const accountDoc = await transaction.get(accountRef);
    if (!accountDoc.exists()) throw new Error("Account not found");

    const currentData = accountDoc.data();
    const currentBalance = currentData.balance || 0;
    
    // 2. Calculate New Balance
    let newBalance = currentBalance;
    
    if (data.type === "DEPOSIT") {
      newBalance += absAmount;
    } else {
      // Optional: Prevent negative balance?
      // if (currentBalance < absAmount) throw new Error("Insufficient funds");
      newBalance -= absAmount;
    }

    // 3. Create the Ledger Entry ( The "Execution" )
    const transactionRecord: CashTransaction = {
      id: ledgerRef.id,
      accountId,
      userId,
      type: data.type,
      amount: absAmount,
      description: data.description,
      date: Timestamp.now(),
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
  return snap.docs.map(d => d.data() as CashTransaction);
};

/**
 * Get realtime balance (Optional helper, usually avail on Account object)
 */
export const getAccountBalance = async (accountId: string) => {
  const accountRef = getAccountRef(accountId);
  // We don't need a transaction just to read
  const snap = await getDocs(query(collection(db, "accounts"), orderBy("updatedAt", "desc"))); 
  // Better to just get the doc:
  // Note: Usually you get this from useWorkspace context, not a separate call
};