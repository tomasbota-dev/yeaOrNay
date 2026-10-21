import { readFile, writeFile } from 'node:fs/promises';

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const apiToken = process.env.CLOUDFLARE_API_TOKEN;

if (!accountId || !apiToken) {
  throw new Error('Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN before provisioning.');
}

const configPath = new URL('../wrangler.jsonc', import.meta.url);
const config = JSON.parse(await readFile(configPath, 'utf8'));
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
    throw new Error(`Cloudflare API ${options.method || 'GET'} ${path} failed (${response.status})${reasons ? `: ${reasons}` : ''}`);
  }
  return payload.result;
}

const databaseBinding = config.d1_databases?.find(({ binding }) => binding === 'DB');
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

for (const bucketBinding of config.r2_buckets || []) {
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

await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);
console.log('Cloudflare resource bindings are ready for Wrangler.');
