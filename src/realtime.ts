type SocketIdentity = { roomId: string; userId: string; sessionHash: string; expires: number };
const MAX_ROOM_CONNECTIONS = 100;
const MAX_USER_CONNECTIONS = 3;

/** A private, Worker-only room notification hub. D1 remains authoritative.
 * Never broadcast room snapshots: those contain the requesting user's vote.
 * No timers or standard accept() calls: idle connections can hibernate. */
export class RoomRealtime {
  declare readonly __DURABLE_OBJECT_BRAND: never;
  constructor(private ctx: DurableObjectState, private env: { DB: D1Database }) {
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
  }

  private identity(socket: WebSocket): SocketIdentity | null {
    try { return socket.deserializeAttachment() as SocketIdentity | null; } catch { return null; }
  }

  private async authorized(identity: SocketIdentity): Promise<boolean> {
    if (identity.expires <= Date.now()) return false;
    const row = await this.env.DB.prepare('SELECT 1 FROM sessions s JOIN room_members m ON m.user_id=s.user_id JOIN rooms r ON r.id=m.room_id WHERE s.id_hash=? AND s.user_id=? AND s.expires_at>? AND m.room_id=?')
      .bind(identity.sessionHash, identity.userId, Date.now(), identity.roomId).first();
    return !!row;
  }

  async fetch(request: Request): Promise<Response> {
    const path = new URL(request.url).pathname;
    const roomId = request.headers.get('x-room-id');
    if (!roomId) return new Response(null, { status: 400 });
    if (path === '/connect' && request.method === 'GET') {
      if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') return new Response(null, { status: 426 });
      const identity: SocketIdentity = {
        roomId, userId: request.headers.get('x-user-id') || '',
        sessionHash: request.headers.get('x-session-hash') || '',
        expires: Number(request.headers.get('x-session-expires')),
      };
      if (!identity.userId || !identity.sessionHash || !Number.isFinite(identity.expires) || !await this.authorized(identity)) return new Response(null, { status: 403 });
      const sockets = this.ctx.getWebSockets().filter(socket => {
        const attached = this.identity(socket);
        if (!attached || attached.expires <= Date.now()) {
          socket.close(4001, 'Session expired');
          return false;
        }
        return socket.readyState === WebSocket.OPEN;
      });
      if (sockets.some(socket => this.identity(socket)?.roomId !== roomId)) return new Response(null, { status: 409 });
      if (sockets.length >= MAX_ROOM_CONNECTIONS || sockets.filter(socket => this.identity(socket)?.userId === identity.userId).length >= MAX_USER_CONNECTIONS) {
        return new Response(null, { status: 429, headers: { 'Retry-After': '30' } });
      }
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      server.serializeAttachment(identity);
      this.ctx.acceptWebSocket(server);
      // Subscribe before requesting the initial snapshot, avoiding the gap
      // between a REST load and installation of the live subscription.
      server.send(JSON.stringify({ type: 'room-changed' }));
      return new Response(null, { status: 101, webSocket: client });
    }
    if (path === '/notify' && request.method === 'POST') {
      const input = await request.json() as { revokeUserId?: string; deleted?: boolean };
      await Promise.all(this.ctx.getWebSockets().map(async socket => {
        const identity = this.identity(socket);
        try {
          if (!identity || identity.roomId !== roomId || input.deleted || identity.userId === input.revokeUserId || !await this.authorized(identity)) {
            socket.close(4001, 'Room access changed');
            return;
          }
          socket.send(JSON.stringify({ type: 'room-changed' }));
        } catch {
          // Fail closed if authority cannot be checked; reconnect reauthenticates.
          socket.close(1011, 'Reconnect required');
        }
      }));
      return Response.json({ ok: true });
    }
    return new Response(null, { status: 404 });
  }

  webSocketMessage(socket: WebSocket, _message: string | ArrayBuffer) {
    // Only automatic ping/pong is accepted. All mutations use authorized REST.
    socket.close(1008, 'Notifications only');
  }
  webSocketClose(socket: WebSocket, _code: number) { socket.close(1000); }
  webSocketError(socket: WebSocket) { socket.close(1011, 'Reconnect required'); }
}
