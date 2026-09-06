// Production site should be provided via environment variable NEXT_PUBLIC_SITE_URL
const PRODUCTION_SITE = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";
const PRODUCTION_SITEMAP = PRODUCTION_SITE ? `${PRODUCTION_SITE}/sitemap.xml` : "/sitemap.xml";
const PRODUCTION_HOSTS = new Set(
  (process.env.PRODUCTION_HOSTS || "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean),
);

export function GET(request: Request) {
  const hostHeader = (request.headers.get("host") || "").split(":")[0].toLowerCase();

  // If the request is from production, allow crawling; otherwise disallow all crawling.
  const isProd = PRODUCTION_HOSTS.has(hostHeader);

  const lines = isProd
    ? ["User-agent: *", "Disallow:", `Sitemap: ${PRODUCTION_SITEMAP}`]
    : ["User-agent: *", "Disallow: /", `Sitemap: ${PRODUCTION_SITEMAP}`];

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

// For compatibility with Next metadata route loader that expects a default export
export default GET;
