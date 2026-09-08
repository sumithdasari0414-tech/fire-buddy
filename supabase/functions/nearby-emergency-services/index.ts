// Secure server-side proximity lookup.
// Finds real nearby emergency services (fire stations, hospitals, police, and other
// relevant facilities) around a verified incident coordinate using the Google
// Places API (New) through the Lovable connector gateway. The provider key never
// reaches the browser. No results are invented: whatever Google returns is what
// the client sees, and an empty list stays empty.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/google_maps';

const CATEGORIES: Record<string, string[]> = {
  fire_station: ['fire_station'],
  hospital: ['hospital', 'emergency_room'],
  police: ['police'],
  other: ['pharmacy', 'doctor'],
};

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
      return json({ error: 'Places provider is not configured' }, 503);
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return json({ error: 'Invalid JSON body' }, 400);
    }
    const { center: rawCenter, radiusMeters: rawRadius } = (body ?? {}) as Record<string, unknown>;
    const center = parsePoint(rawCenter);
    if (!center) return json({ error: 'center must be a valid {lat,lng} coordinate' }, 400);

    // Bounded radius and per-category result caps keep provider usage predictable.
    const radius = Math.min(Math.max(Number(rawRadius) || 8000, 500), 20000);
    const results: Array<Record<string, unknown>> = [];
    const failures: string[] = [];

    for (const [category, includedTypes] of Object.entries(CATEGORIES)) {
      const res = await fetch(`${GATEWAY_URL}/places/v1/places:searchNearby`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          'X-Connection-Api-Key': GOOGLE_MAPS_API_KEY,
          'Content-Type': 'application/json',
          'X-Goog-FieldMask': [
            'places.id',
            'places.displayName',
            'places.formattedAddress',
            'places.location',
            'places.primaryTypeDisplayName',
            'places.nationalPhoneNumber',
            'places.googleMapsUri',
          ].join(','),
        },
        body: JSON.stringify({
          includedTypes,
          maxResultCount: category === 'other' ? 3 : 5,
          rankPreference: 'DISTANCE',
          languageCode: 'en',
          locationRestriction: {
            circle: {
              center: { latitude: center.lat, longitude: center.lng },
              radius,
            },
          },
        }),
      });

      if (!res.ok) {
        const details = await res.text();
        console.error(`Places searchNearby failed for ${category} [${res.status}]: ${details}`);
        failures.push(`${category}: ${res.status}`);
        continue;
      }

      const data = await res.json();
      for (const p of (data?.places ?? []) as Array<Record<string, any>>) {
        const lat = Number(p?.location?.latitude);
        const lng = Number(p?.location?.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
        results.push({
          id: String(p.id),
          category,
          name: p?.displayName?.text ?? 'Unnamed facility',
          address: p?.formattedAddress ?? null,
          typeLabel: p?.primaryTypeDisplayName?.text ?? null,
          phone: p?.nationalPhoneNumber ?? null,
          mapsUri: p?.googleMapsUri ?? null,
          location: { lat, lng },
        });
      }
    }

    if (results.length === 0 && failures.length === Object.keys(CATEGORIES).length) {
      return json({ error: 'Places lookup failed', details: failures.join('; ') }, 502);
    }

    return json({
      services: results,
      radiusMeters: radius,
      partialFailures: failures,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('nearby-emergency-services error:', err);
    return json({ error: err instanceof Error ? err.message : 'Unexpected error' }, 500);
  }
});
