import { motion } from 'framer-motion';
import { useVehicles } from '@/hooks/useVehicles';
import { useIncidents } from '@/hooks/useIncidents';
import { useRoute, formatDistance, formatDuration } from '@/hooks/useRoute';
import type { LiveVehicle } from '@/integrations/firebase/vehicles';
import { StatusBadge } from './StatusBadge';
import { IncidentsLoading, IncidentsError, IncidentsEmpty } from './IncidentsDataState';
import { Navigation, Gauge, Radio, Clock } from 'lucide-react';

const statusVariant: Record<string, 'success' | 'warning' | 'critical' | 'info'> = {
  unverified: 'info',
  acknowledged: 'info',
  verified: 'info',
  dispatched: 'warning',
  en_route: 'warning',
  arrived: 'critical',
  resolved: 'success',
};

const vehicleEmoji: Record<string, string> = {
  fire_engine: '🚒',
  ambulance: '🚑',
  police: '🚓',
  other: '🚐',
};

/** Real route/ETA for a vehicle that has a GPS fix and an assigned incident. */
function VehicleRoute({ vehicle }: { vehicle: LiveVehicle }) {
  const { incidents } = useIncidents();
  const incident = vehicle.assignedIncidentId
    ? incidents.find((i) => i.id === vehicle.assignedIncidentId)
    : undefined;
  const { route, loading, error } = useRoute(vehicle.location, incident?.location);

  if (!vehicle.location || !incident) return null;
  if (loading) return <p className="mt-2 text-[10px] text-muted-foreground font-mono">Computing route…</p>;
  if (error) return <p className="mt-2 text-[10px] text-destructive font-mono">Route unavailable: {error}</p>;
  if (!route) return null;

  return (
    <div className="mt-2 space-y-1">
      <div className="flex items-center gap-3 text-[11px] font-mono">
        <span className="flex items-center gap-1 text-success">
          <Clock className="w-3 h-3" /> ETA {formatDuration(route.durationSeconds)}
        </span>
        <span className="text-muted-foreground">{formatDistance(route.distanceMeters)}</span>
      </div>
      {route.steps.length > 0 && (
        <ol className="text-[10px] text-muted-foreground list-decimal pl-4 space-y-0.5">
          {route.steps.slice(0, 3).map((s, idx) => (
            <li key={idx}>{s.instruction}</li>
          ))}
        </ol>
      )}
    </div>
  );
}

export function VehicleTracker() {
  const { vehicles, loading, error, reload } = useVehicles();

  if (loading) return <IncidentsLoading />;
  if (error) return <IncidentsError error={error} onRetry={reload} />;
  if (vehicles.length === 0) return <IncidentsEmpty />;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-sm font-bold tracking-tight">FLEET STATUS</h2>
        <div className="flex gap-2">
          <StatusBadge variant="success">
            {vehicles.filter((v) => v.status === 'resolved' || v.status === 'unverified').length} Available
          </StatusBadge>
          <StatusBadge variant="warning">{vehicles.filter((v) => v.status === 'en_route').length} En Route</StatusBadge>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-border">
        {vehicles.map((v, i) => (
          <motion.div
            key={v.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="p-4 hover:bg-secondary/30 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{vehicleEmoji[v.type]}</span>
                <div>
                  <p className="text-sm font-bold font-mono">{v.callsign}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">{v.type.replace('_', ' ')}</p>
                </div>
              </div>
              <StatusBadge variant={statusVariant[v.status] ?? 'info'} pulse={v.status === 'en_route'}>
                {v.status.replace('_', ' ')}
              </StatusBadge>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-3">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Navigation className="w-3 h-3" />
                <span>
                  {v.location
                    ? `${v.location.lat.toFixed(3)}°N, ${v.location.lng.toFixed(3)}°E`
                    : 'No GPS fix reported'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Gauge className="w-3 h-3" />
                <span>{v.speedKmh !== null ? `${v.speedKmh} km/h` : '—'}</span>
              </div>
              {v.updatedAt && (
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono">
                  <Radio className="w-3 h-3" />
                  <span>{v.updatedAt.toLocaleTimeString()}</span>
                </div>
              )}
            </div>

            {v.assignedIncidentId && (
              <div className="mt-2 px-2 py-1 bg-primary/10 rounded text-[10px] font-mono text-primary">
                Assigned: {v.assignedIncidentId}
              </div>
            )}

            <VehicleRoute vehicle={v} />
            <DeviceGpsShare vehicleId={v.id} callsign={v.callsign} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
