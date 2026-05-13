import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/i18n/I18nProvider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Siren, MapPin, Phone, User, Loader2, CheckCircle2, Truck, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface SosAlert {
  id: string;
  caller_name: string | null;
  caller_phone: string | null;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  address: string | null;
  city: string | null;
  emergency_type: string;
  status: string;
  language: string | null;
  notes: string | null;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-red-500/20 text-red-500 border-red-500/40',
  acknowledged: 'bg-amber-500/20 text-amber-500 border-amber-500/40',
  dispatched: 'bg-blue-500/20 text-blue-500 border-blue-500/40',
  resolved: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/40',
  false_alarm: 'bg-muted text-muted-foreground border-border',
};

const TYPE_EMOJI: Record<string, string> = {
  fire: '🔥', medical: '🚑', police: '🚓', general: '🆘',
};

export function SosAlertsPanel() {
  const { t } = useI18n();
  const [alerts, setAlerts] = useState<SosAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const { data } = await supabase
        .from('sos_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (mounted && data) setAlerts(data as SosAlert[]);
      setLoading(false);
    };
    load();

    const channel = supabase
      .channel('sos_alerts_stream')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sos_alerts' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const row = payload.new as SosAlert;
          setAlerts(prev => [row, ...prev]);
          if (row.status === 'active') {
            toast.error(`🚨 New SOS — ${row.emergency_type.toUpperCase()}`, {
              description: row.address || `${row.latitude?.toFixed(4)}, ${row.longitude?.toFixed(4)}`,
            });
            try { new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=').play(); } catch {}
          }
        } else if (payload.eventType === 'UPDATE') {
          const row = payload.new as SosAlert;
          setAlerts(prev => prev.map(a => a.id === row.id ? row : a));
        }
      })
      .subscribe();

    return () => { mounted = false; supabase.removeChannel(channel); };
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('sos_alerts').update({ status }).eq('id', id);
    if (error) toast.error(error.message);
  };

  const active = alerts.filter(a => ['active', 'acknowledged', 'dispatched'].includes(a.status));

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold tracking-tight flex items-center gap-2">
            <Siren className="w-4 h-4 text-red-500" /> {t('responder.incoming')}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono">
            Realtime SOS feed · {active.length} active
          </p>
        </div>
        <Badge variant="outline" className="font-mono">
          <span className="relative flex h-2 w-2 mr-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          LIVE
        </Badge>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>}
        {!loading && alerts.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-12">{t('responder.no.alerts')}</div>
        )}
        <AnimatePresence>
          {alerts.map(a => (
            <motion.div
              key={a.id}
              layout
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="border border-border rounded-lg p-4 bg-card"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-2xl">
                    {TYPE_EMOJI[a.emergency_type] || '🆘'}
                  </div>
                  <div>
                    <div className="text-sm font-bold capitalize">{a.emergency_type} emergency</div>
                    <div className="text-xs text-muted-foreground font-mono">{new Date(a.created_at).toLocaleString()}</div>
                  </div>
                </div>
                <Badge className={STATUS_COLORS[a.status] || ''} variant="outline">
                  {a.status.replace('_', ' ')}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                <div className="flex items-center gap-1.5"><User className="w-3 h-3 text-muted-foreground" />{a.caller_name || 'Anonymous'}</div>
                <div className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-muted-foreground" />{a.caller_phone || '—'}</div>
                <div className="flex items-center gap-1.5 col-span-2 font-mono">
                  <MapPin className="w-3 h-3 text-red-500" />
                  {a.latitude && a.longitude ? (
                    <a
                      href={`https://www.google.com/maps?q=${a.latitude},${a.longitude}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {a.latitude.toFixed(5)}, {a.longitude.toFixed(5)}
                      {a.accuracy && <span className="text-muted-foreground"> (±{Math.round(a.accuracy)}m)</span>}
                    </a>
                  ) : 'No location'}
                </div>
                {a.address && <div className="col-span-2 text-muted-foreground">{a.address}</div>}
                {a.notes && (
                  <div className="col-span-2 text-amber-500 flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3" />{a.notes}
                  </div>
                )}
              </div>

              {a.status !== 'resolved' && a.status !== 'false_alarm' && (
                <div className="flex gap-2 mt-3">
                  {a.status === 'active' && (
                    <Button size="sm" variant="outline" onClick={() => updateStatus(a.id, 'acknowledged')}>
                      <CheckCircle2 className="w-3 h-3 mr-1" />{t('responder.acknowledge')}
                    </Button>
                  )}
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => updateStatus(a.id, 'dispatched')}>
                    <Truck className="w-3 h-3 mr-1" />{t('responder.dispatch')}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => updateStatus(a.id, 'resolved')}>
                    {t('responder.resolve')}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => updateStatus(a.id, 'false_alarm')}>
                    {t('responder.markFalse')}
                  </Button>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}