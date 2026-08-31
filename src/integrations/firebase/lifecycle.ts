// Incident lifecycle writes to Firestore.
// unverified → acknowledged → verified → dispatched → en_route → arrived → resolved
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './client';
import { LIFECYCLE, type LifecycleStatus } from './vehicles';

export { LIFECYCLE };
export type { LifecycleStatus };

/** The status that may follow the given one, or null at the end of the lifecycle. */
export function nextStatus(current: LifecycleStatus): LifecycleStatus | null {
  const i = LIFECYCLE.indexOf(current);
  return i >= 0 && i < LIFECYCLE.length - 1 ? LIFECYCLE[i + 1] : null;
}

export interface AcknowledgeMeta {
  stationId: string;
  stationName: string;
}

/** Advance an incident to a lifecycle status. Throws on failure so the UI can report it. */
export async function setIncidentStatus(
  incidentId: string,
  status: LifecycleStatus,
  meta: Partial<AcknowledgeMeta> = {},
): Promise<void> {
  if (!isFirebaseConfigured) throw new Error('Firebase is not configured');
  const payload: Record<string, unknown> = { status, 'status updated at': serverTimestamp() };
  if (meta.stationId) payload['acknowledged by station'] = meta.stationId;
  if (meta.stationName) payload['acknowledged by station name'] = meta.stationName;
  if (status === 'acknowledged') payload['acknowledged at'] = serverTimestamp();
  if (status === 'resolved') payload['resolved at'] = serverTimestamp();
  await updateDoc(doc(db, 'incidents', incidentId), payload);
}

/** Record that a station has taken ownership of a real incident. */
export function acknowledgeIncident(incidentId: string, meta: AcknowledgeMeta): Promise<void> {
  return setIncidentStatus(incidentId, 'acknowledged', meta);
}
