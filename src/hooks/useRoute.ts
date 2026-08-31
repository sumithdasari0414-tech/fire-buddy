// Real route computation via the secure `compute-route` backend function.
// Recomputes automatically whenever the origin or destination coordinates change
// (e.g. a vehicle reports a new GPS fix). Nothing is estimated client-side.
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FunctionsHttpError } from '@supabase/supabase-js';

export interface RouteStep {
  instruction: string;
  maneuver: string;
  distanceMeters: number;
}

export interface RouteResult {
  distanceMeters: number;
  durationSeconds: number;
  polyline: string | null;
  steps: RouteStep[];
  computedAt: string;
}

export interface Point {
  lat: number;
  lng: number;
}

export function isRoutable(p?: Point | null): p is Point {
  return (
    !!p &&
    Number.isFinite(p.lat) &&
    Number.isFinite(p.lng) &&
    Math.abs(p.lat) <= 90 &&
    Math.abs(p.lng) <= 180 &&
    !(p.lat === 0 && p.lng === 0)
  );
}

export function formatDistance(meters: number): string {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
}

export function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)} h ${mins % 60} min`;
}

export async function computeRoute(origin: Point, destination: Point): Promise<RouteResult> {
  const { data, error } = await supabase.functions.invoke('compute-route', {
    body: { origin, destination },
  });
  if (error) {
    let message = error.message;
    if (error instanceof FunctionsHttpError) {
      const text = await error.context.text();
      try {
        const parsed = JSON.parse(text);
        message = parsed.error ?? text;
      } catch {
        message = text || message;
      }
    }
    throw new Error(message);
  }
  if (!data || typeof data.distanceMeters !== 'number') {
    throw new Error('Routing service returned no route');
  }
  return data as RouteResult;
}

/** Live route between two real coordinate pairs. Set `enabled` to false to hold off. */
export function useRoute(origin: Point | null | undefined, destination: Point | null | undefined, enabled = true) {
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const reqId = useRef(0);

  // Round coordinates so tiny GPS jitter does not trigger a new billed request.
  const key =
    enabled && isRoutable(origin) && isRoutable(destination)
      ? `${origin.lat.toFixed(4)},${origin.lng.toFixed(4)}|${destination.lat.toFixed(4)},${destination.lng.toFixed(4)}`
      : null;

  useEffect(() => {
    if (!key || !isRoutable(origin) || !isRoutable(destination)) {
      setRoute(null);
      setError(null);
      setLoading(false);
      return;
    }
    const id = ++reqId.current;
    setLoading(true);
    setError(null);
    computeRoute({ lat: origin.lat, lng: origin.lng }, { lat: destination.lat, lng: destination.lng })
      .then((r) => {
        if (id === reqId.current) {
          setRoute(r);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (id === reqId.current) {
          setRoute(null);
          setError(err instanceof Error ? err.message : 'Route unavailable');
          setLoading(false);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt]);

  const retry = useCallback(() => setAttempt((a) => a + 1), []);

  return { route, loading, error, retry };
}
