# V2 discovery

Status: design approved, implementation in the V2 feature PR, 23 October 2026. This discovery record explains the original findings; see [implementation notes](implementation.md) for the delivered architecture and release checks. Deployment still follows staging review and production promotion.

Review the [interactive design prototype](prototype/index.html), [localization plan](localization.md), and [security review](security.md). The prototype is a separate sample interface, not the deployed application.

## Architecture findings

The existing frontend is already a client-rendered SPA using History API navigation in `public/app.js`. Terms and privacy remain separate HTML documents. The Worker embeds assets from `src/static-assets.ts`, serves the API, and accesses D1/R2 through bindings. The main opportunity is a component-based frontend and dedicated static asset serving, rather than introducing SPA navigation for the first time.

Proposed stack: React, TypeScript, Vite, and client routing, retaining the Worker API, HttpOnly session model, D1, and R2. See the proposed ADRs before implementation.

## Design direction: the decision board

Warm ivory, near-black type, cobalt brand accents, teal affirmative actions, and coral negative actions. Strong typography, clear borders, generous space, and product-derived graphics establish the visual identity. These colors remain provisional until a coherent prototype is reviewed for contrast and appearance.

- Landing: normal scrolling moves scattered idea cards into a sample room, zooms into a vote, and resolves into a chosen plan. Provide a static reduced-motion view and a simpler mobile sequence.
- Dashboard: separate active and completed decisions; make creation and joining prominent. Show the question, deadline, participants, and status on each room.
- Rooms: question, deadline, invite, and composer above the idea stream. Keep people and moderation secondary.
- Voting: visibly labeled Yea/Nay controls, explicit selection feedback, keyboard access, and distinct explanations for own ideas and closed voting. Preserve current scoring rules unless separately agreed. Do not imply separate vote totals without an API contract supporting them.
- Composer: visible labels, multiline details, character limits, pending/error states, and retained drafts. Place it before the list, with a compact mobile treatment.
- Results: one clear final state, including ties, using the same idea components.
- Legal: `/terms` and `/privacy` use shared navigation, theme, language, footer, and article typography. Preserve legacy links. Existing draft notices and unresolved operator details need a content decision before publication.

Review deliverable: one coherent prototype showing landing motion, dashboard, desktop/mobile room, composer, selected vote, results, and a legal article. This is the design checkpoint before broad implementation.

## Localization findings

Current localization mixes dictionary lookups with exact-text DOM replacement. Interpolated sentences, numbers, symbols, and untranslated browser confirmations can bypass translation. Terms and privacy contain English documents with Portuguese summaries rather than full localized documents.

Replace this with explicit message keys, parameters, plural handling, and locale-aware date/number formatting. Audit all navigation, auth, profile, dashboard, room, moderation, comments, uploads, empty/loading/error states, browser titles, accessible labels, and legal content. Map API error codes to localized client messages; never translate user content. A Portuguese reviewer should verify consistent European Portuguese wording.

## Security findings and scope

The initial read-only review found no confirmed credential exposure in tracked files, generated client assets, or the locally reachable history scanned by the security agent. This is a heuristic review, not proof that every remote ref, deleted object, artifact, log, or deployed environment is free of secrets.

D1 database UUIDs, resource names, and R2 bucket names in Wrangler configuration identify resources; they do not authorize access. Deployment tokens are referenced through GitHub secrets/environment variables. Keep credentials out of client bundles and tracked files.

Uploaded room icons and profile photos are currently served without authentication and with public caching by UUID URL (`src/index.ts`, Worker fetch handler). Decide whether this is intended and align privacy wording and access controls accordingly. Unguessable URLs are not membership checks.

## Delivery and documentation

Use `feature/*` or `bugfix/*` branches from current `origin/staging`, PRs into staging, and staging-to-main promotion PRs with merge commits. Keep staging resources isolated.

Implementation documentation must include:

- Accepted/superseded ADRs with rationale and consequences.
- Updated README, local development, build, testing, and deployment commands.
- Component/token and motion guidelines, including accessibility and responsive behavior.
- Localization key conventions, coverage checks, and pt-PT terminology.
- API contracts and voting behavior, including changing/removing votes and closed states.
- Security/access model, secret handling, and upload visibility.
- Migration and staging verification checklist, rollback constraints, and live deployment evidence.

Validate deployment changes with static asset generation, TypeScript checks, policy tests, and Wrangler dry runs for both environments. Add meaningful user-flow checks for routing, auth, composing, voting, locale persistence, legal navigation, and uploads. Inspect mobile/desktop, focus/selection states, and reduced motion visually.

## Sources checked

- [Cloudflare React SPA tutorial](https://developers.cloudflare.com/workers/vite-plugin/tutorial/)
- [SPA routing](https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/)
- [Static asset billing](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/)
- [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/)
- [R2 pricing](https://developers.cloudflare.com/r2/pricing/)
