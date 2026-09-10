// Shared realtime dispatch feed (Firestore `dispatches`). One listener serves
// every consumer. Empty stays empty — no placeholder dispatches.
import { useEffect, useState } from 'react';
import { subscribeDispatches, type DispatchRecord } from '@/integrations/firebase/dispatches';

interface Store {
  dispatches: DispatchRecord[];
  status: 'loading' | 'live' | 'error';
  error: string | null;
}

let store: Store = { dispatches: [], status: 'loading', error: null };
let unsubscribe: (() => void) | null = null;
let subscribers = 0;
const listeners = new Set<() => void>();

function setStore(patch: Partial<Store>) {
  store = { ...store, ...patch };
  listeners.forEach((l) => l());
}

function start() {
  if (unsubscribe) return;
  unsubscribe = subscribeDispatches(
    (dispatches) => setStore({ dispatches, status: 'live', error: null }),
    (error) => setStore({ status: 'error', error }),
  );
}

function stop() {
  unsubscribe?.();
  unsubscribe = null;
}

export function useDispatches() {
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
    dispatches: store.dispatches,
    loading: store.status === 'loading',
    error: store.status === 'error' ? store.error : null,
    reload: () => {
      stop();
      setStore({ status: 'loading', error: null });
      start();
    },
  };
}
