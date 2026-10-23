# V2 audit register

Date: 2026-10-23. Read-only source review; items below remain open. Line references describe the discovery baseline and may move during implementation.

| Area | Evidence | Required follow-up |
| --- | --- | --- |
| Voting | `public/app.js:139` uses small arrows and net score; selected state relies on color | Prototype labeled controls, explicit selection, reasons for disabled states, and change/remove feedback |
| Composer | `public/app.js:141` places composer after ideas and uses single-line details | Move composition above stream, multiline details, retained draft and submit/error states |
| Dynamic translation | `public/app.js:83-88,121-141` exact-node lookup misses decorated/interpolated text | Replace with explicit localized templates; never translate user content |
| Dialogs and notifications | `public/app.js:172,202-205,224-237` includes untranslated confirmations, feedback, deletion, moderation, and copy messages | Include all success/error/destructive states in translation inventory |
| Server errors | `src/index.ts` error responses and `public/app.js:104` | Stable error codes and localized client mapping |
| Legal integration | `public/privacy.html`, `public/terms.html`, `public/legal.js` | Full translated documents, shared shell, preserved legacy links and draft notices |
| Legal theme script | `public/legal.js:10-11` queries a control before body markup exists | Verify script timing; remove duplicate implementation with shared shell |
| Locale resilience | `public/app.js:12` indexes stored locale without normalization | Normalize locale and detect missing keys in development |
| Metadata | `public/index.html`, `public/manifest.webmanifest` | Localized route titles/descriptions and manifest strategy |
| Secret-file prevention | `.gitignore` ignores `.dev.vars` only | Add `.dev.vars.*` coverage; no such credential files found tracked |
| Upload privacy | `src/index.ts:428-431` serves photos/icons publicly by UUID with public caching | Decide intended visibility before changing access or making privacy claims |
| Credential exposure | Tracked files, eight embedded browser assets, 30 reachable commits / 128 unique blobs scanned heuristically | No confirmed leak; review does not cover remote-only/deleted refs, unreachable objects, Actions logs/artifacts, or Cloudflare account settings |

## Localization acceptance coverage

Landing; auth; invitations; dashboard; active/closed/tied rooms; voting; composition; comments; host/member moderation; sharing; profile/photo/deletion; feedback; upload failures; session expiry; empty/loading/error states; legal content; accessibility; titles and preferences. Verify Portuguese wording manually, equal locale key sets, 0/1/many counts, long names, persistence, and untranslated user content.

## Review scope

No application fixes, production changes, token rotations, or migrations occurred in discovery. Security findings distinguish resource identifiers from credentials. Runtime access uses Worker bindings; deployment credentials are referenced through GitHub secrets. Generated type declarations and package-lock reference examples were excluded from the history credential-content scan.
