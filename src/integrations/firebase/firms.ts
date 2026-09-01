// NASA FIRMS VIIRS ingestion into Firestore.
// The detections themselves are fetched through the secure server-side
// `fetch-firms-fires` function (the FIRMS key never reaches the browser); every
// detection is then stored in the Firestore `incidents` collection using a
// deterministic document id so re-runs never create duplicates.
import { GeoPoint, Timestamp, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { supabase } from '@/integrations/supabase/client';
import { db, isFirebaseConfigured } from './client';

export interface FirmsDetection {
  firmsId: string;
  lat: number;
  lng: number;
  acquiredAt: string;
  confidence: 'low' | 'nominal' | 'high';
  frp: number | null;
  brightness: number | null;
  satellite: string;
  source: string;
  daynight: string;
}

export interface FirmsFetchResult {
  detections: FirmsDetection[];
  warnings: string[];
  fetchedAt: string;
}

/** Fire radiative power drives severity — no invented numbers. */
export function severityFromFrp(frp: number | null, confidence: string): 'low' | 'medium' | 'high' | 'critical' {
  const value = frp ?? 0;
  if (value >= 25) return 'critical';
  if (value >= 10) return 'high';
  if (value >= 3) return confidence === 'low' ? 'medium' : 'high';
  return confidence === 'high' ? 'medium' : 'low';
}

/** Call the secure backend function and return deduplicated detections. */
export async function fetchFirmsDetections(days = 1): Promise<FirmsFetchResult> {
  const { data, error } = await supabase.functions.invoke('fetch-firms-fires', { body: { days } });
  if (error) throw new Error(error.message || 'NASA FIRMS request failed');
  if (!data || !Array.isArray(data.detections)) throw new Error('NASA FIRMS returned no usable data');
  return {
    detections: data.detections as FirmsDetection[],
    warnings: Array.isArray(data.warnings) ? data.warnings : [],
    fetchedAt: typeof data.fetchedAt === 'string' ? data.fetchedAt : new Date().toISOString(),
  };
}

/**
 * Persist detections as real incidents. Existing documents are left untouched
 * so responder lifecycle changes are never overwritten by a later poll.
 */
export async function storeDetections(detections: FirmsDetection[]): Promise<{ created: number; skipped: number }> {
  if (!isFirebaseConfigured) throw new Error('Firebase is not configured');
  let created = 0;
  let skipped = 0;

  for (const d of detections) {
    const ref = doc(db, 'incidents', d.firmsId);
    const existing = await getDoc(ref);
    if (existing.exists()) {
      skipped += 1;
      continue;
    }
    await setDoc(ref, {
      title: `VIIRS thermal detection (${d.satellite})`,
      description: `NASA FIRMS ${d.source} detected a thermal anomaly at ${d.lat.toFixed(4)}, ${d.lng.toFixed(4)} (${d.confidence} confidence${d.frp !== null ? `, FRP ${d.frp} MW` : ''}). Requires ground verification.`,
      location: new GeoPoint(d.lat, d.lng),
      'location name': `${d.lat.toFixed(4)}°N, ${d.lng.toFixed(4)}°E`,
      city: 'Hyderabad',
      severity: severityFromFrp(d.frp, d.confidence),
      status: 'unverified',
      'incident date': Timestamp.fromDate(new Date(d.acquiredAt)),
      'created at': serverTimestamp(),
      'detection source': 'satellite',
      provider: 'NASA FIRMS',
      'firms id': d.firmsId,
      confidence: d.confidence,
      frp: d.frp,
      brightness: d.brightness,
      satellite: d.satellite,
      source: d.source,
      daynight: d.daynight,
    });
    created += 1;
  }

  return { created, skipped };
}

/** Fetch + store in one call. */
export async function ingestFirmsDetections(days = 1) {
  const { detections, warnings, fetchedAt } = await fetchFirmsDetections(days);
  const { created, skipped } = await storeDetections(detections);
  return { detections, warnings, fetchedAt, created, skipped };
}
