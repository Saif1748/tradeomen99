import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore"; // ✅ Added imports
import { auth, db } from "@/lib/firebase";       // ✅ Added db
import { UserDocument } from "@/types/user";
import { subscribeToUser } from "@/services/userService";

// 🔑 Query Keys
export const authKeys = {
  auth: ["auth", "user"] as const,
  profile: ["auth", "profile"] as const,
};

export function useAuth() {
  const queryClient = useQueryClient();

  // --- 1. 🔐 FIREBASE AUTH LISTENER ---
  const { data: authUser, isLoading: isAuthLoading } = useQuery({
    queryKey: authKeys.auth,
    queryFn: () => new Promise<User | null>((resolve) => {
      if (auth.currentUser) {
        resolve(auth.currentUser);
        return;
      }
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        resolve(user);
        unsubscribe();
      });
    }),
    staleTime: Infinity,
    gcTime: Infinity,
  });

  // --- 2. 👂 PERSISTENT AUTH SYNC ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      queryClient.setQueryData(authKeys.auth, user);
      
      if (!user) {
        // 🛡️ SECURITY: Wipe data on logout
        queryClient.setQueryData(authKeys.profile, null);
        queryClient.removeQueries({ queryKey: authKeys.profile });
      }
    });
    return () => unsubscribe();
  }, [queryClient]);

  // --- 3. 📡 REAL-TIME PROFILE SUBSCRIPTION ---
  useEffect(() => {
    if (!authUser?.uid) return;

    const unsubscribe = subscribeToUser(authUser.uid, (data) => {
      // ⚡ INSTANT UI UPDATE
      queryClient.setQueryData(authKeys.profile, data);
    });

    return () => unsubscribe();
  }, [authUser?.uid, queryClient]);

  // --- 4. 💾 ACCESS PROFILE DATA ---
  const { data: userProfile, isLoading: isProfileLoading } = useQuery({
    queryKey: authKeys.profile,
    enabled: !!authUser?.uid,
    // ✅ FIX: Added queryFn acting as a robust fallback.
    // This is REQUIRED by TanStack Query v5.
    queryFn: async () => {
      if (!authUser?.uid) return null;
      try {
        const snap = await getDoc(doc(db, "users", authUser.uid));
        return snap.exists() ? (snap.data() as UserDocument) : null;
      } catch (error) {
        console.error("Profile fetch error:", error);
        return null;
      }
    },
    staleTime: Infinity,
    gcTime: 1000 * 60 * 30,
  });

  // --- 5. 🧮 DERIVED STATE ---
  const isLoading = isAuthLoading || (!!authUser && isProfileLoading);
  const planTier = userProfile?.plan?.tier || "FREE";

  return {
    user: authUser,
    profile: userProfile as UserDocument | null | undefined,
    isLoading,
    isAuthenticated: !!authUser,
    isEmailVerified: authUser?.emailVerified ?? false,
    role: userProfile?.role || "user",
    isAdmin: userProfile?.role === "admin",
    plan: planTier,
    isPro: planTier === "PRO" || planTier === "PREMIUM",
    isPremium: planTier === "PREMIUM",
    isOnboarding: !!authUser && !userProfile,
  };
}