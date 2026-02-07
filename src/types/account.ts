import { Timestamp } from "firebase/firestore";

// --- 1. Enums & Unions ---
export type AccountRole = "OWNER" | "EDITOR" | "VIEWER";
export type AccountType = "personal" | "business" | "demo"; 
export type TransactionType = "DEPOSIT" | "WITHDRAWAL" | "ADJUSTMENT" | "PROFIT" | "LOSS";
export type InvitationStatus = "pending" | "accepted" | "rejected"; 

// --- 2. Member Interface ---
export interface AccountMember {
  uid: string;
  email: string;
  role: AccountRole;
  joinedAt: Timestamp;
  // Optional denormalized data for UI speed
  displayName?: string; 
  photoURL?: string;
}

// --- 3. Transaction Interface ---
export interface AccountTransaction {
  id: string;
  type: TransactionType;
  amount: number;       // The magnitude (always positive)
  description?: string; // Notes/Memo
  date: Timestamp;      // Firestore Timestamp
  accountId: string;
  userId: string;       // Who performed it
  // Computed/Frontend only
  status?: 'completed' | 'pending' | 'failed'; 
}

// --- 4. The Account (Workspace) ---
export interface Account {
  id: string;
  name: string; 
  type?: AccountType; // Optional, defaults to 'personal' if missing
  ownerId: string;
  
  // ✅ CRITICAL ADDITION FOR ROBUSTNESS
  // A simple array of UIDs ["uid1", "uid2"] used strictly for 
  // high-performance 'array-contains' queries and Security Rules.
  // This acts as the "Source of Truth" for access.
  memberIds: string[]; 
  
  // O(1) Lookup Map for Role Checks: { "uid123": { role: "OWNER", ... } }
  members: Record<string, AccountMember>; 
  
  // Financials
  balance: number;        
  initialBalance: number; 
  currency: string;       

  // Meta
  isDefault?: boolean; // Useful for UI highlighting
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// --- 5. User Profile ---
export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  
  // Navigation State
  // Note: We still keep this to know which account user *last visited*,
  // but we no longer rely on 'joinedAccountIds' for permission checks.
  activeAccountId: string | null; 
  joinedAccountIds: string[]; 
  
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// --- 6. Invitations ---
export interface Invitation {
  id: string;
  accountId: string;
  accountName: string; // Denormalized for UI
  inviterId: string;   // Who sent it
  email: string;       // Who is invited
  role: AccountRole;
  status: InvitationStatus;
  createdAt: Timestamp;
}