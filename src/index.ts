import { STATIC_FILES } from './static-assets';

interface Env {
  DB: D1Database;
  ICONS: R2Bucket;
}

type UserRow = { id: string; email: string; display_name: string; password_hash: string; password_salt: string };
const SESSION_DAYS = 30;
// Workers Web Crypto limits PBKDF2 to 100,000 iterations.
const HASH_ITERATIONS = 100_000;
const encoder = new TextEncoder();

function json(data: unknown, status = 200, headers: HeadersInit = {}) {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers } });
}
function fail(message: string, status = 400) { return json({ error: message }, status); }
function randomId() { return crypto.randomUUID(); }
function randomToken(bytes = 32) { const data = crypto.getRandomValues(new Uint8Array(bytes)); return Array.from(data, n => n.toString(16).padStart(2, '0')).join(''); }
async function sha256(value: string) { const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value)); return Array.from(new Uint8Array(digest), n => n.toString(16).padStart(2, '0')).join(''); }
async function derivePassword(password: string, saltHex: string) {
  const salt = Uint8Array.from(saltHex.match(/.{2}/g) || [], part => parseInt(part, 16));
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: HASH_ITERATIONS }, key, 256);
  return Array.from(new Uint8Array(bits), n => n.toString(16).padStart(2, '0')).join('');
}
function constantTimeEqual(a: string, b: string) {
  let mismatch = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) mismatch |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return mismatch === 0;
}
function cookie(request: Request, name: string) {
  const raw = request.headers.get('Cookie') || '';
  for (const pair of raw.split(';')) { const [key, ...rest] = pair.trim().split('='); if (key === name) return rest.join('='); }
  return null;
}
function sessionCookie(value: string, maxAge: number) { return `yn_session=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`; }
async function currentUser(request: Request, env: Env) {
  const session = cookie(request, 'yn_session');
  if (!session) return null;
  const tokenHash = await sha256(session);
  const row = await env.DB.prepare('SELECT u.id, u.email, u.display_name, u.last_seen_at FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.id_hash=? AND s.expires_at>?').bind(tokenHash, Date.now()).first<{ id: string; email: string; display_name: string; last_seen_at: number }>();
  if (row && Date.now() - row.last_seen_at > 24 * 60 * 60_000) await env.DB.prepare('UPDATE users SET last_seen_at=? WHERE id=?').bind(Date.now(), row.id).run();
  return row ? { id: row.id, email: row.email, name: row.display_name } : null;
}
async function body(request: Request) {
  const size = Number(request.headers.get('content-length') || 0);
  if (size > 12_000) throw new HttpError('That message is too long.', 413);
  try {
    const result = await request.json() as Record<string, unknown>;
    if (!result || typeof result !== 'object' || Array.isArray(result)) throw new Error();
    return result;
  } catch { throw new HttpError('Please check the form and try again.', 400); }
}
class HttpError extends Error { constructor(message: string, public status = 400) { super(message); } }
function stringField(value: unknown, max: number, label: string) {
  if (typeof value !== 'string') throw new HttpError(`${label} is required.`);
  const result = value.trim();
  if (!result || result.length > max) throw new HttpError(`${label} must be between 1 and ${max} characters.`);
  return result;
}
function makeCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(7));
  return Array.from(bytes, n => alphabet[n % alphabet.length]).join('');
}
async function requireMember(roomId: string, userId: string, env: Env) {
  const member = await env.DB.prepare('SELECT 1 FROM room_members WHERE room_id=? AND user_id=?').bind(roomId, userId).first();
  if (!member) throw new HttpError('You need to join this room first.', 403);
}
async function createSession(userId: string, env: Env) {
  const token = randomToken();
  const now = Date.now();
  const expires = now + SESSION_DAYS * 24 * 60 * 60 * 1000;
  await env.DB.prepare('INSERT INTO sessions(id_hash,user_id,expires_at,created_at) VALUES(?,?,?,?)').bind(await sha256(token), userId, expires, now).run();
  return token;
}
async function auth(request: Request, env: Env, action: 'signup' | 'login') {
  const input = await body(request);
  const email = stringField(input.email, 254, 'Email').toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError('Enter a valid email address.');
  if (typeof input.password !== 'string' || input.password.length < 10 || input.password.length > 128) throw new HttpError('Password must be 10 to 128 characters long.');
  if (action === 'signup') {
    const existing = await env.DB.prepare('SELECT 1 FROM users WHERE email=?').bind(email).first();
    if (existing) throw new HttpError('An account with that email already exists. Try logging in.', 409);
    if (input.ageConfirmed !== true) throw new HttpError('Please confirm that you are 18 or older to create an account.', 403);
  }
  let user: UserRow | null;
  if (action === 'signup') {
    const name = stringField(input.name, 40, 'Name');
    const salt = randomToken(16);
    const hash = await derivePassword(input.password, salt);
    const id = randomId();
    try {
      await env.DB.prepare('INSERT INTO users(id,email,display_name,password_hash,password_salt) VALUES(?,?,?,?,?)').bind(id, email, name, hash, salt).run();
    } catch (error) {
      if (String(error).includes('UNIQUE')) throw new HttpError('An account with that email already exists. Try logging in.', 409);
      throw error;
    }
    user = { id, email, display_name: name, password_hash: hash, password_salt: salt };
  } else {
    const address = request.headers.get('CF-Connecting-IP') || 'unknown';
    const key = await sha256(`${address}|${email}`);
    const now = Date.now();
    const attempt = await env.DB.prepare('SELECT count, window_start FROM auth_attempts WHERE ip_hash=?').bind(key).first<{ count: number; window_start: number }>();
    if (attempt && now - attempt.window_start < 15 * 60_000 && attempt.count >= 12) throw new HttpError('Too many tries. Please wait 15 minutes and try again.', 429);
    if (!attempt || now - attempt.window_start >= 15 * 60_000) await env.DB.prepare('INSERT INTO auth_attempts(ip_hash,count,window_start) VALUES(?,1,?) ON CONFLICT(ip_hash) DO UPDATE SET count=1, window_start=excluded.window_start').bind(key, now).run();
    else await env.DB.prepare('UPDATE auth_attempts SET count=count+1 WHERE ip_hash=?').bind(key).run();
    user = await env.DB.prepare('SELECT id,email,display_name,password_hash,password_salt FROM users WHERE email=?').bind(email).first<UserRow>();
    const salt = user?.password_salt || '00000000000000000000000000000000';
    const expected = user?.password_hash || '0'.repeat(64);
    const actual = await derivePassword(input.password, salt);
    if (!user || !constantTimeEqual(actual, expected)) throw new HttpError('Email or password didn’t match. Try again.', 401);
  }
  await env.DB.prepare('UPDATE users SET last_seen_at=? WHERE id=?').bind(Date.now(), user.id).run();
  const token = await createSession(user.id, env);
  await env.DB.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(Date.now()).run();
  return json({ user: { id: user.id, email: user.email, name: user.display_name } }, 200, { 'set-cookie': sessionCookie(token, SESSION_DAYS * 24 * 60 * 60) });
}
async function listRooms(userId: string, env: Env) {
  await env.DB.prepare("UPDATE rooms SET status='closed' WHERE status='open' AND ends_at<=?").bind(Date.now()).run();
  const result = await env.DB.prepare(`SELECT r.id,r.code,r.name,r.icon,r.created_at,r.ends_at,r.status,
    (SELECT COUNT(*) FROM room_members m WHERE m.room_id=r.id) member_count,
    (SELECT COUNT(*) FROM ideas i WHERE i.room_id=r.id) idea_count
    FROM rooms r JOIN room_members mine ON mine.room_id=r.id WHERE mine.user_id=? ORDER BY r.created_at DESC LIMIT 50`).bind(userId).all();
  return json({ rooms: result.results });
}
async function createRoom(request: Request, userId: string, env: Env) {
  const input = await body(request);
  const name = stringField(input.name, 70, 'Room name');
  const id = randomId(), created = Date.now(), code = makeCode();
  let duration: number, endsAt: number;
  if (input.endsAt !== undefined && input.endsAt !== '') {
    endsAt = Number(input.endsAt);
    if (!Number.isFinite(endsAt) || endsAt <= created) throw new HttpError('Choose an end date and time in the future.');
    duration = Math.ceil((endsAt - created) / 60_000);
  } else {
    duration = Number(input.duration);
    if (![15, 30, 60, 180, 1440].includes(duration)) throw new HttpError('Choose one of the available time limits.');
    endsAt = created + duration * 60_000;
  }
  const icon = typeof input.icon === 'string' && ['🎲','🍜','🌿','🎬','🎨','🏖️','🎮','🍕','🎵','🧩'].includes(input.icon) ? input.icon : '🎲';
  const room = await env.DB.prepare('INSERT INTO rooms(id,code,name,icon,host_id,duration_minutes,created_at,ends_at) VALUES(?,?,?,?,?,?,?,?) RETURNING id,code,name,icon,created_at,ends_at,status,host_id').bind(id, code, name, icon, userId, duration, created, endsAt).first();
  await env.DB.prepare('INSERT INTO room_members(room_id,user_id,joined_at) VALUES(?,?,?)').bind(id, userId, created).run();
  return json({ room }, 201);
}
async function joinRoom(request: Request, userId: string, env: Env) {
  const input = await body(request);
  const code = stringField(input.code, 8, 'Room code').toUpperCase().replace(/\s/g, '');
  const room = await env.DB.prepare('SELECT id,code,name,status FROM rooms WHERE code=?').bind(code).first<{ id: string; code: string; name: string; status: string }>();
  if (!room) throw new HttpError('We couldn’t find a room with that code.', 404);
  const banned = await env.DB.prepare('SELECT 1 FROM room_bans WHERE room_id=? AND user_id=?').bind(room.id, userId).first();
  if (banned) throw new HttpError('The host removed you from this room.', 403);
  await env.DB.prepare('INSERT OR IGNORE INTO room_members(room_id,user_id,joined_at) VALUES(?,?,?)').bind(room.id, userId, Date.now()).run();
  return json({ room });
}
async function roomSnapshot(code: string, userId: string, env: Env) {
  const found = await env.DB.prepare('SELECT id,ends_at,status FROM rooms WHERE code=?').bind(code).first<{ id: string; ends_at: number; status: string }>();
  if (!found) throw new HttpError('Room not found.', 404);
  await requireMember(found.id, userId, env);
  const now = Date.now();
  if (found.status === 'open' && found.ends_at <= now) await env.DB.prepare("UPDATE rooms SET status='closed' WHERE id=? AND status='open' AND ends_at<=?").bind(found.id, now).run();
  const room = await env.DB.prepare(`SELECT r.id,r.code,r.name,r.icon,r.host_id,r.created_at,r.ends_at,r.status,u.display_name host_name
    FROM rooms r JOIN users u ON u.id=r.host_id WHERE r.id=?`).bind(found.id).first<Record<string, any>>();
  const [members, ideas, comments] = await Promise.all([
    env.DB.prepare('SELECT u.id,u.display_name name,rm.joined_at FROM room_members rm JOIN users u ON u.id=rm.user_id WHERE rm.room_id=? ORDER BY rm.joined_at').bind(found.id).all(),
    env.DB.prepare(`SELECT i.id,i.title,i.details,i.author_id,i.created_at,u.display_name author_name,
      COALESCE(SUM(v.value),0) score, COALESCE(MAX(CASE WHEN v.user_id=? THEN v.value END),0) my_vote
      FROM ideas i JOIN users u ON u.id=i.author_id LEFT JOIN votes v ON v.idea_id=i.id
      WHERE i.room_id=? GROUP BY i.id ORDER BY score DESC,i.created_at ASC`).bind(userId, found.id).all(),
    env.DB.prepare(`SELECT c.id,c.idea_id,c.body,c.created_at,u.display_name author_name FROM comments c JOIN users u ON u.id=c.user_id JOIN ideas i ON i.id=c.idea_id WHERE i.room_id=? ORDER BY c.created_at ASC LIMIT 300`).bind(found.id).all()
  ]);
  const ideaRows = ideas.results as Array<Record<string, any>>;
  const max = ideaRows.length ? Math.max(...ideaRows.map(i => Number(i.score))) : null;
  const winners = room?.status === 'closed' && max !== null ? ideaRows.filter(i => Number(i.score) === max).map(i => i.id) : [];
  return json({ ...room, is_host: room?.host_id === userId, members: members.results.map((m: any) => ({ id: m.id, name: m.name, joined_at: m.joined_at })), ideas: ideaRows.map(i => ({ ...i, score: Number(i.score), my_vote: Number(i.my_vote), winner: winners.includes(i.id) })), comments: comments.results, winner_ids: winners });
}
async function roomPreview(code: string, env: Env) {
  const room = await env.DB.prepare('SELECT code,name,icon,status,ends_at FROM rooms WHERE code=?').bind(code).first();
  if (!room) throw new HttpError('Room not found.', 404);
  return json({ room });
}
async function moderateMember(request: Request, userId: string, env: Env, code: string, action: 'kick' | 'ban') {
  const input = await body(request);
  const memberId = stringField(input.userId, 64, 'Member');
  const room = await env.DB.prepare('SELECT id,host_id FROM rooms WHERE code=?').bind(code).first<{id:string;host_id:string}>();
  if (!room) throw new HttpError('Room not found.', 404);
  if (room.host_id !== userId) throw new HttpError('Only the room host can manage members.', 403);
  if (memberId === room.host_id) throw new HttpError('The host can’t remove themselves.', 400);
  const member = await env.DB.prepare('SELECT 1 FROM room_members WHERE room_id=? AND user_id=?').bind(room.id, memberId).first();
  if (!member) throw new HttpError('That person is no longer in this room.', 404);
  if (action === 'ban') await env.DB.prepare('INSERT OR IGNORE INTO room_bans(room_id,user_id,created_at) VALUES(?,?,?)').bind(room.id, memberId, Date.now()).run();
  await env.DB.prepare('DELETE FROM room_members WHERE room_id=? AND user_id=?').bind(room.id, memberId).run();
  return json({ok:true});
}
async function deleteRoom(userId: string, env: Env, code: string) {
  const room = await env.DB.prepare('SELECT id,icon,host_id FROM rooms WHERE code=?').bind(code).first<{id:string;icon:string;host_id:string}>();
  if (!room) throw new HttpError('Room not found.', 404);
  if (room.host_id !== userId) throw new HttpError('Only the room host can delete this room.', 403);
  await env.DB.prepare('DELETE FROM rooms WHERE id=?').bind(room.id).run();
  if (room.icon?.startsWith('/room-icons/')) await env.ICONS.delete(room.icon.slice('/room-icons/'.length));
  return json({ok:true});
}
async function submitFeedback(request: Request, userId: string, env: Env) {
  const input = await body(request);
  if (!['good','bad'].includes(String(input.rating))) throw new HttpError('Choose positive or negative feedback.');
  const note = typeof input.note === 'string' ? input.note.trim() : '';
  if (note.length > 500) throw new HttpError('Feedback can be up to 500 characters.');
  await env.DB.prepare('INSERT INTO feedback(id,user_id,rating,note,created_at) VALUES(?,?,?,?,?)').bind(randomId(),userId,input.rating,note,Date.now()).run();
  return json({ok:true},201);
}
async function removeAccount(userId: string, env: Env) {
  const hosted = await env.DB.prepare('SELECT id,icon FROM rooms WHERE host_id=?').bind(userId).all<{id:string;icon:string}>();
  for (const room of hosted.results) {
    const nextHost = await env.DB.prepare('SELECT user_id FROM room_members WHERE room_id=? AND user_id<>? ORDER BY joined_at LIMIT 1').bind(room.id,userId).first<{user_id:string}>();
    if (nextHost) await env.DB.prepare('UPDATE rooms SET host_id=? WHERE id=?').bind(nextHost.user_id,room.id).run();
    else {
      if (room.icon?.startsWith('/room-icons/')) await env.ICONS.delete(room.icon.slice('/room-icons/'.length));
      await env.DB.prepare('DELETE FROM rooms WHERE id=?').bind(room.id).run();
    }
  }
  await env.DB.prepare('DELETE FROM comments WHERE user_id=?').bind(userId).run();
  await env.DB.prepare('DELETE FROM ideas WHERE author_id=?').bind(userId).run();
  await env.DB.prepare('DELETE FROM votes WHERE user_id=?').bind(userId).run();
  await env.DB.prepare('DELETE FROM room_members WHERE user_id=?').bind(userId).run();
  await env.DB.prepare('DELETE FROM room_bans WHERE user_id=?').bind(userId).run();
  await env.DB.prepare('DELETE FROM feedback WHERE user_id=?').bind(userId).run();
  await env.DB.prepare('DELETE FROM sessions WHERE user_id=?').bind(userId).run();
  await env.DB.prepare('DELETE FROM users WHERE id=?').bind(userId).run();
}
async function purgeExpiredData(env: Env) {
  const now = Date.now(), year = 365 * 24 * 60 * 60_000, cutoff = now - year;
  await env.DB.prepare("UPDATE rooms SET status='closed' WHERE status='open' AND ends_at<=?").bind(now).run();
  const expiredRooms = await env.DB.prepare("SELECT id,icon FROM rooms WHERE status='closed' AND ends_at<? LIMIT 100").bind(cutoff).all<{id:string;icon:string}>();
  for (const room of expiredRooms.results) if (room.icon?.startsWith('/room-icons/')) await env.ICONS.delete(room.icon.slice('/room-icons/'.length));
  for (const room of expiredRooms.results) await env.DB.prepare('DELETE FROM rooms WHERE id=?').bind(room.id).run();
  await env.DB.prepare('DELETE FROM feedback WHERE created_at<?').bind(cutoff).run();
  await env.DB.prepare('DELETE FROM sessions WHERE expires_at<?').bind(now).run();
  await env.DB.prepare('DELETE FROM auth_attempts WHERE window_start<?').bind(now - 24 * 60 * 60_000).run();
  const inactive = await env.DB.prepare('SELECT id FROM users WHERE last_seen_at<? LIMIT 20').bind(cutoff).all<{id:string}>();
  for (const user of inactive.results) await removeAccount(user.id,env);
  console.log('Retention cleanup completed', { rooms: expiredRooms.results.length, inactiveAccounts: inactive.results.length });
}
async function uploadRoomIcon(request: Request, userId: string, env: Env, code: string) {
  const room = await env.DB.prepare('SELECT id,host_id,icon FROM rooms WHERE code=?').bind(code).first<{id:string;host_id:string;icon:string}>();
  if (!room) throw new HttpError('Room not found.',404);
  if (room.host_id !== userId) throw new HttpError('Only the room host can change its image.',403);
  const size = Number(request.headers.get('content-length') || 0), type = request.headers.get('content-type') || '';
  if (size > 262144) throw new HttpError('Choose an image smaller than 256 KB.',413);
  if (!['image/jpeg','image/png','image/webp'].includes(type)) throw new HttpError('Use a JPG, PNG, or WebP image.',415);
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError('Choose an image file.',400);
  const chunks: Uint8Array[] = []; let total = 0;
  while (true) {
    const part = await reader.read();
    if (part.done) break;
    total += part.value.byteLength;
    if (total > 262144) { await reader.cancel(); throw new HttpError('Choose an image smaller than 256 KB.',413); }
    chunks.push(part.value);
  }
  if (!total) throw new HttpError('Choose an image file.',400);
  const bytes = new Uint8Array(total); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk,offset); offset += chunk.byteLength; }
  const valid = type === 'image/jpeg' ? bytes[0] === 0xff && bytes[1] === 0xd8 : type === 'image/png' ? bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 : bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46;
  if (!valid) throw new HttpError('That file doesn’t look like a supported image.',415);
  const key = randomId();
  await env.ICONS.put(key,bytes,{httpMetadata:{contentType:type}});
  await env.DB.prepare('UPDATE rooms SET icon=? WHERE id=?').bind(`/room-icons/${key}`,room.id).run();
  if (room.icon?.startsWith('/room-icons/')) await env.ICONS.delete(room.icon.slice('/room-icons/'.length));
  return json({icon:`/room-icons/${key}`});
}
async function addIdea(request: Request, userId: string, env: Env, code: string) {
  const room = await env.DB.prepare('SELECT id,status,ends_at FROM rooms WHERE code=?').bind(code).first<{ id: string; status: string; ends_at: number }>();
  if (!room) throw new HttpError('Room not found.', 404);
  await requireMember(room.id, userId, env);
  if (room.status !== 'open' || room.ends_at <= Date.now()) { await env.DB.prepare("UPDATE rooms SET status='closed' WHERE id=?").bind(room.id).run(); throw new HttpError('Voting has closed. Take a look at the result!', 409); }
  const input = await body(request);
  const title = stringField(input.title, 100, 'Idea');
  const details = typeof input.details === 'string' ? input.details.trim() : '';
  if (details.length > 500) throw new HttpError('Details can be up to 500 characters.');
  const count = await env.DB.prepare('SELECT COUNT(*) count FROM ideas WHERE room_id=?').bind(room.id).first<{ count: number }>();
  if ((count?.count || 0) >= 100) throw new HttpError('This room has reached its 100 idea limit.', 409);
  await env.DB.prepare('INSERT INTO ideas(id,room_id,author_id,title,details,created_at) VALUES(?,?,?,?,?,?)').bind(randomId(), room.id, userId, title, details, Date.now()).run();
  return json({ ok: true }, 201);
}
async function castVote(request: Request, userId: string, env: Env, ideaId: string) {
  const input = await body(request);
  if (input.value !== 1 && input.value !== -1) throw new HttpError('Choose an upvote or a downvote.');
  const idea = await env.DB.prepare('SELECT i.id,i.author_id,i.room_id,r.status,r.ends_at FROM ideas i JOIN rooms r ON r.id=i.room_id WHERE i.id=?').bind(ideaId).first<{ id: string; author_id: string; room_id: string; status: string; ends_at: number }>();
  if (!idea) throw new HttpError('Idea not found.', 404);
  await requireMember(idea.room_id, userId, env);
  if (idea.author_id === userId) throw new HttpError('You can’t vote on your own idea.', 403);
  if (idea.status !== 'open' || idea.ends_at <= Date.now()) { await env.DB.prepare("UPDATE rooms SET status='closed' WHERE id=?").bind(idea.room_id).run(); throw new HttpError('Voting has closed.', 409); }
  const previous = await env.DB.prepare('SELECT value FROM votes WHERE idea_id=? AND user_id=?').bind(ideaId, userId).first<{ value: number }>();
  if (previous?.value === input.value) await env.DB.prepare('DELETE FROM votes WHERE idea_id=? AND user_id=?').bind(ideaId, userId).run();
  else await env.DB.prepare('INSERT INTO votes(idea_id,user_id,value,created_at) VALUES(?,?,?,?) ON CONFLICT(idea_id,user_id) DO UPDATE SET value=excluded.value,created_at=excluded.created_at').bind(ideaId, userId, input.value, Date.now()).run();
  return json({ ok: true });
}
async function addComment(request: Request, userId: string, env: Env, ideaId: string) {
  const idea = await env.DB.prepare('SELECT room_id FROM ideas WHERE id=?').bind(ideaId).first<{ room_id: string }>();
  if (!idea) throw new HttpError('Idea not found.', 404);
  await requireMember(idea.room_id, userId, env);
  const input = await body(request);
  const text = stringField(input.body, 280, 'Comment');
  await env.DB.prepare('INSERT INTO comments(id,idea_id,user_id,body,created_at) VALUES(?,?,?,?,?)').bind(randomId(), ideaId, userId, text, Date.now()).run();
  return json({ ok: true }, 201);
}
async function closeRoom(userId: string, env: Env, code: string) {
  const room = await env.DB.prepare('SELECT id,host_id FROM rooms WHERE code=?').bind(code).first<{ id: string; host_id: string }>();
  if (!room) throw new HttpError('Room not found.', 404);
  await requireMember(room.id, userId, env);
  if (room.host_id !== userId) throw new HttpError('Only the room host can end voting early.', 403);
  await env.DB.prepare("UPDATE rooms SET status='closed' WHERE id=?").bind(room.id).run();
  return json({ ok: true });
}
async function apiRoute(request: Request, env: Env) {
  const url = new URL(request.url), path = url.pathname, method = request.method;
  if (method !== 'GET' && url.origin !== request.headers.get('Origin') && request.headers.get('Origin')) throw new HttpError('Request origin could not be verified.', 403);
  if (path === '/api/auth/signup' && method === 'POST') return auth(request, env, 'signup');
  if (path === '/api/auth/login' && method === 'POST') return auth(request, env, 'login');
  const user = await currentUser(request, env);
  if (!user) return fail('Please log in to continue.', 401);
  if (path === '/api/me' && method === 'GET') return json({ user });
  if (path === '/api/account' && method === 'DELETE') {
    await removeAccount(user.id,env);
    return json({ok:true},200,{'set-cookie':sessionCookie('',0)});
  }
  if (path === '/api/auth/logout' && method === 'POST') {
    const session = cookie(request, 'yn_session'); if (session) await env.DB.prepare('DELETE FROM sessions WHERE id_hash=?').bind(await sha256(session)).run();
    return json({ ok: true }, 200, { 'set-cookie': sessionCookie('', 0) });
  }
  if (path === '/api/rooms' && method === 'GET') return listRooms(user.id, env);
  if (path === '/api/rooms' && method === 'POST') return createRoom(request, user.id, env);
  if (path === '/api/rooms/join' && method === 'POST') return joinRoom(request, user.id, env);
  if (path === '/api/feedback' && method === 'POST') return submitFeedback(request,user.id,env);
  const iconUpload = path.match(/^\/api\/rooms\/([^/]+)\/icon$/);
  if (iconUpload && method === 'POST') return uploadRoomIcon(request,user.id,env,decodeURIComponent(iconUpload[1]).toUpperCase());
  const preview = path.match(/^\/api\/rooms\/([^/]+)\/preview$/);
  if (preview && method === 'GET') return roomPreview(decodeURIComponent(preview[1]).toUpperCase(),env);
  const memberAction = path.match(/^\/api\/rooms\/([^/]+)\/members\/(kick|ban)$/);
  if (memberAction && method === 'POST') return moderateMember(request,user.id,env,decodeURIComponent(memberAction[1]).toUpperCase(),memberAction[2] as 'kick' | 'ban');
  const match = path.match(/^\/api\/rooms\/([^/]+)(?:\/(ideas|close|members))?$/);
  if (match) {
    const code = decodeURIComponent(match[1]).toUpperCase();
    if (!match[2] && method === 'GET') return roomSnapshot(code, user.id, env);
    if (!match[2] && method === 'DELETE') return deleteRoom(user.id,env,code);
    if (match[2] === 'ideas' && method === 'POST') return addIdea(request, user.id, env, code);
    if (match[2] === 'close' && method === 'POST') return closeRoom(user.id, env, code);
  }
  const voteMatch = path.match(/^\/api\/ideas\/([^/]+)\/vote$/);
  if (voteMatch && method === 'PUT') return castVote(request, user.id, env, voteMatch[1]);
  const commentMatch = path.match(/^\/api\/ideas\/([^/]+)\/comments$/);
  if (commentMatch && method === 'POST') return addComment(request, user.id, env, commentMatch[1]);
  return fail('Not found.', 404);
}
function secureAssetResponse(response: Response) {
  const headers = new Headers(response.headers);
  headers.set('x-content-type-options', 'nosniff');
  headers.set('referrer-policy', 'strict-origin-when-cross-origin');
  headers.set('permissions-policy', 'camera=(), microphone=(), geolocation=()');
  headers.set('content-security-policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
function staticAsset(path: string) {
  const asset = STATIC_FILES[path] || STATIC_FILES['/'];
  const cache = path === '/' || asset.type.startsWith('text/html') ? 'no-cache' : 'public, max-age=300';
  return secureAssetResponse(new Response(asset.body, { headers: { 'content-type': asset.type, 'cache-control': cache } }));
}
export default {
  async scheduled(_controller: ScheduledController, env: Env): Promise<void> {
    await purgeExpiredData(env);
  },
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      const iconPath = new URL(request.url).pathname.match(/^\/room-icons\/([a-f0-9-]{36})$/);
      if (iconPath && request.method === 'GET') { const object = await env.ICONS.get(iconPath[1]); if (!object) return new Response('Not found',{status:404}); return new Response(object.body,{headers:{'content-type':object.httpMetadata?.contentType || 'image/webp','cache-control':'public, max-age=3600','x-content-type-options':'nosniff'}}); }
      if (new URL(request.url).pathname.startsWith('/api/')) return await apiRoute(request, env);
      return staticAsset(new URL(request.url).pathname);
    } catch (error) {
      if (error instanceof HttpError) return fail(error.message, error.status);
      console.error('Request failed', error);
      return fail('Something went wrong. Please try again.', 500);
    }
  }
};
