import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getJournalNotes, saveJournalNote, JournalNote } from "@/services/journalService";
import { startOfMonth, endOfMonth, subDays, addDays, format } from "date-fns"; // ✅ Import format
import { toast } from "sonner";

export const useJournal = (accountId?: string, currentMonth?: Date) => {
  const queryClient = useQueryClient();
  
  // Calculate date range
  const start = subDays(startOfMonth(currentMonth || new Date()), 7);
  const end = addDays(endOfMonth(currentMonth || new Date()), 7);

  // ✅ FIX: Use local format for query key consistency
  const queryKey = ["journal", accountId, format(start, "yyyy-MM-dd")];

  // 1. Fetch Notes
  const { data: notes = [] } = useQuery({
    queryKey,
    queryFn: () => {
      if (!accountId) return [];
      return getJournalNotes(accountId, start, end);
    },
    enabled: !!accountId,
    staleTime: 1000 * 60 * 5,
  });

  const notesMap = new Map(notes.map(n => [n.date, n.content]));

  // 2. Save Note Mutation
  const saveMutation = useMutation({
    mutationFn: async ({ date, content }: { date: Date, content: string }) => {
      if (!accountId) throw new Error("Missing Account Context");
      return saveJournalNote(accountId, date, content);
    },
    
    onMutate: async ({ date, content }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousNotes = queryClient.getQueryData<JournalNote[]>(queryKey);
      
      // ✅ FIX: Use local format for optimistic update logic
      const dateKey = format(date, "yyyy-MM-dd");

      queryClient.setQueryData(queryKey, (old: JournalNote[] = []) => {
        // Remove old note for this specific date if it exists
        const otherNotes = old.filter(n => n.date !== dateKey);
        // Add new note
        return [...otherNotes, { date: dateKey, content, updatedAt: Date.now() }];
      });

      return { previousNotes };
    },
    onError: (err, vars, context) => {
      console.error("Journal Save Error:", err);
      if (context?.previousNotes) {
        queryClient.setQueryData(queryKey, context.previousNotes);
      }
      toast.error("Failed to save note");
    },
    onSuccess: () => {
      toast.success("Note saved");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    notesMap,
    saveNote: saveMutation.mutate,
    isSaving: saveMutation.isPending
  };
};