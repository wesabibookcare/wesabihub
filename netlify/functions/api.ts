import serverless from 'serverless-http';
import { appReadyPromise } from '../../server';
import type { Handler } from '@netlify/functions';

// Wraps the existing Express app (unchanged) so Netlify can run it as a
// serverless function. This is the ONLY piece of "Netlify glue" needed --
// server.ts itself did not need to be rewritten, just made exportable
// without forcing app.listen() in this environment (see server.ts).
let cachedHandler: ReturnType<typeof serverless> | null = null;

export const handler: Handler = async (event, context) => {
  if (!cachedHandler) {
    const app = await appReadyPromise;
    cachedHandler = serverless(app);
  }

  // Defensive path normalization: every route in server.ts is registered
  // as "/api/...". Depending on exactly how Netlify's redirect rewrites the
  // path, event.path may arrive as "/api/foo", "/.netlify/functions/api/foo",
  // or just "/foo". Normalize all of these to the "/api/foo" form Express
  // actually expects, so routing works correctly no matter which one occurs.
  let normalizedPath = event.path.replace(/^\/\.netlify\/functions\/api/, '');
  if (!normalizedPath.startsWith('/api')) {
    normalizedPath = '/api' + normalizedPath;
  }
  const normalizedEvent = { ...event, path: normalizedPath };

  return cachedHandler(normalizedEvent, context) as any;
};
