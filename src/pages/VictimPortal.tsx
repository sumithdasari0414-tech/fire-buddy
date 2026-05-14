import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Flame, MapPin, Truck, Stethoscope, Shield as ShieldIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { LanguageSelector } from '@/components/LanguageSelector';
import { SosButton } from '@/components/SosButton';
import { useI18n } from '@/i18n/I18nProvider';
import { Button } from '@/components/ui/button';
import { CitySelector } from '@/components/dashboard/CitySelector';
import {
  CityKey, getCurrentCity, setCurrentCity, getCityConfig,
  getStations, getVehicles, calculateDistance, getEstimatedResponseTime,
} from '@/data/mockData';

export default function VictimPortal() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [city, setCity] = useState<CityKey>(getCurrentCity());
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, timeout: 6000 }
    );
  }, []);

  const origin = coords ?? getCityConfig().center;

  const nearest = useMemo(() => {
    const stations = getStations();
    const vehicles = getVehicles();
    const fire = vehicles
      .filter(v => v.type === 'fire_engine')
      .map(v => ({ v, d: calculateDistance(origin.lat, origin.lng, v.location.lat, v.location.lng) }))
      .sort((a, b) => a.d - b.d)[0];
    const amb = vehicles
      .filter(v => v.type === 'ambulance')
      .map(v => ({ v, d: calculateDistance(origin.lat, origin.lng, v.location.lat, v.location.lng) }))
      .sort((a, b) => a.d - b.d)[0];
    const pol = vehicles
      .filter(v => v.type === 'police')
      .map(v => ({ v, d: calculateDistance(origin.lat, origin.lng, v.location.lat, v.location.lng) }))
      .sort((a, b) => a.d - b.d)[0];
    const station = stations
      .map(s => ({ s, d: calculateDistance(origin.lat, origin.lng, s.location.lat, s.location.lng) }))
      .sort((a, b) => a.d - b.d)[0];
    return { fire, amb, pol, station };
  }, [origin.lat, origin.lng, city]);

  const handleCityChange = (c: CityKey) => { setCurrentCity(c); setCity(c); };

  const cards = [
    { icon: Truck, label: t('victim.fire'), data: nearest.fire, color: 'text-red-500 bg-red-500/10' },
    { icon: Stethoscope, label: t('victim.ambulance'), data: nearest.amb, color: 'text-emerald-500 bg-emerald-500/10' },
    { icon: ShieldIcon, label: t('victim.police'), data: nearest.pol, color: 'text-blue-500 bg-blue-500/10' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between p-4 border-b border-border">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4 mr-1" />{t('common.back')}
        </Button>
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-red-500" />
          <span className="text-sm font-bold">{t('app.title')}</span>
        </div>
        <div className="flex items-center gap-2">
          <CitySelector currentCity={city} onCityChange={handleCityChange} />
          <LanguageSelector compact />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-start p-6 gap-8 max-w-2xl mx-auto w-full">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center mt-4">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">{t('sos.title')}</h1>
        </motion.div>

        <SosButton />

        <div className="w-full">
          <h2 className="text-sm font-bold mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-red-500" />{t('victim.nearest')}
          </h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {cards.map(({ icon: Icon, label, data, color }) => (
              <div key={label} className="border border-border rounded-xl p-4 bg-card">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-sm font-semibold">{label}</div>
                {data ? (
                  <>
                    <div className="text-xs text-muted-foreground font-mono mt-1">{data.v.callsign}</div>
                    <div className="text-xs mt-1">
                      {t('victim.eta')}: <span className="font-bold text-primary">{getEstimatedResponseTime(data.d)}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono">{data.d.toFixed(1)} km</div>
                  </>
                ) : (
                  <div className="text-xs text-muted-foreground mt-1">{t('victim.idle')}</div>
                )}
              </div>
            ))}
          </div>

          {nearest.station && (
            <div className="mt-4 border border-border rounded-xl p-4 bg-card">
              <div className="text-xs text-muted-foreground">{t('common.location')}</div>
              <div className="text-sm font-semibold">{nearest.station.s.name}</div>
              <div className="text-xs text-muted-foreground">{nearest.station.s.address}</div>
              <div className="text-xs font-mono mt-1">{nearest.station.d.toFixed(1)} km · 📞 {nearest.station.s.phone}</div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}