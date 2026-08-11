import {
	LEGACY_PROTOCOL_VERSION,
	peerStateSchema,
	protocolVersionSchema,
	viewStateSchema,
	type Identity,
	type PeerState
} from '@portfolio/realtime-contract';
import { z } from 'zod';

import { CURSOR_COLORS, MAX_MESSAGES_PER_SECOND } from './constants';

export const attachmentSchema = peerStateSchema.extend({
	// Connections accepted before protocol negotiation are legacy wire clients.
	protocolVersion: protocolVersionSchema.default(LEGACY_PROTOCOL_VERSION),
	// Older hibernated connections predate shared view presence.
	view: viewStateSchema.nullable().default(null),
	lastSeq: z.number().int().min(-1).max(Number.MAX_SAFE_INTEGER),
	rateWindowStartedAt: z.number().int().nonnegative(),
	rateWindowCount: z.number().int().nonnegative(),
	// Defaults preserve hibernated attachments created before this field existed.
	rateLimited: z.boolean().default(false)
});

export type ConnectionAttachment = z.infer<typeof attachmentSchema>;

export interface RateWindowResult {
	attachment: ConnectionAttachment;
	exceeded: boolean;
}

export function identityForVisitor(visitorId: string, sessionId: string): Identity {
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

export async function tokensMatch(provided: string, expected: string): Promise<boolean> {
	const encoder = new TextEncoder();
	const [providedHash, expectedHash] = await Promise.all([
		crypto.subtle.digest('SHA-256', encoder.encode(provided)),
		crypto.subtle.digest('SHA-256', encoder.encode(expected))
	]);
	return crypto.subtle.timingSafeEqual(providedHash, expectedHash);
}

export function isAllowedOrigin(request: Request, allowedOrigins: string): boolean {
	const origin = request.headers.get('origin');
	if (!origin) return false;
	try {
		const parsed = new URL(origin);
		if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
		const allowed = new Set(
			allowedOrigins
				.split(',')
				.map((value) => value.trim())
				.filter(Boolean)
		);
		return allowed.has(parsed.origin);
	} catch {
		return false;
	}
}

export function attachmentFor(socket: WebSocket): ConnectionAttachment | null {
	const parsed = attachmentSchema.safeParse(socket.deserializeAttachment());
	return parsed.success ? parsed.data : null;
}

export function recordMessage(
	attachment: ConnectionAttachment,
	now: number,
	limit = MAX_MESSAGES_PER_SECOND
): RateWindowResult {
	if (attachment.rateLimited) return { attachment, exceeded: true };

	const windowExpired = now - attachment.rateWindowStartedAt >= 1_000;
	const nextAttachment: ConnectionAttachment = {
		...attachment,
		rateWindowStartedAt: windowExpired ? now : attachment.rateWindowStartedAt,
		rateWindowCount: windowExpired ? 1 : attachment.rateWindowCount + 1
	};
	const exceeded = nextAttachment.rateWindowCount > limit;
	return {
		attachment: exceeded ? { ...nextAttachment, rateLimited: true } : nextAttachment,
		exceeded
	};
}

export function toPeerState(attachment: ConnectionAttachment): PeerState {
	return {
		sessionId: attachment.sessionId,
		visitorId: attachment.visitorId,
		name: attachment.name,
		color: attachment.color,
		cursor: attachment.cursor,
		selectedFrameId: attachment.selectedFrameId,
		view: attachment.view
	};
}
