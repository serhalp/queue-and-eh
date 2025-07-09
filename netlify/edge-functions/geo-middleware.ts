import type { Config, Context } from "@netlify/edge-functions";

export default async (request: Request, context: Context) => {
  const response = await context.next();
  
  // Only inject geo data into HTML responses
  if (response.headers.get('content-type')?.includes('text/html')) {
    try {
      const html = await response.text();
      
      const geoData = {
        country: context.geo?.country?.code ?? null,
        countryName: context.geo?.country?.name ?? null,
      };
      
      console.log('[geo-middleware] Injecting geo data:', geoData);
      
      // Inject geo data into a script tag that Nuxt can pick up
      const geoScript = `<script>window.__GEO_DATA__ = ${JSON.stringify(geoData)};</script>`;
      const modifiedHtml = html.replace('</head>', `${geoScript}</head>`);
      
      return new Response(modifiedHtml, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });
    } catch (error) {
      console.error('[geo-middleware] Error injecting geo data:', error);
      // Return original response if injection fails
      return response;
    }
  }
  
  return response;
}

export const config: Config = {
  path: '/*',
  excludedPath: ['/sse'],
}