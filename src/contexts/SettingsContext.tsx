import { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react";
import { onAuthStateChanged, signOut as firebaseSignOut, User } from "firebase/auth";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { toast } from "sonner";

// --- Types ---
export interface UserProfile {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  bio: string;
  photoURL?: string;
  tier?: "FREE" | "PRO" | "PREMIUM";
}

export interface TradingPreferences {
  currency: "USD" | "EUR" | "GBP" | "JPY";
  timezone: string;
  riskLevel: number;
  showWeekends: boolean;
  autoCalculateFees: boolean;
}

export interface AppearanceSettings {
  fontSize: "small" | "medium" | "large";
  reduceAnimations: boolean;
}

interface SettingsContextType {
  profile: UserProfile;
  setProfile: (profile: UserProfile) => Promise<void>;
  tradingPreferences: TradingPreferences;
  setTradingPreferences: (prefs: TradingPreferences) => Promise<void>;
  appearance: AppearanceSettings;
  setAppearance: (appearance: AppearanceSettings) => void;
  getCurrencySymbol: () => string;
  formatCurrency: (value: number) => string;
  isLoading: boolean;
  logout: () => Promise<void>;
}

// --- Defaults ---
const defaultProfile: UserProfile = {
  uid: "",
  firstName: "Guest",
  lastName: "User",
  email: "",
  bio: "",
  tier: "FREE",
};

const defaultTradingPreferences: TradingPreferences = {
  currency: "USD",
  timezone: "est",
  riskLevel: 2,
  showWeekends: true,
  autoCalculateFees: true,
};

const defaultAppearance: AppearanceSettings = {
  fontSize: "medium",
  reduceAnimations: false,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // State
  const [profile, setProfileState] = useState<UserProfile>(defaultProfile);
  const [tradingPreferences, setTradingPreferencesState] = useState<TradingPreferences>(defaultTradingPreferences);
  
  // Appearance (Local Storage)
  const [appearance, setAppearanceState] = useState<AppearanceSettings>(() => {
    if (typeof window === 'undefined') return defaultAppearance;
    const saved = localStorage.getItem("appearanceSettings");
    return saved ? JSON.parse(saved) : defaultAppearance;
  });

  // Refs for State Reversion (Snapshot of previous valid state)
  const prevProfileRef = useRef<UserProfile>(defaultProfile);
  const prevPrefsRef = useRef<TradingPreferences>(defaultTradingPreferences);

  // 1. Listen to Auth State
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setProfileState(defaultProfile);
        setTradingPreferencesState(defaultTradingPreferences);
        setIsLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // 2. Listen to Firestore Data (Real-time)
  useEffect(() => {
    if (!user) return;

    const userDocRef = doc(db, "users", user.uid);
    
    const unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();

        // Safe Name Parsing
        const fullName = data.displayName || "";
        const nameParts = fullName.trim().split(" ");
        const first = nameParts[0] || "";
        const last = nameParts.slice(1).join(" ") || ""; // Handles "John Von Neumann" correctly

        const loadedProfile: UserProfile = {
          uid: user.uid,
          firstName: first,
          lastName: last,
          email: data.email || user.email || "",
          bio: data.bio || "",
          photoURL: data.photoURL || user.photoURL || undefined,
          tier: data.plan?.tier || "FREE",
        };

        const prefsData = data.settings?.preferences || {};
        const loadedPrefs: TradingPreferences = {
          currency: data.settings?.currency || "USD",
          timezone: prefsData.timezone || "est",
          riskLevel: prefsData.riskLevel ?? 2,
          showWeekends: prefsData.showWeekends ?? true,
          autoCalculateFees: prefsData.autoCalculateFees ?? true,
        };

        setProfileState(loadedProfile);
        setTradingPreferencesState(loadedPrefs);
        
        // Update refs for reversion
        prevProfileRef.current = loadedProfile;
        prevPrefsRef.current = loadedPrefs;
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching user data:", error);
      setIsLoading(false);
    });

    return () => unsubscribeSnapshot();
  }, [user]);

  // --- Actions ---

  const setProfile = async (newProfile: UserProfile) => {
    if (!user) return;
    
    // 1. Optimistic Update
    setProfileState(newProfile); 

    try {
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        displayName: `${newProfile.firstName} ${newProfile.lastName}`.trim(),
        bio: newProfile.bio,
        // We don't update email/uid/tier here as those are managed elsewhere
      });
      // Update successful, sync ref
      prevProfileRef.current = newProfile;
    } catch (error) {
      console.error("Failed to save profile:", error);
      toast.error("Failed to save changes");
      // 2. Revert on Error
      setProfileState(prevProfileRef.current);
    }
  };

  const setTradingPreferences = async (newPrefs: TradingPreferences) => {
    if (!user) return;

    // 1. Optimistic Update
    setTradingPreferencesState(newPrefs);

    try {
      const userDocRef = doc(db, "users", user.uid);
      // 2. Granular Updates (Safer than overwriting the whole object)
      await updateDoc(userDocRef, {
        "settings.currency": newPrefs.currency,
        "settings.preferences.timezone": newPrefs.timezone,
        "settings.preferences.riskLevel": newPrefs.riskLevel,
        "settings.preferences.showWeekends": newPrefs.showWeekends,
        "settings.preferences.autoCalculateFees": newPrefs.autoCalculateFees
      });
      prevPrefsRef.current = newPrefs;
    } catch (error) {
      console.error("Failed to save preferences:", error);
      toast.error("Failed to save preferences");
      // 3. Revert on Error
      setTradingPreferencesState(prevPrefsRef.current);
    }
  };

  const setAppearance = (settings: AppearanceSettings) => {
    setAppearanceState(settings);
    localStorage.setItem("appearanceSettings", JSON.stringify(settings));
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      // Clear state immediately to prevent "flash" of old data on next login
      setProfileState(defaultProfile);
      setTradingPreferencesState(defaultTradingPreferences);
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Failed to logout");
    }
  };

  // --- Helpers ---

  const getCurrencySymbol = () => {
    switch (tradingPreferences.currency) {
      case "USD": return "$";
      case "EUR": return "€";
      case "GBP": return "£";
      case "JPY": return "¥";
      default: return "$";
    }
  };

  const formatCurrency = (value: number) => {
    if (isNaN(value)) return `${getCurrencySymbol()}0.00`;
    
    const symbol = getCurrencySymbol();
    const absValue = Math.abs(value);
    const formatted = absValue.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
    return value >= 0 ? `${symbol}${formatted}` : `-${symbol}${formatted}`;
  };

  // --- Side Effects (Appearance) ---
  useEffect(() => {
    const root = document.documentElement;
    switch (appearance.fontSize) {
      case "small": root.style.fontSize = "14px"; break;
      case "medium": root.style.fontSize = "16px"; break;
      case "large": root.style.fontSize = "18px"; break;
    }
  }, [appearance.fontSize]);

  useEffect(() => {
    const root = document.documentElement;
    if (appearance.reduceAnimations) {
      root.classList.add("reduce-motion");
    } else {
      root.classList.remove("reduce-motion");
    }
  }, [appearance.reduceAnimations]);

  return (
    <SettingsContext.Provider
      value={{
        profile,
        setProfile,
        tradingPreferences,
        setTradingPreferences,
        appearance,
        setAppearance,
        getCurrencySymbol,
        formatCurrency,
        isLoading,
        logout,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};