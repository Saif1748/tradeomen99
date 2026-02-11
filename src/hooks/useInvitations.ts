import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Timestamp } from "firebase/firestore";
import { 
  getUserInvitations, 
  getAccountPendingInvites,
  sendInvitation, 
  acceptInvitation, 
  rejectInvitation 
} from "@/services/accountService";
import { Invitation } from "@/types/account";
import { accountKeys } from "./useAccounts"; // Import keys to invalidate cross-hook

// 🔑 Invitation Query Keys
export const invitationKeys = {
  all: ["invitations"] as const,
  incoming: (email: string) => [...invitationKeys.all, "incoming", email] as const,
  outgoing: (accountId: string) => [...invitationKeys.all, "outgoing", accountId] as const,
};

export const useInvitations = (
  userEmail?: string, 
  userId?: string,
  currentAccountId?: string
) => {
  const queryClient = useQueryClient();

  // 1. 📬 Incoming Invites (For the current User)
  const { 
    data: incomingInvites = [], 
    isLoading: isLoadingIncoming 
  } = useQuery({
    queryKey: invitationKeys.incoming(userEmail || ""),
    queryFn: () => getUserInvitations(userEmail!),
    enabled: !!userEmail,
    // Poll regularly for new invites (SaaS standard for notifications)
    refetchInterval: 30000, 
    staleTime: 1000 * 60, // 1 min cache
  });

  // 2. 📤 Outgoing Invites (For the current Workspace Owner)
  const { 
    data: outgoingInvites = [], 
    isLoading: isLoadingOutgoing 
  } = useQuery({
    queryKey: invitationKeys.outgoing(currentAccountId || ""),
    queryFn: () => getAccountPendingInvites(currentAccountId!),
    enabled: !!currentAccountId,
    staleTime: 1000 * 60 * 2, // 2 mins fresh
    // Prevent UI flicker when switching accounts
    placeholderData: (prev) => [], 
  });

  // 3. ✉️ Send Invitation (Optimistic)
  const sendMutation = useMutation({
    mutationFn: ({ email, role }: { email: string; role: "EDITOR" | "VIEWER" }) => {
      if (!currentAccountId || !userId) throw new Error("Missing workspace context");
      // Note: We use a placeholder name, the server/recipient will resolve the real name via ID
      return sendInvitation(currentAccountId, "Current Workspace", userId, email, role);
    },
    // --- OPTIMISTIC UPDATE ---
    onMutate: async ({ email, role }) => {
      // A. Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: invitationKeys.outgoing(currentAccountId!) });

      // B. Snapshot previous state
      const previousOutgoing = queryClient.getQueryData<Invitation[]>(invitationKeys.outgoing(currentAccountId!));

      // C. Create fake optimistic invite
      const optimisticInvite: Invitation = {
        id: `temp-${Date.now()}`,
        accountId: currentAccountId!,
        accountName: "Current Workspace", // UI usually displays local context name anyway
        inviterId: userId!,
        email,
        role,
        status: "pending",
        createdAt: Timestamp.now()
      };

      // D. Update Cache
      queryClient.setQueryData(invitationKeys.outgoing(currentAccountId!), (old: Invitation[] = []) => {
        return [...old, optimisticInvite];
      });

      return { previousOutgoing };
    },
    onError: (error: any, _vars, context) => {
      if (context?.previousOutgoing) {
        queryClient.setQueryData(invitationKeys.outgoing(currentAccountId!), context.previousOutgoing);
      }
      toast.error(error.message || "Failed to send invitation");
    },
    onSuccess: () => {
      toast.success("Invitation sent");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: invitationKeys.outgoing(currentAccountId!) });
    }
  });

  // 4. ✅ Accept Invitation (Cross-Hook Optimistic)
  const acceptMutation = useMutation({
    mutationFn: (invitation: Invitation) => {
      if (!userId || !userEmail) throw new Error("Missing auth");
      return acceptInvitation(userId, userEmail, invitation);
    },
    onMutate: async (invitation) => {
      // 1. Cancel incoming refetches
      await queryClient.cancelQueries({ queryKey: invitationKeys.incoming(userEmail!) });
      
      // 2. Snapshot
      const previousIncoming = queryClient.getQueryData<Invitation[]>(invitationKeys.incoming(userEmail!));

      // 3. Optimistically remove from list
      queryClient.setQueryData(invitationKeys.incoming(userEmail!), (old: Invitation[] = []) => 
        old.filter(i => i.id !== invitation.id)
      );

      return { previousIncoming };
    },
    onSuccess: (_data, variables) => {
      toast.success(`Joined ${variables.accountName}`);
      
      // CRITICAL: Force Account List & Profile Refresh to show new workspace in sidebar
      if (userId) {
        queryClient.invalidateQueries({ queryKey: accountKeys.profile(userId) });
        queryClient.invalidateQueries({ queryKey: accountKeys.list(userId) });
      }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousIncoming) {
        queryClient.setQueryData(invitationKeys.incoming(userEmail!), context.previousIncoming);
      }
      toast.error("Failed to accept invitation");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: invitationKeys.incoming(userEmail!) });
    }
  });

  // 5. ❌ Reject/Revoke Invitation (Optimistic)
  // This handles both rejecting (incoming) and revoking (outgoing)
  const rejectMutation = useMutation({
    mutationFn: (invitationId: string) => rejectInvitation(invitationId),
    onMutate: async (invitationId) => {
      // Cancel both possible queries
      await queryClient.cancelQueries({ queryKey: invitationKeys.incoming(userEmail!) });
      if (currentAccountId) {
        await queryClient.cancelQueries({ queryKey: invitationKeys.outgoing(currentAccountId) });
      }

      // Snapshot both
      const previousIncoming = queryClient.getQueryData<Invitation[]>(invitationKeys.incoming(userEmail!));
      const previousOutgoing = currentAccountId 
        ? queryClient.getQueryData<Invitation[]>(invitationKeys.outgoing(currentAccountId)) 
        : undefined;

      // Optimistically Remove from BOTH lists (safest approach)
      queryClient.setQueryData(invitationKeys.incoming(userEmail!), (old: Invitation[] = []) => 
        old.filter(i => i.id !== invitationId)
      );

      if (currentAccountId) {
        queryClient.setQueryData(invitationKeys.outgoing(currentAccountId), (old: Invitation[] = []) => 
          old.filter(i => i.id !== invitationId)
        );
      }

      return { previousIncoming, previousOutgoing };
    },
    onSuccess: () => {
      toast.info("Invitation removed");
    },
    onError: (_err, _vars, context) => {
      // Rollback
      if (context?.previousIncoming) {
        queryClient.setQueryData(invitationKeys.incoming(userEmail!), context.previousIncoming);
      }
      if (context?.previousOutgoing && currentAccountId) {
        queryClient.setQueryData(invitationKeys.outgoing(currentAccountId), context.previousOutgoing);
      }
      toast.error("Failed to remove invitation");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: invitationKeys.incoming(userEmail!) });
      if (currentAccountId) {
        queryClient.invalidateQueries({ queryKey: invitationKeys.outgoing(currentAccountId) });
      }
    }
  });

  return {
    incomingInvites,
    outgoingInvites,
    isLoading: isLoadingIncoming || isLoadingOutgoing,
    
    sendInvitation: sendMutation.mutateAsync,
    acceptInvitation: acceptMutation.mutateAsync,
    rejectInvitation: rejectMutation.mutateAsync,
    
    isSending: sendMutation.isPending,
    isProcessing: acceptMutation.isPending || rejectMutation.isPending
  };
};