import { describe, expect, it } from 'vitest';

import {
	DEFAULT_FRAME_POSITIONS,
	FRAME_IDS,
	MAX_CLIENT_MESSAGE_BYTES,
	WORLD_COORDINATE_LIMIT,
	clientMessageSchema,
	getInitialFramePosition,
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

	it('requires snapshots to contain every canonical frame exactly once', () => {
		const duplicateFrame = {
			id: 'profile',
			x: 0,
			y: 0,
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
