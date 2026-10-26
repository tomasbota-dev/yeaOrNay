# ADR 0004: Abuse controls and hibernating room notifications

Date: 2026-10-25. Status: accepted for staging implementation.

## Context

The Worker/D1/R2 application originally throttled only an IP-and-email login pair. Signup, writes, uploads and snapshots could exhaust shared resources. The client loaded personalized full-room snapshots every seven seconds even without changes. Public use requires bounded operations, server-side authorization and explicit free-plan capacity handling.

## Decision

Use separate SQLite-backed Durable Object namespaces for strict abuse counters and room WebSocket hubs. Wrangler creates them through SQLite class migrations in Actions deployment; staging and production Workers own independent namespaces. No external or paid realtime service is introduced.

The limiter uses one hashed actor/policy key per object and synchronous SQL admission. Limits combine IP, account, action and selected room-wide policies. A single-row counter expires through an alarm. This avoids the old non-atomic D1 check/update and unbounded persistent attempt records. Rejections include Retry-After; a failed limiter returns 503 rather than admitting unprotected traffic. Limits apply before password derivation and expensive route work wherever identity permits.

Use a free managed Turnstile widget for signup, verified by Siteverify with expected hostname and `signup` action. The backend rejects absent, expired, replayed or invalid tokens. Actions checks/creates the selected environment's widget and installs the secret directly in its Worker. Public config returns only the site key and availability. Permission/setup failure produces a warning and disables signup; it never falls back to unchallenged signup. Explicit loopback-only HTTP local-test mode supports automated local tests and is absent from deployment config.

D1 triggers enforce storage caps and write-time membership/voting conditions under concurrency. Related room creation and ban operations use D1 batches. Image replacements use compare-and-swap with cleanup of rejected new objects. Image structure/dimensions are inspected without decoding compressed pixels; this is not a full decoder or sanitization service.

Room writes remain authorized REST operations, with D1 authoritative. A room's private Durable Object receives an invalidation after commit. It broadcasts only `{type:"room-changed"}` after checking each socket's current session and membership. No personalized `my_vote`, account email or room snapshot is broadcast. Sockets use the hibernation API, serialized identity attachments, and notification-only messages. External HTTP routes cannot address the hub's internal notify interface.

The client refetches its own snapshot on connection, notification, reconnect, foregrounding and the voting deadline. It pauses subscriptions while hidden, queues changes during mutations/in-flight loads, and backs off errors/429. Degraded polling starts at 30 seconds; connected sockets have a two-minute reconciliation to recover lost post-commit notifications. The dashboard refreshes at 60 seconds.

## Alternatives

- SignalR solves the same transport problem but adds an ASP.NET/server service to this Worker stack.
- SSE supports one-way updates, but still needs cross-request coordination. A D1-query loop merely relocates polling and lacks the selected documented WebSocket hibernation behavior.
- Workers rate-limit bindings are lighter but approximate and per-location. Their official documentation did not explicitly confirm free entitlement during this review; they are not used for strict global caps.
- WAF rate limiting can reject requests before Worker execution, but Free zones have limited rule capacity and require a controlled zone. It supplements rather than replaces account-specific application controls. Existing workers.dev routes are not assumed to receive the account's configurable zone rules.

## Consequences

DO calls/SQL writes themselves consume quotas. Most authenticated reads perform two limiter calls; mutations perform additional action/room checks. Session rechecks and personalized snapshot fan-out scale with connected participants. The application can exhaust free quotas before reaching the headline Worker request allowance; this is a bounded small-launch architecture, not unlimited free capacity.

Notification failure does not turn a committed mutation into a retryable API failure. Safety reconciliation repairs missed events. Authorization is still checked before any subsequent notification, so stale sockets do not receive room data. Idle sockets can remain until another event/foreground/reconnect, but contain no data stream without fresh checks.

R2 allowances have billable overage. Limits constrain app growth but do not guarantee a zero bill, protect alternate services in the account, or prevent volumetric exhaustion of Worker/DO quota. Account limits, monitoring and zone-level protection must be reviewed operationally. See the [operations guide](../v2/public-launch-security.md).

## Sources

- [Durable Objects pricing/free plan](https://developers.cloudflare.com/durable-objects/platform/pricing/)
- [WebSocket hibernation](https://developers.cloudflare.com/durable-objects/best-practices/websockets/)
- [Turnstile validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)
- [Workers rate-limit binding](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)
- [WAF rate-limiting availability](https://developers.cloudflare.com/waf/rate-limiting-rules/)
