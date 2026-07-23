import { describe, expect, it } from 'vitest';

import { WORLD_COORDINATE_LIMIT } from '@portfolio/realtime-contract';

import { nudgeFramePosition, isArrowKey } from './keyboard';

describe('keyboard frame movement', () => {
	it('nudges by one or ten pixels and clamps to the world boundary', () => {
		expect(isArrowKey('ArrowRight')).toBe(true);
		expect(isArrowKey('Enter')).toBe(false);
		expect(nudgeFramePosition({ x: 10, y: 20 }, 'ArrowLeft')).toEqual({ x: 9, y: 20 });
		expect(nudgeFramePosition({ x: 10, y: 20 }, 'ArrowDown', true)).toEqual({ x: 10, y: 30 });
		expect(nudgeFramePosition({ x: WORLD_COORDINATE_LIMIT, y: 0 }, 'ArrowRight')).toEqual({
			x: WORLD_COORDINATE_LIMIT,
			y: 0
		});
	});
});
