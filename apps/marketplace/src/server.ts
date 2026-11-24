import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine, isMainModule } from '@angular/ssr/node';
import express from 'express';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import bootstrap from './main.server';
import { environment } from './environments/environment';
import { RESPONSE } from './app/core/tokens';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');
const indexHtml = join(serverDistFolder, 'index.server.html');

const app = express();

const siteUrl = (environment.siteUrl || '').replace(/\/$/, '');

// SSR routing only needs the request path, so we render against a fixed internal
// host that is always on the allowlist. This keeps server-side rendering working
// on any deploy domain without per-domain configuration. (Canonical/OG URLs come
// from environment.siteUrl, never from the request host.)
const INTERNAL_HOST = 'localhost';
const commonEngine = new CommonEngine({ allowedHosts: [INTERNAL_HOST] });

/** robots.txt — index public content, keep private routes out of search. */
app.get('/robots.txt', (_req, res) => {
  res.type('text/plain').send(
    [
      'User-agent: *',
      'Allow: /',
      'Disallow: /dashboard',
      'Disallow: /auth',
      `Sitemap: ${siteUrl}/sitemap.xml`,
      '',
    ].join('\n')
  );
});

/** sitemap.xml — static pages + every published creator profile. */
app.get('/sitemap.xml', async (_req, res) => {
  const staticPaths = ['/', '/directory', '/list-your-channel', '/help', '/contact', '/privacy', '/terms'];
  let creatorEntries: { slug: string; published_at: string }[] = [];
  try {
    if (environment.supabaseUrl && environment.supabaseAnonKey) {
      const r = await fetch(
        `${environment.supabaseUrl}/rest/v1/public_creators?select=slug,published_at`,
        {
          headers: {
            apikey: environment.supabaseAnonKey,
            Authorization: `Bearer ${environment.supabaseAnonKey}`,
          },
        }
      );
      if (r.ok) creatorEntries = await r.json();
    }
  } catch {
    // Fall back to just the static pages.
  }

  const urls = [
    ...staticPaths.map((p) => ({ loc: `${siteUrl}${p}`, lastmod: undefined as string | undefined })),
    ...creatorEntries.map((c) => ({
      loc: `${siteUrl}/creators/${c.slug}`,
      lastmod: c.published_at,
    })),
  ];

  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls
      .map(
        (u) =>
          `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${new Date(u.lastmod).toISOString()}</lastmod>` : ''}</url>`
      )
      .join('\n') +
    `\n</urlset>\n`;
  res.type('application/xml').send(body);
});

/** Serve static files from /browser */
app.get(
  '**',
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: 'index.html',
  })
);

/** All other requests: render the Angular application (SSR). */
app.get('**', (req, res, next) => {
  const { originalUrl, baseUrl } = req;

  commonEngine
    .render({
      bootstrap,
      documentFilePath: indexHtml,
      url: `http://${INTERNAL_HOST}${originalUrl}`,
      publicPath: browserDistFolder,
      providers: [
        { provide: APP_BASE_HREF, useValue: baseUrl },
        { provide: RESPONSE, useValue: res },
      ],
    })
    .then((html) => res.send(html))
    .catch((err) => next(err));
});

if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

export default app;
