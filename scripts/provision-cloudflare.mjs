import { readFile, writeFile } from 'node:fs/promises';
import { provisionTurnstile } from './provision-turnstile.mjs';

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const apiToken = process.env.CLOUDFLARE_API_TOKEN;

if (!accountId || !apiToken) {
  throw new Error('Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN before provisioning.');
}

const configPath = new URL('../wrangler.jsonc', import.meta.url);
const config = JSON.parse(await readFile(configPath, 'utf8'));
const environment = process.argv[2];
if (!['staging', 'production'].includes(environment)) {
  throw new Error('Usage: node scripts/provision-cloudflare.mjs <staging|production>');
}
const target = environment === 'production' ? config : config.env?.[environment];
if (!target) throw new Error(`Missing configuration for ${environment}.`);
if (environment === 'staging' && (
  target.d1_databases?.some(db => config.d1_databases.some(prod => prod.database_name === db.database_name || prod.database_id === db.database_id)) ||
  target.r2_buckets?.some(bucket => config.r2_buckets.some(prod => prod.bucket_name === bucket.bucket_name))
)) throw new Error('Staging must use separate D1 and R2 resources.');
const apiBase = `https://api.cloudflare.com/client/v4/accounts/${accountId}`;

async function api(path, options = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const payload = await response.json();
  if (!response.ok || !payload.success) {
    const reasons = (payload.errors || []).map(({ code, message }) => `${code}: ${message}`).join('; ');
    const error = new Error(`Cloudflare API ${options.method || 'GET'} ${path} failed (${response.status})${reasons ? `: ${reasons}` : ''}`);
    // Status/codes/path are safe diagnostics; provider messages can echo input.
    error.diagnostic = `${options.method || 'GET'} ${path.split('?')[0]} HTTP ${response.status}; codes ${(payload.errors || []).map(({code})=>code).join(',') || 'none'}`;
    throw error;
  }
  return payload.result;
}

const databaseBinding = target.d1_databases?.find(({ binding }) => binding === 'DB');
if (!databaseBinding) throw new Error('wrangler.jsonc must declare the DB D1 binding.');

const databaseResults = await api(`/d1/database?name=${encodeURIComponent(databaseBinding.database_name)}`);
let database = databaseResults.find(({ name }) => name === databaseBinding.database_name);
if (!database) {
  database = await api('/d1/database', {
    method: 'POST',
    body: JSON.stringify({ name: databaseBinding.database_name }),
  });
  console.log(`Created D1 database ${database.name}.`);
} else {
  console.log(`Using existing D1 database ${database.name}.`);
}
if (!database.uuid) throw new Error(`Cloudflare did not return a UUID for D1 database ${databaseBinding.database_name}.`);
databaseBinding.database_id = database.uuid;

for (const bucketBinding of target.r2_buckets || []) {
  const result = await api(`/r2/buckets?name_contains=${encodeURIComponent(bucketBinding.bucket_name)}&per_page=1000`);
  const buckets = result.buckets || [];
  let bucket = buckets.find(({ name }) => name === bucketBinding.bucket_name);
  if (!bucket) {
    bucket = await api('/r2/buckets', {
      method: 'POST',
      body: JSON.stringify({ name: bucketBinding.bucket_name }),
    });
    console.log(`Created R2 bucket ${bucketBinding.bucket_name}.`);
  } else {
    console.log(`Using existing R2 bucket ${bucketBinding.bucket_name}.`);
  }
}

if (process.env.PROVISION_TURNSTILE === 'true') {
  // A missing permission must never silently turn bot verification off.
  target.vars = { ...target.vars, TURNSTILE_SITE_KEY: '' };
  try {
    let hostname = target.vars.TURNSTILE_HOSTNAME;
    if (!hostname) {
      const { subdomain } = await api('/workers/subdomain');
      if (!subdomain) throw new Error('Missing Workers hostname');
      hostname = `${target.name}.${subdomain}.workers.dev`;
    }
    target.vars.TURNSTILE_SITE_KEY = await provisionTurnstile({ api, target, hostname });
    console.log('Signup protection configured for the selected environment.');
  } catch (error) {
    console.warn(`::warning::Turnstile setup unavailable. Signup remains disabled. Verify Turnstile Sites Write and rerun deployment.${error.diagnostic ? ` ${error.diagnostic}` : ''}`);
  }
}
await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);
console.log('Cloudflare resource bindings are ready for Wrangler.');
