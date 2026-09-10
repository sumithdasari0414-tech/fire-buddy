// Dispatch records with a mandatory dispatcher approval layer.
//
// A dispatch is never created automatically and never sent to any external
// system. Flow:
//   1. Operator raises a dispatch request for a REAL incident + REAL station
//      (+ optional REAL vehicle)   → status 'pending_approval', incident moves
//      to `dispatch_ready`.
//   2. A dispatcher approves or rejects it. Only an approval moves the incident
//      to `dispatched`.
//   3. Handover to an authorized fire-service system goes through
//      src/services/dispatchService.ts, which has NO live integration yet.
import {
  GeoPoint,
  Timestamp,
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './client';
import { COLLECTIONS } from './schema';
import { writeAuditLog } from './audit';
import { setIncidentStatus } from './lifecycle';
import { setVehicleStatus } from './vehicles';

export type DispatchStatus =
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'completed';

export type DispatcherAction = 'requested' | 'approved' | 'rejected' | 'cancelled' | 'completed';

export interface DispatchHistoryEntry {
  action: DispatcherAction | string;
  actor: string;
  at: Date | null;
  note?: string;
}

export interface DispatchRecord {
  id: string;
  incidentId: string;
  incidentLocation: { lat: number; lng: number } | null;
  stationId: string;
  stationName: string;
  vehicleId: string | null;
  vehicleCallsign: string | null;
  status: DispatchStatus;
  dispatcherAction: DispatcherAction | null;
  dispatcherId: string | null;
  requestedBy: string;
  requestedAt: Date | null;
  decidedAt: Date | null;
  decisionNote: string | null;
  /** Reserved for a future authorized fire-service integration. Never faked. */
  externalReference: string | null;
  history: DispatchHistoryEntry[];
}

function pick(data: Record<string, unknown>, ...keys: string[]): unknown {
  for (const k of keys) if (data[k] !== undefined && data[k] !== null) return data[k];
  return undefined;
}

function asDispatchStatus(raw: unknown): DispatchStatus {
  const v = typeof raw === 'string' ? raw.trim().toLowerCase().replace(/[\s-]+/g, '_') : '';
  return v === 'approved' || v === 'rejected' || v === 'cancelled' || v === 'completed'
    ? v
    : 'pending_approval';
}

function asDate(raw: unknown): Date | null {
  return raw instanceof Timestamp ? raw.toDate() : raw instanceof Date ? raw : null;
}

function asHistory(raw: unknown): DispatchHistoryEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((e): e is Record<string, unknown> => typeof e === 'object' && e !== null)
    .map((e) => ({
      action: (e.action as string) || 'unknown',
      actor: (e.actor as string) || 'unknown',
      at: asDate(e.at),
      note: (e.note as string) || undefined,
    }));
}

export function mapDispatch(id: string, data: Record<string, unknown>): DispatchRecord {
  const geo = pick(data, 'incident location', 'location');
  return {
    id,
    incidentId: (pick(data, 'incident id', 'incidentId') as string) || '',
    incidentLocation: geo instanceof GeoPoint ? { lat: geo.latitude, lng: geo.longitude } : null,
    stationId: (pick(data, 'station id', 'stationId') as string) || '',
    stationName: (pick(data, 'station name', 'stationName') as string) || '',
    vehicleId: (pick(data, 'vehicle id', 'vehicleId') as string) ?? null,
    vehicleCallsign: (pick(data, 'vehicle callsign', 'vehicleCallsign') as string) ?? null,
    status: asDispatchStatus(pick(data, 'status')),
    dispatcherAction: (pick(data, 'dispatcher action', 'dispatcherAction') as DispatcherAction) ?? null,
    dispatcherId: (pick(data, 'dispatcher id', 'dispatcherId') as string) ?? null,
    requestedBy: (pick(data, 'requested by', 'requestedBy') as string) || 'unknown',
    requestedAt: asDate(pick(data, 'requested at', 'requestedAt', 'created at')),
    decidedAt: asDate(pick(data, 'decided at', 'decidedAt')),
    decisionNote: (pick(data, 'decision note', 'decisionNote') as string) ?? null,
    externalReference: (pick(data, 'external reference', 'externalReference') as string) ?? null,
    history: asHistory(pick(data, 'history')),
  };
}

/** Realtime subscription to dispatch records, newest first. */
export function subscribeDispatches(
  onData: (dispatches: DispatchRecord[]) => void,
  onError: (message: string) => void,
): () => void {
  if (!isFirebaseConfigured) {
    onError('Firebase is not configured');
    return () => {};
  }
  try {
    return onSnapshot(
      query(collection(db, COLLECTIONS.dispatches), orderBy('requested at', 'desc')),
      (snap) => onData(snap.docs.map((d) => mapDispatch(d.id, d.data()))),
      (err) => onError(err instanceof Error ? err.message : 'Dispatch feed unavailable'),
    );
  } catch (err) {
    onError(err instanceof Error ? err.message : 'Dispatch feed unavailable');
    return () => {};
  }
}

export interface DispatchRequestInput {
  incidentId: string;
  incidentLocation: { lat: number; lng: number } | null;
  stationId: string;
  stationName: string;
  vehicleId?: string | null;
  vehicleCallsign?: string | null;
  requestedBy: string;
  note?: string;
}

/**
 * Raise a dispatch request that a dispatcher must approve. Moves the incident to
 * `dispatch_ready`; no vehicle is dispatched and no external system is called.
 */
export async function requestDispatch(input: DispatchRequestInput): Promise<string> {
  if (!isFirebaseConfigured) throw new Error('Firebase is not configured');
  if (!input.incidentId || !input.stationId) throw new Error('A real incident and station are required');

  const entry = {
    action: 'requested' as const,
    actor: input.requestedBy,
    at: Timestamp.now(),
    note: input.note ?? '',
  };

  const ref = await addDoc(collection(db, COLLECTIONS.dispatches), {
    'incident id': input.incidentId,
    'incident location': input.incidentLocation
      ? new GeoPoint(input.incidentLocation.lat, input.incidentLocation.lng)
      : null,
    'station id': input.stationId,
    'station name': input.stationName,
    'vehicle id': input.vehicleId ?? null,
    'vehicle callsign': input.vehicleCallsign ?? null,
    status: 'pending_approval',
    'dispatcher action': 'requested',
    'dispatcher id': null,
    'requested by': input.requestedBy,
    'requested at': serverTimestamp(),
    'decided at': null,
    'decision note': input.note ?? null,
    'external reference': null,
    history: [entry],
  });

  await setIncidentStatus(input.incidentId, 'dispatch_ready');
  await writeAuditLog({
    action: 'dispatch.requested',
    actor: input.requestedBy,
    entityType: 'dispatch',
    entityId: ref.id,
    detail: `Dispatch requested for incident ${input.incidentId} from ${input.stationName}`,
    metadata: { incidentId: input.incidentId, stationId: input.stationId, vehicleId: input.vehicleId ?? null },
  });
  return ref.id;
}

async function appendHistory(dispatchId: string, entry: DispatchHistoryEntry & { at: Date }) {
  const ref = doc(db, COLLECTIONS.dispatches, dispatchId);
  const snap = await getDoc(ref);
  const existing = asHistory(snap.data()?.history);
  return {
    ref,
    history: [
      ...existing.map((h) => ({ action: h.action, actor: h.actor, at: h.at ? Timestamp.fromDate(h.at) : null, note: h.note ?? '' })),
      { action: entry.action, actor: entry.actor, at: Timestamp.fromDate(entry.at), note: entry.note ?? '' },
    ],
  };
}

/** Dispatcher approval — the only path that moves an incident to `dispatched`. */
export async function approveDispatch(
  dispatch: DispatchRecord,
  dispatcherId: string,
  note?: string,
): Promise<void> {
  if (!isFirebaseConfigured) throw new Error('Firebase is not configured');
  const { ref, history } = await appendHistory(dispatch.id, {
    action: 'approved',
    actor: dispatcherId,
    at: new Date(),
    note,
  });
  await updateDoc(ref, {
    status: 'approved',
    'dispatcher action': 'approved',
    'dispatcher id': dispatcherId,
    'decided at': serverTimestamp(),
    'decision note': note ?? null,
    history,
  });
  await setIncidentStatus(dispatch.incidentId, 'dispatched');
  if (dispatch.vehicleId) {
    try {
      await setVehicleStatus(dispatch.vehicleId, 'dispatched');
    } catch (err) {
      console.error('[dispatch] Could not update vehicle status:', err);
    }
  }
  await writeAuditLog({
    action: 'dispatch.approved',
    actor: dispatcherId,
    entityType: 'dispatch',
    entityId: dispatch.id,
    detail: `Dispatch approved for incident ${dispatch.incidentId}`,
    metadata: { incidentId: dispatch.incidentId, stationId: dispatch.stationId, vehicleId: dispatch.vehicleId },
  });
}

/** Dispatcher rejection — the incident returns to `verified`, nothing is dispatched. */
export async function rejectDispatch(
  dispatch: DispatchRecord,
  dispatcherId: string,
  note?: string,
): Promise<void> {
  if (!isFirebaseConfigured) throw new Error('Firebase is not configured');
  const { ref, history } = await appendHistory(dispatch.id, {
    action: 'rejected',
    actor: dispatcherId,
    at: new Date(),
    note,
  });
  await updateDoc(ref, {
    status: 'rejected',
    'dispatcher action': 'rejected',
    'dispatcher id': dispatcherId,
    'decided at': serverTimestamp(),
    'decision note': note ?? null,
    history,
  });
  await setIncidentStatus(dispatch.incidentId, 'verified');
  await writeAuditLog({
    action: 'dispatch.rejected',
    actor: dispatcherId,
    entityType: 'dispatch',
    entityId: dispatch.id,
    detail: `Dispatch rejected for incident ${dispatch.incidentId}`,
    metadata: { note: note ?? null },
  });
}

/** Mark an approved dispatch as completed once the incident is resolved. */
export async function completeDispatch(dispatch: DispatchRecord, actor: string): Promise<void> {
  if (!isFirebaseConfigured) throw new Error('Firebase is not configured');
  const { ref, history } = await appendHistory(dispatch.id, {
    action: 'completed',
    actor,
    at: new Date(),
  });
  await updateDoc(ref, {
    status: 'completed',
    'dispatcher action': 'completed',
    history,
  });
  await writeAuditLog({
    action: 'dispatch.completed',
    actor,
    entityType: 'dispatch',
    entityId: dispatch.id,
    detail: `Dispatch completed for incident ${dispatch.incidentId}`,
  });
}

/** Record the reference returned by a future authorized fire-service integration. */
export async function attachExternalReference(dispatchId: string, reference: string, actor: string): Promise<void> {
  if (!isFirebaseConfigured) throw new Error('Firebase is not configured');
  await updateDoc(doc(db, COLLECTIONS.dispatches, dispatchId), { 'external reference': reference });
  await writeAuditLog({
    action: 'dispatch.external_reference_attached',
    actor,
    entityType: 'dispatch',
    entityId: dispatchId,
    detail: `External reference recorded: ${reference}`,
  });
}
