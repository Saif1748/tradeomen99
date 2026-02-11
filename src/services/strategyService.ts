import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, // ✅ Added missing import
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  updateDoc, 
  addDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  Strategy, 
  INITIAL_METRICS, 
  DEFAULT_RULE_GROUPS, 
  StrategyStatus 
} from "@/types/strategy";
import { logActivity } from "./auditService";

const COLLECTION_NAME = "strategies";

/**
 * 🟢 Create a robust Strategy (Scoped to Account)
 * Uses a root collection with 'accountId' for multi-user access.
 * Includes Audit Logging.
 */
export const createStrategy = async (
  accountId: string,
  userId: string, // Creator ID
  data: Partial<Strategy>
) => {
  if (!accountId) throw new Error("Workspace context missing.");
  if (!userId) throw new Error("User context missing.");

  const collectionRef = collection(db, COLLECTION_NAME);
  
  // Random color generator for badges (SaaS Polish)
  const randomColor = "#" + Math.floor(Math.random()*16777215).toString(16);

  // We use 'any' briefly here because serverTimestamp() returns a FieldValue, 
  // which technically conflicts with the Timestamp type in the Strategy interface until saved.
  const newStrategy: any = {
    // --- Identity & Access ---
    accountId, 
    userId, // Legacy owner field
    
    // ✅ Audit Fields
    createdBy: userId,
    updatedBy: userId,

    // --- Core Info ---
    name: data.name?.trim() || "New Strategy",
    description: data.description?.trim() || "",
    status: (data.status as StrategyStatus) || "developing",
    emoji: data.emoji || "⚡",
    color: data.color || randomColor,
    
    // --- Classification ---
    style: data.style || "DAY_TRADE",
    assetClasses: data.assetClasses || ["STOCK"],
    trackMissedTrades: false,

    // --- The Playbook ---
    // ✅ Robust Default: Ensure rules structure exists even if empty
    rules: data.rules && data.rules.length > 0 
      ? data.rules 
      : DEFAULT_RULE_GROUPS,

    // --- System Defaults ---
    metrics: INITIAL_METRICS, 
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    // Use addDoc to let Firestore generate the ID automatically
    const docRef = await addDoc(collectionRef, newStrategy);
    
    // 📝 Log Activity
    await logActivity(
      accountId, 
      userId, 
      "CREATE", 
      "STRATEGY", 
      docRef.id, 
      `Created strategy: ${newStrategy.name}`
    );
    
    return { id: docRef.id, ...newStrategy };
  } catch (error) {
    console.error("Error creating strategy:", error);
    throw error;
  }
};

/**
 * 🔵 Get Strategies (Scoped to Account)
 * Fetches all strategies belonging to the active workspace.
 */
export const getStrategies = async (accountId: string) => {
  if (!accountId) return [];

  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("accountId", "==", accountId), // ✅ Filter by Workspace
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Strategy));
  } catch (error) {
    console.error("Error fetching strategies:", error);
    // Return empty array to prevent UI crashes, but log the error
    return [];
  }
};

/**
 * 🔎 Get Single Strategy by ID (The Missing Function)
 * Used by TradeDetailSheet to resolve strategy names.
 */
export const getStrategyById = async (strategyId: string) => {
  if (!strategyId) return null;
  try {
    const docRef = doc(db, COLLECTION_NAME, strategyId);
    const snap = await getDoc(docRef);
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as Strategy) : null;
  } catch (error) {
    console.error(`Error fetching strategy ${strategyId}:`, error);
    return null;
  }
};

/**
 * 🟡 Update Strategy (With Audit)
 */
export const updateStrategy = async (
  strategyId: string, 
  accountId: string,
  userId: string, // ✅ Track who is editing
  updates: Partial<Strategy>
) => {
  if (!strategyId) throw new Error("Strategy ID required for update");
  
  try {
    const docRef = doc(db, COLLECTION_NAME, strategyId);
    
    await updateDoc(docRef, {
      ...updates,
      updatedBy: userId, // ✅ Audit Field
      updatedAt: serverTimestamp()
    });

    // 📝 Log Activity
    await logActivity(
      accountId, 
      userId, 
      "UPDATE", 
      "STRATEGY", 
      strategyId, 
      "Updated strategy configuration",
      updates
    );
  } catch (error) {
    console.error("Error updating strategy:", error);
    throw error;
  }
};

/**
 * 🔴 Delete Strategy (With Audit)
 */
export const deleteStrategy = async (strategy: Strategy, userId: string) => {
  if (!strategy?.id) return;
  
  try {
    const docRef = doc(db, COLLECTION_NAME, strategy.id);
    await deleteDoc(docRef);

    // 📝 Log Activity
    await logActivity(
      strategy.accountId, 
      userId, 
      "DELETE", 
      "STRATEGY", 
      strategy.id, 
      `Deleted strategy: ${strategy.name}`
    );
  } catch (error) {
    console.error("Error deleting strategy:", error);
    throw error;
  }
};