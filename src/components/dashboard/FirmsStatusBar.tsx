// Honest provenance strip for the satellite feed: shows the last NASA FIRMS
// sync, how many detections came back, and any provider warnings/errors.
import { Satellite, RefreshCw, AlertTriangle } from 'lucide-react';
import { useFirmsIngestion } from '@/hooks/useFirmsIngestion';
import { useStationAssignment } from '@/hooks/useStationAssignment';

export function FirmsStatusBar() {
  const { syncing, error, warnings, lastSyncAt, detected, created, sync } = useFirmsIngestion();
  useStationAssignment(); // nearest-station alerts follow the live incident feed

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-1.5 border-b border-border bg-secondary/20">
      <div className="flex items-center gap-2 min-w-0">
        <Satellite className={`w-3.5 h-3.5 flex-shrink-0 ${error ? 'text-destructive' : 'text-info'}`} />
        <p className="text-[11px] font-mono text-muted-foreground truncate">
          {syncing
            ? 'NASA FIRMS VIIRS — syncing Hyderabad area detections…'
            : error
              ? `NASA FIRMS unavailable — ${error}`
              : `NASA FIRMS VIIRS — ${detected} detection${detected === 1 ? '' : 's'} in last 24 h${created ? `, ${created} new` : ''}${lastSyncAt ? ` · ${lastSyncAt.toLocaleTimeString()}` : ''}`}
        </p>
        {!error && warnings.length > 0 && (
          <span className="flex items-center gap-1 text-[10px] font-mono text-warning flex-shrink-0">
            <AlertTriangle className="w-2.5 h-2.5" /> {warnings.length} partial source failure
          </span>
        )}
      </div>
      <button
        onClick={sync}
        disabled={syncing}
        className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono text-muted-foreground border border-border rounded hover:bg-secondary/50 transition-colors flex-shrink-0 disabled:opacity-50"
      >
        <RefreshCw className={`w-2.5 h-2.5 ${syncing ? 'animate-spin' : ''}`} /> SYNC
      </button>
    </div>
  );
}
