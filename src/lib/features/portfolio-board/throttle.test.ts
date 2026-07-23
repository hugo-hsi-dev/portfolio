import { describe, expect, it } from 'vitest';

import { shouldSendThrottled } from './throttle';

describe('shouldSendThrottled', () => {
	it('waits for the configured interval', () => {
		expect(shouldSendThrottled(149, 100, 50)).toBe(false);
		expect(shouldSendThrottled(150, 100, 50)).toBe(true);
	});

	it('supports terminal updates that must bypass throttling', () => {
		expect(shouldSendThrottled(101, 100, 50, true)).toBe(true);
	});
});
