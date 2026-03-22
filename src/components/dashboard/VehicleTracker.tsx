import { motion } from 'framer-motion';
import { getVehicles } from '@/data/mockData';
import { StatusBadge } from './StatusBadge';
import { Navigation, Gauge, Radio } from 'lucide-react';

const statusVariant = {
  available: 'success',
  en_route: 'warning',
  on_scene: 'critical',
  returning: 'info',
} as const;

const vehicleEmoji: Record<string, string> = {
  fire_engine: '🚒',
  ambulance: '🚑',
  police: '🚓',
};

export function VehicleTracker() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-sm font-bold tracking-tight">FLEET STATUS</h2>
        <div className="flex gap-2">
          <StatusBadge variant="success">{mockVehicles.filter(v => v.status === 'available').length} Available</StatusBadge>
          <StatusBadge variant="warning">{mockVehicles.filter(v => v.status === 'en_route').length} En Route</StatusBadge>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-border">
        {mockVehicles.map((v, i) => (
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
              <StatusBadge variant={statusVariant[v.status]} pulse={v.status === 'en_route'}>
                {v.status.replace('_', ' ')}
              </StatusBadge>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-3">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Navigation className="w-3 h-3" />
                <span>{v.location.lat.toFixed(3)}°N, {v.location.lng.toFixed(3)}°E</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Gauge className="w-3 h-3" />
                <span>{v.speed} km/h</span>
              </div>
              {v.eta && (
                <div className="flex items-center gap-1.5 text-[11px] text-success font-mono">
                  <Radio className="w-3 h-3" />
                  <span>ETA: {v.eta}</span>
                </div>
              )}
            </div>

            {v.assignedIncident && (
              <div className="mt-2 px-2 py-1 bg-primary/10 rounded text-[10px] font-mono text-primary">
                Assigned: {v.assignedIncident}
              </div>
            )}

            {v.status === 'en_route' && (
              <div className="mt-2">
                <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                  <span>Route Progress</span>
                  <span className="text-success">Fastest route selected</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: '65%' }}
                    transition={{ duration: 2, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-warning to-success rounded-full"
                  />
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
