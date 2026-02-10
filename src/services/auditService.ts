import { collection, doc, serverTimestamp, runTransaction, Transaction } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AuditAction, AuditEntity } from "@/types/audit";

const COLLECTION = "activities";

// Helper to generate log data
const generateLog = (
  accountId: string,
  userId: string,
  action: AuditAction,
  entity: AuditEntity,
  entityId: string,
  description: string,
  metadata?: any
) => ({
  accountId,
  userId,
  action,
  entity,
  entityId,
  description,
  metadata: metadata || null,
  timestamp: serverTimestamp(),
});

// ⚡️ Fire-and-Forget Log (For Strategies)
export const logActivity = async (
  accountId: string,
  userId: string,
  action: AuditAction,
  entity: AuditEntity,
  entityId: string,
  description: string,
  metadata?: any
) => {
  try {
    const logRef = doc(collection(db, COLLECTION));
    const logData = generateLog(accountId, userId, action, entity, entityId, description, metadata);
    
    // Use a lightweight transaction to ensure writes don't overlap strangely
    await runTransaction(db, async (t) => {
      t.set(logRef, logData);
    });
  } catch (error) {
    console.warn("Audit log failed (non-critical):", error);
  }
};

// 🔗 Transactional Log (For Trades - Atomic Safety)
export const logActivityInTransaction = (
  transaction: Transaction,
  accountId: string,
  userId: string,
  action: AuditAction,
  entity: AuditEntity,
  entityId: string,
  description: string,
  metadata?: any
) => {
  const logRef = doc(collection(db, COLLECTION));
  const logData = generateLog(accountId, userId, action, entity, entityId, description, metadata);
  transaction.set(logRef, logData);
};