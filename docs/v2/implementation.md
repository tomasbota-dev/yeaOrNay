# V2 implementation and release notes

## Security and live updates (25 October 2026)

`src/security.ts` handles bounded JSON/images and signup verification. `src/abuse.ts` supplies strict expiring SQLite DO counters. `src/realtime.ts` supplies a Worker-private hibernating room hub. `src/index.ts` authenticates handshakes and mutations, notifies after commit and applies route-specific limits. D1 migration 0005 enforces storage caps and critical write-time checks under concurrency.

`frontend/Turnstile.tsx` loads the official explicit-render widget. `App.tsx` uses notification-driven snapshots, preserves queued changes, and backs off degraded requests. Account email is read-only; deletion submits a password in JSON. See [the operational guide](public-launch-security.md) for exact policies, setup and failure behavior, and [ADR 0004](../adr/0004-abuse-controls-and-room-realtime.md) for tradeoffs. Daily cleanup and public media policy remain in force.

React renders the approved decision-board design. Vite emits hashed JS/CSS and a shared document into `dist/client`. Wrangler routes API, uploaded media, and legacy legal URLs to the Worker; other assets/navigation use Static Assets. The Worker accesses D1/R2 through bindings. Same-origin requests use cookie credentials.

Direct room/legal/profile links resolve to the shell. Cloudflare's configured SPA fallback also returns the shell for unmatched asset URLs; deployed hashed asset URLs must be checked for correct MIME type and content. CI packages `dist/client` and `dist/worker` together before publishing with the provisioned environment configuration.

## Data compatibility

No schema migration is required. Preserve accounts, rooms, votes, comments, and uploads. Errors retain `error` and gain `code`; explicit vote `0` clears a vote, and repeated same-direction votes retain toggle behavior. Images retain existing public-by-URL access; privacy changes require a separate access/cache decision.

## UI conventions

Use editorial type, ivory/ink/cobalt tokens and distinct voting states. Idea cards group content/votes; labels indicate selection as well as color. Creation uses a modal, focus containment, Escape/close/cancel and restored focus. Custom image controls preserve accessible file inputs. Inline validation focuses the first invalid field. Preserve drafts and prevent duplicate mutations.

The landing explains idea → vote → decision without a video host. Respect reduced motion, narrow widths, keyboard focus and contrast. Legal articles share navigation/preferences/account state. Signed-in `/` shows the dashboard; invite paths survive auth.

## Release checks

- Build assets, typecheck both projects, run policy/provisioning/application tests, and dry-run both environments.
- With local migrations applied and Wrangler running, run `node scripts/smoke-local.mjs` for real local D1/R2 auth, permissions, room/vote/comment, profile/upload, feedback and result checks. It refuses remote hosts and cleans up the accounts it creates.
- Exercise auth, invite deep links, create/join, ideas/comments, vote changes/removal, own-idea restrictions, moderation and ties.
- Exercise profile/photo/deletion, upload limits/type failures, feedback, busy/error/empty states, copy, locale/theme persistence and old legal links.
- Inspect mobile/desktop, modal keyboard behavior, custom validation and reduced motion.
- Confirm staging Actions and live assets before promoting staging to main through a squash-merged PR. Use squash merges for feature/bugfix PRs too. Verify production separately.

## Rollback

Revert V2 through another feature/bugfix PR into staging, validate, and promote normally. Revert frontend and Worker together. No schema rollback is expected; never overwrite production data to roll back a UI change.
