# Changelog

Changes are recorded before release. A staging merge does not constitute a production release.

## Unreleased

### Search discovery

- Set `https://yeaornay.me` as the primary SEO origin and production signup-protection hostname. Canonical/language/social URLs and the sitemap use `.me`; alternate domains and the old Workers hostname remain excluded from indexing. Cloudflare alias redirects and search ownership verification remain external setup steps.

- Prerender English/European Portuguese public homepages and dinner, movie-night, weekend and voting-rules guides, with canonical/language links and social metadata in initial HTML.
- Separate public rendering from session/API availability; reuse the existing landing design and optional animation/theme controls.
- Add production-only sitemap and robots policy; exclude account/room/API/media URLs, legal drafts, staging and previews from indexing. Return real 404s for unknown paths.
- Replace global SPA fallback with explicit app routes. Root retains a signed-in dashboard shortcut and anonymous language-aware homepage redirects.
- Add SEO tests, operational guide and ADR 0005. No billing, ads, analytics or monetization changes. Search ownership verification/submission remains an operator step after release.

### Security

- Add atomic, expiring Durable Object rate limits for API/media access, login, signup, room actions, uploads and sensitive operations. Rate-limit responses include stable codes and Retry-After; unavailable protection fails closed.
- Verify signup Turnstile tokens on the server, including hostname and action. Actions creates or reuses a separate free managed widget per environment and installs its secret without including it in artifacts. Missing setup disables signup.
- Enforce actual JSON/upload byte limits and JSON content types; inspect raster format and dimensions, with a 2048-pixel/4-megapixel limit.
- Add D1-enforced account, room, membership, idea, comment, feedback and session caps. Guard writes against concurrent room closure and membership removal; batch room creation and bans transactionally.
- Require password confirmation for account deletion. Disable email changes until an ownership-verification workflow exists. Cap sessions at five and revoke evicted sessions' live subscriptions on login.
- Require matching Origin for mutations and WebSocket handshakes. Compare-and-swap image replacements clean up losing uploads.
- Pin patched Undici 7.30.1 in development tooling; add local runtime security and concurrency tests.

### Live updates

- Replace seven-second full-room polling with authenticated hibernating WebSocket change notifications and debounced personal snapshots.
- Recheck session and room membership before notifications; disconnect removed members and reject client socket mutations.
- Add connection caps, hidden-tab disconnect, reconnect backoff, degraded fallback and two-minute safety reconciliation; dashboard refreshes every minute.

### Operations and documentation

- Declare verified environment Turnstile hostnames so provisioning does not need account-subdomain discovery permission. Setup warnings report only safe HTTP status/error codes and endpoint paths to identify missing permissions without echoing secrets.

- Add security/realtime ADR, deployment/setup and capacity guide, and repository requirements for documentation, changelog entries and deployment evidence.
- D1 migration `0005_public_launch_guards.sql` and SQLite Durable Object migration `v1-security-realtime` are required. No paid service or account-plan upgrade is enabled by this change.
- Public-launch requirements still include operator/contact details, deployed Turnstile confirmation, account/zone security review and usage monitoring. Email verification and password recovery remain unavailable.
