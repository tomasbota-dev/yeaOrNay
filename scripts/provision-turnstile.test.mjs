import assert from 'node:assert/strict';
import test from 'node:test';
import { provisionTurnstile } from './provision-turnstile.mjs';

for (const existing of [false, true]) {
  test(`Turnstile ${existing ? 'reuses' : 'creates'} isolated staging signup widget and installs secret without returning it`, async () => {
    const calls = [];
    const widget = { name: 'yea-or-nay-staging-signup', sitekey: 'staging-public-key', secret: 'private-secret', domains: ['staging.workers.dev'] };
    const result = await provisionTurnstile({ target: { name: 'yea-or-nay-staging' }, hostname: 'staging.workers.dev', api: async (path, options = {}) => {
      calls.push({ path, ...options });
      if (path.includes('?page=')) return [{ name: 'yea-or-nay-signup', sitekey: 'production-key' }, ...(existing ? [widget] : [])];
      if (path === '/challenges/widgets/staging-public-key') return widget;
      if (path === '/challenges/widgets' && options.method === 'POST') {
        assert.deepEqual(JSON.parse(options.body), { name: widget.name, domains: widget.domains, mode: 'managed', clearance_level: 'no_clearance' });
        return widget;
      }
      assert.equal(path, '/workers/scripts/yea-or-nay-staging/secrets');
      assert.equal(options.method, 'PUT');
      assert.deepEqual(JSON.parse(options.body), { name: 'TURNSTILE_SECRET_KEY', text: widget.secret, type: 'secret_text' });
      return {};
    } });
    assert.equal(result, widget.sitekey);
    assert.ok(!JSON.stringify(result).includes(widget.secret));
    assert.ok(calls.every(call => !call.path.includes('production-key')));
    assert.equal(calls.filter(call => call.method === 'POST').length, existing ? 0 : 1);
  });
}

test('reused widget appends hostname while preserving existing domains', async () => {
  const widget = { name: 'app-staging-signup', sitekey: 'key', secret: 'secret', domains: ['old.example.test'] };
  let updated;
  await provisionTurnstile({ target: { name: 'app-staging' }, hostname: 'new.example.test', api: async (path, options = {}) => {
    if (path.includes('?page=')) return [widget];
    if (path === '/challenges/widgets/key' && options.method === 'PUT') { updated = JSON.parse(options.body); return {}; }
    if (path === '/challenges/widgets/key') return widget;
    return {};
  } });
  assert.deepEqual(updated.domains, ['old.example.test', 'new.example.test']);
});

test('secret installation errors cannot echo secret into caller logs', async () => {
  await assert.rejects(provisionTurnstile({ target: { name: 'app' }, hostname: 'example.test', api: async (path) => {
    if (path.includes('?page=')) return [];
    if (path === '/challenges/widgets') return { sitekey: 'public', secret: 'do-not-log-this' };
    throw new Error('echoed secret: do-not-log-this');
  } }), error => !error.message.includes('do-not-log-this') && error.message.includes('signup must remain disabled'));
});

test('GitHub Actions masks the secret before the secret upload begins', async () => {
  const previous = process.env.GITHUB_ACTIONS;
  const log = console.log;
  const messages = [];
  process.env.GITHUB_ACTIONS = 'true';
  console.log = value => messages.push(value);
  try {
    await provisionTurnstile({ target: { name: 'app' }, hostname: 'example.test', api: async path => {
      if (path.includes('?page=')) return [];
      if (path === '/challenges/widgets') return { sitekey: 'public', secret: 'private-value' };
      assert.deepEqual(messages, ['::add-mask::private-value']);
      return {};
    } });
    assert.equal(messages.length, 1);
  } finally {
    console.log = log;
    if (previous === undefined) delete process.env.GITHUB_ACTIONS;
    else process.env.GITHUB_ACTIONS = previous;
  }
});

test('free hostname cap fails instead of removing existing widget domains', async () => {
  const widget = { name: 'app-signup', sitekey: 'key', secret: 'secret', domains: Array.from({ length: 10 }, (_, i) => `host${i}.test`) };
  await assert.rejects(provisionTurnstile({ target: { name: 'app' }, hostname: 'new.test', api: async (path, options = {}) => {
    assert.ok(!options.method);
    return path.includes('?page=') ? [widget] : widget;
  } }), /free hostname limit/);
});
