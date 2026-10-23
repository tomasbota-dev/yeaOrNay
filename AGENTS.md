# Repository workflow

- Never push directly to `main` or `staging`, including administrator bypasses.
- Start each change from the latest `origin/staging` on a `feature/<description>` or `bugfix/<description>` branch.
- Open a PR into `staging`; merging deploys the isolated staging environment.
- Production releases use a PR from this repository's `staging` branch into `main`.
- Keep staging after releases. Use merge commits for promotion PRs to preserve shared history.
- Cloudflare provisioning belongs in GitHub Actions: check whether resources exist and create missing resources before migrations and deployment. Keep staging and production data separate.
- Run static asset generation, TypeScript checking, policy tests, and Wrangler dry runs for both environments when changing deployment configuration.
