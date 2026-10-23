# Yea or Nay

A tiny, mobile-first way for friends and family to pick a plan together. Create a room, share its code, gather ideas, vote, and see the winner when the timer ends.

## What it does

- Email/password signup and login with secure, expiring HttpOnly sessions
- Create rooms with 15-minute, 30-minute, 1-hour, 3-hour, or 24-hour voting windows
- Join by an easy-to-share room code
- Add ideas and optional details
- Upvote or downvote other people’s ideas; you cannot vote on your own
- Comment on ideas
- Room updates every five seconds while open
- The host can end voting early; otherwise the first request after the deadline closes voting
- The highest-scoring idea wins. Tied ideas share the win.
- Mobile-responsive layout, app icon, and browser theme colors

## Stack

- Static HTML, CSS, and JavaScript served by one Cloudflare Worker
- Cloudflare D1 (SQLite) for accounts, rooms, ideas, votes, and comments
- No client-side framework, realtime service, email provider, or paid API

The whole app is a single small Worker bundle to keep deployment simple. Page assets are also served by the Worker, so they use the Workers request allowance; active rooms poll every five seconds. This is sized for small friend and family groups.

## Local development

```sh
npm install
npm run db:local
npm run dev
```

Open the URL printed by Wrangler (usually `http://localhost:8787`). Local data lives under `.wrangler/` and is ignored by Git.

## Branches and releases

Start every change from the latest origin/staging on a feature/<description> or bugfix/<description> branch. Open a PR into staging. After the required Branch policy and Validate application checks pass, merge to deploy staging. Test staging, then open a PR from staging into main to release production.

Use merge commits for release PRs to preserve shared history. Keep staging after releases. Both branches require PRs and checks, including for administrators. Direct pushes, force pushes, and branch deletion are blocked. See AGENTS.md for contributor instructions.

## Cloudflare environments

Merged `feature/*` and `bugfix/*` branches in this repository are automatically deleted by the branch cleanup workflow. Closed, unmerged PRs and branches with newer commits are left alone. Other branch names, including `staging` and `main`, are never deleted by this workflow. Repository-wide automatic branch deletion stays disabled so release PRs preserve `staging`.

| Resource | Production (main) | Staging (staging) |
| --- | --- | --- |
| Worker | yea-or-nay | yea-or-nay-staging |
| D1 database | yea-or-nay-db | yea-or-nay-staging-db |
| R2 bucket | yea-or-nay-room-icons | yea-or-nay-staging-room-icons |

Staging uses a named Wrangler environment with explicit bindings. Production keeps its existing top-level configuration and resource names. Accounts, sessions, uploads, and all other data are separate. Staging starts empty; production data is never copied. Both Workers run the daily cleanup cron.

For local staging development, run npm run db:staging:local and npm run dev:staging. The committed staging UUID is a placeholder; Actions resolves the real database UUID by name before migrations and deployment.

## GitHub Actions

PR checks enforce feature/* or bugfix/* into staging, and same-repository staging into main. They build assets, check TypeScript, test branch policy, and dry-run both Worker configurations without Cloudflare credentials.

Merges into staging or main run separate jobs:

1. **Validate and build** generates static assets, checks types, tests branch policy, and uploads the validated Worker bundle.
2. **Provision D1 and R2** checks the selected environment's resources by name, reuses existing resources, creates missing resources, and uploads the resolved Wrangler configuration.
3. **Apply database migrations** downloads that config and applies pending migrations to the selected database.
4. **Deploy Worker and cron** publishes the validated bundle with the resolved config. Wrangler creates the Worker if absent.

Each job waits for the previous job to succeed. Deployments are serialized per branch and use separate staging and production GitHub Environments. Manual runs are allowed only on these two branches. Migrations must remain compatible with the currently deployed Worker because they run before deployment; deployment failures do not roll back migrations.

Repository configuration:

- Variable CLOUDFLARE_ACCOUNT_ID with the Cloudflare account ID.
- Secret CLOUDFLARE_API_TOKEN with account-scoped D1 Edit, Workers R2 Storage Edit, and Workers Scripts Edit permissions.

Credentials stay in Actions. Resolved database IDs pass between jobs as an artifact; provisioning does not commit generated configuration or push to protected branches. The same workflow provisions either environment.

The Workers publish to separate workers.dev subdomains; find their URLs in deployment logs. See [Wrangler environments](https://developers.cloudflare.com/workers/wrangler/environments/) for binding behavior.

## Account recovery

This initial version does not verify email or send password reset messages. Keep your password safe; password recovery requires adding an email delivery provider later.
