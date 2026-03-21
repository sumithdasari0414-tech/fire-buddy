import { motion } from 'framer-motion';
import { incidentLogs } from '@/data/mockData';
import { StatusBadge } from './StatusBadge';
import { FileText, Download, Clock, MapPin } from 'lucide-react';

const statusVariant = {
  detected: 'warning',
  alerted: 'critical',
  dispatched: 'info',
  contained: 'success',
  resolved: 'success',
  false_alarm: 'warning',
} as const;

export function IncidentHistoryPanel() {
  const generateReport = () => {
    const report = incidentLogs.map(log =>
      `[${log.timestamp}] ${log.incidentId} | ${log.severity.toUpperCase()} | ${log.status} | ${log.location}\n  ${log.event}\n  ${log.details}${log.responseTime ? `\n  Response time: ${log.responseTime}` : ''}`
    ).join('\n\n');

    const blob = new Blob([`FIREWATCH INCIDENT REPORT\nGenerated: ${new Date().toISOString()}\n${'='.repeat(60)}\n\n${report}`], { type: 'text/plain' });
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
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />

          {incidentLogs.map((log, i) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="relative mb-4 last:mb-0"
            >
              {/* Timeline dot */}
              <div className={`absolute -left-2 top-2 w-3 h-3 rounded-full border-2 border-background ${
                log.status === 'false_alarm' ? 'bg-warning' :
                log.status === 'detected' || log.status === 'alerted' ? 'bg-critical' :
                log.status === 'dispatched' ? 'bg-info' : 'bg-success'
              }`} />

              <div className="ml-4 bg-secondary rounded-lg p-3 border border-border">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <p className="text-sm font-medium">{log.event}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
                        <Clock className="w-2.5 h-2.5" /> {log.timestamp}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <MapPin className="w-2.5 h-2.5" /> {log.location}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <StatusBadge variant={log.severity as any}>{log.severity}</StatusBadge>
                    <StatusBadge variant={statusVariant[log.status]}>{log.status.replace('_', ' ')}</StatusBadge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">{log.details}</p>
                {log.responseTime && (
                  <p className="text-[10px] font-mono text-success mt-1">⚡ Response: {log.responseTime}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
