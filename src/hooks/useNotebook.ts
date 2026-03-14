// src/hooks/useNotebook.ts
import { useState, useEffect, useCallback, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Note, NoteFolder } from "@/types/notebook";
import {
    subscribeToNotes,
    createNote as svcCreateNote,
    updateNote as svcUpdateNote,
    trashNote as svcTrashNote,
    restoreNote as svcRestoreNote,
    deleteNotePermanently as svcDeleteNote,
    getNoteFolders,
    createNoteFolder as svcCreateFolder,
    deleteNoteFolder as svcDeleteFolder,
} from "@/services/notebookService";

/**
 * 🗒️ useNotebook
 * Real-time notes state + mutation helpers for the Notebook page.
 *
 * Notes are streamed via Firestore onSnapshot. Mutations use
 * toast feedback consistent with the rest of the app.
 */
export const useNotebook = (accountId?: string) => {
    const queryClient = useQueryClient();

    // ─── Real-time notes state ───────────────────────────────────
    const [notes, setNotes] = useState<Note[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!accountId) {
            setNotes([]);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        const unsub = subscribeToNotes(accountId, (fresh) => {
            setNotes(fresh);
            setIsLoading(false);
        });
        return unsub;
    }, [accountId]);

    // ─── Custom folders state ────────────────────────────────────
    const [folders, setFolders] = useState<NoteFolder[]>([]);

    useEffect(() => {
        if (!accountId) return;
        getNoteFolders(accountId)
            .then(setFolders)
            .catch((err) => console.error("Failed to load folders:", err));
    }, [accountId]);

    // ─── CREATE ──────────────────────────────────────────────────
    const createMutation = useMutation({
        mutationFn: async (data: {
            title: string;
            content?: string;
            category: string;
            tags?: string[];
            tradeId?: string;
            tradeDate?: string;
            userId: string;
        }) => {
            if (!accountId) throw new Error("No active workspace");
            return svcCreateNote(accountId, data.userId, data);
        },
        onSuccess: () => toast.success("Note created"),
        onError: (err: any) => {
            console.error(err);
            toast.error("Failed to create note");
        },
    });

    // ─── UPDATE ──────────────────────────────────────────────────
    // Debounce key so we don't spam Firestore on every keystroke
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const debouncedUpdate = useCallback(
        (
            noteId: string,
            changes: Partial<Pick<Note, "title" | "content" | "category" | "tags" | "isStarred">>
        ) => {
            if (!accountId) return;
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(async () => {
                try {
                    await svcUpdateNote(accountId, noteId, changes);
                } catch (err) {
                    console.error("Auto-save failed:", err);
                    toast.error("Failed to save note");
                }
            }, 800);
        },
        [accountId]
    );

    const immediateUpdate = useCallback(
        async (
            noteId: string,
            changes: Partial<Pick<Note, "title" | "content" | "category" | "tags" | "isStarred">>
        ) => {
            if (!accountId) return;
            if (debounceRef.current) clearTimeout(debounceRef.current);
            try {
                await svcUpdateNote(accountId, noteId, changes);
            } catch (err) {
                console.error("Save failed:", err);
                toast.error("Failed to save note");
            }
        },
        [accountId]
    );

    // ─── TRASH / RESTORE ─────────────────────────────────────────
    const trashMutation = useMutation({
        mutationFn: (noteId: string) => {
            if (!accountId) throw new Error("No active workspace");
            return svcTrashNote(accountId, noteId);
        },
        onSuccess: () => toast.success("Note moved to trash"),
        onError: () => toast.error("Failed to trash note"),
    });

    const restoreMutation = useMutation({
        mutationFn: (noteId: string) => {
            if (!accountId) throw new Error("No active workspace");
            return svcRestoreNote(accountId, noteId);
        },
        onSuccess: () => toast.success("Note restored"),
        onError: () => toast.error("Failed to restore note"),
    });

    // ─── HARD DELETE ─────────────────────────────────────────────
    const deleteMutation = useMutation({
        mutationFn: (noteId: string) => {
            if (!accountId) throw new Error("No active workspace");
            return svcDeleteNote(accountId, noteId);
        },
        onSuccess: () => toast.success("Note permanently deleted"),
        onError: () => toast.error("Failed to delete note"),
    });

    // ─── FOLDERS ─────────────────────────────────────────────────
    const createFolder = async (name: string): Promise<NoteFolder | null> => {
        if (!accountId) return null;
        try {
            const folder = await svcCreateFolder(accountId, name);
            setFolders((prev) => [...prev, folder]);
            toast.success(`Folder "${name}" created`);
            return folder;
        } catch {
            toast.error("Failed to create folder");
            return null;
        }
    };

    const deleteFolder = async (folderId: string) => {
        if (!accountId) return;
        try {
            await svcDeleteFolder(accountId, folderId);
            setFolders((prev) => prev.filter((f) => f.id !== folderId));
            toast.success("Folder deleted");
        } catch {
            toast.error("Failed to delete folder");
        }
    };

    return {
        // State
        notes,
        folders,
        isLoading,

        // Mutations
        createNote: createMutation.mutate,
        isCreating: createMutation.isPending,

        updateNote: debouncedUpdate,     // auto-save on typing
        saveNote: immediateUpdate,        // explicit save on blur / button

        trashNote: trashMutation.mutate,
        restoreNote: restoreMutation.mutate,
        deleteNote: deleteMutation.mutate,

        // Folders
        createFolder,
        deleteFolder,
    };
};
