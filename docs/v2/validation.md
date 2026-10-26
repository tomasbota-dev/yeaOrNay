# V2 validation record

## SEO implementation checks (25 October 2026)

- Static build generated ten public HTML documents; both TypeScript projects passed.
- All 39 tests passed, including generated-HTML localization/metadata, origin/environment indexing boundaries, private-route exclusions, sitemap contents, aliases, HEAD and true 404 coverage.
- Staging and production Wrangler dry runs passed. These are not deployment proof.
- Local D1/R2 application smoke and local security/realtime smoke passed, including authenticated WebSocket notifications and revocation.
- Served HTTP checks passed for all ten public GET/HEAD pages, missing URLs and canonical aliases. Local HTML is deliberately excluded from indexing.
- Browser review at mobile/desktop widths verified homepage/guide layout and corresponding-page language switching, without hydration warnings. The mobile homepage had no horizontal document overflow.
- Google/Bing verification, sitemap submission, deployed indexing checks and field Core Web Vitals remain release/operator steps in [SEO operations](../seo.md).

## Security/realtime verification (25 October 2026)

The current hardening pass adds real workerd tests for concurrent strict admission, retained counters, socket authorization/caps, membership/session revocation and client-message rejection; real D1 tests for concurrent caps, session eviction, bans/closure and transactional rollback; and request-boundary tests for streamed JSON, challenge hostname/action/failure, strict Origin and Retry-After. Provisioning tests cover isolated widget creation/reuse and avoiding secret artifacts. These checks extend rather than replace the historical V2 checks below.

All 33 tests and both local smoke scripts passed, including the HTTP-to-room-socket moderation flow, with the explicitly enabled loopback-only signup bypass. Both staging and production Wrangler dry runs, Worker/frontend TypeScript checks and the dependency audit (zero findings) passed during this pass. Production deployment is not implied by these results. See [the setup/verification guide](public-launch-security.md) for deployed checks and remaining public-launch requirements.

Local verification on 23 October 2026. No remote database migration or deployment was performed during implementation.

## Automated checks

- `npm run build:static`: production React/Vite build succeeds; hashed assets and security headers emitted under `dist/client`.
- `npm run typecheck`: separate Worker and frontend projects pass.
- `npm test`: 15 tests pass, covering branch policy, isolated provisioning, translated UI/API templates, asset/legacy-link dispatch, origin checks, explicit vote clearing, and media behavior.
- `node scripts/smoke-local.mjs`: real local D1/R2 checks pass for SPA routes/assets, auth/invalid password, joins, member/own-vote restrictions, change/remove/toggle voting, comments, room/profile images, profile updates, feedback, closed voting, and tied results. Created accounts are cleaned up.
- Wrangler staging/production dry runs succeed. The CI artifact path was also verified by bundling into `dist/worker` and dry-running `dist/worker/index.js --no-bundle` with client assets present.
- D1 migration listing works from a config whose client assets have not been built, matching the migration job's separate checkout.
- Whitespace checks pass.

## Browser checks

Checked the actual local Worker application, separately from the design-study prototype:

- Signed-out landing, invalid-password feedback and successful sign-in to dashboard.
- Actual room creation, inline required-field validation, custom image-picker appearance, initial modal focus, Escape dismissal and restored trigger focus.
- Room deep links including a trailing slash, selection feedback after a vote stored in D1, own-idea restrictions and readable idea grouping.
- English/pt-PT room labels, singular counts, preserved user content, locale-aware dates and integrated translated privacy content.
- Light/dark appearance, including form focus/placeholder/error treatments, and 390px mobile layout.

## Release boundaries

Remote staging still needs its normal merge-triggered deployment and live verification. Production requires a separate staging-to-main promotion PR. Legal articles preserve existing draft notices and missing operator/contact details. Images retain public-by-URL access, explicitly documented in both languages. The credential audit is a source/history review, not an audit of Cloudflare account settings or remote logs/artifacts.
