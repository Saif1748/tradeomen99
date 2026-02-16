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
import { uploadAvatarFromUrl } from "./storageService"; 

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
 * - 🔥 FIX: Normalizes Avatars for EXISTING accounts (Google -> Storage)
 */
export const syncUserWithFirestore = async (authUser: User): Promise<UserDocument> => {
  if (!authUser?.uid) throw new Error("Invalid User object provided to sync.");

  const userRef = doc(db, "users", authUser.uid);
  const userSnap = await getDoc(userRef);
  const now = serverTimestamp() as Timestamp;

  // Determine status (Google Sign-In usually verifies email instantly)
  const currentStatus: UserStatus = authUser.emailVerified ? "ACTIVE" : "PENDING";

  // --- 🛡️ AVATAR NORMALIZATION LOGIC ---
  // Check if we need to migrate the user's avatar to our own storage
  
  const isInternalUrl = (url: string | null) => url?.includes("firebasestorage.googleapis.com");
  
  let finalPhotoURL = authUser.photoURL;
  const existingPhotoURL = userSnap.exists() ? userSnap.data().photoURL : null;

  // 1. If DB already has a stable internal URL, keep it (don't overwrite with Google's temp URL)
  if (existingPhotoURL && isInternalUrl(existingPhotoURL)) {
    finalPhotoURL = existingPhotoURL;
  } 
  // 2. If DB has an external URL (or null), AND Auth provides a photo -> PROXY IT
  else if (authUser.photoURL && !isInternalUrl(authUser.photoURL)) {
    try {
        // 🚀 Migration: Download from Google -> Upload to Firebase Storage
        finalPhotoURL = await uploadAvatarFromUrl(authUser.uid, authUser.photoURL);
    } catch (e) {
        console.warn("Avatar migration failed, falling back to provider URL", e);
    }
  }

  if (userSnap.exists()) {
    // === 🟢 EXISTING USER (LOGIN) ===
    // This update block now includes 'photoURL', which fixes the "Already Created Account" issue
    await updateDoc(userRef, {
      "timestamps.lastActiveAt": now,
      "lastLoginAt": now,
      "emailVerified": authUser.emailVerified,
      "failedLoginCount": 0,
      "photoURL": finalPhotoURL, // ✅ Updates the avatar to the stable URL
      // If they were pending and just verified email, activate them
      ...(userSnap.data().status === "PENDING" && authUser.emailVerified ? { status: "ACTIVE" } : {})
    });

    logAuditEvent(authUser.uid, "LOGIN", "SUCCESS").catch(console.warn);
    return { ...userSnap.data(), photoURL: finalPhotoURL } as UserDocument;
  } else {
    // === 🔵 NEW USER (SIGNUP) ===
    // Initialize with "SaaS Defaults" matching types/user.ts
    
    const newUser: UserDocument = {
      // Identity
      uid: authUser.uid,
      email: authUser.email || "", 
      displayName: authUser.displayName || "New Trader",
      photoURL: finalPhotoURL, // ✅ Uses stable URL from start
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