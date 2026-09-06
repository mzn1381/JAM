const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? '';

export default function (request: Request) {
  const base = SITE_URL ? SITE_URL.replace(/\/$/, '') : '';
  // Public pages to include in sitemap. Do not expose private/admin routes.
  const pages = ['/', '/about', '/blog', '/contact', '/signin', '/signup'];

  const urls = pages.map((p) => {
    const loc = base ? `${base}${p}` : p;
    return `  <url>\n    <loc>${loc}</loc>\n  </url>`;
  });

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;

  return new Response(sitemap, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
