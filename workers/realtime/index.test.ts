import { env, exports } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';

import { DEFAULT_FRAME_POSITIONS } from '../../src/lib/realtime/layout';
import {
	serverMessageSchema,
	type RoomSnapshot,
	type ServerMessage
} from '../../src/lib/realtime/protocol';

const RESET_TOKEN = 'test-reset-token-at-least-32-characters';
const VISITOR_A = '2ac3308f-a622-4b9b-9782-981d19ef943c';
const VISITOR_B = 'af25372d-9b06-4cd3-a849-aac48d490713';

function simulatedVisitorId(index: number): string {
	return `00000000-0000-4000-8000-${index.toString().padStart(12, '0')}`;
}

function nextMessage(
	socket: WebSocket,
	accept: (message: ServerMessage) => boolean = () => true
): Promise<ServerMessage> {
	return new Promise((resolve, reject) => {
		const timeout = setTimeout(() => {
			socket.removeEventListener('message', listener);
			reject(new Error('Timed out waiting for WebSocket message'));
		}, 2_000);
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

function collectMessages(
	socket: WebSocket,
	count: number,
	accept: (message: ServerMessage) => boolean
): Promise<ServerMessage[]> {
	return new Promise((resolve, reject) => {
		const messages: ServerMessage[] = [];
		const timeout = setTimeout(() => {
			socket.removeEventListener('message', listener);
			reject(new Error(`Timed out waiting for ${count} WebSocket messages`));
		}, 2_000);
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

async function connect(visitorId: string): Promise<{ socket: WebSocket; snapshot: RoomSnapshot }> {
	const response = await exports.default.fetch(
		new Request(`http://realtime.test/ws?visitorId=${visitorId}`, {
			headers: { Upgrade: 'websocket', Origin: 'http://localhost:5173' }
		})
	);
	expect(response.status).toBe(101);
	const socket = response.webSocket;
	if (!socket) throw new Error('Expected a WebSocket response');
	socket.accept();
	const message = await nextMessage(socket, (candidate) => candidate.type === 'room.snapshot');
	if (message.type !== 'room.snapshot') throw new Error('Expected a room snapshot');
	return { socket, snapshot: message };
}

describe('PortfolioRoom', () => {
	it('coordinates presence, LWW moves, validation, rate limits, reconnects and reset', async () => {
		const room = env.PORTFOLIO_ROOMS.getByName('public');
		const initial = await room.getBoardState();
		expect(initial.frames).toHaveLength(DEFAULT_FRAME_POSITIONS.length);
		expect(initial.revision).toBe(0);

		const first = await connect(VISITOR_A);
		const joinPromise = nextMessage(first.socket, (message) => message.type === 'peer.join');
		const second = await connect(VISITOR_B);
		const joined = await joinPromise;
		expect(joined.type === 'peer.join' && joined.peer.visitorId).toBe(VISITOR_B);
		expect(second.snapshot.peers).toHaveLength(1);

		const presencePromise = nextMessage(second.socket, (message) => message.type === 'peer.update');
		first.socket.send(
			JSON.stringify({
				type: 'presence.update',
				seq: 1,
				cursor: { x: 40, y: 80 },
				selectedFrameId: 'profile'
			})
		);
		const presence = await presencePromise;
		expect(presence.type === 'peer.update' && presence.cursor).toEqual({ x: 40, y: 80 });

		const malformedPromise = nextMessage(
			first.socket,
			(message) => message.type === 'error' && message.code === 'invalid-message'
		);
		first.socket.send('{');
		expect((await malformedPromise).type).toBe('error');

		const concurrentUpdates = collectMessages(
			first.socket,
			2,
			(message) => message.type === 'frame.update'
		);
		first.socket.send(
			JSON.stringify({
				type: 'frame.move',
				seq: 2,
				frameId: 'profile',
				x: 321,
				y: 654,
				final: true
			})
		);
		second.socket.send(
			JSON.stringify({
				type: 'frame.move',
				seq: 1,
				frameId: 'profile',
				x: 987,
				y: 123,
				final: true
			})
		);
		const moves = (await concurrentUpdates)
			.filter((message) => message.type === 'frame.update')
			.sort((a, b) => a.frame.revision - b.frame.revision);
		expect(moves.map((move) => move.frame.revision)).toEqual([1, 2]);
		const winner = moves[1].frame;
		const moved = await room.getBoardState();
		expect(moved.revision).toBe(2);
		expect(moved.frames.find((frame) => frame.id === 'profile')).toMatchObject({
			x: winner.x,
			y: winner.y,
			revision: winner.revision
		});

		const rateLimitPromise = nextMessage(
			first.socket,
			(message) => message.type === 'error' && message.code === 'rate-limited'
		);
		for (let seq = 3; seq < 75; seq += 1) {
			first.socket.send(
				JSON.stringify({
					type: 'presence.update',
					seq,
					cursor: null,
					selectedFrameId: null
				})
			);
		}
		const rateLimited = await rateLimitPromise;
		expect(rateLimited.type === 'error' && rateLimited.code).toBe('rate-limited');

		first.socket.close(1000, 'Reconnect test');
		const reconnected = await connect(VISITOR_A);
		expect(reconnected.snapshot.revision).toBe(2);
		expect(reconnected.snapshot.frames.find((frame) => frame.id === 'profile')).toMatchObject({
			x: winner.x,
			y: winner.y
		});

		const resetResponse = await exports.default.fetch(
			new Request('http://realtime.test/reset', {
				method: 'POST',
				headers: { 'x-board-reset-token': RESET_TOKEN }
			})
		);
		expect(resetResponse.status).toBe(200);
		const reset = await room.getBoardState();
		expect(reset.revision).toBe(3);
		expect(reset.frames.find((frame) => frame.id === 'profile')).toMatchObject({ x: 0, y: 0 });

		const additionalCollaborators = await Promise.all(
			Array.from({ length: 23 }, (_, index) => connect(simulatedVisitorId(index + 1)))
		);
		expect(additionalCollaborators).toHaveLength(23);
		for (const collaborator of additionalCollaborators) {
			collaborator.socket.close(1000, 'Load test complete');
		}

		second.socket.close(1000, 'Test complete');
		reconnected.socket.close(1000, 'Test complete');
	});
});
