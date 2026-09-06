// Production site must be provided via environment variable NEXT_PUBLIC_SITE_URL
const PRODUCTION_SITE = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";
// PRODUCTION_HOSTS should be a comma-separated list of hostnames (hostname only, no scheme)
const PRODUCTION_HOSTS = new Set(
  (process.env.PRODUCTION_HOSTS || "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean),
);

export function GET(request: Request) {
  const hostHeader = (request.headers.get("host") || "").split(":")[0].toLowerCase();

  // Only serve the sitemap on the production host to avoid exposing it on staging/dev domains
  if (!PRODUCTION_HOSTS.has(hostHeader)) {
    return new Response("Not Found", { status: 404 });
  }

  const base = PRODUCTION_SITE;
  // Public pages to include in sitemap. Do not expose private/admin routes.
  const pages = ["/", "/about", "/blog", "/contact", "/signin", "/signup"];

  const urls = pages.map((p) => {
    const loc = `${base}${p}`;
    return `  <url>\n    <loc>${loc}</loc>\n  </url>`;
  });

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;

  return new Response(sitemap, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}

// For compatibility with Next metadata route loader that expects a default export
export default GET;
