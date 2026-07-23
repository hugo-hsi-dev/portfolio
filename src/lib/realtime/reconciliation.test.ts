import { describe, expect, it } from 'vitest';

import { DEFAULT_FRAME_POSITIONS } from './layout';
import { boardStateFromSnapshot, reconcileBoardState } from './reconciliation';
import type { RoomSnapshot } from './protocol';

function snapshot(): RoomSnapshot {
	return {
		type: 'room.snapshot',
		revision: 2,
		frames: DEFAULT_FRAME_POSITIONS.map((frame) => ({
			...frame,
			revision: frame.id === 'profile' ? 2 : 0,
			updatedAt: 0,
			updatedBy: null
		})),
		self: {
			sessionId: 'adf73f2f-f2d3-4246-9087-84a46bf665bd',
			visitorId: '2ac3308f-a622-4b9b-9782-981d19ef943c',
			name: 'Guest 1234',
			color: '#0acf83'
		},
		peers: []
	};
}

describe('board reconciliation', () => {
	it('ignores stale frame updates and applies the newest authoritative revision', () => {
		const initial = boardStateFromSnapshot(snapshot());
		const stale = reconcileBoardState(initial, {
			type: 'frame.update',
			frame: { ...initial.frames.profile, x: 999, revision: 2 },
			sourceSessionId: 'adf73f2f-f2d3-4246-9087-84a46bf665bd',
			clientSeq: 2
		});
		expect(stale).toBe(initial);
		expect(
			reconcileBoardState(initial, {
				type: 'board.reset',
				revision: initial.revision,
				frames: Object.values(initial.frames)
			})
		).toBe(initial);

		const next = reconcileBoardState(initial, {
			type: 'frame.update',
			frame: { ...initial.frames.profile, x: 400, revision: 3 },
			sourceSessionId: 'adf73f2f-f2d3-4246-9087-84a46bf665bd',
			clientSeq: 3
		});
		expect(next.revision).toBe(3);
		expect(next.frames.profile.x).toBe(400);
	});
});
