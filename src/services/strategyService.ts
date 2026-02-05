import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  orderBy, 
  Timestamp,
  updateDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  Strategy, 
  INITIAL_METRICS, 
  DEFAULT_RULE_GROUPS // ✅ Updated Import
} from "@/types/strategy";

const COLLECTION = "strategies";

/**
 * Creates a robust Strategy document.
 * Accepts a partial strategy object from the UI and fills in system defaults.
 */
export const createStrategy = async (
  userId: string, 
  data: Partial<Strategy>
) => {
  const ref = doc(collection(db, "users", userId, COLLECTION));
  
  // Random color generator for badges
  const randomColor = "#" + Math.floor(Math.random()*16777215).toString(16);

  const newStrategy: Strategy = {
    id: ref.id,
    userId,
    // --- Core Info ---
    name: data.name || "New Strategy",
    description: data.description || "",
    emoji: data.emoji || "⚡",
    color: randomColor,
    
    // --- Classification ---
    style: data.style || "DAY_TRADE",
    assetClasses: data.assetClasses || ["STOCK"],
    trackMissedTrades: false,

    // --- The Playbook ---
    // ✅ FIXED: Correctly assigns the array of rule groups
    rules: data.rules && data.rules.length > 0 
      ? data.rules 
      : DEFAULT_RULE_GROUPS,

    // --- System Defaults ---
    metrics: INITIAL_METRICS, 
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  await setDoc(ref, newStrategy);
  return newStrategy;
};

/**
 * Get all strategies (Fast Read)
 */
export const getStrategies = async (userId: string) => {
  const ref = collection(db, "users", userId, COLLECTION);
  const q = query(ref, orderBy("name", "asc"));
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as Strategy);
};

/**
 * Update Strategy
 */
export const updateStrategy = async (userId: string, strategyId: string, updates: Partial<Strategy>) => {
  const ref = doc(db, "users", userId, COLLECTION, strategyId);
  await updateDoc(ref, {
    ...updates,
    updatedAt: Timestamp.now()
  });
};

/**
 * Delete Strategy
 */
export const deleteStrategy = async (userId: string, strategyId: string) => {
  const ref = doc(db, "users", userId, COLLECTION, strategyId);
  await deleteDoc(ref);
};