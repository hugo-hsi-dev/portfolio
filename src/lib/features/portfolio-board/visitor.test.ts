import { describe, expect, it, vi } from 'vitest';

import { getOrCreateVisitorId, VISITOR_ID_STORAGE_KEY } from './visitor';

const firstId = '2ac3308f-a622-4b9b-9782-981d19ef943c';
const secondId = '4b87ff41-92a6-4c72-93cc-ad92b663487c';

describe('getOrCreateVisitorId', () => {
	it('returns a valid stored ID', () => {
		const createId = vi.fn(() => secondId);
		expect(getOrCreateVisitorId({ getItem: () => firstId, setItem: vi.fn() }, createId)).toBe(
			firstId
		);
		expect(createId).not.toHaveBeenCalled();
	});

	it('persists a replacement for invalid storage', () => {
		const setItem = vi.fn();
		expect(getOrCreateVisitorId({ getItem: () => 'invalid', setItem }, () => secondId)).toBe(
			secondId
		);
		expect(setItem).toHaveBeenCalledWith(VISITOR_ID_STORAGE_KEY, secondId);
	});

	it('still returns an ID when storage is unavailable', () => {
		expect(
			getOrCreateVisitorId(
				{
					getItem: () => {
						throw new Error('blocked');
					},
					setItem: vi.fn()
				},
				() => secondId
			)
		).toBe(secondId);
	});
});
