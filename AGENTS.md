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

# Documentation and validation

- Update relevant documentation in the same PR whenever behavior, security controls, configuration, operational procedures, or architecture changes. Create documentation when no suitable guide exists.
- Record user-visible changes, security fixes, and required setup/migration steps in `CHANGELOG.md` under Unreleased; date a release only when actually released.
- Add or update an ADR for material architecture decisions, including alternatives, costs/free-plan limits, and failure behavior.
- Keep en-US and pt-PT text complete, including errors and accessibility labels. Security changes require meaningful denial, boundary, and concurrency tests where applicable.
- Never describe a push, dry run, or passed unit suite as a verified deployment. Check Actions and the served environment after merging; disclose setup blockers and remaining launch requirements.
