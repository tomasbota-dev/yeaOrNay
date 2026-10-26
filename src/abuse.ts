export type LimitResult = { allowed: boolean; retryAfter: number };

/** One object per hashed actor/policy key. SQLite operations are synchronous, so
 * concurrent requests cannot both spend the same remaining allowance. */
export class AbuseLimiter {
  declare readonly __DURABLE_OBJECT_BRAND: never;
  constructor(private ctx: DurableObjectState) {
    ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS quota (id INTEGER PRIMARY KEY CHECK(id=1), started INTEGER NOT NULL, count INTEGER NOT NULL, duration INTEGER NOT NULL)');
  }

  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'POST') return new Response(null, { status: 405 });
    const input = await request.json() as { limit?: number; windowSeconds?: number };
    const { limit, windowSeconds } = input;
    if (!Number.isInteger(limit) || !Number.isInteger(windowSeconds) || limit! < 1 || limit! > 1_000_000 || windowSeconds! < 1 || windowSeconds! > 86_400) {
      return new Response(null, { status: 400 });
    }
    const now = Date.now();
    this.ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS quota (id INTEGER PRIMARY KEY CHECK(id=1), started INTEGER NOT NULL, count INTEGER NOT NULL, duration INTEGER NOT NULL)');
    const duration = windowSeconds! * 1000;
    let row = this.ctx.storage.sql.exec<{ started: number; count: number; duration: number }>('SELECT started,count,duration FROM quota WHERE id=1').toArray()[0];
    const newWindow = !row || now >= row.started + row.duration || row.duration !== duration;
    if (newWindow) {
      row = { started: now, count: 0, duration };
    }
    const allowed = row.count < limit!;
    if (allowed) {
      this.ctx.storage.sql.exec('INSERT OR REPLACE INTO quota(id,started,count,duration) VALUES(1,?,?,?)', row.started, row.count + 1, duration);
    }
    // Only the first admission in a window schedules cleanup; admission above
    // remains synchronous even while the alarm write is waiting on storage.
    if (newWindow) await this.ctx.storage.setAlarm(row.started + duration);
    return Response.json({ allowed, retryAfter: allowed ? 0 : Math.max(1, Math.ceil((row.started + duration - now) / 1000)) });
  }

  async alarm() {
    await this.ctx.blockConcurrencyWhile(async () => {
      const row = this.ctx.storage.sql.exec<{ started: number; duration: number }>('SELECT started,duration FROM quota WHERE id=1').toArray()[0];
      if (row && row.started + row.duration > Date.now()) {
        await this.ctx.storage.setAlarm(row.started + row.duration);
      } else {
        await this.ctx.storage.deleteAll();
      }
    });
  }
}

/** Keys must be hashed by the caller; never persist raw email addresses or IPs. */
export async function consumeLimit(env: { ABUSE_LIMITER: DurableObjectNamespace }, key: string, limit: number, windowSeconds: number): Promise<LimitResult> {
  const stub = env.ABUSE_LIMITER.get(env.ABUSE_LIMITER.idFromName(key));
  const response = await stub.fetch('https://limiter.internal/', { method: 'POST', body: JSON.stringify({ limit, windowSeconds }) });
  if (!response.ok) throw new Error('Abuse limiter unavailable');
  return response.json<LimitResult>();
}
