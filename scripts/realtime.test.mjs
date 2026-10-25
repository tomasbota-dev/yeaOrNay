import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';

const compile = async name => ts.transpileModule(await readFile(new URL(`../src/${name}.ts`, import.meta.url), 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText;

test('strict limiter serializes concurrent requests and preserves counters across object eviction', async () => {
  const mf = new Miniflare(convertV4MiniflareOptions({ workers: [{ modules: true, script: `${await compile('abuse')}
    export default {fetch(request,env) {return env.ABUSE_LIMITER.getByName('test').fetch(request)}}`,
    compatibilityDate: '2026-10-20', durableObjects: { ABUSE_LIMITER: { className: 'AbuseLimiter', useSQLite: true } },
  }] }));
  try {
    const results = await Promise.all(Array.from({ length: 15 }, () => mf.dispatchFetch('https://test/', {
      method: 'POST', body: JSON.stringify({ limit: 5, windowSeconds: 60 }),
    }).then(response => response.json())));
    assert.equal(results.filter(value => value.allowed).length, 5);
    assert.ok(results.filter(value => !value.allowed).every(value => value.retryAfter >= 1 && value.retryAfter <= 60));
    // A fresh JS instance must read its allowance from SQLite, not an isolate map.
    await mf.setOptions(convertV4MiniflareOptions({ workers: [{ modules: true, script: `${await compile('abuse')}
      export default {fetch(request,env) {return env.ABUSE_LIMITER.getByName('test').fetch(request)}} // force new worker version`,
      compatibilityDate: '2026-10-20', durableObjects: { ABUSE_LIMITER: { className: 'AbuseLimiter', useSQLite: true } },
    }] }));
    const denied = await mf.dispatchFetch('https://test/', { method: 'POST', body: JSON.stringify({ limit: 5, windowSeconds: 60 }) });
    assert.equal((await denied.json()).allowed, false);
  } finally { await mf.dispose(); }
});

test('session revocation and expiration suppress outbound events; client mutations close with 1008', { timeout: 30000 }, async () => {
  const mf = new Miniflare(convertV4MiniflareOptions({ workers: [{ modules: true, script: `${await compile('realtime')}
    export default {fetch(request,env) {return env.ROOM_REALTIME.getByName('room').fetch(request)}}`,
    compatibilityDate: '2026-10-20', d1Databases: ['DB'],
    durableObjects: { ROOM_REALTIME: { className: 'RoomRealtime', useSQLite: true } },
  }] }));
  const sockets = [];
  try {
    const db = await mf.getD1Database('DB');
    await db.exec("CREATE TABLE sessions(id_hash TEXT,user_id TEXT,expires_at INTEGER); CREATE TABLE rooms(id TEXT); CREATE TABLE room_members(room_id TEXT,user_id TEXT); INSERT INTO rooms VALUES('room');");
    for (const user of ['revoked', 'expired', 'client-message']) {
      await db.prepare('INSERT INTO sessions VALUES(?,?,?)').bind(user, user, Date.now() + 60_000).run();
      await db.prepare('INSERT INTO room_members VALUES(?,?)').bind('room', user).run();
      const response = await mf.dispatchFetch('https://test/connect', { headers: {
        Upgrade: 'websocket', 'x-room-id': 'room', 'x-user-id': user, 'x-session-hash': user, 'x-session-expires': String(Date.now() + 60_000),
      } });
      assert.equal(response.status, 101);
      const socket = response.webSocket;
      sockets.push(socket);
      const initial = new Promise(resolve => socket.addEventListener('message', event => resolve(event.data), { once: true }));
      socket.accept();
      assert.deepEqual(JSON.parse(await initial), { type: 'room-changed' });
    }
    const outbound = [];
    for (const socket of sockets) socket.addEventListener('message', event => outbound.push(event.data));
    const closed = sockets.map(socket => new Promise(resolve => socket.addEventListener('close', resolve, { once: true })));
    await db.exec("DELETE FROM sessions WHERE user_id='revoked'; UPDATE sessions SET expires_at=1 WHERE user_id='expired';");
    sockets[2].send(JSON.stringify({ type: 'vote', value: 1, userId: 'another-user' }));
    // Only unauthorized sessions remain when the subsequent broadcast runs.
    const clientClose = await closed[2];
    assert.equal(clientClose.code, 1008);
    sockets[2].close(1000);
    await mf.dispatchFetch('https://test/notify', { method: 'POST', headers: { 'x-room-id': 'room' }, body: '{}' });

    assert.equal((await closed[0]).code, 4001);
    assert.equal((await closed[1]).code, 4001);
    assert.deepEqual(outbound, []);
  } finally {
    for (const socket of sockets) { try { socket.close(); } catch {} }
    await mf.dispose();
  }
});

test('room sockets authenticate, cap connections, and revoke access before broadcasting', { timeout: 30000 }, async () => {
  const mf = new Miniflare(convertV4MiniflareOptions({ workers: [{ modules: true, script: `${await compile('realtime')}
    export default {fetch(request,env) {return env.ROOM_REALTIME.getByName('room').fetch(request)}}`,
    compatibilityDate: '2026-10-20', d1Databases: ['DB'],
    durableObjects: { ROOM_REALTIME: { className: 'RoomRealtime', useSQLite: true } },
  }] }));
  const sockets = [];
  const headers = { Upgrade: 'websocket', 'x-room-id': 'room', 'x-user-id': 'user', 'x-session-hash': 'hash', 'x-session-expires': String(Date.now() + 60_000) };
  try {
    const db = await mf.getD1Database('DB');
    await db.exec('CREATE TABLE sessions(id_hash TEXT,user_id TEXT,expires_at INTEGER); CREATE TABLE rooms(id TEXT); CREATE TABLE room_members(room_id TEXT,user_id TEXT);');
    await db.prepare('INSERT INTO sessions VALUES(?,?,?)').bind('hash', 'user', Date.now() + 60_000).run();
    await db.exec("INSERT INTO rooms VALUES('room'); INSERT INTO room_members VALUES('room','user');");
    const expired = await mf.dispatchFetch('https://test/connect', { headers: { ...headers, 'x-session-expires': '1' } });
    assert.equal(expired.status, 403);
    for (let i = 0; i < 3; i++) {
      const response = await mf.dispatchFetch('https://test/connect', { headers });
      assert.equal(response.status, 101);
      const socket = response.webSocket;
      sockets.push(socket);
      const initial = new Promise(resolve => socket.addEventListener('message', event => resolve(JSON.parse(event.data)), { once: true }));
      socket.accept();

      assert.deepEqual(await initial, { type: 'room-changed' });
    }
    assert.equal((await mf.dispatchFetch('https://test/connect', { headers })).status, 429);
    const message = new Promise(resolve => sockets[0].addEventListener('message', event => resolve(JSON.parse(event.data)), { once: true }));
    assert.equal((await mf.dispatchFetch('https://test/notify', { method: 'POST', headers: { 'x-room-id': 'room' }, body: '{}' })).status, 200);

    assert.deepEqual(await message, { type: 'room-changed' });
    await db.exec("DELETE FROM room_members WHERE user_id='user'");
    const closeStarted = Date.now();
    const closed = Promise.all(sockets.map(socket => new Promise(resolve => socket.addEventListener('close', resolve, { once: true }))));
    await mf.dispatchFetch('https://test/notify', { method: 'POST', headers: { 'x-room-id': 'room' }, body: '{}' });


    for (const event of await closed) assert.equal(event.code, 4001);
    assert.ok(Date.now() - closeStarted < 15_000, 'Server must complete revocation close within 15 seconds');
    assert.equal((await mf.dispatchFetch('https://test/connect', { headers })).status, 403);
  } finally {
    for (const socket of sockets) { try { socket.close(); } catch {} }
    await mf.dispose();
  }
});
