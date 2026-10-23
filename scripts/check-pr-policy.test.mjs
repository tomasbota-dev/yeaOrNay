import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkPolicy } from './check-pr-policy.mjs';

test('permits feature and bugfix PRs into staging', () => {
  checkPolicy('staging', 'feature/new-room', true);
  checkPolicy('staging', 'bugfix/voting', false);
});
test('only same-repository staging can promote to production', () => {
  checkPolicy('main', 'staging', true);
  assert.throws(() => checkPolicy('main', 'staging', false));
  assert.throws(() => checkPolicy('main', 'feature/new-room', true));
});
test('rejects other branches and empty feature names', () => {
  for (const head of ['main', 'staging', 'feature/', 'codex/change']) {
    assert.throws(() => checkPolicy('staging', head, true));
  }
});
