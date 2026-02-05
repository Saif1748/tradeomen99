import { Timestamp } from "firebase/firestore";

// --- 1. Roles & Permissions ---
export type AccountRole = "OWNER" | "EDITOR" | "VIEWER";

export interface AccountMember {
  uid: string;
  email: string;
  role: AccountRole;
  joinedAt: Timestamp;
}

// --- 2. Financial Types (✅ New) ---
export type TransactionType = "DEPOSIT" | "WITHDRAWAL" | "ADJUSTMENT";

export interface CashTransaction {
  id: string;
  type: TransactionType;
  amount: number;       // The magnitude of the transaction (e.g. 1000)
  description?: string; // e.g. "Initial Deposit", "Monthly Withdrawal"
  date: Timestamp;
  accountId: string;
  userId: string;       // The user who performed the action
}

// --- 3. The Account (Workspace) ---
// This acts as the "Container" for Trades, Strategies & Money.
export interface Account {
  id: string;
  name: string; // e.g. "Personal Journal", "FTMO Challenge"
  ownerId: string;
  
  // We use a Record (Map) for O(1) permission checks.
  members: Record<string, AccountMember>; 
  
  // ✅ Financials
  balance: number;        // Current Equity (Cash + Realized PnL)
  initialBalance: number; // Starting Balance (Useful for ROI calculations)
  currency: string;       // e.g. "USD", "EUR", "GBP"

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// --- 4. The User Profile ---
// This acts as the "Router" to tell the app which Accounts to load.
export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  
  // Critical for the Account Switcher logic
  activeAccountId: string | null; 
  joinedAccountIds: string[]; // List of IDs used for Firestore 'in' queries
  
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}