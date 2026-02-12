import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp, 
  Timestamp, 
  collection, 
  addDoc,
  onSnapshot,
  increment,
  Unsubscribe
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserDocument, UserStatus, UserPreferences } from "@/types/user";
import { User } from "firebase/auth";

// --- 📊 AUDIT LOGGING ---

/**
 * 🧾 Writes a tamper-resistant log to a user's subcollection.
 * Critical for security compliance and debugging user flows.
 */
export const logAuditEvent = async (
  userId: string, 
  action: "LOGIN" | "SIGNUP" | "PROFILE_UPDATE" | "PLAN_CHANGE", 
  status: "SUCCESS" | "FAILURE",
  details?: string
) => {
  try {
    const logsRef = collection(db, "users", userId, "audit_logs");
    await addDoc(logsRef, {
      action,
      status,
      details: details ?? null, 
      timestamp: serverTimestamp(),
      userAgent: navigator.userAgent ?? "Unknown",
    });
  } catch (error) {
    console.warn("Audit log failed (Non-critical):", error); 
  }
};

// --- 🎧 REAL-TIME SUBSCRIPTIONS ---

/**
 * ⚡ Subscribes to the User Document.
 * Used by the useAuth hook to keep the UI instantly in sync 
 * when Plan, Settings, or Usage changes.
 */
export const subscribeToUser = (
  userId: string, 
  onUpdate: (user: UserDocument | null) => void
): Unsubscribe => {
  const userRef = doc(db, "users", userId);
  
  return onSnapshot(userRef, (docSnap) => {
    if (docSnap.exists()) {
      onUpdate(docSnap.data() as UserDocument);
    } else {
      onUpdate(null);
    }
  }, (error) => {
    console.error("🔥 User Sync Error:", error);
  });
};

// --- 🔐 AUTH LIFECYCLE SYNC ---

/**
 * 🔄 Syncs Firebase Auth -> Firestore DB.
 * - Handles New User Creation (Provisioning)
 * - Handles Returning User Updates (Last Login, Verification Status)
 */
export const syncUserWithFirestore = async (authUser: User): Promise<UserDocument> => {
  if (!authUser?.uid) throw new Error("Invalid User object provided to sync.");

  const userRef = doc(db, "users", authUser.uid);
  const userSnap = await getDoc(userRef);
  const now = serverTimestamp() as Timestamp;

  // Determine status (Google Sign-In usually verifies email instantly)
  const currentStatus: UserStatus = authUser.emailVerified ? "ACTIVE" : "PENDING";

  if (userSnap.exists()) {
    // === 🟢 EXISTING USER (LOGIN) ===
    await updateDoc(userRef, {
      "timestamps.lastActiveAt": now,
      "lastLoginAt": now,
      "emailVerified": authUser.emailVerified,
      "failedLoginCount": 0,
      // If they were pending and just verified email, activate them
      ...(userSnap.data().status === "PENDING" && authUser.emailVerified ? { status: "ACTIVE" } : {})
    });

    logAuditEvent(authUser.uid, "LOGIN", "SUCCESS").catch(console.warn);
    return userSnap.data() as UserDocument;
  } else {
    // === 🔵 NEW USER (SIGNUP) ===
    // Initialize with "SaaS Defaults" matching types/user.ts
    
    const newUser: UserDocument = {
      // Identity
      uid: authUser.uid,
      email: authUser.email || "", 
      displayName: authUser.displayName || "New Trader",
      photoURL: authUser.photoURL || null,
      role: "user",

      // Workspace Context (Start empty, WorkspaceProvider handles creation)
      activeAccountId: null,
      joinedAccountIds: [],

      // Security
      status: currentStatus,
      emailVerified: authUser.emailVerified,
      lastLoginAt: Timestamp.now(),
      failedLoginCount: 0,

      // Settings
      settings: {
        currency: "USD",
        region: "US",
        consentAiTraining: false,
        preferences: {
          theme: "system",
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          notifications: { email: true, push: true, marketing: false, tradeAlerts: true },
          riskLevel: "medium",
          showWeekends: false,
          autoCalculateFees: true
        }
      },

      // Subscription (Default: Free)
      plan: {
        tier: "FREE",
        activePlanId: "price_free_tier",
        stripeCustomerId: null,
        subscriptionStatus: "active", // Free tier is always "active"
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false
      },

      // Usage (Start at 0)
      usage: {
        aiChatQuotaUsed: 0,
        dailyChatCount: 0,
        monthlyAiTokensUsed: 0,
        monthlyImportCount: 0,
        totalTradesCount: 0,
        storageUsedBytes: 0
      },

      // Timestamps
      timestamps: {
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        lastActiveAt: Timestamp.now(),
        quotaResetAt: Timestamp.now(),
        lastChatResetAt: Timestamp.now(),
      },
    };

    await setDoc(userRef, newUser);
    logAuditEvent(authUser.uid, "SIGNUP", "SUCCESS", "Provisioned new account").catch(console.warn);

    return newUser;
  }
};

// --- 🛠️ SAAS UTILITIES ---

/**
 * ⚡ Atomically increments usage counters.
 * Safe for high-concurrency (e.g., user spamming the Chat button).
 */
export const incrementUsage = async (
  userId: string, 
  metric: keyof UserDocument["usage"], 
  amount: number = 1
) => {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, {
    [`usage.${metric}`]: increment(amount),
    "timestamps.updatedAt": serverTimestamp()
  });
};

/**
 * 🎨 Optimistic-ready preference updater.
 * Updates nested settings fields without overwriting the whole object.
 */
export const updateUserPreferences = async (
  userId: string, 
  updates: Partial<UserPreferences>
) => {
  const userRef = doc(db, "users", userId);
  
  // Create dot-notation updates for nested fields
  // e.g. "settings.preferences.theme": "dark"
  const flattenUpdates: Record<string, any> = {};
  
  Object.entries(updates).forEach(([key, value]) => {
    flattenUpdates[`settings.preferences.${key}`] = value;
  });
  
  flattenUpdates["timestamps.updatedAt"] = serverTimestamp();

  await updateDoc(userRef, flattenUpdates);
};