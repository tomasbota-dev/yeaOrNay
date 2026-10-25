# Security and live-update operations

Implemented 25 October 2026. This guide describes controls and remaining limits, not a security certification. See [ADR 0004](../adr/0004-abuse-controls-and-room-realtime.md) and [changelog](../../CHANGELOG.md).

## Deploy and configure

Use a feature/bugfix PR into staging, squash merge, verify Actions and served behavior, then a separately validated staging-to-main squash promotion. Production is not released by the staging merge.

Actions provisions/reuses isolated D1/R2 resources, attempts to provision an environment-specific managed Turnstile widget (`<worker-name>-signup`), applies D1 migrations and deploys the validated bundle. Wrangler's `new_sqlite_classes` migration creates the two Durable Object namespaces during deployment. They must remain SQLite-backed for Workers Free. Do not bind staging to production namespaces.

The deployment API token needs existing D1 Edit, Workers R2 Storage Edit and Workers Scripts Edit permissions, plus **Turnstile Sites Write** for automatic widget setup. The setup resolves the account's workers.dev subdomain and permits the exact selected Worker hostname. Existing widget domains are preserved. Secrets are masked and sent directly to the Worker secrets API; only the public site key enters resolved config/artifacts. No paid Bot Management, paid WAF ruleset, Images service, or account-plan upgrade is provisioned.

If Turnstile setup is unavailable, Actions reports a warning, writes an empty site key and signup fails closed. Grant the narrowly scoped missing permission and rerun deployment. `/api/config` must return `signupEnabled:true` with a real site key after successful setup. Never substitute Cloudflare's always-pass test keys in a deployed environment. Confirm actual challenge completion, hostname/action validation and replay rejection in staging before public launch. A newly created Worker may need a second deployment after its first script exists for secret installation.

When adopting a custom domain, add its hostname to the environment's widget, update provisioning hostname selection, and test both challenge and WebSocket Origin validation there. Use a Cloudflare-controlled zone for configurable WAF protection. Disable alternate public Worker URLs if a custom-domain WAF is part of the protection boundary; leaving workers.dev reachable bypasses those zone rules. Domain purchase is not included in the free plan.

## Application limits

All windows are fixed windows beginning at first admitted request, with strict atomic admission. Boundary bursts can span two windows. Shared networks share IP allowances; tune from staging evidence rather than repeatedly increasing limits without a capacity check.

| Policy | Allowance |
| --- | --- |
| API access, per IP | 240/minute |
| Public media access, per IP | 240/minute |
| Auth requests, per IP | 30/15 minutes |
| Signup, per IP | 5/hour plus Turnstile |
| Login, per email / per IP+email | 20 / 12 per 15 minutes |
| Authenticated reads / writes, per user | 120 / 60 per minute |
| Room creation / joining, per user | 5/hour / 20 per 10 minutes |
| Feedback / image operations, per user | 3/hour / 10/hour |
| Comments / ideas, per user | 10/minute each |
| Votes, ideas, comments and icon changes, per room | 60/minute combined |
| Account deletion password attempts, per user | 5/15 minutes |
| WebSocket handshakes, per user | 20/minute |
| Live connections | 3/user/room; 100/room |

Rate limiting does not lock an account permanently. Distributed attackers may still temporarily deny login through the account-wide allowance. Responses use `RATE_LIMITED` (429) and Retry-After, or `SERVICE_UNAVAILABLE` (503) when protection is unavailable. Raw IP/email values are hashed before reaching counter storage; hashes are pseudonymous and counters are removed after their window.

Database caps are checked by triggers: 5,000 users and 2,000 retained rooms per environment; 20 hosted rooms and 50 memberships per user; 100 members and 100 ideas per room; 500 comments per room; 20 feedback entries per user and 20,000 overall; five sessions per user (oldest evicted). Existing rows are not purged to meet new caps. Custom deadlines are at most 30 days ahead. Capacity denials are 409 rather than unlimited growth. Capacity increases require reviewing both environments' combined resource usage.

JSON is capped at 12,000 actual bytes, images at 256 KiB actual bytes. Supported still raster structures have a 2,048-pixel maximum side and four-million-pixel maximum area. Structure/dimension inspection does not prove an image fully decodes or remove metadata; the server does not decode attacker-controlled pixels. Use correct raster Content-Type and nosniff. Images remain public by URL, with one-hour public caching, and must be described that way in privacy disclosures.

Account deletion requires the current password. Email is immutable until verified-email change/recovery is built. Signup email ownership is not verified: do not interpret it as proven identity, and do not build email-based access decisions on it. Sessions expire after 30 days, are stored hashed, and use Secure/HttpOnly/SameSite=Lax cookies. Cookies retain their current name to avoid silently signing out all existing users.

## Realtime and failure behavior

`GET /api/rooms/:code/events` requires a WebSocket Upgrade, exact Origin, valid cookie and room membership. Identity headers are constructed by the Worker, not forwarded from the browser. Internal DO routes are not public application endpoints. Each notification rechecks session expiry/revocation and membership before sending only a change signal. Kicks permit rejoining; bans prevent rejoining; leaving remains distinct.

Clients obtain their own authorized snapshot after a signal. They close sockets while hidden and refetch on return, reconnect with jitter/backoff, and respect read Retry-After. They reconcile every two minutes even with an open socket and poll every 30 seconds only while degraded. Dashboard refreshes every minute. A voting-deadline timer refreshes the result even when nobody writes. Pending changes survive concurrent loads/mutations. A lost post-commit notification is repaired by reconciliation; it is not an excuse to repeat a committed mutation.

## Free-plan capacity and remaining launch work

Workers Free currently allows 100,000 dynamic requests/day and 10 ms CPU per invocation. DO Free includes 100,000 requests/day and 13,000 GB-s/day; D1 and DO SQLite each have their own read/write/storage allowances. A protected API read generally adds **two DO requests and SQL writes**, plus cleanup alarms; mutations add more. Fan-out adds D1 session checks and personalized snapshots. The effective app capacity is substantially below 100,000 API calls/day. Test password-derivation CPU and workload under the actual account plan; local runtime success does not measure deployed Free-plan CPU enforcement.

Free-tier exhaustion can make the service unavailable. R2 is an included allowance with billable overage (10 GB-month, 1M Class A and 10M Class B Standard operations/month); app caps are not an account billing ceiling. Monitor account-wide Workers, DO, D1 and R2 usage and failures, including other apps sharing the account. Volumetric attacks consume ingress quotas even when the application returns 429; no in-Worker limiter solves that. On an owned zone, add and test available free WAF/rate-limiting controls before relying on them. No zone configuration is changed by these source changes.

Before public launch: resolve legal operator/contact placeholders; verify deployed secrets, Turnstile behavior, separate bindings, token scope, GitHub protections, account MFA and recovery; exercise signed-out/nonmember/banned-user actions and socket revocation; review public media and retention disclosures; establish quota/error monitoring and backups/recovery procedures. Password recovery and email verification are still absent. This change does not certify those operational requirements.

## Validation

Run `npm run build:static`, `npm run typecheck`, `npm test`, staging and production Wrangler dry runs, `npm audit`, and `git diff --check`. Tests include real workerd/D1/DO concurrency, cap rollback, session/membership revocation, streamed oversized JSON, challenge mismatch/outage and Retry-After behavior.

For local integration only, apply staging local migrations then run `npx wrangler dev --env staging --var LOCAL_TEST_MODE:true --ip 127.0.0.1 --port 8788`. Set `LOCAL_SMOKE_URL=http://127.0.0.1:8788` and run `node scripts/smoke-local.mjs`. The bypass requires the explicit variable AND a loopback HTTP request; it is absent from deployed configuration. Do not deploy it. Counter state persists locally; repeated signup smoke runs can correctly hit their quota.

Then run `node scripts/smoke-local-security.mjs` against the same loopback service for real HTTP-to-DO notifications, personalized votes, kick/rejoin, ban/revocation and password denial. Its synthetic IP header isolates local test counters; the real Cloudflare edge supplies client IP. Local workerd delivered server-initiated socket closure after about ten seconds during verification; REST membership denial and outbound authorization checks already apply during that delay. This observation is not a guaranteed production close timeout. PR/deploy validation also blocks high-severity dependency audit findings.

Official references: [Workers limits](https://developers.cloudflare.com/workers/platform/limits/), [DO pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/), [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/), [R2 pricing](https://developers.cloudflare.com/r2/pricing/), [Turnstile plans](https://developers.cloudflare.com/turnstile/plans/), [Turnstile widget API](https://developers.cloudflare.com/api/resources/turnstile/subresources/widgets/methods/create/).
