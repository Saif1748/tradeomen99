import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  documentId,
  Timestamp,
  runTransaction,
  arrayUnion,
  serverTimestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Account, AccountMember, UserProfile } from "@/types/account";

// --- Constants ---
const FIRESTORE_BATCH_LIMIT = 30; // Firestore 'in' query limit

// --- Helper: Chunk Array for Batching ---
const chunkArray = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

/**
 * 🔒 Create Account (Robust & Atomic)
 * Uses a Transaction to ensure the Account is created AND the User Profile 
 * is updated simultaneously. Fixes "Reads must come before Writes" error.
 */
export const createAccount = async (
  userId: string, 
  userEmail: string, 
  accountName: string,
  initialBalance: number = 0,
  currency: string = "USD"
) => {
  // 1. Validation
  if (!userId || !userEmail) throw new Error("Missing user credentials for account creation.");
  if (!accountName.trim()) throw new Error("Account name cannot be empty.");

  const accountRef = doc(collection(db, "accounts"));
  const userRef = doc(db, "users", userId);

  // 2. Prepare Data Objects
  // We prepare these *outside* the transaction to keep the lock time short.
  
  const newMember: AccountMember = {
    uid: userId,
    email: userEmail,
    role: "OWNER",
    joinedAt: Timestamp.now()
  };

  const newAccount: Account = {
    id: accountRef.id,
    name: accountName.trim(),
    ownerId: userId,
    members: { [userId]: newMember },
    
    // Financials
    balance: initialBalance,
    initialBalance: initialBalance,
    currency: currency,

    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  };

  try {
    // 3. Atomic Transaction
    await runTransaction(db, async (transaction) => {
      // ---------------------------------------------------------
      // STEP A: READS (MUST come first in Firestore transactions)
      // ---------------------------------------------------------
      const userDoc = await transaction.get(userRef);

      // ---------------------------------------------------------
      // STEP B: WRITES
      // ---------------------------------------------------------
      
      // 1. Create the Account Document
      transaction.set(accountRef, newAccount);

      // 2. Update or Create User Profile
      if (!userDoc.exists()) {
        // Scenario: First time user
        const newProfile: UserProfile = {
          uid: userId,
          email: userEmail,
          activeAccountId: accountRef.id,
          joinedAccountIds: [accountRef.id],
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };
        transaction.set(userRef, newProfile);
      } else {
        // Scenario: Existing user creating a 2nd account
        transaction.update(userRef, {
          joinedAccountIds: arrayUnion(accountRef.id),
          activeAccountId: accountRef.id, // Auto-switch to new account
          updatedAt: Timestamp.now()
        });
      }
    });

    return newAccount;
  } catch (error) {
    console.error("Transaction failed: ", error);
    throw new Error("Failed to create account. Please try again.");
  }
};

/**
 * 🛡️ Provision Default Account (Idempotent)
 * Checks if a user has accounts. If not, creates one.
 * Safe to call multiple times.
 */
export const provisionDefaultAccount = async (userId: string, userEmail: string) => {
  if (!userId) return;

  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    // If user exists and already has joined accounts, we are done.
    if (userSnap.exists()) {
      const userData = userSnap.data() as UserProfile;
      if (userData.joinedAccountIds?.length > 0) {
        return null; 
      }
    }

    console.log(`Provisioning default workspace for user: ${userId}`);
    return await createAccount(userId, userEmail, "Personal Journal", 0, "USD");
  } catch (error) {
    console.error("Provisioning failed:", error);
    // Don't throw here to avoid crashing the auth flow, just log it.
    return null; 
  }
};

/**
 * ⚡️ Switch Account (Optimized)
 */
export const switchUserAccount = async (userId: string, accountId: string) => {
  if (!userId || !accountId) return;
  
  const ref = doc(db, "users", userId);
  await updateDoc(ref, { 
    activeAccountId: accountId,
    updatedAt: Timestamp.now()
  });
};

/**
 * 🚀 Get User Accounts (Scalable)
 * Handles the Firestore limitation of 30 items per 'in' query
 * by chunking requests and running them in parallel.
 */
export const getUserAccounts = async (accountIds: string[]) => {
  if (!accountIds || accountIds.length === 0) return [];

  // Remove duplicates to save reads
  const uniqueIds = Array.from(new Set(accountIds));

  try {
    // 1. Chunk the IDs (Firestore limit: 30)
    const idChunks = chunkArray(uniqueIds, FIRESTORE_BATCH_LIMIT);
    
    // 2. Execute queries in parallel
    const promises = idChunks.map(chunk => {
      const q = query(collection(db, "accounts"), where(documentId(), "in", chunk));
      return getDocs(q);
    });

    const snapshots = await Promise.all(promises);

    // 3. Flatten results
    const accounts: Account[] = [];
    snapshots.forEach(snap => {
      snap.forEach(doc => {
        accounts.push(doc.data() as Account);
      });
    });

    return accounts;
  } catch (error) {
    console.error("Failed to fetch accounts:", error);
    return [];
  }
};

/**
 * 👤 Get User Profile
 */
export const getUserProfile = async (userId: string) => {
  if (!userId) return null;
  try {
    const ref = doc(db, "users", userId);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() as UserProfile : null;
  } catch (error) {
    console.error("Error fetching profile:", error);
    return null;
  }
};