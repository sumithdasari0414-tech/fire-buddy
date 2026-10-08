// Secure proxy to Google Cloud Translation v2. Key stays server-side.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const json = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  try {
    const key = Deno.env.get('GOOGLE_TRANSLATE_API_KEY');
    if (!key) return json({ error: 'Translation provider not configured' }, 503);
    const { texts, target } = await req.json();
    if (!Array.isArray(texts) || texts.length === 0 || texts.length > 128 ||
        !texts.every((t) => typeof t === 'string' && t.length < 500) ||
        typeof target !== 'string' || !/^[a-z]{2,3}(-[A-Z]{2})?$/.test(target)) {
      return json({ error: 'Invalid input' }, 400);
    }
    const res = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: texts, source: 'en', target, format: 'text' }),
    });
    const data = await res.json();
    if (!res.ok) return json({ error: data?.error?.message ?? `Google error ${res.status}` }, 502);
    return json({ translations: data.data.translations.map((t: { translatedText: string }) => t.translatedText) });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
