// Real emergency-vehicle telemetry backed by the Firestore `vehicles` collection.
// No simulated movement: a vehicle position only exists here when a real device
// has reported it (see reportDeviceLocation, which uses the browser Geolocation API).
import {
  GeoPoint,
  Timestamp,
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './client';

export type VehicleType = 'fire_engine' | 'ambulance' | 'police' | 'other';

/** Shared responder lifecycle. */
export const LIFECYCLE = [
  'unverified',
  'acknowledged',
  'verified',
  'dispatched',
  'en_route',
  'arrived',
  'resolved',
] as const;
export type LifecycleStatus = (typeof LIFECYCLE)[number];

export function asLifecycle(raw: unknown, fallback: LifecycleStatus = 'unverified'): LifecycleStatus {
  const v = typeof raw === 'string' ? raw.trim().toLowerCase().replace(/[\s-]+/g, '_') : '';
  return (LIFECYCLE as readonly string[]).includes(v) ? (v as LifecycleStatus) : fallback;
}

export interface LiveVehicle {
  id: string;
  callsign: string;
  type: VehicleType;
  status: LifecycleStatus;
  /** Null until a real GPS fix has been reported for this vehicle. */
  location: { lat: number; lng: number } | null;
  /** Real reported speed in km/h, null when unknown. */
  speedKmh: number | null;
  assignedIncidentId: string | null;
  stationId: string | null;
  updatedAt: Date | null;
}

function pick(doc: Record<string, unknown>, ...keys: string[]): unknown {
  for (const k of keys) if (doc[k] !== undefined && doc[k] !== null) return doc[k];
  return undefined;
}

function asType(raw: unknown): VehicleType {
  const v = typeof raw === 'string' ? raw.trim().toLowerCase().replace(/[\s-]+/g, '_') : '';
  return v === 'fire_engine' || v === 'ambulance' || v === 'police' ? v : 'other';
}

export function mapVehicle(id: string, data: Record<string, unknown>): LiveVehicle {
  const geo = pick(data, 'location', 'position');
  const point = geo instanceof GeoPoint ? { lat: geo.latitude, lng: geo.longitude } : null;
  const lat = Number(pick(data, 'latitude', 'lat'));
  const lng = Number(pick(data, 'longitude', 'lng'));
  const fallbackPoint =
    Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0) ? { lat, lng } : null;

  const speed = Number(pick(data, 'speed kmh', 'speedKmh', 'speed'));
  const updated = pick(data, 'updated at', 'updatedAt', 'last seen', 'lastSeen');

  return {
    id,
    callsign: (pick(data, 'callsign', 'call sign', 'name') as string) || id,
    type: asType(pick(data, 'type', 'vehicle type')),
    status: asLifecycle(pick(data, 'status'), 'unverified'),
    location: point ?? fallbackPoint,
    speedKmh: Number.isFinite(speed) ? speed : null,
    assignedIncidentId: (pick(data, 'assigned incident', 'assignedIncidentId', 'incident id') as string) || null,
    stationId: (pick(data, 'station id', 'stationId') as string) || null,
    updatedAt: updated instanceof Timestamp ? updated.toDate() : null,
  };
}

/** Realtime subscription to every vehicle. Returns an unsubscribe function. */
export function subscribeVehicles(
  onData: (vehicles: LiveVehicle[]) => void,
  onError: (message: string) => void,
): () => void {
  if (!isFirebaseConfigured) {
    onError('Firebase is not configured');
    return () => {};
  }
  try {
    return onSnapshot(
      query(collection(db, 'vehicles')),
      (snap) => onData(snap.docs.map((d) => mapVehicle(d.id, d.data()))),
      (err) => onError(err instanceof Error ? err.message : 'Vehicle feed unavailable'),
    );
  } catch (err) {
    onError(err instanceof Error ? err.message : 'Vehicle feed unavailable');
    return () => {};
  }
}

/** Persist a real GPS fix for a vehicle. */
export async function reportVehicleLocation(
  vehicleId: string,
  fix: { lat: number; lng: number; speedKmh?: number | null },
  extra: Partial<{ status: LifecycleStatus; assignedIncidentId: string | null; callsign: string; type: VehicleType }> = {},
): Promise<void> {
  if (!isFirebaseConfigured) throw new Error('Firebase is not configured');
  const payload: Record<string, unknown> = {
    location: new GeoPoint(fix.lat, fix.lng),
    'updated at': serverTimestamp(),
  };
  if (fix.speedKmh !== undefined && fix.speedKmh !== null) payload['speed kmh'] = fix.speedKmh;
  if (extra.status) payload.status = extra.status;
  if (extra.assignedIncidentId !== undefined) payload['assigned incident'] = extra.assignedIncidentId;
  if (extra.callsign) payload.callsign = extra.callsign;
  if (extra.type) payload.type = extra.type;
  await setDoc(doc(db, 'vehicles', vehicleId), payload, { merge: true });
}

/** Update only the lifecycle status of a vehicle. */
export async function setVehicleStatus(vehicleId: string, status: LifecycleStatus): Promise<void> {
  if (!isFirebaseConfigured) throw new Error('Firebase is not configured');
  await setDoc(doc(db, 'vehicles', vehicleId), { status, 'updated at': serverTimestamp() }, { merge: true });
}
