import { describe, expect, it } from 'vitest';

import {
	DEFAULT_FRAME_POSITIONS,
	FRAME_IDS,
	MAX_CLIENT_MESSAGE_BYTES,
	WORLD_COORDINATE_LIMIT,
	clientMessageSchema,
	getInitialFramePosition,
	legacyClientMessageSchema,
	legacyServerMessageSchema,
	normalizeLegacyClientMessage,
	serverMessageForProtocol,
	serverMessageSchema
} from './index';

describe('realtime contract', () => {
	it('defines one bounded persisted position for every canonical frame', () => {
		expect(DEFAULT_FRAME_POSITIONS.map(({ id }) => id)).toEqual(FRAME_IDS);
		expect(new Set(FRAME_IDS).size).toBe(FRAME_IDS.length);
		expect(MAX_CLIENT_MESSAGE_BYTES).toBe(2_048);

		for (const position of DEFAULT_FRAME_POSITIONS) {
			expect(getInitialFramePosition(position.id)).toEqual(position);
			expect(Math.abs(position.x)).toBeLessThanOrEqual(WORLD_COORDINATE_LIMIT);
			expect(Math.abs(position.y)).toBeLessThanOrEqual(WORLD_COORDINATE_LIMIT);
		}
	});

	it('accepts the existing client wire shape and rejects unknown fields', () => {
		expect(
			clientMessageSchema.safeParse({
				type: 'frame.move',
				seq: 1,
				frameId: 'profile',
				x: 120,
				y: -50,
				final: false
			}).success
		).toBe(true);
		expect(
			clientMessageSchema.safeParse({
				type: 'presence.update',
				seq: 2,
				cursor: null,
				selectedFrameId: null,
				unknown: true
			}).success
		).toBe(false);
	});

	it('requires strict, explicit frame metadata updates', () => {
		expect(
			clientMessageSchema.safeParse({
				type: 'frame.metadata',
				seq: 3,
				frameId: 'profile',
				visible: false
			}).success
		).toBe(true);
		expect(
			clientMessageSchema.safeParse({
				type: 'frame.metadata',
				seq: 4,
				frameId: 'profile',
				locked: true
			}).success
		).toBe(true);
		expect(
			clientMessageSchema.safeParse({
				type: 'frame.metadata',
				seq: 5,
				frameId: 'profile'
			}).success
		).toBe(false);
		expect(
			clientMessageSchema.safeParse({
				type: 'frame.metadata',
				seq: 6,
				frameId: 'profile',
				visible: true,
				unknown: true
			}).success
		).toBe(false);
	});

	it('validates collaborator views as bounded, strict presence data', () => {
		const base = {
			type: 'presence.update',
			seq: 7,
			cursor: null,
			selectedFrameId: null
		};
		expect(
			clientMessageSchema.safeParse({
				...base,
				view: { center: { x: 120, y: -80 }, zoom: 1.25 }
			}).success
		).toBe(true);
		expect(clientMessageSchema.safeParse({ ...base, view: null }).success).toBe(true);
		expect(clientMessageSchema.safeParse(base).success).toBe(false);
		expect(
			clientMessageSchema.safeParse({
				...base,
				view: { center: { x: 0, y: 0 }, zoom: 4.01 }
			}).success
		).toBe(false);
		expect(
			clientMessageSchema.safeParse({
				...base,
				view: { center: { x: 0, y: 0 }, zoom: 1, extra: true }
			}).success
		).toBe(false);
	});

	it('normalizes legacy presence while keeping the v2 client schema strict', () => {
		const legacyPresence = {
			type: 'presence.update',
			seq: 8,
			cursor: { x: 10, y: 20 },
			selectedFrameId: 'profile'
		};
		const parsed = legacyClientMessageSchema.parse(legacyPresence);
		expect(clientMessageSchema.safeParse(legacyPresence).success).toBe(false);
		expect(normalizeLegacyClientMessage(parsed)).toEqual({ ...legacyPresence, view: null });
	});

	it('downlevels v2 snapshots and updates to the original strict server wire shape', () => {
		const frame = {
			id: 'profile' as const,
			x: 0,
			y: 0,
			visible: false,
			locked: true,
			revision: 2,
			updatedAt: 10,
			updatedBy: null
		};
		const update = {
			type: 'frame.update' as const,
			frame,
			sourceSessionId: 'adf73f2f-f2d3-4246-9087-84a46bf665bd',
			clientSeq: 3
		};
		const legacyUpdate = serverMessageForProtocol(update, 1);
		expect(legacyServerMessageSchema.safeParse(legacyUpdate).success).toBe(true);
		expect(serverMessageSchema.safeParse(legacyUpdate).success).toBe(false);
		expect(legacyUpdate).not.toHaveProperty('frame.visible');
		expect(legacyUpdate).not.toHaveProperty('frame.locked');

		const legacySnapshot = serverMessageForProtocol(
			{
				type: 'room.snapshot',
				revision: 2,
				frames: DEFAULT_FRAME_POSITIONS.map((position) => ({
					...position,
					visible: true,
					locked: false,
					revision: 2,
					updatedAt: 10,
					updatedBy: null
				})),
				self: {
					sessionId: 'adf73f2f-f2d3-4246-9087-84a46bf665bd',
					visitorId: '2ac3308f-a622-4b9b-9782-981d19ef943c',
					name: 'Guest 1234',
					color: '#0acf83'
				},
				peers: []
			},
			1
		);
		expect(legacyServerMessageSchema.safeParse(legacySnapshot).success).toBe(true);
		expect(legacySnapshot).not.toHaveProperty('frames.0.visible');

		expect(
			serverMessageForProtocol(
				{
					type: 'peer.update',
					sessionId: 'adf73f2f-f2d3-4246-9087-84a46bf665bd',
					cursor: null,
					selectedFrameId: null,
					view: { center: { x: 1, y: 2 }, zoom: 1 }
				},
				1
			)
		).not.toHaveProperty('view');
	});

	it('requires snapshots to contain every canonical frame exactly once', () => {
		const duplicateFrame = {
			id: 'profile',
			x: 0,
			y: 0,
			visible: true,
			locked: false,
			revision: 0,
			updatedAt: 0,
			updatedBy: null
		};
		expect(
			serverMessageSchema.safeParse({
				type: 'room.snapshot',
				revision: 0,
				frames: Array.from({ length: FRAME_IDS.length }, () => duplicateFrame),
				self: {
					sessionId: 'adf73f2f-f2d3-4246-9087-84a46bf665bd',
					visitorId: '2ac3308f-a622-4b9b-9782-981d19ef943c',
					name: 'Guest 1234',
					color: '#0acf83'
				},
				peers: []
			}).success
		).toBe(false);
	});
});
