import React, { useEffect, useState, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../integrations/supabase/client';
import { fetchBackendProfile } from '../services/api/core';
import { UserProfile, PlanTier } from '../services/api/types';
import { AuthContext } from '../hooks/use-Auth';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const syncBackendProfile = useCallback(async (currentSession: Session | null) => {
    if (!currentSession?.access_token) {
      setProfile(null);
      setIsSyncing(false);
      return;
    }

    setIsSyncing(true);
    setError(null);

    try {
      const backendData = await fetchBackendProfile();
      if (backendData) {
        setProfile({
            ...backendData,
            // ✅ FIX: Force Uppercase to match strict TypeScript Enum & Sidebar Logic
            plan_tier: (backendData.plan_tier || "FREE").toUpperCase() as PlanTier
        });
      }
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
          if (initialSession) {
            setSession(initialSession);
            setUser(initialSession.user);
            // Trigger sync in background, don't await to block UI
            syncBackendProfile(initialSession);
          }
          // ✅ FIX: Set loading false ONLY after we have determined the session state
          setLoading(false); 
        }
      } catch (e) {
        console.error("Init Error:", e);
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
          setError(null);
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