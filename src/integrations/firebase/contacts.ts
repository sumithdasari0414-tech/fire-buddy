// Emergency contacts — only contacts the user explicitly selects or types are stored.
// Minimal fields: name + one phone (+ optional relation). Scoped to the signed-in
// Firebase user (anonymous auth) so security rules can restrict access to the owner.
import { getAuth, onAuthStateChanged, signInAnonymously, type User } from 'firebase/auth';
import {
  addDoc, collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, updateDoc, where,
} from 'firebase/firestore';
import { db, firebaseApp } from './client';

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relation?: string;
  source: 'picker' | 'manual';
}

export const auth = getAuth(firebaseApp);

export function ensureUser(): Promise<User> {
  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      unsub();
      if (u) return resolve(u);
      try { resolve((await signInAnonymously(auth)).user); } catch (e) { reject(e); }
    });
  });
}

const col = collection(db, 'emergencyContacts');

export const cleanPhone = (p: string) => p.replace(/[^\d+]/g, '').slice(0, 20);

export function validateContact(name: string, phone: string): string | null {
  if (!name.trim() || name.trim().length > 80) return 'Name is required (max 80 characters).';
  if (!/^\+?\d{6,15}$/.test(cleanPhone(phone))) return 'Enter a valid phone number (6–15 digits).';
  return null;
}

export function subscribeContacts(uid: string, cb: (c: EmergencyContact[]) => void, onErr: (e: Error) => void) {
  return onSnapshot(query(col, where('ownerUid', '==', uid)), (snap) => {
    cb(snap.docs.map((d) => {
      const x = d.data();
      return { id: d.id, name: x.name, phone: x.phone, relation: x.relation || undefined, source: x.source };
    }));
  }, onErr);
}

export async function addContact(uid: string, c: Omit<EmergencyContact, 'id'>) {
  await addDoc(col, {
    ownerUid: uid, name: c.name.trim().slice(0, 80), phone: cleanPhone(c.phone),
    relation: (c.relation || '').trim().slice(0, 40), source: c.source,
    createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  });
}

export async function updateContact(id: string, c: Pick<EmergencyContact, 'name' | 'phone' | 'relation'>) {
  await updateDoc(doc(db, 'emergencyContacts', id), {
    name: c.name.trim().slice(0, 80), phone: cleanPhone(c.phone),
    relation: (c.relation || '').trim().slice(0, 40), updatedAt: serverTimestamp(),
  });
}

export const removeContact = (id: string) => deleteDoc(doc(db, 'emergencyContacts', id));

// ---- Contact Picker API (Chrome on Android only; user-initiated, per-selection) ----
type PickerContact = { name?: string[]; tel?: string[] };
type ContactsManager = { select: (props: string[], opts: { multiple: boolean }) => Promise<PickerContact[]> };

export const isContactPickerSupported = () =>
  typeof navigator !== 'undefined' && 'contacts' in navigator && 'ContactsManager' in window;

export async function pickContacts(): Promise<{ name: string; phone: string }[]> {
  const mgr = (navigator as unknown as { contacts: ContactsManager }).contacts;
  const picked = await mgr.select(['name', 'tel'], { multiple: true });
  return picked
    .map((p) => ({ name: p.name?.[0] ?? '', phone: p.tel?.[0] ?? '' }))
    .filter((p) => p.name || p.phone);
}
