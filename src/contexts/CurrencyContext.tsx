import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useMemo,
} from "react";
import { useAuth } from "@/hooks/use-Auth";

interface CurrencyContextType {
  currency: string;
  symbol: string;
  setCurrency: (code: string) => void;
  format: (amountUSD: number) => string; // USD in → converted out
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(
  undefined
);

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
};

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const { profile } = useAuth();

  const [currency, setCurrencyState] = useState("USD");
  const [rate, setRate] = useState<number>(1);

  // Sync currency from profile
  useEffect(() => {
    if (profile?.preferences?.currency) {
      setCurrencyState(profile.preferences.currency);
    }
  }, [profile]);

  // Fetch USD → selected currency rate
  useEffect(() => {
    if (currency === "USD") {
      setRate(1);
      return;
    }

    let cancelled = false;

    const fetchRate = async () => {
      try {
        const res = await fetch(
          "https://open.er-api.com/v6/latest/USD"
        );
        const data = await res.json();

        if (
          !cancelled &&
          data?.result === "success" &&
          data?.rates?.[currency]
        ) {
          setRate(data.rates[currency]);
        }
      } catch (err) {
        console.error("FX rate fetch failed:", err);
        // Keep last known rate
      }
    };

    fetchRate();

    return () => {
      cancelled = true;
    };
  }, [currency]);

  const setCurrency = (code: string) => {
    setCurrencyState(code);
  };

  // Currency symbol
  const getSymbol = (currencyCode: string) => {
    try {
      return (0).toLocaleString("en-US", {
        style: "currency",
        currency: currencyCode,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
        .replace(/\d/g, "")
        .trim();
    } catch {
      return currencyCode;
    }
  };

  const symbol = useMemo(() => getSymbol(currency), [currency]);

  // Convert USD → selected currency
  const format = (amountUSD: number) => {
    const converted = amountUSD * rate;

    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(converted);
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        symbol,
        setCurrency,
        format,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};
