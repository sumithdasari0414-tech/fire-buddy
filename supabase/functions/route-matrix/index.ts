// Secure server-side batch routing.
// Computes real traffic-aware driving distance and duration from several verified
// origins (fire stations, hospitals, police facilities, responder vehicles) to one
// incident coordinate using the Google Routes API through the Lovable connector
// gateway. The provider key never reaches the browser. Unroutable origins are
// reported as such — nothing is estimated.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/google_maps';
const MAX_ORIGINS = 15;

interface LatLng { lat: number; lng: number }

function parsePoint(raw: unknown): LatLng | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const lat = Number(o.lat);
  const lng = Number(o.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  if (lat === 0 && lng === 0) return null;
  return { lat, lng };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!LOVABLE_API_KEY || !GOOGLE_MAPS_API_KEY) {
      return json({ error: 'Routing provider is not configured' }, 503);
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return json({ error: 'Invalid JSON body' }, 400);
    }
    const { origins: rawOrigins, destination: rawDestination } = (body ?? {}) as Record<string, unknown>;
    const destination = parsePoint(rawDestination);
    if (!destination) return json({ error: 'destination must be a valid {lat,lng} coordinate' }, 400);
    if (!Array.isArray(rawOrigins) || rawOrigins.length === 0) {
      return json({ error: 'origins must be a non-empty array' }, 400);
    }

    const parsed = rawOrigins.slice(0, MAX_ORIGINS).map((o) => {
      const rec = (o ?? {}) as Record<string, unknown>;
      return { key: String(rec.key ?? ''), point: parsePoint(rec.point ?? rec) };
    });
    const routable = parsed.filter((p) => p.point);
    if (routable.length === 0) {
      return json({ error: 'no origins had valid coordinates' }, 400);
    }

    const res = await fetch(`${GATEWAY_URL}/routes/distanceMatrix/v2:computeRouteMatrix`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': GOOGLE_MAPS_API_KEY,
        'Content-Type': 'application/json',
        'X-Goog-FieldMask': 'originIndex,destinationIndex,distanceMeters,duration,condition',
      },
      body: JSON.stringify({
        origins: routable.map((o) => ({
          waypoint: { location: { latLng: { latitude: o.point!.lat, longitude: o.point!.lng } } },
        })),
        destinations: [
          { waypoint: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } } },
        ],
        travelMode: 'DRIVE',
        routingPreference: 'TRAFFIC_AWARE',
        languageCode: 'en-IN',
        units: 'METRIC',
      }),
    });

    if (!res.ok) {
      const details = await res.text();
      console.error(`Route matrix failed [${res.status}]: ${details}`);
      return json({ error: 'Routing request failed', status: res.status, details }, res.status);
    }

    const rows = (await res.json()) as Array<Record<string, unknown>>;
    const results = (Array.isArray(rows) ? rows : []).flatMap((row) => {
      const idx = Number(row.originIndex);
      const origin = routable[idx];
      if (!origin) return [];
      const condition = String(row.condition ?? '');
      if (condition !== 'ROUTE_EXISTS') return [];
      const distanceMeters = Number(row.distanceMeters);
      const durationSeconds = Number(String(row.duration ?? '').replace('s', ''));
      if (!Number.isFinite(distanceMeters) || !Number.isFinite(durationSeconds)) return [];
      return [{ key: origin.key, distanceMeters, durationSeconds }];
    });

    return json({ results, computedAt: new Date().toISOString() });
  } catch (err) {
    console.error('route-matrix error:', err);
    return json({ error: err instanceof Error ? err.message : 'Unexpected error' }, 500);
  }
});
