// Secure server-side routing proxy.
// Computes a real driving route (distance, duration, polyline, navigation steps)
// between two verified coordinates using the Google Maps Routes API through the
// Lovable connector gateway. The API key never reaches the browser.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/google_maps';

interface LatLng { lat: number; lng: number }

function parsePoint(raw: unknown): LatLng | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const lat = Number(o.lat);
  const lng = Number(o.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  if (lat === 0 && lng === 0) return null; // unverified / missing coordinates
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
    const { origin: rawOrigin, destination: rawDestination } = (body ?? {}) as Record<string, unknown>;
    const origin = parsePoint(rawOrigin);
    const destination = parsePoint(rawDestination);
    if (!origin || !destination) {
      return json({ error: 'origin and destination must be valid {lat,lng} coordinates' }, 400);
    }

    const res = await fetch(`${GATEWAY_URL}/routes/directions/v2:computeRoutes`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': GOOGLE_MAPS_API_KEY,
        'Content-Type': 'application/json',
        'X-Goog-FieldMask': [
          'routes.distanceMeters',
          'routes.duration',
          'routes.polyline.encodedPolyline',
          'routes.legs.steps.distanceMeters',
          'routes.legs.steps.navigationInstruction',
        ].join(','),
      },
      body: JSON.stringify({
        origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
        destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
        travelMode: 'DRIVE',
        routingPreference: 'TRAFFIC_AWARE',
        computeAlternativeRoutes: false,
        languageCode: 'en-IN',
        units: 'METRIC',
      }),
    });

    if (!res.ok) {
      const details = await res.text();
      console.error(`Routes API failed [${res.status}]: ${details}`);
      return json({ error: 'Routing request failed', status: res.status, details }, res.status);
    }

    const data = await res.json();
    const route = data?.routes?.[0];
    if (!route) return json({ error: 'No drivable route found between these coordinates' }, 404);

    const steps = (route.legs ?? []).flatMap((leg: Record<string, unknown>) =>
      ((leg.steps ?? []) as Array<Record<string, unknown>>)
        .map((s) => {
          const nav = s.navigationInstruction as Record<string, unknown> | undefined;
          const instruction = typeof nav?.instructions === 'string' ? nav.instructions : '';
          return {
            instruction,
            maneuver: typeof nav?.maneuver === 'string' ? nav.maneuver : '',
            distanceMeters: Number(s.distanceMeters) || 0,
          };
        })
        .filter((s) => s.instruction),
    );

    const durationSeconds = Number(String(route.duration ?? '').replace('s', '')) || 0;

    return json({
      distanceMeters: Number(route.distanceMeters) || 0,
      durationSeconds,
      polyline: route.polyline?.encodedPolyline ?? null,
      steps,
      computedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('compute-route error:', err);
    return json({ error: err instanceof Error ? err.message : 'Unexpected error' }, 500);
  }
});
