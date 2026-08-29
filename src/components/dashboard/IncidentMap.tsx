import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { getVehicles, getCityConfig } from '@/data/mockData';
import type { Incident, Vehicle } from '@/data/mockData';
import { useIncidents } from '@/hooks/useIncidents';
import { StatusBadge } from './StatusBadge';
import { Loader2, AlertTriangle } from 'lucide-react';

function getMapBounds(incidents: Incident[], vehicles: Vehicle[]) {
  const allLats = [...incidents.map(i => i.location.lat), ...vehicles.map(v => v.location.lat)];
  const allLngs = [...incidents.map(i => i.location.lng), ...vehicles.map(v => v.location.lng)];
  if (allLats.length === 0) return { minLat: 0, maxLat: 1, minLng: 0, maxLng: 1 };
  const pad = 0.02;
  return {
    minLat: Math.min(...allLats) - pad,
    maxLat: Math.max(...allLats) + pad,
    minLng: Math.min(...allLngs) - pad,
    maxLng: Math.max(...allLngs) + pad,
  };
}

const severityColors: Record<string, string> = {
  critical: 'bg-critical',
  high: 'bg-primary',
  medium: 'bg-warning',
  low: 'bg-info',
};

const vehicleIcons: Record<string, string> = {
  fire_engine: '🚒',
  ambulance: '🚑',
  police: '🚓',
};

export function IncidentMap({ onSelectIncident }: { onSelectIncident?: (id: string) => void }) {
  const { incidents, loading, error } = useIncidents();
  const vehicles = getVehicles();
  const cityConfig = getCityConfig();
  const bounds = useMemo(() => getMapBounds(incidents, vehicles), [incidents, vehicles]);

  function toPercent(lat: number, lng: number) {
    const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 100;
    const y = ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * 100;
    return { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) };
  }

  return (
    <div className="relative w-full h-full min-h-[400px] bg-secondary rounded-lg overflow-hidden grid-pattern">
      {loading && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 bg-background/60">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-xs font-mono text-muted-foreground">Loading incidents…</p>
        </div>
      )}
      {!loading && error && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 bg-background/60 p-4 text-center">
          <AlertTriangle className="w-6 h-6 text-critical" />
          <p className="text-xs font-mono text-muted-foreground">Incident data unavailable</p>
        </div>
      )}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
        <div className="w-[600px] h-[600px] rounded-full border border-success/30">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-1 h-[300px] origin-bottom bg-gradient-to-t from-success/40 to-transparent animate-radar" />
          </div>
        </div>
      </div>

      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
        {[20, 40, 60, 80].map(p => (
          <g key={p}>
            <line x1={`${p}%`} y1="0" x2={`${p}%`} y2="100%" stroke="hsl(var(--border))" strokeWidth="0.5" />
            <line x1="0" y1={`${p}%`} x2="100%" y2={`${p}%`} stroke="hsl(var(--border))" strokeWidth="0.5" />
          </g>
        ))}
      </svg>

      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-15">
        <line x1="10%" y1="30%" x2="90%" y2="30%" stroke="hsl(var(--muted-foreground))" strokeWidth="2" />
        <line x1="50%" y1="10%" x2="50%" y2="90%" stroke="hsl(var(--muted-foreground))" strokeWidth="2" />
        <line x1="20%" y1="10%" x2="80%" y2="90%" stroke="hsl(var(--muted-foreground))" strokeWidth="1" />
        <line x1="10%" y1="65%" x2="90%" y2="65%" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" />
      </svg>

      {incidents.map((inc) => {
        const pos = toPercent(inc.location.lat, inc.location.lng);
        return (
          <motion.button
            key={inc.id}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute z-10 group"
            style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)' }}
            onClick={() => onSelectIncident?.(inc.id)}
          >
            {inc.severity === 'critical' && (
              <span className="absolute inset-0 -m-4 rounded-full bg-critical/20 animate-ping" />
            )}
            <span className={`relative flex h-4 w-4 rounded-full ${severityColors[inc.severity]} shadow-lg`}>
              <span className={`absolute inset-0 rounded-full ${severityColors[inc.severity]} animate-pulse-glow`} />
            </span>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20">
              <div className="bg-card border border-border rounded-lg p-2 shadow-xl min-w-[180px]">
                <p className="text-xs font-mono font-bold text-foreground">{inc.id}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{inc.location.street}</p>
                <div className="mt-1">
                  <StatusBadge variant={inc.severity as any} pulse={inc.severity === 'critical'}>
                    {inc.severity}
                  </StatusBadge>
                </div>
              </div>
            </div>
          </motion.button>
        );
      })}

      {vehicles.filter(v => v.status !== 'available').map((v) => {
        const pos = toPercent(v.location.lat, v.location.lng);
        return (
          <motion.div
            key={v.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="absolute z-10 group"
            style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)' }}
          >
            <span className="text-lg drop-shadow-lg cursor-default">{vehicleIcons[v.type]}</span>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-20">
              <div className="bg-card border border-border rounded px-2 py-1 shadow-xl">
                <p className="text-[10px] font-mono font-bold text-foreground">{v.callsign}</p>
                {v.eta && <p className="text-[10px] text-success">ETA: {v.eta}</p>}
              </div>
            </div>
          </motion.div>
        );
      })}

      <div className="absolute bottom-3 right-3 bg-card/90 backdrop-blur border border-border rounded-lg p-3">
        <p className="text-[10px] font-mono text-muted-foreground mb-2 uppercase tracking-wider">Legend</p>
        <div className="space-y-1.5">
          {Object.entries(severityColors).map(([label, color]) => (
            <div key={label} className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
              <span className="text-[10px] text-muted-foreground capitalize">{label}</span>
            </div>
          ))}
          {Object.entries(vehicleIcons).map(([type, icon]) => (
            <div key={type} className="flex items-center gap-2">
              <span className="text-xs">{icon}</span>
              <span className="text-[10px] text-muted-foreground capitalize">{type.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute top-3 left-3 bg-card/90 backdrop-blur border border-border rounded-lg px-3 py-2">
        <p className="text-[10px] font-mono text-success">{cityConfig.name.toUpperCase()} SECTOR</p>
        <p className="text-[10px] font-mono text-muted-foreground">{cityConfig.center.lat.toFixed(1)}°N {cityConfig.center.lng.toFixed(1)}°E</p>
      </div>
    </div>
  );
}
