// Loads the Google Maps JavaScript API once, asynchronously.
// The browser key is referrer-restricted and safe to embed.
const BROWSER_KEY = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY as string | undefined;
const TRACKING_ID = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID as string | undefined;

export const isGoogleMapsConfigured = !!BROWSER_KEY;

const CALLBACK = '__fireBuddyMapsReady';
let promise: Promise<typeof google.maps> | null = null;

export function loadGoogleMaps(): Promise<typeof google.maps> {
  if (promise) return promise;
  if (!BROWSER_KEY) return Promise.reject(new Error('Google Maps key is not configured'));

  promise = new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.google?.maps) {
      resolve(window.google.maps);
      return;
    }
    (window as unknown as Record<string, unknown>)[CALLBACK] = () => resolve(window.google.maps);
    const script = document.createElement('script');
    const params = new URLSearchParams({
      key: BROWSER_KEY,
      loading: 'async',
      libraries: 'geometry',
      callback: CALLBACK,
      language: 'en',
      region: 'IN',
    });
    if (TRACKING_ID) params.set('channel', TRACKING_ID);
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });

  return promise;
}
