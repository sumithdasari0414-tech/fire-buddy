// For every unverified incident, create a realtime alert/assignment for the
// nearest available verified station. Nothing is dispatched automatically and no
// station is invented — if no verified station exists, nothing is created.
import { useEffect, useRef } from 'react';
import { useIncidents } from './useIncidents';
import { useStations } from './useStations';
import { createStationAlert, nearestAvailableStation } from '@/integrations/firebase/stations';

export function useStationAssignment() {
  const { incidents } = useIncidents();
  const { stations } = useStations();
  const handled = useRef(new Set<string>());

  useEffect(() => {
    if (!incidents.length || !stations.length) return;

    for (const incident of incidents) {
      const { lat, lng } = incident.location;
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) continue;
      if (incident.status === 'resolved') continue;

      const station = nearestAvailableStation(stations, { lat, lng });
      if (!station) continue;

      const key = `${incident.id}__${station.id}`;
      if (handled.current.has(key)) continue;
      handled.current.add(key);

      createStationAlert({
        incidentId: incident.id,
        station,
        location: { lat, lng },
        severity: incident.severity,
        locationName: incident.location.street,
      }).catch((err) => {
        handled.current.delete(key); // allow a retry on the next feed update
        console.error('[alerts] Failed to create station alert:', err);
      });
    }
  }, [incidents, stations]);
}
