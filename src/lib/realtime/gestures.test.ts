import { describe, expect, it } from 'vitest';

import { resolveGestureMode } from './gestures';

describe('gesture arbitration', () => {
	it('gives pinch priority before drag, pan, and idle movement', () => {
		expect(resolveGestureMode(2, true, true)).toBe('pinch');
		expect(resolveGestureMode(1, true, true)).toBe('drag');
		expect(resolveGestureMode(1, false, true)).toBe('pan');
		expect(resolveGestureMode(1, false, false)).toBe('idle');
	});
});
