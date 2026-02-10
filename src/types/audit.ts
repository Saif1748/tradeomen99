import { Timestamp } from "firebase/firestore";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE";
export type AuditEntity = "TRADE" | "STRATEGY" | "ACCOUNT" | "EXECUTION";

export interface ActivityLog {
  id: string;
  accountId: string; // 🔒 Scoped to workspace
  userId: string;    // 👤 The actor
  
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  
  description: string;
  metadata?: Record<string, any>; // Snapshot of critical data
  
  timestamp: Timestamp;
}