export type GestureMode = 'idle' | 'pan' | 'drag' | 'pinch';

export function resolveGestureMode(
	activePointerCount: number,
	dragging: boolean,
	panning: boolean
): GestureMode {
	if (activePointerCount >= 2) return 'pinch';
	if (dragging) return 'drag';
	if (panning) return 'pan';
	return 'idle';
}
