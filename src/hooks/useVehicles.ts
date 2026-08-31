// Shared realtime vehicle feed. A single Firestore listener serves every
// consumer; there is no simulated movement — positions come from real GPS
// reports written to the `vehicles` collection.
import { useEffect, useState } from 'react';
import { subscribeVehicles, type LiveVehicle } from '@/integrations/firebase/vehicles';

export type VehicleFeedStatus = 'loading' | 'live' | 'error';

interface Store {
  vehicles: LiveVehicle[];
  status: VehicleFeedStatus;
  error: string | null;
}

let store: Store = { vehicles: [], status: 'loading', error: null };
let unsubscribe: (() => void) | null = null;
let subscribers = 0;
const listeners = new Set<() => void>();

function setStore(patch: Partial<Store>) {
  store = { ...store, ...patch };
  listeners.forEach((l) => l());
}

function start() {
  if (unsubscribe) return;
  unsubscribe = subscribeVehicles(
    (vehicles) => setStore({ vehicles, status: 'live', error: null }),
    (error) => setStore({ status: 'error', error }),
  );
}

function stop() {
  unsubscribe?.();
  unsubscribe = null;
}

export function useVehicles() {
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
    vehicles: store.vehicles,
    loading: store.status === 'loading',
    error: store.status === 'error' ? store.error : null,
    status: store.status,
    reload: () => {
      stop();
      setStore({ status: 'loading', error: null });
      start();
    },
  };
}
