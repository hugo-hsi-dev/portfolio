import { exports } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';

import { ALLOWED_ORIGIN, VISITOR_A } from './test-helpers';

describe('realtime router', () => {
	it('serves health and rejects unknown routes', async () => {
		const health = await exports.default.fetch(new Request('http://realtime.test/health'));
		expect(health.status).toBe(200);
		expect(await health.json()).toEqual({ ok: true });

		const missing = await exports.default.fetch(new Request('http://realtime.test/missing'));
		expect(missing.status).toBe(404);
	});

	it('validates WebSocket upgrades, origins, and visitor ids', async () => {
		const noUpgrade = await exports.default.fetch(
			new Request(`http://realtime.test/ws?visitorId=${VISITOR_A}`, {
				headers: { Origin: ALLOWED_ORIGIN }
			})
		);
		expect(noUpgrade.status).toBe(426);

		const forbidden = await exports.default.fetch(
			new Request(`http://realtime.test/ws?visitorId=${VISITOR_A}`, {
				headers: { Upgrade: 'websocket', Origin: 'https://evil.example' }
			})
		);
		expect(forbidden.status).toBe(403);

		const invalidVisitor = await exports.default.fetch(
			new Request('http://realtime.test/ws?visitorId=invalid', {
				headers: { Upgrade: 'websocket', Origin: ALLOWED_ORIGIN }
			})
		);
		expect(invalidVisitor.status).toBe(400);
	});

	it('rejects reset requests without the owner token', async () => {
		const response = await exports.default.fetch(
			new Request('http://realtime.test/reset', { method: 'POST' })
		);
		expect(response.status).toBe(401);
		expect(await response.json()).toEqual({ error: 'Unauthorized' });
	});
});
