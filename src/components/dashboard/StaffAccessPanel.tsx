// Staff sign-in + admin-only role management. Roles come from server-set claims only.
import { useEffect, useState } from 'react';
import { ShieldCheck, AlertTriangle, LogOut, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ROLES, bootstrapAdmin, listStaff, refreshClaims, resendVerification, setStaffRole,
  staffSignIn, staffSignOut, staffSignUp, subscribeStaff, type StaffRole, type StaffState, type StaffUserRow,
} from '@/integrations/firebase/staffAuth';

const sel = 'h-9 rounded-md border border-input bg-background px-2 text-xs';

export function StaffAccessPanel() {
  const [s, setS] = useState<StaffState | null>(null);
  const [email, setEmail] = useState(''); const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [users, setUsers] = useState<StaffUserRow[]>([]);
  const [tEmail, setTEmail] = useState(''); const [tRole, setTRole] = useState<StaffRole | ''>('viewer'); const [tVeh, setTVeh] = useState('');

  useEffect(() => subscribeStaff(setS), []);
  const run = async (fn: () => Promise<unknown>, ok?: string) => {
    setBusy(true);
    try { await fn(); if (ok) toast.success(ok); } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  };
  const loadUsers = () => run(async () => setUsers((await listStaff()).users));
  useEffect(() => { if (s?.role === 'admin') void loadUsers(); /* eslint-disable-next-line */ }, [s?.role]);

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      <div>
        <h2 className="text-sm font-bold tracking-tight flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-primary" />STAFF ACCESS</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Roles are assigned only by an admin on the server. FireBuddy is not ready for real-world dispatch.</p>
      </div>

      {!s ? <p className="text-xs text-muted-foreground">Loading…</p> : !s.isStaff ? (
        <section className="rounded-lg border border-border bg-card p-4 space-y-3 max-w-md">
          <h3 className="text-xs font-semibold">Staff sign-in</h3>
          <Input type="email" placeholder="Work email" value={email} maxLength={254} onChange={(e) => setEmail(e.target.value)} />
          <Input type="password" placeholder="Password (min 8)" value={pw} onChange={(e) => setPw(e.target.value)} />
          <div className="flex gap-2">
            <Button size="sm" disabled={busy || !email || pw.length < 8} onClick={() => run(() => staffSignIn(email, pw))}>Sign in</Button>
            <Button size="sm" variant="outline" disabled={busy || !email || pw.length < 8}
              onClick={() => run(() => staffSignUp(email, pw), 'Account created — check your email to verify it.')}>Create account</Button>
          </div>
          <p className="text-[11px] text-muted-foreground">New accounts have no role until an admin grants one.</p>
        </section>
      ) : (
        <section className="rounded-lg border border-border bg-card p-4 space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span>{s.user?.email}</span>
            <span className="rounded bg-secondary px-2 py-0.5 font-mono uppercase text-[10px]">{s.role ?? 'no role'}</span>
            {s.vehicleId && <span className="font-mono text-[10px]">vehicle {s.vehicleId}</span>}
            <Button size="sm" variant="ghost" className="ml-auto" onClick={() => run(async () => { await refreshClaims(); }, 'Role refreshed.')}><RefreshCw className="w-3 h-3 mr-1" />Refresh role</Button>
            <Button size="sm" variant="outline" onClick={() => run(staffSignOut)}><LogOut className="w-3 h-3 mr-1" />Sign out</Button>
          </div>
          {!s.emailVerified && (
            <div className="flex items-center gap-2 rounded border border-destructive/40 bg-destructive/10 p-2 text-[11px] text-destructive">
              <AlertTriangle className="w-3 h-3" /> Email not verified — no role can be used until it is.
              <Button size="sm" variant="ghost" onClick={() => run(async () => { await resendVerification(); }, 'Verification email sent.')}>Resend</Button>
            </div>
          )}
          {s.emailVerified && !s.role && (
            <Button size="sm" variant="outline" disabled={busy} onClick={() => run(async () => { await bootstrapAdmin(); await refreshClaims(); }, 'You are now the first admin.')}>
              Claim first admin (designated email only)
            </Button>
          )}
        </section>
      )}

      {s?.role === 'admin' && (
        <section className="rounded-lg border border-border bg-card p-4 space-y-3">
          <h3 className="text-xs font-semibold">Role management (admin only)</h3>
          <div className="grid gap-2 sm:grid-cols-4">
            <Input placeholder="User email" value={tEmail} onChange={(e) => setTEmail(e.target.value)} />
            <select className={sel} value={tRole} onChange={(e) => setTRole(e.target.value as StaffRole | '')}>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              <option value="">remove role</option>
            </select>
            <Input placeholder="Vehicle ID (responders)" value={tVeh} disabled={tRole !== 'responder'} onChange={(e) => setTVeh(e.target.value)} />
            <Button size="sm" disabled={busy || !tEmail}
              onClick={() => run(async () => { await setStaffRole(tEmail, tRole || null, tVeh); await loadUsers(); }, 'Role updated.')}>Apply</Button>
          </div>
          <ul className="divide-y divide-border text-xs">
            {users.length === 0 ? <li className="py-2 text-muted-foreground">No staff accounts loaded.</li> : users.map((u) => (
              <li key={u.uid} className="py-2 flex flex-wrap gap-2">
                <span>{u.email}</span>{!u.emailVerified && <span className="text-destructive">unverified</span>}
                <span className="ml-auto font-mono uppercase text-[10px]">{u.role ?? 'none'}{u.vehicleId && ` · ${u.vehicleId}`}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
