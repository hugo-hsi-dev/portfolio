import { WORLD_COORDINATE_LIMIT, type Point } from '@portfolio/realtime-contract';

const ARROW_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'] as const;

export type ArrowKey = (typeof ARROW_KEYS)[number];

export function isArrowKey(value: string): value is ArrowKey {
	return ARROW_KEYS.some((key) => key === value);
}

export function nudgeFramePosition(position: Point, key: ArrowKey, accelerated = false): Point {
	const amount = accelerated ? 10 : 1;
	const clamp = (value: number) =>
		Math.max(-WORLD_COORDINATE_LIMIT, Math.min(WORLD_COORDINATE_LIMIT, value));
	return {
		x: clamp(position.x + (key === 'ArrowLeft' ? -amount : key === 'ArrowRight' ? amount : 0)),
		y: clamp(position.y + (key === 'ArrowUp' ? -amount : key === 'ArrowDown' ? amount : 0))
	};
}
