# ADR 0001: V2 client architecture

- Status: Accepted
- Date: 2026-10-23

## Context

The current app already uses client-side navigation, but one large JavaScript module combines templates, state, requests, and fragile text replacement. V2 needs shared layouts, clearer interactive states, predictable localization, and maintainable components.

## Decision

Use React with TypeScript and Vite for a client-rendered SPA. Keep the existing Worker API, D1/R2 bindings, and cookie-based sessions. Add client routes for legal articles and preserve old legal URLs. Retain API behavior unless an explicit contract change is documented.

## Alternatives

- Keep vanilla JavaScript: smallest dependency change, but requires substantial manual component/state infrastructure for V2.
- Angular: viable SPA framework with integrated conventions; introduces a larger architectural shift for this small existing application.
- Next.js: viable on Cloudflare with its supported adapter, but server rendering adds deployment/runtime concerns without a demonstrated requirement in the current product.

## Consequences

Introduce frontend dependencies and a separate asset build. Define routing, error handling, accessibility, locale keys, and state ownership before feature agents work independently. Public landing metadata and search visibility require explicit verification because client rendering does not by itself guarantee indexing quality. Validate deep links and session/invite preservation.

Acceptance requires a reviewed prototype and successful local/staging build and routing checks. Implementation is delivered through the V2 PR and staging promotion workflow.
