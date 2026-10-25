import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';

test('D1 caps and authorization survive concurrent writers; failed room creation rolls back', {timeout:30000}, async () => {
  const mf = new Miniflare(convertV4MiniflareOptions({workers:[{modules:true,script:'export default {fetch(){return new Response("ok")}}',d1Databases:['DB'],compatibilityDate:'2026-10-20'}]}));
  try {
    const db = await mf.getD1Database('DB');
    for (const file of (await readdir(new URL('../migrations/',import.meta.url))).filter(file=>file.endsWith('.sql')).sort()) {
      const sql = (await readFile(new URL(`../migrations/${file}`,import.meta.url),'utf8')).replace(/--[^\n]*/g,'');
      // Keep trigger BEGIN...END bodies together; migration statements start with these keywords.
      for (const statement of sql.split(/(?<=;)\s*(?=(?:CREATE|ALTER|UPDATE|PRAGMA|$))/i).filter(sql=>sql.trim())) await db.prepare(statement).run();
    }
    const user = id=>db.prepare('INSERT INTO users(id,email,display_name,password_hash,password_salt) VALUES(?,?,?,?,?)').bind(id,`${id}@example.invalid`,id,'hash','salt');
    await db.batch([user('host'),user('guest')]);
    const room = (id,host='host')=>db.prepare('INSERT INTO rooms(id,code,name,host_id,duration_minutes,created_at,ends_at) VALUES(?,?,?,?,?,?,?)').bind(id,id,id,host,30,Date.now(),Date.now()+60000);
    await room('room').run();
    await db.prepare('INSERT INTO room_members VALUES(?,?,?)').bind('room','guest',Date.now()).run();
    await db.prepare("WITH RECURSIVE n(x) AS (SELECT 1 UNION ALL SELECT x+1 FROM n WHERE x<99) INSERT INTO ideas(id,room_id,author_id,title,created_at) SELECT 'seed-'||x,'room','guest','Idea',1 FROM n").run();
    const results = await Promise.allSettled(Array.from({length:10},(_,i)=>db.prepare('INSERT INTO ideas(id,room_id,author_id,title,created_at) VALUES(?,?,?,?,?)').bind(`concurrent-${i}`,'room','guest','Idea',1).run()));
    assert.equal(results.filter(result=>result.status==='fulfilled').length,1);
    assert.equal((await db.prepare('SELECT COUNT(*) count FROM ideas').first()).count,100);
    assert.ok(results.filter(result=>result.status==='rejected').every(result=>String(result.reason).includes('APP_CAPACITY')));
    await db.prepare("UPDATE rooms SET status='closed' WHERE id='room'").run();
    await assert.rejects(db.prepare("INSERT INTO votes VALUES('seed-1','host',1,1)").run(),/APP_VOTING_CLOSED_OR_MEMBERSHIP/);
    await db.prepare('INSERT INTO room_bans VALUES(?,?,?)').bind('room','host',1).run();
    await assert.rejects(db.prepare("INSERT INTO room_members VALUES('room','host',1)").run(),/APP_MEMBERSHIP/);
    for(let i=0;i<6;i++) await db.prepare('INSERT INTO sessions VALUES(?,?,?,?)').bind(`session${i}`,'guest',Date.now()+60000,i).run();
    assert.equal((await db.prepare("SELECT COUNT(*) count FROM sessions WHERE user_id='guest'").first()).count,5);
    assert.equal(await db.prepare("SELECT id_hash FROM sessions WHERE id_hash='session0'").first(),null);
    // Fill the guest's membership cap without exceeding each host's room cap.
    await db.batch([user('otherhost0'),user('otherhost1'),user('otherhost2')]);
    for(let i=0;i<49;i++) await db.batch([room(`other-${i}`,`otherhost${Math.floor(i/17)}`),db.prepare('INSERT INTO room_members VALUES(?,?,?)').bind(`other-${i}`,'guest',1)]);
    await assert.rejects(db.batch([room('rollback-room','guest'),db.prepare("INSERT INTO room_members VALUES('rollback-room','guest',1)")]),/APP_CAPACITY/);
    assert.equal(await db.prepare("SELECT id FROM rooms WHERE id='rollback-room'").first(),null);
  } finally { await mf.dispose(); }
});
