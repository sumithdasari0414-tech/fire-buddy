import { motion } from 'framer-motion';
import { getIncidents, getVehicles, getNotifications, getCityConfig } from '@/data/mockData';
import { StatusBadge } from './StatusBadge';
import { IncidentMap } from './IncidentMap';
import { SosEmergencyButton } from './SosEmergencyButton';
import { Flame, Truck, Bell, Shield, Phone, MapPin, Activity, Zap, Camera, Building, FileText, Navigation } from 'lucide-react';

function StatCard({ icon: Icon, label, value, sub, variant }: {
  icon: React.ElementType; label: string; value: string | number; sub: string;
  variant: 'critical' | 'warning' | 'success' | 'info';
}) {
  const colors = {
    critical: 'border-critical/20 bg-critical/5',
    warning: 'border-warning/20 bg-warning/5',
    success: 'border-success/20 bg-success/5',
    info: 'border-info/20 bg-info/5',
  };
  const iconColors = { critical: 'text-critical', warning: 'text-warning', success: 'text-success', info: 'text-info' };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`rounded-lg border p-4 ${colors[variant]}`}>
      <div className="flex items-center justify-between mb-2">
        <Icon className={`w-5 h-5 ${iconColors[variant]}`} />
        <span className="text-[10px] font-mono text-muted-foreground uppercase">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
    </motion.div>
  );
}

export function CommandOverview({ onSelectIncident, onNavigate }: {
  onSelectIncident: (id: string) => void;
  onNavigate: (tab: string) => void;
}) {
  const incidents = getIncidents();
  const vehicles = getVehicles();
  const notifications = getNotifications();
  const cityConfig = getCityConfig();

  const activeIncidents = incidents.filter(i => i.status === 'active').length;
  const deployedVehicles = vehicles.filter(v => v.status !== 'available').length;
  const unreadAlerts = notifications.filter(n => !n.read).length;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <Flame className="w-5 h-5 text-primary" />
            FIREWATCH — {cityConfig.name.toUpperCase()} COMMAND
          </h1>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            {new Date().toLocaleString()} — {cityConfig.state.toUpperCase()} · ALL SYSTEMS OPERATIONAL
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SosEmergencyButton />
          <StatusBadge variant="critical" pulse>LIVE</StatusBadge>
          <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-success/10 rounded text-[10px] font-mono text-success">
            <Zap className="w-3 h-3" /> 24/7 MONITORING
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={Flame} label="Active Incidents" value={activeIncidents} sub={`${incidents.length} total today`} variant="critical" />
          <StatCard icon={Truck} label="Deployed Units" value={deployedVehicles} sub={`${vehicles.length} total fleet`} variant="warning" />
          <StatCard icon={Bell} label="Unread Alerts" value={unreadAlerts} sub={`${notifications.length} total`} variant="info" />
          <StatCard icon={Shield} label="Response Time" value="4.2m" sub="Avg today" variant="success" />
        </div>

        <div className="rounded-lg border border-border overflow-hidden" style={{ height: '340px' }}>
          <IncidentMap onSelectIncident={(id) => { onSelectIncident(id); onNavigate('incidents'); }} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Camera, label: 'Fire Detection', tab: 'detection' },
            { icon: MapPin, label: 'Live Map', tab: 'map' },
            { icon: Navigation, label: 'Location Intel', tab: 'location' },
            { icon: Building, label: 'Fire Stations', tab: 'stations' },
            { icon: Truck, label: 'Fleet Status', tab: 'vehicles' },
            { icon: Phone, label: 'Caller Tracking', tab: 'callers' },
            { icon: FileText, label: 'Incident Logs', tab: 'history' },
            { icon: Activity, label: 'Safety Guide', tab: 'safety' },
          ].map(action => (
            <button
              key={action.tab}
              onClick={() => onNavigate(action.tab)}
              className="flex items-center gap-2 p-3 rounded-lg bg-secondary border border-border hover:border-primary/30 transition-colors"
            >
              <action.icon className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{action.label}</span>
            </button>
          ))}
        </div>

        <div>
          <h3 className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-wider mb-2">Priority Incidents</h3>
          <div className="space-y-2">
            {incidents.filter(i => i.severity === 'critical' || i.severity === 'high').map(inc => (
              <button
                key={inc.id}
                onClick={() => { onSelectIncident(inc.id); onNavigate('incidents'); }}
                className="w-full flex items-center justify-between p-3 bg-secondary rounded-lg border border-border hover:border-primary/30 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <StatusBadge variant={inc.severity as any} pulse={inc.severity === 'critical'}>
                    {inc.severity}
                  </StatusBadge>
                  <div>
                    <p className="text-sm font-medium">{inc.id} — {inc.location.street}</p>
                    <p className="text-[11px] text-muted-foreground">{inc.reportedAt} · Spread: {inc.spreadPrediction} · Humans: {inc.humansDetected}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
