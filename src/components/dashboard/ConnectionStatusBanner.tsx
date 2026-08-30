// Slim banner shown when the live Firestore feed is unreachable or serving
// cached data. Renders nothing while the connection is healthy.
import { WifiOff, RefreshCw } from 'lucide-react';
import { useIncidents } from '@/hooks/useIncidents';

export function ConnectionStatusBanner() {
  const { status, stale, error, reload } = useIncidents();

  if (status === 'live' || status === 'loading') return null;

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-1.5 bg-warning/10 border-b border-warning/30">
      <div className="flex items-center gap-2 min-w-0">
        <WifiOff className="w-3.5 h-3.5 text-warning flex-shrink-0" />
        <p className="text-[11px] font-mono text-warning truncate">
          {stale
            ? 'LIVE FEED UNREACHABLE — showing last known incident data. Retrying…'
            : `LIVE FEED OFFLINE — ${error ?? 'no cached data available'}. Retrying…`}
        </p>
      </div>
      <button
        onClick={reload}
        className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono text-warning border border-warning/40 rounded hover:bg-warning/10 transition-colors flex-shrink-0"
      >
        <RefreshCw className="w-2.5 h-2.5" /> RETRY NOW
      </button>
    </div>
  );
}
