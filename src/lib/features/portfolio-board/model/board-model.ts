import type {
	FrameId,
	FrameState,
	Point,
	RoomSnapshot,
	ServerMessage
} from '@portfolio/realtime-contract';

export interface PendingFrameMove {
	position: Point;
	latestSentSequence: number | null;
}

export interface BoardModel {
	hasSnapshot: boolean;
	revision: number;
	frames: Record<FrameId, FrameState>;
	pendingMoves: Partial<Record<FrameId, PendingFrameMove>>;
}

export interface FramePosition {
	id: FrameId;
	x: number;
	y: number;
}

function frameRecord(frames: FrameState[]): Record<FrameId, FrameState> {
	return Object.fromEntries(frames.map((frame) => [frame.id, frame])) as Record<
		FrameId,
		FrameState
	>;
}

export function createInitialBoardModel(positions: readonly FramePosition[]): BoardModel {
	return {
		hasSnapshot: false,
		revision: 0,
		frames: Object.fromEntries(
			positions.map(({ id, x, y }) => [
				id,
				{ id, x, y, revision: 0, updatedAt: 0, updatedBy: null }
			])
		) as Record<FrameId, FrameState>,
		pendingMoves: {}
	};
}

export function boardModelFromSnapshot(snapshot: RoomSnapshot): BoardModel {
	return {
		hasSnapshot: true,
		revision: snapshot.revision,
		frames: frameRecord(snapshot.frames),
		pendingMoves: {}
	};
}

export function moveFrameLocally(model: BoardModel, frameId: FrameId, position: Point): BoardModel {
	const existing = model.pendingMoves[frameId];
	return {
		...model,
		pendingMoves: {
			...model.pendingMoves,
			[frameId]: {
				position,
				latestSentSequence: existing?.latestSentSequence ?? null
			}
		}
	};
}

export function markFrameMoveSent(
	model: BoardModel,
	frameId: FrameId,
	sequence: number
): BoardModel {
	const pending = model.pendingMoves[frameId];
	if (!pending) return model;
	return {
		...model,
		pendingMoves: {
			...model.pendingMoves,
			[frameId]: { ...pending, latestSentSequence: sequence }
		}
	};
}

export function visibleFramePosition(model: BoardModel, frameId: FrameId): Point {
	const pending = model.pendingMoves[frameId];
	if (pending) return pending.position;
	const frame = model.frames[frameId];
	return { x: frame.x, y: frame.y };
}

export function visibleFramePositions(model: BoardModel): Record<FrameId, Point> {
	return Object.fromEntries(
		Object.keys(model.frames).map((id) => [id, visibleFramePosition(model, id as FrameId)])
	) as Record<FrameId, Point>;
}

export function applyBoardServerMessage(
	model: BoardModel,
	message: ServerMessage,
	selfSessionId: string | null
): BoardModel {
	if (message.type === 'room.snapshot') {
		return boardModelFromSnapshot(message);
	}

	if (message.type === 'board.reset') {
		if (model.hasSnapshot && message.revision <= model.revision) return model;
		return {
			hasSnapshot: true,
			revision: message.revision,
			frames: frameRecord(message.frames),
			pendingMoves: {}
		};
	}

	if (message.type !== 'frame.update' || message.frame.revision <= model.revision) {
		return model;
	}

	const pending = model.pendingMoves[message.frame.id];
	const acknowledgesLatestMove =
		message.sourceSessionId === selfSessionId && pending?.latestSentSequence === message.clientSeq;
	const pendingMoves = { ...model.pendingMoves };
	if (acknowledgesLatestMove) delete pendingMoves[message.frame.id];

	return {
		...model,
		hasSnapshot: true,
		revision: message.frame.revision,
		frames: { ...model.frames, [message.frame.id]: message.frame },
		pendingMoves
	};
}

export function clearPendingMoves(model: BoardModel): BoardModel {
	if (Object.keys(model.pendingMoves).length === 0) return model;
	return { ...model, pendingMoves: {} };
}
