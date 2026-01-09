import { useAuth } from "@/contexts/AuthContext";

/**
 * Hook to enforce backend plan definitions and permission flags.
 * Maps directly to 'PLAN_DEFINITIONS' in backend/app/core/config.py
 */
export const useFeatureAccess = () => {
  const { profile } = useAuth();

  // Default "Locked" state if no profile is loaded
  if (!profile) {
    return {
      canExport: false,
      canSyncBrokers: false,
      canWebSearch: false,
      canAddScreenshots: false,
      canChat: false,
      remainingChats: 0,
      isPro: false,
      planName: "Free",
    };
  }

  // Define limits based on backend config.py constants
  // Note: These should ideally come from a /plans endpoint, 
  // but we can mirror them here for immediate UI feedback.
  const limits = {
    FREE: { chat: 5, strategy: 1, trades: 30 },
    PRO: { chat: 50, strategy: 10, trades: Infinity },
    PREMIUM: { chat: 200, strategy: Infinity, trades: Infinity },
  };

  const currentTier = profile.plan_tier || "FREE";
  const tierLimits = limits[currentTier as keyof typeof limits];

  // Logic checks matching permissions.py
  const remainingChats = Math.max(0, tierLimits.chat - profile.daily_chat_count);
  const canChat = remainingChats > 0;

  return {
    // Feature Flags (From Backend Profile)
    canExport: profile.allow_export_csv,
    canSyncBrokers: profile.allow_broker_sync,
    canWebSearch: profile.allow_web_search,
    
    // Limits & Usage
    canChat,
    remainingChats,
    chatLimit: tierLimits.chat,
    
    // UI Helpers
    planName: currentTier.charAt(0) + currentTier.slice(1).toLowerCase(),
    isPro: currentTier !== "FREE",
    isPremium: currentTier === "PREMIUM",
  };
};