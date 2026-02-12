import { Timestamp } from "firebase/firestore";

// 🧱 1. Enums & Unions
export type UserRole = "user" | "admin" | "moderator";
export type UserStatus = "PENDING" | "VERIFIED" | "ACTIVE" | "SUSPENDED" | "DELETED";
export type PlanTier = "FREE" | "PRO" | "PREMIUM";
export type ThemeOption = "light" | "dark" | "system";

// ⚙️ 2. SaaS Limits & Usage (Concurrency Safe Counters)
export interface UserUsage {
  aiChatQuotaUsed: number;      // Reset daily/monthly
  dailyChatCount: number;       // Anti-abuse limit
  monthlyAiTokensUsed: number;  // Cost tracking
  monthlyImportCount: number;   // Feature limiting
  totalTradesCount: number;     // Lifetime stats
  storageUsedBytes: number;     // File upload limit (e.g. screenshots)
}

// 💳 3. Subscription Data
export interface UserPlan {
  tier: PlanTier;
  activePlanId: string;         // Internal Plan ID or Stripe Price ID
  stripeCustomerId: string | null;
  subscriptionStatus: "active" | "past_due" | "canceled" | "trialing" | "unpaid" | null;
  currentPeriodEnd: Timestamp | null;
  cancelAtPeriodEnd: boolean;   // To show "Plan expires on..." vs "Renews on..."
}

// 🎨 4. User Preferences
export interface UserPreferences {
  theme: ThemeOption;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    marketing: boolean;
    tradeAlerts: boolean;
  };
  // Trading specific
  riskLevel: "low" | "medium" | "high";
  showWeekends: boolean;
  autoCalculateFees: boolean;
}

// 👤 5. The Master User Document
export interface UserDocument {
  // --- Identity ---
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  role: UserRole;
  
  // --- 🏢 Workspace Context (Critical for Multi-Tenancy) ---
  activeAccountId: string | null; // ID of the currently selected workspace
  joinedAccountIds: string[];     // List of workspaces this user belongs to

  // --- 🔐 Security & Lifecycle ---
  status: UserStatus;
  emailVerified: boolean;
  lastLoginAt: Timestamp;
  failedLoginCount: number;       // For rate limiting/locking

  // --- ⚙️ Settings ---
  settings: {
    currency: string;
    region: string;
    consentAiTraining: boolean;
    preferences: UserPreferences;
  };

  // --- 📦 SaaS Modules ---
  plan: UserPlan;
  usage: UserUsage;

  // --- 🕒 Metadata ---
  timestamps: {
    createdAt: Timestamp;
    updatedAt: Timestamp;
    lastActiveAt: Timestamp;
    quotaResetAt: Timestamp | null;
    lastChatResetAt: Timestamp | null;
  };
}