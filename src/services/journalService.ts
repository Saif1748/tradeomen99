import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  Timestamp 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { format } from "date-fns"; // ✅ Import this to fix timezone issues

export interface JournalNote {
  date: string; // YYYY-MM-DD
  content: string;
  updatedAt: number;
}

// Fetch notes for a specific date range (e.g., current month)
export const getJournalNotes = async (accountId: string, start: Date, end: Date): Promise<JournalNote[]> => {
  if (!accountId) return [];

  const notesRef = collection(db, "accounts", accountId, "journal");
  
  // ✅ FIX: Use local time formatting instead of UTC
  const startStr = format(start, "yyyy-MM-dd");
  const endStr = format(end, "yyyy-MM-dd");

  const q = query(
    notesRef, 
    where("date", ">=", startStr),
    where("date", "<=", endStr)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    date: doc.id,
    ...doc.data()
  } as JournalNote));
};

// Save or Update a note
export const saveJournalNote = async (accountId: string, date: Date, content: string) => {
  if (!accountId) throw new Error("Account ID required");
  
  // ✅ FIX: Ensure the ID matches local date (prevents saving to "yesterday" in UTC)
  const dateKey = format(date, "yyyy-MM-dd");
  
  const noteRef = doc(db, "accounts", accountId, "journal", dateKey);

  const noteData = {
    date: dateKey,
    content,
    updatedAt: Timestamp.now().toMillis()
  };

  await setDoc(noteRef, noteData, { merge: true });

  return noteData;
};