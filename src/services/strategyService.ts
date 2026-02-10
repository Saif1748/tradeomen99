import { 
  collection, 
  doc, 
  getDocs, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  Timestamp, 
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
import { logActivity } from "./auditService"; // ✅ Import Audit Service

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
    return [];
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
  if (!strategyId) return;
  const docRef = doc(db, COLLECTION_NAME, strategyId);
  
  await updateDoc(docRef, {
    ...updates,
    updatedBy: userId, // ✅ Audit Field
    updatedAt: serverTimestamp()
  });

  // 📝 Log Activity
  // We log a generic update here. For highly detailed logs, we'd compare old vs new.
  await logActivity(
    accountId, 
    userId, 
    "UPDATE", 
    "STRATEGY", 
    strategyId, 
    "Updated strategy configuration",
    updates
  );
};

/**
 * 🔴 Delete Strategy (With Audit)
 */
export const deleteStrategy = async (strategy: Strategy, userId: string) => {
  if (!strategy?.id) return;
  
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
};