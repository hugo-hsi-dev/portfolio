export const MAX_JSON_BODY_BYTES = 2_048;

declare global {
	interface SubtleCrypto {
		// Workerd extends the standard Web Crypto interface with constant-time comparison.
		timingSafeEqual(a: ArrayBuffer | ArrayBufferView, b: ArrayBuffer | ArrayBufferView): boolean;
	}
}

export type BoundedBodyResult =
	{ ok: true; text: string } | { ok: false; reason: 'too-large' | 'unreadable' };

export interface TimingSafeSubtleCrypto {
	digest: SubtleCrypto['digest'];
	timingSafeEqual(a: ArrayBuffer | ArrayBufferView, b: ArrayBuffer | ArrayBufferView): boolean;
}

function declaredBodyIsTooLarge(headers: Headers, maxBytes: number): boolean {
	const value = headers.get('content-length')?.trim();
	if (!value || !/^\d+$/.test(value)) return false;
	return Number(value) > maxBytes;
}

async function cancelBody(body: ReadableStream<Uint8Array> | null): Promise<void> {
	if (!body) return;
	try {
		await body.cancel();
	} catch {
		// The body may already be errored or locked by the runtime.
	}
}

async function cancelReader(reader: ReadableStreamDefaultReader<Uint8Array>): Promise<void> {
	try {
		await reader.cancel();
	} catch {
		// The stream may already be errored by the runtime.
	}
}

export async function readBoundedTextBody(
	request: Pick<Request, 'body' | 'headers'>,
	maxBytes = MAX_JSON_BODY_BYTES
): Promise<BoundedBodyResult> {
	if (declaredBodyIsTooLarge(request.headers, maxBytes)) {
		await cancelBody(request.body);
		return { ok: false, reason: 'too-large' };
	}

	const reader = request.body?.getReader();
	if (!reader) return { ok: true, text: '' };

	const decoder = new TextDecoder();
	let bytesRead = 0;
	let text = '';

	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) {
				text += decoder.decode();
				return { ok: true, text };
			}

			bytesRead += value.byteLength;
			if (bytesRead > maxBytes) {
				await cancelReader(reader);
				return { ok: false, reason: 'too-large' };
			}
			text += decoder.decode(value, { stream: true });
		}
	} catch {
		await cancelReader(reader);
		return { ok: false, reason: 'unreadable' };
	} finally {
		reader.releaseLock();
	}
}

export async function tokensMatch(
	provided: string,
	expected: string,
	subtle: TimingSafeSubtleCrypto = crypto.subtle
): Promise<boolean> {
	const encoder = new TextEncoder();
	const [providedHash, expectedHash] = await Promise.all([
		subtle.digest('SHA-256', encoder.encode(provided)),
		subtle.digest('SHA-256', encoder.encode(expected))
	]);
	return subtle.timingSafeEqual(providedHash, expectedHash);
}

export type WebSocketRequestRejection =
	{ status: 426; message: 'Expected WebSocket upgrade' } | { status: 403; message: 'Forbidden' };

export function validateWebSocketRequest(
	request: Pick<Request, 'headers'>,
	expectedOrigin: string
): WebSocketRequestRejection | null {
	if (request.headers.get('upgrade')?.toLowerCase() !== 'websocket') {
		return { status: 426, message: 'Expected WebSocket upgrade' };
	}

	const origin = request.headers.get('origin');
	if (!origin || origin !== expectedOrigin) {
		return { status: 403, message: 'Forbidden' };
	}

	return null;
}
