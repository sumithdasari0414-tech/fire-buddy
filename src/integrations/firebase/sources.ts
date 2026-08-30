// Read access to the Firestore `sources` collection.
// Sources provide provenance/verification for incidents — they are displayed
// only inside the incident details view and never power dashboard statistics.
import { collection, getDocs, limit, query, where, Timestamp } from "firebase/firestore";
import { db } from "./client";

export interface IncidentSource {
  id: string;
  incidentId: string;
  sourceName: string;
  sourceType: string;
  sourceUrl: string;
  publicationDate: string; // formatted, or "Unknown"
  notes: string;
}

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" && v.trim() ? v : fallback;
}

function firstField(doc: Record<string, unknown>, ...keys: string[]): unknown {
  for (const k of keys) {
    if (doc[k] !== undefined && doc[k] !== null) return doc[k];
  }
  return undefined;
}

function formatDate(v: unknown): string {
  let d: Date | null = null;
  if (v instanceof Timestamp) d = v.toDate();
  else if (typeof v === "string") {
    const parsed = new Date(v);
    d = isNaN(parsed.getTime()) ? null : parsed;
  }
  if (!d) return "Unknown";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Validate and map a raw Firestore source document, with sensible fallbacks. */
export function mapSource(id: string, doc: Record<string, unknown>): IncidentSource {
  return {
    id,
    incidentId: asString(firstField(doc, "incident id", "incidentId"), "Unknown"),
    sourceName: asString(firstField(doc, "source name", "sourceName"), "Unknown source"),
    sourceType: asString(firstField(doc, "source type", "sourceType"), "Unknown"),
    sourceUrl: asString(firstField(doc, "source url", "sourceUrl")),
    publicationDate: formatDate(firstField(doc, "publicationdate", "publication date", "publicationDate")),
    notes: asString(doc["notes"], "—"),
  };
}

/** Fetch all sources linked to a given incident. Returns [] on no matches. */
export async function fetchSourcesForIncident(incidentId: string, max = 20): Promise<IncidentSource[]> {
  const col = collection(db, "sources");
  // Support both spaced and camelCase field conventions.
  const [spaced, camel] = await Promise.all([
    getDocs(query(col, where("incident id", "==", incidentId), limit(max))).catch(() => null),
    getDocs(query(col, where("incidentId", "==", incidentId), limit(max))).catch(() => null),
  ]);
  const docs = [...(spaced?.docs ?? []), ...(camel?.docs ?? [])];
  const seen = new Set<string>();
  return docs
    .filter((d) => (seen.has(d.id) ? false : (seen.add(d.id), true)))
    .map((d) => mapSource(d.id, d.data()));
}
