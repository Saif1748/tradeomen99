// src/hooks/use-profile.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchBackendProfile, UserProfile } from "@/services/api/core";
import { authApi } from "@/services/api/modules/auth";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-Auth";
import { toast } from "sonner";

export interface ProfileUpdateParams {
  fullName?: string;
  bio?: string;
  preferences?: Record<string, any>;
}

export function useProfile() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  // ✅ 1. KEEP YOUR EXACT WORKING QUERY
  // We return the full query object later so 'data' is accessible to AppSidebar
  const query = useQuery<UserProfile | null>({
    queryKey: ["user-profile", session?.user?.id],
    queryFn: async () => {
      // Safety check: Don't fetch if no user is logged in
      if (!session?.user?.id) return null;
      return await fetchBackendProfile();
    },
    // Dependency: Only run when session exists
    enabled: !!session?.user?.id,
    
    // Industry Grade Caching:
    staleTime: 1000 * 60 * 10, 
    gcTime: 1000 * 60 * 30, 
  });

  // ✅ 2. ADD MUTATION (For Settings Page)
  // This allows updating the profile without breaking the fetching logic
  const updateMutation = useMutation({
    mutationFn: async (params: ProfileUpdateParams) => {
      const { fullName, bio, preferences } = params;

      // A. Update Supabase Auth Metadata (if needed)
      if (fullName || bio !== undefined) {
        const updates: { data: { full_name?: string; bio?: string } } = { data: {} };
        if (fullName) updates.data.full_name = fullName;
        if (bio !== undefined) updates.data.bio = bio;

        const { error } = await supabase.auth.updateUser(updates);
        if (error) throw error;
      }

      // B. Update Backend DB (Preferences)
      const payload: Partial<UserProfile> = {};
      if (preferences) {
        payload.preferences = preferences;
      }

      if (Object.keys(payload).length > 0) {
        await authApi.updateProfile(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      toast.success("Profile updated successfully");
    },
    onError: (error: any) => {
      console.error("Profile Update Failed:", error);
      toast.error(error.message || "Failed to save changes");
    },
  });

  // ✅ 3. RETURN EVERYTHING
  // We spread ...query so 'data', 'isLoading', etc. are available exactly as before.
  // We add 'updateProfile' for the new Settings components.
  return {
    ...query, 
    updateProfile: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
}

/**
 * Helper hook to force-refresh credits.
 */
export function useInvalidateProfile() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["user-profile"] });
}