import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Siren, ShieldAlert, CheckCircle2, XCircle, AlertTriangle, Clock } from 'lucide-react';
import { toast } from 'sonner';

/**
 * SOS Emergency Button + Confirmation Flow
 * -----------------------------------------
 * Frontend-only implementation (React state). No backend/Supabase yet.
 *
 * FLOW:
 *  1. Press SOS button -> opens confirmation dialog with 10s countdown.
 *  2. "CONFIRM SOS" before 0  -> status CONFIRMED, simulates alert sent.
 *  3. "CANCEL"               -> resets, no alert.
 *  4. Countdown hits 0         -> FALSE ALARM, no alert.
 *
 * SAFETY:
 *  - Single timer enforced via intervalRef + guard state.
 *  - Repeated SOS clicks ignored while dialog is open.
 *  - Timer cleared on confirm, cancel, timeout, and unmount.
 *
 * BACKEND INTEGRATION POINTS (marked with // BACKEND below):
 *  - On confirm: insert into sos_alerts table / call edge function.
 *  - On confirm: push realtime notification to responder dashboards.
 *  - Optionally capture geolocation here before sending.
 */

type SosStatus = 'idle' | 'counting' | 'confirmed' | 'cancelled' | 'false_alarm';

const COUNTDOWN_FROM = 10;
const WARNING_THRESHOLD = 3; // seconds remaining that switch to warning styling

export function SosEmergencyButton() {
  const [status, setStatus] = useState<SosStatus>('idle');
  const [countdown, setCountdown] = useState(COUNTDOWN_FROM);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Single timer reference — guarantees only one interval ever runs.
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clear any active timer. Idempotent and safe to call repeatedly.
  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Reset everything back to a fresh idle state so SOS can be pressed again.
  const resetToIdle = useCallback(() => {
    clearTimer();
    setStatus('idle');
    setCountdown(COUNTDOWN_FROM);
    setDialogOpen(false);
  }, [clearTimer]);

  // Start the 10-second countdown. Called once when the dialog opens.
  const startCountdown = useCallback(() => {
    clearTimer(); // defensive: never stack timers
    setCountdown(COUNTDOWN_FROM);
    setStatus('counting');

    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Timer reached zero -> FALSE ALARM, no alert triggered.
          clearTimer();
          setStatus('false_alarm');
          setDialogOpen(false);
          toast.warning('SOS cancelled because it was not confirmed within 10 seconds.', {
            description: 'Marked as FALSE ALARM. No emergency response triggered.',
          });
          // Auto-reset shortly after so the button is usable again.
          window.setTimeout(() => {
            setStatus('idle');
            setCountdown(COUNTDOWN_FROM);
          }, 1500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearTimer]);

  // Open the confirmation dialog (guarded against repeated clicks).
  const handleSosClick = useCallback(() => {
    // Prevent multiple dialogs / timers while a flow is already active.
    if (dialogOpen || status === 'counting' || status === 'confirmed') return;
    setDialogOpen(true);
    startCountdown();
  }, [dialogOpen, status, startCountdown]);

  // CONFIRM SOS — pressed before the countdown reaches 0.
  const handleConfirm = useCallback(() => {
    clearTimer();
    setStatus('confirmed');
    setDialogOpen(false);
    toast.success('SOS Confirmed. Emergency alert activated.', {
      description: 'Simulated alert dispatched to nearest responders.',
    });

    // // BACKEND: Insert SOS alert into the database, e.g.
    // // await supabase.from('sos_alerts').insert({
    // //   emergency_type: 'fire',
    // //   status: 'active',
    // //   latitude, longitude, address, city,
    // //   created_at: new Date().toISOString(),
    // // });
    // // BACKEND: Trigger realtime broadcast to responder dashboards.
    // // BACKEND: Optionally fire an edge function for auto-call / SMS / radio.

    // Reset to idle so the user can trigger SOS again later.
    window.setTimeout(() => {
      setStatus('idle');
      setCountdown(COUNTDOWN_FROM);
    }, 2500);
  }, [clearTimer]);

  // CANCEL — explicit user cancel.
  const handleCancel = useCallback(() => {
    clearTimer();
    setStatus('cancelled');
    setDialogOpen(false);
    toast.info('SOS request cancelled.', {
      description: 'No emergency alert was triggered.',
    });
    // Reset to idle so the user can trigger SOS again.
    window.setTimeout(() => {
      setStatus('idle');
      setCountdown(COUNTDOWN_FROM);
    }, 1200);
  }, [clearTimer]);

  // Cleanup timer if the component unmounts mid-countdown.
  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  const isWarning = countdown <= WARNING_THRESHOLD && status === 'counting';

  return (
    <>
      {/* SOS trigger button — prominent, pulsing emergency styling */}
      <motion.button
        onClick={handleSosClick}
        disabled={dialogOpen || status === 'counting' || status === 'confirmed'}
        whileTap={{ scale: 0.96 }}
        className="relative flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-bold text-sm shadow-lg glow-red disabled:opacity-60 disabled:cursor-not-allowed"
        aria-label="Activate SOS emergency alert"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
        </span>
        <Siren className="w-4 h-4" />
        SOS
      </motion.button>

      {/* Confirmation dialog with 10s countdown */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          // Treat closing via overlay/escape as a cancel to avoid orphan timers.
          if (!open) handleCancel();
        }}
      >
        <DialogContent className="max-w-md border-primary/40 bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <ShieldAlert className="w-5 h-5" /> SOS Emergency Confirmation
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center text-center space-y-4 py-2">
            <p className="text-sm text-foreground">
              Are you experiencing an emergency?{' '}
              <span className="font-semibold text-primary">
                Confirm within 10 seconds to activate the SOS alert.
              </span>
            </p>

            {/* Large countdown display */}
            <div className="relative flex flex-col items-center">
              <motion.div
                key={countdown}
                initial={{ scale: 1.3, opacity: 0.6 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.25 }}
                className={`relative w-28 h-28 rounded-full flex items-center justify-center border-4 ${
                  isWarning
                    ? 'border-warning text-warning glow-amber'
                    : 'border-primary text-primary glow-red'
                }`}
              >
                <Clock className="absolute w-10 h-10 opacity-20" />
                <span className="text-5xl font-bold font-mono tabular-nums">
                  {countdown}
                </span>
              </motion.div>
              <span className={`mt-2 text-[11px] font-mono uppercase tracking-widest ${isWarning ? 'text-warning' : 'text-muted-foreground'}`}>
                {isWarning ? 'Confirm now!' : 'Seconds remaining'}
              </span>
            </div>

            {/* Warning banner when time is low */}
            <AnimatePresence>
              {isWarning && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 text-xs font-medium text-warning bg-warning/10 border border-warning/30 rounded-md px-3 py-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Hurry — alert will be cancelled as a false alarm at zero.
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row-reverse gap-2 pt-2">
            <Button
              onClick={handleConfirm}
              className="bg-success hover:bg-success/90 text-success-foreground font-bold"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" /> CONFIRM SOS
            </Button>
            <Button
              onClick={handleCancel}
              variant="outline"
              className="font-semibold"
            >
              <XCircle className="w-4 h-4 mr-1.5" /> CANCEL
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
