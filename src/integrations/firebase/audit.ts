// Append-only audit trail in Firestore (`auditLogs`).
// Every dispatcher / lifecycle action is recorded here. Writes never throw into
// the caller's critical path — a failed audit write is logged, not fabricated.
import {
  Timestamp,
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './client';
import { COLLECTIONS } from './schema';

export type AuditEntityType = 'incident' | 'dispatch' | 'vehicle' | 'station' | 'alert';

export interface AuditLog {
  id: string;
  action: string;
  actor: string;
  entityType: AuditEntityType;
  entityId: string;
  detail: string;
  createdAt: Date | null;
}

export interface AuditInput {
  action: string;
  actor: string;
  entityType: AuditEntityType;
  entityId: string;
  detail?: string;
  metadata?: Record<string, unknown>;
}

/** Record an action. Resolves even when the write fails (audit must not block ops). */
export async function writeAuditLog(input: AuditInput): Promise<void> {
  if (!isFirebaseConfigured) return;
  try {
    await addDoc(collection(db, COLLECTIONS.auditLogs), {
      action: input.action,
      actor: input.actor,
      'entity type': input.entityType,
      'entity id': input.entityId,
      detail: input.detail ?? '',
      metadata: input.metadata ?? {},
      'created at': serverTimestamp(),
    });
  } catch (err) {
    console.error('[audit] Failed to write audit log:', err);
  }
}

function pick(data: Record<string, unknown>, ...keys: string[]): unknown {
  for (const k of keys) if (data[k] !== undefined && data[k] !== null) return data[k];
  return undefined;
}

export function mapAuditLog(id: string, data: Record<string, unknown>): AuditLog {
  const created = pick(data, 'created at', 'createdAt');
  return {
    id,
    action: (pick(data, 'action') as string) || 'unknown',
    actor: (pick(data, 'actor') as string) || 'unknown',
    entityType: ((pick(data, 'entity type', 'entityType') as AuditEntityType) || 'incident'),
    entityId: (pick(data, 'entity id', 'entityId') as string) || '',
    detail: (pick(data, 'detail') as string) || '',
    createdAt: created instanceof Timestamp ? created.toDate() : null,
  };
}

/** Realtime subscription to the newest audit entries. */
export function subscribeAuditLogs(
  onData: (logs: AuditLog[]) => void,
  onError: (message: string) => void,
  max = 100,
): () => void {
  if (!isFirebaseConfigured) {
    onError('Firebase is not configured');
    return () => {};
  }
  try {
    return onSnapshot(
      query(collection(db, COLLECTIONS.auditLogs), orderBy('created at', 'desc'), limit(max)),
      (snap) => onData(snap.docs.map((d) => mapAuditLog(d.id, d.data()))),
      (err) => onError(err instanceof Error ? err.message : 'Audit feed unavailable'),
    );
  } catch (err) {
    onError(err instanceof Error ? err.message : 'Audit feed unavailable');
    return () => {};
  }
}
