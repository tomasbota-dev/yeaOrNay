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
- Mobile-responsive layout and installable web app manifest

## Stack

- Static HTML, CSS, and JavaScript served by one Cloudflare Worker
- Cloudflare D1 (SQLite) for accounts, rooms, ideas, votes, and comments
- No client-side framework, realtime service, email provider, or paid API

## Local development

```sh
npm install
npm run db:local
npm run dev
```

Open the URL printed by Wrangler (usually `http://localhost:8787`). Local data lives under `.wrangler/` and is ignored by Git.

## Cloudflare deployment

The D1 database `yea-or-nay-db` is provisioned in Cloudflare. `wrangler.jsonc` contains its ID and the Worker config. Sign in to Wrangler if needed, then:

```sh
npx wrangler login
npm run db:remote
npm run deploy
```

The Worker is published on its `workers.dev` subdomain. A custom domain is optional. Review the [Workers limits](https://developers.cloudflare.com/workers/platform/limits/) and [D1 pricing and limits](https://developers.cloudflare.com/d1/platform/pricing/) before a larger launch; free-plan quotas are daily caps, and requests can fail when a cap is reached.

## GitHub

To create a private remote from this folder after authenticating `gh`:

```sh
gh auth status
gh repo create tomasbota-dev/yeaOrNay --private --source . --remote origin --push
```

## Account recovery

This initial version does not verify email or send password reset messages. Keep your password safe; password recovery requires adding an email delivery provider later.
