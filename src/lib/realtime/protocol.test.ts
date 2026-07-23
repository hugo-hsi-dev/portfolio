import { describe, expect, it } from 'vitest';

import { FRAME_IDS, WORLD_COORDINATE_LIMIT } from './layout';
import { clientMessageSchema, serverMessageSchema } from './protocol';

describe('realtime protocol', () => {
	it('accepts a bounded frame movement', () => {
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
	});

	it('rejects unknown fields and coordinates outside the safety boundary', () => {
		expect(
			clientMessageSchema.safeParse({
				type: 'frame.move',
				seq: 1,
				frameId: 'profile',
				x: WORLD_COORDINATE_LIMIT + 1,
				y: 0,
				final: true,
				unsafe: true
			}).success
		).toBe(false);
	});

	it('rejects snapshots that omit canonical frames', () => {
		expect(
			serverMessageSchema.safeParse({
				type: 'room.snapshot',
				revision: 0,
				frames: [],
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

	it('rejects snapshots that duplicate a frame id', () => {
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
