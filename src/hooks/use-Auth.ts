import { createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { UserProfile } from '../services/api/core';

/**
 * AuthContextType
 * Standardized shape for the application's authentication and profile state.
 */
export interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;           // Tracks the initial Supabase session check
  isSyncing: boolean;         // Tracks the background Python backend handshake
  error: string | null;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

/**
 * AuthContext Instance
 * EXPORTED here to be used by the Provider in contexts/AuthContext.tsx.
 * This resolves the "declares locally but not exported" error.
 */
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * useAuth Hook
 * Provides access to the global authentication state.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};