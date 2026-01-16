import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { aiApi } from "@/services/api/modules/ai";
import { useInvalidateProfile } from "@/hooks/use-profile";
import { toast } from "sonner";
import { ChatMessage } from "@/services/api/types";

export function useAIChat() {
  const [searchParams, setSearchParams] = useSearchParams();
  const sessionId = searchParams.get("session");
  const queryClient = useQueryClient();
  const refreshCredits = useInvalidateProfile();

  // --- 1. Auto-Restore Session ---
  useEffect(() => {
    if (!sessionId) {
      const lastSession = localStorage.getItem("last-active-chat");
      if (lastSession) {
        setSearchParams({ session: lastSession }, { replace: true });
      }
    }
  }, [sessionId, setSearchParams]);

  // --- 2. Persist Active Session ---
  useEffect(() => {
    if (sessionId) {
      localStorage.setItem("last-active-chat", sessionId);
    }
  }, [sessionId]);

  // --- 3. Fetch History (Cached) ---
  const historyQuery = useQuery({
    queryKey: ["chat-history", sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      return await aiApi.getHistory(sessionId);
    },
    enabled: !!sessionId,
    staleTime: 1000 * 60 * 5, 
    placeholderData: (prev) => prev,
  });

  // --- 4. Send Message Mutation (FIXED) ---
  const sendMutation = useMutation({
    mutationFn: async ({ message, file }: { message: string; file?: File }) => {
      // ✅ FIX: Use empty string for new chats instead of throwing error
      const activeSessionId = sessionId || "";
      
      if (file) {
        return await aiApi.uploadFile(file, activeSessionId, message);
      }
      return await aiApi.sendMessage(activeSessionId, message);
    },
    onSuccess: (response) => {
      // ✅ FIX: If we started without an ID, the backend created one. Update URL now.
      if (!sessionId && response?.session_id) {
        setSearchParams({ session: response.session_id });
        // Note: The URL change triggers historyQuery to run for the new ID automatically
      } else {
        // Otherwise, just refresh the current chat history
        queryClient.invalidateQueries({ queryKey: ["chat-history", sessionId] });
      }
      
      refreshCredits(); 
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to send message");
    }
  });

  // --- 5. Actions ---
  const clearSession = () => {
    setSearchParams({});
    localStorage.removeItem("last-active-chat");
    // Clear the cache for the "current" view so it looks empty immediately
    queryClient.removeQueries({ queryKey: ["chat-history", sessionId] });
  };

  return {
    sessionId,
    messages: (historyQuery.data || []) as ChatMessage[],
    isLoadingHistory: historyQuery.isLoading,
    isRefetching: historyQuery.isRefetching,
    sendMessage: sendMutation.mutateAsync,
    isSending: sendMutation.isPending,
    clearSession,
  };
}