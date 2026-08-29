// Re-exports used by the useIncidents hook (kept separate to avoid pulling
// dev-only test code into the hook bundle path).
export { fetchMappedIncidents } from "./incidents";
import { isFirebaseConfigured } from "./client";

export function isFirebaseConfiguredOrThrow() {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase is not configured");
  }
}
