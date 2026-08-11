import { exports } from 'cloudflare:workers';
import {
	CURRENT_PROTOCOL_VERSION,
	legacyServerMessageSchema,
	serverMessageSchema,
	type LegacyRoomSnapshot,
	type LegacyServerMessage,
	type RoomSnapshot,
	type ServerMessage
} from '@portfolio/realtime-contract';
import { expect } from 'vitest';

export const RESET_TOKEN = 'test-reset-token-at-least-32-characters';
export const VISITOR_A = '2ac3308f-a622-4b9b-9782-981d19ef943c';
export const VISITOR_B = 'af25372d-9b06-4cd3-a849-aac48d490713';
export const ALLOWED_ORIGIN = 'https://hugohsi.dev';

const MESSAGE_TIMEOUT_MS = 5_000;
const openSockets = new Set<WebSocket>();

export async function closeOpenSockets(): Promise<void> {
	await Promise.all(
		Array.from(openSockets, (socket) => {
			if (socket.readyState === WebSocket.CLOSED) return Promise.resolve();
			return new Promise<void>((resolve) => {
				const timeout = setTimeout(resolve, 250);
				socket.addEventListener(
					'close',
					() => {
						clearTimeout(timeout);
						resolve();
					},
					{ once: true }
				);
				socket.close(1000, 'Test cleanup');
			});
		})
	);
	openSockets.clear();
}

export function nextMessage(
	socket: WebSocket,
	accept: (message: ServerMessage) => boolean = () => true
): Promise<ServerMessage> {
	return new Promise((resolve, reject) => {
		const timeout = setTimeout(() => {
			socket.removeEventListener('message', listener);
			reject(new Error('Timed out waiting for WebSocket message'));
		}, MESSAGE_TIMEOUT_MS);
		const listener = (event: MessageEvent) => {
			try {
				const message = serverMessageSchema.parse(JSON.parse(String(event.data)));
				if (!accept(message)) return;
				clearTimeout(timeout);
				socket.removeEventListener('message', listener);
				resolve(message);
			} catch (error) {
				clearTimeout(timeout);
				socket.removeEventListener('message', listener);
				reject(error);
			}
		};
		socket.addEventListener('message', listener);
	});
}

export function nextLegacyMessage(
	socket: WebSocket,
	accept: (message: LegacyServerMessage) => boolean = () => true
): Promise<LegacyServerMessage> {
	return new Promise((resolve, reject) => {
		const timeout = setTimeout(() => {
			socket.removeEventListener('message', listener);
			reject(new Error('Timed out waiting for legacy WebSocket message'));
		}, MESSAGE_TIMEOUT_MS);
		const listener = (event: MessageEvent) => {
			try {
				const message = legacyServerMessageSchema.parse(JSON.parse(String(event.data)));
				if (!accept(message)) return;
				clearTimeout(timeout);
				socket.removeEventListener('message', listener);
				resolve(message);
			} catch (error) {
				clearTimeout(timeout);
				socket.removeEventListener('message', listener);
				reject(error);
			}
		};
		socket.addEventListener('message', listener);
	});
}

export function collectMessages(
	socket: WebSocket,
	count: number,
	accept: (message: ServerMessage) => boolean
): Promise<ServerMessage[]> {
	return new Promise((resolve, reject) => {
		const messages: ServerMessage[] = [];
		const timeout = setTimeout(() => {
			socket.removeEventListener('message', listener);
			reject(new Error(`Timed out waiting for ${count} WebSocket messages`));
		}, MESSAGE_TIMEOUT_MS);
		const listener = (event: MessageEvent) => {
			try {
				const message = serverMessageSchema.parse(JSON.parse(String(event.data)));
				if (!accept(message)) return;
				messages.push(message);
				if (messages.length !== count) return;
				clearTimeout(timeout);
				socket.removeEventListener('message', listener);
				resolve(messages);
			} catch (error) {
				clearTimeout(timeout);
				socket.removeEventListener('message', listener);
				reject(error);
			}
		};
		socket.addEventListener('message', listener);
	});
}

export function nextClose(socket: WebSocket): Promise<CloseEvent> {
	return new Promise((resolve, reject) => {
		const timeout = setTimeout(() => {
			socket.removeEventListener('close', listener);
			reject(new Error('Timed out waiting for WebSocket close'));
		}, MESSAGE_TIMEOUT_MS);
		const listener = (event: CloseEvent) => {
			clearTimeout(timeout);
			socket.removeEventListener('close', listener);
			resolve(event);
		};
		socket.addEventListener('close', listener);
	});
}

export async function connect(
	visitorId: string
): Promise<{ socket: WebSocket; snapshot: RoomSnapshot }> {
	const response = await exports.default.fetch(
		new Request(
			`http://realtime.test/ws?visitorId=${visitorId}&protocol=${CURRENT_PROTOCOL_VERSION}`,
			{
				headers: { Upgrade: 'websocket', Origin: ALLOWED_ORIGIN }
			}
		)
	);
	expect(response.status).toBe(101);
	const socket = acceptSocket(response);
	const message = await nextMessage(socket, (candidate) => candidate.type === 'room.snapshot');
	if (message.type !== 'room.snapshot') throw new Error('Expected a room snapshot');
	return { socket, snapshot: message };
}

export async function connectLegacy(
	visitorId: string
): Promise<{ socket: WebSocket; snapshot: LegacyRoomSnapshot }> {
	const response = await exports.default.fetch(
		new Request(`http://realtime.test/ws?visitorId=${visitorId}`, {
			headers: { Upgrade: 'websocket', Origin: ALLOWED_ORIGIN }
		})
	);
	expect(response.status).toBe(101);
	const socket = acceptSocket(response);
	const message = await nextLegacyMessage(
		socket,
		(candidate) => candidate.type === 'room.snapshot'
	);
	if (message.type !== 'room.snapshot') throw new Error('Expected a legacy room snapshot');
	return { socket, snapshot: message };
}

function acceptSocket(response: Response): WebSocket {
	const socket = response.webSocket;
	if (!socket) throw new Error('Expected a WebSocket response');
	openSockets.add(socket);
	socket.addEventListener('close', () => openSockets.delete(socket));
	socket.accept();
	return socket;
}
