import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useAuth } from '@/hooks/use-Auth';

interface CurrencyContextType {
  currency: string; // e.g., "USD", "EUR"
  symbol: string;   // e.g., "$", "€"
  setCurrency: (code: string) => void;
  format: (amount: number) => string; // Returns formatted string like "1,234.56"
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const { profile } = useAuth();
  
  // Load initial currency from profile preference or default to USD
  const [currency, setCurrencyState] = useState("USD");

  // Sync with profile when loaded
  useEffect(() => {
    if (profile?.preferences?.currency) {
      setCurrencyState(profile.preferences.currency);
    }
  }, [profile]);

  const setCurrency = (code: string) => {
    setCurrencyState(code);
    // In a real app, you might also trigger an API call to save this preference here
  };

  // Helper to get currency symbol (e.g. $) based on code
  const getSymbol = (currencyCode: string) => {
    try {
      return (0).toLocaleString('en-US', { 
        style: 'currency', 
        currency: currencyCode, 
        minimumFractionDigits: 0, 
        maximumFractionDigits: 0 
      }).replace(/\d/g, '').trim();
    } catch {
      return currencyCode;
    }
  };

  const symbol = getSymbol(currency);

  const format = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <CurrencyContext.Provider value={{ 
      currency, 
      symbol, 
      setCurrency, 
      format 
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};