import { describe, expect, it } from 'vitest';

import { nextClientSequence } from './sequence';

describe('client message sequences', () => {
	it('increments a valid sequence monotonically', () => {
		expect(nextClientSequence(0)).toBe(1);
		expect(nextClientSequence(41)).toBe(42);
	});

	it.each([-1, 1.5, Number.MAX_SAFE_INTEGER, Number.NaN])(
		'rejects unsupported sequence %s',
		(value) => {
			expect(() => nextClientSequence(value)).toThrow(RangeError);
		}
	);
});
