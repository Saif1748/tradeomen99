import { useMutation, useQueryClient } from "@tanstack/react-query";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useUser } from "@/contexts/UserContext";
import { UserPreferences, UserDocument } from "@/types/user";
import { authKeys } from "@/hooks/useAuth";
import { toast } from "sonner";

/**
 * ⚙️ useSettings Hook
 * * A robust hook for managing user preferences.
 * - Reads directly from the User Profile (cached)
 * - Writes optimistically to Firestore (instant UI updates)
 * - Handles nested object updates safely
 */
export function useSettings() {
  const { user, profile } = useUser();
  const queryClient = useQueryClient();

  // 1. 🏗️ The Mutation (Optimistic Update)
  const mutation = useMutation({
    mutationFn: async (newSettings: Partial<UserPreferences>) => {
      if (!user?.uid) throw new Error("User not found");
      
      const userRef = doc(db, "users", user.uid);
      
      // 🛡️ CRITICAL: Convert nested object to Dot Notation
      // If we just sent { settings: { preferences: ... } }, it might overwrite 
      // other fields in 'settings' (like currency or region).
      // By using "settings.preferences.theme", we target ONLY the specific field.
      const updates: Record<string, any> = {
        "timestamps.updatedAt": serverTimestamp(),
      };

      Object.entries(newSettings).forEach(([key, value]) => {
        updates[`settings.preferences.${key}`] = value;
      });

      await updateDoc(userRef, updates);
    },

    // ⚡ START: Optimistic Update
    onMutate: async (newSettings) => {
      // A. Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: authKeys.profile });

      // B. Snapshot the previous value
      const previousProfile = queryClient.getQueryData<UserDocument>(authKeys.profile);

      // C. Optimistically update to the new value
      if (previousProfile) {
        queryClient.setQueryData<UserDocument>(authKeys.profile, (old) => {
          if (!old) return old;
          return {
            ...old,
            settings: {
              ...old.settings,
              preferences: {
                ...old.settings.preferences,
                ...newSettings, // Merge new preferences
              },
            },
          };
        });
      }

      // Return a context object with the snapshotted value
      return { previousProfile };
    },

    // ❌ ERROR: Rollback
    onError: (_err, _newSettings, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(authKeys.profile, context.previousProfile);
      }
      toast.error("Failed to save settings. Changes reverted.");
    },

    // ✅ SUCCESS: 
    onSuccess: () => {
      // Optional: You can show a toast here, or keep it silent for "seamless" feel
      // toast.success("Settings saved"); 
    },

    // 🏁 SETTLED: Sync with server to be 100% sure
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.profile });
    },
  });

  return {
    // 📖 Read Data (Safe Access)
    settings: profile?.settings,
    preferences: profile?.settings.preferences ?? {} as UserPreferences,
    
    // ✍️ Write Data
    updateSettings: mutation.mutate,
    updateSettingsAsync: mutation.mutateAsync, // Use this if you need to await the result
    
    // 🚦 Status
    isUpdating: mutation.isPending,
    error: mutation.error
  };
}