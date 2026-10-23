import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, copyFile, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

for (const existing of [true, false]) {
  test(`staging provisioning ${existing ? 'reuses existing' : 'creates missing'} resources without touching production`, async () => {
    const root = await mkdtemp(join(tmpdir(), 'yea-provision-'));
    try {
      await mkdir(join(root, 'scripts'));
      await copyFile(new URL('./provision-cloudflare.mjs', import.meta.url), join(root, 'scripts/provision-cloudflare.mjs'));
      const original = JSON.parse(await readFile(new URL('../wrangler.jsonc', import.meta.url), 'utf8'));
      await writeFile(join(root, 'wrangler.jsonc'), JSON.stringify(original));
      const mock = `
        globalThis.fetch = async (url, options = {}) => {
          const path = new URL(url).pathname;
          const create = options.method === 'POST';
          const name = create ? JSON.parse(options.body).name : new URL(url).searchParams.get(path.endsWith('/d1/database') ? 'name' : 'name_contains');
          if (!name.includes('staging')) throw new Error('Production resource accessed');
          if (${existing} && create) throw new Error('Existing resource recreated');
          const item = path.endsWith('/d1/database') ? {name, uuid: '11111111-1111-1111-1111-111111111111'} : {name};
          const result = create ? item : path.endsWith('/d1/database') ? (${existing} ? [item] : []) : {buckets: ${existing} ? [item] : []};
          return {ok:true, json:async () => ({success:true,result})};
        };
      `;
      execFileSync(process.execPath, ['--import', `data:text/javascript,${encodeURIComponent(mock)}`, join(root, 'scripts/provision-cloudflare.mjs'), 'staging'], {
        env: {...process.env, CLOUDFLARE_ACCOUNT_ID:'test', CLOUDFLARE_API_TOKEN:'test'},
      });
      const resolved = JSON.parse(await readFile(join(root, 'wrangler.jsonc'), 'utf8'));
      assert.deepEqual(resolved.d1_databases, original.d1_databases);
      assert.deepEqual(resolved.r2_buckets, original.r2_buckets);
      assert.equal(resolved.env.staging.d1_databases[0].database_id, '11111111-1111-1111-1111-111111111111');
    } finally {
      await rm(root, {recursive:true, force:true});
    }
  });
}
