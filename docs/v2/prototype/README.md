# V2 design prototype

Open `index.html` in a browser, or serve the repository with a local static server and visit `/docs/v2/prototype/`.

This is a standalone design study with sample data. It does not connect to accounts, rooms, Cloudflare, or production APIs. Votes and newly added ideas exist only in the current tab. No assets, fonts, packages, or services are fetched remotely.

## Review sequence

1. The landing page introduces the visual identity through type, product cards, and a scroll-driven zoom. The same visual vocabulary continues into application screens.
2. Your rooms demonstrates active and completed decisions and the two main entry actions.
3. A room demonstrates the above-feed editor, labeled Yea/Nay choices, selected-vote state, change/remove behavior, and final-result preview.
4. Privacy demonstrates the shared site shell and comfortable reading layout. Its illustrative text is not a legal policy.

Review at desktop and narrow mobile widths, with keyboard navigation, and with reduced motion enabled. Review the actual landing scroll before approving the motion direction.

## Design rationale to capture in the design-system documentation

- **Identity:** warm ivory, near-black ink, cobalt brand actions, affirmative pale green, negative coral. Meaning also appears in text, icons, borders, and selection markers.
- **Typography:** large, tight display text for short headings; readable neutral body text; monospace for small status/metadata. Production typography must be checked with complete pt-PT strings.
- **Composition:** strong rules and open space, quieter application screens, expressive product-native graphics on marketing screens.
- **Components:** site shell, room card, status badge, idea editor, idea card, vote group, result panel, invitation panel, legal article.
- **Motion:** scroll zoom explains how ideas become a plan; normal scrolling remains available; reduced motion removes the transform.
- **Interaction:** voting has explicit labels and persistent selection; repeated activation removes the vote. Production must retain backend voting rules and validate all responses.
- **Responsive behavior:** room side content moves below the main feed; editor and votes retain visible labels; navigation remains reachable.

Before implementation, document final tokens, component states, keyboard/focus rules, error/loading/empty states, translation-key conventions, vote semantics, and mobile screenshots. Resolve them together with the SPA architecture ADR so the interface and implementation use the same rules.

## Deliberate prototype boundaries

Only English copy is included. A full pt-PT revision belongs in the implementation and language audit. Sample room creation/join actions lead to the demo room; copy link copies this prototype URL; result preview uses the sample leading idea. The final-result state is illustrative and is not a production scoring algorithm. Existing legal drafts and unresolved publisher details remain separate legal work.
# Authentication review

The sign-in and sign-up studies use the same editorial visual language as the landing and rooms. Keep email/password authentication and the existing signup name and age confirmation requirements. Do not imply password recovery or social providers are available. Demo submissions must not authenticate, persist credentials, or accept binding terms. Review field labels, autofill, password visibility, focus, native validation, and mobile stacking. Full pt-PT coverage belongs to the implementation phase.

## Review refinements

Form validation now uses custom inline messages instead of browser pop-ups across authentication, room creation, and idea composition. Invalid controls expose `aria-invalid` and linked error text; submission focuses the first invalid field, and errors update as users correct input. Coverage includes required/whitespace-only fields, email format, signup password length, age confirmation, and future custom deadlines. These custom messages supersede the initial native-validation treatment described in earlier review notes.

Design direction approved by the user on 23 October 2026, subject to create-room opening as a modal and using a custom image picker. These refinements are now represented in the study. Architecture ADRs remain proposed until implementation decisions are finalized.

Create-room opens a native modal dialog over the dashboard, with trapped focus, Escape/cancel/close dismissal, backdrop dismissal, scroll containment, and focus restoration to the dashboard trigger. The image picker uses a styled control over the native accessible file input, shows the filename, and previews locally. The legacy study `#create` link opens the same modal rather than a dedicated page.

Final approval refinement: the walkthrough title and step labels have reserved space above the transformed cards, with the caption below. Verified visually at the narrow review window and a 390px mobile width. Modal dismissal via Escape restores focus to Create a room. The user approved the design subject to these final refinements, which are now implemented in the study.

The landing explanation is one naturally wrapping sentence, aligned with the bottom of the headline on wide layouts. The scroll sequence demonstrates suggesting, voting, and deciding; a separate video section would duplicate this explanation. A shortcut takes visitors straight to that demonstration.

Idea entries now have separate surfaces, fine borders, spacing, and a divided voting row. Text inputs use an active underline and subtle background instead of a blue rectangular outline; keyboard focus remains visible.

The create-room study uses the existing supported question/name limit and voting durations. Any selected image is a local preview; demo creation does not provision a backend room or upload a file. Review the empty state and invite controls after creation, alongside cancellation and native validation.
