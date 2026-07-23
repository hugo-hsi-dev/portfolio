import { describe, expect, it, vi } from 'vitest';

import {
	tokensMatch,
	validateWebSocketRequest,
	type TimingSafeSubtleCrypto
} from './request-policy';

describe('request token policy', () => {
	it('hashes both tokens before timing-safe comparison', async () => {
		const digest = vi.fn(crypto.subtle.digest.bind(crypto.subtle));
		const timingSafeEqual = vi.fn<
			(a: ArrayBuffer | ArrayBufferView, b: ArrayBuffer | ArrayBufferView) => boolean
		>(() => true);
		const subtle = { digest, timingSafeEqual } satisfies TimingSafeSubtleCrypto;

		const matches = await tokensMatch('provided-token', 'expected-token', subtle);

		expect(matches).toBe(true);
		expect(digest).toHaveBeenCalledTimes(2);
		expect(digest).toHaveBeenNthCalledWith(1, 'SHA-256', expect.any(Uint8Array));
		expect(digest).toHaveBeenNthCalledWith(2, 'SHA-256', expect.any(Uint8Array));
		expect(timingSafeEqual).toHaveBeenCalledOnce();
		const [providedHash, expectedHash] = timingSafeEqual.mock.calls[0]!;
		expect(providedHash.byteLength).toBe(32);
		expect(expectedHash.byteLength).toBe(32);
	});
});

describe('WebSocket request policy', () => {
	it('accepts a case-insensitive WebSocket upgrade from the expected origin', () => {
		const request = new Request('https://portfolio.test/api/board/ws', {
			headers: {
				origin: 'https://portfolio.test',
				upgrade: 'WebSocket'
			}
		});

		expect(validateWebSocketRequest(request, 'https://portfolio.test')).toBeNull();
	});
});
