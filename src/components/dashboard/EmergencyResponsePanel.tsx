// Emergency Services Proximity — real nearby facilities (Google Places) and real
// responder vehicles (Firestore GPS), ranked by real traffic-aware ETA from the
// secure routing backend. No fabricated facilities, vehicles, distances or ETAs.
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useIncidents } from '@/hooks/useIncidents';
import { useVehicles } from '@/hooks/useVehicles';
import { useNearbyServices, type NearbyService, type ServiceCategory } from '@/hooks/useNearbyServices';
import { useRouteMatrix, type MatrixEntry } from '@/hooks/useRouteMatrix';
import { formatDistance, formatDuration } from '@/hooks/useRoute';
import { StatusBadge } from './StatusBadge';
import { IncidentsLoading, IncidentsError, IncidentsEmpty } from './IncidentsDataState';
import { Building2, Hospital, Shield, MapPin, Clock, Phone, ExternalLink, Truck, Star, RefreshCw, LifeBuoy } from 'lucide-react';

const CATEGORY_META: Record<ServiceCategory, { label: string; icon: React.ElementType }> = {
  fire_station: { label: 'Fire Stations', icon: Building2 },
  hospital: { label: 'Hospitals', icon: Hospital },
  police: { label: 'Police', icon: Shield },
  other: { label: 'Other Services', icon: LifeBuoy },
};

const CATEGORY_ORDER: ServiceCategory[] = ['fire_station', 'hospital', 'police', 'other'];

function EtaLine({ entry, loading, error }: { entry?: MatrixEntry; loading: boolean; error: string | null }) {
  return (
    <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
      <Clock className="w-3 h-3" />
      <span className={entry ? 'text-success' : undefined}>
        {entry
          ? `${formatDuration(entry.durationSeconds)} · ${formatDistance(entry.distanceMeters)}`
          : loading
            ? 'Computing route…'
            : error
              ? 'Routing unavailable'
              : 'No route available'}
      </span>
    </div>
  );
}

export function EmergencyResponsePanel({ incidentId }: { incidentId?: string }) {
  const { incidents, loading, error, reload } = useIncidents();
  const incident = incidents.find((i) => i.id === incidentId) || incidents[0];
  const target = incident ? { lat: incident.location.lat, lng: incident.location.lng } : null;

  const {
    services,
    loading: servicesLoading,
    error: servicesError,
    reload: reloadServices,
  } = useNearbyServices(target);
  const { vehicles, loading: vehiclesLoading, error: vehiclesError } = useVehicles();

  // Vehicles that have reported a real GPS fix and are not already closed out.
  const availableVehicles = useMemo(
    () => vehicles.filter((v) => v.location && v.status !== 'resolved' && v.status !== 'arrived'),
    [vehicles],
  );

  const origins = useMemo(
    () => [
      ...services.map((s) => ({ key: `svc:${s.id}`, point: s.location })),
      ...availableVehicles.map((v) => ({ key: `veh:${v.id}`, point: v.location! })),
    ],
    [services, availableVehicles],
  );

  const { entries, loading: routesLoading, error: routesError } = useRouteMatrix(origins, target);

  const rankedVehicles = useMemo(
    () =>
      availableVehicles
        .map((v) => ({ vehicle: v, entry: entries[`veh:${v.id}`] }))
        .sort((a, b) => {
          if (a.entry && b.entry) return a.entry.durationSeconds - b.entry.durationSeconds;
          if (a.entry) return -1;
          if (b.entry) return 1;
          return 0;
        }),
    [availableVehicles, entries],
  );

  const grouped = useMemo(() => {
    const map = new Map<ServiceCategory, Array<{ service: NearbyService; entry?: MatrixEntry }>>();
    for (const cat of CATEGORY_ORDER) map.set(cat, []);
    for (const s of services) {
      map.get(s.category)?.push({ service: s, entry: entries[`svc:${s.id}`] });
    }
    for (const [, list] of map) {
      list.sort((a, b) => {
        if (a.entry && b.entry) return a.entry.durationSeconds - b.entry.durationSeconds;
        if (a.entry) return -1;
        if (b.entry) return 1;
        return 0;
      });
    }
    return map;
  }, [services, entries]);

  if (loading) return <IncidentsLoading />;
  if (error) return <IncidentsError error={error} onRetry={reload} />;
  if (!incident) return <IncidentsEmpty />;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <h2 className="text-sm font-bold tracking-tight">EMERGENCY RESPONSE PROXIMITY</h2>
          <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
            {incident.id} · {incident.location.street}, {incident.location.city}
          </p>
        </div>
        <button
          onClick={reloadServices}
          className="flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1.5 rounded-md bg-secondary hover:bg-secondary/70 transition-colors"
        >
          <RefreshCw className={`w-3 h-3 ${servicesLoading ? 'animate-spin' : ''}`} /> REFRESH
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Recommended responder from real vehicle GPS */}
        <section>
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Truck className="w-3 h-3" /> Responder Units (ranked by real ETA)
          </p>
          {vehiclesLoading ? (
            <p className="text-[11px] font-mono text-muted-foreground">Loading fleet…</p>
          ) : vehiclesError ? (
            <p className="text-[11px] font-mono text-muted-foreground">Fleet feed unavailable: {vehiclesError}</p>
          ) : rankedVehicles.length === 0 ? (
            <p className="text-[11px] font-mono text-muted-foreground">
              No available unit has reported a real GPS position. Ranking appears once a device shares its location.
            </p>
          ) : (
            <div className="space-y-2">
              {rankedVehicles.map(({ vehicle, entry }, i) => {
                const recommended = i === 0 && !!entry;
                return (
                  <motion.div
                    key={vehicle.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`rounded-lg p-3 border ${
                      recommended ? 'border-success bg-success/5' : 'border-border bg-secondary'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Truck className={`w-4 h-4 ${recommended ? 'text-success' : 'text-muted-foreground'}`} />
                        <div>
                          <p className="text-sm font-bold">{vehicle.callsign}</p>
                          <p className="text-[10px] font-mono text-muted-foreground">
                            {vehicle.type.replace(/_/g, ' ')}
                            {vehicle.speedKmh !== null ? ` · ${Math.round(vehicle.speedKmh)} km/h` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {recommended && (
                          <StatusBadge variant="success">
                            <span className="inline-flex items-center gap-1">
                              <Star className="w-2.5 h-2.5" /> RECOMMENDED
                            </span>
                          </StatusBadge>
                        )}
                        <StatusBadge variant="info">{vehicle.status.replace(/_/g, ' ')}</StatusBadge>
                      </div>
                    </div>
                    <div className="mt-2">
                      <EtaLine entry={entry} loading={routesLoading} error={routesError} />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>

        {/* Nearby facilities from Google Places */}
        {servicesError ? (
          <p className="text-[11px] font-mono text-muted-foreground">
            Nearby services unavailable: {servicesError}
          </p>
        ) : servicesLoading ? (
          <p className="text-[11px] font-mono text-muted-foreground">Searching nearby emergency services…</p>
        ) : services.length === 0 ? (
          <p className="text-[11px] font-mono text-muted-foreground">
            No emergency services were found near this incident's coordinates.
          </p>
        ) : (
          CATEGORY_ORDER.map((cat) => {
            const list = grouped.get(cat) ?? [];
            if (list.length === 0) return null;
            const Icon = CATEGORY_META[cat].icon;
            return (
              <section key={cat}>
                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Icon className="w-3 h-3" /> {CATEGORY_META[cat].label}
                </p>
                <div className="space-y-2">
                  {list.map(({ service, entry }, i) => (
                    <div
                      key={service.id}
                      className={`rounded-lg p-3 border ${
                        i === 0 && entry ? 'border-info/60 bg-info/5' : 'border-border bg-secondary'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold">{service.name}</p>
                          {service.typeLabel && (
                            <p className="text-[10px] font-mono text-muted-foreground">{service.typeLabel}</p>
                          )}
                        </div>
                        {i === 0 && entry && <StatusBadge variant="info">FASTEST</StatusBadge>}
                      </div>
                      {service.address && (
                        <p className="text-[11px] text-muted-foreground mt-1 flex items-start gap-1.5">
                          <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" /> {service.address}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                        <EtaLine entry={entry} loading={routesLoading} error={routesError} />
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {service.location.lat.toFixed(4)}°, {service.location.lng.toFixed(4)}°
                        </span>
                        {service.phone && (
                          <a
                            href={`tel:${service.phone}`}
                            className="text-[11px] font-mono text-info hover:underline inline-flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3" /> {service.phone}
                          </a>
                        )}
                        {service.mapsUri && (
                          <a
                            href={service.mapsUri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-mono text-info hover:underline inline-flex items-center gap-1"
                          >
                            <ExternalLink className="w-2.5 h-2.5" /> Open in Maps
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}
