// Staff authentication (email/password) and trusted role reading.
// Roles live ONLY in Firebase Auth custom claims, set by the server-side
// `firebase-roles` function using the Admin SDK. The client can read its role
// from the ID token but can never assign one.
import {
  createUserWithEmailAndPassword, onIdTokenChanged, sendEmailVerification,
  signInWithEmailAndPassword, signOut, type User,
} from 'firebase/auth';
import { auth } from './contacts';
import { supabase } from '@/integrations/supabase/client';

export type StaffRole = 'viewer' | 'responder' | 'dispatcher' | 'admin';
export const ROLES: StaffRole[] = ['viewer', 'responder', 'dispatcher', 'admin'];

export interface StaffState {
  user: User | null;
  isStaff: boolean; // signed in with email (not anonymous)
  emailVerified: boolean;
  role: StaffRole | null;
  vehicleId: string | null;
}

export function subscribeStaff(cb: (s: StaffState) => void) {
  return onIdTokenChanged(auth, async (user) => {
    if (!user || user.isAnonymous) {
      return cb({ user, isStaff: false, emailVerified: false, role: null, vehicleId: null });
    }
    const tok = await user.getIdTokenResult();
    const role = ROLES.includes(tok.claims.role as StaffRole) ? (tok.claims.role as StaffRole) : null;
    cb({
      user, isStaff: true, emailVerified: user.emailVerified, role,
      vehicleId: typeof tok.claims.vehicleId === 'string' ? tok.claims.vehicleId : null,
    });
  });
}

export const staffSignIn = (email: string, pw: string) => signInWithEmailAndPassword(auth, email.trim(), pw);
export async function staffSignUp(email: string, pw: string) {
  const c = await createUserWithEmailAndPassword(auth, email.trim(), pw);
  await sendEmailVerification(c.user);
  return c;
}
export const staffSignOut = () => signOut(auth);
export const resendVerification = () => auth.currentUser && sendEmailVerification(auth.currentUser);
export const refreshClaims = () => auth.currentUser?.getIdToken(true);

async function callRoles(body: Record<string, unknown>) {
  const u = auth.currentUser;
  if (!u || u.isAnonymous) throw new Error('Sign in with a staff account first.');
  const idToken = await u.getIdToken(true);
  const { data, error } = await supabase.functions.invoke('firebase-roles', { body: { ...body, idToken } });
  if (error) {
    let msg = error.message;
    try { msg = (await (error as { context?: Response }).context?.json())?.error ?? msg; } catch { /* keep */ }
    throw new Error(msg);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

export interface StaffUserRow { uid: string; email: string | null; emailVerified: boolean; role: StaffRole | null; vehicleId: string | null; disabled: boolean }

export const listStaff = (): Promise<{ users: StaffUserRow[] }> => callRoles({ action: 'list' });
export const setStaffRole = (email: string, role: StaffRole | null, vehicleId?: string | null) =>
  callRoles({ action: 'setRole', email: email.trim(), role, vehicleId: vehicleId || null });
export const bootstrapAdmin = () => callRoles({ action: 'bootstrap' });
