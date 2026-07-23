export type GestureMode = 'idle' | 'pan' | 'drag' | 'pinch';

const MIN_PINCH_POINTERS = 2;

export function resolveGestureMode(
	activePointerCount: number,
	dragging: boolean,
	panning: boolean
): GestureMode {
	if (activePointerCount >= MIN_PINCH_POINTERS) return 'pinch';
	if (dragging) return 'drag';
	if (panning) return 'pan';
	return 'idle';
}
