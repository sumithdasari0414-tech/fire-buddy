// Shared hook that loads incidents from Firestore once and exposes
// loading / error / empty states to every dashboard consumer.
// Falls back gracefully — no mock incident data is used for incidents anymore.
import { useEffect, useState } from "react";
import type { Incident } from "@/data/mockData";
import { fetchMappedIncidents, isFirebaseConfiguredOrThrow } from "@/integrations/firebase/incidentsHookHelpers";

export interface IncidentsState {
  incidents: Incident[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

// Module-level cache so all components share a single fetch.
let cached: Incident[] | null = null;
let cachedError: string | null = null;
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

function load(): Promise<void> {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      isFirebaseConfiguredOrThrow();
      cached = await fetchMappedIncidents();
      cachedError = null;
    } catch (err) {
      cached = null;
      cachedError = err instanceof Error ? err.message : "Failed to load incidents";
    } finally {
      inflight = null;
      notify();
    }
  })();
  return inflight;
}

export function useIncidents(): IncidentsState {
  const [, setTick] = useState(0);

  useEffect(() => {
    const rerender = () => setTick((t) => t + 1);
    listeners.add(rerender);
    if (cached === null && cachedError === null) void load();
    return () => {
      listeners.delete(rerender);
    };
  }, []);

  const reload = () => {
    cached = null;
    cachedError = null;
    notify();
    void load();
  };

  return {
    incidents: cached ?? [],
    loading: cached === null && cachedError === null,
    error: cachedError,
    reload,
  };
}
