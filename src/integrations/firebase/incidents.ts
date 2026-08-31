// Read access to the Firestore `incidents` collection.
// Maps Firestore documents onto the app's existing `Incident` shape so the
// dashboard UI (cards, details, map markers, stats) works unchanged.
import { collection, getDocs, limit, query, Timestamp, GeoPoint } from "firebase/firestore";
import { db, isFirebaseConfigured } from "./client";
import type { Incident } from "@/data/mockData";
import { asLifecycle } from "./vehicles";

export type FirestoreIncident = { id: string } & Record<string, unknown>;

export async function fetchIncidents(max = 50): Promise<FirestoreIncident[]> {
  const snap = await getDocs(query(collection(db, "incidents"), limit(max)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

const SEVERITIES: Incident["severity"][] = ["low", "medium", "high", "critical"];

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" && v.trim() ? v : fallback;
}

function asNumber(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function asTimestamp(v: unknown): Date | null {
  if (v instanceof Timestamp) return v.toDate();
  if (typeof v === "string") {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function relativeTime(date: Date | null): string {
  if (!date) return "Unknown";
  const diffMin = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const hrs = Math.round(diffMin / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.round(hrs / 24)} d ago`;
}

function formatTimestamp(date: Date | null): string {
  if (!date) return "—";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/** Map a Firestore incident document to the app's `Incident` interface. */
export function mapFirestoreIncident(doc: FirestoreIncident): Incident {
  const geo = doc["location"] instanceof GeoPoint ? (doc["location"] as GeoPoint) : null;
  const rawSeverity = asString(doc["severity"], "medium").toLowerCase();
  const severity = (SEVERITIES.includes(rawSeverity as Incident["severity"])
    ? rawSeverity
    : "medium") as Incident["severity"];

  const rawStatus = asString(doc["status"], "unverified").toLowerCase().replace(/[\s-]+/g, "_");
  // Legacy / provider wording mapped onto the responder lifecycle.
  const statusAliases: Record<string, Incident["status"]> = {
    active: "unverified",
    new: "unverified",
    open: "unverified",
    responding: "en_route",
    on_scene: "arrived",
    closed: "resolved",
    contained: "resolved",
  };
  const status: Incident["status"] = statusAliases[rawStatus] ?? asLifecycle(rawStatus, "unverified");

  const incidentDate = asTimestamp(doc["incident date"]) ?? asTimestamp(doc["created at"]);
  const locationName = asString(doc["location name"], "Unknown location");
  const title = asString(doc["title"], "Fire incident");
  const fireType = asString(doc["fire type"]);
  const injuries = asNumber(doc["injuries"]);
  const deaths = asNumber(doc["deaths"]);

  return {
    id: doc.id,
    type: "fire",
    severity,
    location: {
      lat: geo?.latitude ?? 0,
      lng: geo?.longitude ?? 0,
      street: locationName,
      city: asString(doc["city"], ""),
      pincode: asString(doc["pincode"], ""),
    },
    reportedAt: relativeTime(incidentDate),
    timestamp: formatTimestamp(incidentDate),
    status,
    description: asString(doc["description"], title),
    falseAlarmScore: asNumber(doc["false alarm score"], status === "unverified" ? 25 : 5),
    spreadPrediction: "moderate",
    affectedArea: asString(doc["affected area"], "—"),
    buildingType: fireType ? `${fireType.charAt(0).toUpperCase()}${fireType.slice(1)}` : "—",
    detectionSource: "manual",
    humansDetected: injuries + deaths,
    aiRecommendation: asString(
      doc["ai recommendation"],
      `Cause: ${asString(doc["cause"], "under investigation")}. Injuries: ${injuries}, deaths: ${deaths}. Estimated damage: ₹${asNumber(doc["estimated damage"]).toLocaleString("en-IN")}.`
    ),
  };
}

/** Fetch incidents from Firestore mapped to the app's Incident shape. */
export async function fetchMappedIncidents(max = 50): Promise<Incident[]> {
  const docs = await fetchIncidents(max);
  return docs.map(mapFirestoreIncident);
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
