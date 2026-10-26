import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { build } from "esbuild";

const { outputFiles } = await build({ entryPoints: [fileURLToPath(new URL("../src/index.ts", import.meta.url))], bundle: true, write: false, platform: "node", format: "esm" });
const { default: worker } = await import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].contents).toString("base64")}`);
const production = "https://yeaornay.me";
const pages = ["", "dinner/", "movie-night/", "weekend/", "how-it-works/"];
const paths = ["en", "pt"].flatMap(language => pages.map(page => `/${language}/${page}`));
function environment(setting = "enabled") {
  return {
    SEARCH_INDEXING: setting,
    DB: { prepare() { throw new Error("Public pages must not query the database"); } },
    ASSETS: { async fetch(request) {
      let path = new URL(request.url).pathname;
      if (path.endsWith("/")) path += "index.html";
      try {
        const bytes = await readFile(new URL(`../dist/client${path}`, import.meta.url));
        if (request.headers.get("if-none-match") === '"built-asset"')
          return new Response(null, { status: 304, headers: { etag: '"built-asset"' } });
        return new Response(request.method === "HEAD" ? null : bytes, { headers: { "content-type": path.endsWith(".html") ? "text/html; charset=utf-8" : "text/plain", etag: '"built-asset"' } });
      } catch { return new Response("Not found", { status: 404 }); }
    } },
  };
}
const get = (path, env = environment(), origin = production, init) => worker.fetch(new Request(origin + path, init), env);

test("all public pages contain distinct, localized HTML and reciprocal metadata without API/database access", async () => {
  const titles = new Set();
  for (const path of paths) {
    const response = await get(path);
    assert.equal(response.status, 200, `Run npm run build:static first: ${path}`);
    assert.equal(response.headers.get("x-robots-tag"), "index, follow");
    assert.equal(response.headers.has("set-cookie"), false);
    const html = await response.text();
    assert.match(html, /<h1>/);
    assert.match(html, /<html lang="(?:en-US|pt-PT)">/);
    assert.match(html, new RegExp(`<link rel="canonical" href="${production}${path}"`));
    assert.match(html, /hreflang="en"/);
    assert.match(html, /hreflang="pt-PT"/);
    assert.match(html, /hreflang="x-default"/);
    assert.match(html, /property="og:url"/);
    assert.match(html, /name="twitter:card"/);
    assert.doesNotMatch(html, /<!--public-(?:head|body)-->|Getting things ready/);
    titles.add(html.match(/<title>(.*?)<\/title>/)[1]);
    if (path.startsWith("/pt/")) {
      assert.match(html, /lang="pt-PT"/);
      assert.match(html, /É necessária uma conta/);
      assert.doesNotMatch(html, /An account is needed|Make a plan|Illustrative example/);
    } else assert.match(html, /An account is needed/);
    const head = await get(path, environment(), production, { method: "HEAD" });
    assert.equal(head.status, 200);
    assert.equal(await head.text(), "");
    assert.equal(head.headers.get("x-robots-tag"), "index, follow");
    const personalized = await get(path, environment(), production, { headers: { cookie: "yn_session=not-a-valid-session" } });
    assert.equal(await personalized.text(), html, "public pages cannot contain personalized room/account data");
  }
  assert.equal(titles.size, paths.length);
  const unchanged = await get("/en/", environment(), production, { headers: { "if-none-match": '"built-asset"' } });
  assert.equal(unchanged.status, 304);
  assert.equal(unchanged.headers.get("x-robots-tag"), "index, follow", "conditional requests must not accidentally deindex public pages");
  assert.equal(await unchanged.text(), "");
});

test("staging, preview hosts, local dev and missing settings fail closed for indexing", async () => {
  const missing = environment();
  delete missing.SEARCH_INDEXING;
  for (const [env, origin] of [
    [environment("disabled"), production], [missing, production],
    [environment(), "https://yea-or-nay-staging.it-tomasbota.workers.dev"],
    [environment(), "https://yea-or-nay.it-tomasbota.workers.dev"],
    [environment(), "https://yeaornay.pt"], [environment(), "https://yeaornay.online"],
    [environment(), "https://www.yeaornay.me"],
    [environment(), "http://127.0.0.1:8787"], [environment(), "https://preview.example.test"],
  ]) {
    for (const path of paths) {
      const response = await get(path, env, origin);
      assert.equal(response.status, 200);
      assert.match(response.headers.get("x-robots-tag"), /noindex/);
    }
    assert.match(await (await get("/robots.txt", env, origin)).text(), /Disallow: \//);
    const sitemap = await get("/sitemap.xml", env, origin);
    assert.equal(sitemap.status, 404);
    assert.doesNotMatch(await sitemap.text(), /<loc>/);
  }
});

test("production sitemap contains only canonical public pages and robots allows noindex to be crawled", async () => {
  const response = await get("/sitemap.xml");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /application\/xml/);
  const xml = await response.text();
  const locations = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);
  assert.deepEqual(locations, paths.map(path => production + path));
  assert.doesNotMatch(xml, /\/room\/|\/profile|\/login|staging|\/privacy|\/terms/);
  const robots = await (await get("/robots.txt")).text();
  assert.match(robots, /Allow: \//);
  assert.match(robots, /Sitemap: https:\/\/yeaornay.me\/sitemap.xml/);
  assert.doesNotMatch(robots, /Disallow: \/room/);
});

test("public aliases redirect to a single URL and anonymous root selects a public homepage", async () => {
  for (const [from, to] of [["/", "/en/"], ["/?lang=pt-PT", "/pt/"], ["/en", "/en/"], ["/pt/dinner", "/pt/dinner/"], ["/en/dinner.html", "/en/dinner/"], ["/pt/index.html", "/pt/"]]) {
    const response = await get(from);
    assert.equal(response.status, 308, from);
    assert.equal(response.headers.get("location"), production + to);
  }
  const response = await get("/", environment(), production, { headers: { cookie: "yn_session=token" } });
  assert.equal(response.status, 302);
  assert.equal(response.headers.get("location"), production + "/dashboard");
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("private routes retain the app shell but exclude indexing, unknown routes return actual 404s", async () => {
  for (const path of ["/login", "/signup", "/dashboard", "/create", "/profile", "/privacy", "/terms", "/room/INVITE7"]) {
    const response = await get(path);
    assert.equal(response.status, 200, path);
    assert.match(response.headers.get("x-robots-tag"), /noindex/);
    assert.equal(response.headers.get("cache-control"), "no-store");
    const html = await response.text();
    assert.match(html, /name="robots" content="noindex, nofollow"/);
    assert.doesNotMatch(html, /rel="canonical"|og:url|INVITE7/);
  }
  for (const path of ["/made-up-page", "/pt/no-such-guide/", "/en/no-such-guide/", "/index.html", "/public.html", "/assets/missing.js"]) {
    const response = await get(path);
    assert.equal(response.status, 404, path);
    assert.match(response.headers.get("x-robots-tag"), /noindex/);
    assert.doesNotMatch(await response.text(), /id="root"/);
  }
});

test("both deployment environments route SEO and private responses through the Worker without a global SPA fallback", async () => {
  const config = JSON.parse(await readFile(new URL("../wrangler.jsonc", import.meta.url), "utf8"));
  for (const env of [config, config.env.staging]) {
    assert.equal(env.assets.not_found_handling, "none");
    for (const path of ["/", "/en/*", "/pt/*", "/index.html", "/public.html", "/robots.txt", "/sitemap.xml"])
      assert.ok(env.assets.run_worker_first.includes(path), path);
    assert.ok(!env.assets.run_worker_first.includes("/*"), "hashed static assets should retain asset-first delivery");
  }
  assert.equal(config.vars.SEARCH_INDEXING, "enabled");
  assert.equal(config.env.staging.vars.SEARCH_INDEXING, "disabled");
  assert.equal(config.vars.TURNSTILE_HOSTNAME, new URL(production).hostname);
  assert.equal(config.env.staging.vars.TURNSTILE_HOSTNAME, "yea-or-nay-staging.it-tomasbota.workers.dev");
});
