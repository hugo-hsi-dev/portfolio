import { describe, expect, it, vi } from 'vitest';

import { _forwardReset } from './+server';

describe('board reset proxy', () => {
	it('returns a generic 503 when the Durable Object binding rejects', async () => {
		const fetch = vi.fn().mockRejectedValue(new Error('binding unavailable'));
		const response = await _forwardReset({ fetch }, 'owner-token');

		expect(response.status).toBe(503);
		expect(await response.json()).toEqual({ error: 'Reset unavailable' });
		expect(fetch).toHaveBeenCalledOnce();
	});
});
