import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  bio: string;
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
  setProfile: (profile: UserProfile) => void;
  tradingPreferences: TradingPreferences;
  setTradingPreferences: (prefs: TradingPreferences) => void;
  appearance: AppearanceSettings;
  setAppearance: (appearance: AppearanceSettings) => void;
  getCurrencySymbol: () => string;
  formatCurrency: (value: number) => string;
}

const defaultProfile: UserProfile = {
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@example.com",
  bio: "",
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
  const [profile, setProfileState] = useState<UserProfile>(() => {
    const saved = localStorage.getItem("userProfile");
    return saved ? JSON.parse(saved) : defaultProfile;
  });

  const [tradingPreferences, setTradingPreferencesState] = useState<TradingPreferences>(() => {
    const saved = localStorage.getItem("tradingPreferences");
    return saved ? JSON.parse(saved) : defaultTradingPreferences;
  });

  const [appearance, setAppearanceState] = useState<AppearanceSettings>(() => {
    const saved = localStorage.getItem("appearanceSettings");
    return saved ? JSON.parse(saved) : defaultAppearance;
  });

  const setProfile = (newProfile: UserProfile) => {
    setProfileState(newProfile);
    localStorage.setItem("userProfile", JSON.stringify(newProfile));
  };

  const setTradingPreferences = (prefs: TradingPreferences) => {
    setTradingPreferencesState(prefs);
    localStorage.setItem("tradingPreferences", JSON.stringify(prefs));
  };

  const setAppearance = (settings: AppearanceSettings) => {
    setAppearanceState(settings);
    localStorage.setItem("appearanceSettings", JSON.stringify(settings));
  };

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
    const symbol = getCurrencySymbol();
    const absValue = Math.abs(value);
    const formatted = absValue.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
    return value >= 0 ? `${symbol}${formatted}` : `-${symbol}${formatted}`;
  };

  // Apply font size to root element
  useEffect(() => {
    const root = document.documentElement;
    switch (appearance.fontSize) {
      case "small":
        root.style.fontSize = "14px";
        break;
      case "medium":
        root.style.fontSize = "16px";
        break;
      case "large":
        root.style.fontSize = "18px";
        break;
    }
  }, [appearance.fontSize]);

  // Apply reduce animations preference
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
