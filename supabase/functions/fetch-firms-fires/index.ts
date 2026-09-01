// Secure server-side NASA FIRMS proxy.
// Fetches recent VIIRS active-fire detections for Hyderabad and its outskirts,
// parses the CSV response, deduplicates detections and returns normalised JSON.
// FIRMS_MAP_KEY is read from server-side secrets and never reaches the browser.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

// Hyderabad + outskirts bounding box: west,south,east,north
const AREA = '78.10,17.10,78.90,17.75';
const SOURCES = ['VIIRS_SNPP_NRT', 'VIIRS_NOAA20_NRT'];

interface Detection {
  firmsId: string;
  lat: number;
  lng: number;
  acquiredAt: string; // ISO UTC
  confidence: string; // low | nominal | high
  frp: number | null;
  brightness: number | null;
  satellite: string;
  source: string;
  daynight: string;
}

function parseCsv(csv: string, source: string): Detection[] {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const idx = (name: string) => header.indexOf(name);
  const iLat = idx('latitude');
  const iLng = idx('longitude');
  const iDate = idx('acq_date');
  const iTime = idx('acq_time');
  const iConf = idx('confidence');
  const iFrp = idx('frp');
  const iBright = idx('bright_ti4') >= 0 ? idx('bright_ti4') : idx('brightness');
  const iSat = idx('satellite');
  const iDn = idx('daynight');
  if (iLat < 0 || iLng < 0 || iDate < 0) return [];

  const out: Detection[] = [];
  for (const line of lines.slice(1)) {
    const c = line.split(',');
    const lat = Number(c[iLat]);
    const lng = Number(c[iLng]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

    const rawTime = (c[iTime] ?? '0').padStart(4, '0');
    const acquiredAt = `${c[iDate]}T${rawTime.slice(0, 2)}:${rawTime.slice(2, 4)}:00Z`;
    if (Number.isNaN(Date.parse(acquiredAt))) continue;

    const confRaw = (c[iConf] ?? '').trim().toLowerCase();
    const confidence =
      confRaw === 'h' || confRaw === 'high'
        ? 'high'
        : confRaw === 'l' || confRaw === 'low'
          ? 'low'
          : 'nominal';

    const frp = Number(c[iFrp]);
    const brightness = Number(c[iBright]);
    const satellite = (c[iSat] ?? '').trim() || source;

    out.push({
      firmsId: `firms_${lat.toFixed(4)}_${lng.toFixed(4)}_${acquiredAt.replace(/[^0-9]/g, '')}`,
      lat,
      lng,
      acquiredAt,
      confidence,
      frp: Number.isFinite(frp) ? frp : null,
      brightness: Number.isFinite(brightness) ? brightness : null,
      satellite,
      source,
      daynight: (c[iDn] ?? '').trim(),
    });
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  const key = Deno.env.get('FIRMS_MAP_KEY');
  if (!key) return json({ error: 'FIRMS_MAP_KEY is not configured' }, 500);

  let days = 1;
  try {
    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      const d = Number((body as Record<string, unknown>)?.days);
      if (Number.isFinite(d) && d >= 1 && d <= 10) days = Math.floor(d);
    }
  } catch {
    // ignore malformed body, use defaults
  }

  const detections: Detection[] = [];
  const failures: string[] = [];

  for (const source of SOURCES) {
    const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${key}/${source}/${AREA}/${days}`;
    try {
      const res = await fetch(url);
      const text = await res.text();
      if (!res.ok) {
        failures.push(`${source}: HTTP ${res.status}`);
        continue;
      }
      if (/invalid|error/i.test(text.slice(0, 200)) && !text.toLowerCase().includes('latitude')) {
        failures.push(`${source}: ${text.slice(0, 120)}`);
        continue;
      }
      detections.push(...parseCsv(text, source));
    } catch (err) {
      failures.push(`${source}: ${err instanceof Error ? err.message : 'request failed'}`);
    }
  }

  if (!detections.length && failures.length === SOURCES.length) {
    return json({ error: `NASA FIRMS unavailable — ${failures.join('; ')}` }, 502);
  }

  // Deduplicate across satellites/overpasses by rounded position + acquisition time.
  const unique = new Map<string, Detection>();
  for (const d of detections) {
    const existing = unique.get(d.firmsId);
    if (!existing || (d.frp ?? 0) > (existing.frp ?? 0)) unique.set(d.firmsId, d);
  }

  const list = [...unique.values()].sort((a, b) => b.acquiredAt.localeCompare(a.acquiredAt));
  return json({
    area: AREA,
    days,
    count: list.length,
    warnings: failures,
    detections: list,
    fetchedAt: new Date().toISOString(),
  });
});
