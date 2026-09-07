// Real-time Google Maps view of the live Firestore data:
// FIRMS incidents, verified fire stations and emergency vehicles with real GPS fixes.
// Routes drawn here are real driving routes returned by the secure backend routing
// function — nothing is estimated or simulated in the browser.
import { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '@/lib/googleMaps';
import { getCityConfig } from '@/data/mockData';
import { useIncidents } from '@/hooks/useIncidents';
import { useVehicles } from '@/hooks/useVehicles';
import { useStations } from '@/hooks/useStations';
import { computeRoute } from '@/hooks/useRoute';
import { Loader2, AlertTriangle } from 'lucide-react';

const vehicleIcons: Record<string, string> = {
  fire_engine: '🚒',
  ambulance: '🚑',
  police: '🚓',
  other: '🚐',
};

function cssVar(name: string, fallback: string) {
  if (typeof window === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v ? `hsl(${v})` : fallback;
}

const darkStyle: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#0e0e11' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0e0e11' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8a8a94' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#22222a' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#33333d' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#6e6e78' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0a1520' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#3a3a44' }] },
];

export function LiveGoogleMap({ onSelectIncident }: { onSelectIncident?: (id: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const linesRef = useRef<google.maps.Polyline[]>([]);
  const infoRef = useRef<google.maps.InfoWindow | null>(null);
  const [ready, setReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const { incidents, loading, error } = useIncidents();
  const { vehicles } = useVehicles();
  const { stations } = useStations();
  const city = getCityConfig();

  // Initialise the map once.
  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !containerRef.current) return;
        mapRef.current = new maps.Map(containerRef.current, {
          center: { lat: city.center.lat, lng: city.center.lng },
          zoom: 11,
          styles: darkStyle,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: 'greedy',
          clickableIcons: false,
        });
        infoRef.current = new maps.InfoWindow();
        setReady(true);
      })
      .catch((err: unknown) => {
        if (!cancelled) setMapError(err instanceof Error ? err.message : 'Map unavailable');
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-centre when the operator switches city.
  useEffect(() => {
    if (ready && mapRef.current) mapRef.current.setCenter({ lat: city.center.lat, lng: city.center.lng });
  }, [ready, city.center.lat, city.center.lng]);

  // Draw markers for every real record, refreshing whenever the live data changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    const maps = window.google.maps;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const severityColor: Record<string, string> = {
      critical: cssVar('--critical', '#ef4444'),
      high: cssVar('--primary', '#f97316'),
      medium: cssVar('--warning', '#eab308'),
      low: cssVar('--info', '#3b82f6'),
    };

    const bounds = new maps.LatLngBounds();
    let hasPoint = false;

    const open = (marker: google.maps.Marker, html: string) => {
      infoRef.current?.setContent(`<div style="font-family:ui-monospace,monospace;font-size:12px;color:#111">${html}</div>`);
      infoRef.current?.open({ anchor: marker, map });
    };

    stations.forEach((s) => {
      const marker = new maps.Marker({
        position: s.location,
        map,
        title: s.name,
        icon: {
          path: maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          scale: 5,
          fillColor: cssVar('--success', '#22c55e'),
          fillOpacity: 0.9,
          strokeColor: '#000',
          strokeWeight: 1,
        },
      });
      marker.addListener('click', () =>
        open(marker, `<b>${s.name}</b><br/>${s.address}<br/>Status: ${s.status}`),
      );
      markersRef.current.push(marker);
      bounds.extend(s.location);
      hasPoint = true;
    });

    incidents.forEach((inc) => {
      const marker = new maps.Marker({
        position: { lat: inc.location.lat, lng: inc.location.lng },
        map,
        title: inc.id,
        zIndex: 50,
        icon: {
          path: maps.SymbolPath.CIRCLE,
          scale: inc.severity === 'critical' ? 11 : 8,
          fillColor: severityColor[inc.severity] ?? severityColor.medium,
          fillOpacity: 0.85,
          strokeColor: '#fff',
          strokeWeight: 1.5,
        },
      });
      marker.addListener('click', () => {
        open(
          marker,
          `<b>${inc.id}</b><br/>${inc.location.street}<br/>Severity: ${inc.severity}<br/>Status: ${inc.status.replace('_', ' ')}`,
        );
        onSelectIncident?.(inc.id);
      });
      markersRef.current.push(marker);
      bounds.extend({ lat: inc.location.lat, lng: inc.location.lng });
      hasPoint = true;
    });

    vehicles.forEach((v) => {
      if (!v.location) return; // only real reported GPS fixes are plotted
      const marker = new maps.Marker({
        position: v.location,
        map,
        title: v.callsign,
        zIndex: 60,
        label: { text: vehicleIcons[v.type] ?? '🚐', fontSize: '18px' },
        icon: { path: maps.SymbolPath.CIRCLE, scale: 0, fillOpacity: 0, strokeOpacity: 0 },
      });
      marker.addListener('click', () =>
        open(
          marker,
          `<b>${v.callsign}</b><br/>${v.status.replace('_', ' ')}${
            v.speedKmh !== null ? `<br/>${v.speedKmh} km/h` : ''
          }${v.updatedAt ? `<br/>Last fix: ${v.updatedAt.toLocaleTimeString()}` : ''}`,
        ),
      );
      markersRef.current.push(marker);
      bounds.extend(v.location);
      hasPoint = true;
    });

    if (hasPoint && !bounds.isEmpty()) {
      map.fitBounds(bounds, 60);
      if ((map.getZoom() ?? 11) > 15) map.setZoom(15);
    }
  }, [ready, incidents, vehicles, stations, onSelectIncident]);

  // Real driving routes for vehicles that have a GPS fix and an assigned incident.
  const routeKey = vehicles
    .filter((v) => v.location && v.assignedIncidentId)
    .map((v) => `${v.id}:${v.location!.lat.toFixed(4)},${v.location!.lng.toFixed(4)}->${v.assignedIncidentId}`)
    .join('|');

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    let cancelled = false;
    const maps = window.google.maps;

    linesRef.current.forEach((l) => l.setMap(null));
    linesRef.current = [];

    const pending = vehicles.filter((v) => v.location && v.assignedIncidentId);
    pending.forEach(async (v) => {
      const incident = incidents.find((i) => i.id === v.assignedIncidentId);
      if (!incident) return;
      try {
        const route = await computeRoute(v.location!, { lat: incident.location.lat, lng: incident.location.lng });
        if (cancelled || !route.polyline) return;
        const path = maps.geometry.encoding.decodePath(route.polyline);
        const line = new maps.Polyline({
          path,
          map,
          strokeColor: cssVar('--primary', '#f97316'),
          strokeOpacity: 0.9,
          strokeWeight: 4,
        });
        linesRef.current.push(line);
      } catch {
        // Route failures are surfaced in the fleet panel; the map simply omits the line.
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, routeKey]);

  // Clean up on unmount.
  useEffect(
    () => () => {
      markersRef.current.forEach((m) => m.setMap(null));
      linesRef.current.forEach((l) => l.setMap(null));
      markersRef.current = [];
      linesRef.current = [];
    },
    [],
  );

  return (
    <div className="relative w-full h-full min-h-[400px] rounded-lg overflow-hidden bg-secondary">
      <div ref={containerRef} className="absolute inset-0" />

      {(!ready || loading) && !mapError && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 bg-background/70">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-xs font-mono text-muted-foreground">Loading live map…</p>
        </div>
      )}

      {(mapError || (!loading && error)) && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 bg-background/80 p-4 text-center">
          <AlertTriangle className="w-6 h-6 text-critical" />
          <p className="text-xs font-mono text-muted-foreground">{mapError ?? 'Incident data unavailable'}</p>
        </div>
      )}

      <div className="absolute top-3 left-3 z-20 bg-card/90 backdrop-blur border border-border rounded-lg px-3 py-2">
        <p className="text-[10px] font-mono text-success">{city.name.toUpperCase()} LIVE MAP</p>
        <p className="text-[10px] font-mono text-muted-foreground">
          {incidents.length} incidents · {vehicles.filter((v) => v.location).length} units · {stations.length} stations
        </p>
      </div>

      <div className="absolute bottom-3 right-3 z-20 bg-card/90 backdrop-blur border border-border rounded-lg p-3">
        <p className="text-[10px] font-mono text-muted-foreground mb-2 uppercase tracking-wider">Legend</p>
        <div className="space-y-1.5">
          {['critical', 'high', 'medium', 'low'].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  s === 'critical' ? 'bg-critical' : s === 'high' ? 'bg-primary' : s === 'medium' ? 'bg-warning' : 'bg-info'
                }`}
              />
              <span className="text-[10px] text-muted-foreground capitalize">{s}</span>
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
    </div>
  );
}
