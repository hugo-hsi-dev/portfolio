import { describe, expect, it } from 'vitest';

import { handleBoardWebSocket, type WebSocketRoomNamespace } from '$lib/server/board-websocket';

const ENDPOINT = 'https://portfolio.test/api/board/ws';

function webSocketRequest(
	url = ENDPOINT,
	headers: HeadersInit = {
		origin: 'https://portfolio.test',
		upgrade: 'websocket'
	}
): Request {
	return new Request(url, { headers });
}

describe('board WebSocket route', () => {
	it('requires a WebSocket upgrade', async () => {
		const request = webSocketRequest(ENDPOINT, {
			origin: 'https://portfolio.test'
		});
		const response = await handleBoardWebSocket({
			request,
			url: new URL(request.url)
		});

		expect(response.status).toBe(426);
		expect(await response.text()).toBe('Expected WebSocket upgrade');
	});

	it('requires an Origin header', async () => {
		const request = webSocketRequest(ENDPOINT, { upgrade: 'websocket' });
		const response = await handleBoardWebSocket({
			request,
			url: new URL(request.url)
		});

		expect(response.status).toBe(403);
		expect(await response.text()).toBe('Forbidden');
	});

	it('rejects a cross-origin upgrade', async () => {
		const request = webSocketRequest(ENDPOINT, {
			origin: 'https://attacker.test',
			upgrade: 'WebSocket'
		});
		const response = await handleBoardWebSocket({
			request,
			url: new URL(request.url)
		});

		expect(response.status).toBe(403);
		expect(await response.text()).toBe('Forbidden');
	});

	it('returns 503 when the realtime binding is unavailable', async () => {
		const request = webSocketRequest();
		const response = await handleBoardWebSocket({
			request,
			url: new URL(request.url)
		});

		expect(response.status).toBe(503);
		expect(await response.text()).toContain('Realtime binding unavailable');
	});

	it('forwards the visitor query and handshake headers to the public room', async () => {
		let roomName = '';
		let proxyRequest: Request | undefined;
		const rooms: WebSocketRoomNamespace = {
			getByName(name) {
				roomName = name;
				return {
					async fetch(input) {
						proxyRequest = new Request(input);
						return new Response('proxied');
					}
				};
			}
		};
		const request = webSocketRequest(`${ENDPOINT}?visitorId=visitor%2Fone&ignored=value`);

		const response = await handleBoardWebSocket({
			request,
			url: new URL(request.url),
			rooms
		});

		expect(response.status).toBe(200);
		expect(await response.text()).toBe('proxied');
		expect(roomName).toBe('public');
		expect(proxyRequest?.url).toBe('https://portfolio-room/ws?visitorId=visitor%2Fone');
		expect(proxyRequest?.headers.get('origin')).toBe('https://portfolio.test');
		expect(proxyRequest?.headers.get('upgrade')).toBe('websocket');
	});

	it('returns 503 when the realtime binding rejects', async () => {
		const rooms: WebSocketRoomNamespace = {
			getByName() {
				return {
					fetch: async () => {
						throw new Error('binding unavailable');
					}
				};
			}
		};
		const request = webSocketRequest();

		const response = await handleBoardWebSocket({
			request,
			url: new URL(request.url),
			rooms
		});

		expect(response.status).toBe(503);
		expect(await response.text()).toContain('Realtime binding unavailable');
	});
});
