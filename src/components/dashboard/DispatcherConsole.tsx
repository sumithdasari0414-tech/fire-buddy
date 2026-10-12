// Dispatcher console — raise dispatch requests for REAL incidents/stations/vehicles,
// then approve or reject them. Nothing is sent to any external system.
import { useState } from 'react';
import { ClipboardCheck, AlertTriangle, Check, X, Flag, Link2Off } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIncidents } from '@/hooks/useIncidents';
import { useStations } from '@/hooks/useStations';
import { useVehicles } from '@/hooks/useVehicles';
import { useDispatches } from '@/hooks/useDispatches';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import {
  approveDispatch, completeDispatch, rejectDispatch, requestDispatch, type DispatchRecord,
} from '@/integrations/firebase/dispatches';
import { getDispatchServiceProvider, isDispatchServiceConnected } from '@/services/dispatchService';

const sel = 'h-9 w-full rounded-md border border-input bg-background px-2 text-xs';
const fmt = (d: Date | null) => (d ? d.toLocaleString() : '—');

export function DispatcherConsole() {
  const { incidents, loading: iL, error: iE } = useIncidents();
  const { stations, error: sE } = useStations();
  const { vehicles } = useVehicles();
  const { dispatches, loading: dL, error: dE } = useDispatches();
  const { logs, error: aE } = useAuditLogs(50);

  const [operator, setOperator] = useState(() => localStorage.getItem('fw.operator') || '');
  const [incidentId, setIncidentId] = useState('');
  const [stationId, setStationId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const eligible = incidents.filter((i) => ['verified', 'acknowledged'].includes(String(i.status)));
  const gpsVehicles = vehicles.filter((v) => v.location);
  const who = operator.trim();

  const run = async (key: string, fn: () => Promise<unknown>, ok: string) => {
    if (!who) return toast.error('Enter your dispatcher ID first.');
    setBusy(key);
    try { await fn(); toast.success(ok); } catch (e) { toast.error((e as Error).message); } finally { setBusy(null); }
  };

  const onRequest = () => {
    const inc = incidents.find((i) => i.id === incidentId);
    const st = stations.find((s) => s.id === stationId);
    if (!inc || !st) return toast.error('Select a real incident and station.');
    const v = gpsVehicles.find((x) => x.id === vehicleId);
    run('req', () => requestDispatch({
      incidentId: inc.id, incidentLocation: { lat: inc.location.lat, lng: inc.location.lng },
      stationId: st.id, stationName: st.name, vehicleId: v?.id ?? null, vehicleCallsign: v?.callsign ?? null,
      requestedBy: who, note: note.trim() || undefined,
    }), 'Dispatch request raised — awaiting approval.').then(() => { setIncidentId(''); setNote(''); });
  };

  const act = (d: DispatchRecord, kind: 'approve' | 'reject' | 'complete') =>
    run(d.id + kind,
      () => kind === 'approve' ? approveDispatch(d, who, note.trim() || undefined)
        : kind === 'reject' ? rejectDispatch(d, who, note.trim() || undefined)
        : completeDispatch(d, who),
      `Dispatch ${kind}d.`);

  const err = iE || sE || dE;
  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold tracking-tight flex items-center gap-2"><ClipboardCheck className="w-4 h-4 text-primary" />DISPATCHER CONSOLE</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Every dispatch needs dispatcher approval. Records are stored in Firestore only.</p>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground">
          <Link2Off className="w-3 h-3" /> Fire-service link: {isDispatchServiceConnected() ? getDispatchServiceProvider().name : 'not connected'}
        </div>
      </div>

      {err && <div className="flex gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive"><AlertTriangle className="w-4 h-4 shrink-0" />{err}</div>}

      <section className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="grid gap-2 sm:grid-cols-2">
          <Input placeholder="Your dispatcher ID" value={operator} maxLength={60}
            onChange={(e) => { setOperator(e.target.value); localStorage.setItem('fw.operator', e.target.value); }} />
          <Input placeholder="Note (optional)" value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} />
        </div>
        <h3 className="text-xs font-semibold">Raise dispatch request</h3>
        <div className="grid gap-2 sm:grid-cols-3">
          <select className={sel} value={incidentId} onChange={(e) => setIncidentId(e.target.value)}>
            <option value="">{iL ? 'Loading…' : eligible.length ? 'Select verified incident' : 'No acknowledged/verified incidents'}</option>
            {eligible.map((i) => <option key={i.id} value={i.id}>{i.id} · {i.severity} · {i.location.lat.toFixed(4)},{i.location.lng.toFixed(4)}</option>)}
          </select>
          <select className={sel} value={stationId} onChange={(e) => setStationId(e.target.value)}>
            <option value="">{stations.length ? 'Select verified station' : 'No verified stations'}</option>
            {stations.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select className={sel} value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
            <option value="">{gpsVehicles.length ? 'Vehicle (optional)' : 'No vehicles with live GPS'}</option>
            {gpsVehicles.map((v) => <option key={v.id} value={v.id}>{v.callsign}</option>)}
          </select>
        </div>
        <Button size="sm" disabled={busy === 'req' || !incidentId || !stationId} onClick={onRequest}>Request dispatch</Button>
      </section>

      <section className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-xs font-semibold mb-3">Dispatch records ({dispatches.length})</h3>
        {dL ? <p className="text-xs text-muted-foreground">Loading…</p> : dispatches.length === 0 ? (
          <p className="text-xs text-muted-foreground">No dispatch records yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {dispatches.map((d) => (
              <li key={d.id} className="py-3 space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-mono">{d.incidentId}</span>
                  <span className="text-muted-foreground">→ {d.stationName}{d.vehicleCallsign && ` · ${d.vehicleCallsign}`}</span>
                  <span className="ml-auto rounded bg-secondary px-2 py-0.5 font-mono uppercase text-[10px]">{d.status.replace('_', ' ')}</span>
                </div>
                <p className="text-[11px] text-muted-foreground">Requested by {d.requestedBy} · {fmt(d.requestedAt)}{d.dispatcherId && ` · decided by ${d.dispatcherId} · ${fmt(d.decidedAt)}`}</p>
                {d.decisionNote && <p className="text-[11px]">“{d.decisionNote}”</p>}
                <div className="flex gap-2 pt-1">
                  {d.status === 'pending_approval' && <>
                    <Button size="sm" disabled={!!busy} onClick={() => act(d, 'approve')}><Check className="w-3 h-3 mr-1" />Approve</Button>
                    <Button size="sm" variant="outline" disabled={!!busy} onClick={() => act(d, 'reject')}><X className="w-3 h-3 mr-1" />Reject</Button>
                  </>}
                  {d.status === 'approved' && <Button size="sm" variant="outline" disabled={!!busy} onClick={() => act(d, 'complete')}><Flag className="w-3 h-3 mr-1" />Mark completed</Button>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-xs font-semibold mb-3">Audit trail</h3>
        {aE ? <p className="text-xs text-destructive">{aE}</p> : logs.length === 0 ? (
          <p className="text-xs text-muted-foreground">No audit entries yet.</p>
        ) : (
          <ul className="space-y-1 font-mono text-[11px]">
            {logs.map((l) => <li key={l.id}><span className="text-muted-foreground">{fmt(l.createdAt)}</span> · {l.actor} · {l.action} · {l.detail}</li>)}
          </ul>
        )}
      </section>
    </div>
  );
}
