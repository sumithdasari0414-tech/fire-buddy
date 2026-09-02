// Incident history built from the real Firestore incident feed (NASA FIRMS
// VIIRS detections and their lifecycle status). No mock logs are used — if the
// feed is empty the panel shows an honest empty state.
import { motion } from 'framer-motion';
import { FileText, Download, Clock, MapPin } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { useIncidents } from '@/hooks/useIncidents';
import { IncidentsLoading, IncidentsError, IncidentsEmpty } from './IncidentsDataState';

const statusVariant: Record<string, 'critical' | 'warning' | 'info' | 'success'> = {
  unverified: 'warning',
  acknowledged: 'info',
  verified: 'critical',
  dispatched: 'info',
  en_route: 'info',
  arrived: 'critical',
  resolved: 'success',
};

export function IncidentHistoryPanel() {
  const { incidents, loading, error, reload } = useIncidents();

  if (loading) return <IncidentsLoading label="Loading incident history from Firestore…" />;
  if (error) return <IncidentsError error={error} onRetry={reload} />;
  if (incidents.length === 0) return <IncidentsEmpty />;

  // Newest first, based on the real detection timestamp.
  const history = [...incidents].sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));

  const generateReport = () => {
    const report = history
      .map(
        (inc) =>
          `[${inc.timestamp}] ${inc.id} | ${inc.severity.toUpperCase()} | ${inc.status} | ${inc.location.street}, ${inc.location.city}\n  ${inc.description}`,
      )
      .join('\n\n');

    const blob = new Blob(
      [`FIREWATCH INCIDENT REPORT\nGenerated: ${new Date().toISOString()}\n${'='.repeat(60)}\n\n${report}`],
      { type: 'text/plain' },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `firewatch-report-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-info" />
          <h2 className="text-sm font-bold tracking-tight">INCIDENT HISTORY</h2>
          <span className="text-[10px] font-mono text-muted-foreground">{history.length} RECORDS</span>
        </div>
        <button
          onClick={generateReport}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary border border-border rounded-lg text-xs font-mono hover:bg-muted transition-colors"
        >
          <Download className="w-3 h-3" /> EXPORT REPORT
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="relative pl-8 pr-4 py-4">
          <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />

          {history.map((inc, i) => (
            <motion.div
              key={inc.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(i, 10) * 0.05 }}
              className="relative mb-4 last:mb-0"
            >
              <div
                className={`absolute -left-2 top-2 w-3 h-3 rounded-full border-2 border-background ${
                  inc.status === 'resolved'
                    ? 'bg-success'
                    : inc.status === 'unverified'
                      ? 'bg-warning'
                      : inc.status === 'dispatched' || inc.status === 'en_route' || inc.status === 'acknowledged'
                        ? 'bg-info'
                        : 'bg-critical'
                }`}
              />

              <div className="ml-4 bg-secondary rounded-lg p-3 border border-border">
                <div className="flex items-start justify-between mb-1">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{inc.description.split('.')[0]}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
                        <Clock className="w-2.5 h-2.5" /> {inc.timestamp}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <MapPin className="w-2.5 h-2.5" /> {inc.location.street}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground">{inc.id}</span>
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <StatusBadge variant={inc.severity as any}>{inc.severity}</StatusBadge>
                    <StatusBadge variant={statusVariant[inc.status] ?? 'info'}>
                      {inc.status.replace('_', ' ')}
                    </StatusBadge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">{inc.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
