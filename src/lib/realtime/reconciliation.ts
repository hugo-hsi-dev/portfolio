import type { FrameId } from './layout';
import type { FrameState, RoomSnapshot, ServerMessage } from './protocol';

export interface BoardState {
	revision: number;
	frames: Record<FrameId, FrameState>;
}

export function boardStateFromSnapshot(snapshot: RoomSnapshot): BoardState {
	return {
		revision: snapshot.revision,
		frames: Object.fromEntries(snapshot.frames.map((frame) => [frame.id, frame])) as Record<
			FrameId,
			FrameState
		>
	};
}

export function reconcileBoardState(state: BoardState, message: ServerMessage): BoardState {
	if (message.type === 'room.snapshot') {
		return boardStateFromSnapshot(message);
	}

	if (message.type === 'board.reset') {
		if (message.revision <= state.revision) return state;
		return {
			revision: message.revision,
			frames: Object.fromEntries(message.frames.map((frame) => [frame.id, frame])) as Record<
				FrameId,
				FrameState
			>
		};
	}

	if (message.type !== 'frame.update' || message.frame.revision <= state.revision) {
		return state;
	}

	return {
		revision: message.frame.revision,
		frames: { ...state.frames, [message.frame.id]: message.frame }
	};
}
