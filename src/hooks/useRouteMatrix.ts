// Real traffic-aware distance/ETA from many origins to one destination, via the
// secure `route-matrix` backend function. Recomputes whenever real coordinates
// change (e.g. a vehicle reports a new GPS fix). Nothing is estimated locally.
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FunctionsHttpError } from '@supabase/supabase-js';

export interface MatrixOrigin {
  key: string;
  point: { lat: number; lng: number };
}

export interface MatrixEntry {
  distanceMeters: number;
  durationSeconds: number;
}

function isRoutable(p?: { lat: number; lng: number } | null): boolean {
  return (
    !!p &&
    Number.isFinite(p.lat) &&
    Number.isFinite(p.lng) &&
    Math.abs(p.lat) <= 90 &&
    Math.abs(p.lng) <= 180 &&
    !(p.lat === 0 && p.lng === 0)
  );
}

export function useRouteMatrix(
  origins: MatrixOrigin[],
  destination?: { lat: number; lng: number } | null,
  enabled = true,
) {
  const [entries, setEntries] = useState<Record<string, MatrixEntry>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const usable = useMemo(
    () => origins.filter((o) => o.key && isRoutable(o.point)),
    [origins],
  );

  // Rounded signature: only real coordinate movement triggers a new request.
  const signature =
    enabled && isRoutable(destination) && usable.length > 0
      ? `${destination!.lat.toFixed(4)},${destination!.lng.toFixed(4)}|` +
        usable
          .map((o) => `${o.key}:${o.point.lat.toFixed(4)},${o.point.lng.toFixed(4)}`)
          .sort()
          .join(';')
      : null;

  useEffect(() => {
    if (!signature || !destination) {
      setEntries({});
      setError(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    supabase.functions
      .invoke('route-matrix', {
        body: {
          destination: { lat: destination.lat, lng: destination.lng },
          origins: usable.map((o) => ({ key: o.key, point: o.point })),
        },
      })
      .then(async ({ data, error: err }) => {
        if (cancelled) return;
        if (err) {
          let message = err.message;
          if (err instanceof FunctionsHttpError) {
            const text = await err.context.text();
            try {
              message = JSON.parse(text).error ?? text;
            } catch {
              message = text || message;
            }
          }
          setEntries({});
          setError(message);
        } else {
          const next: Record<string, MatrixEntry> = {};
          for (const r of (data?.results ?? []) as Array<MatrixEntry & { key: string }>) {
            next[r.key] = { distanceMeters: r.distanceMeters, durationSeconds: r.durationSeconds };
          }
          setEntries(next);
        }
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  return { entries, loading, error };
}
