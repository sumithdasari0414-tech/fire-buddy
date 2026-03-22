import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getCallers, getGoogleMapsLink, EmergencyCaller } from '@/data/mockData';
import { StatusBadge } from './StatusBadge';
import { Phone, MapPin, Clock, ExternalLink, Copy, Navigation, Radio, Signal, User, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export function CallerTrackingPanel() {
  const [callers, setCallers] = useState<EmergencyCaller[]>(getCallers());
  const [selectedCaller, setSelectedCaller] = useState<string>(callers[0]?.id || '');

  useEffect(() => {
    const data = getCallers();
    setCallers(data);
    if (data.length > 0) setSelectedCaller(data[0].id);
  }, []);

  const activeCaller = callers.find(c => c.id === selectedCaller) || callers[0];

  const copyCoords = () => {
    if (!activeCaller) return;
    navigator.clipboard.writeText(`${activeCaller.location.lat}, ${activeCaller.location.lng}`);
    toast.success('Caller coordinates copied');
  };

  const statusColors: Record<string, 'critical' | 'warning' | 'success' | 'info'> = {
    active: 'critical',
    on_hold: 'warning',
    completed: 'success',
    missed: 'info',
  };

  if (!activeCaller) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p className="text-sm font-mono">No caller data available</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold tracking-tight">CALLER LOCATION TRACKING</h2>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge variant="info">{callers.length} CALLS</StatusBadge>
          <StatusBadge variant={callers.some(c => c.status === 'active') ? 'critical' : 'success'} pulse={callers.some(c => c.status === 'active')}>
            {callers.filter(c => c.status === 'active').length} ACTIVE
          </StatusBadge>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Caller list */}
        <div className="w-72 border-r border-border overflow-y-auto">
          {callers.map((caller, i) => (
            <button
              key={caller.id}
              onClick={() => setSelectedCaller(caller.id)}
              className={`w-full text-left p-3 border-b border-border transition-colors ${
                selectedCaller === caller.id
                  ? 'bg-primary/10 border-l-2 border-l-primary'
                  : 'hover:bg-secondary'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono text-muted-foreground">{caller.id}</span>
                <StatusBadge variant={statusColors[caller.status]}>
                  {caller.status}
                </StatusBadge>
              </div>
              <p className="text-sm font-bold truncate">{caller.name}</p>
              <p className="text-[10px] text-muted-foreground font-mono">{caller.phone}</p>
              <div className="flex items-center gap-1 mt-1">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">{caller.callTime} · {caller.duration}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Caller details */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Caller identity */}
          <motion.div
            key={activeCaller.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-secondary rounded-lg p-4 border border-border"
          >
            <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
              <User className="w-3 h-3" /> CALLER IDENTIFICATION
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-muted-foreground">Name</p>
                <p className="text-sm font-bold">{activeCaller.name}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Phone</p>
                <p className="text-sm font-bold font-mono">{activeCaller.phone}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Call Time</p>
                <p className="text-sm font-mono">{activeCaller.callTime}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Duration</p>
                <p className="text-sm font-mono">{activeCaller.duration}</p>
              </div>
            </div>
            <div className="mt-3 p-2 bg-muted rounded-lg">
              <p className="text-[10px] text-muted-foreground mb-1">CALLER DESCRIPTION</p>
              <p className="text-xs leading-relaxed">{activeCaller.description}</p>
            </div>
          </motion.div>

          {/* Exact location */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-secondary rounded-lg p-4 border border-border"
          >
            <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
              <Navigation className="w-3 h-3" /> EXACT CALLER LOCATION
            </h3>

            <div className="flex items-start gap-3 mb-3">
              <MapPin className="w-4 h-4 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-bold">{activeCaller.address}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-muted rounded-lg p-2.5">
                <p className="text-[10px] font-mono text-muted-foreground">LATITUDE</p>
                <p className="text-sm font-bold font-mono text-info">{activeCaller.location.lat.toFixed(6)}°N</p>
              </div>
              <div className="bg-muted rounded-lg p-2.5">
                <p className="text-[10px] font-mono text-muted-foreground">LONGITUDE</p>
                <p className="text-sm font-bold font-mono text-info">{activeCaller.location.lng.toFixed(6)}°E</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-muted rounded-lg p-2.5">
                <p className="text-[10px] font-mono text-muted-foreground">LOCATION METHOD</p>
                <div className="flex items-center gap-1 mt-0.5">
                  {activeCaller.locationType === 'gps' ? (
                    <Signal className="w-3 h-3 text-success" />
                  ) : (
                    <Radio className="w-3 h-3 text-warning" />
                  )}
                  <p className="text-xs font-bold uppercase">{activeCaller.locationType === 'gps' ? 'GPS LOCK' : 'CELL TOWER'}</p>
                </div>
              </div>
              <div className="bg-muted rounded-lg p-2.5">
                <p className="text-[10px] font-mono text-muted-foreground">ACCURACY</p>
                <p className="text-sm font-bold font-mono text-success">{activeCaller.accuracy}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <a
                href={getGoogleMapsLink(activeCaller.location.lat, activeCaller.location.lng)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-info/20 border border-info/30 rounded-lg text-info text-xs font-mono hover:bg-info/30 transition-colors"
              >
                <ExternalLink className="w-3 h-3" /> OPEN IN GOOGLE MAPS
              </a>
              <button
                onClick={copyCoords}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-secondary border border-border rounded-lg text-xs font-mono hover:bg-muted transition-colors"
              >
                <Copy className="w-3 h-3" /> COPY
              </button>
            </div>
          </motion.div>

          {/* Severity assessment */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`rounded-lg p-4 border ${
              activeCaller.severity === 'critical' ? 'bg-critical/10 border-critical/30' :
              activeCaller.severity === 'high' ? 'bg-primary/10 border-primary/30' :
              activeCaller.severity === 'medium' ? 'bg-warning/10 border-warning/30' :
              'bg-info/10 border-info/30'
            }`}
          >
            <h3 className="text-xs font-mono uppercase tracking-wider mb-2 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> SEVERITY ASSESSMENT
            </h3>
            <div className="flex items-center gap-2 mb-2">
              <StatusBadge variant={activeCaller.severity as any} pulse={activeCaller.severity === 'critical'}>
                {activeCaller.severity.toUpperCase()}
              </StatusBadge>
              <span className="text-xs">
                {activeCaller.severity === 'critical' ? 'Immediate response required' :
                 activeCaller.severity === 'high' ? 'Urgent — dispatch units' :
                 activeCaller.severity === 'medium' ? 'Standard response' :
                 'Low priority — verify'}
              </span>
            </div>
          </motion.div>

          {/* Live location simulation */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-secondary rounded-lg p-4 border border-border"
          >
            <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3">LOCATION TRACE LOG</h3>
            <div className="space-y-2">
              {[
                { time: activeCaller.callTime, event: 'Call initiated', detail: `${activeCaller.locationType === 'gps' ? 'GPS' : 'Tower'} trace started` },
                { time: activeCaller.callTime, event: 'Location acquired', detail: `Accuracy: ${activeCaller.accuracy}` },
                { time: activeCaller.callTime, event: 'Address resolved', detail: activeCaller.address },
                { time: activeCaller.callTime, event: 'Nearest station identified', detail: 'Auto-dispatch triggered' },
              ].map((log, i) => (
                <div key={i} className="flex items-start gap-2 py-1.5 border-b border-border last:border-0">
                  <span className="text-[10px] font-mono text-muted-foreground w-16 flex-shrink-0">{log.time}</span>
                  <div>
                    <p className="text-xs font-medium">{log.event}</p>
                    <p className="text-[10px] text-muted-foreground">{log.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
