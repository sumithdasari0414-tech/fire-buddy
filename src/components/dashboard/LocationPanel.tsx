import { motion } from 'framer-motion';
import { getGoogleMapsLink } from '@/data/mockData';
import { useIncidents } from '@/hooks/useIncidents';
import { StatusBadge } from './StatusBadge';
import { IncidentsLoading, IncidentsError, IncidentsEmpty } from './IncidentsDataState';
import { MapPin, ExternalLink, Copy, Navigation, Building, Clock, Users, Cpu } from 'lucide-react';
import { toast } from 'sonner';

export function LocationPanel({ incidentId }: { incidentId?: string }) {
  const { incidents, loading, error, reload } = useIncidents();
  const incident = incidents.find(i => i.id === incidentId) || incidents[0];

  if (loading) return <IncidentsLoading />;
  if (error) return <IncidentsError error={error} onRetry={reload} />;
  if (!incident) return <IncidentsEmpty />;


  const copyCoords = () => {
    navigator.clipboard.writeText(`${incident.location.lat}, ${incident.location.lng}`);
    toast.success('Coordinates copied to clipboard');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold tracking-tight">LOCATION INTELLIGENCE</h2>
        </div>
        <StatusBadge variant={incident.severity as any} pulse={incident.severity === 'critical'}>
          {incident.id}
        </StatusBadge>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Location Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-secondary rounded-lg p-4 border border-border"
        >
          <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3">EXACT LOCATION</h3>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Navigation className="w-4 h-4 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-bold">{incident.location.street}</p>
                <p className="text-xs text-muted-foreground">{incident.location.city} — {incident.location.pincode}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted rounded-lg p-2.5">
                <p className="text-[10px] font-mono text-muted-foreground">LATITUDE</p>
                <p className="text-sm font-bold font-mono text-info">{incident.location.lat.toFixed(6)}°N</p>
              </div>
              <div className="bg-muted rounded-lg p-2.5">
                <p className="text-[10px] font-mono text-muted-foreground">LONGITUDE</p>
                <p className="text-sm font-bold font-mono text-info">{incident.location.lng.toFixed(6)}°E</p>
              </div>
            </div>

            <div className="flex gap-2">
              <a
                href={getGoogleMapsLink(incident.location.lat, incident.location.lng)}
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
          </div>
        </motion.div>

        {/* Building Info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-secondary rounded-lg p-4 border border-border"
        >
          <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3">BUILDING INFORMATION</h3>
          <div className="grid grid-cols-2 gap-3">
            <InfoRow icon={Building} label="Type" value={incident.buildingType} />
            <InfoRow icon={MapPin} label="Area" value={incident.affectedArea} />
            <InfoRow icon={Users} label="Humans Detected" value={`${incident.humansDetected} people`} />
            <InfoRow icon={Cpu} label="Detection Source" value={incident.detectionSource.toUpperCase()} />
            <InfoRow icon={Clock} label="Reported" value={incident.reportedAt} />
            <InfoRow icon={Clock} label="Timestamp" value={incident.timestamp} />
          </div>
        </motion.div>

        {/* AI Recommendation */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-primary/10 border border-primary/30 rounded-lg p-4"
        >
          <h3 className="text-xs font-mono text-primary uppercase tracking-wider mb-2 flex items-center gap-1">
            <Cpu className="w-3 h-3" /> AI RECOMMENDATION
          </h3>
          <p className="text-sm text-foreground leading-relaxed">{incident.aiRecommendation}</p>
        </motion.div>

        {/* Alert Status */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-secondary rounded-lg p-4 border border-border"
        >
          <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3">ALERT STATUS</h3>
          <div className="space-y-2">
            {[
              { channel: 'Emergency Radio', status: 'Sent', time: '0.3s' },
              { channel: 'SMS Alert', status: 'Delivered', time: '1.2s' },
              { channel: 'Email Notification', status: 'Delivered', time: '2.1s' },
              { channel: 'WhatsApp Alert', status: 'Delivered', time: '1.8s' },
              { channel: 'Auto-Call (Fire Station)', status: 'Connected', time: '3.5s' },
            ].map(alert => (
              <div key={alert.channel} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                <span className="text-xs">{alert.channel}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-muted-foreground">{alert.time}</span>
                  <StatusBadge variant="success">{alert.status}</StatusBadge>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-3 h-3 text-muted-foreground flex-shrink-0" />
      <div>
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <p className="text-xs font-medium">{value}</p>
      </div>
    </div>
  );
}
