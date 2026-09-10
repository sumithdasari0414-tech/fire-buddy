// Canonical Firestore structure for FireBuddy's dispatch-ready architecture.
//
// This file is the single source of truth for collection names and the document
// shape each collection is expected to hold. Nothing here creates data — no
// seeding, no placeholder documents. Collections that are empty stay empty and
// the UI shows honest empty states.
//
// Field names use the existing project convention: human-readable lowercase
// keys with spaces (e.g. 'created at'), read through tolerant `pick()` helpers
// so both 'created at' and 'createdAt' documents map correctly.

export const COLLECTIONS = {
  /** Fire detections & reports (NASA FIRMS VIIRS + verified reports). */
  incidents: 'incidents',
  /** Verified fire stations with real coordinates. */
  stations: 'stations',
  /** Emergency vehicles with real reported GPS fixes. */
  vehicles: 'vehicles',
  /** Real nearby emergency facilities resolved from Google Places. */
  emergencyServices: 'emergencyServices',
  /** Dispatch records requiring dispatcher approval before dispatch. */
  dispatches: 'dispatches',
  /** Realtime station alerts / assignments. */
  alerts: 'alerts',
  /** Immutable audit trail of every operator action. */
  auditLogs: 'auditLogs',
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];

/**
 * Expected document shapes (documentation only — Firestore is schemaless).
 *
 * incidents/{id}
 *   location: GeoPoint, 'detected at': Timestamp, confidence: number,
 *   frp: number, satellite: string, source: string, severity: string,
 *   status: LifecycleStatus, 'status updated at': Timestamp
 *
 * stations/{id}
 *   name, address, phone, location: GeoPoint, engines, ambulances,
 *   status: 'operational' | 'busy' | 'offline', verified: boolean
 *
 * vehicles/{id}
 *   callsign, type, status: LifecycleStatus, location: GeoPoint,
 *   'speed kmh', 'station id', 'assigned incident', 'updated at': Timestamp
 *
 * emergencyServices/{placeId}
 *   name, category, address, phone, 'maps uri', location: GeoPoint,
 *   'place id', 'seen at': Timestamp, 'incident ids': string[]
 *
 * dispatches/{id}
 *   'incident id', 'station id', 'station name', 'vehicle id', 'vehicle callsign',
 *   'incident location': GeoPoint, status: DispatchStatus,
 *   'requested by', 'requested at': Timestamp,
 *   'dispatcher action', 'dispatcher id', 'decided at': Timestamp,
 *   'decision note', history: DispatchHistoryEntry[],
 *   'external reference': string | null  (reserved for a future authorized
 *                                         fire-service integration)
 *
 * alerts/{incidentId__stationId}
 *   'incident id', 'station id', 'station name', location: GeoPoint,
 *   severity, status, acknowledged, 'created at': Timestamp
 *
 * auditLogs/{autoId}
 *   action, actor, 'entity type', 'entity id', detail, metadata,
 *   'created at': Timestamp
 */
export const DOC_SHAPES_DOCUMENTED = true;
