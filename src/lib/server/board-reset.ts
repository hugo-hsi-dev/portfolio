import { z } from 'zod';

import { readBoundedTextBody, tokensMatch } from './request-policy';

const resetBodySchema = z.strictObject({ token: z.string().min(1).max(1_024) });

export interface ResetRoom {
	fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

export interface ResetRoomNamespace {
	getByName(name: string): ResetRoom;
}

export type RequestFetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export interface ResetHandlerDependencies {
	isDevelopment: boolean;
	rooms?: ResetRoomNamespace;
	expectedToken?: string;
	directFetch?: RequestFetcher;
	matchesToken?: (provided: string, expected: string) => Promise<boolean>;
}

const invalidRequest = () => Response.json({ error: 'Invalid request' }, { status: 400 });
const unauthorized = () => Response.json({ error: 'Unauthorized' }, { status: 401 });
const resetUnavailable = () => Response.json({ error: 'Reset unavailable' }, { status: 503 });

export async function forwardReset(room: ResetRoom, token: string): Promise<Response> {
	try {
		const response = await room.fetch('https://portfolio-room/reset', {
			method: 'POST',
			headers: { 'x-board-reset-token': token }
		});
		return response.ok ? Response.json({ ok: true }) : resetUnavailable();
	} catch {
		return resetUnavailable();
	}
}

async function forwardLocalReset(token: string, directFetch: RequestFetcher): Promise<Response> {
	try {
		const response = await directFetch('http://127.0.0.1:8788/reset', {
			method: 'POST',
			headers: { 'x-board-reset-token': token }
		});
		if (response.ok) return Response.json({ ok: true });
		return response.status === 401 ? unauthorized() : resetUnavailable();
	} catch {
		return resetUnavailable();
	}
}

export async function handleBoardReset(
	request: Request,
	dependencies: ResetHandlerDependencies
): Promise<Response> {
	const body = await readBoundedTextBody(request);
	if (!body.ok) return invalidRequest();

	let json: unknown;
	try {
		json = JSON.parse(body.text);
	} catch {
		return invalidRequest();
	}

	const parsed = resetBodySchema.safeParse(json);
	if (!parsed.success) return invalidRequest();

	if (!dependencies.rooms) {
		if (!dependencies.isDevelopment) return resetUnavailable();
		return forwardLocalReset(parsed.data.token, dependencies.directFetch ?? fetch);
	}

	if (!dependencies.expectedToken) return resetUnavailable();

	let tokenIsValid: boolean;
	try {
		tokenIsValid = await (dependencies.matchesToken ?? tokensMatch)(
			parsed.data.token,
			dependencies.expectedToken
		);
	} catch {
		return resetUnavailable();
	}
	if (!tokenIsValid) return unauthorized();

	return forwardReset(dependencies.rooms.getByName('public'), parsed.data.token);
}
