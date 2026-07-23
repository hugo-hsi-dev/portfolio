import { describe, expect, it, vi } from 'vitest';

import {
	forwardReset,
	handleBoardReset,
	type RequestFetcher,
	type ResetRoomNamespace
} from '$lib/server/board-reset';

const RESET_URL = 'https://portfolio.test/api/board/reset';

function resetRequest(body: string, headers?: HeadersInit): Request {
	return new Request(RESET_URL, { method: 'POST', body, headers });
}

function roomNamespace(fetcher: RequestFetcher): ResetRoomNamespace {
	return {
		getByName: () => ({ fetch: fetcher })
	};
}

describe('board reset route', () => {
	it('rejects malformed JSON as a client error', async () => {
		const response = await handleBoardReset(resetRequest('{'), {
			isDevelopment: false
		});

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({ error: 'Invalid request' });
	});

	it('rejects a missing token as a client error', async () => {
		const response = await handleBoardReset(resetRequest('{}'), {
			isDevelopment: false
		});

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({ error: 'Invalid request' });
	});

	it('rejects a body declared over the byte limit without reading it', async () => {
		let pullCount = 0;
		let wasCancelled = false;
		const body = new ReadableStream<Uint8Array>({
			pull() {
				pullCount += 1;
			},
			cancel() {
				wasCancelled = true;
			}
		});
		const init: RequestInit & { duplex: 'half' } = {
			method: 'POST',
			body,
			headers: { 'content-length': '2049' },
			duplex: 'half'
		};
		const request = new Request(RESET_URL, init);

		const response = await handleBoardReset(request, { isDevelopment: false });

		expect(response.status).toBe(400);
		expect(wasCancelled).toBe(true);
		expect(pullCount).toBe(0);
	});

	it('cancels a streamed body after it exceeds the byte limit', async () => {
		let wasCancelled = false;
		const body = new ReadableStream<Uint8Array>({
			start(controller) {
				controller.enqueue(new TextEncoder().encode('{"token":"'));
				controller.enqueue(new Uint8Array(2_048));
			},
			cancel() {
				wasCancelled = true;
			}
		});
		const init: RequestInit & { duplex: 'half' } = {
			method: 'POST',
			body,
			duplex: 'half'
		};
		const request = new Request(RESET_URL, init);

		const response = await handleBoardReset(request, { isDevelopment: false });

		expect(response.status).toBe(400);
		expect(wasCancelled).toBe(true);
	});

	it('returns 503 when the production binding is unavailable', async () => {
		const response = await handleBoardReset(resetRequest('{"token":"owner-token"}'), {
			isDevelopment: false
		});

		expect(response.status).toBe(503);
		expect(await response.json()).toEqual({ error: 'Reset unavailable' });
	});

	it('returns 503 when the production reset secret is unavailable', async () => {
		const rooms = roomNamespace(async () => new Response(null, { status: 204 }));
		const response = await handleBoardReset(resetRequest('{"token":"owner-token"}'), {
			isDevelopment: false,
			rooms
		});

		expect(response.status).toBe(503);
		expect(await response.json()).toEqual({ error: 'Reset unavailable' });
	});

	it('rejects an incorrect token before resolving a room', async () => {
		const getByName = vi.fn(() => ({
			fetch: async () => new Response(null, { status: 204 })
		}));
		const response = await handleBoardReset(resetRequest('{"token":"wrong"}'), {
			isDevelopment: false,
			rooms: { getByName },
			expectedToken: 'expected',
			matchesToken: async () => false
		});

		expect(response.status).toBe(401);
		expect(await response.json()).toEqual({ error: 'Unauthorized' });
		expect(getByName).not.toHaveBeenCalled();
	});

	it('forwards a valid reset to the public room', async () => {
		let roomName = '';
		let forwardedInput: RequestInfo | URL | undefined;
		let forwardedInit: RequestInit | undefined;
		const rooms: ResetRoomNamespace = {
			getByName(name) {
				roomName = name;
				return {
					async fetch(input, init) {
						forwardedInput = input;
						forwardedInit = init;
						return new Response(null, { status: 204 });
					}
				};
			}
		};

		const response = await handleBoardReset(resetRequest('{"token":"owner-token"}'), {
			isDevelopment: false,
			rooms,
			expectedToken: 'expected-token',
			matchesToken: async (provided, expected) =>
				provided === 'owner-token' && expected === 'expected-token'
		});

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ ok: true });
		expect(roomName).toBe('public');
		expect(String(forwardedInput)).toBe('https://portfolio-room/reset');
		expect(forwardedInit).toMatchObject({
			method: 'POST',
			headers: { 'x-board-reset-token': 'owner-token' }
		});
	});

	it('uses the direct local Worker fallback only in development', async () => {
		let forwardedInput: RequestInfo | URL | undefined;
		let forwardedInit: RequestInit | undefined;
		const directFetch: RequestFetcher = async (input, init) => {
			forwardedInput = input;
			forwardedInit = init;
			return new Response(null, { status: 204 });
		};

		const response = await handleBoardReset(resetRequest('{"token":"owner-token"}'), {
			isDevelopment: true,
			directFetch
		});

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ ok: true });
		expect(String(forwardedInput)).toBe('http://127.0.0.1:8788/reset');
		expect(forwardedInit).toMatchObject({
			method: 'POST',
			headers: { 'x-board-reset-token': 'owner-token' }
		});
	});

	it('preserves unauthorized responses from the local Worker', async () => {
		const response = await handleBoardReset(resetRequest('{"token":"wrong"}'), {
			isDevelopment: true,
			directFetch: async () => new Response(null, { status: 401 })
		});

		expect(response.status).toBe(401);
		expect(await response.json()).toEqual({ error: 'Unauthorized' });
	});
});

describe('board reset forwarding', () => {
	it('returns a generic 503 when the room binding rejects', async () => {
		const fetcher = vi.fn().mockRejectedValue(new Error('binding unavailable'));
		const response = await forwardReset({ fetch: fetcher }, 'owner-token');

		expect(response.status).toBe(503);
		expect(await response.json()).toEqual({ error: 'Reset unavailable' });
		expect(fetcher).toHaveBeenCalledOnce();
	});

	it('returns a generic 503 when the room rejects the reset', async () => {
		const response = await forwardReset(
			{ fetch: async () => new Response(null, { status: 401 }) },
			'owner-token'
		);

		expect(response.status).toBe(503);
		expect(await response.json()).toEqual({ error: 'Reset unavailable' });
	});
});
