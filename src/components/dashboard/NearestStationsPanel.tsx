import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useIncidents } from '@/hooks/useIncidents';
import { useStations } from '@/hooks/useStations';
import { distanceKm } from '@/integrations/firebase/stations';
import { useRoute, formatDistance, formatDuration } from '@/hooks/useRoute';
import { StatusBadge } from './StatusBadge';
import { IncidentsLoading, IncidentsError, IncidentsEmpty } from './IncidentsDataState';
import { Building, Phone, Truck, Clock, MapPin, ExternalLink } from 'lucide-react';

/** Real route ETA from verified station coordinates to the incident. */
function StationEta({
  origin,
  destination,
}: {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
}) {
  const { route, loading, error } = useRoute(origin, destination);
  return (
    <div className="flex items-center gap-1.5 text-[11px] font-mono text-success">
      <Clock className="w-3 h-3" />
      <span>
        {loading
          ? 'Computing ETA…'
          : error
            ? 'ETA unavailable'
            : route
              ? `ETA: ${formatDuration(route.durationSeconds)} · ${formatDistance(route.distanceMeters)}`
              : 'ETA unavailable'}
      </span>
    </div>
  );
}

export function NearestStationsPanel({ incidentId }: { incidentId?: string }) {
  const { incidents, loading, error, reload } = useIncidents();
  const { stations, loading: stationsLoading, error: stationsError, reload: reloadStations } = useStations();
  const incident = incidents.find((i) => i.id === incidentId) || incidents[0];

  const sortedStations = useMemo(() => {
    if (!incident) return [];
    return stations
      .map((station) => ({ ...station, distance: distanceKm(station.location, incident.location) }))
      .sort((a, b) => a.distance - b.distance);
  }, [incident, stations]);

  if (loading || stationsLoading) return <IncidentsLoading />;
  if (error) return <IncidentsError error={error} onRetry={reload} />;
  if (stationsError) return <IncidentsError error={stationsError} onRetry={reloadStations} />;
  if (!incident) return <IncidentsEmpty />;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <h2 className="text-sm font-bold tracking-tight">NEAREST FIRE STATIONS</h2>
          <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
            Relative to: {incident.location.street}
          </p>
        </div>
        <StatusBadge variant="info">{stations.length} STATIONS</StatusBadge>
      </div>

      {sortedStations.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="text-xs font-mono text-muted-foreground text-center max-w-sm">
            No verified fire stations on record. Stations with real coordinates must exist in the
            database before assignments and routes can be calculated.
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {sortedStations.map((station, i) => (
            <motion.div
              key={station.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`p-4 ${i === 0 ? 'bg-success/5 border-l-2 border-l-success' : ''}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      i === 0 ? 'bg-success/20' : 'bg-secondary'
                    }`}
                  >
                    <Building className={`w-4 h-4 ${i === 0 ? 'text-success' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{station.name}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{station.id}</p>
                  </div>
                </div>
                {i === 0 && <StatusBadge variant="success">NEAREST</StatusBadge>}
                <StatusBadge
                  variant={
                    station.status === 'operational' ? 'success' : station.status === 'busy' ? 'warning' : 'critical'
                  }
                >
                  {station.status}
                </StatusBadge>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  <span>{station.distance.toFixed(1)} km away</span>
                </div>
                {i === 0 ? (
                  <StationEta origin={station.location} destination={incident.location} />
                ) : (
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono">
                    <Clock className="w-3 h-3" />
                    <span>ETA on acknowledgement</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Truck className="w-3 h-3" />
                  <span>
                    {station.engines ?? '—'} engines, {station.ambulances ?? '—'} ambulances
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Phone className="w-3 h-3" />
                  <span>{station.phone}</span>
                </div>
              </div>

              <p className="text-[10px] text-muted-foreground mt-2">{station.address}</p>

              <a
                href={`https://www.google.com/maps?q=${station.location.lat},${station.location.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-[10px] text-info hover:underline"
              >
                <ExternalLink className="w-3 h-3" /> View on Google Maps
              </a>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
