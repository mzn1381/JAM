const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? '';

export default function (request: Request) {
  const sitemapUrl = SITE_URL ? `${SITE_URL.replace(/\/$/, '')}/sitemap.xml` : '/sitemap.xml';
  const lines = [
    'User-agent: *',
    'Disallow:',
    `Sitemap: ${sitemapUrl}`,
  ];

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
