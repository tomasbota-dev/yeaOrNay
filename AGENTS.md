# Repository workflow

- Never push directly to `main` or `staging`, including administrator bypasses.
- Start each change from the latest `origin/staging` on a `feature/<description>` or `bugfix/<description>` branch.
- Open a PR into `staging`; merging deploys the isolated staging environment.
- Production releases use a PR from this repository's `staging` branch into `main`.
- Use squash merges for all PRs, including staging-to-main production promotions. Merge commits and rebase merges are disabled.
- Keep staging after releases. Squashed promotions do not preserve shared commit ancestry; review the file diff and validate each release even if earlier commits reappear in the PR history. Never reset or force-push staging to align histories.
- Merged `feature/*` and `bugfix/*` branches are deleted by Actions. Keep repository-wide automatic branch deletion disabled so `staging` is retained after releases.
- Cloudflare provisioning belongs in GitHub Actions: check whether resources exist and create missing resources before migrations and deployment. Keep staging and production data separate.
- Run static asset generation, TypeScript checking, policy tests, and Wrangler dry runs for both environments when changing deployment configuration.
