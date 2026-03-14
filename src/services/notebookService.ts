// src/services/notebookService.ts
import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    Timestamp,
    Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Note, NoteFolder } from "@/types/notebook";

// ─────────────────────────────────────────
// 🔧 Helpers
// ─────────────────────────────────────────

const notesRef = (accountId: string) =>
    collection(db, "accounts", accountId, "notes");

const foldersRef = (accountId: string) =>
    collection(db, "accounts", accountId, "noteFolders");

const noteRef = (accountId: string, noteId: string) =>
    doc(db, "accounts", accountId, "notes", noteId);

/**
 * Strips `undefined` fields so Firestore doesn't throw.
 */
const sanitize = <T extends object>(obj: T): Partial<T> =>
    Object.fromEntries(
        Object.entries(obj).filter(([, v]) => v !== undefined)
    ) as Partial<T>;

// ─────────────────────────────────────────
// 📡 Real-time Listener
// ─────────────────────────────────────────

/**
 * Subscribes to all notes for an account, ordered newest first.
 * Returns the Firestore unsubscribe function.
 */
export const subscribeToNotes = (
    accountId: string,
    callback: (notes: Note[]) => void
): Unsubscribe => {
    const q = query(notesRef(accountId), orderBy("updatedAt", "desc"));
    return onSnapshot(q, (snapshot) => {
        const notes = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Note));
        callback(notes);
    });
};

// ─────────────────────────────────────────
// ✅ CREATE
// ─────────────────────────────────────────

export const createNote = async (
    accountId: string,
    userId: string,
    data: {
        title: string;
        content?: string;
        category: string;
        tags?: string[];
        tradeId?: string;
        tradeDate?: string;
    }
): Promise<Note> => {
    const now = Timestamp.now();
    const noteData = sanitize({
        accountId,
        userId,
        title: data.title || "Untitled",
        content: data.content || "",
        category: data.category,
        tags: data.tags || [],
        isStarred: false,
        isTrashed: false,
        tradeId: data.tradeId,
        tradeDate: data.tradeDate,
        createdAt: now,
        updatedAt: now,
    });

    const ref = await addDoc(notesRef(accountId), noteData);
    return { id: ref.id, ...noteData } as Note;
};

// ─────────────────────────────────────────
// ✏️ UPDATE
// ─────────────────────────────────────────

export const updateNote = async (
    accountId: string,
    noteId: string,
    changes: Partial<Pick<Note, "title" | "content" | "category" | "tags" | "isStarred">>
): Promise<void> => {
    await updateDoc(noteRef(accountId, noteId), {
        ...sanitize(changes),
        updatedAt: serverTimestamp(),
    });
};

// ─────────────────────────────────────────
// 🗑️ TRASH / RESTORE
// ─────────────────────────────────────────

export const trashNote = async (accountId: string, noteId: string): Promise<void> => {
    await updateDoc(noteRef(accountId, noteId), {
        isTrashed: true,
        updatedAt: serverTimestamp(),
    });
};

export const restoreNote = async (accountId: string, noteId: string): Promise<void> => {
    await updateDoc(noteRef(accountId, noteId), {
        isTrashed: false,
        updatedAt: serverTimestamp(),
    });
};

// ─────────────────────────────────────────
// ❌ HARD DELETE
// ─────────────────────────────────────────

export const deleteNotePermanently = async (
    accountId: string,
    noteId: string
): Promise<void> => {
    await deleteDoc(noteRef(accountId, noteId));
};

// ─────────────────────────────────────────
// 📂 CUSTOM FOLDERS
// ─────────────────────────────────────────

export const getNoteFolders = async (accountId: string): Promise<NoteFolder[]> => {
    const snap = await getDocs(query(foldersRef(accountId), orderBy("createdAt", "asc")));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as NoteFolder));
};

export const createNoteFolder = async (
    accountId: string,
    name: string
): Promise<NoteFolder> => {
    const now = Timestamp.now();
    const data = { accountId, name, createdAt: now };
    const ref = await addDoc(foldersRef(accountId), data);
    return { id: ref.id, ...data };
};

export const deleteNoteFolder = async (
    accountId: string,
    folderId: string
): Promise<void> => {
    await deleteDoc(doc(db, "accounts", accountId, "noteFolders", folderId));
};
