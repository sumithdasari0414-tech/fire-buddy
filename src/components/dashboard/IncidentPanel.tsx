import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { Incident } from '@/data/mockData';
import { useIncidents } from '@/hooks/useIncidents';
import { fetchSourcesForIncident, type IncidentSource } from '@/integrations/firebase/sources';
import { StatusBadge } from './StatusBadge';
import { IncidentsLoading, IncidentsError, IncidentsEmpty } from './IncidentsDataState';
import { MapPin, Clock, Building, Maximize2, AlertTriangle, Link2, ExternalLink, Loader2 } from 'lucide-react';

export function IncidentPanel({ selectedId, onSelect }: {
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  const { incidents, loading, error, reload } = useIncidents();
  const selected = incidents.find(i => i.id === selectedId);

  if (loading) return <IncidentsLoading />;
  if (error) return <IncidentsError error={error} onRetry={reload} />;
  if (incidents.length === 0) return <IncidentsEmpty />;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-sm font-bold tracking-tight">ACTIVE INCIDENTS</h2>
        <StatusBadge variant="critical" pulse>{incidents.filter(i => i.status !== 'resolved').length} ACTIVE</StatusBadge>
      </div>

      <div className="flex-1 overflow-y-auto">
        {!selected ? (
          <div className="divide-y divide-border">
            {incidents.map((inc, i) => (
              <motion.button
                key={inc.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => onSelect(inc.id)}
                className="w-full text-left p-4 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-1.5">
                  <span className="font-mono text-xs font-bold">{inc.id}</span>
                  <StatusBadge variant={inc.severity as any} pulse={inc.severity === 'critical'}>
                    {inc.severity}
                  </StatusBadge>
                </div>
                <p className="text-sm text-foreground font-medium">{inc.location.street}</p>
                <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{inc.reportedAt}</span>
                  <span className="flex items-center gap-1"><Building className="w-3 h-3" />{inc.buildingType}</span>
                </div>
                {inc.falseAlarmScore > 50 && (
                  <div className="flex items-center gap-1 mt-2 text-[11px] text-warning">
                    <AlertTriangle className="w-3 h-3" />
                    <span>False alarm probability: {inc.falseAlarmScore}%</span>
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        ) : (
          <IncidentDetail incident={selected} onBack={() => onSelect('')} />
        )}
      </div>
    </div>
  );
}

function IncidentDetail({ incident, onBack }: { incident: Incident; onBack: () => void }) {
  const spreadColors = { contained: 'success', slow: 'info', moderate: 'warning', rapid: 'critical' } as const;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 space-y-4">
      <button onClick={onBack} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
        ← Back to all incidents
      </button>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-lg font-bold">{incident.id}</span>
          <StatusBadge variant={incident.severity as any} pulse={incident.severity === 'critical'}>
            {incident.severity}
          </StatusBadge>
        </div>
        <p className="text-sm text-muted-foreground">{incident.description}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <InfoCard label="Location" value={incident.location.street} sub={`${incident.location.city} - ${incident.location.pincode}`} />
        <InfoCard label="Coordinates" value={`${incident.location.lat.toFixed(4)}°N`} sub={`${incident.location.lng.toFixed(4)}°E`} />
        <InfoCard label="Building" value={incident.buildingType} sub={`Area: ${incident.affectedArea}`} />
        <InfoCard label="Reported" value={incident.reportedAt} sub={`Status: ${incident.status}`} />
      </div>

      <div className="bg-secondary rounded-lg p-3">
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-2">Fire Spread Prediction</p>
        <div className="flex items-center justify-between">
          <StatusBadge variant={spreadColors[incident.spreadPrediction]}>
            {incident.spreadPrediction} spread
          </StatusBadge>
          <div className="flex gap-1">
            {['contained', 'slow', 'moderate', 'rapid'].map((level) => (
              <div
                key={level}
                className={`w-8 h-2 rounded-full ${
                  ['contained', 'slow', 'moderate', 'rapid'].indexOf(incident.spreadPrediction) >=
                  ['contained', 'slow', 'moderate', 'rapid'].indexOf(level)
                    ? level === 'rapid' ? 'bg-critical' : level === 'moderate' ? 'bg-warning' : level === 'slow' ? 'bg-info' : 'bg-success'
                    : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="bg-secondary rounded-lg p-3">
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-2">False Alarm Analysis</p>
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold">{incident.falseAlarmScore}% probability</span>
          <StatusBadge variant={incident.falseAlarmScore > 50 ? 'warning' : 'success'}>
            {incident.falseAlarmScore > 50 ? 'VERIFY' : 'CONFIRMED'}
          </StatusBadge>
        </div>
        <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${incident.falseAlarmScore > 50 ? 'bg-warning' : 'bg-success'}`}
            style={{ width: `${100 - incident.falseAlarmScore}%` }}
          />
        </div>
      </div>

      <LifecycleControls incidentId={incident.id} status={incident.status} />

      <IncidentSources incidentId={incident.id} />
    </motion.div>
  );
}

// Provenance: sources & verification records linked to this incident.
function IncidentSources({ incidentId }: { incidentId: string }) {
  const [sources, setSources] = useState<IncidentSource[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setSources(null);
    setFailed(false);
    fetchSourcesForIncident(incidentId)
      .then((s) => { if (!cancelled) setSources(s); })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [incidentId]);

  return (
    <div className="bg-secondary rounded-lg p-3">
      <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <Link2 className="w-3 h-3" /> Sources &amp; Verification
      </p>
      {sources === null && !failed ? (
        <p className="text-[11px] text-muted-foreground font-mono flex items-center gap-1.5">
          <Loader2 className="w-3 h-3 animate-spin" /> Loading sources…
        </p>
      ) : failed ? (
        <p className="text-[11px] text-muted-foreground font-mono">Source records unavailable.</p>
      ) : sources.length === 0 ? (
        <p className="text-[11px] text-muted-foreground font-mono">No verification sources on record.</p>
      ) : (
        <div className="space-y-2">
          {sources.map((s) => (
            <div key={s.id} className="border border-border rounded-md p-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium truncate">{s.sourceName}</p>
                <StatusBadge variant="info">{s.sourceType}</StatusBadge>
              </div>
              <p className="text-[10px] text-muted-foreground font-mono mt-1">Published: {s.publicationDate}</p>
              {s.notes !== '—' && <p className="text-[11px] text-muted-foreground mt-1">{s.notes}</p>}
              {s.sourceUrl && (
                <a
                  href={s.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] font-mono text-info hover:underline mt-1"
                >
                  <ExternalLink className="w-2.5 h-2.5" /> View source
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InfoCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-secondary rounded-lg p-2.5">
      <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-sm font-semibold mt-0.5">{value}</p>
      <p className="text-[11px] text-muted-foreground">{sub}</p>
    </div>
  );
}
