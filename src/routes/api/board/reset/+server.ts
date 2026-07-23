import { z } from 'zod';
import { dev } from '$app/environment';

import type { RequestHandler } from './$types';

const resetBodySchema = z.strictObject({ token: z.string().min(1).max(1_024) });
const MAX_BODY_BYTES = 2_048;

interface ResetRoom {
	fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

async function tokensMatch(provided: string, expected: string): Promise<boolean> {
	const encoder = new TextEncoder();
	const [providedHash, expectedHash] = await Promise.all([
		crypto.subtle.digest('SHA-256', encoder.encode(provided)),
		crypto.subtle.digest('SHA-256', encoder.encode(expected))
	]);
	const subtle = crypto.subtle as SubtleCrypto & {
		timingSafeEqual(a: ArrayBuffer | ArrayBufferView, b: ArrayBuffer | ArrayBufferView): boolean;
	};
	return subtle.timingSafeEqual(providedHash, expectedHash);
}

async function readLimitedBody(request: Request): Promise<string | null> {
	const reader = request.body?.getReader();
	if (!reader) return '';
	const decoder = new TextDecoder();
	let bytesRead = 0;
	let body = '';
	while (true) {
		const { done, value } = await reader.read();
		if (done) return body + decoder.decode();
		bytesRead += value.byteLength;
		if (bytesRead > MAX_BODY_BYTES) {
			await reader.cancel();
			return null;
		}
		body += decoder.decode(value, { stream: true });
	}
}

export async function _forwardReset(room: ResetRoom, token: string): Promise<Response> {
	try {
		const response = await room.fetch('https://portfolio-room/reset', {
			method: 'POST',
			headers: { 'x-board-reset-token': token }
		});
		if (!response.ok) {
			return Response.json({ error: 'Reset unavailable' }, { status: 503 });
		}
		return Response.json({ ok: true });
	} catch {
		return Response.json({ error: 'Reset unavailable' }, { status: 503 });
	}
}

export const POST: RequestHandler = async ({ request, platform }) => {
	const body = await readLimitedBody(request);
	if (body === null) return Response.json({ error: 'Invalid request' }, { status: 400 });

	let json: unknown;
	try {
		json = JSON.parse(body);
	} catch {
		return Response.json({ error: 'Invalid request' }, { status: 400 });
	}
	const parsed = resetBodySchema.safeParse(json);
	if (!parsed.success) {
		return Response.json({ error: 'Reset unavailable' }, { status: 503 });
	}

	if (!platform?.env.PORTFOLIO_ROOMS) {
		if (!dev) return Response.json({ error: 'Reset unavailable' }, { status: 503 });
		try {
			const response = await fetch('http://127.0.0.1:8788/reset', {
				method: 'POST',
				headers: { 'x-board-reset-token': parsed.data.token }
			});
			if (!response.ok) {
				const status = response.status === 401 ? 401 : 503;
				return Response.json(
					{ error: status === 401 ? 'Unauthorized' : 'Reset unavailable' },
					{ status }
				);
			}
			return Response.json({ ok: true });
		} catch {
			return Response.json({ error: 'Reset unavailable' }, { status: 503 });
		}
	}

	if (!platform.env.BOARD_RESET_TOKEN) {
		return Response.json({ error: 'Reset unavailable' }, { status: 503 });
	}

	if (!(await tokensMatch(parsed.data.token, platform.env.BOARD_RESET_TOKEN))) {
		return Response.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const room = platform.env.PORTFOLIO_ROOMS.getByName('public');
	return _forwardReset(room, parsed.data.token);
};
