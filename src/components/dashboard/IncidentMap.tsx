// Real-time Google Maps view of live incidents and emergency vehicles.
// Data comes from Firestore realtime subscriptions (useIncidents/useVehicles);
// the base map is the Google Maps JavaScript API loaded with the referrer-
// restricted browser key. The routing API key is never used client-side.
import { useEffect, useMemo, useRef, useState } from 'react';
import { getCityConfig } from '@/data/mockData';
import { useIncidents } from '@/hooks/useIncidents';
import { useVehicles } from '@/hooks/useVehicles';
import type { LiveVehicle } from '@/integrations/firebase/vehicles';
import { StatusBadge } from './StatusBadge';
import { Loader2, AlertTriangle } from 'lucide-react';

declare global {
  interface Window {
    initFireBuddyMap?: () => void;
    google?: any;
  }
}

const severityColors: Record<string, string> = {
  critical: 'bg-critical',
  high: 'bg-primary',
  medium: 'bg-warning',
  low: 'bg-info',
};

const severityHex: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#3b82f6',
};

const vehicleIcons: Record<string, string> = {
  fire_engine: '🚒',
  ambulance: '🚑',
  police: '🚓',
};

let mapsLoaderPromise: Promise<void> | null = null;

/** Loads the Maps JS API once, asynchronously, resolving via the callback param. */
function loadGoogleMaps(): Promise<void> {
  if (window.google?.maps?.Map) return Promise.resolve();
  if (mapsLoaderPromise) return mapsLoaderPromise;
  mapsLoaderPromise = new Promise<void>((resolve, reject) => {
    const key = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY;
    if (!key) {
      reject(new Error('Google Maps browser key is not configured'));
      return;
    }
    window.initFireBuddyMap = () => resolve();
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&callback=initFireBuddyMap&channel=${import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID}`;
    script.async = true;
    script.onerror = () => reject(new Error('Google Maps failed to load'));
    document.head.appendChild(script);
  });
  return mapsLoaderPromise;
}

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#98a5be' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#283d6a' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#4b6878' }] },
];

export function IncidentMap({ onSelectIncident }: { onSelectIncident?: (id: string) => void }) {
  const { incidents, loading, error } = useIncidents();
  const { vehicles: allVehicles } = useVehicles();
  // Only vehicles with a real reported GPS fix are plotted.
  const vehicles = useMemo(
    () => allVehicles.filter((v): v is LiveVehicle & { location: { lat: number; lng: number } } => !!v.location),
    [allVehicles],
  );
  const cityConfig = getCityConfig();

  const mapElRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const incidentMarkersRef = useRef<Map<string, any>>(new Map());
  const vehicleMarkersRef = useRef<Map<string, any>>(new Map());
  const infoRef = useRef<any>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Initialize the map once.
  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then(() => {
        if (cancelled || !mapElRef.current || mapRef.current) return;
        mapRef.current = new window.google.maps.Map(mapElRef.current, {
          center: { lat: cityConfig.center.lat, lng: cityConfig.center.lng },
          zoom: 11,
          styles: darkMapStyle,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
        infoRef.current = new window.google.maps.InfoWindow();
        setMapReady(true);
      })
      .catch((err: unknown) => {
        if (!cancelled) setMapError(err instanceof Error ? err.message : 'Google Maps unavailable');
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync incident markers with the realtime feed.
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const g = window.google.maps;
    const seen = new Set<string>();

    incidents.forEach((inc) => {
      seen.add(inc.id);
      const position = { lat: inc.location.lat, lng: inc.location.lng };
      let marker = incidentMarkersRef.current.get(inc.id);
      if (!marker) {
        marker = new g.Marker({
          map: mapRef.current,
          position,
          title: inc.id,
          icon: {
            path: g.SymbolPath.CIRCLE,
            scale: inc.severity === 'critical' ? 10 : 8,
            fillColor: severityHex[inc.severity] ?? '#3b82f6',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 1.5,
          },
        });
        marker.addListener('click', () => {
          infoRef.current?.setContent(
            `<div style="font-family:monospace;font-size:12px;color:#111">
              <strong>${inc.id}</strong><br/>${inc.location.street}<br/>
              <span style="text-transform:uppercase">${inc.severity}</span>
            </div>`,
          );
          infoRef.current?.open({ map: mapRef.current, anchor: marker });
          onSelectIncident?.(inc.id);
        });
        incidentMarkersRef.current.set(inc.id, marker);
      } else {
        marker.setPosition(position);
      }
    });

    // Remove markers for incidents that disappeared from the feed.
    incidentMarkersRef.current.forEach((marker, id) => {
      if (!seen.has(id)) {
        marker.setMap(null);
        incidentMarkersRef.current.delete(id);
      }
    });
  }, [incidents, mapReady, onSelectIncident]);

  // Sync vehicle markers with live GPS fixes (positions update in place).
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const g = window.google.maps;
    const active = vehicles.filter((v) => v.status !== 'resolved');
    const seen = new Set<string>();

    active.forEach((v) => {
      seen.add(v.id);
      const position = { lat: v.location.lat, lng: v.location.lng };
      let marker = vehicleMarkersRef.current.get(v.id);
      if (!marker) {
        marker = new g.Marker({
          map: mapRef.current,
          position,
          title: v.callsign,
          label: { text: vehicleIcons[v.type] ?? '🚗', fontSize: '18px' },
          icon: {
            path: g.SymbolPath.CIRCLE,
            scale: 0, // invisible base pin — the emoji label is the marker
          },
        });
        marker.addListener('click', () => {
          infoRef.current?.setContent(
            `<div style="font-family:monospace;font-size:12px;color:#111">
              <strong>${v.callsign}</strong><br/>${v.type.replace('_', ' ')} · ${v.status.replace('_', ' ')}
              ${v.speedKmh !== null ? `<br/>${v.speedKmh} km/h` : ''}
            </div>`,
          );
          infoRef.current?.open({ map: mapRef.current, anchor: marker });
        });
        vehicleMarkersRef.current.set(v.id, marker);
      } else {
        marker.setPosition(position);
      }
    });

    vehicleMarkersRef.current.forEach((marker, id) => {
      if (!seen.has(id)) {
        marker.setMap(null);
        vehicleMarkersRef.current.delete(id);
      }
    });
  }, [vehicles, mapReady]);

  // Fit the viewport around all live points once the map and first data are ready.
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const points = [
      ...incidents.map((i) => ({ lat: i.location.lat, lng: i.location.lng })),
      ...vehicles.map((v) => v.location),
    ];
    if (points.length === 0) return;
    const bounds = new window.google.maps.LatLngBounds();
    points.forEach((p) => bounds.extend(p));
    mapRef.current.fitBounds(bounds, 80);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady]);

  return (
    <div className="relative w-full h-full min-h-[400px] bg-secondary rounded-lg overflow-hidden">
      {(!mapReady || loading) && !mapError && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 bg-background/60">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-xs font-mono text-muted-foreground">
            {mapError ? '' : !mapReady ? 'Loading Google Maps…' : 'Loading incidents…'}
          </p>
        </div>
      )}
      {(mapError || (!loading && error)) && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 bg-background/60 p-4 text-center">
          <AlertTriangle className="w-6 h-6 text-critical" />
          <p className="text-xs font-mono text-muted-foreground">
            {mapError ?? 'Incident data unavailable'}
          </p>
        </div>
      )}

      <div ref={mapElRef} className="absolute inset-0" />

      <div className="absolute bottom-3 right-3 z-10 bg-card/90 backdrop-blur border border-border rounded-lg p-3">
        <p className="text-[10px] font-mono text-muted-foreground mb-2 uppercase tracking-wider">Legend</p>
        <div className="space-y-1.5">
          {Object.entries(severityColors).map(([label, color]) => (
            <div key={label} className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
              <span className="text-[10px] text-muted-foreground capitalize">{label}</span>
            </div>
          ))}
          {Object.entries(vehicleIcons).map(([type, icon]) => (
            <div key={type} className="flex items-center gap-2">
              <span className="text-xs">{icon}</span>
              <span className="text-[10px] text-muted-foreground capitalize">{type.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute top-3 left-3 z-10 bg-card/90 backdrop-blur border border-border rounded-lg px-3 py-2">
        <p className="text-[10px] font-mono text-success">{cityConfig.name.toUpperCase()} SECTOR</p>
        <p className="text-[10px] font-mono text-muted-foreground">
          {cityConfig.center.lat.toFixed(1)}°N {cityConfig.center.lng.toFixed(1)}°E
        </p>
      </div>
    </div>
  );
}
