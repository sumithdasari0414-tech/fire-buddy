// Periodically pulls real NASA FIRMS VIIRS detections through the secure
// backend function and stores new ones in Firestore. The dashboard itself
// renders from the Firestore realtime feed, so new detections appear instantly.
import { useCallback, useEffect, useRef, useState } from 'react';
import { ingestFirmsDetections } from '@/integrations/firebase/firms';

const POLL_MS = 15 * 60 * 1000; // FIRMS NRT data refreshes in ~minutes, not seconds

export interface FirmsIngestionState {
  syncing: boolean;
  error: string | null;
  warnings: string[];
  lastSyncAt: Date | null;
  detected: number;
  created: number;
  sync: () => void;
}

export function useFirmsIngestion(days = 1): FirmsIngestionState {
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const [detected, setDetected] = useState(0);
  const [created, setCreated] = useState(0);
  const running = useRef(false);

  const sync = useCallback(async () => {
    if (running.current) return; // never overlap two ingestion runs
    running.current = true;
    setSyncing(true);
    setError(null);
    try {
      const result = await ingestFirmsDetections(days);
      setDetected(result.detections.length);
      setCreated(result.created);
      setWarnings(result.warnings);
      setLastSyncAt(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'FIRMS sync failed');
    } finally {
      running.current = false;
      setSyncing(false);
    }
  }, [days]);

  useEffect(() => {
    void sync();
    const id = setInterval(() => void sync(), POLL_MS);
    return () => clearInterval(id);
  }, [sync]);

  return { syncing, error, warnings, lastSyncAt, detected, created, sync: () => void sync() };
}
