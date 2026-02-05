import { Timestamp } from "firebase/firestore";

// 🧱 1. Account Lifecycle States (New)
export type UserStatus = "PENDING" | "VERIFIED" | "ACTIVE" | "SUSPENDED" | "DELETED";

// 🧾 9. Audit Log Entry Structure (New)
export interface AuditLogEntry {
  action: "LOGIN" | "SIGNUP" | "PASSWORD_RESET" | "EMAIL_CHANGE" | "PROFILE_UPDATE";
  timestamp: Timestamp;
  ipAddress?: string; 
  userAgent?: string;
  details?: string;
  status: "SUCCESS" | "FAILURE";
}

export interface UserPreferences {
  theme?: "light" | "dark" | "system";
  notifications?: boolean;
  betaFeatures?: boolean;
  // Trading specific preferences
  timezone?: string;
  riskLevel?: number;
  showWeekends?: boolean;
  autoCalculateFees?: boolean;
}

export interface UserDocument {
  // --- Identity ---
  uid: string;              
  email: string;            
  displayName: string;      
  photoURL: string | null;  
  role: "user" | "admin";   

  // --- 🔐 Security & Lifecycle (New Critical Fields) ---
  status: UserStatus;           // Tracks if user is Active vs Suspended
  emailVerified: boolean;       // Critical for authorization checks
  lastLoginAt: Timestamp;       // For security auditing
  failedLoginCount: number;     // For rate limiting/locking

  // --- Settings & Preferences ---
  settings: {
    currency: string;       
    region: string;         
    consentAiTraining: boolean; 
    preferences: UserPreferences; 
  };

  // --- Subscription & Billing ---
  plan: {
    tier: "FREE" | "PRO" | "PREMIUM"; 
    activePlanId: string;   
    stripeCustomerId: string | null; 
    currentPeriodEnd: Timestamp | null; 
  };

  // --- Usage & Quotas ---
  usage: {
    aiChatQuotaUsed: number;      
    monthlyAiTokensUsed: number;  
    monthlyImportCount: number;   
    dailyChatCount: number;       
    totalTradesCount: number;     
  };

  // --- System Timestamps ---
  timestamps: {
    createdAt: Timestamp;         
    updatedAt: Timestamp;         
    lastActiveAt: Timestamp;      
    quotaResetAt: Timestamp | null;    
    lastChatResetAt: Timestamp | null; 
  };
}