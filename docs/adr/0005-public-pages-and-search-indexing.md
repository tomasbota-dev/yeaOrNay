# ADR 0005: Prerender public pages and explicitly control search indexing

- Status: Accepted
- Date: 2026-10-25
- Supersedes: ADR 0002's global SPA fallback for unknown URLs

## Context

The public landing previously rendered only after React and `/api/me` completed. Browser-selected language did not expose separate translated URLs. A global SPA fallback returned the same shell for arbitrary paths. Public discovery must not expose room content or depend on accounts, D1 or Turnstile.

## Decision

Build ten public pages using React's server renderer at build time: English and European Portuguese homepages, dinner, movie-night, weekend and voting-rules guides. Reuse the existing landing component and styles; hydrate the public shell for theme controls and animation. Public content never requests sessions or queries D1. Keep the private application in a separate Vite entry point.

Use `/en/` and `/pt/` with trailing slashes. Each page supplies an initial title, description, canonical, reciprocal `hreflang` and privacy-safe Open Graph/Twitter text. The production origin and public route manifest live in `shared/seo.ts`. Never derive canonical URLs from request-controlled headers.

The selected primary origin is `https://yeaornay.me`. Production Turnstile provisioning targets this hostname; staging remains separate. Cloudflare redirect rules for `.pt` and `.online` are external setup, preserving paths and query strings. Aliases and the previous Workers hostname are excluded by the exact-origin gate; no cross-domain API redirects are added by the app.

Disable global SPA fallback. Worker-first routes cover public HTML, root, discovery files, internal templates, APIs and media. Unmatched paths reach the Worker because assets use `not_found_handling: none`. Only known private paths receive the app shell; unknown paths return HTTP 404. Hashed JS/CSS/icons keep asset-first delivery.

Indexing requires `SEARCH_INDEXING=enabled` and an exact production-origin match. Staging disables it; absent settings, localhost and previews fail closed. Production robots permits crawling so engines can read private routes' `noindex` headers. Nonproduction robots disallows crawling and its HTML also sends `noindex`. Only production exposes a sitemap, containing the ten public URLs. Legal drafts remain accessible but excluded until operator details are complete.

Root sends anonymous users to the English homepage (Portuguese with `?lang=pt-PT`). A session cookie triggers a temporary, noncached dashboard redirect; the dashboard still authenticates. Public pages never vary by session. Account/room pages, APIs and uploads carry indexing exclusions. Existing media access is unchanged: UUID image URLs are public; `noindex` is not access control.

## Alternatives

- Runtime rendering of the full app: introduces session/database coupling and unnecessary rendering cost for private content.
- Keep one client-only SPA: public availability still depends on JavaScript and the session endpoint.
- Run every asset through the Worker: simpler, but consumes unnecessary invocations for immutable assets.
- New content framework/separate hosting: additional dependencies and deployment boundaries for a small page set.

## Costs and failure behavior

No paid service or plan upgrade is enabled. Prerendering adds CI build work without runtime React rendering. Public HTML/discovery/root routing invokes the Worker; direct static JS/CSS/icons retain asset delivery. Dynamic requests and existing D1/R2/DO usage remain subject to account allowances. Unlimited free usage is not promised.

Missing template markers or renderer failures fail the build. Missing page assets retain their error status and are excluded. Missing indexing settings fail closed. If JavaScript, session APIs or browser storage fail, public HTML, language links and account CTAs remain available; optional theme/animation controls may not. No third-party analytics, billing or ads are added.

## Validation

Tests inspect actual generated HTML and Worker responses for both languages, cookie-independent content, private-route exclusion, environment/origin boundaries, redirects, HEAD and missing-page statuses. Existing policy/security/localization tests, both Wrangler dry runs, local D1/R2 smoke and mobile/desktop visual checks remain required. Deployment and search-engine verification are separate steps.

## References

- https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
- https://developers.google.com/search/docs/specialty/international/localized-versions
- https://developers.google.com/search/docs/crawling-indexing/block-indexing
- https://developers.cloudflare.com/workers/static-assets/routing/worker-script/
