// Shared loading / error / empty states for Firestore-backed incident views.
import { Loader2, AlertTriangle, Flame, RefreshCw } from 'lucide-react';

export function IncidentsLoading({ label = 'Loading incidents from Firestore…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[200px] gap-3 text-muted-foreground">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
      <p className="text-xs font-mono">{label}</p>
    </div>
  );
}

export function IncidentsError({ error, onRetry }: { error: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[200px] gap-3 text-center p-6">
      <AlertTriangle className="w-6 h-6 text-critical" />
      <div>
        <p className="text-sm font-semibold text-foreground">Could not load incidents</p>
        <p className="text-xs text-muted-foreground mt-1 font-mono break-all">{error}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary border border-border rounded-lg text-xs font-mono hover:bg-muted transition-colors"
        >
          <RefreshCw className="w-3 h-3" /> RETRY
        </button>
      )}
    </div>
  );
}

export function IncidentsEmpty() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[200px] gap-3 text-muted-foreground">
      <Flame className="w-6 h-6" />
      <p className="text-xs font-mono">No incidents found in Firestore.</p>
    </div>
  );
}
