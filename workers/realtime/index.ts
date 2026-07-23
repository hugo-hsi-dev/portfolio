import { DurableObject } from 'cloudflare:workers';
import { z } from 'zod';

import { DEFAULT_FRAME_POSITIONS, FRAME_IDS, type FrameId } from '../../src/lib/realtime/layout';
import {
	clientMessageSchema,
	identitySchema,
	peerStateSchema,
	type FrameState,
	type Identity,
	type PeerState,
	type RoomSnapshot,
	type ServerMessage
} from '../../src/lib/realtime/protocol';

interface FrameRow {
	frame_id: string;
	x: number;
	y: number;
	revision: number;
	updated_at: number;
	updated_by: string | null;
}

const attachmentSchema = peerStateSchema.extend({
	lastSeq: z.number().int().min(-1).max(Number.MAX_SAFE_INTEGER),
	rateWindowStartedAt: z.number().int().nonnegative(),
	rateWindowCount: z.number().int().nonnegative()
});

type ConnectionAttachment = z.infer<typeof attachmentSchema>;

const MAX_CLIENT_MESSAGE_BYTES = 2_048;
const MAX_CONNECTIONS = 64;
// A drag can emit one frame update and one cursor update at 20 Hz, plus start/end bursts.
const MAX_MESSAGES_PER_SECOND = 60;
const ROOM_NAME = 'public';
const RESET_HEADER = 'x-board-reset-token';

const CURSOR_COLORS = [
	'#f24822',
	'#a259ff',
	'#1abcfe',
	'#0acf83',
	'#ff7262',
	'#8b5cf6',
	'#ea4c89',
	'#14b8a6'
] as const;

function log(
	level: 'info' | 'warn' | 'error',
	message: string,
	data: Record<string, unknown> = {}
) {
	const entry = JSON.stringify({ level, message, timestamp: new Date().toISOString(), ...data });
	if (level === 'error') console.error(entry);
	else if (level === 'warn') console.warn(entry);
	else console.log(entry);
}

function identityForVisitor(visitorId: string, sessionId: string): Identity {
	let hash = 2_166_136_261;
	for (const character of visitorId) {
		hash ^= character.charCodeAt(0);
		hash = Math.imul(hash, 16_777_619);
	}
	const unsignedHash = hash >>> 0;
	return {
		sessionId,
		visitorId,
		name: `Guest ${String((unsignedHash % 9_000) + 1_000)}`,
		color: CURSOR_COLORS[unsignedHash % CURSOR_COLORS.length]
	};
}

async function tokensMatch(provided: string, expected: string): Promise<boolean> {
	const encoder = new TextEncoder();
	const [providedHash, expectedHash] = await Promise.all([
		crypto.subtle.digest('SHA-256', encoder.encode(provided)),
		crypto.subtle.digest('SHA-256', encoder.encode(expected))
	]);
	return crypto.subtle.timingSafeEqual(providedHash, expectedHash);
}

function isAllowedOrigin(request: Request, allowedOrigins: string): boolean {
	const origin = request.headers.get('origin');
	if (!origin) return false;
	try {
		const parsed = new URL(origin);
		if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
		return allowedOrigins
			.split(',')
			.map((value) => value.trim())
			.filter(Boolean)
			.includes(parsed.origin);
	} catch {
		return false;
	}
}

function attachmentFor(socket: WebSocket): ConnectionAttachment | null {
	const parsed = attachmentSchema.safeParse(socket.deserializeAttachment());
	return parsed.success ? parsed.data : null;
}

export class PortfolioRoom extends DurableObject<RealtimeEnv> {
	constructor(ctx: DurableObjectState, env: RealtimeEnv) {
		super(ctx, env);
		ctx.blockConcurrencyWhile(async () => this.initializeStorage());
	}

	private initializeStorage(): void {
		this.ctx.storage.sql.exec(`
			CREATE TABLE IF NOT EXISTS frames (
				frame_id TEXT PRIMARY KEY,
				x REAL NOT NULL,
				y REAL NOT NULL,
				revision INTEGER NOT NULL DEFAULT 0,
				updated_at INTEGER NOT NULL DEFAULT 0,
				updated_by TEXT
			);
			CREATE TABLE IF NOT EXISTS meta (
				key TEXT PRIMARY KEY,
				value INTEGER NOT NULL
			);
			INSERT OR IGNORE INTO meta (key, value) VALUES ('global_revision', 0);
		`);

		for (const frame of DEFAULT_FRAME_POSITIONS) {
			this.ctx.storage.sql.exec(
				`INSERT OR IGNORE INTO frames
				 (frame_id, x, y, revision, updated_at, updated_by)
				 VALUES (?, ?, ?, 0, 0, NULL)`,
				frame.id,
				frame.x,
				frame.y
			);
		}
	}

	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);
		if (request.method === 'POST' && url.pathname === '/reset') {
			return this.handleReset(request);
		}
		if (request.method !== 'GET' || url.pathname !== '/ws') {
			return new Response('Not found', { status: 404 });
		}
		if (request.headers.get('upgrade')?.toLowerCase() !== 'websocket') {
			return new Response('Expected WebSocket upgrade', { status: 426 });
		}
		if (!isAllowedOrigin(request, this.env.ALLOWED_ORIGINS)) {
			return new Response('Forbidden', { status: 403 });
		}

		const visitorIdResult = z.uuid().safeParse(url.searchParams.get('visitorId'));
		if (!visitorIdResult.success) {
			return new Response('Invalid visitor id', { status: 400 });
		}
		const activeConnections = this.ctx
			.getWebSockets()
			.filter((socket) => socket.readyState === WebSocket.OPEN).length;
		if (activeConnections >= MAX_CONNECTIONS) {
			return new Response('Room is full', { status: 503 });
		}

		const [client, server] = Object.values(new WebSocketPair());
		const identity = identityForVisitor(visitorIdResult.data, crypto.randomUUID());
		const attachment: ConnectionAttachment = {
			...identity,
			cursor: null,
			selectedFrameId: null,
			lastSeq: -1,
			rateWindowStartedAt: Date.now(),
			rateWindowCount: 0
		};

		this.ctx.acceptWebSocket(server);
		server.serializeAttachment(attachment);
		server.send(JSON.stringify(this.createSnapshot(identity, server)));
		this.broadcast({ type: 'peer.join', peer: this.toPeerState(attachment) }, server);
		log('info', 'peer connected', {
			sessionId: identity.sessionId,
			connections: activeConnections + 1
		});

		return new Response(null, { status: 101, webSocket: client });
	}

	webSocketMessage(socket: WebSocket, message: string | ArrayBuffer): void {
		const attachment = attachmentFor(socket);
		if (!attachment) {
			socket.close(1008, 'Invalid session');
			return;
		}
		const now = Date.now();
		if (now - attachment.rateWindowStartedAt >= 1_000) {
			attachment.rateWindowStartedAt = now;
			attachment.rateWindowCount = 0;
		}
		attachment.rateWindowCount += 1;
		socket.serializeAttachment(attachment);
		if (attachment.rateWindowCount > MAX_MESSAGES_PER_SECOND) {
			this.sendError(socket, 'rate-limited', 'Too many updates. Please slow down.');
			return;
		}
		if (typeof message !== 'string') {
			this.sendError(socket, 'invalid-message', 'Binary messages are not supported.');
			return;
		}
		if (new TextEncoder().encode(message).byteLength > MAX_CLIENT_MESSAGE_BYTES) {
			this.sendError(socket, 'message-too-large', 'Message exceeds the 2 KB limit.');
			return;
		}

		let json: unknown;
		try {
			json = JSON.parse(message);
		} catch {
			this.sendError(socket, 'invalid-message', 'Message must be valid JSON.');
			return;
		}
		const parsed = clientMessageSchema.safeParse(json);
		if (!parsed.success) {
			this.sendError(socket, 'invalid-message', 'Message does not match the realtime protocol.');
			return;
		}
		if (parsed.data.seq <= attachment.lastSeq) return;
		attachment.lastSeq = parsed.data.seq;

		if (parsed.data.type === 'presence.update') {
			attachment.cursor = parsed.data.cursor;
			attachment.selectedFrameId = parsed.data.selectedFrameId;
			socket.serializeAttachment(attachment);
			this.broadcast(
				{
					type: 'peer.update',
					sessionId: attachment.sessionId,
					cursor: attachment.cursor,
					selectedFrameId: attachment.selectedFrameId
				},
				socket
			);
			return;
		}

		socket.serializeAttachment(attachment);
		const updatedAt = Date.now();
		let revision: number;
		try {
			revision = this.ctx.storage.transactionSync(() => {
				const nextRevision = this.nextRevision();
				this.ctx.storage.sql.exec(
					`UPDATE frames
					 SET x = ?, y = ?, revision = ?, updated_at = ?, updated_by = ?
					 WHERE frame_id = ?`,
					parsed.data.x,
					parsed.data.y,
					nextRevision,
					updatedAt,
					attachment.sessionId,
					parsed.data.frameId
				);
				return nextRevision;
			});
		} catch (error) {
			log('error', 'frame update failed', {
				sessionId: attachment.sessionId,
				frameId: parsed.data.frameId,
				error: error instanceof Error ? error.message : String(error)
			});
			this.sendError(socket, 'server-error', 'The frame could not be updated.');
			return;
		}
		const frame: FrameState = {
			id: parsed.data.frameId,
			x: parsed.data.x,
			y: parsed.data.y,
			revision,
			updatedAt,
			updatedBy: attachment.sessionId
		};
		this.broadcast({
			type: 'frame.update',
			frame,
			sourceSessionId: attachment.sessionId,
			clientSeq: parsed.data.seq
		});
	}

	webSocketClose(socket: WebSocket): void {
		const attachment = attachmentFor(socket);
		if (!attachment) return;
		this.broadcast({ type: 'peer.leave', sessionId: attachment.sessionId }, socket);
		log('info', 'peer disconnected', { sessionId: attachment.sessionId });
	}

	webSocketError(socket: WebSocket, error: unknown): void {
		const attachment = attachmentFor(socket);
		log('error', 'websocket error', {
			sessionId: attachment?.sessionId,
			error: error instanceof Error ? error.message : String(error)
		});
	}

	async getBoardState(): Promise<{ revision: number; frames: FrameState[] }> {
		return { revision: this.getRevision(), frames: this.getFrames() };
	}

	private createSnapshot(identity: Identity, currentSocket: WebSocket): RoomSnapshot {
		const peers = this.ctx
			.getWebSockets()
			.filter((socket) => socket !== currentSocket && socket.readyState === WebSocket.OPEN)
			.map(attachmentFor)
			.filter((attachment): attachment is ConnectionAttachment => attachment !== null)
			.map((attachment) => this.toPeerState(attachment));
		return {
			type: 'room.snapshot',
			revision: this.getRevision(),
			frames: this.getFrames(),
			self: identitySchema.parse(identity),
			peers
		};
	}

	private toPeerState(attachment: ConnectionAttachment): PeerState {
		return {
			sessionId: attachment.sessionId,
			visitorId: attachment.visitorId,
			name: attachment.name,
			color: attachment.color,
			cursor: attachment.cursor,
			selectedFrameId: attachment.selectedFrameId
		};
	}

	private getRevision(): number {
		return this.ctx.storage.sql
			.exec<{ value: number }>("SELECT value FROM meta WHERE key = 'global_revision'")
			.one().value;
	}

	private nextRevision(): number {
		this.ctx.storage.sql.exec("UPDATE meta SET value = value + 1 WHERE key = 'global_revision'");
		return this.getRevision();
	}

	private getFrames(): FrameState[] {
		const rows = this.ctx.storage.sql.exec<FrameRow>('SELECT * FROM frames').toArray();
		const byId = new Map(rows.map((row) => [row.frame_id, row]));
		return FRAME_IDS.map((id) => this.rowToFrame(id, byId.get(id)));
	}

	private rowToFrame(id: FrameId, row: FrameRow | undefined): FrameState {
		if (!row) throw new Error(`Missing persisted frame: ${id}`);
		return {
			id,
			x: row.x,
			y: row.y,
			revision: row.revision,
			updatedAt: row.updated_at,
			updatedBy: row.updated_by
		};
	}

	private broadcast(message: ServerMessage, except?: WebSocket): void {
		const payload = JSON.stringify(message);
		for (const socket of this.ctx.getWebSockets()) {
			if (socket === except || socket.readyState !== WebSocket.OPEN) continue;
			try {
				socket.send(payload);
			} catch (error) {
				log('warn', 'broadcast failed', {
					error: error instanceof Error ? error.message : String(error)
				});
			}
		}
	}

	private sendError(
		socket: WebSocket,
		code: 'invalid-message' | 'message-too-large' | 'rate-limited' | 'server-error',
		message: string
	): void {
		if (socket.readyState === WebSocket.OPEN) {
			socket.send(JSON.stringify({ type: 'error', code, message } satisfies ServerMessage));
		}
	}

	private async handleReset(request: Request): Promise<Response> {
		const provided = request.headers.get(RESET_HEADER);
		if (!provided || !this.env.BOARD_RESET_TOKEN) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 });
		}
		if (!(await tokensMatch(provided, this.env.BOARD_RESET_TOKEN))) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const updatedAt = Date.now();
		const revision = this.ctx.storage.transactionSync(() => {
			const nextRevision = this.nextRevision();
			for (const frame of DEFAULT_FRAME_POSITIONS) {
				this.ctx.storage.sql.exec(
					`UPDATE frames
					 SET x = ?, y = ?, revision = ?, updated_at = ?, updated_by = 'owner-reset'
					 WHERE frame_id = ?`,
					frame.x,
					frame.y,
					nextRevision,
					updatedAt,
					frame.id
				);
			}
			return nextRevision;
		});
		const frames = this.getFrames();
		this.broadcast({ type: 'board.reset', revision, frames });
		log('info', 'board reset', { revision });
		return Response.json({ ok: true, revision });
	}
}

export default {
	async fetch(request, env): Promise<Response> {
		const url = new URL(request.url);
		try {
			if (url.pathname === '/health') {
				return Response.json({ ok: true });
			}
			if (url.pathname !== '/ws' && url.pathname !== '/reset') {
				return new Response('Not found', { status: 404 });
			}
			const room = env.PORTFOLIO_ROOMS.getByName(ROOM_NAME);
			return await room.fetch(request);
		} catch (error) {
			log('error', 'request failed', {
				path: url.pathname,
				error: error instanceof Error ? error.message : String(error)
			});
			return Response.json({ error: 'Realtime service unavailable' }, { status: 503 });
		}
	}
} satisfies ExportedHandler<RealtimeEnv>;
