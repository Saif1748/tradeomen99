import React, { useEffect, useState, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../integrations/supabase/client';
import { fetchBackendProfile, UserProfile } from '../services/api/core';
import { AuthContext } from '../hooks/use-Auth';

/**
 * AuthProvider Component
 * Manages the Supabase session and synchronizes it with the Python backend.
 * This file now ONLY exports the component to satisfy Vite/SWC Fast Refresh.
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * syncBackendProfile
   * Handshakes with the Python backend to fetch credits, plans, and usage.
   */
  const syncBackendProfile = useCallback(async (currentSession: Session | null) => {
    if (!currentSession?.access_token) {
      setProfile(null);
      setIsSyncing(false);
      return;
    }

    setIsSyncing(true);
    try {
      const backendData = await fetchBackendProfile();
      setProfile(backendData);
      setError(null);
    } catch (err: any) {
      console.error("Handshake Error (Backend):", err);
      setError(err.message || "Engine synchronization failed");
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initSession = async () => {
      try {
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;

        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          
          // CRITICAL: Stop the main loading spinner immediately to allow navigation
          setLoading(false);
        }

        if (initialSession) {
          syncBackendProfile(initialSession);
        }
      } catch (e) {
        console.error("Auth Handshake Failed (Supabase):", e);
        if (mounted) setLoading(false);
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;

        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (newSession) syncBackendProfile(newSession);
        }
        
        if (event === 'SIGNED_OUT') {
          setProfile(null);
          setSession(null);
          setUser(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [syncBackendProfile]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      setProfile(null);
      setUser(null);
      setSession(null);
    }
  };

  const refreshProfile = async () => {
    if (session) await syncBackendProfile(session);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      profile, 
      loading, 
      isSyncing,
      error, 
      signOut, 
      refreshProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
};