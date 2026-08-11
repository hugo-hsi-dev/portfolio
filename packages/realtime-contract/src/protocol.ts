import { z } from 'zod';

import { FRAME_IDS, WORLD_COORDINATE_LIMIT } from './frames';

export const frameIdSchema = z.enum(FRAME_IDS);
export const visitorIdSchema = z.uuid();
export const coordinateSchema = z.number().min(-WORLD_COORDINATE_LIMIT).max(WORLD_COORDINATE_LIMIT);
export const sequenceSchema = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
export const LEGACY_PROTOCOL_VERSION = 1 as const;
export const CURRENT_PROTOCOL_VERSION = 2 as const;
export const protocolVersionSchema = z.union([
	z.literal(LEGACY_PROTOCOL_VERSION),
	z.literal(CURRENT_PROTOCOL_VERSION)
]);

export const pointSchema = z.strictObject({
	x: coordinateSchema,
	y: coordinateSchema
});

export const identitySchema = z.strictObject({
	sessionId: z.uuid(),
	visitorId: visitorIdSchema,
	name: z.string().min(1).max(32),
	color: z.string().regex(/^#[0-9a-f]{6}$/i)
});

export const viewStateSchema = z.strictObject({
	center: pointSchema,
	zoom: z.number().min(0.1).max(4)
});

export const peerStateSchema = identitySchema.extend({
	cursor: pointSchema.nullable(),
	selectedFrameId: frameIdSchema.nullable(),
	view: viewStateSchema.nullable()
});

export const frameStateSchema = z.strictObject({
	id: frameIdSchema,
	x: coordinateSchema,
	y: coordinateSchema,
	visible: z.boolean(),
	locked: z.boolean(),
	revision: sequenceSchema,
	updatedAt: z.number().int().nonnegative(),
	updatedBy: z.string().nullable()
});

export const canonicalFrameListSchema = z
	.array(frameStateSchema)
	.length(FRAME_IDS.length)
	.refine((frames) => new Set(frames.map((frame) => frame.id)).size === FRAME_IDS.length, {
		message: 'Frame list must contain each canonical frame exactly once.'
	});

export const presenceUpdateSchema = z.strictObject({
	type: z.literal('presence.update'),
	seq: sequenceSchema,
	cursor: pointSchema.nullable(),
	selectedFrameId: frameIdSchema.nullable(),
	view: viewStateSchema.nullable()
});

export const frameMoveSchema = z.strictObject({
	type: z.literal('frame.move'),
	seq: sequenceSchema,
	frameId: frameIdSchema,
	x: coordinateSchema,
	y: coordinateSchema,
	final: z.boolean()
});

export const legacyPresenceUpdateSchema = z.strictObject({
	type: z.literal('presence.update'),
	seq: sequenceSchema,
	cursor: pointSchema.nullable(),
	selectedFrameId: frameIdSchema.nullable()
});

export const legacyClientMessageSchema = z.discriminatedUnion('type', [
	legacyPresenceUpdateSchema,
	frameMoveSchema
]);

export const frameMetadataSchema = z
	.strictObject({
		type: z.literal('frame.metadata'),
		seq: sequenceSchema,
		frameId: frameIdSchema,
		visible: z.boolean().optional(),
		locked: z.boolean().optional()
	})
	.refine((message) => message.visible !== undefined || message.locked !== undefined, {
		message: 'A frame metadata update must include visible or locked.'
	});

export const clientMessageSchema = z.discriminatedUnion('type', [
	presenceUpdateSchema,
	frameMoveSchema,
	frameMetadataSchema
]);

export const roomSnapshotSchema = z.strictObject({
	type: z.literal('room.snapshot'),
	revision: sequenceSchema,
	frames: canonicalFrameListSchema,
	self: identitySchema,
	peers: z.array(peerStateSchema)
});

export const peerJoinSchema = z.strictObject({
	type: z.literal('peer.join'),
	peer: peerStateSchema
});

export const peerLeaveSchema = z.strictObject({
	type: z.literal('peer.leave'),
	sessionId: z.uuid()
});

export const peerUpdateSchema = z.strictObject({
	type: z.literal('peer.update'),
	sessionId: z.uuid(),
	cursor: pointSchema.nullable(),
	selectedFrameId: frameIdSchema.nullable(),
	view: viewStateSchema.nullable()
});

export const frameUpdateSchema = z.strictObject({
	type: z.literal('frame.update'),
	frame: frameStateSchema,
	sourceSessionId: z.uuid(),
	clientSeq: sequenceSchema
});

export const boardResetSchema = z.strictObject({
	type: z.literal('board.reset'),
	revision: sequenceSchema,
	frames: canonicalFrameListSchema
});

export const serverErrorSchema = z.strictObject({
	type: z.literal('error'),
	code: z.enum([
		'invalid-message',
		'message-too-large',
		'rate-limited',
		'frame-locked',
		'server-error'
	]),
	message: z.string().min(1).max(160)
});

export const serverMessageSchema = z.discriminatedUnion('type', [
	roomSnapshotSchema,
	peerJoinSchema,
	peerLeaveSchema,
	peerUpdateSchema,
	frameUpdateSchema,
	boardResetSchema,
	serverErrorSchema
]);

export const legacyPeerStateSchema = identitySchema.extend({
	cursor: pointSchema.nullable(),
	selectedFrameId: frameIdSchema.nullable()
});

export const legacyFrameStateSchema = z.strictObject({
	id: frameIdSchema,
	x: coordinateSchema,
	y: coordinateSchema,
	revision: sequenceSchema,
	updatedAt: z.number().int().nonnegative(),
	updatedBy: z.string().nullable()
});

export const legacyCanonicalFrameListSchema = z
	.array(legacyFrameStateSchema)
	.length(FRAME_IDS.length)
	.refine((frames) => new Set(frames.map((frame) => frame.id)).size === FRAME_IDS.length, {
		message: 'Frame list must contain each canonical frame exactly once.'
	});

export const legacyRoomSnapshotSchema = z.strictObject({
	type: z.literal('room.snapshot'),
	revision: sequenceSchema,
	frames: legacyCanonicalFrameListSchema,
	self: identitySchema,
	peers: z.array(legacyPeerStateSchema)
});

export const legacyPeerJoinSchema = z.strictObject({
	type: z.literal('peer.join'),
	peer: legacyPeerStateSchema
});

export const legacyPeerUpdateSchema = z.strictObject({
	type: z.literal('peer.update'),
	sessionId: z.uuid(),
	cursor: pointSchema.nullable(),
	selectedFrameId: frameIdSchema.nullable()
});

export const legacyFrameUpdateSchema = z.strictObject({
	type: z.literal('frame.update'),
	frame: legacyFrameStateSchema,
	sourceSessionId: z.uuid(),
	clientSeq: sequenceSchema
});

export const legacyBoardResetSchema = z.strictObject({
	type: z.literal('board.reset'),
	revision: sequenceSchema,
	frames: legacyCanonicalFrameListSchema
});

export const legacyServerErrorSchema = z.strictObject({
	type: z.literal('error'),
	code: z.enum(['invalid-message', 'message-too-large', 'rate-limited', 'server-error']),
	message: z.string().min(1).max(160)
});

export const legacyServerMessageSchema = z.discriminatedUnion('type', [
	legacyRoomSnapshotSchema,
	legacyPeerJoinSchema,
	peerLeaveSchema,
	legacyPeerUpdateSchema,
	legacyFrameUpdateSchema,
	legacyBoardResetSchema,
	legacyServerErrorSchema
]);

function legacyFrameState(frame: FrameState): LegacyFrameState {
	return {
		id: frame.id,
		x: frame.x,
		y: frame.y,
		revision: frame.revision,
		updatedAt: frame.updatedAt,
		updatedBy: frame.updatedBy
	};
}

function legacyPeerState(peer: PeerState): LegacyPeerState {
	return {
		sessionId: peer.sessionId,
		visitorId: peer.visitorId,
		name: peer.name,
		color: peer.color,
		cursor: peer.cursor,
		selectedFrameId: peer.selectedFrameId
	};
}

export function normalizeLegacyClientMessage(message: LegacyClientMessage): ClientMessage {
	return message.type === 'presence.update' ? { ...message, view: null } : message;
}

export function serverMessageForProtocol(
	message: ServerMessage,
	protocolVersion: ProtocolVersion
): ServerMessage | LegacyServerMessage {
	if (protocolVersion === CURRENT_PROTOCOL_VERSION) return message;

	switch (message.type) {
		case 'room.snapshot':
			return {
				...message,
				frames: message.frames.map(legacyFrameState),
				peers: message.peers.map(legacyPeerState)
			};
		case 'peer.join':
			return { ...message, peer: legacyPeerState(message.peer) };
		case 'peer.update':
			return {
				type: message.type,
				sessionId: message.sessionId,
				cursor: message.cursor,
				selectedFrameId: message.selectedFrameId
			};
		case 'frame.update':
			return { ...message, frame: legacyFrameState(message.frame) };
		case 'board.reset':
			return { ...message, frames: message.frames.map(legacyFrameState) };
		case 'error':
			return message.code === 'frame-locked' ? { ...message, code: 'server-error' } : message;
		default:
			return message;
	}
}

export type Point = z.infer<typeof pointSchema>;
export type ProtocolVersion = z.infer<typeof protocolVersionSchema>;
export type Identity = z.infer<typeof identitySchema>;
export type PeerState = z.infer<typeof peerStateSchema>;
export type ViewState = z.infer<typeof viewStateSchema>;
export type FrameState = z.infer<typeof frameStateSchema>;
export type ClientMessage = z.infer<typeof clientMessageSchema>;
export type ServerMessage = z.infer<typeof serverMessageSchema>;
export type RoomSnapshot = z.infer<typeof roomSnapshotSchema>;
export type LegacyPeerState = z.infer<typeof legacyPeerStateSchema>;
export type LegacyFrameState = z.infer<typeof legacyFrameStateSchema>;
export type LegacyClientMessage = z.infer<typeof legacyClientMessageSchema>;
export type LegacyServerMessage = z.infer<typeof legacyServerMessageSchema>;
export type LegacyRoomSnapshot = z.infer<typeof legacyRoomSnapshotSchema>;
