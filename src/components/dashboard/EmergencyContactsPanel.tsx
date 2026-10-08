import { useEffect, useState } from 'react';
import { Contact, Pencil, Plus, Trash2, Users, AlertTriangle, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  EmergencyContact, addContact, ensureUser, isContactPickerSupported, pickContacts,
  removeContact, subscribeContacts, updateContact, validateContact,
} from '@/integrations/firebase/contacts';
import { useI18n } from '@/i18n/I18nProvider';

export function EmergencyContactsPanel() {
  const { t } = useI18n();
  const [uid, setUid] = useState<string | null>(null);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [consent, setConsent] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', relation: '' });
  const [editId, setEditId] = useState<string | null>(null);
  const [edit, setEdit] = useState({ name: '', phone: '', relation: '' });
  const [pickerNote, setPickerNote] = useState<string | null>(null);
  const supported = isContactPickerSupported();

  useEffect(() => {
    let unsub: (() => void) | undefined;
    ensureUser()
      .then((u) => {
        setUid(u.uid);
        unsub = subscribeContacts(u.uid, (c) => { setContacts(c); setLoading(false); },
          (e) => { setError(`Could not load contacts: ${e.message}`); setLoading(false); });
      })
      .catch((e) => { setError(`Sign-in unavailable (enable Anonymous auth in Firebase): ${e.message}`); setLoading(false); });
    return () => unsub?.();
  }, []);

  const save = async (name: string, phone: string, relation: string, source: 'picker' | 'manual') => {
    if (!uid) return false;
    const err = validateContact(name, phone);
    if (err) { toast.error(`${name || phone}: ${err}`); return false; }
    try { await addContact(uid, { name, phone, relation, source }); return true; }
    catch (e) { toast.error(`Save failed: ${(e as Error).message}`); return false; }
  };

  const onPick = async () => {
    setPickerNote(null);
    try {
      const picked = await pickContacts();
      if (!picked.length) { setPickerNote(t('contacts.none.selected')); return; }
      let ok = 0;
      for (const p of picked) if (await save(p.name, p.phone, '', 'picker')) ok++;
      if (ok) toast.success(t('contacts.saved', { n: ok }));
    } catch (e) {
      setPickerNote(`${t('contacts.denied')} (${(e as Error).message})`);
    }
  };

  const onManual = async () => {
    if (await save(form.name, form.phone, form.relation, 'manual')) {
      setForm({ name: '', phone: '', relation: '' });
      toast.success(t('contacts.saved', { n: 1 }));
    }
  };

  const onUpdate = async (id: string) => {
    const err = validateContact(edit.name, edit.phone);
    if (err) return toast.error(err);
    try { await updateContact(id, edit); setEditId(null); } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      <div>
        <h2 className="text-sm font-bold tracking-tight flex items-center gap-2"><Users className="w-4 h-4 text-primary" />{t('contacts.title')}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{t('contacts.subtitle')}</p>
      </div>

      {error && <div className="flex gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive"><AlertTriangle className="w-4 h-4 shrink-0" />{error}</div>}

      <section className="rounded-lg border border-border bg-card p-4 space-y-3">
        <h3 className="text-xs font-semibold flex items-center gap-2"><Contact className="w-4 h-4" />{t('contacts.import')}</h3>
        {!supported ? (
          <p className="text-xs text-muted-foreground">{t('contacts.unsupported')}</p>
        ) : (
          <>
            <label className="flex items-start gap-2 text-xs">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
              <span>{t('contacts.consent')}</span>
            </label>
            <Button size="sm" disabled={!consent || !uid} onClick={onPick}>{t('contacts.pick')}</Button>
          </>
        )}
        {pickerNote && <p className="text-xs text-warning">{pickerNote}</p>}
      </section>

      <section className="rounded-lg border border-border bg-card p-4 space-y-3">
        <h3 className="text-xs font-semibold flex items-center gap-2"><Plus className="w-4 h-4" />{t('contacts.manual')}</h3>
        <div className="grid gap-2 sm:grid-cols-3">
          <Input placeholder={t('contacts.name')} value={form.name} maxLength={80} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input placeholder={t('contacts.phone')} value={form.phone} inputMode="tel" maxLength={20} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input placeholder={t('contacts.relation')} value={form.relation} maxLength={40} onChange={(e) => setForm({ ...form, relation: e.target.value })} />
        </div>
        <Button size="sm" disabled={!uid} onClick={onManual}>{t('contacts.add')}</Button>
      </section>

      <section className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-xs font-semibold mb-3">{t('contacts.saved.list')} ({contacts.length})</h3>
        {loading ? <p className="text-xs text-muted-foreground">…</p> : contacts.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t('contacts.empty')}</p>
        ) : (
          <ul className="divide-y divide-border">
            {contacts.map((c) => (
              <li key={c.id} className="py-2 flex items-center gap-2">
                {editId === c.id ? (
                  <>
                    <Input className="h-8" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
                    <Input className="h-8" value={edit.phone} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} />
                    <Input className="h-8" value={edit.relation} onChange={(e) => setEdit({ ...edit, relation: e.target.value })} />
                    <Button size="icon" variant="ghost" onClick={() => onUpdate(c.id)}><Check className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setEditId(null)}><X className="w-4 h-4" /></Button>
                  </>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{c.name}{c.relation && <span className="text-xs text-muted-foreground ml-2">{c.relation}</span>}</p>
                      <p className="text-xs font-mono text-muted-foreground" translate="no">{c.phone}</p>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => { setEditId(c.id); setEdit({ name: c.name, phone: c.phone, relation: c.relation ?? '' }); }}><Pencil className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => removeContact(c.id).catch((e) => toast.error(e.message))}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
