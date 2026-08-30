// Shared realtime incident store.
// A single Firestore onSnapshot listener is shared by every component that
// calls useIncidents() — no duplicate reads. Includes:
//   - realtime live updates
//   - auto-retry with exponential backoff on listener failure
//   - offline / unreachable detection (snapshot cache + navigator.onLine)
//   - last-good-data caching in localStorage (stale fallback)
//   - proper listener teardown when no subscribers remain
import { useEffect, useState } from "react";
import { collection, limit, onSnapshot, query } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/integrations/firebase/client";
import { mapFirestoreIncident } from "@/integrations/firebase/incidents";
import type { Incident } from "@/data/mockData";

export type FeedStatus = "loading" | "live" | "stale" | "error";

export interface IncidentsState {
  incidents: Incident[];
  loading: boolean;
  error: string | null;
  /** True when showing cached data because the live feed is unreachable. */
  stale: boolean;
  status: FeedStatus;
  reload: () => void;
}

const CACHE_KEY = "firewatch_incidents_cache_v1";
const MAX_DOCS = 50;
const RETRY_BASE_MS = 1000;
const RETRY_MAX_MS = 30000;

interface StoreState {
  incidents: Incident[];
  status: FeedStatus;
  error: string | null;
}

function readCache(): Incident[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Incident[]) : [];
  } catch {
    return [];
  }
}

function writeCache(incidents: Incident[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(incidents));
  } catch {
    // storage full / unavailable — non-fatal
  }
}

// Module-level shared store.
let state: StoreState = { incidents: [], status: "loading", error: null };
let unsubscribe: (() => void) | null = null;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let retryAttempt = 0;
let subscriberCount = 0;
const listeners = new Set<() => void>();

function setState(patch: Partial<StoreState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

function clearRetry() {
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
}

function scheduleRetry() {
  clearRetry();
  const delay = Math.min(RETRY_MAX_MS, RETRY_BASE_MS * 2 ** retryAttempt);
  retryAttempt += 1;
  retryTimer = setTimeout(() => {
    retryTimer = null;
    if (subscriberCount > 0) startListener();
  }, delay);
}

function startListener() {
  if (unsubscribe || !isFirebaseConfigured) {
    if (!isFirebaseConfigured) setState({ status: "error", error: "Firebase is not configured" });
    return;
  }
  try {
    unsubscribe = onSnapshot(
      query(collection(db, "incidents"), limit(MAX_DOCS)),
      (snap) => {
        retryAttempt = 0; // healthy connection resets backoff
        const incidents = snap.docs.map((d) => mapFirestoreIncident({ id: d.id, ...d.data() }));
        writeCache(incidents);
        // fromCache with no network = device offline / Firestore unreachable
        const offline = snap.metadata.fromCache && !navigator.onLine;
        setState({ incidents, status: offline ? "stale" : "live", error: null });
      },
      (err) => {
        // Listener failed (permissions, network, quota): serve cache, retry.
        unsubscribe = null;
        const cached = readCache();
        setState({
          incidents: cached,
          status: cached.length ? "stale" : "error",
          error: err instanceof Error ? err.message : "Failed to load incidents",
        });
        scheduleRetry();
      }
    );
  } catch (err) {
    unsubscribe = null;
    const cached = readCache();
    setState({
      incidents: cached,
      status: cached.length ? "stale" : "error",
      error: err instanceof Error ? err.message : "Failed to load incidents",
    });
    scheduleRetry();
  }
}

function stopListener() {
  clearRetry();
  retryAttempt = 0;
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
}

export function useIncidents(): IncidentsState {
  const [, setTick] = useState(0);

  useEffect(() => {
    const rerender = () => setTick((t) => t + 1);
    listeners.add(rerender);
    subscriberCount += 1;
    if (subscriberCount === 1) startListener(); // first subscriber opens the shared feed
    return () => {
      listeners.delete(rerender);
      subscriberCount -= 1;
      if (subscriberCount === 0) stopListener(); // last unsubscribe tears down the listener
    };
  }, []);

  const reload = () => {
    // Manual retry: tear down and restart the shared listener immediately.
    stopListener();
    setState({ status: state.incidents.length ? "stale" : "loading", error: null });
    startListener();
  };

  return {
    incidents: state.incidents,
    loading: state.status === "loading",
    error: state.status === "error" ? state.error : null,
    stale: state.status === "stale",
    status: state.status,
    reload,
  };
}
