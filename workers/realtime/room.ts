import { DurableObject } from 'cloudflare:workers';
import {
	CURRENT_PROTOCOL_VERSION,
	LEGACY_PROTOCOL_VERSION,
	MAX_CLIENT_MESSAGE_BYTES,
	clientMessageSchema,
	identitySchema,
	legacyClientMessageSchema,
	normalizeLegacyClientMessage,
	serverMessageForProtocol,
	visitorIdSchema,
	type ClientMessage,
	type FrameState,
	type Identity,
	type ProtocolVersion,
	type RoomSnapshot,
	type ServerMessage
} from '@portfolio/realtime-contract';

import { MAX_CONNECTIONS, RATE_LIMIT_CLOSE_CODE, RESET_HEADER } from './constants';
import { log } from './logger';
import {
	attachmentFor,
	identityForVisitor,
	isAllowedOrigin,
	recordMessage,
	toPeerState,
	tokensMatch,
	type ConnectionAttachment
} from './policy';
import { FrameLockedError, PortfolioRoomStorage } from './storage';

function protocolVersionForUrl(url: URL): ProtocolVersion | null {
	const requested = url.searchParams.get('protocol');
	if (requested === null || requested === String(LEGACY_PROTOCOL_VERSION)) {
		return LEGACY_PROTOCOL_VERSION;
	}
	return requested === String(CURRENT_PROTOCOL_VERSION) ? CURRENT_PROTOCOL_VERSION : null;
}

export class PortfolioRoom extends DurableObject<RealtimeEnv> {
	private readonly boardStorage: PortfolioRoomStorage;

	constructor(ctx: DurableObjectState, env: RealtimeEnv) {
		super(ctx, env);
		this.boardStorage = new PortfolioRoomStorage(ctx.storage);
		ctx.blockConcurrencyWhile(async () => this.boardStorage.migrate());
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

		const visitorIdResult = visitorIdSchema.safeParse(url.searchParams.get('visitorId'));
		if (!visitorIdResult.success) {
			return new Response('Invalid visitor id', { status: 400 });
		}
		const protocolVersion = protocolVersionForUrl(url);
		if (protocolVersion === null) {
			return new Response('Unsupported realtime protocol', { status: 400 });
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
			view: null,
			protocolVersion,
			lastSeq: -1,
			rateWindowStartedAt: Date.now(),
			rateWindowCount: 0,
			rateLimited: false
		};

		this.ctx.acceptWebSocket(server);
		server.serializeAttachment(attachment);
		this.sendMessage(server, this.createSnapshot(identity, server));
		this.broadcast({ type: 'peer.join', peer: toPeerState(attachment) }, server);
		log('info', 'peer connected', {
			sessionId: identity.sessionId,
			connections: activeConnections + 1
		});

		return new Response(null, { status: 101, webSocket: client });
	}

	webSocketMessage(socket: WebSocket, message: string | ArrayBuffer): void {
		const currentAttachment = attachmentFor(socket);
		if (!currentAttachment) {
			socket.close(1008, 'Invalid session');
			return;
		}

		const rate = recordMessage(currentAttachment, Date.now());
		const attachment = rate.attachment;
		socket.serializeAttachment(attachment);
		if (rate.exceeded) {
			if (!currentAttachment.rateLimited) {
				this.sendError(socket, 'rate-limited', 'Too many updates. Please slow down.');
				socket.close(RATE_LIMIT_CLOSE_CODE, 'Rate limit exceeded');
			}
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
		let clientMessage: ClientMessage;
		if (attachment.protocolVersion === CURRENT_PROTOCOL_VERSION) {
			const parsed = clientMessageSchema.safeParse(json);
			if (!parsed.success) {
				this.sendError(socket, 'invalid-message', 'Message does not match the realtime protocol.');
				return;
			}
			clientMessage = parsed.data;
		} else {
			const parsed = legacyClientMessageSchema.safeParse(json);
			if (!parsed.success) {
				this.sendError(socket, 'invalid-message', 'Message does not match the realtime protocol.');
				return;
			}
			clientMessage = normalizeLegacyClientMessage(parsed.data);
		}
		if (clientMessage.seq <= attachment.lastSeq) return;

		if (clientMessage.type === 'presence.update') {
			const updatedAttachment: ConnectionAttachment = {
				...attachment,
				lastSeq: clientMessage.seq,
				cursor: clientMessage.cursor,
				selectedFrameId: clientMessage.selectedFrameId,
				view: clientMessage.view
			};
			socket.serializeAttachment(updatedAttachment);
			this.broadcast(
				{
					type: 'peer.update',
					sessionId: updatedAttachment.sessionId,
					cursor: updatedAttachment.cursor,
					selectedFrameId: updatedAttachment.selectedFrameId,
					view: updatedAttachment.view
				},
				socket
			);
			return;
		}

		let frame: FrameState;
		try {
			frame =
				clientMessage.type === 'frame.move'
					? this.boardStorage.moveFrame(
							clientMessage.frameId,
							clientMessage.x,
							clientMessage.y,
							Date.now(),
							attachment.sessionId
						)
					: this.boardStorage.updateFrameMetadata(
							clientMessage.frameId,
							{ visible: clientMessage.visible, locked: clientMessage.locked },
							Date.now(),
							attachment.sessionId
						);
		} catch (error) {
			if (error instanceof FrameLockedError) {
				this.sendError(socket, 'frame-locked', 'Unlock the frame before moving it.');
				return;
			}
			log('error', 'frame update failed', {
				sessionId: attachment.sessionId,
				frameId: clientMessage.frameId,
				error: error instanceof Error ? error.message : String(error)
			});
			this.sendError(socket, 'server-error', 'The frame could not be updated.');
			return;
		}

		socket.serializeAttachment({ ...attachment, lastSeq: clientMessage.seq });
		this.broadcast({
			type: 'frame.update',
			frame,
			sourceSessionId: attachment.sessionId,
			clientSeq: clientMessage.seq
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
		return this.boardStorage.getBoardState();
	}

	private createSnapshot(identity: Identity, currentSocket: WebSocket): RoomSnapshot {
		const peers = this.ctx
			.getWebSockets()
			.filter((socket) => socket !== currentSocket && socket.readyState === WebSocket.OPEN)
			.map(attachmentFor)
			.filter((attachment): attachment is ConnectionAttachment => attachment !== null)
			.map(toPeerState);
		const board = this.boardStorage.getBoardState();
		return {
			type: 'room.snapshot',
			revision: board.revision,
			frames: board.frames,
			self: identitySchema.parse(identity),
			peers
		};
	}

	private broadcast(message: ServerMessage, except?: WebSocket): void {
		for (const socket of this.ctx.getWebSockets()) {
			if (socket === except || socket.readyState !== WebSocket.OPEN) continue;
			try {
				this.sendMessage(socket, message);
			} catch (error) {
				log('warn', 'broadcast failed', {
					error: error instanceof Error ? error.message : String(error)
				});
			}
		}
	}

	private sendMessage(socket: WebSocket, message: ServerMessage): void {
		const protocolVersion = attachmentFor(socket)?.protocolVersion ?? LEGACY_PROTOCOL_VERSION;
		socket.send(JSON.stringify(serverMessageForProtocol(message, protocolVersion)));
	}

	private sendError(
		socket: WebSocket,
		code:
			'invalid-message' | 'message-too-large' | 'rate-limited' | 'frame-locked' | 'server-error',
		message: string
	): void {
		if (socket.readyState === WebSocket.OPEN) {
			this.sendMessage(socket, { type: 'error', code, message });
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

		const reset = this.boardStorage.reset(Date.now());
		this.broadcast({ type: 'board.reset', revision: reset.revision, frames: reset.frames });
		log('info', 'board reset', { revision: reset.revision });
		return Response.json({ ok: true, revision: reset.revision });
	}
}
