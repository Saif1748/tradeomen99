import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp, 
  Timestamp, 
  collection, 
  addDoc 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserDocument, UserStatus } from "@/types/user";
import { User } from "firebase/auth";

/**
 * 🧾 Audit Logging Helper
 * Writes a tamper-resistant log to a user's subcollection.
 * This is critical for security compliance.
 */
export const logAuditEvent = async (
  userId: string, 
  action: "LOGIN" | "SIGNUP" | "PROFILE_UPDATE", 
  status: "SUCCESS" | "FAILURE",
  details?: string
) => {
  try {
    // Stores logs in /users/{userId}/audit_logs/{logId}
    const logsRef = collection(db, "users", userId, "audit_logs");
    await addDoc(logsRef, {
      action,
      status,
      details,
      timestamp: serverTimestamp(),
      userAgent: navigator.userAgent, // Captures browser/device info
    });
  } catch (error) {
    // Fail silently so we don't block the user if logging fails
    console.error("Audit log failed:", error); 
  }
};

/**
 * Syncs the Firebase Auth user with the Firestore User Document.
 * Handles Lifecycle (Pending -> Active) and Security fields.
 */
export const syncUserWithFirestore = async (authUser: User): Promise<UserDocument> => {
  const userRef = doc(db, "users", authUser.uid);
  const userSnap = await getDoc(userRef);

  // 1. Determine Account Status based on verification
  // If they used Google, they are usually verified immediately.
  const currentStatus: UserStatus = authUser.emailVerified ? "ACTIVE" : "PENDING";

  if (userSnap.exists()) {
    // === EXISTING USER (LOGIN) ===
    
    // We update security fields on every login
    await updateDoc(userRef, {
      "timestamps.lastActiveAt": serverTimestamp(),
      "lastLoginAt": serverTimestamp(),
      "emailVerified": authUser.emailVerified, // Keep this in sync
      "status": currentStatus,                 // Auto-activate if they verified email
      "failedLoginCount": 0,                   // Reset failed attempts on success
    });

    // 🧾 Log the Login Event
    await logAuditEvent(authUser.uid, "LOGIN", "SUCCESS");

    return userSnap.data() as UserDocument;
  } else {
    // === NEW USER (SIGNUP) ===
    
    const newUser: UserDocument = {
      // --- Identity ---
      uid: authUser.uid,
      email: authUser.email || "",
      displayName: authUser.displayName || "New Trader",
      photoURL: authUser.photoURL || null,
      role: "user",

      // --- 🔐 Security & Lifecycle ---
      status: currentStatus,
      emailVerified: authUser.emailVerified,
      lastLoginAt: Timestamp.now(),
      failedLoginCount: 0,

      // --- Settings ---
      settings: {
        currency: "USD",
        region: "US",
        consentAiTraining: false,
        preferences: {},
      },

      // --- Subscription ---
      plan: {
        tier: "FREE",
        activePlanId: "FREE",
        stripeCustomerId: null,
        currentPeriodEnd: null,
      },

      // --- Usage ---
      usage: {
        aiChatQuotaUsed: 0,
        monthlyAiTokensUsed: 0,
        monthlyImportCount: 0,
        dailyChatCount: 0,
        totalTradesCount: 0,
      },

      // --- Timestamps ---
      timestamps: {
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        lastActiveAt: Timestamp.now(),
        quotaResetAt: Timestamp.now(),
        lastChatResetAt: Timestamp.now(),
      },
    };

    // Save the new user document
    await setDoc(userRef, newUser);
    
    // 🧾 Log the Signup Event
    await logAuditEvent(authUser.uid, "SIGNUP", "SUCCESS", "Via Email/Google");

    return newUser;
  }
};