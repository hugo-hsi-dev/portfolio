import { describe, expect, it } from 'vitest';

import {
	applyBoardServerMessage,
	boardModelFromSnapshot,
	createInitialBoardModel,
	markFrameMoveSent,
	moveFrameLocally,
	visibleFramePosition
} from './board-model';

const initialPositions = [
	{ id: 'profile' as const, x: 10, y: 20 },
	{ id: 'contact' as const, x: 30, y: 40 }
];

function snapshot(revision = 1) {
	return {
		type: 'room.snapshot' as const,
		revision,
		frames: initialPositions.map(({ id, x, y }) => ({
			id,
			x,
			y,
			revision,
			updatedAt: revision,
			updatedBy: null
		})),
		self: {
			sessionId: '25b6c1f8-e09d-4a1d-a790-a85cca7e57d3',
			visitorId: '4b87ff41-92a6-4c72-93cc-ad92b663487c',
			name: 'Guest 1000',
			color: '#abcdef'
		},
		peers: []
	};
}

describe('board model', () => {
	it('starts from canonical positions before the first snapshot', () => {
		const model = createInitialBoardModel(initialPositions);

		expect(model.hasSnapshot).toBe(false);
		expect(visibleFramePosition(model, 'profile')).toEqual({ x: 10, y: 20 });
	});

	it('uses the latest optimistic position until its server acknowledgement arrives', () => {
		let model = boardModelFromSnapshot(snapshot());
		model = moveFrameLocally(model, 'profile', { x: 50, y: 60 });
		model = markFrameMoveSent(model, 'profile', 4);

		const remoteUpdate = {
			type: 'frame.update' as const,
			frame: {
				id: 'profile' as const,
				x: 15,
				y: 25,
				revision: 2,
				updatedAt: 2,
				updatedBy: 'another-session'
			},
			sourceSessionId: '71a623f8-da62-4c6a-9b24-ee7fa45eff05',
			clientSeq: 1
		};
		model = applyBoardServerMessage(model, remoteUpdate, '25b6c1f8-e09d-4a1d-a790-a85cca7e57d3');
		expect(visibleFramePosition(model, 'profile')).toEqual({ x: 50, y: 60 });

		model = applyBoardServerMessage(
			model,
			{
				...remoteUpdate,
				frame: { ...remoteUpdate.frame, x: 50, y: 60, revision: 3 },
				sourceSessionId: '25b6c1f8-e09d-4a1d-a790-a85cca7e57d3',
				clientSeq: 4
			},
			'25b6c1f8-e09d-4a1d-a790-a85cca7e57d3'
		);

		expect(model.pendingMoves.profile).toBeUndefined();
		expect(visibleFramePosition(model, 'profile')).toEqual({ x: 50, y: 60 });
	});

	it('ignores stale updates and clears optimistic state on reset', () => {
		let model = boardModelFromSnapshot(snapshot(3));
		model = moveFrameLocally(model, 'profile', { x: 100, y: 200 });

		const stale = applyBoardServerMessage(
			model,
			{
				type: 'frame.update',
				frame: {
					id: 'profile',
					x: 0,
					y: 0,
					revision: 2,
					updatedAt: 2,
					updatedBy: null
				},
				sourceSessionId: '71a623f8-da62-4c6a-9b24-ee7fa45eff05',
				clientSeq: 1
			},
			null
		);
		expect(stale).toBe(model);

		const reset = applyBoardServerMessage(
			model,
			{
				type: 'board.reset',
				revision: 4,
				frames: snapshot(4).frames
			},
			null
		);
		expect(reset.pendingMoves).toEqual({});
		expect(visibleFramePosition(reset, 'profile')).toEqual({ x: 10, y: 20 });
	});

	it('replaces optimistic state with the authoritative reconnect snapshot', () => {
		let model = boardModelFromSnapshot(snapshot(2));
		model = moveFrameLocally(model, 'profile', { x: 900, y: 800 });
		model = markFrameMoveSent(model, 'profile', 9);

		const reconnected = applyBoardServerMessage(
			model,
			{
				...snapshot(7),
				frames: snapshot(7).frames.map((frame) =>
					frame.id === 'profile' ? { ...frame, x: 70, y: 80 } : frame
				)
			},
			'25b6c1f8-e09d-4a1d-a790-a85cca7e57d3'
		);

		expect(reconnected.revision).toBe(7);
		expect(reconnected.pendingMoves).toEqual({});
		expect(visibleFramePosition(reconnected, 'profile')).toEqual({ x: 70, y: 80 });
	});
});
