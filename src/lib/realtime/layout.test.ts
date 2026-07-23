import { describe, expect, it } from 'vitest';

import {
	DEFAULT_FRAME_POSITIONS,
	FRAME_DEFINITIONS,
	FRAME_IDS,
	WORLD_COORDINATE_LIMIT
} from './layout';

describe('canonical portfolio layout', () => {
	it('defines one bounded reset position for every stable frame', () => {
		expect(FRAME_DEFINITIONS).toHaveLength(11);
		expect(new Set(FRAME_IDS).size).toBe(FRAME_IDS.length);
		expect(DEFAULT_FRAME_POSITIONS.map(({ id }) => id)).toEqual(FRAME_IDS);

		for (const frame of FRAME_DEFINITIONS) {
			expect(frame.width).toBeGreaterThan(0);
			expect(frame.height).toBeGreaterThan(0);
			expect(Math.abs(frame.x)).toBeLessThanOrEqual(WORLD_COORDINATE_LIMIT);
			expect(Math.abs(frame.y)).toBeLessThanOrEqual(WORLD_COORDINATE_LIMIT);
		}
	});
});
