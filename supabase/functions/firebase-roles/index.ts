// Trusted role assignment for FireBuddy staff (Firebase custom claims).
// Requires secrets:
//   FIREBASE_SERVICE_ACCOUNT  — full service-account JSON for project fire-buddy-f33c5
//   FIREBASE_BOOTSTRAP_ADMIN_EMAIL — the one email allowed to claim the first admin role
// Every request carries the caller's Firebase ID token, verified with the Admin SDK.
// Only admins can list users or change roles. Clients never set their own role.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';
import { cert, getApps, initializeApp } from 'npm:firebase-admin@12/app';
import { getAuth } from 'npm:firebase-admin@12/auth';
import { getFirestore, FieldValue } from 'npm:firebase-admin@12/firestore';

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const ROLES = ['viewer', 'responder', 'dispatcher', 'admin'] as const;
const Body = z.discriminatedUnion('action', [
  z.object({ action: z.literal('list'), idToken: z.string().min(20) }),
  z.object({ action: z.literal('bootstrap'), idToken: z.string().min(20) }),
  z.object({
    action: z.literal('setRole'), idToken: z.string().min(20),
    email: z.string().email().max(254), role: z.enum(ROLES).nullable(),
    vehicleId: z.string().max(80).regex(/^[A-Za-z0-9_-]+$/).nullable().optional(),
  }),
]);

function admin() {
  if (getApps().length) return getApps()[0];
  const raw = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');
  if (!raw) return null;
  return initializeApp({ credential: cert(JSON.parse(raw)) });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const app = admin();
  if (!app) return json({ error: 'Role service not configured (FIREBASE_SERVICE_ACCOUNT missing).' }, 503);

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: 'Invalid request' }, 400);
  const body = parsed.data;
  const auth = getAuth(app);

  let caller;
  try { caller = await auth.verifyIdToken(body.idToken, true); } catch { return json({ error: 'Invalid or expired sign-in' }, 401); }
  if (caller.firebase?.sign_in_provider === 'anonymous' || !caller.email_verified) {
    return json({ error: 'A verified staff email account is required.' }, 403);
  }

  const audit = (action: string, detail: string, metadata: Record<string, unknown> = {}) =>
    getFirestore(app).collection('auditLogs').add({
      action, actor: caller.uid, 'entity type': 'user', 'entity id': metadata.targetUid ?? caller.uid,
      detail, metadata, 'created at': FieldValue.serverTimestamp(),
    }).catch((e) => console.error('audit write failed', e));

  if (body.action === 'bootstrap') {
    const allowed = (Deno.env.get('FIREBASE_BOOTSTRAP_ADMIN_EMAIL') ?? '').trim().toLowerCase();
    if (!allowed || caller.email?.toLowerCase() !== allowed) return json({ error: 'Not the designated first admin.' }, 403);
    // Only allowed while no admin exists yet.
    let page = await auth.listUsers(1000);
    for (;;) {
      if (page.users.some((u) => u.customClaims?.role === 'admin')) return json({ error: 'An admin already exists.' }, 409);
      if (!page.pageToken) break;
      page = await auth.listUsers(1000, page.pageToken);
    }
    await auth.setCustomUserClaims(caller.uid, { role: 'admin' });
    await audit('role.bootstrap_admin', `First admin claimed by ${caller.email}`, { targetUid: caller.uid });
    return json({ ok: true });
  }

  if (caller.role !== 'admin') return json({ error: 'Admin role required.' }, 403);

  if (body.action === 'list') {
    const { users } = await auth.listUsers(1000);
    return json({
      users: users.filter((u) => u.email).map((u) => ({
        uid: u.uid, email: u.email ?? null, emailVerified: u.emailVerified, disabled: u.disabled,
        role: (u.customClaims?.role as string) ?? null, vehicleId: (u.customClaims?.vehicleId as string) ?? null,
      })),
    });
  }

  // setRole
  let target;
  try { target = await auth.getUserByEmail(body.email); } catch { return json({ error: 'No account with that email.' }, 404); }
  if (target.uid === caller.uid && body.role !== 'admin') return json({ error: 'Admins cannot remove their own admin role.' }, 400);
  const claims: Record<string, unknown> = {};
  if (body.role) claims.role = body.role;
  if (body.role === 'responder' && body.vehicleId) claims.vehicleId = body.vehicleId;
  await auth.setCustomUserClaims(target.uid, Object.keys(claims).length ? claims : null);
  await auth.revokeRefreshTokens(target.uid); // forces fresh token with new role
  await audit('role.set', `${target.email} → ${body.role ?? 'none'}`, { targetUid: target.uid, role: body.role, vehicleId: claims.vehicleId ?? null });
  return json({ ok: true });
});
