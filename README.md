# Yea or Nay

A mobile-first app for making plans together. Create a room, share its code, add ideas, vote Yea or Nay, and see the result when voting ends.

## V2 architecture

- React + TypeScript SPA built with Vite in `frontend/`.
- Workers Static Assets serves `dist/client`; API and image routes use `src/index.ts`.
- D1 stores accounts, sessions, rooms, ideas, votes, comments, and feedback. R2 stores uploaded images.
- Explicit English/European Portuguese messages. Legal articles share navigation, language, and theme; their content remains a launch draft with unresolved operator details.

See the [approved study](docs/v2/prototype/README.md), [implementation notes](docs/v2/implementation.md), [ADRs](docs/adr/0001-v2-client-architecture.md), [localization guide](docs/v2/localization.md), and [security review](docs/v2/security.md).

## Local development

```sh
npm ci
npm run db:local
npm run dev
```

Wrangler serves frontend/API, normally at `http://localhost:8787`. `predev` builds the SPA. Rebuild after frontend edits, or run `npm run dev:ui` in another terminal for Vite hot reload; it proxies API/media to Wrangler at `127.0.0.1:8787`.

For isolated local staging: `npm run db:staging:local`, then `npm run dev:staging`. Local data stays in ignored `.wrangler/`. Never commit credentials/local environment files.

```sh
npm run build:static
npm run typecheck
npm test
npx wrangler deploy --env staging --dry-run --outdir dist/staging
npx wrangler deploy --env="" --dry-run --outdir dist/production
```

`build:static` generates Vite assets instead of an embedded TypeScript map. `npm run build` is an alias. Worker/DOM TypeScript configs are separate. Deploy frontend assets and Worker together.

## Product behavior

Signed-out visitors see the landing; signed-in users see their dashboard. Invite paths survive authentication. Rooms support preset/custom future deadlines, images, ideas, comments, vote changes/removal, tied winners, and moderation. Users cannot vote on their own ideas. Hidden tabs pause polling.

Profile contains name, email, photo, and deletion. The account menu contains Profile and Log out. Authentication uses secure HttpOnly cookies. Password recovery and email verification are not implemented.

`/privacy` and `/terms` share the application shell; legacy `.html` links redirect. Legal drafts retain incomplete operator/contact details. The manifest uses the language-neutral brand; page metadata follows the chosen locale.

## Branches and releases

Start from current `origin/staging` on `feature/*` or `bugfix/*`. Open a PR into `staging`; required policy/application checks precede merging. Merge deploys staging. Promote through a same-repository `staging` → `main` PR using a merge commit. Never push directly to protected branches.

Actions deletes merged feature/bugfix branches only. Keep repository-wide automatic branch deletion disabled so `staging` survives releases.

## Cloudflare environments and CI

| Resource | Production (`main`) | Staging (`staging`) |
| --- | --- | --- |
| Worker | yea-or-nay | yea-or-nay-staging |
| D1 | yea-or-nay-db | yea-or-nay-staging-db |
| R2 | yea-or-nay-room-icons | yea-or-nay-staging-room-icons |

Accounts/uploads are separate. Do not copy production data to staging. Actions resolves the placeholder staging database UUID by name before migrations/deployment.

PR checks build assets, typecheck both projects, run tests, and dry-run both environments without credentials. Merges run jobs in order:

1. Build: package `dist/client` and bundled Worker under `dist/worker` together.
2. Provision: reuse/create D1/R2 resources for the selected environment.
3. Migrate: apply D1 migrations using resolved configuration.
4. Deploy: publish `dist/worker/index.js` with `dist/client` assets and resolved config.

Configure GitHub variable `CLOUDFLARE_ACCOUNT_ID` and environment secret `CLOUDFLARE_API_TOKEN` with D1 Edit, Workers R2 Storage Edit, and Workers Scripts Edit permissions. Credentials never enter frontend assets. Database IDs and bucket names identify resources, without granting access.

Both environments retain daily cleanup. Migrations must remain compatible with the running Worker because they precede deployment. Verify Actions and the real Workers hostname after merging; a push alone is not deployment proof. Static hosting can run without usage charges, but API/D1/R2 usage remains subject to Cloudflare allowances. See [SPA routing](https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/).
