// Responder lifecycle controls for a real Firestore incident.
// unverified → acknowledged → verified → dispatched → en_route → arrived → resolved
// Every click writes the new status to Firestore; nothing is simulated and no
// external dispatch/traffic-priority system is involved.
import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, ChevronRight } from 'lucide-react';
import { LIFECYCLE, nextStatus, setIncidentStatus, type LifecycleStatus } from '@/integrations/firebase/lifecycle';
import { StatusBadge } from './StatusBadge';

export function LifecycleControls({ incidentId, status }: { incidentId: string; status: LifecycleStatus }) {
  const [busy, setBusy] = useState<LifecycleStatus | null>(null);
  const upcoming = nextStatus(status);

  const advance = async (target: LifecycleStatus) => {
    setBusy(target);
    try {
      await setIncidentStatus(incidentId, target);
      toast.success(`Incident ${incidentId} marked ${target.replace('_', ' ')}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update incident status');
    } finally {
      setBusy(null);
    }
  };

  const index = LIFECYCLE.indexOf(status);

  return (
    <div className="bg-secondary rounded-lg p-3">
      <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-2">Response Lifecycle</p>

      <div className="flex flex-wrap gap-1 mb-3">
        {LIFECYCLE.map((s, i) => (
          <span
            key={s}
            className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
              i < index
                ? 'bg-muted text-muted-foreground'
                : i === index
                  ? 'bg-primary/20 text-primary border border-primary/40'
                  : 'text-muted-foreground/50'
            }`}
          >
            {s.replace('_', ' ')}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2">
        <StatusBadge variant="info">{status.replace('_', ' ')}</StatusBadge>
        {upcoming ? (
          <button
            onClick={() => void advance(upcoming)}
            disabled={busy !== null}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/15 border border-primary/40 rounded-lg text-xs font-mono text-primary hover:bg-primary/25 disabled:opacity-50 transition-colors"
          >
            {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <ChevronRight className="w-3 h-3" />}
            Mark {upcoming.replace('_', ' ')}
          </button>
        ) : (
          <span className="text-[11px] font-mono text-success">Lifecycle complete</span>
        )}
      </div>
    </div>
  );
}
