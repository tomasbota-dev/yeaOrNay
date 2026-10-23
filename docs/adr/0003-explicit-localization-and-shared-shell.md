# ADR 0003: Explicit localization and a shared application shell

- Status: Accepted
- Date: 2026-10-23

## Context

Exact-text DOM translation fails on interpolated names, counts, and decorative symbols and may translate user content accidentally. Browser confirmations and many API errors bypass it. Separate English legal documents do not share locale or account navigation.

## Decision

Use stable message IDs with parameters, plural handling, and locale-aware formatting for en-US and pt-PT. Normalize stored locale values. Require matching key sets and visible missing-key failures during development. Render user content unchanged. Map stable API error codes to client messages with a localized generic fallback.

Use one application shell for public, authenticated, and legal routes, with appropriate navigation variations. Provide full legal documents in both languages; preserve operator placeholders and draft status until actual content is supplied and reviewed. Keep legacy legal URLs working.

## Alternatives

Continuing DOM replacement is superficially cheaper but cannot reliably distinguish composed interface text from user content. Keeping legal pages separate would duplicate navigation, preference handling, and localization behavior.

## Consequences

Translation work includes accessible labels, dialogs, document titles, errors, and metadata. Installed-app manifest localization needs an explicit implementation choice. Validate 0/1/many values, persisted locale on deep links, unsupported stored locales, and user content equal to an English message.

Use consistent European Portuguese terminology: palavra-passe, guardar, carregar fotografia, ligação, and informal singular tu. Distinguish account sign-in from room entry. Prototype clear Portuguese vote labels such as A favor/Contra before finalizing wording.
