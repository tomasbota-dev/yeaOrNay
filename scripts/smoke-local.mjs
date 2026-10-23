// Optional end-to-end contract smoke against Wrangler's local D1/R2 only.
import assert from "node:assert/strict";
const origin = new URL(process.env.LOCAL_SMOKE_URL || "http://127.0.0.1:8787");
if (!["127.0.0.1", "localhost", "[::1]"].includes(origin.hostname))
  throw new Error("Local smoke must target loopback.");
const tag = crypto.randomUUID().slice(0, 8);
async function request(
  path,
  { cookie, method = "GET", body, status = 200, raw } = {},
) {
  const response = await fetch(new URL(path, origin), {
    method,
    redirect: "manual",
    headers: {
      ...(cookie ? { cookie } : {}),
      ...(body ? { "content-type": "application/json" } : {}),
      ...(raw ? { "content-type": "image/png" } : {}),
    },
    body: raw || (body ? JSON.stringify(body) : undefined),
  });
  const text = await response.text();
  assert.equal(
    response.status,
    status,
    `${method} ${path}: ${text.slice(0, 180)}`,
  );
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { response, data };
}
async function account(name) {
  const email = `v2-${tag}-${name}@example.invalid`;
  const { response, data } = await request("/api/auth/signup", {
    method: "POST",
    body: {
      name,
      email,
      password: "Local-test-passphrase-2026",
      ageConfirmed: true,
    },
    status: 200,
  });
  return {
    cookie: response.headers.get("set-cookie").split(";")[0],
    user: data.user,
    email,
  };
}

for (const route of [
  "/",
  "/login",
  "/signup",
  "/profile",
  "/privacy",
  "/terms",
  "/room/INVITE7",
]) {
  const { response, data } = await request(route);
  assert.match(response.headers.get("content-type"), /text\/html/);
  assert.match(data, /id="root"/);
  assert.match(
    response.headers.get("content-security-policy"),
    /script-src 'self'/,
  );
}
const shell = (await request("/")).data;
const scriptPath = shell.match(/src="([^"]+\.js)"/)?.[1];
assert.ok(scriptPath, "built shell references its hashed JavaScript");
const script = await request(scriptPath);
assert.match(script.response.headers.get("content-type"), /javascript/);
const legacy = await request("/privacy.html?lang=pt", { status: 308 });
assert.match(legacy.response.headers.get("location"), /\/privacy\?lang=pt$/);
await request("/api/rooms", { status: 401 });
const host = await account("Host"),
  guest = await account("Guest"),
  outsider = await account("Outsider");
try {
  const badLogin = await request("/api/auth/login", {
    method: "POST",
    body: { email: host.email, password: "Wrong-passphrase-2026" },
    status: 401,
  });
  assert.equal(badLogin.data.code, "INVALID_CREDENTIALS");
  const created = await request("/api/rooms", {
    cookie: host.cookie,
    method: "POST",
    body: { name: `V2 smoke ${tag}`, duration: 30 },
    status: 201,
  });
  const code = created.data.room.code;
  await request(`/api/rooms/${code}`, { cookie: guest.cookie, status: 403 });
  await request("/api/rooms/join", {
    cookie: guest.cookie,
    method: "POST",
    body: { code },
  });
  await request(`/api/rooms/${code}/ideas`, {
    cookie: host.cookie,
    method: "POST",
    body: { title: "Walk by the river", details: "Meet at six." },
    status: 201,
  });
  let snapshot = (await request(`/api/rooms/${code}`, { cookie: guest.cookie }))
    .data;
  const idea = snapshot.ideas[0];
  await request(`/api/ideas/${idea.id}/vote`, {
    cookie: host.cookie,
    method: "PUT",
    body: { value: 1 },
    status: 403,
  });
  await request(`/api/ideas/${idea.id}/vote`, {
    cookie: outsider.cookie,
    method: "PUT",
    body: { value: 1 },
    status: 403,
  });
  for (const [value, expected] of [
    [1, 1],
    [-1, -1],
    [0, 0],
    [1, 1],
    [1, 0],
  ]) {
    await request(`/api/ideas/${idea.id}/vote`, {
      cookie: guest.cookie,
      method: "PUT",
      body: { value },
    });
    snapshot = (await request(`/api/rooms/${code}`, { cookie: guest.cookie }))
      .data;
    assert.equal(snapshot.ideas[0].my_vote, expected);
    assert.equal(snapshot.ideas[0].score, expected);
  }
  assert.equal(snapshot.ideas[0].score, 0, "same-direction voting toggles off");
  await request(`/api/ideas/${idea.id}/comments`, {
    cookie: guest.cookie,
    method: "POST",
    body: { body: "See you there." },
    status: 201,
  });
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
    "base64",
  );
  await request(`/api/rooms/${code}/icon`, {
    cookie: host.cookie,
    method: "POST",
    raw: png,
  });
  const photo = await request("/api/profile/photo", {
    cookie: guest.cookie,
    method: "POST",
    raw: png,
  });
  await request(photo.data.avatarUrl);
  await request("/api/profile/photo", {
    cookie: guest.cookie,
    method: "DELETE",
  });
  await request("/api/profile", {
    cookie: guest.cookie,
    method: "PUT",
    body: { name: "Guest updated", email: guest.email },
  });
  await request("/api/feedback", {
    cookie: guest.cookie,
    method: "POST",
    body: { rating: "good", note: "Local V2 smoke." },
    status: 201,
  });
  await request(`/api/rooms/${code}/ideas`, {
    cookie: guest.cookie,
    method: "POST",
    body: { title: "Watch a film", details: "" },
    status: 201,
  });
  await request(`/api/rooms/${code}/close`, {
    cookie: host.cookie,
    method: "POST",
  });
  await request(`/api/ideas/${idea.id}/vote`, {
    cookie: guest.cookie,
    method: "PUT",
    body: { value: 0 },
    status: 409,
  });
  snapshot = (await request(`/api/rooms/${code}`, { cookie: guest.cookie }))
    .data;
  assert.equal(snapshot.status, "closed");
  assert.ok(snapshot.winner_ids.includes(idea.id));
  assert.equal(
    snapshot.winner_ids.length,
    2,
    "equal scores produce tied winners",
  );
  assert.equal(snapshot.comments.length, 1);
  await request(`/api/rooms/${code}`, {
    cookie: host.cookie,
    method: "DELETE",
  });
  console.log(
    "Local D1/R2 smoke passed: routes, auth, joins, permissions, voting, comments, uploads, profile, feedback, results.",
  );
} finally {
  for (const user of [guest, host, outsider])
    await request("/api/account", { cookie: user.cookie, method: "DELETE" });
}
