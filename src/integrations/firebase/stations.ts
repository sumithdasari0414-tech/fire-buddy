// Verified fire stations and realtime station alerts, Firestore only.
// Stations are NOT invented here: only documents that actually exist in the
// Firestore `stations` collection are used. If the collection is empty the UI
// shows an honest empty state instead of fabricated stations.
import {
  GeoPoint,
  Timestamp,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './client';

export interface VerifiedStation {
  id: string;
  name: string;
  location: { lat: number; lng: number };
  address: string;
  phone: string;
  engines: number | null;
  ambulances: number | null
  status: 'operational' | 'busy' | 'offline';
  verified: boolean;
}

export interface StationAlert {
  id: string;
  incidentId: string;
  stationId: string;
  stationName: string;
  location: { lat: number; lng: number } | null;
  severity: string;
  acknowledged: boolean;
  createdAt: Date | null;
}

function pick(data: Record<string, unknown>, ...keys: string[]): unknown {
  for (const k of keys) if (data[k] !== undefined && data[k] !== null) return data[k];
  return undefined;
}

function asStatus(raw: unknown): VerifiedStation['status'] {
  const v = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  return v === 'busy' || v === 'offline' ? v : 'operational';
}

function asNum(raw: unknown): number | null {
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function mapStation(id: string, data: Record<string, unknown>): VerifiedStation | null {
  const geo = pick(data, 'location', 'position');
  let lat: number | null = null;
  let lng: number | null = null;
  if (geo instanceof GeoPoint) {
    lat = geo.latitude;
    lng = geo.longitude;
  } else {
    lat = asNum(pick(data, 'latitude', 'lat'));
    lng = asNum(pick(data, 'longitude', 'lng'));
  }
  // A station without real coordinates cannot be routed to — drop it.
  if (lat === null || lng === null || (lat === 0 && lng === 0)) return null;

  return {
    id,
    name: (pick(data, 'name', 'station name') as string) || id,
    location: { lat, lng },
    address: (pick(data, 'address') as string) || '—',
    phone: (pick(data, 'phone', 'contact') as string) || '—',
    engines: asNum(pick(data, 'engines')),
    ambulances: asNum(pick(data, 'ambulances')),
    status: asStatus(pick(data, 'status')),
    verified: pick(data, 'verified') !== false,
  };
}

/** Realtime subscription to verified stations. */
export function subscribeStations(
  onData: (stations: VerifiedStation[]) => void,
  onError: (message: string) => void,
): () => void {
  if (!isFirebaseConfigured) {
    onError('Firebase is not configured');
    return () => {};
  }
  try {
    return onSnapshot(
      query(collection(db, 'stations')),
      (snap) => {
        const stations = snap.docs
          .map((d) => mapStation(d.id, d.data()))
          .filter((s): s is VerifiedStation => s !== null && s.verified);
        onData(stations);
      },
      (err) => onError(err instanceof Error ? err.message : 'Station feed unavailable'),
    );
  } catch (err) {
    onError(err instanceof Error ? err.message : 'Station feed unavailable');
    return () => {};
  }
}

/** Great-circle distance in km — used only to rank real stations. */
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Nearest station that is actually available (not offline). */
export function nearestAvailableStation(
  stations: VerifiedStation[],
  point: { lat: number; lng: number },
): VerifiedStation | null {
  const available = stations.filter((s) => s.status !== 'offline');
  if (!available.length) return null;
  return [...available].sort((a, b) => distanceKm(a.location, point) - distanceKm(b.location, point))[0];
}

/**
 * Create a realtime alert/assignment for a station. Deterministic id keeps one
 * alert per incident+station. No vehicle is dispatched automatically.
 */
export async function createStationAlert(params: {
  incidentId: string;
  station: VerifiedStation;
  location: { lat: number; lng: number };
  severity: string;
  locationName?: string;
}): Promise<void> {
  if (!isFirebaseConfigured) throw new Error('Firebase is not configured');
  const id = `${params.incidentId}__${params.station.id}`;
  const ref = doc(db, 'alerts', id);
  const existing = await getDoc(ref);
  if (existing.exists()) return;
  await setDoc(ref, {
    'incident id': params.incidentId,
    'station id': params.station.id,
    'station name': params.station.name,
    location: new GeoPoint(params.location.lat, params.location.lng),
    'location name': params.locationName ?? `${params.location.lat.toFixed(4)}, ${params.location.lng.toFixed(4)}`,
    severity: params.severity,
    status: 'notified',
    acknowledged: false,
    'created at': serverTimestamp(),
  });
}

export function mapAlert(id: string, data: Record<string, unknown>): StationAlert {
  const geo = pick(data, 'location');
  const created = pick(data, 'created at', 'createdAt');
  return {
    id,
    incidentId: (pick(data, 'incident id', 'incidentId') as string) || '',
    stationId: (pick(data, 'station id', 'stationId') as string) || '',
    stationName: (pick(data, 'station name', 'stationName') as string) || '',
    location: geo instanceof GeoPoint ? { lat: geo.latitude, lng: geo.longitude } : null,
    severity: (pick(data, 'severity') as string) || 'medium',
    acknowledged: pick(data, 'acknowledged') === true,
    createdAt: created instanceof Timestamp ? created.toDate() : null,
  };
}

/** Realtime subscription to station alerts. */
export function subscribeAlerts(
  onData: (alerts: StationAlert[]) => void,
  onError: (message: string) => void,
): () => void {
  if (!isFirebaseConfigured) {
    onError('Firebase is not configured');
    return () => {};
  }
  try {
    return onSnapshot(
      query(collection(db, 'alerts')),
      (snap) => onData(snap.docs.map((d) => mapAlert(d.id, d.data()))),
      (err) => onError(err instanceof Error ? err.message : 'Alert feed unavailable'),
    );
  } catch (err) {
    onError(err instanceof Error ? err.message : 'Alert feed unavailable');
    return () => {};
  }
}
