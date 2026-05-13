import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Siren, Loader2, X, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/i18n/I18nProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getCurrentCity, getCityConfig } from '@/data/mockData';

type EmType = 'fire' | 'medical' | 'police' | 'general';

const COUNTDOWN_SECONDS = 5;

export function SosButton() {
  const { t, lang } = useI18n();
  const [open, setOpen] = useState(false);
  const [seconds, setSeconds] = useState(COUNTDOWN_SECONDS);
  const [coords, setCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [type, setType] = useState<EmType>('fire');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef<number | null>(null);
  const submittedRef = useRef(false);

  const startCountdown = () => {
    setSeconds(COUNTDOWN_SECONDS);
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setSeconds(s => {
        if (s <= 1) {
          window.clearInterval(timerRef.current!);
          if (!submittedRef.current) handleAutoCancel();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const stopCountdown = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const requestLocation = () => {
    setLocating(true);
    if (!navigator.geolocation) {
      // Fallback: use city center
      const c = getCityConfig().center;
      setCoords({ lat: c.lat, lng: c.lng, accuracy: 5000 });
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
        setLocating(false);
      },
      () => {
        const c = getCityConfig().center;
        setCoords({ lat: c.lat, lng: c.lng, accuracy: 5000 });
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  const handleOpen = () => {
    submittedRef.current = false;
    setOpen(true);
    requestLocation();
    startCountdown();
  };

  const handleClose = () => {
    stopCountdown();
    setOpen(false);
  };

  const handleAutoCancel = async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    // Log false alarm to backend
    try {
      await supabase.from('sos_alerts').insert({
        caller_name: name || null,
        caller_phone: phone || null,
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
        accuracy: coords?.accuracy ?? null,
        city: getCurrentCity(),
        emergency_type: type,
        status: 'false_alarm',
        language: lang,
        notes: 'Auto-cancelled: no confirmation in 5 seconds',
      });
    } catch (e) { /* swallow */ }
    toast.info(t('sos.cancelled'));
    setOpen(false);
  };

  const handleConfirm = async () => {
    submittedRef.current = true;
    stopCountdown();
    setSubmitting(true);
    const city = getCityConfig();
    const { error } = await supabase.from('sos_alerts').insert({
      caller_name: name || null,
      caller_phone: phone || null,
      latitude: coords?.lat ?? city.center.lat,
      longitude: coords?.lng ?? city.center.lng,
      accuracy: coords?.accuracy ?? null,
      address: `${city.name}, ${city.state}`,
      city: getCurrentCity(),
      emergency_type: type,
      status: 'active',
      language: lang,
    });
    setSubmitting(false);
    if (error) {
      toast.error('Failed to send SOS: ' + error.message);
      return;
    }
    toast.success(t('sos.sent'));
    setOpen(false);
  };

  useEffect(() => () => stopCountdown(), []);

  const types: { key: EmType; label: string; emoji: string }[] = [
    { key: 'fire', label: t('sos.type.fire'), emoji: '🔥' },
    { key: 'medical', label: t('sos.type.medical'), emoji: '🚑' },
    { key: 'police', label: t('sos.type.police'), emoji: '🚓' },
    { key: 'general', label: t('sos.type.general'), emoji: '🆘' },
  ];

  return (
    <>
      <div className="flex flex-col items-center gap-4">
        <p className="text-sm text-muted-foreground text-center max-w-xs">{t('sos.subtitle')}</p>
        <motion.button
          onClick={handleOpen}
          whileTap={{ scale: 0.92 }}
          className="relative w-56 h-56 rounded-full bg-gradient-to-br from-red-500 via-red-600 to-red-800 text-white font-black text-5xl tracking-widest shadow-2xl border-8 border-red-900/40 focus:outline-none focus-visible:ring-4 focus-visible:ring-red-300"
          style={{ boxShadow: '0 0 60px hsl(0 90% 50% / 0.5), inset 0 0 40px hsl(0 80% 30% / 0.5)' }}
        >
          <span className="absolute inset-0 rounded-full animate-ping bg-red-500/30" />
          <span className="relative flex flex-col items-center justify-center gap-2">
            <Siren className="w-12 h-12" />
            {t('sos.button')}
          </span>
        </motion.button>
      </div>

      <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Siren className="w-5 h-5" /> {t('sos.confirm.title')}
            </DialogTitle>
            <DialogDescription>{t('sos.confirm.body')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-2">
              {types.map(ty => (
                <button
                  key={ty.key}
                  onClick={() => setType(ty.key)}
                  className={`p-2 rounded-lg border text-xs flex flex-col items-center gap-1 transition ${type === ty.key ? 'border-red-500 bg-red-500/10 text-red-600 font-semibold' : 'border-border hover:bg-muted'}`}
                >
                  <span className="text-xl">{ty.emoji}</span>
                  {ty.label}
                </button>
              ))}
            </div>

            <Input placeholder={t('sos.your.name')} value={name} onChange={e => setName(e.target.value)} />
            <Input placeholder={t('sos.your.phone')} value={phone} onChange={e => setPhone(e.target.value)} />

            <div className="rounded-lg border p-3 text-xs font-mono bg-muted/30">
              {locating ? (
                <span className="flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" />{t('sos.locating')}</span>
              ) : coords ? (
                <span>📍 {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)} (±{Math.round(coords.accuracy)}m)</span>
              ) : null}
            </div>

            <AnimatePresence>
              <motion.div
                key={seconds}
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center text-xs text-muted-foreground"
              >
                {t('sos.confirm.timer', { sec: seconds })}
              </motion.div>
            </AnimatePresence>

            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <motion.div
                key={`bar-${open}`}
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: COUNTDOWN_SECONDS, ease: 'linear' }}
                className="h-full bg-red-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={handleClose} disabled={submitting}>
                <X className="w-4 h-4 mr-1" />{t('sos.confirm.no')}
              </Button>
              <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={handleConfirm} disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
                {t('sos.confirm.yes')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}