// Real nearby emergency services around an incident, via the secure
// `nearby-emergency-services` backend function (Google Places API New).
// Nothing is generated client-side: an empty response stays empty.
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FunctionsHttpError } from '@supabase/supabase-js';

export type ServiceCategory = 'fire_station' | 'hospital' | 'police' | 'other';

export interface NearbyService {
  id: string;
  category: ServiceCategory;
  name: string;
  address: string | null;
  typeLabel: string | null;
  phone: string | null;
  mapsUri: string | null;
  location: { lat: number; lng: number };
}

async function invokeError(error: unknown): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    const text = await error.context.text();
    try {
      const parsed = JSON.parse(text);
      return parsed.error ?? text;
    } catch {
      return text || 'Request failed';
    }
  }
  return error instanceof Error ? error.message : 'Request failed';
}

export function useNearbyServices(center?: { lat: number; lng: number } | null, radiusMeters = 8000) {
  const [services, setServices] = useState<NearbyService[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  // Round the centre so tiny coordinate jitter does not trigger a new billed lookup.
  const key =
    center && Number.isFinite(center.lat) && Number.isFinite(center.lng) && !(center.lat === 0 && center.lng === 0)
      ? `${center.lat.toFixed(3)},${center.lng.toFixed(3)}`
      : null;

  useEffect(() => {
    if (!key || !center) {
      setServices([]);
      setError(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    supabase.functions
      .invoke('nearby-emergency-services', {
        body: { center: { lat: center.lat, lng: center.lng }, radiusMeters },
      })
      .then(async ({ data, error: err }) => {
        if (cancelled) return;
        if (err) {
          setError(await invokeError(err));
          setServices([]);
        } else {
          setServices(Array.isArray(data?.services) ? (data.services as NearbyService[]) : []);
        }
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, radiusMeters, attempt]);

  return { services, loading, error, reload: () => setAttempt((a) => a + 1) };
}
