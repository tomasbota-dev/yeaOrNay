# ADR 0002: V2 Cloudflare asset hosting and cost constraints

- Status: Accepted
- Date: 2026-10-23

## Context

The existing Worker embeds and serves every frontend asset. Active rooms poll every five seconds, using Worker and D1 allowances. V2 must target Cloudflare's free allowances and preserve isolated staging/production resources.

## Decision

Serve the built frontend through Workers Static Assets with SPA fallback. Route API and controlled upload requests to the Worker. Keep D1/R2 bindings server-side. Provision resources through GitHub Actions, preserving separate environments.

## Alternatives

- Embedded assets: preserves the current pipeline but uses Worker invocations for frontend files.
- Separate Pages frontend: possible, but introduces another deployment boundary that is unnecessary for the proposed application.

## Consequences

Cloudflare documents free unlimited static asset requests; Worker invocations and D1/R2 operations retain their respective quotas and pricing. This architecture can target zero usage charges within allowances; it cannot promise unlimited free backend/storage usage. Review account settings and actual usage before release.

Asset directories must be included in CI build artifacts and the deployed configuration. Match Worker routes narrowly so SPA fallback never swallows API errors or media requests. Verify missing assets, direct navigation, legacy legal links, caching, and both environment builds.

Pause polling in hidden tabs and consider backoff/conditional refresh to reduce avoidable requests, subject to explicit freshness expectations. Client framework choice alone does not solve backend request volume.

## References

- https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/
- https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/
- https://developers.cloudflare.com/workers/platform/pricing/
- https://developers.cloudflare.com/d1/platform/pricing/
- https://developers.cloudflare.com/r2/pricing/
