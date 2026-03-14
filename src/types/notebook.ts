// src/types/notebook.ts
import { Timestamp } from "firebase/firestore";

// Built-in category names (also used as folder labels in the UI)
export type BuiltInCategory = "Daily Note" | "Trade Note" | "Personal Note";

// A category can be a built-in name or any custom string created by the user
export type NoteCategory = BuiltInCategory | string;

// --- 📒 Note ---
// Stored in sub-collection: /accounts/{accountId}/notes/{noteId}
export interface Note {
    id: string;

    // --- Identity ---
    accountId: string; // Workspace isolation key
    userId: string;    // Creator / owner

    // --- Content ---
    title: string;
    content: string; // Plain text / markdown body

    // --- Classification ---
    category: NoteCategory;
    tags: string[];
    isStarred: boolean;
    isTrashed: boolean;

    // --- Trade Link (optional) ---
    tradeId?: string;    // Links to a specific trade document ID
    tradeDate?: string;  // YYYY-MM-DD, used by Daily Notes

    // --- Time Metadata ---
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// --- 📂 Custom Folder ---
// Stored in: /accounts/{accountId}/noteFolders/{folderId}
export interface NoteFolder {
    id: string;
    accountId: string;
    name: string;       // Display label (used as category value on Notes)
    createdAt: Timestamp;
}
