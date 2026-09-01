// Shared realtime feed of verified fire stations (Firestore `stations`).
import { useEffect, useState } from 'react';
import { subscribeStations, type VerifiedStation } from '@/integrations/firebase/stations';

interface Store {
  stations: VerifiedStation[];
  status: 'loading' | 'live' | 'error';
  error: string | null;
}

let store: Store = { stations: [], status: 'loading', error: null };
let unsubscribe: (() => void) | null = null;
let subscribers = 0;
const listeners = new Set<() => void>();

function setStore(patch: Partial<Store>) {
  store = { ...store, ...patch };
  listeners.forEach((l) => l());
}

function start() {
  if (unsubscribe) return;
  unsubscribe = subscribeStations(
    (stations) => setStore({ stations, status: 'live', error: null }),
    (error) => setStore({ status: 'error', error }),
  );
}

function stop() {
  unsubscribe?.();
  unsubscribe = null;
}

export function useStations() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const rerender = () => setTick((t) => t + 1);
    listeners.add(rerender);
    subscribers += 1;
    if (subscribers === 1) start();
    return () => {
      listeners.delete(rerender);
      subscribers -= 1;
      if (subscribers === 0) stop();
    };
  }, []);

  return {
    stations: store.stations,
    loading: store.status === 'loading',
    error: store.status === 'error' ? store.error : null,
    reload: () => {
      stop();
      setStore({ status: 'loading', error: null });
      start();
    },
  };
}
