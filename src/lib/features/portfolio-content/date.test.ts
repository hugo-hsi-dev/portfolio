import { describe, expect, it } from 'vitest';

import { formatPortfolioDate } from './date';

describe('portfolio content dates', () => {
	it('formats month precision in UTC', () => {
		expect(formatPortfolioDate('2024-01-01', 'month')).toBe('Jan 2024');
	});

	it('formats year precision without a month', () => {
		expect(formatPortfolioDate('2024-01-01', 'year')).toBe('2024');
	});
});
