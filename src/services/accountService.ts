import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  addDoc,        // ✅ Added
  deleteDoc,     // ✅ Added
  query, 
  where, 
  documentId, 
  Timestamp, 
  runTransaction, 
  arrayUnion, 
  serverTimestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Account, AccountMember, UserProfile, Invitation } from "@/types/account"; // ✅ Added Invitation

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

/**
 * ✏️ Rename Account (NEW)
 */
export const updateAccountName = async (accountId: string, newName: string) => {
  if (!newName.trim()) throw new Error("Account name cannot be empty");
  
  const ref = doc(db, "accounts", accountId);
  await updateDoc(ref, { 
    name: newName.trim(),
    updatedAt: Timestamp.now()
  });
};

/**
 * 🗑️ Delete Account (NEW)
 * Currently performs a shallow delete of the account document.
 */
export const deleteAccount = async (accountId: string) => {
  const ref = doc(db, "accounts", accountId);
  await deleteDoc(ref);
};

// =========================================================
// 💌 INVITATION SYSTEM
// =========================================================

/**
 * Send an invite to an email address
 */
export const sendInvitation = async (
  accountId: string, 
  accountName: string,
  inviterId: string, 
  email: string, 
  role: "EDITOR" | "VIEWER" = "EDITOR"
) => {
  const invitationsRef = collection(db, "invitations");
  
  // Check for existing pending invite
  const q = query(
    invitationsRef, 
    where("accountId", "==", accountId),
    where("email", "==", email),
    where("status", "==", "pending")
  );
  
  const existing = await getDocs(q);
  if (!existing.empty) throw new Error("User already invited");

  const newInvite: Omit<Invitation, "id"> = {
    accountId,
    accountName,
    inviterId,
    email,
    role,
    status: "pending",
    createdAt: Timestamp.now()
  };

  await addDoc(invitationsRef, newInvite);
};

/**
 * Get invites sent BY this account (for Owners to see pending)
 */
export const getAccountPendingInvites = async (accountId: string) => {
  const q = query(
    collection(db, "invitations"),
    where("accountId", "==", accountId),
    where("status", "==", "pending")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Invitation));
};

/**
 * Get invites received BY this user (found by their email)
 */
export const getUserInvitations = async (userEmail: string) => {
  const q = query(
    collection(db, "invitations"),
    where("email", "==", userEmail),
    where("status", "==", "pending")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Invitation));
};

/**
 * Accept an invitation:
 * 1. Add user to Account Members
 * 2. Add Account ID to User Profile
 * 3. Mark invite as accepted
 */
export const acceptInvitation = async (userId: string, userEmail: string, invitation: Invitation) => {
  await runTransaction(db, async (transaction) => {
    // 1. References
    const accountRef = doc(db, "accounts", invitation.accountId);
    const userRef = doc(db, "users", userId);
    const inviteRef = doc(db, "invitations", invitation.id);

    // 2. Read Account to get current members
    const accountSnap = await transaction.get(accountRef);
    if (!accountSnap.exists()) throw new Error("Account no longer exists");
    
    const accountData = accountSnap.data() as Account;
    const members = accountData.members || {};

    // 3. Add new member
    const newMember: AccountMember = {
      uid: userId,
      email: userEmail,
      role: invitation.role,
      joinedAt: Timestamp.now()
    };
    
    members[userId] = newMember;

    // 4. Reads for User Profile
    const userSnap = await transaction.get(userRef);
    if (!userSnap.exists()) throw new Error("User profile not found");
    
    // 5. Writes
    transaction.update(accountRef, { members });
    transaction.update(userRef, { 
      joinedAccountIds: arrayUnion(invitation.accountId) 
    });
    transaction.update(inviteRef, { status: "accepted" });
  });
};

/**
 * Reject/Cancel Invitation
 */
export const rejectInvitation = async (invitationId: string) => {
  await deleteDoc(doc(db, "invitations", invitationId));
};