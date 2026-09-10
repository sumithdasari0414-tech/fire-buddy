// Persistence for REAL nearby emergency services resolved through the secure
// Google Places backend function. Nothing is invented: a document only exists
// after a real Places result was returned for a real incident location.
import {
  GeoPoint,
  Timestamp,
  arrayUnion,
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './client';
import { COLLECTIONS } from './schema';

export interface StoredEmergencyService {
  id: string;
  name: string;
  category: string;
  address: string | null;
  phone: string | null;
  mapsUri: string | null;
  location: { lat: number; lng: number } | null;
  seenAt: Date | null;
}

export interface EmergencyServiceInput {
  id: string;
  name: string;
  category: string;
  address?: string | null;
  phone?: string | null;
  mapsUri?: string | null;
  location: { lat: number; lng: number };
}

function safeId(raw: string): string {
  return raw.replace(/[/#?[\]*]/g, '_').slice(0, 200);
}

/** Cache real Places results so dispatch records can reference stable facilities. */
export async function saveEmergencyServices(
  services: EmergencyServiceInput[],
  incidentId?: string | null,
): Promise<void> {
  if (!isFirebaseConfigured || !services.length) return;
  await Promise.all(
    services.map(async (s) => {
      if (!s.id || !Number.isFinite(s.location?.lat) || !Number.isFinite(s.location?.lng)) return;
      const payload: Record<string, unknown> = {
        'place id': s.id,
        name: s.name,
        category: s.category,
        address: s.address ?? null,
        phone: s.phone ?? null,
        'maps uri': s.mapsUri ?? null,
        location: new GeoPoint(s.location.lat, s.location.lng),
        'seen at': serverTimestamp(),
      };
      if (incidentId) payload['incident ids'] = arrayUnion(incidentId);
      try {
        await setDoc(doc(db, COLLECTIONS.emergencyServices, safeId(s.id)), payload, { merge: true });
      } catch (err) {
        console.error('[emergencyServices] Failed to cache facility:', err);
      }
    }),
  );
}

function pick(data: Record<string, unknown>, ...keys: string[]): unknown {
  for (const k of keys) if (data[k] !== undefined && data[k] !== null) return data[k];
  return undefined;
}

export function mapEmergencyService(id: string, data: Record<string, unknown>): StoredEmergencyService {
  const geo = pick(data, 'location');
  const seen = pick(data, 'seen at', 'seenAt');
  return {
    id,
    name: (pick(data, 'name') as string) || id,
    category: (pick(data, 'category') as string) || 'other',
    address: (pick(data, 'address') as string) ?? null,
    phone: (pick(data, 'phone') as string) ?? null,
    mapsUri: (pick(data, 'maps uri', 'mapsUri') as string) ?? null,
    location: geo instanceof GeoPoint ? { lat: geo.latitude, lng: geo.longitude } : null,
    seenAt: seen instanceof Timestamp ? seen.toDate() : null,
  };
}

export function subscribeEmergencyServices(
  onData: (services: StoredEmergencyService[]) => void,
  onError: (message: string) => void,
): () => void {
  if (!isFirebaseConfigured) {
    onError('Firebase is not configured');
    return () => {};
  }
  try {
    return onSnapshot(
      query(collection(db, COLLECTIONS.emergencyServices)),
      (snap) => onData(snap.docs.map((d) => mapEmergencyService(d.id, d.data()))),
      (err) => onError(err instanceof Error ? err.message : 'Emergency services feed unavailable'),
    );
  } catch (err) {
    onError(err instanceof Error ? err.message : 'Emergency services feed unavailable');
    return () => {};
  }
}
