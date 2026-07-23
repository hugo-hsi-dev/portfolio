import { z } from 'zod';

import { FRAME_IDS, WORLD_COORDINATE_LIMIT, type FrameId } from './layout';

const frameIdSchema = z.enum(FRAME_IDS as [FrameId, ...FrameId[]]);
export const visitorIdSchema = z.uuid();
const coordinateSchema = z.number().min(-WORLD_COORDINATE_LIMIT).max(WORLD_COORDINATE_LIMIT);
const sequenceSchema = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);

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

export const peerStateSchema = identitySchema.extend({
	cursor: pointSchema.nullable(),
	selectedFrameId: frameIdSchema.nullable()
});

export const frameStateSchema = z.strictObject({
	id: frameIdSchema,
	x: coordinateSchema,
	y: coordinateSchema,
	revision: sequenceSchema,
	updatedAt: z.number().int().nonnegative(),
	updatedBy: z.string().nullable()
});

const canonicalFrameListSchema = z
	.array(frameStateSchema)
	.length(FRAME_IDS.length)
	.refine((frames) => new Set(frames.map((frame) => frame.id)).size === FRAME_IDS.length, {
		message: 'Frame list must contain each canonical frame exactly once.'
	});

export const presenceUpdateSchema = z.strictObject({
	type: z.literal('presence.update'),
	seq: sequenceSchema,
	cursor: pointSchema.nullable(),
	selectedFrameId: frameIdSchema.nullable()
});

export const frameMoveSchema = z.strictObject({
	type: z.literal('frame.move'),
	seq: sequenceSchema,
	frameId: frameIdSchema,
	x: coordinateSchema,
	y: coordinateSchema,
	final: z.boolean()
});

export const clientMessageSchema = z.discriminatedUnion('type', [
	presenceUpdateSchema,
	frameMoveSchema
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
	selectedFrameId: frameIdSchema.nullable()
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
	code: z.enum(['invalid-message', 'message-too-large', 'rate-limited', 'server-error']),
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

export type Point = z.infer<typeof pointSchema>;
export type Identity = z.infer<typeof identitySchema>;
export type PeerState = z.infer<typeof peerStateSchema>;
export type FrameState = z.infer<typeof frameStateSchema>;
export type ClientMessage = z.infer<typeof clientMessageSchema>;
export type ServerMessage = z.infer<typeof serverMessageSchema>;
export type RoomSnapshot = z.infer<typeof roomSnapshotSchema>;

export { frameIdSchema };
