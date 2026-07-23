import { describe, expect, it } from 'vitest';

import { createRequestErrorLog, createRequestLog } from './observability';

describe('structured request logs', () => {
	it('contains only bounded operational request fields', () => {
		expect(
			createRequestLog({
				method: 'POST',
				routeId: '/api/board/reset',
				status: 401,
				durationMs: 2.6
			})
		).toEqual({
			event: 'request.completed',
			method: 'POST',
			route: '/api/board/reset',
			status: 401,
			durationMs: 3
		});
	});

	it('normalizes missing routes and negative durations', () => {
		expect(createRequestLog({ method: 'GET', routeId: null, status: 404, durationMs: -4 })).toEqual(
			{
				event: 'request.completed',
				method: 'GET',
				route: 'unmatched',
				status: 404,
				durationMs: 0
			}
		);
		expect(createRequestErrorLog('GET', null, 500)).toEqual({
			event: 'request.failed',
			method: 'GET',
			route: 'unmatched',
			status: 500
		});
	});
});
