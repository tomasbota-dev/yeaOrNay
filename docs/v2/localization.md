# V2 localization plan

Public search pages added on 25 October 2026 use explicit `/en/` and `/pt/` URLs with complete paired records in `frontend/public-content.ts`. The path controls public language, independent of stored/browser preferences. Initial HTML includes language metadata and reciprocal alternatives. Account/legal CTAs carry a supported `lang` parameter, applied by the app before stored preferences. `Landing.tsx` remains covered by dictionary-key localization tests. See [SEO operations](../seo.md).

Security/realtime additions on 25 October 2026 include en-US/pt-PT signup configuration/challenge errors, capacity/rate-limit messages, password-confirmed deletion and immutable-email explanations. The widget receives the selected supported language. Localization tests now inspect `src/security.ts` and `Turnstile.tsx` as well as existing API/UI sources; user-authored room content and protocol message types are not translated.

Status: V2 localization implemented in `frontend/i18n.ts`, with full bilingual legal routes in `frontend/legal.tsx`. The terminology and acceptance checklist below guide review; the error-code contract remains a proposal rather than the current backend response format.

## Implemented API and verification

`useI18n()` returns `{ locale, setLocale, toggleLocale, t }`. `t(english, params?)` performs an explicit English-template dictionary lookup and named `{placeholder}` interpolation. Components call it before rendering; it never translates DOM text or user-authored content. `normalizeLocale()` restricts persisted `yn_locale` values to `en-US` or `pt-PT`; the hook sets document language, persists the preference, and synchronizes browser storage changes.

`translateError(error, locale)` maps current literal English API messages and dynamic field-length errors, with a localized generic fallback for unknown Portuguese errors. The backend returns English `error` strings alongside a top-level `code`; the frontend currently translates the readable message. The nested code/parameter contract below remains future work. UI count variants use explicit singular/plural templates rather than a new plural-message library. Dates and times use `Intl` in the selected locale.

`scripts/localization.test.mjs` checks interpolation parameter parity, literal backend-error coverage, dynamic field validation, locale normalization, unknown-error fallback, and literal/conditional React translation keys plus mapped UI option labels. Full privacy and terms sections exist in both languages with draft notices and missing operator details preserved. The privacy processing list additionally identifies profile photographs and the existing public-by-image-URL visibility. Installed-app manifest naming is language-neutral (`Yea or Nay`); route titles are translated.

## Language and terminology

Support `en-US` and `pt-PT`. Use informal singular Portuguese consistently. Distinguish account sign-in from entering a room. Translate all interface and assistive text; preserve user names, room names, ideas, comments, and codes exactly as authored.

| Meaning | English | Portuguese (Portugal) |
| --- | --- | --- |
| Account sign-in | Log in | Iniciar sessão |
| Account sign-out | Log out | Terminar sessão |
| Registration | Create account | Criar conta |
| Room creation | Create room | Criar sala |
| Room entry | Join room | Entrar na sala |
| Room exit | Leave room | Sair da sala |
| Dashboard | Your rooms | As tuas salas |
| Room owner | Host | Anfitrião |
| Idea submission | Publish idea | Publicar ideia |
| Optional explanation | Details (optional) | Detalhes (opcional) |
| Agree vote | In favour | A favor |
| Disagree vote | Against | Contra |
| Selected agree vote | You voted in favour | Votaste a favor |
| Selected disagree vote | You voted against | Votaste contra |
| Clear selection | Remove vote | Remover voto |
| Vote removed feedback | Vote removed | Voto removido |
| Vote changed feedback | Vote changed | Voto alterado |
| Own-idea explanation | You cannot vote on your own idea. | Não podes votar na tua própria ideia. |
| Closed vote explanation | Voting has ended. | A votação terminou. |
| Winning idea | Winning idea | Ideia vencedora |
| Tied result | It's a tie! | É um empate! |
| Closed room | Closed room | Sala encerrada |
| Image action | Upload photo | Carregar fotografia |
| Save action | Save changes | Guardar alterações |
| Share action | Copy link | Copiar ligação |
| Permanent deletion | Delete account | Eliminar conta |
| Feedback feature | Feedback | Dar opinião |
| Legal navigation | Privacy notice | Aviso de privacidade |
| Legal navigation | Terms of service | Termos de utilização |

Voting controls must show their meaning visibly, not only arrows or colour. Expose selection with `aria-pressed`; give the selected control a clear remove action, for example `Remover voto a favor em «{title}»`. The opposite control should communicate the available change, for example `Votar contra «{title}»`. Announce success in a live region. Removing an existing vote is a proposed V2 behavior requiring the final API contract to support it explicitly. Disable reasons must distinguish an own idea from a closed room.

## Message conventions

These are longer-term catalogue guidelines. V2 currently uses complete English templates as explicit dictionary keys, with separate singular/plural choices. Semantic IDs and a dedicated plural-message library have not been introduced.

- Store complete EN/PT catalogues in dedicated files with stable semantic IDs such as `rooms.create`, `votes.inFavour`, and `errors.roomNotFound`.
- Render translations explicitly within components. Remove whole-DOM exact-English-text replacement; it fails for symbols, names, counts, and composed sentences and can alter user content.
- Keep icons outside translated strings unless their position is genuinely linguistic. Translate complete sentences rather than concatenating translated fragments.
- Use named interpolation: `rooms.createdBy` accepts `{name}` and `{date}`; `votes.inFavourLabel` accepts `{title}`. Escape interpolated text through normal framework rendering. Do not accept HTML from translations or error parameters.
- Use plural-aware messages for members, ideas, comments, and votes. For example, `rooms.ideaCount`: EN `one: {count} idea`, `other: {count} ideas`; PT `one: {count} ideia`, `other: {count} ideias`. Provide explicit zero-state messages where they improve comprehension, such as `Ainda não há ideias.` Use locale plural rules instead of ad hoc suffixes.
- Format dates, times, and numbers through `Intl` with the chosen locale. Keep stored timestamps numeric/ISO. Do not translate user room codes or URLs.
- Normalize browser and persisted language to supported locales before catalogue access. Preserve the existing ability to select Portuguese for a Portuguese browser preference; an unsupported persisted value must not crash rendering.
- Persist the selected locale across authentication, direct room links, profile, legal routes, and refresh. Route changes must update document language and localized title/description.
- Development and CI should report missing IDs, unmatched interpolation parameters, and unequal catalogue keys. A production fallback should remain usable while logging the missing key; fallback must not conceal incomplete Portuguese in acceptance review.
- Localize labels, placeholders, tooltips, screen-reader text, modal controls, toasts, native/custom confirmation text, loading states, and validation. Browser-provided validation may follow browser language, so use application-controlled validation when consistent selected-language feedback is required.

## Proposed API error contract

Return language-neutral stable error codes with safe typed parameters. The frontend owns the chosen-language message. Keep HTTP status meaningful, and keep internal diagnostics out of user-visible messages.

```json
{
  "error": {
    "code": "IDEA_LIMIT_REACHED",
    "params": { "limit": 100 },
    "reference": "opaque-support-reference"
  }
}
```

| Code | Example parameters | PT message |
| --- | --- | --- |
| `AUTH_REQUIRED` | none | Inicia sessão para continuar. |
| `INVALID_EMAIL` | none | Introduz um endereço de e-mail válido. |
| `INVALID_PASSWORD_LENGTH` | `min`, `max` | A palavra-passe deve ter entre {min} e {max} caracteres. |
| `EMAIL_ALREADY_REGISTERED` | none | Este e-mail já está registado. Experimenta iniciar sessão. |
| `INVALID_CREDENTIALS` | none | O e-mail ou a palavra-passe não correspondem. |
| `RATE_LIMITED` | `retryAfterSeconds` | Demasiadas tentativas. Tenta novamente dentro de {duration}. |
| `ROOM_NOT_FOUND` | none | Não foi encontrada uma sala com esse código. |
| `ROOM_MEMBERSHIP_REQUIRED` | none | Entra nesta sala para continuar. |
| `ROOM_ACCESS_REMOVED` | none | O anfitrião removeu-te desta sala. |
| `HOST_PERMISSION_REQUIRED` | none | Só o anfitrião pode realizar esta ação. |
| `VOTING_CLOSED` | none | A votação terminou. Consulta o resultado. |
| `OWN_IDEA_VOTE_FORBIDDEN` | none | Não podes votar na tua própria ideia. |
| `IDEA_LIMIT_REACHED` | `limit` | Esta sala atingiu o limite de {limit} ideias. |
| `IMAGE_TOO_LARGE` | `maxBytes` | Escolhe uma imagem com menos de {size}. |
| `UNSUPPORTED_IMAGE` | none | Usa uma imagem JPG, PNG ou WebP válida. |
| `FIELD_REQUIRED` | allowlisted `field` ID | Localized field-specific instruction |
| `FIELD_TOO_LONG` | allowlisted `field` ID, `max` | Localized field-specific limit |
| `INTERNAL_ERROR` | optional reference | Não foi possível concluir a ação. Tenta novamente. |

`duration` and `size` above are localized display values derived by the frontend from numeric parameters. Unknown codes, malformed responses, and network errors need a Portuguese generic message. Support references may be displayed after a translated label. Do not translate raw English API messages or rely on string-prefix matching. During migration, adapt existing responses at one boundary until all endpoints follow the new shape.

## Audit findings to address

- `public/app.js:83–88`: exact-text DOM replacement misses composed text and risks translating user-authored text.
- `public/app.js:121,124`: badges with symbols, room counts, and primary dashboard actions remain English.
- `public/app.js:130,139–141`: invitation sentences, attribution, winner sentences, vote accessibility text, room metadata, and counts are not reliably localized.
- `public/app.js:172,202,204–205,224–237`: deletion/feedback content, moderation prompts, copy notifications, and direct toast/confirm strings are incomplete or bypass translation.
- `public/app.js:71–81,104` and API error paths in `src/index.ts`: most room, image, membership, voting, feedback, expiry, and generic errors leak English.
- `public/privacy.html` and `public/terms.html`: full content remains English with only Portuguese summaries; both ignore selected language. Keep publisher placeholders visible until actual details are supplied. Translation must preserve policy meaning.
- `public/legal.js:10–11`: theme labels remain English. Its head-loaded script also selects the theme button before parsing the body; fix through the shared V2 shell rather than copying the lifecycle bug.
- `public/index.html` and `public/manifest.webmanifest`: title/descriptions are English. Set an explicit localization policy for installed-app metadata.
- Existing dictionary overrides disagree on `Winner`, `Room closed`, and `Start a room`; replace duplicate entries with context-specific IDs.
- Review sample graphics copy as well: `Noodles e dumplings` is partly English, and `deixem o plano vencedor escolher-se` should be rewritten naturally.

## Acceptance coverage

- [ ] EN/PT key parity and interpolation/plural checks pass; unsupported stored locales render safely.
- [ ] Landing graphics, navigation, footer, CTA states, loading content, and document metadata follow chosen language.
- [ ] Login/signup validation, duplicate accounts, rate limits, expired sessions, failures, and support references render in Portuguese.
- [ ] Dashboard covers empty, one-room, many-room, active/closed, 0/1/many members and ideas, and long titles.
- [ ] Room creation covers presets/custom deadlines, invalid dates, image type/size failures, and partial upload failure.
- [ ] Room links cover signed-out entry, non-member preview, invalid/expired code, and removed/banned membership.
- [ ] Voting covers neutral/selected/changed/removed, own idea, closed room, race with deadline, winners, ties, and no ideas.
- [ ] Ideas/comments cover empty and populated states, max lengths, validation, and author attribution without changing user content.
- [ ] Member management covers kick/ban/leave/delete/end-voting prompts, success, and permission failures.
- [ ] Sharing covers link/code success and clipboard failure fallback.
- [ ] Profile covers save, duplicate email, photo upload/removal failures, and full account deletion/host-transfer explanation.
- [ ] Feedback covers ratings, optional message, validation, success, and failure.
- [ ] Terms/privacy contain full reviewed Portuguese copy, shared navigation, preserved locale/theme, localized dates, and direct-route support.
- [ ] Keyboard and screen-reader review checks accessible names, selected vote announcement, live feedback, modal controls, and disabled reasons.
- [ ] Mobile and desktop checks confirm Portuguese text fits buttons, cards, dialogs, and navigation.
- [ ] Verify both chosen-language/browser-language combinations and language persistence through refresh and direct routes.

Audit references describe the pre-V2 source and should be refreshed when implementation changes those files.
