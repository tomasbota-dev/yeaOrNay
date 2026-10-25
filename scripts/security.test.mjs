import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { build } from "esbuild";

async function bundle(file) {
  const { outputFiles } = await build({
    entryPoints: [fileURLToPath(new URL(file, import.meta.url))],
    bundle: true, write: false, format: "esm", platform: "node", target: "es2022",
  });
  return import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].contents).toString("base64")}`);
}
const { body, verifySignup, signupEnabled, readImage } = await bundle("../src/security.ts");
const { default: worker } = await bundle("../src/index.ts");
const origin = "https://example.test";
const validSignup = { name: "Test", email: "test@example.test", password: "a sufficiently long password", ageConfirmed: true, turnstileToken: "test-token" };
const signupRequest = () => new Request(`${origin}/api/auth/signup`, {
  method: "POST", headers: { origin, "content-type": "application/json" }, body: JSON.stringify(validSignup),
});
function noDatabaseEnvironment(result = { allowed: true, retryAfter: 0 }) {
  const calls = { database: 0, limiter: 0 };
  return {
    calls,
    env: {
      DB: { prepare() { calls.database++; throw new Error("Database must not be reached"); } },
      ABUSE_LIMITER: {
        idFromName: key => key,
        get: () => ({ fetch: async () => { calls.limiter++; return Response.json(result); } }),
      },
    },
  };
}

test("JSON byte cap rejects an oversized streamed body without Content-Length and cancels the stream", async () => {
  let cancelled = false;
  const stream = new ReadableStream({
    pull(controller) { controller.enqueue(new Uint8Array(6001).fill(32)); },
    cancel() { cancelled = true; },
  });
  const request = new Request(`${origin}/api/auth/signup`, {
    method: "POST", headers: { "content-type": "application/json" }, body: stream, duplex: "half",
  });
  assert.equal(request.headers.has("content-length"), false);
  await assert.rejects(body(request), error => error.status === 413);
  assert.equal(cancelled, true);
});

test("JSON body accepts bounded objects but rejects unsupported media, arrays, and invalid UTF-8", async () => {
  const request = (value, type = "application/json") => new Request(origin, {
    method: "POST", headers: { "content-type": type }, body: value,
  });
  assert.deepEqual(await body(request('{"name":"Olá"}', "application/json; charset=utf-8")), { name: "Olá" });
  await assert.rejects(body(request("{}", "text/plain")), error => error.status === 415);
  await assert.rejects(body(request("[]")), error => error.status === 400);
  await assert.rejects(body(request(new Uint8Array([0xff, 0xfe]))), error => error.status === 400);
});

test("raster validation accepts a bounded PNG and rejects fake WebP and oversized dimensions", async () => {
  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64');
  const request=(bytes,type)=>new Request(origin,{method:'POST',headers:{'content-type':type},body:bytes});
  assert.equal((await readImage(request(png,'image/png'))).bytes.length,png.length);
  const huge=Buffer.from(png);huge.writeUInt32BE(100000,16);
  await assert.rejects(readImage(request(huge,'image/png')),error=>error.status===413);
  await assert.rejects(readImage(request(Buffer.from('RIFFthis-is-not-an-image'),'image/webp')),error=>error.status===415);
  await assert.rejects(readImage(request(png,'image/svg+xml')),error=>error.status===415);
});

test("production registration fails closed without a secret before accessing the database", async () => {
  const { env, calls } = noDatabaseEnvironment();
  env.TURNSTILE_SITE_KEY = "public-site-key";
  env.LOCAL_TEST_MODE = "true";
  assert.equal(signupEnabled(signupRequest(), env), false, "local bypass must not apply to a public HTTPS host");
  const response = await worker.fetch(signupRequest(), env);
  assert.equal(response.status, 503);
  assert.equal((await response.json()).code, "SERVICE_UNAVAILABLE");
  assert.equal(calls.database, 0);
});

test("Turnstile rejects bad tokens, hostnames and actions; accepts only the matching verified signup", async () => {
  const originalFetch = globalThis.fetch;
  const env = { TURNSTILE_SITE_KEY: "public-site-key", TURNSTILE_SECRET_KEY: "test-secret" };
  let verification = { success: true, hostname: "other.test", action: "signup" };
  let requests = 0;
  globalThis.fetch = async (url, init) => {
    requests++;
    assert.equal(url, "https://challenges.cloudflare.com/turnstile/v0/siteverify");
    assert.equal(init.method, "POST");
    assert.equal(JSON.parse(init.body).secret, env.TURNSTILE_SECRET_KEY);
    return Response.json(verification);
  };
  try {
    await assert.rejects(verifySignup(signupRequest(), env, ""), error => error.status === 403);
    assert.equal(requests, 0, "missing tokens must not reach the verification service");
    await assert.rejects(verifySignup(signupRequest(), env, "token"), error => error.status === 403);
    verification = { success: true, hostname: "example.test", action: "login" };
    await assert.rejects(verifySignup(signupRequest(), env, "token"), error => error.status === 403);
    verification = { success: false, hostname: "example.test", action: "signup" };
    await assert.rejects(verifySignup(signupRequest(), env, "token"), error => error.status === 403);
    verification = { success: true, hostname: "example.test", action: "signup" };
    await verifySignup(signupRequest(), env, "token");
    globalThis.fetch = async () => { throw new Error("network unavailable"); };
    await assert.rejects(verifySignup(signupRequest(), env, "token"), error => error.status === 503);
  } finally { globalThis.fetch = originalFetch; }
});

test("rate rejection preserves Retry-After and blocks the request before database access", async () => {
  const { env, calls } = noDatabaseEnvironment({ allowed: false, retryAfter: 47 });
  const response = await worker.fetch(signupRequest(), env);
  assert.equal(response.status, 429);
  assert.equal(response.headers.get("retry-after"), "47");
  assert.equal((await response.json()).code, "RATE_LIMITED");
  assert.equal(calls.database, 0);
  assert.equal(calls.limiter, 1);
});

test("limiter outages fail closed with a retryable 503 before database access", async () => {
  const { env, calls } = noDatabaseEnvironment();
  env.ABUSE_LIMITER.get = () => ({ fetch: async () => new Response(null, { status: 503 }) });
  const response = await worker.fetch(signupRequest(), env);
  assert.equal(response.status, 503);
  assert.equal(response.headers.get("retry-after"), "60");
  assert.equal((await response.json()).code, "SERVICE_UNAVAILABLE");
  assert.equal(calls.database, 0);
});

test("missing Origin and explicitly cross-site mutations are rejected before limiter or database access", async () => {
  for (const headers of [{}, { origin, "sec-fetch-site": "cross-site" }, { origin: "https://other.test" }]) {
    const { env, calls } = noDatabaseEnvironment();
    const response = await worker.fetch(new Request(`${origin}/api/account`, { method: "DELETE", headers }), env);
    assert.equal(response.status, 403);
    assert.equal((await response.json()).code, "INVALID_ORIGIN");
    assert.equal(calls.limiter, 0);
    assert.equal(calls.database, 0);
  }
});
