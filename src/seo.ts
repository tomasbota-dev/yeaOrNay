import { publicOrigin, publicPath, publicPaths, publicRoute } from "../shared/seo";

export function indexingAllowed(request: Request, setting?: string) {
  return setting === "enabled" && new URL(request.url).origin === publicOrigin;
}
export function excludeFromSearch(response: Response) {
  // WebSocket handshakes must retain their runtime-specific response object.
  if (response.status === 101) return response;
  const headers = new Headers(response.headers);
  headers.set("x-robots-tag", "noindex, nofollow, noarchive");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
export async function seoResponse(request: Request, assets: Fetcher, setting?: string): Promise<Response | null> {
  const url = new URL(request.url);
  const allowed = indexingAllowed(request, setting);
  const headers = { "x-robots-tag": "noindex, nofollow, noarchive", "cache-control": "no-store" };
  if (request.method !== "GET" && request.method !== "HEAD") return null;
  if (url.pathname === "/robots.txt") {
    // Let production crawlers read route-level noindex directives. Disallow alone
    // cannot remove URLs already discovered by a search engine.
    const body = allowed ? `User-agent: *\nAllow: /\nSitemap: ${publicOrigin}/sitemap.xml\n` : "User-agent: *\nDisallow: /\n";
    return new Response(request.method === "HEAD" ? null : body, { headers: { ...headers, "content-type": "text/plain; charset=utf-8" } });
  }
  if (url.pathname === "/sitemap.xml") {
    const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${publicPaths.map(path => `<url><loc>${publicOrigin}${path}</loc></url>`).join("")}</urlset>`;
    return new Response(request.method === "HEAD" ? null : allowed ? xml : "Not found", { status: allowed ? 200 : 404, headers: { ...headers, "content-type": allowed ? "application/xml; charset=utf-8" : "text/plain; charset=utf-8" } });
  }
  if (url.pathname === "/") {
    // Preserve the existing signed-in home shortcut without a database lookup.
    // The dashboard still validates the session before displaying any account data.
    const signedIn = /(?:^|;\s*)yn_session=[^;]+/.test(request.headers.get("cookie") || "");
    const path = signedIn ? "/dashboard" : publicPath(url.searchParams.get("lang") === "pt-PT" ? "pt" : "en");
    return new Response(null, { status: signedIn ? 302 : 308, headers: { "cache-control": "no-store", ...(signedIn || !allowed ? { "x-robots-tag": headers["x-robots-tag"] } : {}), location: new URL(path, url).href } });
  }
  // One canonical spelling, including direct index.html and .html asset aliases.
  const path = url.pathname.replace(/\/index\.html$/, "/").replace(/\.html$/, "").replace(/\/+$/, "") + "/";
  const route = publicRoute(path);
  if (!route) return null;
  if (url.pathname !== path) {
    url.pathname = path;
    return new Response(null, { status: 308, headers: { "cache-control": "no-store", ...(!allowed ? { "x-robots-tag": headers["x-robots-tag"] } : {}), location: url.href } });
  }
  const asset = await assets.fetch(request);
  // A failed build/asset must not become an indexable empty or error page.
  const responseHeaders = new Headers(asset.headers);
  responseHeaders.set("x-robots-tag", allowed && (asset.status === 200 || asset.status === 304) ? "index, follow" : headers["x-robots-tag"]);
  responseHeaders.set("cache-control", "public, max-age=0, must-revalidate");
  return new Response(request.method === "HEAD" ? null : asset.body, { status: asset.status, headers: responseHeaders });
}

export function isAppPath(path: string) {
  return ["/login", "/signup", "/dashboard", "/profile", "/create", "/privacy", "/terms"].includes(path)
    || /^\/room\/[^/]+$/.test(path);
}
export function notFoundPage(request: Request) {
  const pt = new URL(request.url).pathname.startsWith("/pt/");
  const title = pt ? "Esta página não existe." : "This page could not be found.";
  const label = pt ? "Voltar ao início" : "Back home";
  return new Response(request.method === "HEAD" ? null : `<!doctype html><html lang="${pt ? "pt-PT" : "en-US"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>404 · Yea or Nay</title></head><body><main><h1>${title}</h1><p><a href="${publicPath(pt ? "pt" : "en")}">${label}</a></p></main></body></html>`, { status: 404, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex, nofollow" } });
}
