// Read-only access to the Firestore `incidents` collection.
// Existing mock data is untouched; this is only used to verify the connection for now.
import { collection, getDocs, limit, query } from "firebase/firestore";
import { db, isFirebaseConfigured } from "./client";

export type FirestoreIncident = { id: string } & Record<string, unknown>;

export async function fetchIncidents(max = 20): Promise<FirestoreIncident[]> {
  const snap = await getDocs(query(collection(db, "incidents"), limit(max)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Dev-only connection test: logs the result of reading `incidents` to the console. */
export async function testFirestoreConnection() {
  if (!isFirebaseConfigured) {
    console.warn("[firebase] Config placeholders not filled in — skipping connection test.");
    return;
  }
  try {
    const docs = await fetchIncidents();
    const titles = docs.map((d) => (d.title as string | undefined) ?? "(no title)");
    console.log(`[firebase] Connected. Incidents documents read: ${docs.length}`);
    console.log(`[firebase] Incident titles:`, titles);
    console.log(`[firebase] Full documents:`, docs);
  } catch (err) {
    console.error("[firebase] Failed to read incidents collection:", err);
  }
}
