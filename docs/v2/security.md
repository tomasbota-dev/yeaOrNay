# V2 security review

## Implementation follow-up

The V2 implementation adds `.dev.vars.*` ignore coverage and serves Vite-built frontend assets from Workers Static Assets. The old embedded asset map is retired. The client receives no D1/R2 authentication credentials. API errors retain their existing message and add a stable code. Explicit vote clearing remains subject to authentication, membership, own-idea and closed-room restrictions. Worker boundary regression tests and a loopback-only D1/R2 smoke script validate these behaviors.

Image visibility remains public to anyone with the URL, as in V1. This release does not claim private room media. The historical audit below records its original scope; it does not certify Cloudflare account settings, remote-only refs, logs or artifacts. New static assets receive CSP and security headers through `frontend/static/_headers` because matching assets bypass Worker execution.

Reviewed 23 October 2026. This is a read-only source and local Git-history review, followed by this documentation change. It does not certify the deployed service or Cloudflare account configuration.

## Result

No confirmed Cloudflare credential exposure was found in the current tracked source, generated browser assets, or the locally reachable Git history examined. Resource identifiers in Wrangler configuration are public repository metadata, not authentication credentials.

The review identified a gap in secret-file ignore rules and an image-access policy that needs an explicit product decision before V2.

## Bindings and credentials

- `wrangler.jsonc:9-18` declares the production D1 binding, database identifier/name, and R2 bucket binding/name. Lines 34-43 declare staging equivalents. These are identifiers; knowing them does not grant access to those resources.
- `src/index.ts:3-5` receives `DB` and `ICONS` as Worker runtime bindings. There is no database connection string or S3 access key required in the browser for this architecture.
- `.github/workflows/deploy.yml:51,76,100` references `secrets.CLOUDFLARE_API_TOKEN`. The account identifier comes from a GitHub variable at line 12. A secret reference is not a secret value.
- `scripts/provision-cloudflare.mjs:3-4,22-28` reads the deployment credentials from process environment and applies the token to Cloudflare API requests. No literal token was found.
- `scripts/build-static.mjs:3-19` explicitly packages frontend files from `public/`. Parsing all eight entries currently served from `src/static-assets.ts` found no deployment token, account configuration, database identifier, or R2 service endpoint.
- `worker-configuration.d.ts` contains generated platform interfaces and documentation. References to passwords, tokens, and connection strings there are type declarations, not populated credentials.

Cloudflare documents the binding model in its [D1 setup guide](https://developers.cloudflare.com/d1/get-started/) and [R2 Workers API reference](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/).

## Findings and decisions

### Secret-file ignore gap

`.gitignore:4` ignores `.dev.vars`, but does not ignore environment-specific files such as `.dev.vars.staging`. This was verified with `git check-ignore`. No such secret files were found tracked in the current tree or reachable history.

Before adding V2 environment files, extend ignore rules to cover `.dev.vars.*`, retaining only deliberately sanitized example files if needed. Keep actual deployment tokens in GitHub environment secrets. Never place them in frontend environment variables or build-time values that are embedded in JavaScript. Add a lightweight secret scan to PR validation, including generated assets.

This is a preventive recommendation, not evidence of an existing leaked credential. If a real credential is discovered later, revoke or rotate it first; removing the latest file does not invalidate historical copies.

### Uploaded-image privacy decision

`src/index.ts:428-431` currently serves room icons and profile photos through unauthenticated GET routes. URLs use UUID object keys and responses permit public caching for one hour. Anyone who obtains an image URL can retrieve the image without room membership or login.

This is access exposed by application routes, not exposed R2 credentials. Decide whether these images are intentionally public by URL. If room or profile media should be private, V2 must require the appropriate authentication/membership checks and use caching that respects those checks. Random object names alone are not authorization. Legal/privacy wording must match the chosen behavior.

## Staging and production isolation

The checked-in Wrangler configuration uses different database and bucket names for staging and production. Staging's database identifier is a provisioning placeholder. `scripts/provision-cloudflare.mjs` checks that staging database names/IDs and bucket names do not match production, provisions missing resources through the Cloudflare API, and writes resolved binding configuration for the workflow.

The deployment workflow selects the GitHub `staging` or `production` environment and passes its secret to provisioning, migration, and deployment jobs. These source-level controls were reviewed; actual GitHub environment protections, token scopes, deployed bindings, and Cloudflare resources were not independently inspected in this audit.

Maintain this separation through the SPA migration. Browser requests should call the same-origin Worker API; credentials remain on the server. Test users and uploaded staging media must remain in staging resources.

## Scope and limitations

- Inspected current tracked source/configuration and generated browser-served assets.
- Scanned 30 locally reachable commits, containing 128 unique Git blobs, for sensitive filenames, literal credential assignments, recognizable provider tokens, private keys, and URLs containing credentials. No findings were produced. Historical generated platform declarations and the package lock were excluded from credential-content pattern scanning to avoid reference examples.
- This was a heuristic review, not an exhaustive secret-detection guarantee. It did not inspect unreachable Git objects, deleted remote branches, forks, remote Actions logs/artifacts, dependency contents, Cloudflare dashboard settings, actual deployment tokens, or their effective permissions.
- Bucket public-domain configuration and deployed image behavior were not verified live. Application authorization, abuse controls, dependency vulnerabilities, and account/session security require separate implementation-stage testing.

## V2 security release checks

- Scan tracked files, generated frontend output, and relevant new history for secrets before opening the staging PR. Confirm environment-specific local secret files are ignored.
- Confirm no credential is embedded in frontend configuration, source maps, network responses, or error messages. Review dependencies and avoid logging request credentials.
- Verify the deployment token has the required account/resource permissions without unnecessary additional access, and verify GitHub environment protections.
- Verify deployed staging and production Worker bindings point to distinct D1 databases and R2 buckets. Exercise migrations and uploads in staging first.
- Test the chosen image-access policy with signed-out users, room members, and nonmembers, including cache behavior after access changes or deletion.
- Check that API routes enforce authentication and room membership independently of client-side routing. Verify session and cross-origin request behavior during the SPA migration.
- Reconcile privacy disclosures with actual public media, retention, deletion, and operational logging behavior.
- Follow repository policy: feature/bugfix branches from latest `origin/staging`, PR into staging, then a merge-commit promotion PR from staging into main. For deployment configuration changes, run static generation, TypeScript checks, policy tests, and Wrangler dry runs for both environments before release.
