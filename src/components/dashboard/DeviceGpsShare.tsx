// Shares this device's real GPS fixes with a vehicle record in Firestore.
// Uses the browser Geolocation API only — no simulated movement. Positions are
// written to the `vehicles` collection, which drives live tracking and automatic
// route/ETA recalculation everywhere in the dashboard.
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { LocateFixed, LocateOff } from 'lucide-react';
import { reportVehicleLocation } from '@/integrations/firebase/vehicles';

export function DeviceGpsShare({ vehicleId, callsign }: { vehicleId: string; callsign: string }) {
  const [sharing, setSharing] = useState(false);
  const watchRef = useRef<number | null>(null);

  const stop = () => {
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
    setSharing(false);
  };

  useEffect(() => stop, []);

  const start = () => {
    if (!('geolocation' in navigator)) {
      toast.error('This device does not support location sharing');
      return;
    }
    if (watchRef.current !== null) return;
    setSharing(true);
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const speed = pos.coords.speed;
        void reportVehicleLocation(vehicleId, {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          speedKmh: typeof speed === 'number' && Number.isFinite(speed) ? Math.round(speed * 3.6) : null,
        }).catch((err: unknown) => {
          toast.error(err instanceof Error ? err.message : 'Could not save GPS fix');
          stop();
        });
      },
      (err) => {
        toast.error(err.message || 'Location permission denied');
        stop();
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    );
  };

  return (
    <button
      onClick={() => (sharing ? stop() : start())}
      className={`mt-2 flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] font-mono transition-colors ${
        sharing
          ? 'border-success/50 bg-success/10 text-success'
          : 'border-border bg-secondary text-muted-foreground hover:text-foreground'
      }`}
      title={`Report this device's GPS as ${callsign}`}
    >
      {sharing ? <LocateFixed className="w-3 h-3" /> : <LocateOff className="w-3 h-3" />}
      {sharing ? 'Sharing this device GPS' : 'Share this device GPS'}
    </button>
  );
}
