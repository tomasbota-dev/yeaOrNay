# Public search pages and launch operations

## Routes and content

`shared/seo.ts` is the origin/route registry. The production origin is currently `https://yea-or-nay.it-tomasbota.workers.dev`, matching the declared production hostname. `frontend/public-content.ts` holds complete English and European Portuguese copy. `PublicSite.tsx` renders the public shell/guides; `Landing.tsx` is shared with the app's development fallback. `scripts/prerender.mjs` writes ten HTML documents after Vite builds.

Each language has a homepage plus `dinner/`, `movie-night/`, `weekend/` and `how-it-works/`. Guides use fictional examples, accurate account requirements and shipped voting rules. Do not claim anonymous voting, scheduling, reservations, verified restaurant recommendations or unavailable capabilities. Edit both languages together. These pages do not imply measured keyword demand or guaranteed rankings.

Pages include unique titles/descriptions, self-canonicals, reciprocal `en`/`pt-PT` links, English `x-default` and text social metadata. No invented ratings, prices or operator details are supplied. Organization schema and branded social imagery can be added when factual launch details/assets exist.

## Indexing policy

| Surface | Policy |
| --- | --- |
| Ten canonical production public URLs | Indexable with the enabled setting and exact production origin |
| Auth, dashboard, profile, create, room paths | App shell with HTML/HTTP indexing exclusion; never in sitemap |
| API and UUID uploads | HTTP indexing exclusion; existing access rules remain |
| Privacy/terms drafts | Accessible, excluded until launch details are complete |
| Unknown URLs and internal templates | HTTP 404, excluded |
| Staging, previews, localhost | Public HTML excluded; robots disallows; sitemap returns 404 |

`wrangler.jsonc` sets `SEARCH_INDEXING` independently per environment. Do not enable staging. The origin check protects previews even with production settings. Production robots intentionally allows private URLs to be crawled so engines can observe `noindex`; a robots disallow is not a substitute for it. Robots/noindex cannot guarantee confidentiality or removal. Use Cloudflare Access separately if staging needs confidentiality.

Never embed real room names, participants, ideas, comments or uploads in public content/metadata. Uploads remain public by URL; indexing exclusion does not make them private. Never submit private URLs to indexing services.

## Build, test and deployment

Use `npm run dev` for complete prerendered pages and Worker behavior. Vite-only `npm run dev:ui` serves the app for UI development; it does not emulate public prerendering or Worker status/indexing controls. Rebuild public HTML after copy/component changes.

```sh
npm run build:static
npm run typecheck
npm test
npx wrangler deploy --env staging --dry-run --outdir dist/staging
npx wrangler deploy --env="" --dry-run --outdir dist/production
git diff --check
```

SEO tests inspect generated files, so build first. For application integration smoke, apply local migrations, run Wrangler on loopback HTTP with `--var LOCAL_TEST_MODE:true`, then run `node scripts/smoke-local.mjs`. The existing security code restricts this explicit test bypass to local HTTP; never deploy it.

Build artifacts still separate `dist/client` from the Worker bundle. No D1 migration, external dependency or paid-plan change is needed for SEO. Follow normal PR-to-staging and staging-to-main releases. Prerender before artifact upload. The blank `public.html` template is removed from output and blocked as a public URL.

## After a production release

1. Check successful Actions deployment and the served `/en/`, `/pt/` and one guide. Confirm content in raw HTML, metadata, HTTP 200 and indexable headers. A push/dry run is not deployment proof.
2. Check production robots and sitemap. Expect exactly ten canonical public URLs without staging/private paths.
3. Expect HTTP 404 for a random unknown URL. Auth/room invitations must be excluded without exposing room content. Staging public HTML must be excluded and its sitemap unavailable.
4. Verify ownership using the owner's Google Search Console and Bing Webmaster Tools accounts; submit the production sitemap and inspect rendered public pages. This implementation does not perform account verification/submission. A `workers.dev` subdomain gives no parent-zone DNS control; use an available URL-prefix verification method where applicable. Never invent verification tokens.
5. Review non-brand queries/clicks by page, language and device. Separately measure product activation: room creation, second-member participation, completed decisions and returning organizers. No analytics collection is added; choose measurement/privacy requirements before adding tracking.
6. Measure mobile Core Web Vitals using available field and lab tools. The rendering architecture does not guarantee a performance score or ranking.

Before broad launch, complete factual operator/contact/processing details in legal pages and confirm existing signup/security setup. Do not fabricate those details. Monetization remains outside this change.

## Custom-domain migration

Update `publicOrigin` in `shared/seo.ts`, configure the new domain through the normal operational workflow and rebuild all public pages. Add permanent redirects from the previous public hostname once the domain is live. Verify canonical/language/social URLs, origin gating, robots and sitemap. Preserve invite paths/query parameters. Update Turnstile hostnames through existing provisioning. Review Google/Bing ownership and sitemap submission for the new domain.
