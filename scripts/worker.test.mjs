import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { build } from "esbuild";

const { outputFiles } = await build({
  entryPoints: [fileURLToPath(new URL("../src/index.ts", import.meta.url))],
  bundle: true, write: false, format: "esm", platform: "node", target: "es2022",
});
const { default: worker } = await import(
  `data:text/javascript;base64,${Buffer.from(outputFiles[0].contents).toString("base64")}`
);

function environment() {
  const calls = { assets: [], writes: [], objects: [] };
  const env = {
    ABUSE_LIMITER: {
      idFromName: key => key,
      get: () => ({ fetch: async () => Response.json({ allowed: true, retryAfter: 0 }) }),
    },
    ROOM_REALTIME: {
      idFromName: key => key,
      get: () => ({ fetch: async () => new Response(null, { status: 204 }) }),
    },
    ASSETS: {
      async fetch(request) {
        calls.assets.push(request.url);
        return new Response("<html>V2</html>", {
          headers: { "content-type": "text/html", etag: "asset-version" },
        });
      },
    },
    DB: {
      prepare(sql) {
        return {
          bind() {
            return this;
          },
          async first() {
            if (sql.includes("JOIN users"))
              return {
                id: "member",
                email: "member@example.test",
                display_name: "Member",
                last_seen_at: Date.now(),
              };
            if (sql.includes("JOIN rooms"))
              return {
                id: "idea",
                author_id: "another-member",
                room_id: "room",
                status: "open",
                ends_at: Date.now() + 60_000,
              };
            if (sql.includes("room_members")) return { member: 1 };
            return null;
          },
          async run() {
            calls.writes.push(sql);
            return { success: true };
          },
        };
      },
    },
    ICONS: {
      async get(key) {
        calls.objects.push(key);
        return {
          body: "image bytes",
          httpMetadata: { contentType: "image/png" },
        };
      },
    },
  };
  return { env, calls };
}

test("SPA navigation delegates to assets and preserves asset metadata with security headers", async () => {
  const { env, calls } = environment();
  const response = await worker.fetch(
    new Request("https://example.test/room/ABC"),
    env,
  );
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "<html>V2</html>");
  assert.deepEqual(calls.assets, ["https://example.test/room/ABC"]);
  assert.equal(response.headers.get("etag"), "asset-version");
  assert.match(
    response.headers.get("content-security-policy"),
    /script-src 'self'/,
  );
  assert.match(
    response.headers.get("content-security-policy"),
    /img-src 'self' data: blob:/,
  );
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(
    response.headers.get("referrer-policy"),
    "strict-origin-when-cross-origin",
  );
});

test("legacy legal links permanently redirect inside the SPA and preserve language parameters", async () => {
  const { env, calls } = environment();
  for (const name of ["privacy", "terms"]) {
    const response = await worker.fetch(
      new Request(`https://example.test/${name}.html?lang=pt-PT`),
      env,
    );
    assert.equal(response.status, 308);
    assert.equal(
      response.headers.get("location"),
      `https://example.test/${name}?lang=pt-PT`,
    );
  }
  assert.deepEqual(calls.assets, []);
});

test("API errors retain readable messages and stable codes without falling through to SPA", async () => {
  const { env, calls } = environment();
  const response = await worker.fetch(
    new Request("https://example.test/api/rooms"),
    env,
  );
  assert.equal(response.status, 401);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), {
    error: "Please log in to continue.",
    code: "AUTH_REQUIRED",
  });
  const invalid = await worker.fetch(
    new Request("https://example.test/api/auth/signup", {
      method: "POST",
      headers: { "content-type": "application/json", origin: "https://example.test" },
      body: "{}",
    }),
    env,
  );
  assert.equal(invalid.status, 400);
  assert.equal((await invalid.json()).code, "VALIDATION_ERROR");
  const apiRoot = await worker.fetch(
    new Request("https://example.test/api"),
    env,
  );
  assert.equal(apiRoot.status, 401);
  assert.equal((await apiRoot.json()).code, "AUTH_REQUIRED");
  assert.deepEqual(calls.assets, []);
});

test("cross-origin mutations are rejected before accessing data", async () => {
  const { env, calls } = environment();
  const response = await worker.fetch(
    new Request("https://example.test/api/rooms", {
      method: "POST",
      headers: { origin: "https://other.test" },
    }),
    env,
  );
  assert.equal(response.status, 403);
  assert.equal((await response.json()).code, "INVALID_ORIGIN");
  assert.deepEqual(calls.writes, []);
});

test("an authenticated member can explicitly clear a vote without inserting a neutral vote", async () => {
  const { env, calls } = environment();
  const response = await worker.fetch(
    new Request("https://example.test/api/ideas/idea/vote", {
      method: "PUT",
      headers: {
        cookie: "yn_session=test-session",
        origin: "https://example.test",
        "content-type": "application/json",
      },
      body: JSON.stringify({ value: 0 }),
    }),
    env,
  );
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
  assert.equal(calls.writes.length, 1);
  assert.match(calls.writes[0], /^DELETE FROM votes/);
});

test("existing image URLs remain public and expose image bytes without storage credentials", async () => {
  const { env, calls } = environment();
  const key = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
  for (const path of ["profile-photos", "room-icons"]) {
    const response = await worker.fetch(
      new Request(`https://example.test/${path}/${key}`),
      env,
    );
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "image/png");
    assert.equal(response.headers.get("cache-control"), "public, max-age=3600");
    assert.equal(await response.text(), "image bytes");
    assert.equal(response.headers.has("authorization"), false);
    assert.equal(response.headers.has("set-cookie"), false);
  }
  assert.deepEqual(calls.objects, [key, key]);
  assert.deepEqual(calls.assets, []);
});
